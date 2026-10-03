import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const moduleUrl=new URL('../tools/publish-wip.mjs',import.meta.url);
// Build the complete publication input without retaining source-document files.
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'corex-publish-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const d of ['assets','tools','tests','docs','synced-configs','.github'])fs.mkdirSync(path.join(root,d));
 for(const f of ['index.html','reference.html','README.md','SETUP.md','.gitignore','.gitattributes','.nojekyll','PUBBLICA-WIP.cmd','Publish-Wip.ps1'])fs.writeFileSync(path.join(root,f),'test');
 return root;
}
function fakeRunner(settings={}){
 const calls=[];let created=false;let pagesCreated=!settings.pagesMissing;
 const run=(cmd,args,options={})=>{
  calls.push({cmd,args:[...args],options});let stdout='';let status=0;let stderr='';
  if(cmd==='gh' && args[0]==='api'){
   const endpoint=args[1];
   if(endpoint==='user')stdout=JSON.stringify({login:settings.login||'IceWolf23X',id:87717724});
   else if(endpoint==='repos/IceWolf23X/CoreChatX-WebSite-wip' && !args.includes('--method')){
    if(created||settings.exists)stdout=JSON.stringify({full_name:'IceWolf23X/CoreChatX-WebSite-wip',private:false});
    else {status=1;stderr='gh: Not Found (HTTP 404)';}
   } else if(endpoint.endsWith('/pages')){
    if(args.includes('POST'))pagesCreated=true;
    if(!pagesCreated && !args.includes('--method')) {status=1;stderr='gh: Not Found (HTTP 404)';}
    else if(!args.includes('--method'))stdout=JSON.stringify({html_url:'https://icewolf23x.github.io/CoreChatX-WebSite-wip/',build_type:'workflow',https_enforced:true});
   }
  }
  if(cmd==='gh' && args[0]==='repo' && args[1]==='create')created=true;
  if(cmd==='git' && args.includes('status'))stdout='A index.html';
  if(cmd==='git' && args.includes('diff') && args.includes('--name-only'))stdout='index.html\nassets/example.js';
  if(cmd==='git' && args.includes('push') && settings.pushFailure){status=1;stderr='write denied';}
  if(cmd==='gh' && args[0]==='run' && args[1]==='list'){
   const dispatch=calls.find(c=>c.cmd==='gh'&&c.args[0]==='workflow'&&c.args[1]==='run');
   const id=dispatch.args.find(a=>a.startsWith('request_id=')).split('=')[1];
   stdout=JSON.stringify([{databaseId:77,displayTitle:'Pages - '+id,status:'completed',conclusion:settings.conclusion||'success',url:'https://github.com/IceWolf23X/CoreChatX-WebSite-wip/actions/runs/77'}]);
  }
  return {status,stdout,stderr};
 };
 return {run,calls};
}
test('Publisher script exists',()=>assert.equal(fs.existsSync(moduleUrl),true,'Missing publish-wip.mjs'));

// A fresh package must publish directly through Node without optional local Windows shortcuts.
test('Direct Node publication does not require the Windows launchers',async(t)=>{
 const {publish}=await import(moduleUrl);const root=fixture(t);const fake=fakeRunner();
 for(const file of ['PUBBLICA-WIP.cmd','Publish-Wip.ps1'])fs.unlinkSync(path.join(root,file));
 // External provisioning is simulated; the real publisher still validates the package on disk.
 const result=await publish(root,{run:fake.run,log:()=>{},sleep:async()=>{}});
 assert.equal(result.runId,77);
 assert.equal(result.pagesUrl,'https://icewolf23x.github.io/CoreChatX-WebSite-wip/');
});

test('Wrong GitHub user is rejected before creating or pushing',async(t)=>{
 const {publish}=await import(moduleUrl);const root=fixture(t);const fake=fakeRunner({login:'other-account'});
 await assert.rejects(publish(root,{run:fake.run,log:()=>{}}),/IceWolf23X/);
 assert.equal(fake.calls.some(c=>c.args.includes('create')||c.args.includes('push')),false);
});
test('Existing repository is never overwritten on a fresh install',async(t)=>{
 const {publish}=await import(moduleUrl);const root=fixture(t);const fake=fakeRunner({exists:true});
 await assert.rejects(publish(root,{run:fake.run,log:()=>{}}),/already exists|esiste/i);
 assert.equal(fake.calls.some(c=>c.args.includes('push')),false);
});
test('Successful workflow configures public repository, main, Pages and checks its own run',async(t)=>{
 const {publish}=await import(moduleUrl);const root=fixture(t);const fake=fakeRunner();
 const result=await publish(root,{run:fake.run,log:()=>{},sleep:async()=>{}});
 const create=fake.calls.find(c=>c.args[0]==='repo'&&c.args[1]==='create');
 assert.ok(create.args.includes('--public'));
 assert.ok(fake.calls.some(c=>c.args.includes('build_type=workflow')));
 assert.ok(fake.calls.some(c=>c.args.includes('https_enforced=true')));
 assert.ok(fake.calls.some(c=>c.args[0]==='variable'&&c.args.includes('COREX_PAGES_ENABLED')));
 assert.equal(fake.calls.some(c=>c.args.includes('--force')||c.args.includes('delete')),false);
 assert.equal(result.runId,77);assert.equal(result.pagesUrl,'https://icewolf23x.github.io/CoreChatX-WebSite-wip/');
});
test('Push failure never proceeds to configure Pages or report a deployment',async(t)=>{
 const {publish}=await import(moduleUrl);const root=fixture(t);const fake=fakeRunner({pushFailure:true});
 await assert.rejects(publish(root,{run:fake.run,log:()=>{}}),/write denied/);
 assert.equal(fake.calls.some(c=>c.args.includes('build_type=workflow')),false);
});
test('Failed deployment is reported as failure rather than success',async(t)=>{
 const {publish}=await import(moduleUrl);const root=fixture(t);const fake=fakeRunner({conclusion:'failure'});
 await assert.rejects(publish(root,{run:fake.run,log:()=>{},sleep:async()=>{}}),/failure/);
});

test('A new Pages site is created with POST before HTTPS configuration',async(t)=>{
 const {publish}=await import(moduleUrl);const root=fixture(t);const fake=fakeRunner({pagesMissing:true});
 await publish(root,{run:fake.run,log:()=>{},sleep:async()=>{}});
 const post=fake.calls.findIndex(c=>c.args.includes('build_type=workflow') && c.args.includes('POST'));
 const https=fake.calls.findIndex(c=>c.args.includes('https_enforced=true'));
 assert.ok(post>=0 && https>post);
});
