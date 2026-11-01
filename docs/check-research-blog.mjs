/** Validate the actual Jekyll output, not a stand-in Markdown renderer. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';

const site = resolve(process.env.SITE_ROOT || '_site');
const source = resolve(process.env.SOURCE_ROOT || '.');
const reports = resolve(process.env.REPORT_DIR || 'test-results');
await mkdir(reports, { recursive: true });
const md = await readFile(resolve(source, '_pages/blog/cocos.md'), 'utf8');
const expectedMath = [...md.matchAll(/\$\$([\s\S]+?)\$\$/g)].length;
const expectedDisplay = [...md.matchAll(/^\$\$\n[\s\S]*?\n\$\$/gm)].length;
assert.equal(expectedMath, 27, 'Unexpected article math-source count');
assert.equal(expectedDisplay, 5, 'Unexpected display-math count');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = resolve(site, '.' + decodeURIComponent(url.pathname));
    if (file !== site && !file.startsWith(site + sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const results = { expectedMath, expectedDisplay, checks: [] };
try {
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: 'light' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const response = await page.goto(base + '/blogs/cocos/', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('.rn-article')?.dataset.mathState === 'ready', null, { timeout: 60000 });
    const state = await page.evaluate(() => {
      const article = document.querySelector('.rn-article');
      const prose = article.querySelector('.rn-prose');
      const links = [...document.querySelectorAll('[data-note-toc] a')];
      return {
        lang: document.documentElement.lang,
        math: prose.querySelectorAll('mjx-container').length,
        display: prose.querySelectorAll('mjx-container[display="true"]').length,
        mathErrors: prose.querySelectorAll('[data-mml-node="merror"], mjx-merror').length,
        legacyMath: prose.querySelectorAll('script[type^="math/tex"]').length,
        headings: prose.querySelectorAll('h2, h3').length,
        tocLinks: links.length,
        brokenAnchors: links.filter(a => !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a => a.hash),
        tables: prose.querySelectorAll('.rn-table-scroll table').length,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        rawDelimiters: /\$\$|\\\(|\\\[/.test(prose.innerText),
        mathBoxes: [...prose.querySelectorAll('mjx-container svg')].every(svg => svg.getBoundingClientRect().width > 0 && svg.getBoundingClientRect().height > 0)
      };
    });
    assert.equal(state.lang, 'zh-CN');
    assert.equal(state.math, expectedMath);
    assert.equal(state.display, expectedDisplay);
    assert.equal(state.mathErrors, 0);
    assert.equal(state.legacyMath, 0);
    assert.equal(state.tocLinks, state.headings);
    assert.deepEqual(state.brokenAnchors, []);
    assert.equal(state.tables, 4);
    assert.equal(state.overflow, false, `Page overflow at ${width}px`);
    assert.equal(state.rawDelimiters, false);
    assert.equal(state.mathBoxes, true);
    await page.screenshot({ path: resolve(reports, `cocos-${width}-top.png`) });
    await page.locator('.rn-math-block').nth(2).scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(reports, `cocos-${width}-formula.png`) });
    if (width <= 390) {
      const table = page.locator('.rn-table-scroll').first();
      await table.scrollIntoViewIfNeeded();
      const scrolls = await table.evaluate(el => { el.scrollLeft = el.scrollWidth; return el.scrollLeft > 0; });
      assert.equal(scrolls, true, 'Mobile table must scroll inside its own container');
      await page.screenshot({ path: resolve(reports, `cocos-${width}-table.png`) });
    }
    await page.locator('.rn-theme').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.screenshot({ path: resolve(reports, `cocos-${width}-dark.png`) });
    await page.locator('[data-note-toc]').evaluate(el => el.open = true);
    await page.locator('[data-note-toc] a').last().click();
    assert.ok(new URL(page.url()).hash, 'TOC link did not navigate');
    assert.deepEqual(errors, [], `Browser errors at ${width}px`);
    results.checks.push({ width, ...state, errors });
    await context.close();
  }
  const page = await browser.newPage();
  await page.goto(base + '/blogs/', { waitUntil: 'networkidle' });
  assert.ok(await page.locator('.rn-note-published[href="/blogs/cocos/"]').count());
  assert.equal(await page.locator('.rn-note-published .rn-note-excerpt').count(), 1);
  await page.locator('.rn-note-published[href="/blogs/cocos/"]').click();
  assert.ok(page.url().endsWith('/blogs/cocos/'));
  results.indexLink = true;
  results.status = 'PASS';
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  results.status = 'FAIL';
  results.error = String(error.stack || error);
  throw error;
} finally {
  await writeFile(resolve(reports, 'report.json'), JSON.stringify(results, null, 2));
  await browser.close();
  await new Promise(r => server.close(r));
}
