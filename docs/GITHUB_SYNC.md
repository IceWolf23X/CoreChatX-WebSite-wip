# GitHub configuration synchronization

For exact setup steps and the secret-permission table, start with [../SETUP.md](../SETUP.md).

The website can keep its published configuration examples synchronized with a private plugin repository without exposing repository credentials to visitors.

## Data flow

```text
private plugin repository
        |
        | repository_dispatch / manual run
        v
website GitHub Action
        |
        +-- checkout private plugin with secret token
        +-- copy allow-listed defaults -> synced-configs/
        +-- build assets/js/generated/config-files.js
        +-- validate
        +-- commit changed snapshots
        v
static website + offline ZIP
```

The browser never talks to the private repository. It only receives files already committed to the website.

## Website secret

Create a repository secret named:

```text
COREX_PLUGIN_READ_TOKEN
```

Use a fine-grained PAT or GitHub App token with **read-only access to the private plugin repository contents**. Do not grant broader permissions than needed.

The workflow that consumes it is `.github/workflows/sync-plugin-configs.yml`.

### Optional website write token

By default the website workflow commits with its repository `GITHUB_TOKEN`. That is enough to update the branch. GitHub intentionally prevents most workflow runs from being recursively triggered by pushes made with that token.

For THIS WIP package, no extra website-write token is needed: `deploy-pages.yml` listens for successful completion of the trusted sync and release-snapshot workflows. It checks out current `main` and publishes only the runtime artifact. `COREX_WEBSITE_WRITE_TOKEN` remains optional for other pipelines. Do not reuse the private-source read token as a website write credential.

## Triggering from the private plugin repository

The website workflow supports:

- `workflow_dispatch` for manual synchronization;
- `repository_dispatch` with event type `corex-plugin-defaults-updated` for cross-repository automation.

An example notifier workflow is included at `docs/examples/plugin-repository-notify.yml`. Copy it into the private plugin repository and replace:

```text
OWNER/WEBSITE_REPOSITORY
```

with the actual website repository when adapting the template. The example in this WIP package is already configured for `IceWolf23X/CoreChatX-WebSite-wip`.

The plugin repository needs its own secret, for example:

```text
COREX_WEBSITE_DISPATCH_TOKEN
```

That token only needs access sufficient to create a repository-dispatch event in the website repository. A GitHub App is preferable when the same mechanism will be reused across several CoreX plugins.

## Which files are allowed to cross repositories?

`tools/config-sync-map.mjs` is the explicit publication allow-list. Only files listed there are copied. Do not replace this with a blanket copy of an entire resources or data directory.

This protects the website from accidentally publishing runtime state, generated player data, credentials or unrelated private resources.

`velocity-advancements.properties` is represented separately as a generated-runtime template because it is not a normal bundled source resource.

## Local reproduction

With both repositories checked out:

```bash
node tools/sync-plugin-configs.mjs ../CoreChatX-plugin .
node tools/build-config-bundle.mjs .
node tests/validate-theme.mjs
```

The generated JavaScript bundle is committed so direct `file://` opening keeps working without `fetch()`.

## Deployment is a separate step

The sync workflow updates snapshots. The included `Deploy GitHub Pages` workflow publishes them after a successful completion, including commits written with `GITHUB_TOKEN`. Run the first-publication script once to enable Pages (Actions source) and set `COREX_PAGES_ENABLED=true`. No deploy PAT is necessary. Failed sync never triggers a deployment of partial defaults.

The notifier does not forward a commit/ref. The source checkout uses the configured `ref` (currently `master`), regardless of the event that triggered it. The same source identity is repeated in `tools/config-sync-map.mjs`; keep both locations aligned.

For a fine-grained PAT, a website `repository_dispatch` needs **Contents: Read and write** on the website repository. Read-only access to the private plugin is a separate token and permission boundary. GitHub App installation tokens must be minted during execution, not treated as non-expiring static secrets.
