import gallery from '../assets/js/core/preview-gallery.js';
import github from '../assets/js/core/github-releases.js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { CONFIG_FILES } from '../tools/config-sync-map.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({ window: {} });
for (const rel of [
  'assets/js/data/site-config.js',
  'assets/js/data/ui-text.js',
  'assets/js/data/landing-content.js',
  'assets/js/data/docs-content.js',
  'assets/js/generated/config-files.js',
  'assets/js/generated/releases.js'
]) {
  vm.runInContext(readFileSync(resolve(root, rel), 'utf8'), context, { filename: rel });
}
const site=context.window.COREX_SITE, ui=context.window.COREX_UI, landing=context.window.COREX_LANDING;
const docs=context.window.COREX_DOCS, configs=context.window.COREX_CONFIG_FILES, releases=context.window.COREX_RELEASES;
function assert(value, message){if(!value)throw new Error(message);}

assert(site && site.brand && site.brand.product, 'site-config.js must define a product');
assert(ui && ui.docs && ui.search && ui.code, 'ui-text.js is incomplete');
assert(landing && Array.isArray(landing.order), 'landing-content.js order missing');
landing.order.forEach(key=>assert(landing[key], `Landing section '${key}' is listed but missing`));
assert(Array.isArray(docs.articles) && docs.articles.length >= 60, 'Documentation article set is unexpectedly small');
assert(new Set(docs.articles.map(a=>a.id)).size === docs.articles.length, 'Duplicate documentation article id');

const articleIds=new Set(docs.articles.map(a=>a.id));
const manifestIds=new Set(CONFIG_FILES.map(f=>f.id));
assert(Object.keys(configs.files).length===CONFIG_FILES.length, 'Generated config bundle does not match manifest count');
for(const item of CONFIG_FILES){
  assert(existsSync(resolve(root,item.target)),`Missing synced config file: ${item.target}`);
  assert(articleIds.has(item.article),`Manifest article missing: ${item.article}`);
  const generated=configs.files[item.id];
  assert(generated,`Generated bundle missing: ${item.id}`);
  const raw=readFileSync(resolve(root,item.target),'utf8').replace(/\r\n/g,'\n');
  assert(generated.content===raw,`Generated bundle content differs from ${item.target}`);
  const hash=createHash('sha256').update(raw).digest('hex');
  assert(generated.sha256===hash,`SHA-256 mismatch for ${item.id}`);
}
assert(releases && Array.isArray(releases.releases), 'Generated release bundle missing');
assert(releases.schemaVersion === 2 && releases.provider === 'github', 'Snapshot must use public GitHub release data');
assert(releases.repository.toLowerCase() === github.repository(site.releases).toLowerCase(), 'Snapshot belongs to another repository; refresh it');
for(const release of releases.releases){
  assert(release.draft === false, 'Draft release must never be bundled');
  assert(typeof release.published_at === 'string', 'Missing GitHub publication timestamp');
  assert(!('changelogHtml' in release), 'Do not trust pre-rendered HTML from release data');
}
const normalizedReleases = github.normalizeReleases(releases.releases, site.releases);
for(const release of normalizedReleases.releases){
  for(const file of [release.paper,release.velocity]){
    if(!file.exists) continue;
    assert(file.path.startsWith('https://github.com/'), 'Download must point to a public GitHub asset');
    assert(!file.sha256 || /^[a-f0-9]{64}$/.test(file.sha256), 'Invalid SHA-256 supplied by GitHub');
  }
}
for(const article of docs.articles){
  if(!article.configFile)continue;
  assert(article.configFile.type==='config-file',`Unexpected config component type in ${article.id}`);
  assert(manifestIds.has(article.configFile.id),`Unknown config file id in ${article.id}: ${article.configFile.id}`);
  assert((article.bodyHtml||'').includes(`data-config-file="${article.configFile.id}"`),`Config mount missing from ${article.id}`);
}

for(const asset of [site.brand.logo,site.brand.favicon]){
  assert(asset && existsSync(resolve(root,asset)),`Configured asset does not exist: ${asset}`);
}
const previewKey=landing.hero?.preview?.assetKey || 'heroPreview';
for(const image of gallery.normalizeSlides(site.assets?.[previewKey])) {
  if (/^(?:https?:|data:)/i.test(image.src)) continue;
  const assetPath=decodeURIComponent(image.src.split(/[?#]/)[0]);
  assert(existsSync(resolve(root,assetPath)),`Gallery image asset does not exist: ${image.src}`);
}

const index=readFileSync(resolve(root,'index.html'),'utf8');
assert(index.includes('<div id="app-root"></div>'),'index.html is not a theme shell');
assert(!index.includes('One suite, not ten plugins.'),'Landing copy leaked back into index.html');
assert(index.includes('assets/js/data/landing-content.js'),'index.html does not load landing-content.js');
assert(index.includes('assets/js/data/docs-content.js'),'index.html does not load docs-content.js');
assert(index.includes('assets/js/generated/config-files.js'),'index.html does not load generated config bundle');
assert(index.includes('assets/js/generated/releases.js'),'index.html does not load release fallback');
assert(index.includes('assets/js/core/github-releases.js'),'index.html does not load public GitHub provider');
assert(index.includes('assets/js/core/releases-core.js'),'index.html does not load safe release formatter');

console.log(`Theme validation passed: ${docs.articles.length} articles, ${CONFIG_FILES.length} synchronized config sources, ${releases.releases.length} releases.`);
