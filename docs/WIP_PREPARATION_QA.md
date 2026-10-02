# WIP preparation verification — 2026-10-02

## Remote status

**No repository was created, no files were pushed, no secrets were set and no Pages site was enabled during this preparation.** The available GitHub connector exposed read-only actions. No authenticated GitHub CLI was available in the working environment. The publication script is provided for execution under the owner's local GitHub CLI login.

The connection identified the owner as IceWolf23X. A read of the requested WIP repository returned 404 at preparation time; the publishing script checks again and refuses to overwrite an unrelated existing repository.

## Source defaults

- Live GitHub connector reads pinned CoreChatX-plugin/master to `8524f275cd77d83342e57ae7b94d5ba8384e68da`.
- Git blob hashes for all 19 allow-listed repository defaults match the raw local file bytes. The already-included snapshots required no content changes. See `DEFAULTS_VERIFIED.json`.
- `generated/velocity-advancements.properties` remains a separately labeled documentation-derived template. It is not claimed to be a resource in that inspected source commit.
- `node tools/build-config-bundle.mjs .` generated the offline JavaScript for 20 config sources.
- No private Java code, runtime player data, private repository checkout or credentials were copied to the public website package.

## Completed local checks

- `node --test`: **59 passed, 0 failed**, on Node 22.16.0.
- `node tests/validate-theme.mjs`: **67 articles, 20 config sources, 0 releases**, passed.
- New publisher tests use simulated Git/GitHub CLI replies. They cover wrong-account rejection, refusing an existing remote, public-repo setup, Pages POST/HTTPS, stop-on-push-failure and stop-on-deployment-failure. They do not claim live GitHub integration has run.
- Pages artifact tests cover allow-listed copying, exclusion of private checkout/Git/tool directories, symlink refusal, private-file refusal and preserving an earlier artifact on preflight failure.
- All three active workflow files parsed as valid YAML. Actions references were pinned to commit hashes returned from their upstream tags via the GitHub connector.
- Actual package publication preflight passed; the runner was stopped before executing any command.
- Static HTML CSS/JS references resolve inside the `/CoreChatX-WebSite-wip/` project path.
- All stylesheet files, the gallery and release renderer, and landing/wiki content are byte-identical to the base archive. Changes are deployment configuration, WIP release source, maintenance tools, tests and instructions.

## Browser checks and limitations

`python tests/browser_smoke.py --embedded` passed: all 67 articles rendered, theme, navigation, search, copy UI, mobile sidebar and six widths (375 through 1920), no JavaScript errors, no external requests.

`python tests/browser_github_releases.py` passed with the WIP source and deterministic mocked API data: download link targets, changelog sanitization, cache/navigation and error fallbacks, and 16 layouts across 320 through 7680 px in both themes. No actual release or JAR was fetched.

Native file navigation and the intercepted HTTPS project-path test both stopped at `ERR_BLOCKED_BY_ADMINISTRATOR` under the managed Chromium policy. They were not marked as passed. Embedded tests are not evidence of a live Pages deployment or native file loading. Live creation/permissions/Pages deployment must be verified by the supplied script when it is run with the owner's credentials; the script waits for its requested Actions run and reports failure/timeout instead of claiming success.

## Future automation not activated in this session

The initial site has all defaults and needs no private-repository secret to render or deploy. Future remote sync needs `COREX_PLUGIN_READ_TOKEN` to be added in the website settings. The plugin-side notifier remains an example; it has not been installed in the private repository. No broad GitHub CLI token is automatically copied into repository secrets.
