// Вечерний бот: Telegram → расшифровка голосового (ElevenLabs) → Notion «Дневник дня».
// Cloudflare Worker, один файл, без зависимостей.
//
// Секреты (Settings → Variables and Secrets):
//   TELEGRAM_TOKEN  — токен бота от @BotFather
//   ELEVENLABS_KEY  — ключ API ElevenLabs
//   NOTION_TOKEN    — секрет интеграции Notion
//   WEBHOOK_SECRET  — любая придуманная строка из латинских букв и цифр
//   OWNER_CHAT_ID   — твой ID в Телеграме (бот пришлёт его в ответ на /start)

const NOTION_DATABASE_ID = "41bb616b66b681cc8863eb2e3b2f52f3"; // «Дневник дня»
const NOTION_VERSION = "2022-06-28";
const TZ_OFFSET_HOURS = 3; // Москва
const EVENING_PROMPT =
  "Привет! Как прошёл день? 🎙\n\n" +
  "Запиши голосовое как удобно:\n" +
  "• что было классного\n" +
  "• что смешного, какие истории\n" +
  "• сколько и на что потратил\n" +
  "• какие дела появились на завтра и дальше";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Одноразовая настройка: открыть в браузере /setup?key=<WEBHOOK_SECRET>
    if (url.pathname === "/setup") {
      if (url.searchParams.get("key") !== env.WEBHOOK_SECRET) {
        return new Response("Неверный ключ", { status: 403 });
      }
      const result = await telegram(env, "setWebhook", {
        url: `${url.origin}/webhook`,
        secret_token: env.WEBHOOK_SECRET,
        allowed_updates: ["message"],
      });
      return new Response(
        result.ok
          ? "Готово: бот подключён. Напиши ему /start в Телеграме."
          : `Ошибка Телеграма: ${result.description}`,
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }
      const update = await request.json();
      // Отвечаем Телеграму сразу, работу доделываем в фоне — иначе он повторит запрос.
      ctx.waitUntil(handleUpdate(update, env));
      return new Response("ok");
    }

    return new Response("Вечерний бот работает.", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },

  // Cron Trigger: вечернее сообщение
  async scheduled(event, env, ctx) {
    if (!env.OWNER_CHAT_ID) return;
    ctx.waitUntil(send(env, env.OWNER_CHAT_ID, EVENING_PROMPT));
  },
};

async function handleUpdate(update, env) {
  const msg = update.message;
  if (!msg || !msg.chat) return;
  const chatId = String(msg.chat.id);

  if (!env.OWNER_CHAT_ID) {
    await send(env, chatId, `Твой ID: ${chatId}\nДобавь его в Cloudflare как секрет OWNER_CHAT_ID — и бот начнёт принимать сообщения.`);
    return;
  }
  if (chatId !== String(env.OWNER_CHAT_ID)) return; // чужим не отвечаем

  if (msg.text && msg.text.startsWith("/start")) {
    await send(env, chatId, "Я на связи. Каждый вечер спрошу, как прошёл день. Голосовое или текст можно прислать в любой момент — запишу в «Дневник дня».");
    return;
  }

  try {
    const media = msg.voice || msg.audio || msg.video_note;
    let text;
    if (media) {
      await telegram(env, "sendChatAction", { chat_id: chatId, action: "typing" });
      text = await transcribe(env, media.file_id);
    } else if (msg.text) {
      text = msg.text;
    } else {
      await send(env, chatId, "Пришли голосовое или текст — фото и файлы я пока не разбираю.");
      return;
    }
    if (!text || !text.trim()) {
      await send(env, chatId, "Не расслышал ни слова 🙈 Запиши ещё раз?");
      return;
    }

    const pageUrl = await saveToNotion(env, text.trim(), media ? "🎙" : "✍️");
    const echo = text.length > 3500 ? text.slice(0, 3500) + "…" : text;
    await send(env, chatId, `Записал ✅\n\n${echo}\n\n${pageUrl}`);
  } catch (err) {
    await send(env, chatId, `Не получилось записать 😕\n${String(err.message || err).slice(0, 500)}`);
  }
}

// ---------- Telegram ----------

async function telegram(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function send(env, chatId, text) {
  return telegram(env, "sendMessage", { chat_id: chatId, text, disable_web_page_preview: true });
}

// ---------- Расшифровка ----------

async function transcribe(env, fileId) {
  const info = await telegram(env, "getFile", { file_id: fileId });
  if (!info.ok) throw new Error(`Телеграм не отдал файл: ${info.description} (лимит — 20 МБ)`);
  const fileRes = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_TOKEN}/${info.result.file_path}`);
  if (!fileRes.ok) throw new Error(`Не скачался файл из Телеграма (${fileRes.status})`);
  const audio = await fileRes.blob();

  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", audio, info.result.file_path.split("/").pop() || "voice.ogg");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_KEY },
    body: form,
  });
  if (!res.ok) throw new Error(`ElevenLabs: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).text;
}

// ---------- Notion ----------

async function notion(env, path, method, body) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${env.NOTION_TOKEN}`,
      "notion-version": NOTION_VERSION,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Notion: ${res.status} ${data.message || ""}`);
  return data;
}

function localNow() {
  return new Date(Date.now() + TZ_OFFSET_HOURS * 3600 * 1000);
}

function dayTitle(d) {
  const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const days = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}, ${days[d.getUTCDay()]}`;
}

function paragraphs(text) {
  // Notion принимает не больше 2000 символов в одном фрагменте текста.
  const blocks = [];
  for (let i = 0; i < text.length; i += 1900) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: text.slice(i, i + 1900) } }] },
    });
  }
  return blocks;
}

// Дописывает заметку в страницу сегодняшнего дня; если её нет — создаёт.
async function saveToNotion(env, text, icon) {
  const now = localNow();
  // Записи до 4 утра относятся ко вчерашнему дню.
  const day = new Date(now.getTime() - 4 * 3600 * 1000);
  const date = day.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 16);
  const blocks = paragraphs(`${icon} ${time} — ${text}`);

  const found = await notion(env, `databases/${NOTION_DATABASE_ID}/query`, "POST", {
    filter: { property: "Дата", date: { equals: date } },
    page_size: 1,
  });

  if (found.results.length) {
    const page = found.results[0];
    await notion(env, `blocks/${page.id}/children`, "PATCH", { children: blocks });
    return page.url;
  }

  const page = await notion(env, "pages", "POST", {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      "День": { title: [{ text: { content: dayTitle(day) } }] },
      "Дата": { date: { start: date } },
    },
    children: [
      { object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: "Сырые заметки из Телеграма" } }] } },
      ...blocks,
    ],
  });
  return page.url;
}
