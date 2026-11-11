/* Shared UI components used by several views. */
(function () {
  const CAS = (window.CAS = window.CAS || {});
  const { h } = CAS.u;
  const ui = (CAS.ui = {});

  const SVG_NS = 'http://www.w3.org/2000/svg';
  ui.svg = function svg(tag, attrs, ...kids) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
    for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };

  ui.pageHead = (eyebrow, title, lede) =>
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, eyebrow),
      h('h1', null, title),
      lede ? h('p', { class: 'lede' }, lede) : null);

  ui.badge = (text, cls) => h('span', { class: 'badge' + (cls ? ' ' + cls : '') }, text);

  ui.meter = (pct, label) =>
    h('div', { class: 'meter', role: 'img', 'aria-label': label || `${pct}%` },
      h('span', { style: `width:${Math.max(0, Math.min(100, pct))}%` }));

  ui.level = (n) => h('span', { class: 'level', 'aria-label': `Difficulty ${n} of 3`, title: `Difficulty ${n} of 3` },
    [1, 2, 3].map((i) => h('i', { class: i <= n ? 'on' : '' })));

  /* A radio-log transcript: lines = [[speaker, text], ...] */
  ui.transcript = function transcript(lines, opts = {}) {
    const box = h('div', { class: 'radio' + (opts.compact ? ' compact' : '') },
      lines.map(([who, text]) =>
        h('div', { class: 'tx ' + (/^axeman/i.test(who) ? 'jtac' : 'air') },
          h('span', { class: 'who' }, who),
          h('p', null, text))));
    return box;
  };

  /* Button that reads text aloud (radio-style) and toggles to "Stop". */
  ui.speakButton = function speakButton(getText, label = 'Listen') {
    if (!CAS.u.canSpeak()) return null;
    const btn = h('button', { class: 'btn small ghost', type: 'button' }, '🔊 ' + label);
    let playing = false;
    const reset = () => { playing = false; btn.textContent = '🔊 ' + label; };
    btn.addEventListener('click', () => {
      if (playing) { CAS.u.stopSpeaking(); reset(); return; }
      playing = true;
      btn.textContent = '■ Stop';
      CAS.u.speak(getText(), { onend: reset });
    });
    return btn;
  };

  /* Segmented control: options = [{value, label}] */
  ui.segmented = function segmented(name, options, value, onChange) {
    const wrap = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': name });
    options.forEach((o) => {
      const b = h('button', {
        type: 'button', role: 'radio', class: 'seg' + (o.value === value ? ' on' : ''),
        'aria-checked': String(o.value === value),
        onClick: () => {
          wrap.querySelectorAll('.seg').forEach((s) => { s.classList.remove('on'); s.setAttribute('aria-checked', 'false'); });
          b.classList.add('on'); b.setAttribute('aria-checked', 'true');
          onChange(o.value);
        },
      }, o.label);
      wrap.append(b);
    });
    return wrap;
  };

  /* Selectable option card/button list used by quiz and sim. */
  ui.pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
})();
