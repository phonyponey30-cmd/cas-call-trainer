/* Quiz: five modes built from the brevity, situation and 9-line data. */
(function () {
  const CAS = window.CAS;
  const { h, shuffle, sample, norm, editDistance } = CAS.u;
  const ui = CAS.ui;

  const MODES = [
    { id: 'term2def', label: 'Term → meaning', desc: 'See a code, pick what it means.', brevity: true },
    { id: 'def2term', label: 'Meaning → term', desc: 'See a meaning, pick the code.', brevity: true },
    { id: 'type', label: 'Type the term', desc: 'See a meaning, type the code from memory.', brevity: true },
    { id: 'situation', label: 'Which call?', desc: 'A radio situation: choose the correct transmission.', brevity: false },
    { id: 'nineline', label: '9-line structure', desc: 'What each line holds and what gets read back.', brevity: false },
  ];

  /* ------------------------------------------------------------------ */
  /* Question builders                                                  */
  /* ------------------------------------------------------------------ */
  const termWhy = (t) => `${t.term}: ${t.def}` + (t.ex ? `  e.g. ${t.ex}` : '');

  function distractors(term, key) {
    const same = CAS.brevity.filter((b) => b.cat === term.cat && b.id !== term.id);
    const other = CAS.brevity.filter((b) => b.cat !== term.cat);
    const seen = new Set([term[key]]);
    const out = [];
    for (const b of [...shuffle(same), ...shuffle(other)]) {
      if (seen.has(b[key])) continue;
      seen.add(b[key]); out.push(b);
      if (out.length === 3) break;
    }
    return out;
  }

  function mcFromTerm(term, reverse) {
    const key = reverse ? 'term' : 'def';
    const opts = shuffle([term, ...distractors(term, key)]);
    return {
      kind: 'mc', termId: term.id,
      prompt: reverse
        ? h('span', null, 'Which code or term matches this?', h('em', { class: 'quote' }, term.def))
        : h('span', null, 'What does ', h('strong', { class: 'mono' }, term.term), ' mean?'),
      options: opts.map((o) => o[key]),
      answer: opts.indexOf(term),
      why: termWhy(term),
    };
  }

  // Accept "FENCE IN / FENCE OUT" as "fence in", and "TROOPS IN CONTACT (TIC)" as "tic".
  function acceptedForms(term) {
    const c = (s) => norm(s).replace(/ /g, '');
    const out = new Set([c(term.term)]);
    term.term.split('/').forEach((s) => out.add(c(s)));
    const m = /^(.*?)\s*\((.*?)\)$/.exec(term.term);
    if (m) { out.add(c(m[1])); out.add(c(m[2])); }
    return [...out].filter(Boolean);
  }

  function typeFromTerm(term) {
    return { kind: 'type', termId: term.id, prompt: h('span', null, 'Type the code or term that matches this:', h('em', { class: 'quote' }, term.def)), accepted: acceptedForms(term), display: term.term, why: termWhy(term) };
  }

  function situationQs(n) {
    return sample(CAS.situations, n).map((s) => {
      const opts = s.options.map((text, i) => ({ text, ok: i === s.answer }));
      const shuffled = shuffle(opts);
      return { kind: 'mc', prompt: s.q, options: shuffled.map((o) => o.text), answer: shuffled.findIndex((o) => o.ok), why: s.why };
    });
  }

  function nineLineQs() {
    const nums = CAS.lines.filter((l) => typeof l.n === 'number');
    const qs = [];
    for (const l of nums) {
      const others = shuffle(nums.filter((x) => x !== l)).slice(0, 3);
      const a = shuffle([l, ...others]);
      qs.push({ kind: 'mc', prompt: `What does Line ${l.n} give the aircrew?`, options: a.map((x) => x.short), answer: a.indexOf(l), why: `Line ${l.n} · ${l.name}: ${l.meaning}` });
      const b = shuffle([l, ...others]);
      qs.push({ kind: 'mc', prompt: `Which line is "${l.name}"?`, options: b.map((x) => `Line ${x.n}`), answer: b.indexOf(l), why: `Line ${l.n} is ${l.name}. ${l.short}.` });
    }
    const fixed = [
      { prompt: 'Which lines does the aircrew read back?', options: ['Lines 4, 6, 7 and restrictions', 'Lines 1, 2 and 3', 'Lines 5, 8 and 9', 'Every line'], answer: 0, why: 'Elevation, location and mark are the lines where an error is most dangerous, plus the restrictions.' },
      { prompt: 'What do you brief BEFORE Line 1?', options: ['Game plan', 'Readback', 'Remarks', 'Cleared hot'], answer: 0, why: 'The game plan (control type, method of attack, ordnance) comes first so the aircrew know how the attack will be run.' },
      { prompt: 'Line 4 target elevation is given in…', options: ['Feet MSL', 'Meters AGL', 'Feet AGL', 'Meters MSL'], answer: 0, why: 'Line 4 is always feet above mean sea level.' },
      { prompt: 'Line 2 heading is…', options: ['Magnetic, IP to target', 'True, IP to target', 'Magnetic, target to IP', 'True, target to IP'], answer: 0, why: 'Aircraft navigate in magnetic. The heading runs from the IP/BP to the target.' },
      { prompt: 'Line 8 direction is measured…', options: ['From the target to the friendlies', 'From the friendlies to the target', 'From the IP to the friendlies', 'From the aircraft to the friendlies'], answer: 0, why: 'Line 8 locates the friendlies relative to the target: cardinal direction plus meters.' },
      { prompt: 'Fixed-wing Line 3 distance is in…', options: ['Nautical miles', 'Meters', 'Kilometers', 'Statute miles'], answer: 0, why: 'Fixed-wing use nautical miles from the IP; rotary-wing use meters from the BP.' },
    ];
    fixed.forEach((f) => qs.push({ kind: 'mc', ...f }));
    return qs;
  }

  function buildQuestions(cfg) {
    const missed = CAS.progress.get().quiz.missed;
    const mode = MODES.find((m) => m.id === cfg.mode);
    if (cfg.mode === 'situation') return situationQs(cfg.count);
    if (cfg.mode === 'nineline') return sample(nineLineQs(), cfg.count);
    let pool = CAS.brevity.filter((b) => cfg.cat === 'all' || b.cat === cfg.cat);
    if (cfg.missedOnly && mode.brevity) pool = pool.filter((b) => missed[b.id]);
    return sample(pool, cfg.count).map((t) => (cfg.mode === 'type' ? typeFromTerm(t) : mcFromTerm(t, cfg.mode === 'def2term')));
  }

  /* ------------------------------------------------------------------ */
  /* View                                                               */
  /* ------------------------------------------------------------------ */
  CAS.views.quiz = function quiz() {
    const cfg = { mode: 'term2def', cat: 'all', count: 10, missedOnly: false };
    const body = h('div');
    const page = h('div', { class: 'page narrow' },
      ui.pageHead('Quiz', 'Test what you know', 'Pick a mode. Your misses are remembered so you can drill exactly the terms you struggle with.'), body);

    let keyHandler = null;
    const onKey = (e) => { if (keyHandler) keyHandler(e); };
    document.addEventListener('keydown', onKey);
    CAS.onLeave(() => document.removeEventListener('keydown', onKey));

    setup();
    return page;

    /* ---------- setup ---------- */
    function setup() {
      keyHandler = null;
      const missedCount = Object.keys(CAS.progress.get().quiz.missed).length;
      const modeGroup = h('div', { class: 'mode-grid', role: 'radiogroup', 'aria-label': 'Quiz mode' },
        MODES.map((m) => {
          const id = 'mode-' + m.id;
          return h('label', { class: 'mode' + (cfg.mode === m.id ? ' on' : ''), for: id },
            h('input', { type: 'radio', name: 'mode', id, value: m.id, checked: cfg.mode === m.id, onChange: () => { cfg.mode = m.id; refresh(); } }),
            h('strong', null, m.label), h('span', null, m.desc));
        }));

      const catSel = h('select', { class: 'input', id: 'q-cat', onChange: (e) => { cfg.cat = e.target.value; } },
        h('option', { value: 'all' }, 'All categories'),
        Object.entries(CAS.categories).map(([k, v]) => h('option', { value: k }, v.label)));
      const countSel = h('select', { class: 'input', id: 'q-count', onChange: (e) => { cfg.count = +e.target.value; } },
        [10, 20, 30].map((n) => h('option', { value: n, selected: n === cfg.count }, `${n} questions`)));
      const missedBox = h('input', { type: 'checkbox', id: 'q-missed', disabled: !missedCount, onChange: (e) => { cfg.missedOnly = e.target.checked; } });

      const brevityOnly = h('div', { class: 'field-row' },
        h('div', { class: 'field' }, h('label', { for: 'q-cat' }, 'Category'), catSel),
        h('label', { class: 'toggle' }, missedBox, h('span', null, `Only terms I have missed (${missedCount})`)));

      function refresh() {
        modeGroup.querySelectorAll('.mode').forEach((el) => el.classList.toggle('on', el.querySelector('input').checked));
        brevityOnly.hidden = !MODES.find((m) => m.id === cfg.mode).brevity;
      }

      body.replaceChildren(h('div', { class: 'panel' },
        modeGroup,
        brevityOnly,
        h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('label', { for: 'q-count' }, 'Length'), countSel)),
        h('div', { class: 'actions' },
          h('button', { class: 'btn primary', type: 'button', onClick: start }, 'Start quiz'))));
      refresh();
    }

    function start() {
      const qs = buildQuestions(cfg);
      if (!qs.length) {
        body.prepend(h('p', { class: 'callout bad', role: 'alert' }, 'No questions match those settings. Try a different category or turn off "only terms I have missed".'));
        return;
      }
      run(qs);
    }

    /* ---------- run ---------- */
    function run(qs) {
      let i = 0, score = 0;
      const wrong = [];

      function record(q, ok) {
        CAS.progress.update((p) => {
          p.quiz.answered += 1;
          if (ok) p.quiz.correct += 1;
          if (q.termId) {
            if (ok) delete p.quiz.missed[q.termId];
            else p.quiz.missed[q.termId] = (p.quiz.missed[q.termId] || 0) + 1;
          }
        });
        if (ok) score += 1; else wrong.push(q);
      }

      function next() { i += 1; i < qs.length ? show() : results(); }

      function show() {
        const q = qs[i];
        const feedback = h('div', { class: 'feedback', 'aria-live': 'assertive' });
        const nextBtn = h('button', { class: 'btn primary', type: 'button', hidden: true, onClick: next }, i === qs.length - 1 ? 'See results' : 'Next question →');
        const answered = { done: false };

        const finish = (ok, extra) => {
          answered.done = true;
          record(q, ok);
          feedback.className = 'feedback ' + (ok ? 'good' : 'bad');
          feedback.replaceChildren(
            h('strong', null, ok ? 'Correct.' : 'Not quite.'), ' ',
            extra || '',
            h('p', null, q.why));
          nextBtn.hidden = false;
          nextBtn.focus();
        };

        let interactive;
        if (q.kind === 'mc') {
          const opts = q.options.map((text, idx) =>
            h('button', {
              class: 'opt', type: 'button',
              onClick: () => {
                if (answered.done) return;
                opts.forEach((o, j) => { o.disabled = true; if (j === q.answer) o.classList.add('correct'); });
                if (idx !== q.answer) opts[idx].classList.add('wrong');
                finish(idx === q.answer);
              },
            }, h('span', { class: 'key' }, String.fromCharCode(65 + idx)), h('span', null, text)));
          interactive = h('div', { class: 'opts' }, opts);
          keyHandler = (e) => {
            if (answered.done) { if (e.key === 'Enter') { e.preventDefault(); next(); } return; }
            const n = +e.key;
            if (n >= 1 && n <= opts.length) opts[n - 1].click();
          };
        } else {
          const input = h('input', { class: 'input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Your answer', placeholder: 'Type the term…' });
          const check = () => {
            if (answered.done) return;
            const guess = norm(input.value).replace(/ /g, '');
            if (!guess) return;
            const exact = q.accepted.includes(guess);
            const close = !exact && q.accepted.some((a) => a.length >= 6 && editDistance(a, guess) <= 1);
            input.disabled = true; checkBtn.disabled = true;
            finish(exact || close, close ? `Accepted. Check the spelling: ${q.display}.` : (exact ? '' : `Answer: ${q.display}.`));
          };
          const checkBtn = h('button', { class: 'btn', type: 'button', onClick: check }, 'Check');
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
          interactive = h('div', { class: 'type-row' }, input, checkBtn);
          keyHandler = (e) => { if (answered.done && e.key === 'Enter') { e.preventDefault(); next(); } };
          setTimeout(() => input.focus(), 0);
        }

        body.replaceChildren(h('div', { class: 'panel quiz' },
          h('div', { class: 'quiz-head' },
            h('span', { class: 'mono' }, `Q${i + 1} / ${qs.length}`),
            ui.meter(ui.pct(i, qs.length), `Progress ${i} of ${qs.length}`),
            h('span', { class: 'mono' }, `Score ${score}`)),
          h('p', { class: 'question' }, q.prompt),
          interactive, feedback,
          h('div', { class: 'actions' }, nextBtn)));
      }

      function results() {
        keyHandler = null;
        const pct = ui.pct(score, qs.length);
        const verdict = pct >= 90 ? 'Sharp. Radio-ready.' : pct >= 70 ? 'Solid. A little more polish.' : 'Keep drilling. Repetition builds reflex.';
        body.replaceChildren(h('div', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'Results'),
          h('h2', { class: 'big' }, `${score} / ${qs.length} · ${pct}%`),
          ui.meter(pct, `${pct} percent`),
          h('p', { class: 'lede small' }, verdict),
          wrong.length
            ? h('div', null, h('h3', null, 'Review your misses'),
              h('ul', { class: 'review' }, wrong.map((q) => h('li', null, h('div', { class: 'q' }, q.prompt), h('div', { class: 'a' }, q.why)))))
            : h('p', { class: 'callout good' }, 'Perfect run. No misses to review.'),
          h('div', { class: 'actions' },
            wrong.length ? h('button', { class: 'btn primary', type: 'button', onClick: () => run(shuffle(wrong)) }, `Retry ${wrong.length} missed`) : null,
            h('button', { class: 'btn', type: 'button', onClick: setup }, 'New quiz'))));
      }

      show();
    }
  };
})();
