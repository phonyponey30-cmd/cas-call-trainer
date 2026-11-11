/* App shell: hash router, theme toggle, persisted progress. */
(function () {
  const CAS = (window.CAS = window.CAS || {});
  const { h, store } = CAS.u;

  CAS.views = {};

  /* ---------- Progress (localStorage, tolerant of missing keys) ---------- */
  const blank = () => ({
    quiz: { answered: 0, correct: 0, missed: {} },
    drills: {},
    sim: { runs: 0, best: 0 },
    cards: { known: [] },
    study: { seen: [] },
  });
  CAS.progress = {
    get() {
      const saved = store.get('progress', null);
      const b = blank();
      return saved ? { ...b, ...saved, quiz: { ...b.quiz, ...saved.quiz }, sim: { ...b.sim, ...saved.sim }, cards: { ...b.cards, ...saved.cards }, study: { ...b.study, ...saved.study } } : b;
    },
    update(fn) {
      const p = CAS.progress.get();
      fn(p);
      store.set('progress', p);
      return p;
    },
    reset() { store.set('progress', blank()); },
  };

  /* ---------- View lifecycle ---------- */
  let cleanups = [];
  // Register a function to run when the user leaves the current view (remove key handlers, stop speech…).
  CAS.onLeave = (fn) => cleanups.push(fn);

  const main = () => document.getElementById('view');

  function render() {
    cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
    cleanups = [];
    CAS.u.stopSpeaking();

    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const name = parts[0] || 'home';
    const view = CAS.views[name] || CAS.views.home;
    const el = main();

    el.replaceChildren(view(parts.slice(1)));
    window.scrollTo(0, 0);

    document.querySelectorAll('#nav a').forEach((a) => {
      if (a.dataset.route === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = (name === 'home' ? '' : name[0].toUpperCase() + name.slice(1) + ' · ') + 'CAS Call Trainer';
    el.focus({ preventScroll: true });
  }

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  CAS.start = function start() {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      store.set('theme', next);
    });
    window.addEventListener('hashchange', render);
    render();
  };

  /* Navigate programmatically (keeps views decoupled from URL structure). */
  CAS.go = (path) => { location.hash = '#/' + path; };
  CAS.refresh = render; // re-render the current route (e.g. "try again" on the same URL)
})();
