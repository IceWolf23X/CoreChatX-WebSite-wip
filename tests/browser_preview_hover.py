"""Regression test for the original preview-shell rotation on desktop/ultrawide.

Run: python tests/browser_preview_hover.py [--embedded] [--output report.json]
The explicit embedded fallback uses the shipped files when file:// is blocked.
No generated images, remote assets, or replacement UI are used.
"""
import argparse
import json
import re
import shutil
from pathlib import Path

from playwright.sync_api import expect, sync_playwright
from browser_smoke import embed

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(1440, 900), (1599, 900), (1600, 900), (1601, 900), (1920, 1080),
             (2560, 1440), (3440, 1440), (3840, 1080),
             (5120, 1440), (7680, 2160)]
STATE = """() => {
    const el = document.querySelector('.preview-shell');
    const css = getComputedStyle(el);
    const m = new DOMMatrixReadOnly(css.transform);
    const r = el.getBoundingClientRect();
    const hero = document.querySelector('.hero-grid').getBoundingClientRect();
    return {
        angle: Math.atan2(m.b, m.a) * 180 / Math.PI,
        hovered: el.matches(':hover'),
        durations: css.transitionDuration.split(',').map(s => parseFloat(s)),
        transitionProperties: css.transitionProperty,
        runningTransformTransition: el.getAnimations().some(a =>
            a.transitionProperty === 'transform' && a.playState !== 'finished'),
        previewWidth: el.offsetWidth,
        heroWidth: hero.width,
        featureColumns: getComputedStyle(document.querySelector('.feature-grid'))
            .gridTemplateColumns.split(' ').length,
        previewInsideViewport: r.left >= 0 && r.right <= innerWidth,
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1
    };
}"""


def settle(page):
    """Wait for viewport styles and the actual transition, not an arbitrary delay."""
    page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
    page.wait_for_function("""() => !document.querySelector('.preview-shell')
        .getAnimations().some(a => a.playState === 'running' || a.playState === 'pending')""")


def run(embedded=False, output=None):
    records, errors, requests = [], [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=shutil.which('chromium') or None)
        context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                      reduced_motion='no-preference')
        context.route(re.compile(r'^https?://'),
                      lambda route: (requests.append(route.request.url), route.abort()))
        page = context.new_page()
        page.set_default_timeout(5000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        if embedded:
            embed(page)
        else:
            page.goto((ROOT / 'index.html').as_uri())
        expect(page.locator('.preview-shell')).to_be_visible()
        for motion in ['no-preference', 'reduce']:
            page.emulate_media(reduced_motion=motion)
            for theme in ['light', 'dark']:
                page.evaluate('(t) => document.documentElement.dataset.theme = t', theme)
                for width, height in VIEWPORTS:
                    page.mouse.move(0, 0)
                    page.set_viewport_size({'width': width, 'height': height})
                    page.evaluate('scrollTo(0, 0)')
                    settle(page)
                    before = page.evaluate(STATE)
                    assert not before['hovered'], (motion, theme, width, 'unexpected hover')
                    assert abs(before['angle'] + 1.25) < .02, (
                        motion, theme, width,
                        'Original resting rotation must be -1.25deg; got', before['angle'])
                    assert not before['pageOverflow'], (motion, theme, width, 'rest overflow')
                    assert before['previewInsideViewport'], (motion, theme, width, 'rest clipping')
                    if width >= 2400:
                        assert before['featureColumns'] == 6, (width, 'ultrawide reflow changed')
                    page.locator('.preview-shell').hover()
                    during = page.evaluate(STATE)
                    assert during['hovered'], (motion, theme, width, 'hover not activated')
                    if motion == 'no-preference':
                        assert during['runningTransformTransition'], (
                            theme, width, 'Hover must animate, not jump instantly')
                        assert .05 <= max(during['durations']) <= .5, during
                    else:
                        assert max(during['durations']) <= .001, (
                            theme, width, 'Reduced motion must not animate over normal duration')
                    settle(page)
                    hover = page.evaluate(STATE)
                    assert abs(hover['angle']) < .02, (motion, theme, width, 'hover not upright', hover)
                    assert not hover['pageOverflow'], (motion, theme, width, 'hover overflow')
                    assert hover['previewInsideViewport'], (motion, theme, width, 'hover clipping')
                    page.mouse.move(0, 0)
                    settle(page)
                    after = page.evaluate(STATE)
                    assert abs(after['angle'] + 1.25) < .02, (
                        motion, theme, width, 'Original rotation not restored after leaving', after)
                    records.append({'motion': motion, 'theme': theme,
                                    'viewport': [width, height], 'before': before,
                                    'hover': hover, 'after': after,
                                    'animated': during['runningTransformTransition']})
        assert not errors, errors
        assert not requests, requests
        report = {
            'status': 'PASS', 'mode': 'embedded shipped files' if embedded else 'file://',
            'viewportCases': len(records), 'viewports': VIEWPORTS,
            'themes': ['light', 'dark'], 'motionPreferences': ['no-preference', 'reduce'],
            'checks': ['original -1.25deg resting rotation', 'animated hover to 0deg',
                       'return animation', 'reduced-motion duration',
                       'no preview clipping or page overflow', 'six-column ultrawide reflow'],
            'javascriptErrors': errors, 'externalRequests': requests,
            'limitations': ['Managed Chromium blocks file://. Exact local files were tested in the explicit embedded harness; native file loading was not verified.'] if embedded else [],
            'measurements': records
        }
        if output:
            Path(output).parent.mkdir(parents=True, exist_ok=True)
            Path(output).write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps({k: v for k, v in report.items() if k != 'measurements'}, indent=2))
        browser.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--embedded', action='store_true')
    parser.add_argument('--output')
    args = parser.parse_args()
    run(args.embedded, args.output)
