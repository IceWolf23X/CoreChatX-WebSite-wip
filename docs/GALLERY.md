# Preview gallery — editor and maintainer reference

The gallery replaces only the single-image preview logic. It does not replace the landing design, the original `preview-shell` hover rotation or the ultrawide layout.

## Editable source

Use `assets/js/data/site-config.js` → `assets.heroPreview`.

```js
heroPreview: {
  images: [
    { src: 'assets/img/chat-01.webp', alt: 'Public chat', caption: 'Chat with mentions.' },
    { src: 'assets/img/chat-02.webp', alt: 'Item preview', objectFit: 'contain' }
  ],
  autoplay: true,
  intervalMs: 5000,
  transitionMs: 240,
  pauseOnHover: true,
  objectFit: 'contain'
}
```

The paths are examples, not supplied game screenshots. The shipped configuration is empty so the original placeholder remains. An image list can also contain path strings, but objects are preferable because they provide meaningful `alt` text and optional captions. Per-image `objectFit` overrides the gallery default.

An empty or absent `images` list falls back to the previous `src`/`alt` single-image settings. A nonempty list takes precedence. To remove all images, empty both `images` and `src`.

## Modes

| Decodable, distinct sources | Behavior |
| --- | --- |
| 0 | Original placeholder; no slideshow controls or rotation timer. |
| 1 | One fixed image; no timer, navigation handlers, self-transition or cloned image. |
| 2+ | Decoded-image crossfade with automatic and manual navigation. |

Blank/invalid source entries and duplicate equivalent URLs are filtered. Each configured image is loaded and decoded once per mount. Loading failures or the 12-second load deadline exclude that entry for the current visit; reloading retries it. The initial placeholder stays until the load batch finishes. A batch with one successful image is rendered as static, not as a broken carousel.

Local relative URLs preserve offline use. Explicit remote image URLs are accepted, but naturally need an internet connection and may fail or time out; they are not included in the ZIP by reference alone.

## Navigation and timing

The current screenshot advances on click without opening another view. Previous/next buttons and direct indicators provide navigation in either direction. ArrowLeft, ArrowRight, Home and End work while focus is within the controls. On touch, horizontal swipes change the image; vertical gestures remain page scrolling. A synthetic click following a swipe does not cause a second change.

`intervalMs` is full-image dwell time before the next automatic transition (default 5000, range 1000–600000). `transitionMs` is fade duration (default 240, range 0–1000). Zero means an immediate change. Invalid nonnumeric values fall back to the defaults. Manual changes reset the dwell time. Only one rotation timeout is active; hidden time does not accumulate a queue of transitions.

Autoplay pauses while hovered if `pauseOnHover` is enabled, while the gallery is offscreen, in the documentation view and in a hidden browser tab. Entering the controls with focus stops rotation until explicit Play. The Play/Pause control is available for multi-image mode, even if `autoplay: false` starts it paused.

The reduced-motion preference disables autoplay and the fade; manual navigation remains enabled and Play is hidden. No product-level setting overrides that preference.

## Rendering and accessibility

Images are absolutely contained in the existing responsive canvas, so different source ratios do not resize it. `contain` shows the complete image; `cover` fills and may crop. A fully opaque outgoing image stays under the incoming fade. Interrupted fades are settled before another begins; no duplicate slide nodes or source swaps are needed.

Controls use native buttons, visible focus states, editable accessible labels and a polite status message for manual navigation only. Automatic changes do not repeatedly announce themselves. There is no lightbox, zoom overlay or fullscreen handler. The approach follows the [WAI carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).

Copy all control labels from `assets/js/data/ui-text.js` → `gallery` when translating a site. Edit surrounding placeholder, caption and product copy in `landing-content.js` → `hero.preview`.

## Files and lifecycle

- `assets/js/core/preview-gallery.js`: source normalization, decoding, controller and lifecycle.
- `assets/css/gallery.css`: gallery internals only; does not override outer rotation or canvas breakpoints.
- `assets/js/app.js`: mounts the configured asset key and pauses it during docs navigation.
- `assets/js/core/renderer.js`: retains the preview frame and provides the editable caption mount.

The current controller is available as `window.COREX_PREVIEW` with `ready`, `next()`, `previous()`, `goTo(index)`, `setActive(boolean)` and `destroy()`. This is an integration API, not a required editing step. Normal edits only require changing data and reloading the page.

For an intentional runtime replacement, call `COREX_GALLERY.mount(canvas, settings, labels)` and retain the returned controller. Mount disposes an existing controller on the same canvas; destroy cancels timeouts, load callbacks, observers and event listeners and restores the original placeholder/caption.

## Tests

```bash
node --test tests/*.test.cjs
node tests/validate-theme.mjs
python tests/browser_gallery.py
python tests/browser_preview_hover.py --embedded
python tests/browser_smoke.py --embedded
python tests/browser_ultrawide.py --embedded
python tests/browser_reference.py
```

The Python tests require `playwright` and `beautifulsoup4` plus a Playwright-supported Chromium installation. On a developer PC, install them in a local virtual environment and run `python -m playwright install chromium`. They are test dependencies only, not website runtime dependencies.

`browser_gallery.py` embeds the shipped files and generates tiny solid-color PNG fixtures in memory to test varied source dimensions. It does not ship fictional screenshots or replace the site with a mockup. Test scope and environmental limitations are recorded in `GALLERY_QA.md`.
