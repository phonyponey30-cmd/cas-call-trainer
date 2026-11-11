/* 9-line grader.
 *
 * grade(scenario, answers, { only }) -> { results, pct, verdict, criticalMisses }
 * modelNineLine(scenario)            -> display + spoken text of the model answer
 *
 * Pure functions: no DOM access, so they can be unit-tested in Node.
 */
(function () {
  const CAS = (window.CAS = window.CAS || {});
  const u = CAS.u;

  /* ------------------------------------------------------------------ */
  /* Field catalogue                                                    */
  /* ------------------------------------------------------------------ */
  CAS.fields = [
    { id: 'control', label: 'Type of control' },
    { id: 'method', label: 'Method of attack' },
    { id: 'ip', label: 'Line 1 · IP / BP' },
    { id: 'heading', label: 'Line 2 · Heading' },
    { id: 'distance', label: 'Line 3 · Distance' },
    { id: 'elevation', label: 'Line 4 · Target elevation' },
    { id: 'description', label: 'Line 5 · Target description' },
    { id: 'location', label: 'Line 6 · Target location' },
    { id: 'mark', label: 'Line 7 · Mark / code' },
    { id: 'friendlies', label: 'Line 8 · Friendlies' },
    { id: 'egress', label: 'Line 9 · Egress' },
    { id: 'dangerClose', label: 'Remarks · Danger close' },
    { id: 'restrictions', label: 'Remarks · Restrictions' },
  ];

  // The lines an aircrew must read back, plus the remarks.
  CAS.readbackFields = ['elevation', 'location', 'mark', 'dangerClose', 'restrictions'];

  /* ------------------------------------------------------------------ */
  /* Grading policy                                                     */
  /* ------------------------------------------------------------------ */
  /**
   * How much does each 9-line field matter when scoring a drill?
   *
   *   weight   - relative points the field is worth in the overall score
   *   critical - true => a wrong answer is an automatic NO-GO for the whole
   *              drill, however high the overall percentage is (the same way a
   *              bad readback on a safety-critical line gets "negative, say
   *              again" from a real controller)
   *
   * fieldId is one of: control, method, ip, heading, distance, elevation,
   * description, location, mark, friendlies, egress, dangerClose, restrictions
   *
   * TODO(human): replace this placeholder with your own grading policy.
   * Things to weigh: which errors could cause fratricide or a missed target
   * (location? friendlies? danger close?), which are procedural slips that
   * deserve partial credit, and whether "critical" should be rare (so it means
   * something) or broad (so trainees learn nothing is optional).
   */
  CAS.fieldPolicy = function fieldPolicy(fieldId) {
    // Placeholder: every field counts equally; only the three readback lines are critical.
    const critical = ['elevation', 'location', 'mark'];
    return { weight: 1, critical: critical.includes(fieldId) };
  };

  CAS.PASS_PERCENT = 85;

  /* ------------------------------------------------------------------ */
  /* Parsing helpers                                                    */
  /* ------------------------------------------------------------------ */
  const numFrom = (s) => {
    const m = /-?\d+(?:\.\d+)?/.exec(String(s == null ? '' : s).replace(/,/g, ''));
    return m ? parseFloat(m[0]) : NaN;
  };
  const compact = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normGrid = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const circDiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const dirLabel = (d) => (CAS.dirs[d] ? CAS.dirs[d].label : '—');
  const yn = (v) => (v === true || v === 'yes' ? 'Yes' : v === false || v === 'no' ? 'No' : '—');

  const hit = (text, group) => group.some((syn) => {
    const s = syn.toLowerCase();
    return s.length <= 2 ? new RegExp('\\b' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text) : compact(text).includes(compact(s));
  });

  const exactCheck = (exp, given, show) => {
    const ok = String(given || '') === String(exp);
    return { score: ok ? 1 : 0, given: given ? show(given) : '—', expected: show(exp) };
  };

  /* ------------------------------------------------------------------ */
  /* Per-field checkers: (expected, answers, tolerances, scenario)       */
  /* ------------------------------------------------------------------ */
  const checkers = {
    control: (e, a) => exactCheck(e.control, a.control, (v) => 'Type ' + v),
    method: (e, a) => exactCheck(e.method, a.method, (v) => (v === 'BOT' ? 'Bomb on target (BOT)' : 'Bomb on coordinate (BOC)')),
    ip: (e, a) => exactCheck(e.ip, a.ip, (v) => v),

    heading(e, a, tol) {
      const g = numFrom(a.heading);
      const t = tol.heading != null ? tol.heading : 0;
      const ok = !Number.isNaN(g) && circDiff(g, e.heading) <= t;
      let note = '';
      if (!ok && e.trapHeading != null && g === e.trapHeading) note = 'That is the TRUE bearing. Apply the magnetic variation (east is least, west is best).';
      else if (!ok && !Number.isNaN(g) && circDiff(g, (e.heading + 180) % 360) <= t) note = 'That is the reciprocal: Line 2 is IP to target.';
      return { score: ok ? 1 : 0, given: Number.isNaN(g) ? '—' : u.pad3(g) + '°', expected: u.pad3(e.heading) + '° magnetic', note };
    },

    distance(e, a, tol) {
      const g = numFrom(a.distanceValue);
      const unit = a.distanceUnit;
      const t = tol.distance != null ? tol.distance : e.distance.unit === 'nm' ? 0.1 : 50;
      const valueOk = !Number.isNaN(g) && Math.abs(g - e.distance.value) <= t;
      const unitOk = unit === e.distance.unit;
      const score = valueOk && unitOk ? 1 : valueOk || unitOk ? 0.5 : 0;
      let note = '';
      if (valueOk && !unitOk) note = e.distance.unit === 'nm' ? 'Fixed-wing distance is in nautical miles.' : 'Rotary-wing distance from a BP is in meters.';
      return {
        score,
        given: Number.isNaN(g) ? '—' : `${g} ${unit === 'nm' ? 'NM' : 'm'}`,
        expected: `${e.distance.value} ${e.distance.unit === 'nm' ? 'NM' : 'm'}`,
        note,
      };
    },

    elevation(e, a, tol) {
      const g = numFrom(a.elevation);
      const t = tol.elevation != null ? tol.elevation : 0;
      const ok = !Number.isNaN(g) && Math.abs(g - e.elevation) <= t;
      let note = '';
      if (!ok && !Number.isNaN(g) && Math.abs(g * 3.28084 - e.elevation) <= Math.max(t, 5)) note = 'That looks like meters. Line 4 is feet MSL (1 m ≈ 3.28 ft).';
      return { score: ok ? 1 : 0, given: Number.isNaN(g) ? '—' : g.toLocaleString('en-US') + ' ft', expected: e.elevation.toLocaleString('en-US') + ' ft MSL' + (t ? ` (±${t})` : ''), note };
    },

    description(e, a) {
      const text = String(a.description || '').toLowerCase();
      const groups = e.description.groups;
      const hits = groups.filter((g) => hit(text, g)).length;
      return {
        score: hits / groups.length,
        given: a.description ? a.description : '—',
        expected: e.description.text,
        note: hits < groups.length ? 'Mention every key element: what the targets are and any posture/cover cue.' : '',
      };
    },

    location(e, a) {
      const g = normGrid(a.location);
      const ok = g === e.location;
      let note = '';
      if (!ok && g) {
        const pre = /^\d{1,2}[A-Z]{3}/.exec(e.location)[0];
        note = g.startsWith(pre) ? 'Zone and square are right. Check the digits (read right, then up).' : 'Grid zone or 100 km square does not match.';
      }
      return { score: ok ? 1 : 0, given: g ? u.prettyGrid(g) : '—', expected: u.prettyGrid(e.location), note };
    },

    mark(e, a) {
      const type = a.markType || '';
      const code = compact(a.markCode);
      const t = CAS.markTypes[e.mark.type];
      const typeOk = type === e.mark.type;
      const expectedCode = compact(e.mark.code);
      const codeOk = !t.needsCode || code === expectedCode;
      let score = 0;
      if (typeOk) score = t.needsCode ? (codeOk ? 1 : 0.5) : 1;
      let note = '';
      if (type === 'laser' && a.markCode && !/^[12][1-8]{3}$/.test(String(a.markCode).trim())) note = 'A laser code is 4 digits: first 1 or 2, then 1–8.';
      else if (typeOk && t.needsCode && !codeOk) note = e.mark.type === 'laser' ? 'Right mark, wrong code. The designator and weapon must match.' : 'Right mark, wrong color.';
      const show = (ty, c) => (ty ? CAS.markTypes[ty].label + (CAS.markTypes[ty].needsCode && c ? ` · ${c}` : '') : '—');
      return { score, given: show(type, a.markCode), expected: show(e.mark.type, e.mark.code), note };
    },

    friendlies(e, a) {
      const dir = a.friendDir || '';
      const m = numFrom(a.friendMeters);
      const dirOk = dir === e.friendlies.dir;
      const mOk = !Number.isNaN(m) && Math.abs(m - e.friendlies.meters) <= 10;
      let note = '';
      if (!dirOk && dir && CAS.dirs[dir] && circDiff(CAS.dirs[dir].brg, CAS.dirs[e.friendlies.dir].brg) === 180) note = 'Reversed: Line 8 is from the TARGET to the friendlies.';
      return {
        score: (dirOk ? 0.5 : 0) + (mOk ? 0.5 : 0),
        given: `${dirLabel(dir)} · ${Number.isNaN(m) ? '—' : m + ' m'}`,
        expected: `${dirLabel(e.friendlies.dir)} · ${e.friendlies.meters} m`,
        note,
      };
    },

    egress: (e, a) => exactCheck(e.egress, a.egress, dirLabel),

    dangerClose(e, a) {
      const given = a.dangerClose;
      const ok = (given === 'yes') === e.dangerClose && (given === 'yes' || given === 'no');
      return {
        score: ok ? 1 : 0,
        given: yn(given),
        expected: yn(e.dangerClose),
        note: !ok && e.dangerClose ? 'Friendlies inside the weapon\'s MSD are danger close and the ground commander must accept the risk.' : '',
      };
    },

    restrictions(e, a) {
      const exp = new Set(e.restrictions);
      const got = new Set(a.restrictions || []);
      const inter = [...exp].filter((x) => got.has(x)).length;
      const union = new Set([...exp, ...got]).size;
      const missing = [...exp].filter((x) => !got.has(x)).map((x) => CAS.restrictionOptions[x]);
      const extra = [...got].filter((x) => !exp.has(x)).map((x) => CAS.restrictionOptions[x]);
      const parts = [];
      if (missing.length) parts.push('Missing: ' + missing.join('; '));
      if (extra.length) parts.push('Not needed: ' + extra.join('; '));
      const show = (set) => (set.size ? [...set].map((x) => CAS.restrictionOptions[x]).join('; ') : 'None');
      return { score: union ? inter / union : 1, given: show(got), expected: show(exp), note: parts.join('. ') };
    },
  };

  /* ------------------------------------------------------------------ */
  /* Grade                                                              */
  /* ------------------------------------------------------------------ */
  CAS.grade = function grade(scenario, answers, opts) {
    const only = opts && opts.only;
    const tol = scenario.tol || {};
    const results = [];
    for (const f of CAS.fields) {
      if (only && !only.includes(f.id)) continue;
      const r = checkers[f.id](scenario.expected, answers, tol, scenario);
      const policy = CAS.fieldPolicy(f.id);
      const weight = policy && policy.weight > 0 ? policy.weight : 1;
      results.push({
        id: f.id, label: f.label, score: r.score, ok: r.score >= 0.999,
        given: r.given, expected: r.expected, note: r.note || '',
        weight, critical: !!(policy && policy.critical),
      });
    }
    const totalW = results.reduce((s, r) => s + r.weight, 0);
    const earned = results.reduce((s, r) => s + r.weight * r.score, 0);
    const pct = totalW ? Math.round((earned / totalW) * 100) : 0;
    const criticalMisses = results.filter((r) => r.critical && !r.ok);
    const verdict = criticalMisses.length === 0 && pct >= CAS.PASS_PERCENT ? 'GO' : 'NO-GO';
    return { results, pct, verdict, criticalMisses };
  };

  /* ------------------------------------------------------------------ */
  /* Model answer (display text + radio-style speech)                    */
  /* ------------------------------------------------------------------ */
  CAS.modelNineLine = function modelNineLine(sc) {
    const e = sc.expected;
    const d = e.detail || {};
    const fr = CAS.dirs[e.friendlies.dir];
    const method = e.method === 'BOT' ? 'bomb on target' : 'bomb on coordinate';

    const markText = {
      laser: `Laser, code ${e.mark.code}`,
      ir: 'IR pointer',
      smoke: `Smoke, ${e.mark.code}`,
      none: 'None',
    }[e.mark.type];
    const markSay = {
      laser: `laser, code ${u.spokenDigits(e.mark.code)}`,
      ir: 'IR pointer',
      smoke: `${e.mark.code} smoke`,
      none: 'none',
    }[e.mark.type];

    // Laser-to-target line = bearing from the JTAC (with the friendlies) to the target.
    const ltlBrg = (fr.brg + 180) % 360 || 360;
    const remarkText = [], remarkSay = [];
    remarkText.push(e.dangerClose ? 'Danger close' : 'Not danger close');
    remarkSay.push(e.dangerClose ? 'danger close, ground commander\'s initials whiskey bravo' : 'not danger close');
    for (const r of e.restrictions) {
      if (r === 'fah') { remarkText.push('Final attack heading: ' + d.fah); remarkSay.push('final attack heading, ' + d.fah); }
      if (r === 'ltl') { remarkText.push(`Laser-to-target line ${u.pad3(ltlBrg)}`); remarkSay.push(`laser-to-target line ${u.spokenDigits(u.pad3(ltlBrg))}`); }
      if (r === 'tot') { remarkText.push(d.tot[0].toUpperCase() + d.tot.slice(1)); remarkSay.push(d.tot); }
      if (r === 'hazard') { remarkText.push('Hazard: ' + d.hazard); remarkSay.push('hazard, ' + d.hazard); }
    }

    const dist = e.distance.unit === 'nm'
      ? [`${e.distance.value} NM`, `${u.spokenNumber(e.distance.value)} miles`]
      : [`${e.distance.value} m`, `${u.spokenNumber(e.distance.value)} meters`];

    return [
      { id: 'control', label: 'Game plan', text: `Type ${e.control} control, ${method}`, say: `Game plan: Type ${u.DIGIT_WORD[+e.control]} control, ${method}` },
      { id: 'ip', label: 'Line 1', text: e.ip, say: `Line one: ${e.ip.toLowerCase()}` },
      { id: 'heading', label: 'Line 2', text: u.pad3(e.heading), say: `Line two: ${u.spokenDigits(u.pad3(e.heading))}` },
      { id: 'distance', label: 'Line 3', text: dist[0], say: `Line three: ${dist[1]}` },
      { id: 'elevation', label: 'Line 4', text: String(e.elevation), say: `Line four: ${u.spokenDigits(e.elevation)}` },
      { id: 'description', label: 'Line 5', text: e.description.text, say: `Line five: ${e.description.text}` },
      { id: 'location', label: 'Line 6', text: u.prettyGrid(e.location), say: `Line six: ${u.spokenGrid(e.location)}` },
      { id: 'mark', label: 'Line 7', text: markText, say: `Line seven: ${markSay}` },
      { id: 'friendlies', label: 'Line 8', text: `${fr.label}, ${e.friendlies.meters} m`, say: `Line eight: friendlies ${fr.say}, ${u.spokenNumber(e.friendlies.meters)} meters` },
      { id: 'egress', label: 'Line 9', text: CAS.dirs[e.egress].label, say: `Line nine: egress ${CAS.dirs[e.egress].say}` },
      { id: 'remarks', label: 'Remarks', text: remarkText.join('. ') + '.', say: `Remarks: ${remarkSay.join('. ')}` },
    ];
  };

  CAS.modelScript = (sc) => CAS.modelNineLine(sc).map((l) => l.say).join('. ') + '. Readback lines four, six, seven and remarks.';
})();
