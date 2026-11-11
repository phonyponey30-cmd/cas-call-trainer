/* Study: the CAS call sequence + an interactive 9-line explorer. */
(function () {
  const CAS = window.CAS;
  const { h } = CAS.u;
  const ui = CAS.ui;

  CAS.views.study = function study() {
    const page = h('div', { class: 'page' },
      ui.pageHead('Study', 'The CAS call, start to finish',
        'Every CAS engagement follows the same arc. Learn the sequence first, then the nine lines inside it.'));

    page.append(sequenceSection(), explorerSection());
    return page;
  };

  /* ---------- 1. The sequence stepper ---------- */
  function sequenceSection() {
    let idx = 0;
    const tabs = h('div', { class: 'steps', role: 'tablist', 'aria-label': 'CAS call sequence' });
    const panel = h('div', { class: 'panel step-panel', role: 'tabpanel', tabindex: '0' });

    const buttons = CAS.sequence.map((s, i) =>
      h('button', {
        class: 'step', type: 'button', role: 'tab', id: 'seq-' + s.id,
        onClick: () => select(i),
        onKeydown: (e) => {
          if (e.key === 'ArrowRight') { select((idx + 1) % CAS.sequence.length, true); e.preventDefault(); }
          if (e.key === 'ArrowLeft') { select((idx + CAS.sequence.length - 1) % CAS.sequence.length, true); e.preventDefault(); }
        },
      }, h('span', { class: 'step-n' }, i + 1), h('span', { class: 'step-t' }, s.title)));
    tabs.append(...buttons);

    function select(i, focus) {
      idx = i;
      const s = CAS.sequence[i];
      buttons.forEach((b, j) => {
        b.classList.toggle('on', j === i);
        b.setAttribute('aria-selected', String(j === i));
        b.tabIndex = j === i ? 0 : -1;
      });
      if (focus) buttons[i].focus();
      panel.setAttribute('aria-labelledby', 'seq-' + s.id);
      panel.replaceChildren(
        h('div', { class: 'panel-head' },
          h('div', null, h('p', { class: 'eyebrow' }, s.who), h('h2', null, s.title)),
          ui.speakButton(() => s.transcript.map(([w, t]) => `${w}. ${t}`).join(' '), 'Hear it')),
        h('p', { class: 'lede small' }, s.summary),
        h('div', { class: 'two' },
          h('div', null, h('h3', null, 'What goes in it'), h('ul', { class: 'checks' }, s.points.map((p) => h('li', null, p)))),
          h('div', null, h('h3', null, 'On the radio'), ui.transcript(s.transcript))));
    }
    select(0);

    return h('section', { class: 'block', 'aria-labelledby': 'seq-h' },
      h('h2', { id: 'seq-h', class: 'section-title' }, 'The call sequence'),
      tabs, panel);
  }

  /* ---------- 2. The 9-line explorer ---------- */
  function explorerSection() {
    let idx = 1; // start on Line 1
    let cover = false;

    const list = h('div', { class: 'line-list', role: 'listbox', 'aria-label': 'Lines of the CAS brief' });
    const detail = h('div', { class: 'panel line-detail', 'aria-live': 'polite' });

    const items = CAS.lines.map((l, i) =>
      h('button', { class: 'line-btn', type: 'button', role: 'option', onClick: () => select(i) },
        h('span', { class: 'line-n' }, String(l.n)),
        h('span', { class: 'line-name' }, l.name),
        l.readback ? h('span', { class: 'rb', title: 'Aircrew read this line back' }, 'RB') : null));

    list.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.max(0, Math.min(CAS.lines.length - 1, idx + (e.key === 'ArrowDown' ? 1 : -1)));
        select(next, true);
      }
    });
    list.append(...items);

    const coverToggle = h('label', { class: 'toggle' },
      h('input', { type: 'checkbox', onChange: (e) => { cover = e.target.checked; list.classList.toggle('covered', cover); } }),
      h('span', null, 'Cover line names (self-test)'));

    function select(i, focus) {
      idx = i;
      const l = CAS.lines[i];
      CAS.progress.update((p) => { if (!p.study.seen.includes(l.key)) p.study.seen.push(l.key); });
      items.forEach((b, j) => {
        b.classList.toggle('on', j === i);
        b.setAttribute('aria-selected', String(j === i));
        b.tabIndex = j === i ? 0 : -1;
      });
      if (focus) items[i].focus();
      detail.replaceChildren(
        h('div', { class: 'panel-head' },
          h('div', null,
            h('p', { class: 'eyebrow' }, typeof l.n === 'number' ? `Line ${l.n}` : l.name),
            h('h2', null, l.name),
            l.readback ? ui.badge('Aircrew read back', 'warn') : null),
          ui.speakButton(() => l.say, 'Hear it')),
        h('p', { class: 'lede small' }, l.meaning),
        h('h3', null, 'Format'),
        h('p', { class: 'code' }, l.format),
        h('h3', null, 'Say it like this'),
        h('p', { class: 'example' }, l.say),
        h('h3', null, 'Common mistakes'),
        h('ul', { class: 'cross' }, l.mistakes.map((m) => h('li', null, m))));
    }
    select(1);

    return h('section', { class: 'block', 'aria-labelledby': 'lines-h' },
      h('h2', { id: 'lines-h', class: 'section-title' }, 'The 9-line, line by line'),
      h('p', { class: 'muted' }, 'Use the arrow keys to move through the list. Lines marked ', h('span', { class: 'rb' }, 'RB'), ' are read back by the aircrew.'),
      coverToggle,
      h('div', { class: 'explorer' }, list, detail));
  }
})();
