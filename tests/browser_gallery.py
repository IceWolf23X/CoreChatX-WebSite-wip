"""Functional gallery regression tests using the shipped theme and generated test pixels.
Run: python tests/browser_gallery.py [--output report.json]
The default harness embeds the real files to accommodate managed file:// restrictions.
No replacement UI, remote libraries or artwork are used.
"""
import argparse
import base64
import json
import re
import shutil
import struct
import sys
import zlib
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


def pixel_image(rgb, width=320, height=180):
    """Small solid-color PNG fixtures, built only in memory for browser tests."""
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress((b'\0' + bytes(rgb) * width) * height)) + chunk(b'IEND', b'')
    return 'data:image/png;base64,' + base64.b64encode(data).decode()

IMAGES = [dict(src=pixel_image(c, w, h), alt=f'Test image {i+1}', caption=f'Caption {i+1}')
          for i, (c, w, h) in enumerate([((120, 90, 180), 640, 360), ((80, 150, 110), 320, 480), ((180, 110, 70), 600, 200)])]


def load(page, options, motion='no-preference'):
    page.emulate_media(reduced_motion=motion)
    soup = BeautifulSoup((ROOT/'index.html').read_text(), 'html.parser')
    scripts = [s['src'] for s in soup.select('script[src]')]
    for s in soup.select('script[src]'): s.decompose()
    for el in soup.select('link[rel="stylesheet"]'):
        style = soup.new_tag('style'); style.string = (ROOT/el['href']).read_text(); el.replace_with(style)
    for el in soup.select('link[rel="icon"]'): el.decompose()
    page.set_content(str(soup))
    logo = 'data:image/png;base64,'+base64.b64encode((ROOT/'assets/img/corechatx-logo.png').read_bytes()).decode()
    for file in scripts:
        page.add_script_tag(content=(ROOT/file).read_text())
        if file.endswith('data/site-config.js'):
            page.evaluate('([options,logo]) => { COREX_SITE.assets.heroPreview=options; COREX_SITE.brand.logo=logo; COREX_SITE.brand.favicon=logo; }', [options, logo])
    assert page.evaluate('!!window.COREX_PREVIEW'), 'Gallery controller must be mounted by app.js'
    page.evaluate('() => window.COREX_PREVIEW.ready')
    page.wait_for_timeout(50)


