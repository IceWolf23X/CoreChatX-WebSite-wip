import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const moduleUrl = new URL('../tools/prepare-pages.mjs', import.meta.url);
// Build a minimal site and private test files without any source-document directory.
async function fixture(t) {
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'corex-pages-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 for(const dir of ['assets/js/data','synced-configs/paper','.sync/plugin','.git','docs'])await fs.mkdir(path.join(root,dir),{recursive:true});
 await fs.writeFile(path.join(root,'index.html'),'<div id="app-root"></div>');
 await fs.writeFile(path.join(root,'reference.html'),'<main></main>');
 await fs.writeFile(path.join(root,'assets/js/data/site-config.js'),'window.COREX_SITE = {};');
 await fs.writeFile(path.join(root,'synced-configs/paper/config.yml'),'debug: false\n');
 await fs.writeFile(path.join(root,'.sync/plugin/private.java'),'private source');
 await fs.writeFile(path.join(root,'.git/config'),'credentials');
 await fs.writeFile(path.join(root,'docs/private-test.md'),'not website runtime');
 return root;
}
test('Pages publisher exists before deployment can be enabled',async()=>{
 assert.equal(await fs.access(moduleUrl).then(()=>true,()=>false),true,'Missing prepare-pages.mjs');
});
test('Pages build publishes only the intended static files',async(t)=>{
 const {preparePages}=await import(moduleUrl);const root=await fixture(t);
 const output=await preparePages(root);
 assert.equal(await fs.readFile(path.join(output,'synced-configs/paper/config.yml'),'utf8'),'debug: false\n');
 for(const forbidden of ['.sync','.git','docs','tools'])assert.equal(await fs.access(path.join(output,forbidden)).then(()=>true,()=>false),false);
 assert.equal(await fs.access(path.join(output,'.nojekyll')).then(()=>true,()=>false),true);
});
test('Pages build refuses symlinks rather than traversing private source',async(t)=>{
 const {preparePages}=await import(moduleUrl);const root=await fixture(t);
 try { await fs.symlink(path.join(root,'.sync/plugin'),path.join(root,'assets/leak')); }
 catch(error) { if(process.platform==='win32' && ['EPERM','EACCES'].includes(error.code)) { t.skip('Windows account cannot create symlinks; checked on Linux CI.'); return; } throw error; }
 await assert.rejects(preparePages(root),/symbolic link/i);
});
test('Pages build refuses a secret file hidden inside assets',async(t)=>{
 const {preparePages}=await import(moduleUrl);const root=await fixture(t);
 await fs.writeFile(path.join(root,'assets/.env'),'TOKEN=do-not-publish');
 await assert.rejects(preparePages(root),/private|forbidden/i);
});
test('Failed preflight preserves an existing Pages artifact',async(t)=>{
 const {preparePages}=await import(moduleUrl);const root=await fixture(t);
 await fs.mkdir(path.join(root,'_site'));await fs.writeFile(path.join(root,'_site/keep'),'old-good-site');
 await fs.writeFile(path.join(root,'assets/client.pem'),'private');
 await assert.rejects(preparePages(root),/private|forbidden/i);
 assert.equal(await fs.readFile(path.join(root,'_site/keep'),'utf8'),'old-good-site');
});
