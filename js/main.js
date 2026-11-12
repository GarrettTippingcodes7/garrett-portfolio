// Garrett Tipping — Portfolio. Small progressive enhancements; every page works without JS.
(function () {
  // Header gets a hairline once the page scrolls.
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Light/dark toggle. The inline script in <head> sets data-theme before paint; this flips and remembers it.
  const root = document.documentElement;
  const themeBtn = document.querySelector('.theme-btn');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (t) => {
    root.dataset.theme = t;
    const label = t === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
    if (themeBtn) { themeBtn.setAttribute('aria-label', label); themeBtn.title = label; }
    if (themeMeta) themeMeta.content = t === 'light' ? '#f3efe4' : '#0c151c';
    // Images with see-through areas have a version flattened onto the light background.
    document.querySelectorAll('source[data-light]').forEach((s) => {
      if (!s.dataset.dark) s.dataset.dark = s.getAttribute('srcset');
      s.setAttribute('srcset', t === 'light' ? s.dataset.light : s.dataset.dark);
    });
  };
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode: theme just won't be remembered */ }
    });
  }

  // Header menu: opens a panel with every page and résumé entry.
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.getElementById('site-menu');
  if (menuBtn && menu) {
    let closeTimer;
    const setMenu = (open, { focusBtn = false } = {}) => {
      clearTimeout(closeTimer);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      } else {
        menu.classList.remove('is-open');
        closeTimer = setTimeout(() => { menu.hidden = true; }, 300);
        if (focusBtn) menuBtn.focus();
      }
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, { focusBtn: true });
    });
    document.addEventListener('click', (e) => {
      if (menuBtn.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) setMenu(false);
    });
    // Links to a spot on the current page (e.g. a résumé entry) close the menu so the jump is visible.
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  }

  // Arriving at a page#section from another page: jump again once fonts have loaded and the layout is final.
  if (location.hash.length > 1 && document.fonts) {
    document.fonts.ready.then(() => {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  // Scroll reveal. Siblings in the same group stagger slightly.
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const i = groups.get(el.parentElement) || 0;
      el.style.setProperty('--delay', Math.min(i, 4) * 0.08 + 's');
      groups.set(el.parentElement, i + 1);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Reading progress bar (case studies).
  const bar = document.querySelector('.progress');
  if (bar) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  // Before/after tabs.
  document.querySelectorAll('.ba').forEach((ba) => {
    const tabs = ba.querySelectorAll('[role="tab"]');
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    }));
  });

  // Lightbox for zoomable screenshots.
  const zoomables = document.querySelectorAll('.zoomable img');
  if (zoomables.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Enlarged image');
    box.innerHTML = '<img alt=""><button type="button" aria-label="Close">×</button>';
    document.body.appendChild(box);
    const big = box.querySelector('img');
    const closeBtn = box.querySelector('button');
    let lastFocus = null;
    const close = () => { box.classList.remove('open'); if (lastFocus) lastFocus.focus(); };
    zoomables.forEach((img) => {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge: ' + (img.alt || 'image'));
      const open = () => { lastFocus = img; big.src = img.currentSrc || img.src; big.alt = img.alt; box.classList.add('open'); closeBtn.focus(); };
      img.addEventListener('click', open);
      img.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    box.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
  }

  // Footer year.
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Testimonial "Read more" toggles.
  document.querySelectorAll('.testimonial .toggle').forEach((btn) => {
    const more = document.getElementById(btn.getAttribute('aria-controls'));
    if (!more) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      more.hidden = open;
      btn.textContent = open ? 'Read the full recommendation' : 'Show less';
    });
  });

  // Contact form: submit to Netlify Forms in place. Without JS it posts normally and lands on thanks.html.
  const form = document.querySelector('form[data-netlify="true"]');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', async (e) => {
      if (!form.checkValidity()) return; // let the browser show its messages
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Sending…';
      status.textContent = '';
      status.className = 'form-status';
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = 'Thanks! Your message is on its way. I’ll get back to you soon.';
        status.classList.add('is-success');
      } catch (err) {
        status.textContent = 'Something went wrong sending that. Please email me directly at garretttipping7@gmail.com.';
        status.classList.add('is-error');
      } finally {
        button.disabled = false;
        button.textContent = 'Send message';
      }
    });
  }
})();
