"""Browser integration of real website files with deterministic GitHub API responses.
No GitHub writes or real JAR downloads. Run: python tests/browser_github_releases.py
"""
import json, mimetypes, re, shutil, base64
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
REPO='IceWolf23X/CoreChatX-WebSite-wip'
ORIGIN='https://corex.test/'

def asset(name,digest=True):
 return dict(name=name,state='uploaded',size=5242880,digest=('sha256:'+'a'*64) if digest else None,
             browser_download_url=f'https://github.com/{REPO}/releases/download/v2026.4.0/{name}',download_count=10)
def release(tag='v2026.4.0',**kw):
 r=dict(tag_name=tag,name='CoreChatX '+tag,draft=False,prerelease=False,published_at='2026-10-02T09:00:00Z',
  body='# Changes\n\n- **Added** feature\n\n```yaml\nkey: true\n```\n\n<script>window.pwned=1</script>',
  html_url=f'https://github.com/{REPO}/releases/tag/{tag}',assets=[asset('papermc.jar'),asset('velocity.jar',False)])
 r.update(kw);return r
FIXTURE=[release(),release('v2026.5.0-beta.1',prerelease=True,body='',assets=[asset('velocity.jar')])]

def run():
 checks=[];errors=[]
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=shutil.which('chromium') or None)
  def scenario(api_body=FIXTURE,status=200,snapshot=None):
   ctx=b.new_context(viewport={'width':1440,'height':1000})
   mode={'status':status,'body':api_body}
   page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(5000)
   soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
   scripts=[x['src'] for x in soup.select('script[src]')]
   for x in soup.select('script[src]'):x.decompose()
   for el in soup.select('link[rel="stylesheet"]'):
    style=soup.new_tag('style');style.string=(ROOT/el['href']).read_text();el.replace_with(style)
   for el in soup.select('link[rel="icon"]'):el.decompose()
   page.set_content(str(soup))
   page.evaluate("""(mode)=>{window.__githubMode=mode;window.__githubCalls=[];
    window.fetch=async function(url,options){
     __githubCalls.push(url);
     if(options.headers.Authorization || options.credentials!=='omit')throw Error('unexpected credentials');
     if(!url.startsWith('https://api.github.com/repos/IceWolf23X/CoreChatX-WebSite-wip/releases'))throw Error('Unexpected URL');
     if(__githubMode.delayMs)await new Promise(resolve=>setTimeout(resolve,__githubMode.delayMs));
     if(__githubMode.status===0)throw TypeError('Offline test');
     return new Response(JSON.stringify(__githubMode.body),{status:__githubMode.status,
      headers:{'Content-Type':'application/json','x-ratelimit-remaining':__githubMode.status===403?'0':'50','retry-after':'60'}});
    };
   }""",mode)
   logo='data:image/png;base64,'+base64.b64encode((ROOT/'assets/img/corechatx-logo.png').read_bytes()).decode()
   for file in scripts:
    content=(ROOT/file).read_text()
    if snapshot is not None and file=='assets/js/generated/releases.js':content='window.COREX_RELEASES='+json.dumps(snapshot)+';'
    page.add_script_tag(content=content)
    if file.endswith('data/site-config.js'):page.evaluate('(logo)=>{COREX_SITE.brand.logo=logo;COREX_SITE.brand.favicon=logo;}',logo)
   return ctx,page,lambda:page.evaluate('__githubCalls'),mode
  ctx,page,calls,mode=scenario()
  assert not calls(),'The landing must not spend API quota.'
  page.evaluate("CCX.navigate('#/releases')")
  expect(page.locator('.release-version-line h2')).to_have_text('v2026.4.0')
  expect(page.locator('.release-list-item')).to_have_count(2)
  expect(page.locator('.release-file')).to_have_count(2)
  expect(page.locator('[data-copy-checksum]')).to_have_count(1)
  assert page.locator('.release-file a').first.get_attribute('href').startswith(f'https://github.com/{REPO}/releases/download/')
  assert page.locator('.release-file a[download]').count()==0,'Remote download filename is determined by GitHub.'
  expect(page.locator('.release-markdown h1')).to_have_text('Changes')
  assert page.evaluate('window.pwned') is None
  checks.append('lazy public API; metadata, sanitized changelog, real asset links and optional checksum')
  page.evaluate("CCX.navigate('#/releases/v2026.5.0-beta.1')")
  expect(page.locator('.release-channel')).to_have_text('Beta');expect(page.locator('.release-file')).to_have_count(1)
  expect(page.locator('.release-no-changelog')).to_be_visible();assert len(calls())==1
  page.evaluate("CCX.navigate('#/docs/overview')");expect(page.locator('#docs-view')).to_be_visible()
  page.evaluate("CCX.navigate('#/releases/v2026.5.0-beta.1')");expect(page.locator('.release-channel')).to_have_text('Beta');assert len(calls())==1
  checks.append('deep-link selection and route revisits without repeated API requests')
  for width,height in [(320,800),(375,812),(1440,1000),(1601,1000),(3440,1440),(3840,1080),(5120,1440),(7680,2160)]:
   page.set_viewport_size({'width':width,'height':height})
   for theme in ['light','dark']:
    page.evaluate('(t)=>COREX_APPLY_THEME(t)',theme)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,theme)
  checks.append('16 responsive release layouts in light/dark, 320 to 7680 px')
  page.set_viewport_size({'width':1440,'height':1000})
  page.evaluate("CCX.navigate('#/releases')");page.evaluate('__githubMode.body=[]')
  page.locator('[data-releases-refresh]').click();expect(page.locator('.release-empty h2')).to_have_text('No releases published yet.')
  assert page.locator('.release-file').count()==0
  checks.append('authoritative deletion removes stale releases and download buttons')
  ctx.close()
  snap=dict(schemaVersion=2,provider='github',repository=REPO,generatedAt='2026-10-02T08:00:00Z',releases=FIXTURE)
  for status in [0,403,404,500]:
   ctx,page,calls,mode=scenario(status=status,snapshot=snap)
   page.evaluate("CCX.navigate('#/releases/v2026.5.0-beta.1')")
   expect(page.locator('.release-status')).to_have_attribute('data-status','error')
   expect(page.locator('.release-version-line h2')).to_have_text('v2026.5.0-beta.1')
   assert page.locator('.release-file').count()==1
   assert page.locator('.release-status').inner_text()
   ctx.close()
  checks.append('offline, rate-limit, not-found and server-error preserve and label the fallback')
  ctx,page,calls,mode=scenario(status=500)
  page.evaluate("CCX.navigate('#/releases')");expect(page.locator('.release-status')).to_have_attribute('data-status','error')
  expect(page.locator('.release-empty h2')).to_have_text('Release list unavailable.')
  expect(page.locator('[data-releases-github]')).to_have_attribute('href',f'https://github.com/{REPO}/releases')
  ctx.close();checks.append('no-data error is distinct from a confirmed empty repository')
  ctx,page,calls,mode=scenario()
  page.evaluate('__githubMode.delayMs=250')
  page.evaluate("CCX.navigate('#/releases/v2026.5.0-beta.1')")
  expect(page.locator('.release-status')).to_have_attribute('data-status','loading')
  page.evaluate("CCX.navigate('#/docs/overview')")
  expect(page.locator('#docs-view')).to_be_visible()
  title=page.title();page.wait_for_timeout(400)
  assert page.title()==title,'A late API result must not steal the wiki title or route.'
  page.evaluate("CCX.navigate('#/releases/v2026.5.0-beta.1')")
  expect(page.locator('.release-channel')).to_have_text('Beta');assert len(calls())==1
  ctx.close();checks.append('late API response preserves current route/title and selected release')
  assert not errors,errors
  b.close()
 report={'checks':checks,'pageErrors':errors,'transport':'real HTML/CSS/JS embedded in Chromium; deterministic mocked fetch responses','nativeFileTest':'blocked by managed Chromium policy'}
 (ROOT/'docs/GITHUB_RELEASES_QA.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
if __name__=='__main__':run()
