/* Home: hero, module cards, progress snapshot, code of the day. */
(function () {
  const CAS = window.CAS;
  const { h } = CAS.u;
  const ui = CAS.ui;

  // Same entry for everyone on a given calendar day.
  function codeOfTheDay() {
    const d = new Date();
    const key = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
    const pool = CAS.brevity.filter((b) => b.cat !== 'acr');
    return pool[key % pool.length];
  }

  CAS.views.home = function home() {
    const p = CAS.progress.get();
    const accuracy = ui.pct(p.quiz.correct, p.quiz.answered);
    const drillsDone = Object.values(p.drills).filter((d) => d.go).length;
    const known = p.cards.known.length;
    const cotd = codeOfTheDay();

    const modules = [
      { href: 'study', n: '01', title: 'Study the call', text: 'Walk the CAS call from check-in to BDA, then dissect the 9-line one line at a time.', stat: `${p.study.seen.length}/${CAS.lines.length} lines viewed` },
      { href: 'brevity', n: '02', title: 'Brevity library', text: `${CAS.brevity.length} codes, procedure words and acronyms. Search them or drill them with flashcards.`, stat: `${known}/${CAS.brevity.length} cards known` },
      { href: 'quiz', n: '03', title: 'Quiz', text: 'Term to meaning, meaning to term, typed recall, "which call?" situations and 9-line structure.', stat: p.quiz.answered ? `${accuracy}% accuracy` : 'Not started' },
      { href: 'drill', n: '04', title: '9-line drill', text: 'Build a 9-line from raw JTAC notes, or listen to one and read back lines 4, 6 and 7. Graded GO / NO-GO.', stat: `${drillsDone}/${CAS.scenarios.length} scenarios GO` },
      { href: 'sim', n: '05', title: 'Radio sim', text: 'You are the JTAC. Control a full engagement transmission by transmission and get called on bad phraseology.', stat: p.sim.runs ? `Best ${p.sim.best}/${CAS.sim.steps.length}` : 'Not started' },
      { href: 'reference', n: '06', title: 'Quick reference', text: 'Phonetics, numbers, control types, check-in and situation-update checklists. Printable.', stat: 'Always available' },
    ];

    return h('div', { class: 'page' },
      h('section', { class: 'hero' },
        h('p', { class: 'eyebrow' }, 'Close air support · JTAC training aid'),
        h('h1', null, 'Say it right. ', h('span', { class: 'accent' }, 'The first time.')),
        h('p', { class: 'lede' }, 'Practice CAS check-ins, 9-lines, readbacks and brevity until the phraseology is automatic. Everything runs in your browser and your progress stays on this device.'),
        h('div', { class: 'actions' },
          h('a', { class: 'btn primary', href: '#/drill' }, 'Start a 9-line drill'),
          h('a', { class: 'btn', href: '#/study' }, 'Study the 9-line'),
          h('a', { class: 'btn ghost', href: '#/quiz' }, 'Quick quiz'))),

      h('section', { class: 'grid cards', 'aria-label': 'Training modules' },
        modules.map((m) =>
          h('a', { class: 'module', href: '#/' + m.href },
            h('span', { class: 'module-n' }, m.n),
            h('h2', null, m.title),
            h('p', null, m.text),
            h('span', { class: 'module-stat' }, m.stat)))),

      h('section', { class: 'split' },
        h('div', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'Code of the day'),
          h('h2', { class: 'mono big' }, cotd.term),
          h('p', null, cotd.def),
          cotd.ex ? h('p', { class: 'example' }, cotd.ex) : null,
          h('a', { class: 'link', href: '#/brevity' }, 'Open the library →')),
        h('div', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'Your progress'),
          h('dl', { class: 'stats' },
            stat('Quiz answers', p.quiz.answered),
            stat('Quiz accuracy', p.quiz.answered ? accuracy + '%' : '—'),
            stat('Drills at GO', `${drillsDone}/${CAS.scenarios.length}`),
            stat('Flashcards known', `${known}/${CAS.brevity.length}`)),
          h('button', {
            class: 'btn small ghost', type: 'button',
            onClick: () => {
              if (window.confirm('Reset all saved progress on this device?')) { CAS.progress.reset(); CAS.refresh(); }
            },
          }, 'Reset progress'))));
  };

  function stat(label, value) {
    return h('div', null, h('dt', null, label), h('dd', null, String(value)));
  }
})();
