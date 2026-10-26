'use strict';
(function () {
  const search = document.getElementById('guide-search');
  const sections = [...document.querySelectorAll('[data-guide-section]')];
  function filter() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const section of sections) {
      section.hidden = Boolean(query) && !section.textContent.toLocaleLowerCase().includes(query);
      if (!section.hidden) visible++;
    }
    document.getElementById('guide-search-status').textContent = query ? visible + ' / ' + sections.length + ' 个任务匹配；公共规则始终保留。' : '';
  }
  search.addEventListener('input', filter);
  document.querySelector('[data-print]').addEventListener('click', () => {
    for (const section of sections) section.hidden = false;
    window.print();
    filter();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.hash.slice(1));
    if (target) { target.hidden = false; target.closest('[data-guide-section]')?.removeAttribute('hidden'); }
  });
})();
