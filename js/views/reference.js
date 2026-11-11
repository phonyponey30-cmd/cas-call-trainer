/* Quick reference: phonetics, numbers, control types, checklists. Print-friendly. */
(function () {
  const CAS = window.CAS;
  const { h } = CAS.u;
  const ui = CAS.ui;

  const section = (title, ...kids) => h('section', { class: 'block ref' }, h('h2', { class: 'section-title' }, title), ...kids);
  const table = (head, rows, cls) =>
    h('div', { class: 'table-wrap' },
      h('table', { class: 'ref-table ' + (cls || '') },
        h('thead', null, h('tr', null, head.map((c) => h('th', null, c)))),
        h('tbody', null, rows.map((r) => h('tr', null, r.map((c, i) => h(i === 0 ? 'th' : 'td', { scope: i === 0 ? 'row' : null }, c)))))));

  CAS.views.reference = function reference() {
    const seq = (id) => CAS.sequence.find((s) => s.id === id);

    return h('div', { class: 'page' },
      ui.pageHead('Quick reference', 'Everything on one page',
        'Pocket-sized refreshers. Use the print button for a kneeboard copy.'),
      h('div', { class: 'toolbar noprint' }, h('button', { class: 'btn', type: 'button', onClick: () => window.print() }, 'Print this page')),

      section('Radio discipline',
        h('div', { class: 'two' },
          h('div', null, h('h3', null, 'Do'), h('ul', { class: 'checks' }, [
            'Call the station you want first, then yourself: "Hawg 11, Axeman 21."',
            'Say "affirm" and "negative." Use "say again" to ask for a repeat.',
            'Think before you key. Give one clear instruction per transmission.',
            'Pass numbers digit by digit and slow down for lines 4, 6 and 7.',
            'Use "break" to separate long transmissions into copyable chunks.',
            'Require the readback and check every digit.',
            'Give "cleared hot" only when every clearance criterion is met.',
          ].map((t) => h('li', null, t)))),
          h('div', null, h('h3', null, 'Don\'t'), h('ul', { class: 'cross' }, [
            '"Over and out." Over expects a reply; out does not.',
            '"Repeat." In fire support it means "fire again."',
            'Accept a bad readback with "roger."',
            'Use "roger" to mean "yes."',
            'Rush a 9-line so the aircrew cannot copy it.',
            'Clear the aircraft hot while unsure of friendlies or the target.',
            'Hold the mic open while thinking.',
          ].map((t) => h('li', null, t)))))),

      section('Phonetic alphabet',
        h('div', { class: 'phon' }, Object.entries(CAS.u.PHON).map(([k, v]) => h('div', { class: 'phon-cell' }, h('b', null, k), h('span', null, v))))),

      section('Numbers on the radio',
        h('div', { class: 'phon' }, CAS.u.DIGIT_WORD.map((w, i) => h('div', { class: 'phon-cell' }, h('b', null, String(i)), h('span', null, w)))),
        table(['Say', 'As'], [
          ['Heading 090', '"zero niner zero"'],
          ['Elevation 1,240 ft', '"one two four zero"'],
          ['Altitude 12,000 ft', '"one two thousand" (or "angels one two")'],
          ['Grid 38T MN 4521 3367', '"three eight tango, mike november, four five two one, three three six seven"'],
          ['Time 1430Z', '"one four three zero Zulu"'],
          ['900 meters', '"nine hundred meters"'],
        ])),

      section('Types of control',
        table(['Type', 'JTAC sees…', 'Clearance', 'Used when'], [
          ['Type 1', 'Target and attacking aircraft at weapons release', '"Cleared hot" for each attack', 'JTAC has eyes on both and wants control of each attack.'],
          ['Type 2', 'Target (or observes it by sensor) but not the aircraft at release', '"Cleared hot" for each attack', 'JTAC wants control of each attack but cannot see the aircraft.'],
          ['Type 3', 'Neither required for each release', '"Cleared to engage" for multiple attacks', 'JTAC clears multiple attacks within set parameters; not for each pass.'],
        ])),

      section('Method of attack',
        table(['Method', 'Meaning', 'Notes'], [
          ['BOT', 'Bomb on target', 'The target is observed (visually or by sensor) and engaged directly.'],
          ['BOC', 'Bomb on coordinate', 'The target is not observed; accuracy depends on the quality of the coordinates.'],
        ])),

      section('Marks',
        table(['Mark', 'Line 7 sounds like', 'Remember'], [
          ['Laser', '"laser, code one-six-eight-eight"', 'Four digits: first 1 or 2, then 1–8. Designator and weapon must match. Ground lasing needs a laser-to-target line.'],
          ['IR pointer', '"IR pointer"', 'Visible only through night vision.'],
          ['Smoke', '"red smoke"', 'Brief the color and have the aircrew call the color they see.'],
          ['None', '"none"', 'Typical for coordinate attacks (BOC).'],
        ])),

      section('Checklists',
        h('div', { class: 'two' },
          h('div', { class: 'panel' }, h('h3', null, 'CAS check-in (aircrew → JTAC)'), h('ul', { class: 'checks' }, seq('checkin').points.map((t) => h('li', null, t)))),
          h('div', { class: 'panel' }, h('h3', null, 'Situation update (JTAC → aircrew)'), h('ul', { class: 'checks' }, seq('sitrep').points.map((t) => h('li', null, t))))),
        h('div', { class: 'two' },
          h('div', { class: 'panel' }, h('h3', null, 'Game plan'), h('ul', { class: 'checks' }, seq('gameplan').points.map((t) => h('li', null, t)))),
          h('div', { class: 'panel' }, h('h3', null, 'BDA'), h('ul', { class: 'checks' }, seq('bda').points.map((t) => h('li', null, t)))))),

      section('Kneeboard 9-line',
        h('ol', { class: 'kneeboard' }, CAS.lines.filter((l) => typeof l.n === 'number').map((l) =>
          h('li', null, h('b', null, `${l.n}`), h('span', { class: 'kb-name' }, l.name), h('span', { class: 'kb-short' }, l.short), l.readback ? h('span', { class: 'rb' }, 'RB') : null, h('span', { class: 'kb-blank' }))),
          ),
        h('p', { class: 'muted small' }, 'Remarks / restrictions: danger close · final attack heading · laser-to-target line · time on target · hazards. Readback: lines 4, 6, 7 and restrictions.')),

      section('Danger close',
        h('p', null, 'Danger close means friendly forces are inside the minimum safe distance (MSD) for the weapon. The ground commander accepts the risk, and the JTAC states it in the remarks. MSDs depend on weapon, fuze and delivery. Use the tables in your current publication; the drill rules in this trainer are simplified.')));
  };
})();
