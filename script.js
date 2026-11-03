(function () {
  var root = document.documentElement;

  // --- логотип: разбиваем на буквы для анимации появления ---
  var word = document.querySelector('.logo-word');
  'Horoshi'.split('').forEach(function (c, i) {
    var s = document.createElement('span');
    s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', i);
    word.appendChild(s);
  });

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
  var items = document.querySelectorAll('.reveal, .lines');
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

  // --- подсветка пункта меню по текущей секции ---
  var links = document.querySelectorAll('.nav-links a');
  var sections = ['top', 'cases', 'about', 'contacts'].map(function (id) { return document.getElementById(id); });
  function onScroll() {
    var y = window.scrollY + window.innerHeight * 0.4, cur = 0;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- окно просмотра ролика ---
  var modal = document.getElementById('modal');
  var media = document.getElementById('modal-media');
  var title = document.getElementById('modal-title');
  var lastFocus;

  function openCase(card) {
    lastFocus = card;
    title.textContent = card.dataset.title || '';
    media.innerHTML = '';
    if (card.dataset.src) {
      var v = document.createElement('video');
      v.src = card.dataset.src; v.controls = true; v.autoplay = true; v.playsInline = true;
      media.appendChild(v);
    } else {
      media.innerHTML = '<p>Ролик скоро появится</p>';
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close').focus();
  }
  function closeModal() {
    modal.hidden = true; media.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.case').forEach(function (c) {
    c.addEventListener('click', function () { openCase(c); });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(c); }
    });
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
