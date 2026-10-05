/**
 * Generic list filter. Markup:
 *   <div data-list-filter data-noun="item" data-noun-plural="items">
 *     <button data-filter="category" data-value="all" aria-pressed="true">…
 *     <select data-filter="year">…
 *     <li data-item data-category="talk" data-year="2025">…
 *     <p data-empty hidden>…   <p data-result-count aria-live="polite">
 */
for (const root of document.querySelectorAll<HTMLElement>('[data-list-filter]')) {
  const noun = root.dataset.noun ?? 'item';
  const plural = root.dataset.nounPlural ?? `${noun}s`;
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-item]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-filter]'));
  const selects = Array.from(root.querySelectorAll<HTMLSelectElement>('select[data-filter]'));
  const empty = root.querySelector<HTMLElement>('[data-empty]');
  const count = root.querySelector<HTMLElement>('[data-result-count]');
  const state: Record<string, string> = {};

  const apply = () => {
    let shown = 0;
    for (const item of items) {
      const ok = Object.entries(state).every(([key, value]) => value === 'all' || (item.dataset[key] ?? '').split(' ').includes(value));
      item.hidden = !ok;
      if (ok) shown++;
    }
    // Hide group headings (e.g. years) whose items are all filtered out.
    for (const group of root.querySelectorAll<HTMLElement>('[data-group]')) {
      group.hidden = !group.querySelector('[data-item]:not([hidden])');
    }
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = `${shown} ${shown === 1 ? noun : plural} shown`;
  };

  for (const button of buttons) {
    const key = button.dataset.filter!;
    state[key] ??= 'all';
    button.addEventListener('click', () => {
      state[key] = button.dataset.value!;
      for (const b of buttons) if (b.dataset.filter === key) b.setAttribute('aria-pressed', String(b === button));
      apply();
    });
  }
  for (const select of selects) {
    const key = select.dataset.filter!;
    state[key] = select.value;
    select.addEventListener('change', () => {
      state[key] = select.value;
      apply();
    });
  }
}
