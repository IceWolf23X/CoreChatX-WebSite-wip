"""Acceptance test for the JS-driven full reference page."""
import base64,re,shutil,json
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]

def embed(page):
    soup=BeautifulSoup((ROOT/'reference.html').read_text(),'html.parser')
    scripts=[x['src'] for x in soup.select('script[src]')]
    for x in soup.select('script[src]'):x.decompose()
    for el in soup.select('link[rel="stylesheet"]'):
        style=soup.new_tag('style');style.string=(ROOT/el['href']).read_text();el.replace_with(style)
    for el in soup.select('link[rel="icon"]'):el.decompose()
    page.set_content(str(soup))
    for file in scripts:page.add_script_tag(content=(ROOT/file).read_text())

def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=shutil.which('chromium') or None)
        context=browser.new_context(viewport={'width':1920,'height':1080},reduced_motion='reduce')
        network=[];errors=[]
        context.route(re.compile(r'^https?://'),lambda r:(network.append(r.request.url),r.abort()))
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        embed(page)
        expect(page.locator('.reference-article')).to_have_count(67)
        expect(page.locator('.config-synced-file')).to_have_count(20)
        assert page.locator('.reference-article[data-article-id="paper/config-yml"] .config-synced-file code').inner_text().startswith('# Core plugin settings.')
        page.locator('[data-theme-toggle]').click();expect(page.locator('html')).to_have_attribute('data-theme','dark')
        for width,height in [(390,844),(1920,1080),(3440,1440),(5120,1440)]:
            page.set_viewport_size({'width':width,'height':height})
            # Wait for the new breakpoint to be laid out before reading geometry.
            page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), (width,'reference overflow')
        assert not network,network
        assert not errors,errors
        print(json.dumps({'status':'PASS','articles':67,'configBlocks':20,'javascriptErrors':0,'externalRequests':0}))
        browser.close()
if __name__=='__main__':run()
