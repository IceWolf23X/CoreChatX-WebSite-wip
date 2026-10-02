# Theme architecture

## Runtime

```text
index.html (empty shell)
  -> site-config.js       product identity, links, asset paths, theme palette
  -> ui-text.js           interface wording
  -> landing-content.js   landing data
  -> docs-content.js      wiki data
  -> config-files.js      generated offline copy of raw plugin defaults
  -> renderer.js / docs.js / search.js / app.js
  -> core/preview-gallery.js   decoded-image gallery and lifecycle
```

Normal content changes do not require editing HTML or renderer code.

## Code highlighting

Both HTML entry points load the vendored Highlight.js 11.11.1 core, its matching properties grammar and `core/syntax-highlight.js` from local assets. The BSD-3-Clause license ships beside the vendor files. No CDN, package installation or external network request is needed for highlighting.

`docs.js` highlights the final article DOM after configuration mounts and layout changes; `reference-renderer.js` uses the same renderer after inserting all offline reference blocks. The adapter reads each block's raw `textContent`, highlights only an explicitly supported `language-*` label and preserves the text used by Copy. Plain text and unknown languages remain readable without autodetection. Already processed nodes are skipped; route changes insert fresh nodes and highlight them again.

`syntax-highlight.css` maps token classes to the existing `--code-*` variables, which follow the selected light/dark theme. It does not add padding, backgrounds or overflow rules to the code-box layout.

## Plugin configuration flow

```text
CoreChatX-plugin (private)
  -> GitHub Actions checkout
  -> tools/config-sync-map.mjs allow-list
  -> synced-configs/**          original YAML/properties bytes
  -> build-config-bundle.mjs
  -> assets/js/generated/config-files.js
  -> config-file mounts in docs-content.js
```

The raw file remains the source of truth. `docs-content.js` only decides **where** that file appears and adds the surrounding explanation.

The JavaScript bundle is generated solely for offline `file://` compatibility. On a hosted site it could be replaced by HTTP `fetch()`, but the committed bundle lets one package satisfy both hosted and double-click usage.

## Reuse for another CoreX plugin

1. Replace product identity and palette in `site-config.js`.
2. Replace landing content in `landing-content.js`.
3. Replace docs in `docs-content.js`.
4. Replace logo/images under `assets/` and point to them from JS.
5. Update `config-sync-map.mjs` with that plugin repository's public default files.
6. Configure the two GitHub secrets described in `GITHUB_SYNC.md` when cross-repository automation is needed.

## Preview gallery lifecycle

`app.js` reads the asset key selected by `COREX_LANDING.hero.preview.assetKey` and mounts `COREX_GALLERY` once. The controller normalizes/de-duplicates sources, decodes images and filters failures before mounting the visible slides. The normal app router calls `setActive(false)` on entry to the wiki. The controller also pauses when offscreen, on tab visibility changes, focus/hover and reduced-motion preference. `destroy()` removes timers, event listeners, observers and generated DOM; remounting on the same canvas disposes the previous instance.

Zero/one-image modes never start a rotation timer. Multi-image navigation reuses the existing image elements and leaves an opaque outgoing image underneath the incoming fade. The CSS for the gallery never writes `transform` on `.preview-shell`; the original hover and 32:9 styles remain independent. See `GALLERY.md`.

## Release data pipeline

```text
Public GitHub Releases of the WEBSITE repository
  -> release body/tag/published_at + uploaded JAR assets
  -> core/github-releases.js       public paginated API, caching, validation
  -> core/releases-core.js         safe Markdown and version ordering
  -> core/releases-renderer.js     #/releases + selected version

Optional: tools/build-releases.mjs -> generated/releases.js (offline public metadata)
```

The browser client is lazy: landing and wiki do not call the release API. It never sends credentials or downloads JAR bytes. A complete successful response replaces the catalog, including deletion/empty states; partial/error responses retain and label the last complete data. Raw public fields are cached rather than pre-rendered HTML. All changelogs are escaped/re-rendered on use.

Repository identity namespaces cache and snapshot data. URLs are limited to assets in the configured public repository. Missing SHA-256 is represented as missing, not invented. Filename patterns choose Paper/Velocity JARs in priority order and omit ambiguous matches. Details, operations and known limits are in `GITHUB_RELEASES.md`.
