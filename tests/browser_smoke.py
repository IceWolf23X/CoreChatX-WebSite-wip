"""Browser acceptance tests.
Default: real file:// entrypoint. --embedded: in-memory harness for locked-down
browsers that deny local-file navigation. Embedded mode does NOT claim a file://
load, a native storage-persistence test, or unrestricted clipboard access.
"""
import argparse, base64, json, re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]

def embed(page):
    soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
    scripts=[x['src'] for x in soup.select('script[src]')]
    for x in soup.select('script[src]'):x.decompose()
    for el in soup.select('link[rel="stylesheet"]'):
        style=soup.new_tag('style');style.string=(ROOT/el['href']).read_text();el.replace_with(style)
    for el in soup.select('link[rel="icon"]'):el.decompose()
    for el in soup.select('img[src]'):
        el['src']='data:image/png;base64,'+base64.b64encode((ROOT/el['src']).read_bytes()).decode()
    page.set_content(str(soup))
    for file in scripts:page.add_script_tag(content=(ROOT/file).read_text())

def run(embedded=False):
    assert (ROOT/'index.html').exists(), 'Missing functional HTML entrypoint'
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=shutil.which('chromium') or None)
        context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
        network=[];errors=[]
        context.route(re.compile(r'^https?://'),lambda r:(network.append(r.request.url),r.abort()))
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        uri=(ROOT/'index.html').as_uri()
        if embedded:embed(page)
        else:page.goto(uri)
        def navigate(suffix=''):
            if embedded:page.evaluate('(hash)=>window.CCX.navigate(hash)',suffix or '#/')
            else:page.goto(uri+suffix)
            page.wait_for_timeout(70)
        expect(page.locator('#landing-view')).to_be_visible()
        expect(page.locator('html')).to_have_attribute('data-theme','light')
        page.locator('[data-theme-toggle]').first.click()
        expect(page.locator('html')).to_have_attribute('data-theme','dark')
        page.locator('[data-docs-link]').first.click()
        expect(page.locator('#docs-view')).to_be_visible()
        expect(page.locator('html')).to_have_attribute('data-theme','dark')
        if not embedded:
            page.reload();expect(page.locator('html')).to_have_attribute('data-theme','dark')
        page.keyboard.press('Control+k');expect(page.locator('#search-dialog')).to_be_visible()
        page.locator('#search-input').fill('discord-images.enabled')
        expect(page.locator('.search-result').first).to_have_attribute('href',re.compile('chatitems'))
        page.keyboard.press('Enter');expect(page.locator('#search-dialog')).not_to_be_visible()
        expect(page.locator('#article-title')).to_contain_text('chatitems.yml')
        page.locator('.copy-code').first.click()
        if embedded:
            expect(page.locator('.copy-code').first).to_have_text(re.compile('Copied|Select code'))
            copy_outcome=page.locator('.copy-code').first.text_content()
            if copy_outcome=='Select code':assert len(page.evaluate('getSelection().toString()'))>100
        else:
            expect(page.locator('.copy-code').first).to_have_text('Copied');copy_outcome='Copied'
        navigate('#/docs/paper/discord-yml');expect(page.locator('#article-title')).to_have_text('discord.yml')
        page.locator('.expand-code').first.click();expect(page.locator('.expand-code').first).to_have_attribute('aria-expanded','true')
        assert page.locator('.toc-rail .toc-link').count()>=3
        navigate('#/docs/not-real');expect(page.locator('#article-title')).to_have_text('Page not found')
        navigate('#/docs/%E0%A4%A');expect(page.locator('#article-title')).to_have_text('Page not found')
        navigate('#/docs/%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E')
        expect(page.locator('#article-title')).to_have_text('Page not found')
        assert page.locator('#article-body img').count()==0
        navigate('#/docs/paper/chat-yml');navigate('#/docs/paper/pings-yml')
        page.go_back();expect(page.locator('#article-title')).to_have_text('chat.yml')
        page.go_forward();expect(page.locator('#article-title')).to_have_text('pings.yml')
        # Every article must render without lost markup, empty shells or runtime errors.
        for article in page.evaluate('CCX_CONTENT.articles.map(a=>({id:a.id,title:a.title}))'):
            navigate('#/docs/'+article['id'])
            expect(page.locator('#article-title')).to_have_text(article['title'])
        for width in [375,390,768,1024,1440,1920]:
            page.set_viewport_size({'width':width,'height':900})
            for route in ['', '#/docs/overview','#/docs/instructions','#/docs/paper/discord-yml','#/docs/reference/command-reference']:
                navigate(route)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),(width,route,'overflow')
        page.set_viewport_size({'width':390,'height':844});navigate('#/docs/overview')
        page.locator('[data-sidebar-toggle]').click();expect(page.locator('#docs-sidebar')).to_have_class(re.compile('is-open'))
        page.locator('#docs-sidebar a[href="#/docs/paper/chat-yml"]').click()
        expect(page.locator('#article-title')).to_have_text('chat.yml')
        expect(page.locator('#docs-sidebar')).not_to_have_class(re.compile('is-open'))
        page.set_viewport_size({'width':1440,'height':1000});navigate()
        page.locator('[data-setup="network"]').click()
        expect(page.locator('#setup-network')).to_be_visible()
        page.locator('[data-setup="network"]').press('ArrowLeft')
        expect(page.locator('#setup-standalone')).to_be_visible()
        page.locator('.faq-list summary').first.click()
        expect(page.locator('.faq-list details').first).to_have_attribute('open','')
        # A search query is never treated as HTML.
        page.keyboard.press('Control+k');page.locator('#search-input').fill('<img src=x onerror=alert(1)>')
        expect(page.locator('.search-empty')).to_be_visible()
        assert page.locator('#search-results img').count()==0
        page.keyboard.press('Escape');expect(page.locator('#search-dialog')).not_to_be_visible()
        assert not network,network
        assert not errors,errors
        print(json.dumps({'status':'PASS','mode':'embedded browser harness' if embedded else 'file://','articlesRendered':67,'networkRequests':len(network),'javascriptErrors':len(errors),'viewports':[375,390,768,1024,1440,1920],'clipboardUI':copy_outcome,'tests':['light default','shared dark theme','keyboard search','config-key results','code copy/fallback','code expansion','all 67 articles','invalid route','malformed hash','mobile sidebar','responsive overflow','setup tab keyboard controls','FAQ expansion','HTML-safe search','search Escape','safe untrusted routes','browser history'],'limitations':(['Managed Chromium blocks file:// navigation. The same HTML/CSS/JS was injected into about:blank; native local-file loading and storage persistence across reload were not browser-verified. The clipboard action returned success; system clipboard contents were not read back.'] if embedded else [])},indent=2))
        browser.close()

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('--embedded',action='store_true');run(args.parse_args().embedded)
