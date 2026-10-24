/* Responsive TOC; the entire index remains usable without JavaScript. */
(function () {
  'use strict';
  function initContents() {
    var contents = document.querySelector('.rn-contents');
    if (!contents || !window.matchMedia) return;
    var desktop = window.matchMedia('(min-width: 901px)');
    function syncContents() { contents.open = desktop.matches; }
    syncContents();
    if (desktop.addEventListener) desktop.addEventListener('change', syncContents);
    else if (desktop.addListener) desktop.addListener(syncContents);
    contents.addEventListener('toggle', function () {
      if (desktop.matches && !contents.open) contents.open = true;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initContents, { once: true });
  else initContents();
})();
