/* Dependency-free tests: node tests/run.js
 * Loads the browser scripts into a fake `window` and checks data integrity,
 * the grader, and the speech helpers.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const sandbox = { window: {}, console };
sandbox.window = sandbox; // scripts do `window.CAS = ...`
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
['js/util.js', 'js/data/brevity.js', 'js/data/nineline.js', 'js/data/scenarios.js', 'js/data/sim.js', 'js/grader.js'].forEach(load);
const CAS = sandbox.CAS;

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { console.error('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
};

/* ---------- brevity data ---------- */
test('brevity: ids unique, every entry has term/cat/def', () => {
  const ids = new Set();
  for (const b of CAS.brevity) {
    assert(b.term && b.def, 'missing term/def: ' + JSON.stringify(b));
    assert(CAS.categories[b.cat], 'unknown category ' + b.cat + ' for ' + b.term);
    assert(!ids.has(b.id), 'duplicate id ' + b.id);
    ids.add(b.id);
  }
  assert(CAS.brevity.length >= 80, 'expected 80+ entries, got ' + CAS.brevity.length);
});
test('brevity: every category has at least 4 entries (quiz distractors)', () => {
  for (const c of Object.keys(CAS.categories)) {
    const n = CAS.brevity.filter((b) => b.cat === c).length;
    assert(n >= 4, c + ' has only ' + n);
  }
});
test('situations: answer index is in range, 4 options', () => {
  for (const s of CAS.situations) {
    assert(s.options.length === 4, s.q);
    assert(s.answer >= 0 && s.answer < s.options.length, s.q);
    assert(s.why, s.q);
  }
});

/* ---------- sim data ---------- */
test('sim: exactly one correct option per step', () => {
  for (const [i, st] of CAS.sim.steps.entries()) {
    assert(st.options.filter((o) => o.correct).length === 1, 'step ' + (i + 1));
    assert(st.options.every((o) => o.why), 'step ' + (i + 1) + ' missing why');
  }
});

/* ---------- scenarios ---------- */
const answersFromExpected = (e) => ({
  control: e.control, method: e.method, ip: e.ip,
  heading: String(e.heading), distanceValue: String(e.distance.value), distanceUnit: e.distance.unit,
  elevation: String(e.elevation),
  description: e.description.groups.map((g) => g[0]).join(' and '),
  location: e.location, markType: e.mark.type, markCode: e.mark.code,
  friendDir: e.friendlies.dir, friendMeters: String(e.friendlies.meters),
  egress: e.egress, dangerClose: e.dangerClose ? 'yes' : 'no', restrictions: e.restrictions.slice(),
});

test('scenarios: structure and validity', () => {
  const ids = new Set();
  for (const sc of CAS.scenarios) {
    assert(!ids.has(sc.id), 'duplicate ' + sc.id); ids.add(sc.id);
    const e = sc.expected;
    assert(['1', '2', '3'].includes(e.control), sc.id + ' control');
    assert(['BOT', 'BOC'].includes(e.method), sc.id + ' method');
    assert(CAS.dirs[e.egress] && CAS.dirs[e.friendlies.dir], sc.id + ' dirs');
    assert(/^\d{1,2}[A-Z]{3}\d+$/.test(e.location) && e.location.replace(/^\d{1,2}[A-Z]{3}/, '').length % 2 === 0, sc.id + ' grid ' + e.location);
    assert(CAS.markTypes[e.mark.type], sc.id + ' mark');
    if (e.mark.type === 'laser') assert(/^[12][1-8]{3}$/.test(e.mark.code), sc.id + ' laser code ' + e.mark.code);
    for (const r of e.restrictions) {
      assert(CAS.restrictionOptions[r], sc.id + ' restriction ' + r);
      if (r !== 'ltl') assert(e.detail && e.detail[r], sc.id + ' missing detail.' + r);
    }
    // 300 m drill rule for danger close
    assert(e.dangerClose === (e.friendlies.meters <= 300), sc.id + ' danger-close rule');
    // Rotary uses meters, fixed-wing uses NM
    assert(['nm', 'm'].includes(e.distance.unit), sc.id + ' unit');
    assert(sc.notes.length >= 6 && sc.narrative && sc.aircraft, sc.id + ' text');
    assert(sc.map && sc.map.friendlies.length, sc.id + ' map');
  }
});

test('grader: a perfect answer is GO 100% for every scenario', () => {
  for (const sc of CAS.scenarios) {
    const g = CAS.grade(sc, answersFromExpected(sc.expected));
    assert.strictEqual(g.pct, 100, sc.id + ' got ' + g.pct + ': ' + g.results.filter((r) => !r.ok).map((r) => r.id + '→' + r.given).join(', '));
    assert.strictEqual(g.verdict, 'GO', sc.id);
  }
});

test('grader: empty answer is NO-GO 0%', () => {
  const g = CAS.grade(CAS.scenarios[0], { restrictions: [] });
  assert.strictEqual(g.verdict, 'NO-GO');
  assert(g.pct < 20, 'pct ' + g.pct);
});

const sc1 = CAS.scenarios[0];
const mutate = (fn) => { const a = answersFromExpected(sc1.expected); fn(a); return CAS.grade(sc1, a); };
const field = (g, id) => g.results.find((r) => r.id === id);

