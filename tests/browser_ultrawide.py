"""Responsive regression tests for the shipped site, not generated mockups.
Run: python tests/browser_ultrawide.py [--embedded] [--output report.json]
Default mode uses the real file:// entrypoint. The explicit --embedded fallback
uses exactly the shipped HTML/CSS/JS when browser policy blocks local navigation.
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from browser_smoke import embed

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(390, 844), (1024, 768), (1599, 900), (1600, 900),
             (1920, 1080), (2560, 1080), (3440, 1440), (3840, 1080),
             (5120, 1440), (7680, 2160), (1920, 540)]
ROUTES = ['#/', '#/docs/overview', '#/docs/instructions',
          '#/docs/paper/chat-yml', '#/docs/paper/discord-yml',
          '#/docs/velocity/velocity-discord-yml',
          '#/docs/reference/command-reference']

MEASURE = """() => {
  const rect = s => {
    const e = document.querySelector(s);
    if (!e || !e.getClientRects().length) return null;
    const r = e.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
  };
  const cols = s => {
    const e=document.querySelector(s);
    return e && e.getClientRects().length ? getComputedStyle(e).gridTemplateColumns.split(' ').length : 0;
  };
  return {viewport:[innerWidth,innerHeight], scrollWidth:document.documentElement.scrollWidth,
    hero:rect('.hero'), featureColumns:cols('.feature-grid'), docs:rect('.docs-main'),
    shell:rect('.docs-layout'), sidebar:rect('.docs-sidebar'), toc:rect('.toc-rail'),
    hubColumns:cols('.doc-card-grid'), example:rect('.reference-example'),
    notes:rect('.reference-notes'), splitColumns:cols('.reference-split'),
    code:rect('#article-body .code-block'), table:rect('.table-scroll')};
}"""


def run(embedded=False, output=None):
    records, errors, network = [], [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=shutil.which('chromium') or None)
        context = browser.new_context(viewport={'width':1440,'height':900}, reduced_motion='reduce')
        context.route(re.compile(r'^https?://'), lambda r: (network.append(r.request.url), r.abort()))
        page = context.new_page()
        page.set_default_timeout(8000)
        page.on('pageerror', lambda e: errors.append(str(e)))
        if embedded:
            embed(page)
        else:
            page.goto((ROOT / 'index.html').as_uri())
        def navigate(route):
            page.evaluate('(r)=>CCX.navigate(r)', route)
            # Viewport changes and hash routing may commit on different browser frames.
            # Wait for the responsive header to settle rather than sampling stale geometry.
            page.wait_for_function("""() =>
                parseFloat(getComputedStyle(document.querySelector('.site-header')).height) ===
                  (innerWidth <= 800 ? 66 : 76)""")
            page.wait_for_timeout(70)
        # These must FAIL on the original package: ultrawide is real reflow, not just empty margins.
        for width, minimum in [(2560,1850),(3440,2500),(5120,3300)]:
            page.set_viewport_size({'width':width,'height':1440})
            navigate('#/')
            actual = page.locator('.hero').bounding_box()['width']
            assert actual >= minimum, f'{width}px landing remains fixed-width: {actual}px < {minimum}px'
        page.set_viewport_size({'width':3440,'height':1440})
        navigate('#/')
        assert page.evaluate(MEASURE)['featureColumns'] == 6, 'Ultrawide feature grid must reflow to six columns'
        assert page.evaluate("""() => {
            const shell=document.querySelector('.preview-shell'), canvas=document.querySelector('.preview-canvas');
            const css=getComputedStyle(shell);
            // Compare layout sizes in the same coordinate system. The inherited
            // preview tilt changes its projected bounding box, not the filled width.
            return Math.abs(canvas.offsetWidth -
              (shell.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)))<2;
        }"""), 'Preview canvas must fill its shell when height is capped'

        navigate('#/docs/paper/chat-yml')
        m = page.evaluate(MEASURE)
        assert m['example'] and m['notes'], 'Config example and notes need a responsive split wrapper'
        assert m['example']['right'] <= m['notes']['x'], 'Config and explanation must be side by side'

        # Both themes, ordinary and short ultrawide browser windows, and all major page types.
        for theme in ['light','dark']:
            print('Checking theme: '+theme, file=sys.stderr, flush=True)
            page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
            for width,height in VIEWPORTS:
                print('Viewport '+str((width,height)),file=sys.stderr,flush=True)
                page.set_viewport_size({'width':width,'height':height})
                for route in ROUTES:
                    navigate(route)
                    m = page.evaluate(MEASURE)
                    assert m['scrollWidth'] <= width + 1, (theme,width,height,route,'page overflow',m)
                    if route.startswith('#/docs') and width >= 1600:
                        assert m['sidebar']['right'] <= m['docs']['x'] + 1, m
                        assert m['docs']['right'] <= m['toc']['x'] + 1, m
                        assert m['toc']['right'] <= width + 1, m
                        assert m['sidebar']['x'] >= 0, m
                        if width >= 2560 and route in ['#/docs/overview','#/docs/instructions']:
                            assert m['hubColumns'] >= 3, m
                        if route == '#/docs/paper/chat-yml':
                            if width >= 2400:
                                assert m['example']['right'] <= m['notes']['x'] + 1, m
                            else:
                                assert m['notes']['y'] >= m['example']['bottom'] - 1, m
                    records.append({'theme':theme,'route':route,**m})
        # Reflow integrity is browser-checked on representative article shapes;
        # tests/validate-theme.mjs validates all 67 data records and config bindings.
        page.set_viewport_size({'width':5120,'height':1440})
        sample_ids=['instructions/layout-overview','instructions/reload-vs-restart','paper/config-yml','paper/chat-yml','paper/chatitems-yml','paper/discord-yml','paper/storage-yml','velocity/velocity-config-properties','velocity/velocity-discord-yml','reference/command-reference','reference/troubleshooting-quick-reference']
        articles = page.evaluate('(ids)=>CCX_CONTENT.articles.filter(a=>ids.includes(a.id)).map(a=>({id:a.id,title:a.title}))', sample_ids)
        print('Checking representative source articles',file=sys.stderr,flush=True)
        for article in articles:
            navigate('#/docs/'+article['id'])
            expect(page.locator('#article-title')).to_have_text(article['title'])
            assert page.evaluate("""id => {
                const a=CCX_CONTENT.articles.find(a=>a.id===id), b=document.querySelector('#article-body');
                const original=document.createElement('div'); original.innerHTML=a.bodyHtml;
                const list=e=>Array.from(e.querySelectorAll('pre code'),n=>n.textContent);
                const idsOk=Array.from(original.querySelectorAll('[id]')).every(e=>
                  Array.from(b.querySelectorAll('[id]')).filter(n=>n.id===e.id).length===1);
                if(!idsOk) return false;
                if(a.configFile){
                  const f=COREX_CONFIG_FILES.files[a.configFile.id];
                  const rendered=b.querySelector('.config-synced-file pre code');
                  return !!f && !!rendered && rendered.textContent===f.content;
                }
                return JSON.stringify(list(original))===JSON.stringify(list(b));
            }""", article['id']), article['id']
        # Adjacent breakpoint widths and both setup panels remain usable.
        print('Checking breakpoint edges',file=sys.stderr,flush=True)
        for width in [1599,1600,1699,1700,1799,1800,2399,2400,2401]:
            page.set_viewport_size({'width':width,'height':900})
            for route in ['#/','#/docs/overview','#/docs/paper/chat-yml']:
                navigate(route)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,route)
        print('Checking network diagram',file=sys.stderr,flush=True)
        for width in [320,390,768,1600,1920,2560,3440,5120,7680]:
            page.set_viewport_size({'width':width,'height':1080});navigate('#/')
            page.locator('[data-setup="network"]').click()
            assert page.evaluate("""() => {
                const p=document.querySelector('#setup-network .topology-map').getBoundingClientRect();
                return Array.from(document.querySelectorAll('#setup-network .topology-node')).every(e=>{
                    const r=e.getBoundingClientRect();return r.left>=p.left-1 && r.right<=p.right+1;
                });
            }"""), (width,'network diagram clipped')
        page.set_viewport_size({'width':5120,'height':1440})
        print('Checking interactions',file=sys.stderr,flush=True)
        # Sidebar and outline remain accessible while reading deep into a long article.
        navigate('#/docs/paper/storage-yml')
        page.evaluate('scrollTo(0,1600)')
        page.wait_for_timeout(80)
        m=page.evaluate(MEASURE)
        assert 75 <= m['sidebar']['y'] <= 80, m
        assert 75 <= m['toc']['y'] <= 140, m
        # Expand/copy still work after introducing the side-by-side wrapper.
        navigate('#/docs/paper/discord-yml')
        page.locator('.expand-code').first.click()
        expect(page.locator('.expand-code').first).to_have_attribute('aria-expanded','true')
        page.locator('.copy-code').first.click()
        expect(page.locator('.copy-code').first).to_have_text(re.compile('Copied|Select code'))
        # Resizing a live article does not reload it, duplicate its nodes, or forget expansion.
        for width in [390,1920,3440,5120]:
            page.set_viewport_size({'width':width,'height':900})
            # Chromium can report the new innerWidth before the old breakpoint layout
            # has had its resize/render frames. This race also exists in the baseline ZIP.
            page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
            assert page.locator('.reference-split').count() == 1
            expect(page.locator('.expand-code').first).to_have_attribute('aria-expanded','true')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        # Shared theme and keyboard search remain functional at super-ultrawide dimensions.
        page.evaluate("document.documentElement.dataset.theme='light'")
        page.locator('[data-theme-toggle]').first.click()
        navigate('#/');expect(page.locator('html')).to_have_attribute('data-theme','dark')
        navigate('#/docs/instructions');expect(page.locator('html')).to_have_attribute('data-theme','dark')
        page.keyboard.press('Control+k')
        expect(page.locator('#search-dialog')).to_be_visible()
        page.locator('#search-input').fill('discord-images.enabled')
        expect(page.locator('.search-result').first).to_have_attribute('href',re.compile('chatitems'))
        page.keyboard.press('Enter')
        expect(page.locator('#article-title')).to_contain_text('chatitems.yml')
        # Drawer remains operable after a super-ultrawide-to-mobile transition.
        page.set_viewport_size({'width':390,'height':844})
        page.locator('[data-sidebar-toggle]').click()
        expect(page.locator('#docs-sidebar')).to_have_class(re.compile('is-open'))
        page.locator('#docs-sidebar a[href="#/docs/paper/chat-yml"]').click()
        expect(page.locator('#article-title')).to_have_text('chat.yml')
        expect(page.locator('#docs-sidebar')).not_to_have_class(re.compile('is-open'))
        assert not errors, errors
        assert not network, network
        result={'status':'PASS','mode':'embedded shipped files' if embedded else 'file://',
                'viewports':VIEWPORTS,'themes':['light','dark'], 'layoutChecks':len(records),
                'articleIntegrityChecks':len(articles),'breakpointChecks':27,'networkDiagramChecks':9,'javascriptErrors':errors,'externalRequests':network,
                'checks':['fluid landing width','six-column ultrawide features','adaptive wiki grids',
                          'side-by-side configuration and explanation','single-column narrow reading',
                          'sticky nav and outline','copy/expand','live resize preserves state',
                          'source code and anchor integrity','shared theme','keyboard search','mobile drawer'],
                'limitations':['Managed Chromium blocks file://. Tested the exact shipped files in an in-memory browser harness; native local-file loading and storage across reload not verified.'] if embedded else [],
                'measurements':records}
        if output:
            Path(output).parent.mkdir(parents=True,exist_ok=True)
            Path(output).write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps({k:v for k,v in result.items() if k!='measurements'},indent=2))
        browser.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--embedded',action='store_true')
    parser.add_argument('--output')
    args=parser.parse_args()
    run(args.embedded,args.output)
