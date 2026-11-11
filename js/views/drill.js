/* 9-line drill: build a 9-line from raw notes, or listen and read back. Graded GO / NO-GO. */
(function () {
  const CAS = window.CAS;
  const { h } = CAS.u;
  const ui = CAS.ui;

  CAS.views.drill = function drill(args) {
    const sc = args[0] && CAS.scenarios.find((s) => s.id === args[0]);
    if (sc) return scenarioView(sc, args[1] === 'listen' ? 'listen' : 'build');
    return listView();
  };

  /* ------------------------------------------------------------------ */
  /* Scenario list                                                      */
  /* ------------------------------------------------------------------ */
  function listView() {
    const p = CAS.progress.get();
    return h('div', { class: 'page' },
      ui.pageHead('9-line drill', 'Build it. Brief it. Read it back.',
        'Each scenario hands you raw JTAC notes. Build the 9-line from them, or listen to one on the radio and read back lines 4, 6 and 7. Graded GO or NO-GO.'),
      h('details', { class: 'panel rules' },
        h('summary', null, 'Drill rules (read once)'),
        h('ul', { class: 'checks' }, CAS.drillRules.map((r) => h('li', null, r)))),
      h('div', { class: 'grid cards' },
        CAS.scenarios.map((s) => {
          const d = p.drills[s.id] || {};
          const l = d.listen || {};
          return h('article', { class: 'module scenario' },
            h('div', { class: 'row' }, ui.level(s.level), d.go ? ui.badge('GO', 'good') : d.attempts ? ui.badge(`Best ${d.best}%`, 'warn') : ui.badge('New')),
            h('h2', null, s.title),
            h('p', { class: 'mono small' }, s.aircraft),
            h('p', null, s.narrative),
            h('div', { class: 'actions' },
              h('a', { class: 'btn primary small', href: `#/drill/${s.id}` }, 'Build 9-line'),
              h('a', { class: 'btn small', href: `#/drill/${s.id}/listen` }, l.go ? 'Listen ✓' : 'Listen & read back')));
        })));
  }

  /* ------------------------------------------------------------------ */
  /* Map                                                                */
  /* ------------------------------------------------------------------ */
  const cardinal = (brg) => ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.round((((brg % 360) + 360) % 360) / 45) % 8];

  function mapSvg(sc) {
    const S = 340, c = S / 2, R = 108;
    const m = sc.map;
    const all = [...m.friendlies, ...m.threats, ...(m.hazards || [])];
    const maxM = Math.max(200, ...all.map((p) => p.m));
    const rad = (b) => (b * Math.PI) / 180;
    const xy = (brg, r) => [c + r * Math.sin(rad(brg)), c - r * Math.cos(rad(brg))];
    const svg = ui.svg('svg', {
      viewBox: `-14 -14 ${S + 28} ${S + 28}`, class: 'map', role: 'img',
      'aria-label': 'Tactical sketch, north up. ' + [
        ...m.friendlies.map((f) => `${f.label} ${f.m} meters ${cardinal(f.brg)} of the target`),
        ...m.threats.map((t) => `${t.label} ${t.m} meters ${cardinal(t.brg)}`),
        ...(m.hazards || []).map((z) => `${z.label} ${z.m} meters ${cardinal(z.brg)}`),
        `${m.ipName} ${cardinal(m.ipBrg)} of the target`,
      ].join('. '),
    });

    const T = (x, y, text, cls, anchor) => ui.svg('text', { x, y, class: 'm-label ' + (cls || ''), 'text-anchor': anchor || 'start' }, text);
    const labelFor = (x, y, text, cls) => (x > c + 20 ? T(x - 11, y + 4, text, cls, 'end') : T(x + 11, y + 4, text, cls, 'start'));

    // Distances use a square-root scale so close objects stay legible when one threat is far away.
    const rOf = (meters) => R * Math.sqrt(meters / maxM);

    // Range rings
    [maxM / 4, maxM].forEach((v) => {
      const r = rOf(v);
      svg.append(ui.svg('circle', { cx: c, cy: c, r, class: 'm-ring' }));
      svg.append(T(c + 4, c - r - 3, `${Math.round(v)} m`, 'm-ringlabel'));
    });
    svg.append(ui.svg('line', { x1: c, y1: c - R - 14, x2: c, y2: c + R + 14, class: 'm-axis' }));
    svg.append(ui.svg('line', { x1: c - R - 14, y1: c, x2: c + R + 14, y2: c, class: 'm-axis' }));

    // IP/BP bearing line and marker
    const [ix, iy] = xy(m.ipBrg, 150);
    const [lx, ly] = xy(m.ipBrg, 20);
    svg.append(ui.svg('line', { x1: ix, y1: iy, x2: lx, y2: ly, class: 'm-run' }));
    svg.append(ui.svg('circle', { cx: ix, cy: iy, r: 7, class: 'm-ip' }));
    svg.append(labelFor(ix, iy - 12 + 10, m.ipName, 'strong'));

    // Hazards (triangles), threats (diamonds), friendlies (squares)
    (m.hazards || []).forEach((z) => {
      const [x, y] = xy(z.brg, rOf(z.m));
      svg.append(ui.svg('path', { d: `M${x} ${y - 7} L${x + 7} ${y + 6} L${x - 7} ${y + 6} Z`, class: 'm-hazard' }));
      svg.append(labelFor(x, y, z.label));
    });
    m.threats.forEach((t) => {
      const [x, y] = xy(t.brg, rOf(t.m));
      svg.append(ui.svg('path', { d: `M${x} ${y - 8} L${x + 8} ${y} L${x} ${y + 8} L${x - 8} ${y} Z`, class: 'm-threat' }));
      svg.append(labelFor(x, y, t.label));
    });
    m.friendlies.forEach((f) => {
      const [x, y] = xy(f.brg, rOf(f.m));
      svg.append(ui.svg('rect', { x: x - 7, y: y - 7, width: 14, height: 14, class: 'm-friend' }));
      svg.append(labelFor(x, y, f.label));
    });

    // Target
    svg.append(ui.svg('circle', { cx: c, cy: c, r: 9, class: 'm-target' }));
    svg.append(ui.svg('path', { d: `M${c - 13} ${c} H${c + 13} M${c} ${c - 13} V${c + 13}`, class: 'm-target-x' }));
    svg.append(T(c + 14, c - 12, 'TGT', 'strong'));

    // North arrow
    svg.append(ui.svg('path', { d: 'M0 22 L6 6 L12 22 L6 18 Z', class: 'm-north', transform: 'translate(0,-8)' }));
    svg.append(T(6, 28, 'N', 'strong', 'middle'));
    return svg;
  }

  function mapLegend() {
    return h('ul', { class: 'legend' },
      h('li', null, h('i', { class: 'lg friend' }), 'Friendly'),
      h('li', null, h('i', { class: 'lg threat' }), 'Threat'),
      h('li', null, h('i', { class: 'lg hazard' }), 'Hazard'),
      h('li', null, h('i', { class: 'lg ip' }), 'IP / BP'));
  }

  /* ------------------------------------------------------------------ */
  /* Form helpers                                                       */
  /* ------------------------------------------------------------------ */
  const field = (label, control, hint, cls, forId) =>
    h('div', { class: 'field ' + (cls || '') },
      h('label', { for: forId || control.id }, label),
      control,
      hint ? h('p', { class: 'hint' }, hint) : null);

  const select = (name, options, placeholder) =>
    h('select', { class: 'input', name, id: 'f-' + name },
      placeholder ? h('option', { value: '' }, placeholder) : null,
      options.map(([v, l]) => h('option', { value: v }, l)));

  const input = (name, attrs) => h('input', { class: 'input', name, id: 'f-' + name, autocomplete: 'off', spellcheck: 'false', ...attrs });
  const dirOptions = Object.entries(CAS.dirs).map(([k, v]) => [k, v.label]);
  const markOptions = Object.entries(CAS.markTypes).map(([k, v]) => [k, v.label]);

  const dangerCloseField = () =>
    h('fieldset', { class: 'inline-group' },
      h('legend', null, 'Danger close?'),
      h('div', { class: 'row' },
        ['yes', 'no'].map((v) =>
          h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'dangerClose', value: v }), h('span', null, v === 'yes' ? 'Yes' : 'No')))));

  const restrictionsField = () =>
    h('fieldset', { class: 'stack-group' },
      h('legend', null, 'Restrictions to brief'),
      Object.entries(CAS.restrictionOptions).map(([k, label]) =>
        h('label', { class: 'toggle' }, h('input', { type: 'checkbox', name: 'restrictions', value: k }), h('span', null, label))));

  const markFields = () => [
    field('Mark type', select('markType', markOptions, 'Select…')),
    field('Code / color', input('markCode', { placeholder: 'e.g. 1688 or red', inputmode: 'text' }), 'Laser: 4-digit code. Smoke: color.'),
  ];

  function readAnswers(form) {
    const fd = new FormData(form);
    const a = {};
    for (const [k, v] of fd.entries()) if (k !== 'restrictions') a[k] = v;
    a.restrictions = fd.getAll('restrictions');
    return a;
  }

  function buildForm() {
    return h('form', { class: 'nine-form', novalidate: true },
      h('fieldset', null, h('legend', null, 'Game plan'),
        h('div', { class: 'cols' },
          field('Type of control', select('control', [['1', 'Type 1'], ['2', 'Type 2'], ['3', 'Type 3']], 'Select…')),
          field('Method of attack', select('method', [['BOT', 'Bomb on target (BOT)'], ['BOC', 'Bomb on coordinate (BOC)']], 'Select…')))),
      h('fieldset', null, h('legend', null, 'Lines 1–3 · Approach'),
        h('div', { class: 'cols' },
          field('Line 1 · IP / BP', select('ip', CAS.ipNames.map((n) => [n, n]), 'Select…')),
          field('Line 2 · Heading (° magnetic)', input('heading', { inputmode: 'numeric', placeholder: '000', maxlength: '3' })),
          field('Line 3 · Distance',
            h('div', { class: 'combo' },
              input('distanceValue', { inputmode: 'decimal', placeholder: '0.0', 'aria-label': 'Distance value' }),
              h('select', { class: 'input', name: 'distanceUnit', 'aria-label': 'Distance unit' }, h('option', { value: 'nm' }, 'NM'), h('option', { value: 'm' }, 'meters'))),
            'NM for fixed-wing, meters for rotary-wing', '', 'f-distanceValue'))),
      h('fieldset', null, h('legend', null, 'Lines 4–7 · Target'),
        h('div', { class: 'cols' },
          field('Line 4 · Elevation (ft MSL)', input('elevation', { inputmode: 'numeric', placeholder: 'feet' })),
          field('Line 6 · Location (MGRS)', input('location', { placeholder: '38T MN 1234 5678' }))),
        field('Line 5 · Target description', h('textarea', { class: 'input', name: 'description', id: 'f-description', rows: '2', placeholder: 'Quantity, type, posture / cover' })),
        h('div', { class: 'cols' }, markFields())),
      h('fieldset', null, h('legend', null, 'Lines 8–9 · Friendlies and egress'),
        h('div', { class: 'cols' },
          field('Line 8 · Friendlies are (from target)', select('friendDir', dirOptions, 'Select…')),
          field('Line 8 · Distance (m)', input('friendMeters', { inputmode: 'numeric', placeholder: 'meters' })),
          field('Line 9 · Egress', select('egress', dirOptions, 'Select…')))),
      h('fieldset', null, h('legend', null, 'Remarks'),
        h('div', { class: 'cols' }, dangerCloseField(), restrictionsField())),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'submit' }, 'Grade my 9-line')));
  }

  function readbackForm() {
    return h('form', { class: 'nine-form', novalidate: true },
      h('fieldset', null, h('legend', null, 'Your readback: lines 4, 6, 7 and remarks'),
        h('div', { class: 'cols' },
          field('Line 4 · Elevation (ft MSL)', input('elevation', { inputmode: 'numeric', placeholder: 'feet' })),
          field('Line 6 · Location (MGRS)', input('location', { placeholder: '38T MN 1234 5678' }))),
        h('div', { class: 'cols' }, markFields()),
        h('div', { class: 'cols' }, dangerCloseField(), restrictionsField())),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'submit' }, 'Grade my readback')));
  }

  /* ------------------------------------------------------------------ */
  /* Results                                                            */
  /* ------------------------------------------------------------------ */
  function resultsPanel(sc, g, mode, assisted) {
    const idx = CAS.scenarios.indexOf(sc);
    const next = CAS.scenarios[(idx + 1) % CAS.scenarios.length];
    const go = g.verdict === 'GO';
    const model = CAS.modelNineLine(sc);
    const modeSuffix = mode === 'listen' ? '/listen' : '';

    return h('section', { class: 'panel results', id: 'results', tabindex: '-1', 'aria-label': 'Results' },
      h('div', { class: 'verdict ' + (go ? 'go' : 'nogo') },
        h('span', { class: 'v' }, g.verdict),
        h('span', { class: 'pct' }, `${g.pct}%`),
        ui.meter(g.pct, `${g.pct} percent`)),
      g.criticalMisses.length
        ? h('p', { class: 'callout bad', role: 'alert' },
          h('strong', null, 'Critical error: '), g.criticalMisses.map((r) => r.label).join('; '),
          '. A miss on a critical field is a NO-GO regardless of the score.')
        : null,
      assisted ? h('p', { class: 'callout warn' }, 'You used the transcript, so this attempt will not count toward GO.') : null,
      h('div', { class: 'table-wrap' },
        h('table', { class: 'results-table' },
          h('thead', null, h('tr', null, h('th', null, ''), h('th', null, 'Field'), h('th', null, 'You'), h('th', null, 'Expected'))),
          h('tbody', null, g.results.map((r) =>
            h('tr', { class: r.ok ? 'ok' : r.score > 0 ? 'part' : 'bad' },
              h('td', { class: 'mark', 'aria-label': r.ok ? 'Correct' : r.score > 0 ? 'Partly correct' : 'Incorrect' }, r.ok ? '✓' : r.score > 0 ? '◐' : '✗'),
              h('td', null, r.label, r.critical ? h('span', { class: 'tag' }, 'critical') : null),
              h('td', null, r.given, r.note ? h('div', { class: 'note' }, r.note) : null),
              h('td', null, r.ok ? '' : r.expected)))))),
      h('div', { class: 'panel-head' },
        h('h3', null, 'Model 9-line'),
        ui.speakButton(() => CAS.modelScript(sc), 'Hear the model')),
      h('ol', { class: 'model' }, model.map((l) => h('li', null, h('span', { class: 'lbl' }, l.label), h('span', null, l.text)))),
      h('div', { class: 'actions' },
        h('a', { class: 'btn primary', href: `#/drill/${sc.id}${modeSuffix}`, onClick: (e) => { e.preventDefault(); CAS.refresh(); } }, 'Try again'),
        h('a', { class: 'btn', href: `#/drill/${next.id}${modeSuffix}` }, 'Next scenario →'),
        h('a', { class: 'btn ghost', href: '#/drill' }, 'All scenarios')));
  }

  function saveResult(sc, mode, g, assisted) {
    CAS.progress.update((p) => {
      const d = p.drills[sc.id] || (p.drills[sc.id] = { best: 0, go: false, attempts: 0, listen: { best: 0, go: false, attempts: 0 } });
      const bucket = mode === 'listen' ? (d.listen || (d.listen = { best: 0, go: false, attempts: 0 })) : d;
      bucket.attempts += 1;
      if (!assisted) {
        bucket.best = Math.max(bucket.best, g.pct);
        if (g.verdict === 'GO') bucket.go = true;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scenario view                                                      */
  /* ------------------------------------------------------------------ */
  function scenarioView(sc, mode) {
    const listen = mode === 'listen';
    const resultSlot = h('div');
    let assisted = false;
    let plays = 0;

    const form = listen ? readbackForm() : buildForm();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const g = CAS.grade(sc, readAnswers(form), listen ? { only: CAS.readbackFields } : undefined);
      saveResult(sc, mode, g, assisted);
      form.querySelectorAll('input, select, textarea, button').forEach((el) => { el.disabled = true; });
      resultSlot.replaceChildren(resultsPanel(sc, g, mode, assisted));
      const panel = document.getElementById('results');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      panel.focus({ preventScroll: true });
    });

    const modeSwitch = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Drill mode' },
      h('a', { class: 'seg' + (!listen ? ' on' : ''), href: `#/drill/${sc.id}`, 'aria-current': !listen ? 'true' : null }, 'Build 9-line'),
      h('a', { class: 'seg' + (listen ? ' on' : ''), href: `#/drill/${sc.id}/listen`, 'aria-current': listen ? 'true' : null }, 'Listen & read back'));

    const situation = h('section', { class: 'panel' },
      h('p', { class: 'eyebrow' }, 'Situation'),
      h('p', { class: 'mono small' }, sc.aircraft),
      h('p', null, sc.narrative));

    let left;
    if (!listen) {
      left = [
        situation,
        h('section', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'JTAC notes'),
          h('dl', { class: 'notes' }, sc.notes.map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v))))),
        h('section', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'Sketch (north up · distances compressed · IP/BP not to scale)'),
          mapSvg(sc), mapLegend()),
        h('details', { class: 'panel rules' }, h('summary', null, 'Drill rules'), h('ul', { class: 'checks' }, CAS.drillRules.map((r) => h('li', null, r)))),
      ];
    } else {
      const playBtn = h('button', { class: 'btn primary', type: 'button' }, '▶ Play the 9-line');
      const count = h('span', { class: 'muted', 'aria-live': 'polite' }, 'Not played yet');
      const transcript = h('div', { class: 'panel', hidden: true });
      const speechOk = CAS.u.canSpeak();
      playBtn.addEventListener('click', () => {
        plays += 1;
        count.textContent = `Played ${plays} time${plays === 1 ? '' : 's'}`;
        CAS.u.speak(CAS.modelScript(sc), { rate: 0.82 });
      });
      const reveal = h('label', { class: 'toggle' },
        h('input', {
          type: 'checkbox',
          onChange: (e) => {
            transcript.hidden = !e.target.checked;
            if (e.target.checked) {
              assisted = true;
              transcript.replaceChildren(h('p', { class: 'eyebrow' }, 'Transcript (assisted)'),
                h('ol', { class: 'model' }, CAS.modelNineLine(sc).map((l) => h('li', null, h('span', { class: 'lbl' }, l.label), h('span', null, l.text)))));
            }
          },
        }),
        h('span', null, speechOk ? 'Show transcript (counts as assisted)' : 'Speech is not available in this browser. Show the transcript instead.'));
      left = [
        situation,
        h('section', { class: 'panel' },
          h('p', { class: 'eyebrow' }, 'Radio'),
          h('p', null, 'Your flight is on the net. The JTAC will pass the game plan, nine lines and remarks. Copy it, then read back lines 4, 6, 7 and the remarks.'),
          h('div', { class: 'actions' }, speechOk ? playBtn : null, count),
          reveal),
        transcript,
      ];
    }

    return h('div', { class: 'page wide' },
      h('p', null, h('a', { class: 'link', href: '#/drill' }, '← All scenarios')),
      h('header', { class: 'page-head' },
        h('div', { class: 'row' }, h('p', { class: 'eyebrow' }, 'Scenario'), ui.level(sc.level)),
        h('h1', null, sc.title)),
      modeSwitch,
      h('div', { class: 'drill-grid' },
        h('div', { class: 'stack' }, left),
        h('div', { class: 'stack' }, h('div', { class: 'panel' }, form), resultSlot)));
  }
})();
