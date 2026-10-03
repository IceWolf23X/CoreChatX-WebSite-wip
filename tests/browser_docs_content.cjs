/** Verify the real offline entrypoints after rebuilding the per-article HTML bundle. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { expect } = require('playwright/test');

/** Exercise article navigation, compiled prose, config mounts, search and the full reference. */
async function run() {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const index = pathToFileURL(path.join(root, 'index.html')).href;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', offline: true });
    const errors = [], external = [];
    // Every documentation interaction must work without external requests.
    await context.route(/^https?:\/\//, route => { external.push(route.request().url()); return route.abort(); });
    const page = await context.newPage();
    // Collect runtime failures from both independent browser entrypoints.
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(index);
    await expect(page.locator('#landing-view')).toBeVisible();
    // Read the actual hydrated catalog that the wiki and search consume.
    const articles = await page.evaluate(() => window.COREX_DOCS.articles.map(article => ({ id: article.id, title: article.title, config: !!article.configFile })));
    assert.equal(articles.length, 67);

    // Route through the real app rather than assigning article markup in the test.
    async function navigate(id) { await page.evaluate(route => window.CCX.navigate(route), '#/docs/' + id); }
    let configPages = 0;
    for (const article of articles) {
      await navigate(article.id);
      await expect(page.locator('#article-title')).toHaveText(article.title);
      // Every authored heading must survive hydration and article layout transformations.
      assert.equal(await page.evaluate(id => {
        const source = window.COREX_DOCS.articles.find(article => article.id === id);
        const original = new DOMParser().parseFromString(source.bodyHtml, 'text/html');
        const expected = Array.from(original.querySelectorAll('h2[id], h3[id]'), heading => heading.id);
        const rendered = Array.from(document.querySelectorAll('#article-body [id]'), heading => heading.id);
        return expected.every(heading => rendered.includes(heading));
      }, article.id), true, article.id + ': lost article heading');
      if (article.config) {
        configPages++;
        await expect(page.locator('#article-body .config-synced-file')).toHaveCount(1);
        assert.ok((await page.locator('#article-body .config-synced-file code').textContent()).length > 0);
      }
    }
    assert.equal(configPages, 20);
    await navigate('paper/files');
    await expect(page.locator('#article-body .doc-card')).toHaveCount(15);

    await navigate('overview');
    await expect(page.locator('#article-body .doc-card')).toHaveCount(24);
    await navigate('instructions');
    await expect(page.locator('#article-body .doc-card')).toHaveCount(43);

    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-dialog')).toBeVisible();
    await page.locator('#search-input').fill('discord-images.enabled');
    await expect(page.locator('.search-result').first()).toHaveAttribute('href', /chatitems/);
    await page.keyboard.press('Enter');
    await expect(page.locator('#article-title')).toHaveText('chatitems.yml');
    await page.keyboard.press('Control+k');
    await page.locator('#search-input').fill('complete communication suite');
    await expect(page.locator('.search-result').first()).toHaveAttribute('href', /overview\/introduction/);
    await page.keyboard.press('Escape');

    for (const width of [390, 1440, 3440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const id of ['overview', 'instructions', 'paper/chat-yml']) {
        await navigate(id);
        // Wait for responsive layout before checking its actual geometry.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, width + ': ' + id);
      }
    }

    await page.goto(pathToFileURL(path.join(root, 'reference.html')).href);
    await expect(page.locator('.reference-article')).toHaveCount(67);
    await expect(page.locator('.config-synced-file')).toHaveCount(20);
    // The independent reference must retain the same article identity and ordering as the wiki.
    assert.deepEqual(await page.locator('.reference-article').evaluateAll(nodes => nodes.map(node => node.dataset.articleId)), articles.map(article => article.id));
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(JSON.stringify({ status: 'PASS', mode: 'real file://, offline', articles: articles.length, configPages, referenceArticles: 67, javascriptErrors: errors.length, externalRequests: external.length, widths: [390, 1440, 3440] }));
  } finally { await browser.close(); }
}

// Report browser or assertion failures through a nonzero process exit status.
run().catch(error => { console.error(error); process.exitCode = 1; });
