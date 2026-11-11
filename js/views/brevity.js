/* Brevity: searchable library + flashcards (with remembered "known" cards). */
(function () {
  const CAS = window.CAS;
  const { h, shuffle } = CAS.u;
  const ui = CAS.ui;

  CAS.views.brevity = function brevity() {
    const state = { tab: 'library', cat: 'all', query: '', reverse: false };
    const body = h('div');

    // One document-level key listener for the whole view; the active tab decides what it does.
    let keyHandler = null;
    const onKey = (e) => { if (keyHandler) keyHandler(e); };
    document.addEventListener('keydown', onKey);
    CAS.onLeave(() => document.removeEventListener('keydown', onKey));

    const page = h('div', { class: 'page' },
      ui.pageHead('Brevity library', `${CAS.brevity.length} terms every JTAC and aircrew should know cold`,
        'Search the library, or switch to flashcards to drill the ones you do not know yet.'));

    const tabs = ui.segmented('View', [{ value: 'library', label: 'Library' }, { value: 'cards', label: 'Flashcards' }], state.tab, (v) => { state.tab = v; draw(); });

    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by category' });
    const chipDefs = [['all', 'All'], ...Object.entries(CAS.categories).map(([k, v]) => [k, v.label])];
    chipDefs.forEach(([key, label]) => {
      const c = h('button', {
        type: 'button', class: 'chip' + (key === state.cat ? ' on' : ''), 'aria-pressed': String(key === state.cat),
        onClick: () => {
          state.cat = key;
          chips.querySelectorAll('.chip').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
          c.classList.add('on'); c.setAttribute('aria-pressed', 'true');
          draw();
        },
      }, label);
      chips.append(c);
    });

    page.append(h('div', { class: 'toolbar' }, tabs), chips, body);
    draw();
    return page;

    function filtered() {
      const q = state.query.trim().toLowerCase();
      return CAS.brevity.filter((b) => (state.cat === 'all' || b.cat === state.cat)
        && (!q || b.term.toLowerCase().includes(q) || b.def.toLowerCase().includes(q)));
    }

    function draw() {
      keyHandler = null;
      body.replaceChildren(state.tab === 'library' ? library() : flashcards());
    }

    /* ---------- Library ---------- */
    function library() {
      const list = h('div', { class: 'term-list' });
      const count = h('p', { class: 'muted', 'aria-live': 'polite' });
      const search = h('input', {
        type: 'search', class: 'input', placeholder: 'Search terms or meanings…', 'aria-label': 'Search brevity codes', value: state.query,
        onInput: (e) => { state.query = e.target.value; fill(); },
      });

      function fill() {
        const rows = filtered();
        count.textContent = `${rows.length} of ${CAS.brevity.length} shown`;
        list.replaceChildren(...(rows.length
          ? rows.map((b) => h('article', { class: 'term-card' },
            h('div', { class: 'term-top' }, h('h3', { class: 'mono' }, b.term), ui.badge(CAS.categories[b.cat].label)),
            h('p', null, b.def),
            b.ex ? h('p', { class: 'example' }, b.ex) : null))
          : [h('p', { class: 'empty' }, 'No matches. Try a different search or category.')]));
      }
      fill();
      return h('div', null, search, count, list);
    }

    /* ---------- Flashcards ---------- */
    function flashcards() {
      const known = new Set(CAS.progress.get().cards.known);
      let deck = shuffle(filtered());
      let i = 0;
      let flipped = false;

      const wrap = h('div', { class: 'cards-wrap' });
      const controls = h('div', { class: 'toolbar' },
        h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', onChange: (e) => { state.reverse = e.target.checked; draw(); } }),
          h('span', null, 'Show meaning first')),
        h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', id: 'only-unknown', onChange: rebuild }),
          h('span', null, 'Hide cards I know')),
        h('button', { class: 'btn small ghost', type: 'button', onClick: () => { deck = shuffle(deck); i = 0; flipped = false; show(); } }, 'Shuffle'));
      controls.querySelector('input').checked = state.reverse;

      function rebuild() {
        const hide = controls.querySelector('#only-unknown').checked;
        deck = shuffle(filtered().filter((b) => !hide || !known.has(b.id)));
        i = 0; flipped = false; show();
      }

      function mark(isKnown) {
        const card = deck[i];
        if (!card) return;
        if (isKnown) known.add(card.id); else known.delete(card.id);
        CAS.progress.update((p) => { p.cards.known = [...known]; });
        i += 1; flipped = false; show();
      }

      function flip() { flipped = !flipped; show(); }

      function show() {
        if (!deck.length) { wrap.replaceChildren(h('p', { class: 'empty' }, 'No cards match this filter.')); return; }
        if (i >= deck.length) {
          const got = deck.filter((b) => known.has(b.id)).length;
          wrap.replaceChildren(h('div', { class: 'panel center' },
            h('h2', null, 'Deck complete'),
            h('p', null, `You marked ${got} of ${deck.length} cards as known.`),
            h('button', { class: 'btn primary', type: 'button', onClick: rebuild }, 'Go again')));
          return;
        }
        const card = deck[i];
        const front = state.reverse ? card.def : card.term;
        const back = state.reverse ? card.term : card.def;
        const faceCls = state.reverse ? 'face def' : 'face term';
        const flashcard = h('button', {
          class: 'flashcard' + (flipped ? ' flipped' : ''), type: 'button', onClick: flip,
          'aria-label': flipped ? `Answer: ${back}. Press to hide.` : `Card ${i + 1} of ${deck.length}: ${front}. Press to reveal.`,
        },
          h('span', { class: 'fc-cat' }, CAS.categories[card.cat].label),
          h('span', { class: faceCls }, flipped ? back : front),
          flipped && card.ex && !state.reverse ? h('span', { class: 'example' }, card.ex) : null,
          h('span', { class: 'fc-hint' }, flipped ? 'Click to flip back' : 'Click or press Space to reveal'));

        wrap.replaceChildren(
          h('div', { class: 'cards-meta' },
            h('span', null, `Card ${i + 1} / ${deck.length}`),
            h('span', null, `${[...known].filter((id) => CAS.brevity.some((b) => b.id === id)).length} known overall`)),
          ui.meter(ui.pct(i, deck.length), `Deck progress ${i} of ${deck.length}`),
          flashcard,
          h('div', { class: 'actions center' },
            h('button', { class: 'btn', type: 'button', onClick: () => mark(false) }, '← Review again'),
            h('button', { class: 'btn primary', type: 'button', onClick: () => mark(true) }, 'Got it →')));
        flashcard.focus({ preventScroll: true });
      }

      keyHandler = (e) => {
        if (/input|textarea|select/i.test(e.target.tagName)) return;
        if (e.key === 'ArrowRight') { mark(true); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { mark(false); e.preventDefault(); }
      };

      show();
      return h('div', null, controls, wrap, h('p', { class: 'muted small' }, 'Keyboard: Space reveals · → got it · ← review again.'));
    }
  };
})();
