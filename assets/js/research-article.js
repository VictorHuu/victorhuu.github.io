/* On-page navigation and MathJax for published research notes. */
(function () {
  'use strict';
  function init() {
    var article = document.querySelector('.rn-article');
    var prose = article && article.querySelector('.rn-prose');
    if (!prose) return;
    var toc = article.querySelector('[data-note-toc]');
    if (toc) {
      var list = toc.querySelector('ol');
      prose.querySelectorAll('h2, h3').forEach(function (heading, i) {
        if (!heading.id) heading.id = 'note-section-' + (i + 1);
        var item = document.createElement('li');
        if (heading.tagName === 'H3') item.className = 'rn-toc-subsection';
        var link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;
        item.appendChild(link);
        list.appendChild(item);
      });
      toc.hidden = !list.children.length;
      toc.open = window.matchMedia('(min-width: 901px)').matches;
    }
    prose.querySelectorAll('table').forEach(function (table, i) {
      var wrap = document.createElement('div');
      wrap.className = 'rn-table-scroll';
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Table ' + (i + 1) + ': scroll horizontally if needed');
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
    if (article.dataset.math !== 'true') return;

    // Support both legacy math/tex nodes and current Kramdown TeX delimiters.
    // textContent preserves TeX without interpreting it as HTML.
    var sources = prose.querySelectorAll('script[type^="math/tex"]');
    sources.forEach(function (node) {
      var display = /mode\s*=\s*display/.test(node.type);
      var replacement = document.createElement(display ? 'div' : 'span');
      replacement.className = display ? 'rn-math-block' : 'rn-math-inline';
      replacement.textContent = (display ? '\\[' : '\\(') + node.textContent + (display ? '\\]' : '\\)');
      node.parentNode.replaceChild(replacement, node);
    });
    var status = article.querySelector('.rn-math-status');
    function fail(error) {
      article.dataset.mathState = 'error';
      if (status) {
        status.hidden = false;
        status.textContent = '公式排版暂未加载成功，当前保留 TeX 原文。请检查网络后刷新。';
      }
      console.error('Research-note math rendering:', error);
    }
    window.MathJax = {
      tex: { inlineMath: [['\\(', '\\)'], ['$', '$']], displayMath: [['\\[', '\\]'], ['$$', '$$']], processEscapes: true },
      svg: { fontCache: 'global' },
      options: { enableMenu: false },
      startup: { typeset: false }
    };
    article.dataset.mathState = 'loading';
    // Pin the renderer so the tested build cannot change underneath a post.
    var urls = [
      'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js',
      'https://unpkg.com/mathjax@3.2.2/es5/tex-svg.js'
    ];
    function load(index) {
      var script = document.createElement('script');
      script.src = urls[index];
      script.async = true;
      script.onload = function () {
        if (!window.MathJax.startup || !window.MathJax.startup.promise) {
          fail(new Error('MathJax startup unavailable'));
          return;
        }
        window.MathJax.startup.promise.then(function () {
          return window.MathJax.typesetPromise([prose]);
        }).then(function () {
          if (prose.querySelector('[data-mml-node="merror"], mjx-merror')) {
            throw new Error('Invalid TeX expression');
          }
          // Current Kramdown emits delimiters rather than legacy script nodes.
          // Give every rendered display formula a bounded scroll container.
          prose.querySelectorAll('mjx-container[display="true"]').forEach(function (math) {
            if (math.closest('.rn-math-block')) return;
            var parent = math.parentElement;
            var standalone = parent !== prose && Array.prototype.every.call(parent.childNodes, function (node) {
              return node === math || (node.nodeType === 3 && !node.textContent.trim());
            });
            if (standalone) {
              parent.classList.add('rn-math-block');
            } else {
              var wrap = document.createElement('div');
              wrap.className = 'rn-math-block';
              parent.insertBefore(wrap, math);
              wrap.appendChild(math);
            }
          });
          article.dataset.mathState = 'ready';
          article.dataset.mathRendered = String(prose.querySelectorAll('mjx-container').length);
        }).catch(fail);
      };
      script.onerror = function () {
        script.remove();
        if (index + 1 < urls.length) load(index + 1);
        else fail(new Error('Both MathJax CDN requests failed'));
      };
      document.head.appendChild(script);
    }
    load(0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
