# Theme customization

The website is deliberately split into **theme code** and **editable data**.

## 1. Product identity

Edit `assets/js/data/site-config.js`.

Typical changes:

```js
brand: {
  product: 'CoreChatX',
  tagline: 'One suite, not ten plugins.',
  logo: 'assets/img/corechatx-logo.png',
  favicon: 'assets/img/corechatx-logo.png'
}
```

All values are public because the file is downloaded by every visitor. Never put repository tokens, Discord tokens, passwords or other secrets in it.

### Images and the preview gallery

Upload the assets into the website repository, then reference their relative paths from JavaScript. No HTML change is required:

```js
assets: {
  heroPreview: {
    images: [
      { src: 'assets/img/chat-01.webp', alt: 'Public chat', caption: 'Public chat with mentions.' },
      { src: 'assets/img/chat-02.webp', alt: 'Item preview', caption: 'A shared item snapshot.' }
    ],
    autoplay: true,
    intervalMs: 5000,
    transitionMs: 240,
    pauseOnHover: true,
    objectFit: 'contain'
  }
}
```

Zero valid images preserve the placeholder. One remains a static image without rotation timers or redundant controls. Two or more provide autoplay, click-to-next, previous/next buttons, direct indicators, pause/play and touch swipe. A single `src`/`alt` is still accepted when `images` is absent or empty.

Gallery labels are in `ui-text.js` under `gallery`. The surrounding preview wording remains in `landing-content.js`. Use local assets for offline access. See [GALLERY.md](GALLERY.md) for loading/error behavior, motion preferences and all settings; [../SETUP.md](../SETUP.md) contains the practical owner walkthrough.

## 2. Landing content

Edit `assets/js/data/landing-content.js`.

`order` controls section order. Each section contains its own headings, descriptions, cards, links and icon ids. Reordering or editing content does not require touching HTML.

## 3. Documentation content

Edit article metadata and navigation in `assets/js/data/docs-content.js`. Edit article prose in the matching `assets/content/docs/<article-id>.html` file.

Each article is a catalog object with metadata and a `bodyFile` path. The sidebar, search index, table of contents, previous/next navigation and source links are derived at runtime. `assets/js/generated/docs-bodies.js` is generated from the catalog and HTML sources; do not edit it by hand.

After changing an article body, run:

```bash
node tools/build-docs-bundle.mjs .
node tools/build-docs-bundle.mjs . --check
```

The first command writes the offline bundle and the second checks that it is current without writing. Add or remove an article by updating its catalog entry, HTML body and overview group/hub when needed, then rebuild and run `node tests/validate-theme.mjs`. Ordinary landing, identity and UI wording changes do not require this build.

Article bodies may contain trusted HTML directly in their dedicated source file. A plugin configuration article should **not** duplicate the default config. Instead use:

```js
configFile: {
  type: 'config-file',
  id: 'paper/config.yml'
}
```

and place the mount where the config should appear:

```html
<div class="config-file-mount" data-config-file="paper/config.yml"></div>
```

The renderer gets article HTML from the docs bundle and raw configuration content from `assets/js/generated/config-files.js`.

The synchronization manifest is format-agnostic. A future `.json`, `.toml`, `.config`, `.conf` or other text default can be added in `tools/config-sync-map.mjs` by setting its `format`; the renderer keeps the original bytes as text and uses the format only for the visible label / syntax class.

Example:

```js
{
  id: 'paper/example.config',
  platform: 'Paper',
  format: 'text',
  source: 'module/src/main/resources/example.config',
  target: 'synced-configs/paper/example.config',
  article: 'paper/example-config'
}
```

## 4. Interface wording

Edit `assets/js/data/ui-text.js` for search labels, buttons, copy/expand wording, documentation UI and theme toggle labels.

## 5. Theme colors

The normal product-level palette lives in `assets/js/data/site-config.js` under `theme.light` and `theme.dark`. The boot script applies those values before first paint and the same preference is shared by landing and wiki.

Layout, typography, component geometry and breakpoints remain CSS concerns in `assets/css/`.

## 6. Configuration synchronization

See `docs/GITHUB_SYNC.md`.

## 7. Public GitHub Releases

`site-config.js` → `releases` controls `owner`, `repository`, filename patterns, cache TTL, request timeout and pagination limit. `ui-text.js` → `releases` controls every label/status message. The release description on GitHub is the changelog. Do not edit `assets/js/generated/releases.js` by hand; regenerate it only when refreshing the optional offline snapshot. See [GITHUB_RELEASES.md](GITHUB_RELEASES.md) for publishing and migration.
