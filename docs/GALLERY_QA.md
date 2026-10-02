# Gallery + SETUP delivery verification

Date: 2026-10-02. Base: `CoreChatX-website-js-theme.zip`.

## Delivered changes

`SETUP.md` is an owner-oriented Italian walkthrough covering extraction, data editing, gallery assets and timing, website repository setup, exact secret names/permissions, manual sync, cross-repository notifications, hosting, local bundle commands and reuse for CoreArmorX. The gallery guide, customization guide, architecture notes and README are cross-linked to it.

The `preview-shell` now supports a JS-configured image list, while preserving the existing frame, responsive geometry and hover rotation. Assets are still separate files referenced from `site-config.js`; no mock screenshots or new font files are bundled.

## Verification performed

| Check | Observed result |
| --- | --- |
| `node --test tests/*.test.cjs` | 17 tests passed. |
| `node tests/validate-theme.mjs` | 67 documentation articles, 20 synchronized config sources validated; configured local gallery paths are checked. |
| `python tests/browser_gallery.py` | 14 functional scenario groups passed, with 0/1/multiple images, duplicates, legacy `src`, corrupted images, autoplay, manual reset, pause/play, focus, hidden/offscreen state, reduced motion, swipe and rapid clicks. |
| Gallery responsive matrix | 12 widths from 320 to 7680 CSS pixels, in both themes; stable canvas geometry across landscape/portrait images. |
| `python tests/browser_preview_hover.py --embedded` | 40 viewport/theme/motion cases passed, including 1599, 1600, 1601 px and ultrawide. Resting rotation, hover animation and return behavior preserved. |
| `python tests/browser_smoke.py --embedded` | All 67 articles rendered; shared theme, search, copy/expand, navigation/history, invalid routes, mobile drawer, setup tabs and FAQ checked. |
| `python tests/browser_ultrawide.py --embedded` | 154 layout checks, 11 article-integrity checks, 27 breakpoint checks and 9 topology checks passed. |
| `python tests/browser_reference.py` | Full reference: 67 articles and 20 config blocks rendered; no measured horizontal page overflow after resize settled. |
| JavaScript errors / external requests | None in the passing browser test runs. Gallery tests used local in-memory PNG fixtures. |
| Visual inspection | Actual rendered gallery control/frame crop inspected at mobile size; files were rendered from the implementation, not generated as a design mockup. |

Summary outputs are included in `qa-results.json`.

## Regression development notes

The gallery's new unit/browser tests were written and run before implementation and failed because the gallery did not yet exist. The final controller passes them. Two specific rendering details were corrected during verification: the global reduced-motion rule could otherwise create a tiny implicit opacity transition, and an already-hovered frame must be recognized when loading completes.

Two legacy browser tests measured live-resize geometry before Chromium had applied the new CSS breakpoint. The transient mismatch reproduced against the unchanged baseline as well. Their live-resize measurements now wait for two animation frames; no unrelated website layout rule was altered to hide the issue.

## Scope and limitations

These results are Chromium browser automation evidence, not exhaustive testing of every browser, image format, graphics driver, operating system or physical touch device. Swipe was exercised through pointer events; screen-reader announcements were checked structurally, not with a live screen-reader session. A single animated GIF can of course still animate within its image file; static mode means the gallery itself does not rotate it.

Native `file://` navigation was attempted but the managed browser returned `ERR_BLOCKED_BY_ADMINISTRATOR`. The exact shipped scripts/styles/HTML were exercised in the explicit embedded harness. Local-file navigation and filesystem permissions on the user's Windows machine were not certified by that harness. The website continues to use ordinary local scripts and prebundled config content, without runtime fetch for page construction.

No GitHub repositories, secrets, permissions, deployments or Actions runs were changed in the user's account. The account-side procedure is documented, not silently activated. The existing configuration snapshots, documentation bodies and synchronization workflow were retained.
