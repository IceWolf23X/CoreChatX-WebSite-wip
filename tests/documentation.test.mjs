import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Read documentation and interface data without loading the retired source documents.
function data() {
  const context = vm.createContext({ window: {} });
  for (const file of ['docs-content.js', 'ui-text.js', 'landing-content.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/data', file), 'utf8'), context);
  }
  return context.window;
}

// Exercise the real overview renderer with a minimal DOM sink for generated HTML.
function overviewHTML() {
  const nodes = new Map();
  const context = vm.createContext({ window: data(), document: {
    // Store text and markup assigned to each named rendering target.
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, {}); return nodes.get(id); },
    // Navigation state elements are unnecessary for this card-label regression.
    querySelectorAll() { return []; },
    // There is no active article link in the overview hub.
    querySelector() { return null; }
  } });
  context.window.COREX_SITE = { brand: { product: 'CoreChatX' } };
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/utils.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/docs.js'), 'utf8'), context);
  context.window.CCX_DOCS.render('overview');
  return nodes.get('article-body').innerHTML;
}

// Overview cards must retain their action label after provenance fields disappear.
test('overview cards select their action using article category', () => {
  const html = overviewHTML();
  assert.equal((html.match(/Read the overview/g) || []).length, 24);
  assert.doesNotMatch(html, /Reference notes/);
});

// The documentation remains complete while obsolete document provenance disappears.
test('documentation retains articles and config mounts without Markdown provenance', () => {
  const { COREX_DOCS: docs } = data();
  assert.equal(docs.articles.length, 67);
  assert.equal(docs.articles.filter(article => article.configFile).length, 20);
  assert.ok(!('sourceSnapshot' in docs.meta));
  for (const article of docs.articles) {
    for (const field of ['source', 'sourceTitle', 'sourceStart', 'sourceEnd']) assert.ok(!(field in article), article.id + ': ' + field);
  }
  assert.doesNotMatch(JSON.stringify(docs), /PLUGIN_[A-Z_]+\.md/);
});

// Article tools and shared footer navigation must expose the maintained HTML reference.
test('interface data no longer exposes source-document download controls', () => {
  const { COREX_UI: ui, COREX_LANDING: landing } = data();
  assert.ok(!('source' in ui.docs.articleTools));
  assert.ok(!('sourceBox' in ui.docs));
  assert.equal(ui.docs.articleTools.fullReference, 'Full reference');
  assert.equal(landing.footer.scopeLink.label, 'Documentation scope');
});

// Documentation scope URLs keep their existing anchors after replacing the provenance copy.
test('scope article keeps linked anchors and describes the current data model', () => {
  const { COREX_DOCS: docs } = data();
  const article = docs.articles.find(item => item.id === 'reference/source-notes');
  assert.equal(article.title, 'Documentation scope');
  for (const id of ['reference-snapshot', 'external-references', 'source-discrepancies', 'public-project-references', 'offline-behavior']) {
    assert.ok(article.bodyHtml.includes('id="' + id + '"'), 'Missing retained anchor ' + id);
  }
  assert.match(article.bodyHtml, /docs-content\.js/);
  assert.doesNotMatch(article.bodyHtml, /two Markdown|source files are included|supplied documents/i);
});

// Internal wiki links must still select an existing article or one of the two hubs.
test('article links remain valid after removing source-document references', () => {
  const { COREX_DOCS: docs } = data();
  const ids = new Set(['overview', 'instructions', ...docs.articles.map(article => article.id)]);
  for (const article of docs.articles) {
    for (const match of article.bodyHtml.matchAll(/<a\b[^>]*href="(#\/docs\/[^"~]+)(?:~[^"]*)?"/g)) {
      assert.ok(ids.has(match[1].slice('#/docs/'.length)), article.id + ' -> ' + match[1]);
    }
  }
});
