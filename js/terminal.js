// 404 terminal: types out the error for the path the visitor tried, then accepts a few commands.
// Without JS the page still shows every line and the folder links.
(function () {
  const term = document.getElementById('term');
  if (!term) return;
  const body = document.getElementById('term-body');
  const history = document.getElementById('term-history');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-cmd');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Show the path that was actually requested.
  let path = decodeURIComponent(location.pathname || '/');
  if (/\/404(\.html)?$/.test(path)) path = '/this-page';
  if (path.length > 48) path = path.slice(0, 45) + '...';
  document.querySelectorAll('[data-path]').forEach((el) => { el.textContent = path; });

  const PAGES = {
    home: '/index.html', '~': '/index.html', about: '/about.html', 'other-work': '/other-work.html',
    contact: '/contact.html', 'field-service': '/field-service.html', 'studio-six': '/studio-six.html',
    'shepherd-ai': '/shepherd-ai.html', 'building-this-site': '/building-this-site.html',
  };
  const NAMES = Object.keys(PAGES).filter((k) => k !== '~');

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const print = (html, cls = 't-out') => {
    const p = document.createElement('p');
    p.className = cls;
    p.innerHTML = html;
    history.appendChild(p);
  };
  const echo = (cmd) => print('<span class="t-prompt">garrett@portfolio:~$</span> ' + esc(cmd), '');
  const go = (name) => {
    print('Opening ' + esc(name) + '/ ...');
    setTimeout(() => { location.href = PAGES[name]; }, reduced ? 0 : 450);
  };
  const ls = () => print(NAMES.map((n) => `<a href="${PAGES[n]}">${n}/</a>`).join('   '));

  const COMMANDS = {
    help: () => {
      const rows = [['ls', 'list pages'], ['cd &lt;page&gt;', 'open a page (try: cd about)'], ['whoami', 'who built this'],
        ['contact', 'how to reach me'], ['resume', 'download my résumé'], ['clear', 'clear the screen'], ['exit', 'go home']];
      print('Commands:', 't-out');
      const grid = document.createElement('div');
      grid.className = 't-help';
      grid.innerHTML = rows.map(([c, d]) => `<code>${c}</code><span>${d}</span>`).join('');
      history.appendChild(grid);
      print('Tip: Tab completes page names, ↑ recalls commands.');
    },
    ls,
    whoami: () => print('Garrett Tipping, UX/UI designer in Orlando. Former utility tech; I make complicated things feel simple.'),
    contact: () => print('email  <a href="mailto:garretttipping7@gmail.com">garretttipping7@gmail.com</a>\nphone  <a href="tel:+14074909996">407-490-9996</a>\nform   <a href="/contact.html">/contact</a>'),
    resume: () => { print('Downloading résumé ...'); location.href = '/assets/Garrett-Tipping-Resume.pdf'; },
    clear: () => { history.innerHTML = ''; body.querySelectorAll('.t-line, .term-ascii').forEach((el) => { el.hidden = true; }); },
    exit: () => go('home'),
    home: () => go('home'),
    pwd: () => print(esc(path) + '   (not found, sorry)'),
    sudo: () => print('Nice try. Permission denied, but I admire the confidence.', 't-out t-err'),
  };

  function run(raw) {
    const cmd = raw.trim();
    echo(cmd);
    if (!cmd) return;
    const [name, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(' ').replace(/^~?\/?/, '').replace(/\/$/, '').replace(/\.html$/, '').toLowerCase();
    if (name === 'cd' || name === 'open') {
      if (!arg || arg === '~') return go('home');
      if (PAGES[arg]) return go(arg);
      return print(`bash: cd: ${esc(arg)}: No such file or directory. Try <span class="t-prompt">ls</span>.`, 't-out t-err');
    }
    if (COMMANDS[name.toLowerCase()]) return COMMANDS[name.toLowerCase()]();
    if (PAGES[name.toLowerCase()]) return go(name.toLowerCase());
    print(`command not found: ${esc(name)}. Type <span class="t-prompt">help</span>.`, 't-out t-err');
  }

  // Input handling: Enter runs, Tab completes, Up/Down walk history.
  const past = [];
  let idx = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    if (v.trim()) past.push(v);
    idx = past.length;
    input.value = '';
    run(v);
    input.scrollIntoView({ block: 'nearest' });
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && idx > 0) { idx--; input.value = past[idx]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { idx = Math.min(past.length, idx + 1); input.value = past[idx] || ''; e.preventDefault(); }
    else if (e.key === 'Tab') {
      const m = input.value.match(/^(\S+\s+)?(\S*)$/);
      if (!m) return;
      const hits = NAMES.filter((n) => n.startsWith(m[2].toLowerCase()));
      if (hits.length === 1) { input.value = (m[1] || '') + hits[0]; e.preventDefault(); }
      else if (hits.length > 1 && m[2]) { e.preventDefault(); echo(input.value); print(hits.join('   ')); }
    }
  });
  // Clicking empty terminal space focuses the prompt (but not when selecting text or clicking links).
  body.addEventListener('click', (e) => {
    if (e.target.closest('a') || String(window.getSelection())) return;
    input.focus({ preventScroll: true });
  });

  // Opening sequence: type each command, then reveal its output.
  const lines = [...body.querySelectorAll('.t-line')];
  if (reduced) { input.focus({ preventScroll: true }); return; }
  term.classList.add('is-typing');
  const caret = document.createElement('span');
  caret.className = 't-caret';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function typeInto(el) {
    const typed = el.querySelector('.t-typed');
    const full = typed.innerHTML;
    const text = typed.textContent;
    typed.textContent = '';
    typed.after(caret);
    for (let i = 1; i <= text.length; i++) {
      typed.textContent = text.slice(0, i);
      await wait(38 + Math.random() * 45);
    }
    typed.innerHTML = full; // restore inner markup (highlighted path)
    await wait(260);
  }

  (async () => {
    await wait(500);
    for (const line of lines) {
      line.classList.add('is-shown');
      if (line.hasAttribute('data-cmd')) await typeInto(line);
      else await wait(120);
    }
    caret.remove();
    term.classList.remove('is-typing');
    input.focus({ preventScroll: true });
  })();
})();
