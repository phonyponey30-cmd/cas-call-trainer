/* Radio sim: play the JTAC through a full engagement, one transmission at a time. */
(function () {
  const CAS = window.CAS;
  const { h, shuffle } = CAS.u;
  const ui = CAS.ui;

  CAS.views.sim = function sim() {
    const data = CAS.sim;
    const total = data.steps.length;
    const body = h('div');
    const page = h('div', { class: 'page narrow' }, ui.pageHead('Radio sim', data.title, data.brief), body);

    let keyHandler = null;
    const onKey = (e) => { if (keyHandler) keyHandler(e); };
    document.addEventListener('keydown', onKey);
    CAS.onLeave(() => document.removeEventListener('keydown', onKey));

    intro();
    return page;

    function intro() {
      keyHandler = null;
      const best = CAS.progress.get().sim;
      body.replaceChildren(h('div', { class: 'panel' },
        h('p', { class: 'eyebrow' }, 'How it works'),
        h('ul', { class: 'checks' },
          h('li', null, `${total} moments, from check-in to release. At each one you hear the net, then choose your next transmission.`),
          h('li', null, 'Wrong answers are explained. The best answers use correct callsign order, brevity and a single clear instruction.'),
          h('li', null, 'Use the 🔊 button to hear each transmission read aloud, or 1–4 to answer.')),
        best.runs ? h('p', { class: 'muted' }, `Runs: ${best.runs} · Best: ${best.best}/${total}`) : null,
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', onClick: () => run() }, 'Key the mic'))));
    }

    function run() {
      let i = 0, score = 0;
      const log = [];
      const misses = [];

      function show() {
        const step = data.steps[i];
        const options = shuffle(step.options);
        const feedback = h('div', { class: 'feedback', 'aria-live': 'assertive' });
        const nextBtn = h('button', { class: 'btn primary', type: 'button', hidden: true, onClick: advance }, i === total - 1 ? 'See debrief' : 'Next →');
        let done = false;

        const buttons = options.map((o, idx) =>
          h('button', {
            class: 'opt', type: 'button',
            onClick: () => {
              if (done) return;
              done = true;
              const right = options.find((x) => x.correct);
              buttons.forEach((b, j) => { b.disabled = true; if (options[j].correct) b.classList.add('correct'); });
              if (!o.correct) buttons[idx].classList.add('wrong');
              if (o.correct) score += 1; else misses.push({ n: i + 1, step, picked: o, right });
              log.push(...step.heard, ['Axeman 21', right.text]);
              feedback.className = 'feedback ' + (o.correct ? 'good' : 'bad');
              feedback.replaceChildren(
                h('strong', null, o.correct ? 'Good call.' : 'Not the best call.'), ' ', o.why,
                o.correct ? null : h('p', null, h('strong', null, 'Best: '), right.text, ' ', right.why));
              nextBtn.hidden = false;
              nextBtn.focus();
            },
          }, h('span', { class: 'key' }, String(idx + 1)), h('span', null, o.text)));

        keyHandler = (e) => {
          if (done) { if (e.key === 'Enter') { e.preventDefault(); advance(); } return; }
          const n = +e.key;
          if (n >= 1 && n <= buttons.length) buttons[n - 1].click();
        };

        body.replaceChildren(
          h('div', { class: 'quiz-head' },
            h('span', { class: 'mono' }, `Moment ${i + 1} / ${total}`),
            ui.meter(ui.pct(i, total), `Progress ${i} of ${total}`),
            h('span', { class: 'mono' }, `${score} good`)),
          log.length ? h('details', { class: 'panel log' },
            h('summary', null, `Net log (${log.length} transmissions)`),
            ui.transcript(log, { compact: true })) : null,
          h('div', { class: 'panel' },
            h('div', { class: 'panel-head' },
              h('p', { class: 'eyebrow' }, 'On the net'),
              ui.speakButton(() => step.heard.map(([w, t]) => `${w}. ${t}`).join(' '), 'Listen')),
            ui.transcript(step.heard),
            step.context ? h('p', { class: 'callout' }, h('strong', null, 'Situation: '), step.context) : null,
            h('p', { class: 'question' }, step.ask),
            h('div', { class: 'opts' }, buttons),
            feedback,
            h('div', { class: 'actions' }, nextBtn)));
      }

      function advance() {
        i += 1;
        if (i < total) show(); else debrief();
      }

      function debrief() {
        keyHandler = null;
        CAS.progress.update((p) => { p.sim.runs += 1; p.sim.best = Math.max(p.sim.best, score); });
        const pct = ui.pct(score, total);
        body.replaceChildren(h('div', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'Debrief'),
          h('h2', { class: 'big' }, `${score} / ${total} · ${pct}%`),
          ui.meter(pct, `${pct} percent`),
          h('p', { class: 'lede small' }, pct === 100 ? 'Clean control from start to finish.' : pct >= 70 ? 'Solid control. Review the misses below.' : 'Review the misses and run it again. Repetition builds reflex.'),
          misses.length
            ? h('div', null, h('h3', null, 'Review'),
              h('ul', { class: 'review' }, misses.map((m) => h('li', null,
                h('div', { class: 'q' }, `Moment ${m.n}: ${m.step.ask}`),
                h('div', { class: 'a bad' }, 'You: ' + m.picked.text),
                h('div', { class: 'a good' }, 'Best: ' + m.right.text),
                h('div', { class: 'a' }, m.right.why)))))
            : h('p', { class: 'callout good' }, 'No misses. Nicely done.'),
          h('div', { class: 'actions' },
            h('button', { class: 'btn primary', type: 'button', onClick: () => run() }, 'Run it again'),
            h('a', { class: 'btn', href: '#/quiz' }, 'Quiz the brevity'))));
      }

      show();
    }
  };
})();
