/* ============================================================
   БАНДА ХОРОШИХ — данные сайта. Всё, что нужно менять, лежит здесь.
   ============================================================ */

// Состав. video — видеовизитка (media/video/имя.mp4). Нет файла — оставьте ''.
// facts — любые строки анкеты: возраст, рост, навыки, языки и т.п.
var CAST = [
  { id: 'boris',    name: 'Борис',     role: 'Шериф',              video: 'media/video/boris.mp4',
    text: 'Наведёт порядок в любом кадре. Герои, лидеры и те самые хорошие парни.',
    facts: { 'Амплуа': 'герой, лидер', 'Жанры': 'драма, приключения' } },
  { id: 'darya',    name: 'Дарья',     role: 'Королева ранчо',     video: 'media/video/darya.mp4',
    text: 'Одним взглядом останавливает табун и сердца зрителей.',
    facts: { 'Амплуа': 'героиня', 'Жанры': 'драма, мелодрама, комедия' } },
  { id: 'tim',      name: 'Тим',       role: 'Хозяин салуна',      video: 'media/video/tim.mp4',
    text: 'Знает цену каждой секунде экранного времени. Аристократы, антагонисты и роковые мужчины.',
    facts: { 'Амплуа': 'антагонист, джентльмен', 'Жанры': 'триллер, драма' } },
  { id: 'ruslan',   name: 'Руслан',    role: 'Одинокий странник',  video: 'media/video/ruslan.mp4',
    text: 'Молчит красиво. Загадочные незнакомцы и крупные планы — его территория.',
    facts: { 'Амплуа': 'загадочный герой', 'Жанры': 'драма, вестерн' } },
  { id: 'vadim',    name: 'Вадим',     role: 'Бродячий музыкант',  video: 'media/video/vadim.mp4',
    text: 'Душа компании у любого костра. Лучший друг героя и тот, кто разрядит сцену.',
    facts: { 'Амплуа': 'друг героя, комик', 'Жанры': 'комедия, лирика' } },
  { id: 'nikita',   name: 'Никита',    role: 'Золотоискатель',     video: 'media/video/nikita.mp4',
    text: 'Найдёт золото в любом сценарии. Умники, изобретатели и обаятельные чудаки.',
    facts: { 'Амплуа': 'умник, чудак', 'Жанры': 'комедия, приключения' } },
  { id: 'predatel', name: 'Предатель', role: 'Двойной агент',      video: 'media/video/predatel.mp4',
    text: 'Улыбается так, что не знаешь, чего ждать. Интриганы и харизматичные негодяи.',
    facts: { 'Амплуа': 'злодей, интриган', 'Жанры': 'детектив, комедия' } },
  { id: 'maksim',   name: 'Максим',    role: 'Малыш-гонец',        video: 'media/video/maksim.mp4',
    text: 'Самый юный в банде. Доставит реплику быстрее почтового дилижанса.',
    facts: { 'Амплуа': 'юный герой', 'Жанры': 'семейное кино, приключения' } }
];

// Ролики в разделе «Видео». Чтобы добавить свой: положите файл в media/video/
// и допишите строку { title, note, src, poster }. Без src плитка покажет «Скоро».
var REELS = [
  { title: 'Банда входит в город', note: 'Групповая визитка', src: 'media/video/walk.mp4', poster: 'media/walk.webp' },
  { title: 'Вечер у костра',       note: 'Групповая визитка', src: 'media/video/campfire.mp4', poster: 'media/campfire.webp' },
  { title: 'Шоурил',               note: 'Скоро премьера',    src: '', poster: 'media/saloon.webp' }
];

// Видео на первом экране ('' — останется картинка).
var HERO_VIDEO = 'media/video/hero.mp4';

/* ============================================================ */