test('grader: transposed grid digits fails Line 6 with a helpful note', () => {
  const g = mutate((a) => { a.location = '38T MN 4521 3637'; });
  assert(!field(g, 'location').ok);
  assert(/digits/.test(field(g, 'location').note));
});
test('grader: grid formatting is forgiving (spaces, case, punctuation)', () => {
  const g = mutate((a) => { a.location = '38t-mn 4521-3367'; });
  assert(field(g, 'location').ok);
});
test('grader: heading accepts "090"-style leading zeros and detects reciprocal', () => {
  const g = mutate((a) => { a.heading = '130'; });
  assert(field(g, 'heading').ok);
  const g2 = mutate((a) => { a.heading = '310'; });
  assert(!field(g2, 'heading').ok && /reciprocal/.test(field(g2, 'heading').note));
});
test('grader: elevation given in meters is flagged', () => {
  const g = mutate((a) => { a.elevation = '378'; });
  assert(!field(g, 'elevation').ok && /meters/.test(field(g, 'elevation').note));
});
test('grader: elevation tolerance and thousands separators', () => {
  const tic = CAS.scenarios.find((s) => s.id === 'tic-wadi');
  const a = answersFromExpected(tic.expected);
  a.elevation = '1,350 ft';
  assert(CAS.grade(tic, a).results.find((r) => r.id === 'elevation').ok);
  a.elevation = '1,340';
  assert(!CAS.grade(tic, a).results.find((r) => r.id === 'elevation').ok);
});
test('grader: reversed friendlies direction is flagged', () => {
  const g = mutate((a) => { a.friendDir = 'N'; });
  assert(/Reversed/.test(field(g, 'friendlies').note));
  assert.strictEqual(field(g, 'friendlies').score, 0.5);
});
test('grader: laser code partial credit and invalid-format note', () => {
  const g = mutate((a) => { a.markCode = '1699'; });
  assert.strictEqual(field(g, 'mark').score, 0.5);
  const g2 = mutate((a) => { a.markCode = '9999'; });
  assert(/4 digits/.test(field(g2, 'mark').note));
});
test('grader: description needs every keyword group', () => {
  const g = mutate((a) => { a.description = 'two BMP-2'; });
  assert.strictEqual(field(g, 'description').score, 0.5);
  const g2 = mutate((a) => { a.description = '2x bmp2 + infantry'; });
  assert(field(g2, 'description').ok);
});
test('grader: restrictions use set overlap; extras are penalised', () => {
  const g = mutate((a) => { a.restrictions = ['ltl', 'tot']; });
  assert(Math.abs(field(g, 'restrictions').score - 0.5) < 1e-9);
  assert(/Not needed/.test(field(g, 'restrictions').note));
});
test('grader: distance unit mix-up gives half credit', () => {
  const g = mutate((a) => { a.distanceUnit = 'm'; });
  assert.strictEqual(field(g, 'distance').score, 0.5);
});
test('grader: declination trap is explained', () => {
  const dec = CAS.scenarios.find((s) => s.id === 'declination');
  const a = answersFromExpected(dec.expected);
  a.heading = '095';
  const r = CAS.grade(dec, a).results.find((x) => x.id === 'heading');
  assert(!r.ok && /TRUE/.test(r.note));
  a.heading = '089'; // within the ±1 tolerance
  assert(CAS.grade(dec, a).results.find((x) => x.id === 'heading').ok);
});
test('grader: a critical miss forces NO-GO even with a high score', () => {
  const g = mutate((a) => { a.location = '38T MN 4521 3637'; });
  assert(g.pct >= 85, 'pct ' + g.pct);
  assert.strictEqual(g.verdict, CAS.fieldPolicy('location').critical ? 'NO-GO' : 'GO');
});
test('grader: readback-only mode scores just the readback fields', () => {
  const a = answersFromExpected(sc1.expected);
  const g = CAS.grade(sc1, a, { only: CAS.readbackFields });
  assert.deepStrictEqual(g.results.map((r) => r.id), CAS.readbackFields);
  assert.strictEqual(g.pct, 100);
});
test('fieldPolicy: returns a positive weight and boolean for every field', () => {
  for (const f of CAS.fields) {
    const p = CAS.fieldPolicy(f.id);
    assert(p && p.weight > 0 && typeof p.critical === 'boolean', f.id);
  }
});

/* ---------- speech helpers ---------- */
test('speech: digits use "niner" and spoken grids read like the radio', () => {
  assert.strictEqual(CAS.u.spokenDigits('1940'), 'one niner four zero');
  assert.strictEqual(CAS.u.spokenGrid('38TMN45213367'), 'three eight tango, mike november, four five two one, three three six seven');
  assert.strictEqual(CAS.u.prettyGrid('38TMN45213367'), '38T MN 4521 3367');
  assert.strictEqual(CAS.u.spokenNumber(900), 'nine hundred');
  assert.strictEqual(CAS.u.spokenNumber(2800), 'two thousand eight hundred');
  assert.strictEqual(CAS.u.spokenNumber(6.6), 'six point six');
});
test('model answer: remarks include LTL bearing as reciprocal of friendlies', () => {
  const lines = CAS.modelNineLine(sc1);
  const remarks = lines.find((l) => l.id === 'remarks');
  assert(/Laser-to-target line 360/.test(remarks.text), remarks.text);
  assert(/Not danger close/.test(remarks.text));
  assert(CAS.modelScript(sc1).includes('Line six: three eight tango'));
});
test('model answer: every scenario builds without throwing', () => {
  for (const sc of CAS.scenarios) assert(CAS.modelNineLine(sc).length === 11, sc.id);
});
test('edit distance', () => {
  assert.strictEqual(CAS.u.editDistance('winchester', 'winchestr'), 1);
  assert.strictEqual(CAS.u.editDistance('', 'abc'), 3);
});

console.log(`\n${passed} tests passed` + (process.exitCode ? ' (with failures)' : ''));
