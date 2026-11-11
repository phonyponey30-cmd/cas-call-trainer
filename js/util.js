/* Small shared helpers: DOM builder, safe storage, radio-style speech. */
(function () {
  const CAS = (window.CAS = window.CAS || {});
  const u = (CAS.u = {});

  /* ---------- DOM ---------- */
  // h('div', {class:'x', onClick: fn}, 'text', childNode, [more, kids])
  u.h = function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  /* ---------- Storage (never throws; works in private windows) ---------- */
  u.store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem('cas.' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem('cas.' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    clear() {
      try {
        Object.keys(window.localStorage).filter((k) => k.startsWith('cas.')).forEach((k) => window.localStorage.removeItem(k));
      } catch (e) { /* ignore */ }
    },
  };

  /* ---------- Random ---------- */
  u.shuffle = function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  u.sample = (arr, n) => u.shuffle(arr).slice(0, n);

  /* ---------- Text matching ---------- */
  u.norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

  u.editDistance = function editDistance(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  };

  /* ---------- Radio-style speech ---------- */
  const DIGIT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'];
  const PHON = {
    A: 'alpha', B: 'bravo', C: 'charlie', D: 'delta', E: 'echo', F: 'foxtrot', G: 'golf', H: 'hotel', I: 'india',
    J: 'juliet', K: 'kilo', L: 'lima', M: 'mike', N: 'november', O: 'oscar', P: 'papa', Q: 'quebec', R: 'romeo',
    S: 'sierra', T: 'tango', U: 'uniform', V: 'victor', W: 'whiskey', X: 'x-ray', Y: 'yankee', Z: 'zulu',
  };
  u.DIGIT_WORD = DIGIT_WORD;
  u.PHON = PHON;

  // "1240" -> "one two four zero"; "6.6" -> "six point six"
  u.spokenDigits = (s) => String(s).split('').map((c) => (/\d/.test(c) ? DIGIT_WORD[+c] : c === '.' ? 'point' : c)).join(' ');

  // 900 -> "niner hundred" style is avoided; JTACs say "nine hundred" for round numbers.
  u.spokenNumber = function spokenNumber(n) {
    if (!Number.isInteger(n)) return u.spokenDigits(n);
    if (n >= 100 && n % 100 === 0) {
      const th = Math.floor(n / 1000), hu = (n % 1000) / 100;
      const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
      return [th ? `${words[th]} thousand` : '', hu ? `${words[hu]} hundred` : ''].filter(Boolean).join(' ');
    }
    return u.spokenDigits(n);
  };

  // "38TMN45213367" -> "three eight tango, mike november, four five two one, three three six seven"
  u.spokenGrid = function spokenGrid(grid) {
    const m = /^(\d{1,2})([A-Z])([A-Z]{2})(\d+)$/.exec(grid);
    if (!m) return grid;
    const half = m[4].length / 2;
    const letters = (s) => s.split('').map((c) => PHON[c]).join(' ');
    return [
      `${u.spokenDigits(m[1])} ${letters(m[2])}`,
      letters(m[3]),
      u.spokenDigits(m[4].slice(0, half)),
      u.spokenDigits(m[4].slice(half)),
    ].join(', ');
  };

  // "38TMN45213367" -> "38T MN 4521 3367"
  u.prettyGrid = function prettyGrid(grid) {
    const m = /^(\d{1,2}[A-Z])([A-Z]{2})(\d+)$/.exec(grid);
    if (!m) return grid;
    const half = m[3].length / 2;
    return `${m[1]} ${m[2]} ${m[3].slice(0, half)} ${m[3].slice(half)}`;
  };

  u.pad3 = (n) => String(Math.round(n)).padStart(3, '0');

  /* ---------- Text to speech ---------- */
  u.canSpeak = () => 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  u.speak = function speak(text, opts = {}) {
    if (!u.canSpeak()) return false;
    window.speechSynthesis.cancel();
    const ut = new window.SpeechSynthesisUtterance(text);
    ut.rate = opts.rate || 0.88;
    ut.lang = 'en-US';
    if (opts.onend) ut.onend = opts.onend;
    window.speechSynthesis.speak(ut);
    return true;
  };
  u.stopSpeaking = () => { if (u.canSpeak()) window.speechSynthesis.cancel(); };
})();
