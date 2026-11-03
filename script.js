(function () {
  var root = document.documentElement;

  // --- переключатель темы ---
  var toggle = document.getElementById('theme-toggle');
  function syncToggle() {
    toggle.setAttribute('aria-checked', root.dataset.theme === 'dark' ? 'true' : 'false');
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = root.dataset.theme === 'dark' ? '#0a0a0d' : '#ffffff';
  }
  syncToggle();
  toggle.addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('horoshi-theme', root.dataset.theme); } catch (e) {}
    syncToggle();
  });

  // --- появление блоков при прокрутке ---
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // --- стикеры: рывковое появление, когда попадают в экран ---
  var stickers = document.querySelectorAll('.sticker');
  stickers.forEach(function (s) { s.style.setProperty('--delay', (Math.random() * 0.5 + (s.closest('.hero') ? 1.1 : 0)).toFixed(2) + 's'); });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); so.unobserve(e.target); } });
    }, { threshold: 0.2 });
    stickers.forEach(function (s) { so.observe(s); });
  } else { stickers.forEach(function (s) { s.classList.add('in'); }); }

  // --- предметы: по одному выскакивают в случайном месте-слоте ---
  (function () {
    var pops = Array.prototype.slice.call(document.querySelectorAll('.obj.pop'));
    if (!pops.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var page2 = document.querySelector('.page2'), last = -1, visible = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .25 }).observe(page2);
    else visible = true;
    function next() {
      if (visible && !document.hidden && modal.hidden) {
        var i; do { i = Math.floor(Math.random() * pops.length); } while (i === last && pops.length > 1);
        last = i; var el = pops[i];
        el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      }
      setTimeout(next, 2600 + Math.random() * 1800);
    }
    setTimeout(next, 1800);
  })();

  // --- меню: два экрана. Главная / всё остальное, а клик по пункту подсвечивает его ---
  var links = document.querySelectorAll('.nav-links a');
  var manual = null;
  function setActive(i) { links.forEach(function (a, k) { a.classList.toggle('active', k === i); }); }
  function onScroll() {
    var y = window.scrollY, h = window.innerHeight;
    if (y < h * 0.5) { manual = null; setActive(0); }
    else setActive(manual == null ? 1 : manual);
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function () { manual = i === 0 ? null : i; setActive(i); });
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- окно папки: ролик, описание и переключатель кейсов внутри папки ---
  var modal = document.getElementById('modal');
  var media = document.getElementById('modal-media');
  var title = document.getElementById('modal-title');
  var folderLbl = document.getElementById('modal-folder');
  var metaEl = document.getElementById('modal-meta');
  var descEl = document.getElementById('modal-desc');
  var tagsEl = document.getElementById('modal-tags');
  var thumbsEl = document.getElementById('modal-thumbs');
  var lastFocus, current = [];

  function showCase(i) {
    var it = current[i];
    title.textContent = it.title;
    metaEl.textContent = it.meta;
    descEl.textContent = it.desc;
    tagsEl.innerHTML = it.tags;
    media.innerHTML = '';
    media.classList.toggle('v', !!it.v);
    if (it.src) {
      var v = document.createElement('video');
      v.src = it.src; v.poster = it.poster; v.controls = true; v.autoplay = true; v.playsInline = true;
      media.appendChild(v);
    } else { media.innerHTML = '<p>Ролик скоро появится</p>'; }
    Array.prototype.forEach.call(thumbsEl.children, function (li, k) {
      li.firstChild.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
  }
  function openFolder(f) {
    lastFocus = f;
    current = Array.prototype.map.call(f.querySelectorAll('.f-items > li'), function (li) {
      return { src: li.dataset.src, poster: li.dataset.poster, title: li.dataset.title, meta: li.dataset.meta,
               desc: li.querySelector('.d').textContent, tags: li.querySelector('.tg').innerHTML, v: li.dataset.ar === 'v' };
    });
    folderLbl.textContent = f.dataset.folder || '';
    thumbsEl.innerHTML = '';
    current.forEach(function (it, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.innerHTML = '<img src="' + it.poster + '" alt=""><span></span>';
      b.querySelector('span').textContent = it.title;
      b.addEventListener('click', function () { showCase(i); });
      li.appendChild(b); thumbsEl.appendChild(li);
    });
    showCase(0);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close').focus();
  }
  function closeModal() {
    modal.hidden = true; media.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.folder').forEach(function (f) {
    f.addEventListener('click', function () { openFolder(f); });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFolder(f); }
    });
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
