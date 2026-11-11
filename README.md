# CAS Call Trainer

A browser-based training aid for **JTACs and CAS aircrew** to practice close air support communications: check-ins, situation updates, the 9-line, readbacks, radio procedure and brevity codes.

No build step, no dependencies, no server-side code. Progress is saved in your browser's `localStorage` and never leaves your device.

> **Training aid, not doctrine.** Content is drawn from publicly available joint publications (JP 3-09.3, ATP 3-09.32, multi-service brevity codes). Scenarios, grids, callsigns and units are fictional. Always follow your current publications, theater SPINS and unit SOPs. Danger-close thresholds in the drills are simplified.

## What's in it

| Module | What you do |
| --- | --- |
| **Study** | Walk the CAS call from check-in to BDA with sample transmissions, then explore the 9-line one line at a time (format, how to say it, common mistakes). |
| **Brevity** | 95 codes, procedure words and acronyms. Searchable library plus flashcards with remembered "known" cards. |
| **Quiz** | Five modes: term to meaning, meaning to term, typed recall, "which call?" radio situations, and 9-line structure. Misses are remembered so you can drill only what you struggle with. |
| **9-Line Drill** | Eight fictional scenarios. **Build** a 9-line from raw JTAC notes (unit conversions, true vs magnetic, danger close, remarks), or **Listen** to one read over text-to-speech and read back lines 4, 6, 7 and remarks. Graded GO / NO-GO with per-field feedback. |
| **Radio Sim** | Play the JTAC through a full engagement. Choose each transmission; bad phraseology (`over and out`, `repeat`, accepting a bad readback) is called out. |
| **Reference** | Phonetics, numbers, control types, checklists, danger close, and a printable kneeboard 9-line. |

## Run it

It is a static site. Either open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000
```

Then browse to <http://localhost:8000>.

### GitHub Pages

Settings → Pages → deploy from the `main` branch, `/ (root)`. (Pages on a private repo requires a paid GitHub plan.)

## Tests

Dependency-free Node tests cover the data integrity, the 9-line grader and the radio-speech helpers:

```bash
node tests/run.js
```

## Project layout

```
index.html            App shell
css/styles.css        Theme (dark default, light available, print styles)
js/util.js            DOM helper, safe storage, radio-style number/phonetic speech
js/grader.js          9-line grader + model-answer builder (pure functions)
js/ui.js, js/app.js   Shared components, router, progress
js/data/              Brevity codes, 9-line content, scenarios, radio-sim script
js/views/             One file per page
tests/run.js          Node test runner
```

## Customizing

* **Add a brevity code:** append an entry to `js/data/brevity.js`. It appears in the library, flashcards and quizzes automatically.
* **Add a drill scenario:** add an object to `js/data/scenarios.js` (notes, map data, expected answer). `node tests/run.js` validates its structure and checks the grader gives a perfect answer 100%.
* **Change the grading policy:** `CAS.fieldPolicy` in `js/grader.js` decides each 9-line field's weight and whether a miss on it is an automatic NO-GO.