(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  $('year').textContent = new Date().getFullYear();

  // --- меню темнеет после первого экрана ---
  var nav = $('nav');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- видео первого экрана ---
  var hv = $('hero-video');
  if (HERO_VIDEO && !reduce) {
    hv.src = HERO_VIDEO;
    hv.addEventListener('playing', function () { hv.classList.add('on'); }, { once: true });
    play(hv);
  }

  // --- плакаты «Разыскивается» ---
  var posters = $('posters');
  var tilts = [-1.6, 1.2, -0.7, 1.8, 1.1, -1.4, 0.8, -1.9];
  CAST.forEach(function (c, i) {
    var b = el('button', 'poster reveal');
    b.type = 'button';
    b.style.setProperty('--tilt', tilts[i % tilts.length] + 'deg');
    b.setAttribute('aria-label', c.name + ' — ' + c.role + '. Открыть визитку');

    b.appendChild(el('span', 'nail'));
    b.appendChild(el('span', 'p-wanted', 'Wanted'));
    b.appendChild(el('span', 'p-sub', 'разыскивается для съёмок'));

    var frame = el('span', 'p-frame');
    var img = el('img');
    img.src = 'media/cast/' + c.id + '.webp';
    img.alt = c.name + ' в образе: ' + c.role.toLowerCase();
    img.loading = 'lazy'; img.width = 720; img.height = 1273;
    frame.appendChild(img);
    var v = null;
    if (c.video) {
      v = el('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.dataset.src = c.video;
      frame.appendChild(v);
      frame.appendChild(el('span', 'p-play', '▶ визитка'));
    }
    b.appendChild(frame);

    b.appendChild(el('span', 'p-name', c.name));
    b.appendChild(el('span', 'p-role', '«' + c.role + '»'));
    var bounty = el('span', 'p-bounty');
    bounty.appendChild(el('small', '', 'награда'));
    bounty.appendChild(el('b', '', '$1 000 000'));
    b.appendChild(bounty);

    if (v && !reduce) {
      var start = function () {
        if (!v.src) v.src = v.dataset.src;
        b.classList.add('live'); play(v);
      };
      var stop = function () { b.classList.remove('live'); v.pause(); };
      b.addEventListener('pointerenter', start);
      b.addEventListener('pointerleave', stop);
      b.addEventListener('focus', start);
      b.addEventListener('blur', stop);
    }
    b.addEventListener('click', function () { openCard(c); });
    posters.appendChild(b);
  });

  // --- окно визитки ---
  var modal = $('modal'), mv = $('m-video'), mi = $('m-img');
  function openCard(c) {
    $('m-name').textContent = c.name;
    $('m-role').textContent = '«' + c.role + '»';
    $('m-text').textContent = c.text;
    mi.src = 'media/cast/' + c.id + '.webp';
    mi.alt = c.name;
    var dl = $('m-facts');
    dl.textContent = '';
    Object.keys(c.facts || {}).forEach(function (k) {
      dl.appendChild(el('dt', '', k));
      dl.appendChild(el('dd', '', c.facts[k]));
    });
    if (c.video) {
      mv.src = c.video; mv.poster = mi.src; mv.hidden = false; mi.hidden = true;
      mv.muted = false; play(mv);
    } else {
      mv.removeAttribute('src'); mv.hidden = true; mi.hidden = false;
    }
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
  }
  function closeCard() {
    mv.pause();
    if (modal.close) modal.close(); else modal.removeAttribute('open');
  }
  $('m-close').addEventListener('click', closeCard);
  $('m-hire').addEventListener('click', closeCard);
  modal.addEventListener('close', function () { mv.pause(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeCard(); });

  // --- ролики ---
  var reels = $('reels');
  REELS.forEach(function (r) {
    var card = el('figure', 'reel-card reveal');
    var screen = el('div', 'screen');
    if (r.src) {
      var v = el('video');
      v.controls = true; v.preload = 'none'; v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.poster = r.poster || ''; v.src = r.src;
      screen.appendChild(v);
    } else {
      var img = el('img');
      img.src = r.poster; img.alt = ''; img.loading = 'lazy';
      screen.appendChild(img);
      screen.appendChild(el('span', 'soon', 'Скоро'));
      card.classList.add('is-soon');
    }
    card.appendChild(screen);
    var cap = el('figcaption');
    cap.appendChild(el('b', '', r.title));
    cap.appendChild(el('span', '', r.note));
    card.appendChild(cap);
    reels.appendChild(card);
  });

  // --- появление блоков ---
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (n, i) { n.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(n); });
  } else {
    items.forEach(function (n) { n.classList.add('in'); });
  }
})();