def run(output=None, match=None):
    passed, errors, requests = [], [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=shutil.which('chromium') or None)
        context = browser.new_context(viewport={'width':1440,'height':1000})
        context.route(re.compile(r'^https?://'), lambda route: (requests.append(route.request.url), route.abort()))
        def fixture(options, motion='no-preference'):
            page = context.new_page(); page.set_default_timeout(5000)
            page.on('pageerror',lambda e: errors.append(str(e)))
            load(page,options,motion)
            return page
        def case(name, fn):
            if match and not re.search(match, name): return
            print('Gallery check: '+name,file=sys.stderr,flush=True)
            fn(); passed.append(name)
        def index(page): return int(page.locator('#chat-preview').get_attribute('data-gallery-index'))
        def empty():
            page=fixture({'images':[]})
            expect(page.locator('.preview-placeholder')).to_be_visible()
            assert page.locator('.gallery-slide,.gallery-controls').count()==0
            assert page.locator('#chat-preview').get_attribute('data-gallery-state')=='placeholder'
            page.close()
        case('zero images preserves the placeholder',empty)
        def single():
            for options in [{'images':[IMAGES[0]],'intervalMs':1000}, {'src':IMAGES[0]['src'],'alt':'Legacy'}, {'images':[IMAGES[0],IMAGES[0]]}]:
                page=fixture(options)
                expect(page.locator('.gallery-slide')).to_have_count(1)
                assert page.locator('.gallery-controls').count()==0
                assert page.locator('#chat-preview').get_attribute('data-gallery-state')=='single'
                page.evaluate("""() => { window.imageMutations=0;new MutationObserver(e=>window.imageMutations+=e.length)
                    .observe(document.querySelector('.gallery-slide'), {attributes:true}); }""")
                page.locator('#chat-preview').dispatch_event('click')
                page.wait_for_timeout(1300)
                assert index(page)==0
                assert page.evaluate('window.imageMutations')==0, 'single image must not be rerendered'
                assert page.evaluate("document.querySelector('.gallery-slide').getAnimations().length")==0
                assert page.locator('#chat-preview').get_attribute('data-gallery-playing')=='false'
                page.close()
        case('one image, legacy src and duplicates stay static without mutation or timers',single)
        def navigation():
            page=fixture({'images':IMAGES,'autoplay':False,'transitionMs':80})
            assert index(page)==0
            expect(page.locator('.gallery-counter')).to_have_text('1 / 3')
            page.locator('.gallery-stage').dispatch_event('click');assert index(page)==1
            page.locator('[data-gallery-next]').click();assert index(page)==2
            page.locator('[data-gallery-next]').click();assert index(page)==0
            page.locator('[data-gallery-prev]').click();assert index(page)==2
            page.locator('[data-gallery-dot="1"]').click();assert index(page)==1
            expect(page.locator('[data-preview-caption-text]')).to_have_text('Caption 2')
            page.locator('[data-gallery-next]').press('Home');assert index(page)==0
            page.locator('[data-gallery-next]').press('End');assert index(page)==2
            page.locator('[data-gallery-next]').press('ArrowLeft');assert index(page)==1
            assert page.locator('dialog[open]').count()==0
            assert page.locator('.gallery-slide:not([aria-hidden="true"])').count()==1
            assert page.evaluate("getComputedStyle(document.querySelector('.gallery-slide')).objectFit")=='contain'
            page.close()
        case('click, arrows, dots and keyboard navigate without opening a lightbox',navigation)
        def rotation():
            page=fixture({'images':IMAGES,'intervalMs':1000,'transitionMs':80})
            page.wait_for_timeout(1250);assert index(page)==1
            page.locator('.preview-shell').hover();before=index(page)
            page.wait_for_timeout(1350);assert index(page)==before
            page.mouse.move(0,0);page.wait_for_timeout(1250);assert index(page)!=before
            page.locator('[data-gallery-toggle]').click();before=index(page)
            page.mouse.move(0,0);page.wait_for_timeout(1300);assert index(page)==before
            page.locator('[data-gallery-toggle]').click();page.mouse.move(0,0)
            page.wait_for_timeout(1250);assert index(page)!=before
            page.close()
        case('autoplay, hover pause and explicit pause/play work',rotation)
        def focus():
            page=fixture({'images':IMAGES,'intervalMs':1000,'transitionMs':0})
            page.locator('[data-gallery-next]').focus();page.wait_for_timeout(1150);assert index(page)==0
            page.locator('.brand').first.focus();page.wait_for_timeout(1150);assert index(page)==0
            page.locator('[data-gallery-toggle]').click();page.mouse.move(0,0);page.wait_for_timeout(1200);assert index(page)==1
            page.close()
        case('keyboard focus stops autoplay until explicit Play',focus)
        def manual_timer():
            page=fixture({'images':IMAGES,'intervalMs':1000,'transitionMs':0})
            page.wait_for_timeout(650);page.locator('.gallery-stage').dispatch_event('click');assert index(page)==1
            page.wait_for_timeout(550);assert index(page)==1, 'manual navigation must reset the timer'
            page.wait_for_timeout(650);assert index(page)==2
            page.close()
        case('manual navigation resets the autoplay dwell time',manual_timer)
        def rapid():
            page=fixture({'images':IMAGES,'autoplay':False,'transitionMs':240})
            result=page.evaluate("""async () => {
              const stage=document.querySelector('.gallery-stage');let blank=false;
              for(let i=0;i<35;i++) {
                stage.click();
                const visible=[...document.querySelectorAll('.gallery-slide')].filter(img=>parseFloat(getComputedStyle(img).opacity)>.98);
                if(!visible.length)blank=true;
                await new Promise(r=>setTimeout(r,12));
              }
              return {blank,count:document.querySelectorAll('.gallery-slide').length};
            }""")
            assert not result['blank'], 'a decoded image must cover the canvas during rapid clicks'
            assert result['count']==3 and index(page)==2
            page.wait_for_timeout(400)
            assert page.locator('.is-entering,.is-leaving').count()==0
            page.close()
        case('rapid input never exposes a blank frame or duplicates slides',rapid)
        def broken():
            broken={'src':'data:image/png;base64,broken','alt':'Broken'}
            page=fixture({'images':[broken,IMAGES[1]],'intervalMs':1000})
            assert index(page)==0 and page.locator('.gallery-slide').count()==1
            assert page.locator('.gallery-controls').count()==0
            expect(page.locator('.gallery-slide')).to_have_attribute('alt','Test image 2')
            page.close()
            page=fixture({'images':[broken]})
            expect(page.locator('.preview-placeholder')).to_be_visible()
            assert page.locator('.gallery-slide,.gallery-controls').count()==0
            page.close()
        case('broken images are skipped; one valid becomes static; all broken keep placeholder',broken)
        def reduced():
            page=fixture({'images':IMAGES,'intervalMs':1000},'reduce')
            page.wait_for_timeout(1200);assert index(page)==0
            page.locator('.gallery-stage').dispatch_event('click');assert index(page)==1
            assert page.evaluate("document.querySelector('.gallery-slide.is-active').getAnimations().length")==0
            expect(page.locator('[data-gallery-toggle]')).not_to_be_visible()
            page.close()
        case('reduced motion disables autoplay and fade, not manual navigation',reduced)
        def lifecycle():
            page=fixture({'images':IMAGES,'intervalMs':1000,'transitionMs':0})
            page.evaluate("CCX.navigate('#/docs/overview')");page.wait_for_timeout(80);before=index(page)
            page.wait_for_timeout(1200);assert index(page)==before
            assert page.locator('#chat-preview').get_attribute('data-gallery-playing')=='false'
            page.evaluate("CCX.navigate('#/')");page.wait_for_timeout(1250);assert index(page)!=before
            page.evaluate("""() => { window.COREX_PREVIEW = COREX_GALLERY.mount(document.getElementById('chat-preview'), COREX_SITE.assets.heroPreview, COREX_UI.gallery); }""")
            page.evaluate('()=>COREX_PREVIEW.ready')
            assert page.locator('.gallery-slide').count()==3 and page.locator('.gallery-controls').count()==1
            page.evaluate('COREX_PREVIEW.destroy()')
            assert page.locator('.gallery-slide,.gallery-controls').count()==0
            expect(page.locator('.preview-placeholder')).to_be_visible()
            page.close()
        case('docs routing pauses hidden gallery; remount and destroy clean up',lifecycle)
        def visibility():
            page=fixture({'images':IMAGES,'intervalMs':1000,'transitionMs':0})
            page.evaluate("() => { Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange')); }")
            page.wait_for_timeout(1250);assert index(page)==0
            page.evaluate("() => { Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange')); }")
            page.wait_for_timeout(1250);assert index(page)==1
            page.evaluate('scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(100);before=index(page)
            page.wait_for_timeout(1250);assert index(page)==before
            page.close()
        case('hidden tabs and offscreen gallery suspend autoplay',visibility)
        def swipe():
            page=fixture({'images':IMAGES,'autoplay':False})
            page.set_viewport_size({'width':390,'height':844})
            stage=page.locator('.gallery-stage');stage.scroll_into_view_if_needed()
            def gesture(dx,dy=0):
                stage.dispatch_event('pointerdown',{'pointerId':7,'pointerType':'touch','isPrimary':True,'button':0,'clientX':200,'clientY':300})
                stage.dispatch_event('pointerup',{'pointerId':7,'pointerType':'touch','isPrimary':True,'button':0,'clientX':200+dx,'clientY':300+dy})
            gesture(-100);assert index(page)==1
            stage.dispatch_event('click');assert index(page)==1, 'synthetic click after swipe must not double-advance'
            gesture(100);assert index(page)==0
            gesture(0,100);assert index(page)==0
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
            page.close()
        case('mobile swipe works without double advance or hijacking vertical scrolling',swipe)
        def remount_hover():
            page=fixture({'images':IMAGES,'autoplay':False,'intervalMs':1000,'transitionMs':0})
            page.locator('.preview-shell').hover()
            page.evaluate("""() => {
              COREX_SITE.assets.heroPreview.autoplay=true;
              window.COREX_PREVIEW=COREX_GALLERY.mount(document.getElementById('chat-preview'),COREX_SITE.assets.heroPreview,COREX_UI.gallery);
            }""")
            page.evaluate('()=>COREX_PREVIEW.ready');page.wait_for_timeout(1200)
            assert index(page)==0, 'a gallery mounted under the pointer must start hover-paused'
            page.close()
        case('initial hover remains paused when gallery finishes loading or remounts',remount_hover)
        def layout():
            page=fixture({'images':IMAGES,'autoplay':False})
            for theme in ['light','dark']:
                page.evaluate('(theme)=>{document.documentElement.dataset.theme=theme;COREX_APPLY_THEME(theme);}',theme)
                for width,height in [(320,720),(375,812),(390,844),(768,1024),(1440,900),(1599,900),(1600,900),(1601,900),(3440,1440),(3840,1080),(5120,1440),(7680,2160)]:
                    print(f'Gallery geometry: {theme} {width}x{height}',file=sys.stderr,flush=True)
                    page.set_viewport_size({'width':width,'height':height})
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),(theme,width,'overflow')
                    before=page.locator('#chat-preview').evaluate('el=>({w:el.clientWidth,h:el.clientHeight})')
                    page.locator('.gallery-stage').dispatch_event('click')
                    after=page.locator('#chat-preview').evaluate('el=>({w:el.clientWidth,h:el.clientHeight})')
                    assert before==after,(theme,width,'geometry changed across image ratios')
            page.close()
        case('both themes and 12 widths through 32:9 keep stable gallery geometry',layout)
        assert not errors,errors
        assert not requests,requests
        report={'status':'PASS','cases':passed,'caseCount':len(passed),'javascriptErrors':errors,'externalRequests':requests,'mode':'exact shipped files embedded with test PNGs','limitations':['Native file:// navigation is blocked by managed Chromium. No GitHub Actions workflow was run on the account.']}
        if output: Path(output).write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report,indent=2))
        browser.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output');parser.add_argument('--match',help='Run only case names matching this regular expression');args=parser.parse_args();run(args.output,args.match)
