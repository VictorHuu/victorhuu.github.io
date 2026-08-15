(function () {
  'use strict';

  var STORAGE_KEY = 'ox-theme';
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute('data-theme') || 'light';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* private mode */ }
    updateButton(theme);
  }

  function updateButton(theme) {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    btns.forEach(function (b) {
      var icon = b.querySelector('.ox-theme-toggle__icon');
      if (icon) icon.textContent = theme === 'dark' ? '☀' : '🌙';
      b.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function toggle() {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', toggle);
    });
    updateButton(currentTheme());
  });
})();