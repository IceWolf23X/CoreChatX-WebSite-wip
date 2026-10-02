# CoreChatX Configuration Instructions

This file is a complete reference for the current public config shape of CoreChatX.
It is intentionally split into `Paper backend` and `Velocity proxy` so the install remains readable.

The goal of this document is simple:
- describe the files that actually exist today
- mirror the current defaults bundled in the jars
- explain what each line does
- call out what is reloadable and what still needs a restart

Documentation set:
- `PLUGIN_FEATURES_LISTED.md` gives the feature overview
- this file is the canonical setup, configuration, runtime-data, troubleshooting, and operational reference

If a config file is deleted, CoreChatX recreates the bundled default on next boot.
That is the supported way to regenerate a clean config set.

---

## 0. Before You Configure

Use this document as the operational reference for a real installation.
It is intentionally more detailed than the feature list because it documents the files, runtime gates, restart requirements, and safety limits that matter when the plugin is already installed on a server.

Minimum expectations:
- Java 21 runtime
- Paper `1.21.11` for backend servers
- Velocity for multi-backend network installs
- the Paper CoreChatX jar installed only on Paper backends
- the Velocity CoreChatX jar installed only on Velocity

Optional integrations:
- LuckPerms for rank/group metadata and permission assignment
- PlaceholderAPI for dynamic placeholders in server-controlled templates
- PremiumVanish for suppressing hidden players' join, first-join, and quit announcements
- Discord bot token and required gateway intents for the Discord bridge
- Telegram bot token for the Telegram Bot API long-polling bridge

Core terminology:
- `Paper backend` means a real Minecraft server running the Paper jar
- `Velocity proxy` means the proxy process running the Velocity jar
- `STANDALONE` means one Paper server without cross-backend CoreChatX routing
- `PROXY` means a Paper backend connected to a Velocity network
- `server-id` is the unique CoreChatX identity of one Paper backend
- `network-channel` is the plugin messaging channel shared by Paper and Velocity
- `bridge` means Discord or Telegram inbound/outbound relay
- `runtime data file` means generated player/plugin state, not a decorative default config

High-level runtime model:
- Paper owns chat parsing, formatting, commands, chat items, bubbles, pings, local bridge rendering, and all static backend configuration
- In `STANDALONE`, Paper owns runtime player/plugin data in local YAML files or the explicitly selected MySQL backend
- In `PROXY`, Velocity owns runtime data that must survive backend switches: player settings, nicknames, ignore lists, active channels, mutes, global state, Discord links, and pending link codes
- Velocity also relays network packets, player directory data, global completions, TAB entries, and remote ChatItem snapshot requests
- external bridges are configured on Paper in `STANDALONE`; in `PROXY`, Velocity owns Discord while Paper backends still own Telegram
- player-authored chat is sanitized and controlled before it becomes a rendered Adventure component
- server-controlled templates can use MiniMessage and, where supported, PlaceholderAPI

Keep this distinction in mind:
- admin config strings are trusted server templates
- raw player messages are untrusted input
- runtime data files are live state

### CoreChatX project identity

Current public identity:
- product/plugin name: `CoreChatX`
- Paper plugin name: `CoreChatX`
- Velocity plugin id: `corechatx`
- Java package root: `me.icewolf23.corechatx`
- Maven parent artifact: `corechatx-parent`
- Maven runtime artifacts: `corechatx-paper` and `corechatx-velocity`
- shared common module: `corechatx-common`
- default Paper command: `/corechatx`
- default Paper command alias: `/ccx`
- default settings command alias: `/ccxsettings`
- default permission namespace: `corechatx.*`
- default plugin messaging channel: `corechatx:main`

Clean install rule:
- install `corechatx-paper-<version>.jar` on Paper
- install `corechatx-velocity-<version>.jar` on Velocity

When upgrading the 2026.3.0 storage corrections, deploy matching builds on Velocity and every Paper backend in the group. Settings intents, single-player ignore additions/removals, atomic chat-mute updates and first-join claims use new proxy request actions. An older proxy cannot acknowledge these actions, so a mixed deployment can reject or time out mutations. Command success waits for the authority response; a caller timeout does not prove that the write was cancelled. `/ignore` and `/unignore` apply the requested final state idempotently, including when an opposite request is still pending. Ignore capacity is checked by the authority.

Proxy moderation refuses public chat and private messages while the player's mute state is still unknown. The request remains asynchronous; the player receives the existing temporary runtime-data-unavailable message and can retry. A delayed negative read cannot override a known mute or cleared state. Velocity's YAML authority also checks normalized nickname uniqueness atomically with each nickname-bearing write, including competing requests for different players.

Paper's persistent YAML files are loaded strictly. A malformed or unreadable existing file stops storage initialization instead of being treated as empty data. A failed player/global reload also fences subsequent writes and shutdown flushes until the file is repaired and successfully reloaded. Preserve the original file and restore a verified backup or correct its syntax; do not delete live data to force startup.

- keep Paper data in `plugins/CoreChatX/`
- keep Velocity data in `plugins/corechatx/`

Old install rule:
- do not mix old jars, old plugin ids, old permission namespaces, or old network channels with CoreChatX
- treat older differently named config folders as old install data
- for a clean CoreChatX setup, let the plugin generate fresh defaults and manually reapply only the settings you still want

---

## 1. Layout Overview

### Paper backend folder

```text
plugins/CoreChatX/
```

### Velocity proxy folder

```text
plugins/corechatx/
```

### Files created from bundled defaults on Paper

```text
config.yml
messages.yml
chat.yml
pings.yml
filter.yml
chatitems.yml
keywords.yml
chatbubbles.yml
channels.yml
privacy.yml
moderation.yml
storage.yml
discord.yml
telegram.yml
locales/en_us.yml
```

### Additional Paper runtime files created on demand

```text
playerdata.yml
state.yml
channeldata.yml
ignoredata.yml
mutedata.yml
discordlinks.yml
```

### Velocity admin configuration files

```text
velocity-config.properties
velocity-discord.yml
velocity-messages.yml
velocity-storage.yml
velocity-advancements.properties
```

The first four files come from bundled resources. The proxy generates
`velocity-advancements.properties` as a disabled template on startup when it is missing;
its endpoint and backend credential bindings are documented in section 6.5.

### Additional Velocity runtime files created on demand

Each configured network group owns an isolated directory:

```text
data/groups/<encoded-channel>/player-state.yml
data/groups/<encoded-channel>/discord-links.yml
data/groups/<encoded-channel>/privacy.yml
data/groups/<encoded-channel>/moderation.yml
data/groups/<encoded-channel>/global-state.yml
```

These files contain authoritative proxy-mode state only when Velocity uses the default
`YAML` backend. Preserve the entire `plugins/corechatx/data/groups/` directory when
backing up or moving a YAML-backed Velocity install. With `MYSQL`, the corresponding
group scopes live in the configured database instead.

---

## 2. Reload vs Restart

Safe with `/corechatx reload`:
- `config.yml` for non-identity runtime toggles such as `debug`, hooks, logging, bridge/runtime gates, join/quit, first-join, network death announcements, and reload summary behavior
- `messages.yml`
- `chat.yml`
- `pings.yml`
- `filter.yml`
- `chatitems.yml`
- `keywords.yml`
- `chatbubbles.yml`
- `channels.yml`
- `privacy.yml`
- `moderation.yml`
- `storage.yml` can be reread safely, but backend/identity/MySQL changes are rejected and require restart
- `discord.yml`
- `telegram.yml`
- locale files under `locales/`

Paper starts and stops its Discord gateway asynchronously. A successful `/corechatx reload` does not wait for Discord token verification or gateway readiness; Minecraft commands remain available while the bot reconnects. Gateway listeners and ready-state tasks are installed on the Paper thread only for the current lifecycle generation. Late builds, cancelled installation tasks and retired gateway callbacks cannot reactivate the previous bridge.

In proxy mode, a normal Paper reload keeps the existing runtime-data client, hydrated player/privacy/moderation mirrors and pending storage requests. The client resolves the replacement network bridge through the current service registry. After transport registration, cached/online player domains and global state are refreshed asynchronously to recover updates missed while networking was disabled; existing values remain readable until the responses arrive. Final plugin shutdown still fails pending requests and clears the mirrors. This prevents transient default preferences or empty statistics after a configuration reload.

On each proxy-backed Paper join, including a backend switch, Paper proactively requests player settings, privacy/channel state, the player's mute and global state from Velocity on the next server tick. It does not wait for the player's first chat message to start loading moderation data. The reads run asynchronously, with up to three attempts and ten server ticks between failed attempts. Paper waits for valid authority replies before applying its accepted-join display updates and first-join claim; callbacks for a departed or replaced connection are discarded. Unknown mute state still denies public/private messages until confirmed, so a slow or unavailable proxy can still produce the temporary-unavailability message. Failed writes are not automatically retried.

The Paper-to-Velocity reply deadline is five seconds per request, separate from `storage.operation-timeout-ms` on Velocity. RPC timeout diagnostics include the operation, request ID, backend and player ID. Increasing the storage timeout alone does not extend that network reply deadline.

If deployment mode, server ID or network channel is edited, reload retains the boot identity and logs a restart-required warning; ordinary runtime toggles still take effect.

Requires full restart to truly take effect:
- `config.yml -> deployment.mode`
- `config.yml -> deployment.server-id`
- `config.yml -> deployment.network-channel`
- `config.yml -> advancement-sync.enabled`, `advancement-sync.endpoint`, and `advancement-sync.token`; `/corechatx reload` retains the boot service and its endpoint credentials
- switching a backend between standalone and proxy deployment
- changing any Velocity admin config (`velocity-config.properties`, `velocity-discord.yml`, `velocity-messages.yml`, `velocity-storage.yml`, or `velocity-advancements.properties`); there is no proxy-side config reload command
- when Velocity `velocity-config.properties -> network-channel` changes, affected Paper backends must also use the same new `deployment.network-channel`

Important deployment rule:
- Paper backends and the Velocity proxy must use the exact same network channel

Artifact model:
- CoreChatX currently ships as two separate runtime jars.
- CoreChatX Paper jar: install `corechatx-paper-<version>.jar` on each Paper backend.
- CoreChatX Velocity jar: install `corechatx-velocity-<version>.jar` on the Velocity proxy.
- Do not install the Paper jar on Velocity, and do not install the Velocity jar on Paper.
- source builds compile `corechatx-common` once as an internal shared module
- Maven Shade embeds exactly one copy of `corechatx-common`, `corechatx-storage-mysql`, HikariCP, and Connector/J in each runtime jar; platform/bridge libraries keep their existing Paper/Velocity loading model
- source builds also produce `corechatx-common-<version>.jar` and `corechatx-storage-mysql-<version>.jar`, but neither internal module jar is installed separately on a server

---

## 3. Quick Install Patterns

### Standalone Paper

Use the default backend config:

```yml
deployment:
  mode: "STANDALONE"
  server-id: "paper-1"
  network-channel: "corechatx:main"
  bridges-allowed: true
  network-features-allowed: false
```

In this setup:
- no Velocity module is required
- `NETWORK` channels behave as normal local backend chat
- cross-server PM routing is inactive
- network player directory, global TAB entries, and cross-backend chat completions are inactive

### Velocity network

On each Paper backend:
- set `deployment.mode: "PROXY"`
- set a unique `deployment.server-id`
- set `deployment.network-channel` to the CoreChatX group that backend should join
- set `deployment.network-features-allowed: true`

On Velocity:
- install the Velocity CoreChatX jar
- list every allowed group channel in `velocity-config.properties -> network-channel`

Example backend identities:
- `alpha`
- `beta`
- `survival-1`
- `hub`

Network behavior enabled by this setup:
- `NETWORK` channels can cross backend boundaries
- cross-server PM delivery can use the proxy route
- player communication settings are synchronized through Velocity
- active channel state, ping toggles, PM toggle, social spy, mention notifications, locale, staff-chat state, and ignore lists can follow backend switches
- the proxy can provide global player name completions and TAB entries for players connected to configured backends
- network chat preserves rendered Adventure components, ChatItem preview refs, mentions, and activated custom ping metadata across backends
- Velocity treats the real backend connection as the source of truth for proxy packets; backend-declared source ids cannot override it
- malformed, oversized, or oversized-generated plugin-message payloads are rejected before routing

### Production setup checklist

For a clean standalone Paper install:
- install only the Paper jar
- keep `deployment.mode: "STANDALONE"`
- keep `deployment.network-features-allowed: false`
- configure formats, channels, messages, moderation, chat items, keywords, bubbles, and optional bridges on that backend
- restart after changing deployment identity fields
- use `/corechatx reload` for normal wording, formatting, channel, filter, and feature tuning

For a clean Velocity network install:
- install the Paper jar on every backend
- install the Velocity jar on the proxy
- set every backend to `deployment.mode: "PROXY"`
- give every backend a unique `deployment.server-id`
- set each backend `deployment.network-channel` to the isolated group it should join
- include each backend group channel in `plugins/corechatx/velocity-config.properties -> network-channel`
- set `deployment.network-features-allowed: true` on each backend that should participate in cross-server features
- restart the affected Paper backends and Velocity after changing identity or network channel values

For `2026.2.0` upgrades, a clean setup is recommended. Regenerate fresh Paper and Velocity config files, then reapply server-specific values such as `deployment.*`, channels, Discord token, Discord routes and required role IDs. In proxy mode, do not reuse old backend runtime YAML as authoritative network data because Velocity now owns runtime/user state.

For bridge installs:
- keep `deployment.bridges-allowed: true`
- enable only the bridge services you actually use
- enable outbound export only on the CoreChatX channels that should leave Minecraft
- configure inbound routes so external messages land in an intentional CoreChatX channel
- in `STANDALONE`, Paper `discord.yml` owns Discord bridge inbound/outbound
- in `PROXY`, Velocity `velocity-discord.yml` owns Discord bridge inbound/outbound and forwards packets to the proper CoreChatX group
- in `PROXY`, Paper `discord.yml` may still run `discord.console.*` for backend console access only
- Telegram remains Paper-owned in both deployment modes; network export is emitted only by the source backend

For PlaceholderAPI-heavy installs:
- install PlaceholderAPI on every backend that must render placeholders
- install the expansions required by your formats
- keep raw player messages separate from admin templates
- remember that mention token placeholders use the mentioned player as context
- test offline-player placeholder behavior before relying on it for cross-backend hover text

For ChatItems on a network:
- keep ChatItems enabled only on the channels where previews are wanted
- tune byte limits only if you understand the size of your custom item metadata
- prefer the bundled on-demand snapshot flow over embedding huge item data into every network chat packet
- accept that expired or rejected snapshots should fail closed with a normal expired-preview message

---

## 4. Paper Backend Files

## 4.1 `config.yml`

Modrinth update checks:

- `update-check.enabled` defaults to `true`; disabling it prevents update-check HTTP requests.
- Checks run off-thread about 10 seconds after activation, then every `update-check.interval-hours` (default `24`, clamped to `1–168`). Paper reload replaces the checker; Velocity changes require restart.
- Console and online OP players receive newly available versions. OP players joining later receive the cached result; joins never query Modrinth. Notifications repeat on a new login session, not on every periodic check. Each Paper backend uses its local OP status; Velocity reports only in console.
- Only stable releases are recommended. The newest eligible beta and alpha are announced separately for testing; previews already superseded by a stable release are suppressed.
- Paper and Velocity consoles display separate colored banners: green for stable updates, yellow for experimental alpha/beta builds. Each banner separates the installed version, available version, release channel, recommendation and download URL. In-game OP notices retain the configurable message templates below.
- Paper filters by loader and exact Minecraft version. Velocity filters by its loader because it cannot infer all backend versions; check network compatibility before upgrading.
- Comparison uses numeric `major.minor.patch` versions and optional fourth-component hotfix revisions, including `2026.3.0.1-hotfix`. Preview suffixes `-alpha.N`, `-beta.N`, `-rc.N` and `-snapshot.N`, plus build metadata, remain supported. Unknown formats are skipped; preview suffixes cannot be advertised as stable updates. The older `2026.3.0` checker cannot recognize the four-part hotfix format, so this first hotfix must be downloaded manually.
- HTTP timeout is five seconds; failures are reported once until a successful check and retried at the normal interval. No automatic JAR download or installation takes place.
- Customize OP messages in `messages.yml`: `updates.stable` and `updates.preview`, with `{version}`, `{installed}`, `{channel}` and `{url}` placeholders.

Purpose:
- deployment mode
- backend identity
- proxy transport gates
- bridge master switch
- hook toggles
- logging toggles
- general reload/save behavior

Current bundled default:

```yml
# Core plugin settings.

deployment:
  # STANDALONE = Paper-owned runtime data, using the backend selected in storage.yml.
  # PROXY = Velocity-backed network mode. Runtime player data is owned by the CoreChatX Velocity module.
  # Changing this mode requires a full restart.
  mode: "STANDALONE"
  require-full-restart-on-mode-change: true
  # Backend id used for proxy routing and bridge source labels.
  server-id: "paper-1"
  # Plugin messaging channel shared with the Velocity module.
  # In PROXY mode this also selects the isolated Velocity data/routing group for this backend.
  network-channel: "corechatx:main"
  # Global switch for Discord / Telegram chat bridge runtime.
  # Discord console-only bots may still start through discord.yml -> discord.console.*.
  bridges-allowed: true
  # When false, Paper still boots in PROXY mode but proxy transport is intentionally disabled.
  # Cross-server chat, PM routing, player directory sync, and proxy-owned runtime data operations will not run.
  network-features-allowed: false
  pending-pm-timeout-seconds: 20

debug: false

# Announces stable updates and experimental alpha/beta builds; never installs them.
# Checks after startup and at this interval (clamped to 1-168 hours).
# Console and OP players are notified; only stable builds are recommended.
update-check:
  enabled: true
  interval-hours: 24

hooks:
  # If true, PlaceholderAPI placeholders inside CoreChatX config formats are parsed when the plugin is present.
  placeholderapi: true
  # If true, LuckPerms group prefixes are read when the plugin is present.
  luckperms: true
  # If true, join, first-join, and quit announcements are suppressed for PremiumVanish-hidden players.
  premiumvanish: true

logging:
  public-chat: true
  private-messages: true
  broadcasts: true
  reload: true
  errors: true

player-data:
  # STANDALONE only: toggle commands still save immediately; this mainly controls the fallback save on plugin disable.
  # In PROXY mode player settings, nicknames, ignore lists, active channel, mutes, global state and Discord links are stored by Velocity.
  auto-save-on-disable: true

nicknames:
  # Prefix prepended to {player_nickname} only when the player has a custom nickname.
  # Leave empty to show the nickname exactly as set with /nick.
  # Example: "~" makes {player_nickname} render as ~Nick while {player_name} still renders the real Minecraft username.
  prefix: ""
  # false = /nick can change the visible name text and styling, for example IceWolf23X -> IceWolf.
  # true = /nick can only change allowed colors/styles; the visible text after removing formatting must stay exactly the real Minecraft username.
  # Example with true: IceWolf23X may use &cIceWolf23X, but not &cIceWolf.
  change-only-colors: false
  # false = nickname text may only use A-Z, a-z, 0-9 and _ after formatting is removed.
  # true = CoreChatX does not apply an additional character whitelist to nickname text.
  allow-special-characters: false

first-join:
  enabled: true
  counter-enabled: true

join-quit:
  # LOCAL = announce only on the current Paper backend.
  # NETWORK = in PROXY mode, Velocity owns true network join/leave announcements and uses velocity-messages.yml.
  mode: "LOCAL"
  join-enabled: true
  quit-enabled: true

advancement-sync:
  # Full advancement progress and live announcements within the same Velocity group.
  # Enable on every participating Paper backend; requires updated Paper AND Velocity builds.
  # Restart required. Existing progress is merged when a player visits each backend.
  # Disable advancement synchronization in other plugins first. Historical restores grant no rewards.
  # The proxy stores progress with its configured YAML/MySQL authority; Minecraft files are retained.
  enabled: false
  # Match deployment.server-id to the registered Velocity backend name.
  # Remote endpoints require HTTPS; plaintext HTTP accepts only a literal loopback address.
  endpoint: "http://127.0.0.1:8767/corechatx/advancements"
  # Unique secret for this backend, matching velocity-advancements.properties on the proxy.
  token: "${CORECHATX_ADVANCEMENT_TOKEN}"

death-messages:
  # Opt in to sending AND receiving death messages between Paper backends in the same Velocity group.
  # Requires PROXY mode, network-features-allowed, and matching updated Paper/Velocity builds.
  # Local death messages stay unchanged. Hidden, cancelled and team-restricted deaths are not forwarded.
  network-enabled: false

reload:
  # A short summary is shown to the command sender after a successful reload.
  show-summary: true
```

Operational notes:
- `deployment.mode`, `deployment.server-id`, and `deployment.network-channel` require restart
- the startup log prints a `CORECHATX` banner with version, author, Paper architecture, GitHub and wiki links, then the deployment summary and transport state
- invalid proxy channel config does not crash the whole plugin; it degrades transport and logs the reason
- network channels must use lowercase Minecraft namespaced-key style, such as `corechatx:main` or `corechatx:network/main`
- invalid channel examples include `CoreChatX:main`, `core chat x:main`, `corechatx`, and `corechatx:Main`
- `deployment.bridges-allowed: false` disables outbound bridge dispatch and inbound Discord/Telegram chat bridge runtime; Discord console-only bots can still start through `discord.console.*`
- `deployment.network-features-allowed: false` leaves `PROXY` deployment bootable but intentionally disables proxy transport and all cross-server features
- `deployment.pending-pm-timeout-seconds` is clamped to at least 5 seconds
- with `hooks.placeholderapi: true`, almost every player-facing configurable string supports PlaceholderAPI placeholders when PlaceholderAPI is installed
- CoreChatX also registers `%corechatx_player_nickname%`, `%corechatx_first_join_date%` and `%corechatx_messages_count%` for other plugins when PlaceholderAPI is installed

### Optional PremiumVanish connection announcements

CoreChatX uses PremiumVanish's public API to suppress hidden players' join, first-join, and quit announcements before they reach Minecraft chat or the configured connection-message bridges. Visible players keep the configured announcement behavior. First-join storage and counters still record accepted connections, including hidden players.

- On a standalone Paper server, install PremiumVanish alongside CoreChatX and leave `config.yml -> hooks.premiumvanish: true`. The same hook also covers local Paper announcements in `PROXY` deployments using `join-quit.mode: LOCAL`.
- For Velocity-owned network announcements, install PremiumVanish on Velocity and leave `velocity-config.properties -> hooks.premiumvanish=true`. Configure PremiumVanish's backend/proxy synchronization according to its own installation instructions; a backend-only PremiumVanish installation cannot provide the proxy API hook.
- The hook is optional and enabled by default. Without PremiumVanish, announcements retain their existing behavior. Set the hook flag to `false` to disable this integration explicitly. Paper hook changes apply through `/corechatx reload`; Velocity changes require a restart.
- When an installed PremiumVanish API is incompatible or a visibility query fails, CoreChatX suppresses connection announcements and logs one diagnostic for that hook instance instead of assuming the player is visible. After fixing the provider, reload CoreChatX on Paper or restart Velocity to reinitialize the hook. If Velocity cannot bind the hide/show events, quit announcements are suppressed because its online-only API cannot safely be queried after disconnect.
- This integration controls connection announcements and their bridge copies. It does not filter TAB entries, player lists, chat, or other events, and does not generate fake joins/quits when vanish is toggled.

### Optional full advancement synchronization

`advancement-sync.enabled` opts Paper into group-owned progress synchronization and live public advancement announcements. It defaults to `false`. The Velocity endpoint is independently disabled until configured in `velocity-advancements.properties`.

Follow [the full advancement synchronization guide](ADVANCEMENT_SYNC.md) before enabling it. It covers complete plugin/world/database backups, backend group pins, unique credentials, local HTTP or remote HTTPS, progressive merging of existing criteria, silent historical restoration, revocations, shutdown order and YAML/MySQL backup support. Disable overlapping advancement synchronization in other plugins first. All participating builds must match; the native silent-restoration adapter fails closed on unsupported Paper internals.

### Optional death messages across backends

This option lets players see public death announcements from other Paper backends in the same Velocity group. It is **disabled by default**, including when the setting is missing from an existing configuration. Standalone servers keep their normal local death messages.

1. Install builds that support this option on Velocity and all participating Paper backends, then restart them. Existing protocol-29 messages are unchanged, but older builds cannot handle the new death-message packet types.
2. On each participating Paper backend, confirm `deployment.mode: "PROXY"`, `deployment.network-features-allowed: true`, and a `deployment.network-channel` belonging to the intended Velocity group. Keep its `deployment.server-id` aligned with its registered backend name. Deployment identity changes require a restart.
3. In each of those Paper servers' `plugins/CoreChatX/config.yml`, set:

   ```yml
   death-messages:
     network-enabled: true
   ```

4. Run `/corechatx reload` on each changed Paper backend. This toggle controls **both sending and receiving**; leave it `false` on a backend that should not participate. No additional Velocity toggle is required.
5. With players on two backends in the same group, trigger a normal visible death. The source backend shows its normal local announcement once; the other enabled backend receives the same component. Other groups and disabled backends receive no announcement.

The relay preserves the public event's Adventure component, including vanilla translations, colors and hover content. It does not apply the `/broadcast` format, trigger mention notifications, increment chat statistics, or export a second death event to Discord. Existing Discord death-mirror settings remain independent.

Cancelled deaths, null/blank messages, events with `showDeathMessages` disabled, and deaths restricted by the server scoreboard's team visibility are not forwarded. Teams are local to each backend, so only unrestricted announcements can be safely shared. The private death-screen message is never exported. Plugin-message transport requires online player connections; this is a live announcement, with no history or replay when a backend is empty or unavailable.

---

## 4.2 `chat.yml`

Purpose:
- public chat formatting
- group-specific format overrides
- mention token formatting
- public and PM cooldowns

Current bundled default:

```yml
# Public chat formatting and moderation settings.

public-chat:
  enabled: true
  # Supported placeholders inside the format:
  # {plugin_prefix}, {channel_prefix}, {rank_prefix}, {player_name}, {player_nickname}, {message}
  # {player_name} is always the real Minecraft username.
  # {player_nickname} is the custom nickname when set, otherwise the real Minecraft username.
  # Layout inspired by the older NetworkChat proxy format:
  # prefix + player name + italic separator + processed message.
  # CoreChatX keeps its own default palette instead of copying the old colors verbatim.
  format: "{plugin_prefix} {channel_prefix}{rank_prefix}<white>{player_nickname}</white><dark_gray><italic>» </italic></dark_gray>{message}"
  # Optional group-specific format overrides keyed by LuckPerms primary group.
  # These are used only when channels.yml -> format is blank for the active channel.
  # Keys must match the LuckPerms primary group in lowercase.
  group-formats:
    owner: "{plugin_prefix} {channel_prefix}{rank_prefix}<white>{player_nickname}</white><dark_gray><italic>» </italic></dark_gray>{message}"
    admin: "{plugin_prefix} {channel_prefix}{rank_prefix}<white>{player_nickname}</white><dark_gray><italic>» </italic></dark_gray>{message}"
    mod: "{plugin_prefix} {channel_prefix}{rank_prefix}<white>{player_nickname}</white><dark_gray><italic>» </italic></dark_gray>{message}"
    vip: "{plugin_prefix} {channel_prefix}{rank_prefix}<white>{player_nickname}</white><dark_gray><italic>» </italic></dark_gray>{message}"
    default: "{plugin_prefix} {channel_prefix}{rank_prefix}<gray>{player_nickname}</gray><dark_gray><italic>» </italic></dark_gray>{message}"
  plugin-prefix: "<dark_gray>[</dark_gray><gradient:#79d6b8:#5aa9ff>Chat</gradient><dark_gray>]</dark_gray>"
  # Applied to non-global active channels such as local or staff.
  channel-prefix-format: "<dark_gray>[</dark_gray><white>{channel_name}</white><dark_gray>]</dark_gray> "
  fallback-rank-prefix: ""

mentions:
  enabled: true
  # Mention matching accepts both Steve and @Steve when the token matches a local or network-online player exactly.
  # If disabled, names are left as normal text and no mention notification logic runs.
  # The resolver accepts real usernames and custom plain nicknames; this format controls what the rendered mention displays.
  # {player_name} is the real Minecraft username. {player_nickname} is the visible nickname when set.
  token-format: "<#79d6b8>@{player_nickname}</#79d6b8>"

cooldowns:
  public:
    enabled: true
    seconds: 2
  private-messages:
    enabled: false
    seconds: 2
```

Format priority:
1. `channels.<id>.format`
2. `public-chat.group-formats.<luckperms-primary-group>`
3. `public-chat.format`

Important notes:
- `{rank_prefix}` works in every `group-formats.<group>` entry
- if LuckPerms is not available, group-specific formats are skipped and CoreChatX falls back to the base format
- if you already manage rank prefixes in LuckPerms, prefer `{rank_prefix}` over hardcoded titles in this file
- PlaceholderAPI placeholders can be used in most admin-controlled rendered strings, including chat formats and group formats, when PlaceholderAPI support is enabled
- raw player-authored message bodies do not pass through PlaceholderAPI; this prevents players from resolving arbitrary `%placeholder%` tokens inside normal chat text
- `mentions.token-format` resolves `{player_name}` to the mentioned player's name
- PlaceholderAPI in `mentions.token-format` uses the mentioned player as context, not the sender
- for cross-backend mentions, CoreChatX uses the mentioned player's `OfflinePlayer` context so PlaceholderAPI expansions with offline support can still resolve
- negative cooldown seconds are treated as `0`

---

## 4.3 `messages.yml`

Purpose:
- general user-facing text
- command feedback
- PM layouts
- moderation messages
- join/quit messages
- chat item feedback

Current bundled default:

```yml
# Main message file.
# Supported placeholders vary by message, but common ones include:
# {prefix}, {player_name}, {player_nickname}, {target_name}, {sender_name}, {message}, {seconds}, {count}, {setting}, {state}

prefix: "<dark_gray>[</dark_gray><gradient:#79d6b8:#5aa9ff>CoreChatX</gradient><dark_gray>]</dark_gray>"

errors:
  no-permission: "{prefix} <red>You do not have permission to do that.</red>"
  players-only: "{prefix} <red>Only players can use this command.</red>"
  player-not-found: "{prefix} <red>That player is not online.</red>"
  cannot-message-self: "{prefix} <red>You cannot message yourself.</red>"
  empty-message: "{prefix} <red>Your message is empty after sanitization.</red>"
  no-reply-target: "{prefix} <red>You do not have anyone to reply to.</red>"
  invalid-chatitem-id: "{prefix} <red>This chat item preview is no longer available.</red>"
  invalid-usage: "{prefix} <red>Usage: {usage}</red>"
  runtime-storage-unavailable: "{prefix} <red>CoreChatX runtime data is temporarily unavailable. Try again in a moment.</red>"

reload:
  success: "{prefix} <green>Reload complete.</green>"
  summary: "{prefix} <gray>Modules reloaded: chat, pings, PMs, filter, chat items, player data hooks.</gray>"

commands:
  corechatx-help:
    header: "{prefix} <gray>Available CoreChatX subcommands:</gray>"
    reload: "<gray>/corechatx reload</gray>"
    settings: "<gray>/corechatx settings</gray>"
    locale: "<gray>/corechatx locale [tag]</gray>"
    itemcache: "<gray>/corechatx itemcache [warmup|status|cancel]</gray>"

locale:
  current: "{prefix} <gray>Your active locale is <white>{locale}</white>.</gray>"
  changed: "{prefix} <gray>Your locale is now <white>{locale}</white>.</gray>"
  invalid: "{prefix} <red>Locale <white>{locale}</white> is not available on this server.</red>"

channels:
  list: "{prefix} <gray>Available channels: <white>{channels}</white></gray>"
  switched: "{prefix} <gray>Your active channel is now <white>{channel_name}</white>.</gray>"
  not-found: "{prefix} <red>Channel <white>{channel_name}</white> does not exist.</red>"
  disabled: "{prefix} <red>Channel <white>{channel_name}</white> is currently disabled.</red>"
  no-send-permission: "{prefix} <red>You cannot send messages to that channel.</red>"
  hidden-no-send: "{prefix} <red>Channel <white>{channel_name}</white> is hidden. Use <white>/unhidechannel {channel_name}</white> first.</red>"
  hide-success-permanent: "{prefix} <gray>Channel <white>{channel_name}</white> is now hidden until you unhide it.</gray>"
  hide-success-temporary: "{prefix} <gray>Channel <white>{channel_name}</white> is now hidden for <white>{minutes}</white> minute(s).</gray>"
  unhide-success: "{prefix} <gray>Channel <white>{channel_name}</white> is visible again.</gray>"
  not-hidden: "{prefix} <yellow>Channel <white>{channel_name}</white> is not currently hidden.</yellow>"

privacy:
  ignore-disabled: "{prefix} <red>Ignore commands are currently disabled.</red>"
  ignore-self: "{prefix} <red>You cannot ignore yourself.</red>"
  ignore-limit: "{prefix} <red>You cannot ignore more than <white>{limit}</white> players.</red>"
  already-ignoring: "{prefix} <yellow>You are already ignoring <white>{target_name}</white>.</yellow>"
  not-ignoring: "{prefix} <yellow>You are not ignoring <white>{target_name}</white>.</yellow>"
  ignore-added: "{prefix} <gray>You are now ignoring <white>{target_name}</white>.</gray>"
  ignore-removed: "{prefix} <gray>You are no longer ignoring <white>{target_name}</white>.</gray>"
  ignore-list: "{prefix} <gray>Ignored players: <white>{targets}</white></gray>"
  pm-toggled: "{prefix} <gray>Private messages are now <white>{state}</white>.</gray>"

moderation:
  mute-disabled: "{prefix} <red>Mute commands are currently disabled.</red>"
  mutechat-disabled: "{prefix} <red>Global chat mute is currently disabled.</red>"
  muted-public: "{prefix} <red>You are muted and cannot use public chat right now.</red>"
  muted-private: "{prefix} <red>You are muted and cannot send private messages right now.</red>"
  chat-muted: "{prefix} <red>Public chat is currently muted.</red>"
  chat-muted-toggled: "{prefix} <gray>Global chat mute is now <white>{state}</white>.</gray>"
  anti-repeat: "{prefix} <red>Please do not repeat the same message.</red>"
  anti-caps: "{prefix} <red>Please avoid excessive caps.</red>"
  mute-success: "{prefix} <gray>Muted <white>{target_name}</white>. Reason: <white>{reason}</white></gray>"
  unmute-success: "{prefix} <gray>Unmuted <white>{target_name}</white>.</gray>"
  clear-chat-notice: "{prefix} <gray>Chat was cleared by <white>{sender_name}</white>.</gray>"
  clear-chat-sender: "{prefix} <gray>Cleared chat for <white>{count}</white> online player(s).</gray>"

cooldown:
  public: "{prefix} <yellow>You must wait <white>{seconds}</white> more second(s) before chatting again.</yellow>"
  pm: "{prefix} <yellow>You must wait <white>{seconds}</white> more second(s) before sending another private message.</yellow>"

ping:
  toggles:
    # Used by /ping <sound|actionbar> status with placeholders {setting} and {state}.
    status: "{prefix} <gray>Ping <white>{setting}</white> notifications are currently <white>{state}</white>.</gray>"
    sound-changed: "{prefix} <gray>Ping sound notifications are now <white>{state}</white>.</gray>"
    actionbar-changed: "{prefix} <gray>Ping actionbar notifications are now <white>{state}</white>.</gray>"
  state-on: "<green>enabled</green>"
  state-off: "<red>disabled</red>"
  # Used when a player is pinged by a mention or a custom ping.
  notification-actionbar: "<gold>Ping:</gold> <yellow>{sender_name}</yellow> mentioned you."
  notification-sound: "ENTITY_EXPERIENCE_ORB_PICKUP"
  notification-volume: 0.85
  notification-pitch: 1.25

private-messages:
  to-sender: "<dark_gray>[</dark_gray><light_purple>PM</light_purple><dark_gray>]</dark_gray> <gray>you -> </gray><white>{target_name}</white><dark_gray>: </dark_gray>{message}"
  to-target: "<dark_gray>[</dark_gray><light_purple>PM</light_purple><dark_gray>]</dark_gray> <white>{sender_name}</white><gray> -> you</gray><dark_gray>: </dark_gray>{message}"
  spy: "<dark_gray>[</dark_gray><red>SPY</red><dark_gray>]</dark_gray> <white>{sender_name}</white><gray> -> </gray><white>{target_name}</white><dark_gray>: </dark_gray>{message}"
  disabled-target: "{prefix} <red>That player has private messages disabled.</red>"
  blocked-by-target: "{prefix} <red>That player is not accepting messages from you.</red>"
  remote-unavailable: "{prefix} <red>The proxy transport could not forward that private message right now.</red>"
  received-sound: "BLOCK_NOTE_BLOCK_BELL"
  received-volume: 0.85
  received-pitch: 1.1
  socialspy-on: "{prefix} <gray>Social spy is now <green>enabled</green>.</gray>"
  socialspy-off: "{prefix} <gray>Social spy is now <red>disabled</red>.</gray>"

broadcast:
  format: "<dark_gray>[</dark_gray><gold>Broadcast</gold><dark_gray>]</dark_gray> <white>{sender_name}</white><dark_gray>: </dark_gray><gold>{message}</gold>"

nickname:
  changed: "{prefix} <gray>Your nickname is now <white>{nickname}</white>.</gray>"
  cleared: "{prefix} <gray>Your nickname has been cleared.</gray>"
  changed-other: "{prefix} <gray>Set <white>{target_name}</white>'s nickname to <white>{nickname}</white>.</gray>"
  cleared-other: "{prefix} <gray>Cleared <white>{target_name}</white>'s nickname.</gray>"
  invalid: "{prefix} <red>That nickname is invalid. Use one visible word after formatting is removed.</red>"
  duplicate: "{prefix} <red>That nickname is already used by another player or matches another player's real username.</red>"
  name-change-disabled: "{prefix} <red>Nicknames can only change colors/styles. The visible text must stay exactly the player's real Minecraft username.</red>"
  too-long: "{prefix} <red>Nicknames can be at most <white>{limit}</white> visible characters.</red>"
  realname: "{prefix} <white>{player_nickname}</white><gray>'s real name is </gray><white>{player_name}</white><gray>.</gray>"
  realname-not-found: "{prefix} <red>No custom nickname matches that value.</red>"

discord:
  link-check-unavailable-kick: "<red>Discord account link verification is temporarily unavailable. Try again later.</red>"
  link-code: "{prefix} <gray>Use Discord command <white>/{link_command} code:{code}</white> within <white>{minutes}</white> minute(s) to link your account.</gray>"
  link-required-kick: "<red>You must link your Discord account to play.</red>\n<gray>Use Discord command </gray><white>/{link_command} code:{code}</white><gray> within </gray><white>{minutes}</white><gray> minute(s).</gray>"
  missing-required-role-kick: "<red>Your Discord account is linked, but you do not have the required Discord role to play.</red>"
  role-check-unavailable-kick: "<red>Discord role verification is temporarily unavailable. Try again later.</red>"
  already-linked: "{prefix} <yellow>Your Minecraft account is already linked to Discord. Use <white>/discord unlink</white> first.</yellow>"
  linking-disabled: "{prefix} <red>Discord account linking is currently disabled.</red>"
  link-unavailable: "{prefix} <red>Discord account linking data is temporarily unavailable. Try again later.</red>"
  linked-status: "{prefix} <gray>Your Minecraft account is linked to Discord user id <white>{discord_id}</white>.</gray>"
  not-linked: "{prefix} <yellow>No Discord account is linked.</yellow>"
  unlinked: "{prefix} <gray>Discord account link removed.</gray>"
  admin-linked: "{prefix} <gray>Linked <white>{player_name}</white> to Discord user id <white>{discord_id}</white>.</gray>"
  invalid-discord-id: "{prefix} <red>That Discord user id is invalid.</red>"

chat:
  no-message-sent: "{prefix} <yellow>Nothing was sent because the message is empty after sanitization.</yellow>"

join-quit:
  join: "<dark_gray>[</dark_gray><green>+</green><dark_gray>]</dark_gray> <white>{player_nickname}</white>"
  quit: "<dark_gray>[</dark_gray><red>-</red><dark_gray>]</dark_gray> <white>{player_nickname}</white>"
  first-join: "<dark_gray>[</dark_gray><gradient:#79d6b8:#5aa9ff>Welcome</gradient><dark_gray>]</dark_gray> <white>{player_nickname}</white><gray> is joining for the first time as player </gray><white>#{count}</white><gray>.</gray>"

chatitems:
  # Hover shown on clickable chat preview tokens.
  click-to-open: "<gray>Click to open the saved preview.</gray>"
  expired: "{prefix} <red>This preview has expired or was cleared during reload/restart.</red>"

# Update announcements are sent only to OP players. Clicking opens the version page.
updates:
  stable: "{prefix} <green>CoreChatX {version} is available (installed: {installed}). Stable update recommended; review compatibility and migration notes: {url}</green>"
  preview: "{prefix} <yellow>CoreChatX {version} {channel} is available for testing (installed: {installed}). Experimental build; not recommended for production: {url}</yellow>"
```

Locale note:
- `messages.yml` remains the final fallback source for message keys
- locale files can override individual keys without forcing you to duplicate the whole file

---

## 4.4 `channels.yml`

Purpose:
- channel definitions
- delivery scope
- per-channel permission gates
- per-channel mention and chat-item behavior
- per-channel bridge export control
- optional per-channel chat format
- optional per-channel command shortcuts
- per-channel public-chat ignore behavior

Current bundled default:

```yml
# Channel defaults.
# In STANDALONE mode, NETWORK still behaves as a normal local channel unless the proxy bridge is enabled.
# In PROXY mode, only channels with scope NETWORK are forwarded cross-server.
# SERVER and LOCAL_RADIUS always stay backend-local.

channels:
  global:
    enabled: true
    default: true
    # Optional command shortcut for this channel. Example: shortcut: "g" registers /g.
    # /g switches to this channel; /g <message> sends one message here without changing your active channel.
    shortcut: ""
    scope: "NETWORK"
    permission-send: ""
    permission-receive: ""
    # Controls whether player names and custom ping tokens are parsed by source.
    allow-mentions:
      from-minecraft: true
      from-discord: true
      from-telegram: true
    # If false, [item]/[inv]/[ec] tokens stay plain text in this channel.
    allow-chatitems: true
    # If false, successful player chat in this channel does not create overhead chat bubbles.
    allow-chat-bubbles: true
    # If true, locally-sent messages in this channel may be exported to Discord / Telegram bridges.
    export-to-bridges: true
    # Per-channel override for how /ignore works in this channel's public chat.
    # This only changes public channel messages and public mention/custom-ping notifications.
    # Private messages stay controlled by the global /ignore behavior.
    #
    # inherit:
    #   Use privacy.yml -> ignore.public-chat-mode.
    #
    # off:
    #   Ignored players are still blocked in private messages, but this channel ignores no public chat.
    #   Their messages remain visible here and their mentions/custom pings can notify viewers.
    #
    # notifications-only:
    #   Ignored players remain visible in this channel, but their mentions/custom pings do not notify viewers who ignored them.
    #
    # hide-message:
    #   Ignored players are hidden in this channel for viewers who ignored them.
    #   Their messages are not sent to those viewers, and their mentions/custom pings do not notify them.
    ignore:
      public-chat-mode: "inherit"
    # Optional per-channel format. Leave blank to use chat.yml -> public-chat.format.
    format: ""
    discord:
      # Optional Discord format for Minecraft -> Discord messages from this channel.
      # Leave blank to use discord.yml -> discord.format.
      outbound-format: ""
      # Optional Discord format for Discord -> Minecraft messages routed to this channel.
      # Leave blank to use discord.yml -> discord.inbound.format.
      inbound-format: ""
      # Account-link requirement override for Discord -> Minecraft messages routed to this CoreChatX channel.
      # Values: inherit, true, false.
      require-linked-inbound: "inherit"
    telegram:
      # Optional Telegram format for Minecraft -> Telegram messages from this channel.
      # Leave blank to use telegram.yml -> telegram.format.
      outbound-format: ""
      # Optional Telegram format for Telegram -> Minecraft messages routed to this channel.
      # Leave blank to use the regular CoreChatX channel chat format.
      inbound-format: ""
  local:
    enabled: true
    default: false
    shortcut: ""
    scope: "LOCAL_RADIUS"
    radius: 100
    permission-send: "corechatx.channel.local"
    permission-receive: ""
    allow-mentions:
      from-minecraft: true
      from-discord: true
      from-telegram: true
    allow-chatitems: true
    allow-chat-bubbles: true
    export-to-bridges: false
    ignore:
      public-chat-mode: "inherit"
    format: ""
    discord:
      outbound-format: ""
      inbound-format: ""
      require-linked-inbound: "inherit"
    telegram:
      outbound-format: ""
      inbound-format: ""
  staff:
    enabled: true
    default: false
    shortcut: ""
    scope: "NETWORK"
    permission-send: "corechatx.channel.staff"
    permission-receive: "corechatx.staff"
    allow-mentions:
      from-minecraft: true
      from-discord: true
      from-telegram: true
    allow-chatitems: false
    allow-chat-bubbles: false
    export-to-bridges: true
    ignore:
      public-chat-mode: "inherit"
    format: ""
    discord:
      outbound-format: ""
      inbound-format: ""
      require-linked-inbound: "inherit"
    telegram:
      outbound-format: ""
      inbound-format: ""
```

Important behavior:
- invalid dynamic permission nodes are detected and warned during load
- only the broken binding is disabled; the plugin does not crash for one malformed permission
- `shortcut` registers a dynamic command such as `/g`; without arguments it selects the channel, while `/g <message>` sends once without changing the active channel
- blank shortcuts are disabled; duplicate shortcuts and names conflicting with an existing command are rejected with a warning
- `ignore.public-chat-mode` accepts `inherit`, `off`, `notifications-only`, or `hide-message`; `inherit` uses the global value from `privacy.yml`
- `export-to-bridges: true` means locally-originating messages in that channel are eligible for Discord/Telegram outbound export
- in proxy mode, outbound bridge export is performed only from the source backend so a network message is not exported once per backend
- `discord.outbound-format` and `telegram.outbound-format` override the global bridge export format for that channel
- `discord.inbound-format` and `telegram.inbound-format` override how inbound bridge messages are displayed when routed to that channel
- `/hidechannel <channel> [minutes]` accepts only an enabled channel the player can otherwise access; omitting minutes creates a permanent hide
- hidden channels are excluded from that player's send and receive audience, and hiding the active channel selects an accessible visible fallback when one exists
- `/unhidechannel <channel>` restores visibility; its suggestions contain only the player's currently hidden channels
- hidden-channel state is stored in `playerdata.yml` for standalone mode and in proxy-owned player state for proxy mode

---

## 4.5 `pings.yml`

Purpose:
- mention notification toggles
- custom ping definitions
- permission rules for custom pings

Current bundled default:

```yml
# Mention and custom ping behaviour.

mentions:
  # Global switches for notification delivery once a target is selected.
  notify-sound: true
  notify-actionbar: true

custom-pings:
  # Each entry is generic and fully data-driven:
  # trigger = visible token matched in chat
  # use-permission = who may activate it
  # receive-permission = who may be targeted; leave blank for everyone online
  # discord-roles = Discord role IDs allowed to activate this ping from Discord; empty blocks Discord usage
  # bypass-toggle = if true, recipients are notified even when they disabled ping sound/actionbar
  # token-format = how the token itself is rendered in chat
  all:
    trigger: "@all"
    use-permission: "corechatx.ping.use.all"
    receive-permission: ""
    discord-roles: []
    bypass-toggle: false
    token-format: "<#79d6b8>{trigger}</#79d6b8>"
  help:
    trigger: "@help"
    use-permission: "corechatx.ping.use.help"
    receive-permission: "corechatx.ping.receive.help"
    discord-roles: []
    bypass-toggle: false
    token-format: "<#5aa9ff>{trigger}</#5aa9ff>"
  staff:
    trigger: "@staff"
    use-permission: "corechatx.ping.use.staff"
    receive-permission: "corechatx.staff"
    discord-roles: []
    bypass-toggle: true
    token-format: "<#ff8f8f>{trigger}</#ff8f8f>"
```

Validation note:
- `use-permission` and `receive-permission` are validated
- malformed dynamic permission nodes are warned and individually disabled

Network note:
- when a custom ping is activated in a `NETWORK` channel, CoreChatX forwards the activated ping metadata with the message so remote backends can deliver the matching actionbar/sound notification locally

---

## 4.6 `privacy.yml`

Purpose:
- PM defaults
- staff PM bypass behavior
- ignore system configuration
- default public-chat visibility and notification behavior for ignored players

Current bundled default:

```yml
# Privacy defaults.

private-messages:
  enabled-by-default: true
  allow-staff-bypass: true
  staff-bypass-permission: "corechatx.staff"

ignore:
  enabled: true
  max-ignored-players: 200
  # Default behavior for /ignore inside public channel chat.
  # This does not change private messages: ignored players are still blocked from /msg and /reply.
  #
  # off:
  #   Ignored players are still blocked in private messages, but public chat is not affected.
  #   Their public messages remain visible and their mentions/custom pings can still notify you.
  #
  # notifications-only:
  #   Ignored players are still visible in public chat, but their mentions/custom pings do not notify you.
  #   This matches the old CoreChatX behavior.
  #
  # hide-message:
  #   Ignored players are hidden from public chat for the players who ignored them.
  #   Their messages are not sent to those viewers, and their mentions/custom pings do not notify them.
  public-chat-mode: "notifications-only"
  # Legacy compatibility switch for old configs.
  # If this is false and public-chat-mode is notifications-only, public chat ignore stays off.
  # Explicit hide-message still works even when this legacy switch is false.
  block-mentions-from-ignored: true
```

Validation note:
- `staff-bypass-permission` is also validated
- if malformed, only that bypass binding is disabled and the plugin logs a warning
- `ignore.max-ignored-players` is clamped to `0` or higher
- `ignore.public-chat-mode` accepts `off`, `notifications-only`, or `hide-message`; invalid values fall back to `notifications-only`
- `ignore.block-mentions-from-ignored` is a legacy compatibility switch: it can disable `notifications-only`, but an explicit `hide-message` still suppresses both the public message and its notifications
- none of these public-chat modes changes PM blocking: ignored players remain unavailable to `/msg` and `/reply`

---

## 4.7 `moderation.yml`

Purpose:
- mute behavior
- mutechat master switch
- anti-repeat
- anti-caps

Current bundled default:

```yml
# Moderation defaults.

mute:
  enabled: true
  # If true, active mutes also block /msg and /reply.
  block-private-messages: true
  default-reason: "No reason provided"

mutechat:
  enabled: true

anti-repeat:
  enabled: true
  history-window: 3
  block-identical: true

anti-caps:
  enabled: false
  min-length: 8
  max-uppercase-ratio: 0.7
```

Bounds note:
- `anti-repeat.history-window` is clamped to at least `1`
- `anti-caps.min-length` is clamped to at least `1`

---

## 4.8 `filter.yml`

Purpose:
- word filter behavior
- replacement style
- optional hover over censored words

Current bundled default:

```yml
# Word filter configuration.

enabled: true

# The filter censors and still sends the message.
blocked-words:
  - idiota
  - stupido

replacement-character: "*"

hover-original:
  enabled: false
  text: "<gray>Original term:</gray> <red>{word}</red>"
```

Important behavior:
- this is a censoring filter, not a whole-message dropper by default

---

## 4.9 `chatitems.yml`

Purpose:
- token aliases
- permission nodes per token family
- visible token formatting
- preview expiration
- preview inventory titles
- Discord PNG rendering and embed text for ChatItem snapshots
- Discord item-inspection dropdowns
- vanilla/resource-pack asset resolution and render scaling
- cross-server snapshot request size and timeout limits

Current bundled default:

```yml
# Chat item token configuration.
# Every token is matched on sanitized player text.
# If the sender lacks the configured permission, the message is still sent
# but that token stays plain text and no preview is created.

tokens:
  item:
    # [item] upgrades to [shulker] automatically when the held item is a shulker box
    # and the sender has corechatx.chatitem.shulker.
    # The snapshot stores the held item exactly as it looked when the message was sent.
    aliases: [ "[item]", "[i]" ]
    permission: "corechatx.chatitem.item"
    # In-game clickable token template. Placeholders: {token}, {name}, {material}, {amount}.
    # {name} uses custom_name, then item_name, then material. {material} is lower-case without namespace, for example diamond_sword.
    token-format: "<#79d6b8>[item]</#79d6b8>"
    shulker-token-format: "<#5fc7c2>[shulker]</#5fc7c2>"
  armor:
    # Opens a read-only preview with helmet, chestplate, leggings, boots, and offhand.
    aliases: [ "[armor]" ]
    permission: "corechatx.chatitem.armor"
    token-format: "<#6fb6ff>[armor]</#6fb6ff>"
  hotbar:
    # Shows the first 9 inventory slots from the sender at message time.
    aliases: [ "[hotbar]" ]
    permission: "corechatx.chatitem.hotbar"
    token-format: "<#8bc8ff>[hotbar]</#8bc8ff>"
  inventory:
    # Includes the main inventory plus armor and offhand in a read-only snapshot.
    aliases: [ "[inventory]", "[inv]" ]
    permission: "corechatx.chatitem.inventory"
    token-format: "<#5aa9ff>[inventory]</#5aa9ff>"
  enderchest:
    # Opens the sender ender chest snapshot captured when the message was sent.
    aliases: [ "[enderchest]", "[ender]", "[ec]" ]
    permission: "corechatx.chatitem.enderchest"
    token-format: "<#7db8ff>[enderchest]</#7db8ff>"

previews:
  # Snapshots are ephemeral runtime data. Reload clears them to avoid mixing old and new state.
  # Expired or cleared previews will no longer open from old chat messages.
  expire-after-minutes: 30
  titles:
    # {player_name} is always the real snapshot owner's username.
    # {player_nickname} uses the owner's custom nickname when available.
    item: "<#79d6b8>{player_nickname}'s item</#79d6b8>"
    shulker: "<#5fc7c2>{player_nickname}'s shulker</#5fc7c2>"
    armor: "<#6fb6ff>{player_nickname}'s armor</#6fb6ff>"
    hotbar: "<#8bc8ff>{player_nickname}'s hotbar</#8bc8ff>"
    inventory: "<#5aa9ff>{player_nickname}'s inventory</#5aa9ff>"
    enderchest: "<#7db8ff>{player_nickname}'s ender chest</#7db8ff>"

discord-images:
  # Global toggle for Discord ChatItem inventory snapshots.
  # When false, CoreChatX does not render, download assets for, or send ChatItem PNG attachments to Discord.
  # Minecraft chat tokens and in-game clickable previews continue to work normally.
  # When true, ChatItem tokens sent from Minecraft to Discord also send a rendered PNG attachment/embed.
  # Embed colors are derived from previews.titles.* and token-format values above.
  enabled: true
  # Maximum unique ChatItem images attached per chat message. The protocol hard-caps this to 3.
  max-images-per-message: 3
  embed:
    # Controls the Discord embed title for each ChatItem image.
    # Set a value to "" to omit the title completely.
    # For [item], this text is rendered into the attached PNG with the Minecraft bitmap font
    # instead of being sent as Discord embed text.
    # Custom item names use Minecraft's default italic tooltip style unless the rendered component overrides it.
    # Common placeholders: {player_name}, {player_nickname}, {type}, {token}, {plain_text}.
    # Item placeholders: {item_name}, {material}, {durability}, {durability_line}, {enchantments}, {lore}.
    # Extra item tooltip placeholders: {attributes}, {potion_effects}, {banner_patterns}, {armor_trim},
    # {unbreakable}, {can_place_on}, {can_break}, {book_metadata}, {firework_data}, {tooltip_extra}.
    title:
      item: "{item_name}"
      armor: "{player_nickname}'s armor"
      hotbar: "{player_nickname}'s hotbar"
      inventory: "{player_nickname}'s inventory"
      enderchest: "{player_nickname}'s ender chest"
      shulker: "{player_nickname}'s shulker"

    # Controls the Discord embed description.
    # For [item], these lines are rendered into the transparent attached PNG with the item icon.
    # Custom lore lines use Minecraft's default italic tooltip style; enchantments, attributes and metadata do not.
    # Each list entry becomes one rendered line.
    # For [item], each detail placeholder adds its own blank line only when content exists.
    # Empty rendered lines are removed, so missing metadata does not leave blank lines.
    # Use [] to omit the description completely for that ChatItem type.
    description:
      item:
        - "{enchantments}"
        - "{attributes}"
        - "{potion_effects}"
        - "{lore}"
        - "{armor_trim}"
        - "{banner_patterns}"
        - "{unbreakable}"
        - "{can_place_on}"
        - "{can_break}"
        - "{book_metadata}"
        - "{firework_data}"
        - "{durability_line}"
      armor: []
      hotbar: []
      inventory: []
      enderchest: []
      shulker: []
  item-menu:
    # Adds one or more Discord dropdown menus below non-[item] ChatItem images.
    # Selecting an entry sends the selected item preview as an ephemeral message visible only to that Discord user.
    # The menu expires with the same lifetime as the in-game clickable ChatItem preview token.
    enabled: true
    # Text shown inside each dropdown before a Discord user selects an item.
    placeholder: "Inspect an item"
    # Discord option label. Keep it short: Discord limits labels to 100 characters.
    # Placeholders: {slot}, {slot_index}, {item_display_name}, {item_name}, {amount}, {material}, {durability}, {durability_line}, {enchantments}, {lore}.
    # Extra tooltip placeholders are also available: {attributes}, {potion_effects}, {banner_patterns}, {armor_trim},
    # {unbreakable}, {can_place_on}, {can_break}, {book_metadata}, {firework_data}, {tooltip_extra}.
    label-format: "Slot {slot}: {item_display_name}"
    # Optional Discord option description. Set to "" to omit it.
    description-format: "x{amount} - {material}"
    expired-message: "This ChatItem preview has expired."
    unavailable-message: "That item preview is unavailable."
  render:
    # Pixel scale used by inventory-like image renders: armor, hotbar, inventory, ender chest and shulker.
    # Higher values produce larger PNG files.
    scale: 8
    # Pixel scale for the Discord [item] details panel: Minecraft font, tooltip background, spacing,
    # and the base item icon before the icon-only multiplier below is applied.
    # Set this to 0 or a negative value to reuse "scale" above.
    single-item-details-scale: 8
    # Multiplies only the item icon inside the Discord [item] details panel.
    # Text and tooltip background keep single-item-details-scale.
    single-item-details-icon-multiplier: 4
  assets:
    # "auto" uses the running Minecraft server version. A fixed version or latest-release can also be used.
    minecraft-version: "auto"
    # When true, CoreChatX downloads/extracts vanilla client assets into its local cache.
    # No vanilla Minecraft assets are bundled inside the plugin jar.
    download-vanilla-assets: true
    # Optional resource pack zip/folder paths. Relative paths are resolved from the CoreChatX plugin folder.
    resource-packs: []

network:
  # Network mode sends only lightweight snapshot refs in chat packets.
  # Multiple ChatItem tokens in the same message share one snapshot bundle with per-token views.
  # The full bundle is fetched from the source backend when a remote player clicks a view.
  request-timeout-seconds: 5
  # Maximum unique snapshot bundle refs attached to one network chat message.
  # The plugin-message protocol currently hard-caps the effective value to 3.
  max-snapshots-per-message: 3
  max-compressed-bytes: 30000
  max-uncompressed-bytes: 2097152
  max-item-bytes: 262144
```

Behavior notes:
- Minecraft previews are immutable snapshots captured when the message is accepted; expiration or reload makes old preview links fail closed
- `discord-images.enabled` controls only rendered Discord attachments; in-game ChatItem tokens and clickable previews remain available
- Discord rendering uses locally cached vanilla client assets and optional resource packs; relative pack paths are resolved from `plugins/CoreChatX/`
- non-item Discord snapshots can expose an item selector whose response is ephemeral to the selecting Discord user
- `/corechatx itemcache warmup|status|cancel` manages the asynchronous render cache warmup and requires `corechatx.command.itemcache` for players
- if the sender lacks the required permission, the token stays plain text
- snapshots are runtime objects and are cleared on reload/restart
- multiple ChatItem tokens in the same player message share one snapshot UUID/bundle; each token click carries the requested view, such as `item`, `armor`, or `inventory`
- snapshot UUIDs are treated as short-lived capability ids: anyone who received the rendered chat component can open the available preview views until it expires, but ids are random, not listed, and not persisted
- in proxy mode, chat packets carry only lightweight ChatItem bundle refs; on click, Velocity requests the full bundle from the source backend and forwards the response to the requesting backend
- Velocity can cache a returned remote bundle until it expires, so later clicks on other views from the same message do not have to ask the source backend again
- because current per-message parsing shares one bundle, normal chat generally emits one bundle ref even when the message contains several ChatItem tokens; `network.max-snapshots-per-message` remains a defensive protocol bound
- if the remote bundle is missing, expired, rejected, or not returned before `network.request-timeout-seconds`, the player receives the normal expired-preview feedback
- oversized or invalid ChatItem bundle payloads are rejected without blocking the chat message itself
- `network.max-compressed-bytes`, `network.max-uncompressed-bytes`, and `network.max-item-bytes` protect Paper-side bundle serialization and import during remote click handling
- `network.request-timeout-seconds` is clamped to at least `1`
- ChatItem byte limits are clamped to at least `1024` bytes

---

## 4.9.1 `keywords.yml`

Purpose:
- interactive reusable chat tokens
- one MiniMessage renderer per keyword
- optional permission gates
- optional PlaceholderAPI expansion per keyword
- optional channel restrictions

Current bundled default:

```yml
# Interactive keyword token configuration.
# Each keyword replaces one or more literal aliases with one MiniMessage renderer.

keywords:
  discord:
    enabled: true
    tokens: [ "[discord]", "[dc]" ]
    renderer: "<blue><hover:show_text:'<gray>Join our Discord</gray>'><click:open_url:'https://discord.gg/example'>discord</click></hover></blue>"
    allow-placeholderapi: false
    permission: "corechatx.keywords.use.discord"
    enabled-channels: []
    disabled-channels: []

  rules:
    enabled: true
    tokens: [ "[rules]" ]
    renderer: "<yellow><hover:show_text:'<gray>Click to read the rules</gray>'><click:run_command:'/rules'>rules</click></hover></yellow>"
    allow-placeholderapi: false
    permission: ""
    enabled-channels: []
    disabled-channels: []
```

Behavior notes:
- token aliases are matched literally and case-sensitively
- if a sender lacks the configured permission, the token remains plain text
- if `enabled-channels` is non-empty, the keyword only works in those channels
- if the current channel is listed in `disabled-channels`, the token remains plain text
- if `allow-placeholderapi: true`, PlaceholderAPI is applied to the renderer before MiniMessage deserialization when PlaceholderAPI is installed and enabled
- in proxy mode, network chat and remote PMs transport the rendered component from the source backend
- invalid keyword definitions only disable themselves and log a warning

---

## 4.9.2 `chatbubbles.yml`

Purpose:
- optional overhead chat bubbles for successful player public chat
- per-player default toggle
- channel/world filtering
- TextDisplay visual settings
- lifetime, stacking, wrapping, and cleanup behavior

Current bundled default:

```yml
# Chat bubbles / overhead chat configuration.

enabled: true
default-enabled: true

permission: "corechatx.chatbubbles.use"

enabled-channels: []
disabled-channels: [ "staff" ]

max-active-bubbles: 3

base-height: 0.75
stack-offset: 0.32

max-visible-distance: 32

base-duration-ticks: 80
ticks-per-character: 2
max-duration-ticks: 160

max-plain-length: 80
max-line-length: 28

shadow: true
see-through: false

text-color: "#FFFFFF"
background-color: "#80000000"

hide-while-sneaking: false
hide-if-invisible: true

world-filter:
  enabled: false
  disabled-worlds: []

renderer:
  format: "{message}"
```

Behavior notes:
- bubbles are created only after public chat passes normal CoreChatX checks
- the bubble text is derived from the already processed message body, not raw input
- `allow-chat-bubbles: false` in `channels.yml` disables bubbles for that channel
- player settings include a persistent chat bubbles toggle
- in proxy mode, bubbles stay local to the Paper backend where the sender physically is
- bubble entities are removed on expiry, player quit, reload, and plugin disable
- numeric bubble limits are bounded defensively: counts and text lengths stay at least `1`, `ticks-per-character` stays at least `0`, and distances/offsets cannot become invalid negative values

---

## 4.10 `discord.yml`

Purpose:
- Discord outbound formatting and routing
- Discord inbound gateway relay settings
- route mapping from Discord channels into CoreChatX channels
- Discord/Minecraft account linking, nickname synchronization, and optional login/role gates in standalone mode
- optional join, quit, first-join, death, and advancement mirrors
- optional Paper console bot settings, including backend console commands and live log mirroring
- text/slash player-list responses, channel-description updates, and standalone server-status embeds

Current bundled default:

```yml
# Discord integration for Paper.
# STANDALONE owns chat bridge, account linking and optional console here.
# PROXY keeps chat bridge/account linking on Velocity, but may still run a local console-only bot per backend.

account-linking:
  # Master switch for Discord-Minecraft account linking.
  # STANDALONE: this backend owns the bot, link codes, linked accounts and optional Discord role checks.
  # PROXY: configure the bot, Discord bridge routes and login gates in Velocity's velocity-discord.yml instead.
  # Paper keeps this file for standalone setups and local formatting only.
  enabled: false
  # If true, linked Discord members get their server nickname synced to their Minecraft nickname.
  # Falls back to the Minecraft player name when no custom nickname is set. In PROXY, configure this on Velocity.
  sync-mc-name: false
  # If true, unlinked Discord users cannot write through routed Discord inbound channels.
  # Route and channel overrides can still force true/false for specific destinations.
  require-linked: false
  # If true, unlinked Minecraft players are kicked with a code for the configured Discord link command.
  # If linking is unavailable or code creation fails, entry is denied with a temporary-unavailability message.
  require-linked-to-play: false
  required-play-roles:
    # Live whitelist for require-linked-to-play. Linked players must keep at least one listed Discord role.
    # Removing the last allowed role, or leaving the guild, disconnects an online player and blocks later joins.
    # Enable the privileged Server Members Intent for this bot in the Discord Developer Portal.
    enabled: false
    # Discord guild/server id used for the role check.
    # If blank and the standalone Paper bot is in one guild, that guild is used automatically.
    guild-id: ""
    # Discord role ids allowed to play. Empty list disables the role gate and logs a warning when enabled.
    role-ids: []
    # If true, kick linked players when Discord role verification cannot be completed.
    deny-if-unverifiable: true
  # Deletes blocked unlinked messages when the bot has Discord's Manage Messages permission.
  delete-unlinked-messages: true
  # Sends a private Discord DM explaining why the message was blocked.
  dm-unlinked-users: true
  # Link codes generated by /discord link or required-link-to-play expire after this many minutes.
  code-expire-minutes: 10
  # If true, linked Discord users may chat while the Minecraft account is offline when stored data and LuckPerms data can be resolved.
  allow-offline-linked-players: true
  # If true, Minecraft mute state blocks linked Discord inbound messages.
  enforce-minecraft-mutes: true
  # If true, the linked Minecraft account must have permission to send to the target CoreChatX channel.
  enforce-channel-send-permission: true
  # Rate limit for warnings when CoreChatX cannot delete a Discord message because the bot lacks Manage Messages.
  missing-manage-messages-warning-seconds: 300
  # STANDALONE only: Discord slash command names registered by the backend that runs the Discord bot.
  # If another plugin already owns /link, change these names before starting the bot.
  link-command-name: "link"
  unlink-command-name: "unlink"
  messages:
    unlinked-dm: "Link your Minecraft account before chatting in this channel. Run /discord link in-game, then use the Discord /{link_command} command with that code here."
    linked: "Your Discord account is now linked to {player_name}."
    unlinked: "Your Discord account has been unlinked."
    not-linked: "This Discord account is not linked to a Minecraft account."
    already-linked: "This Discord account or Minecraft account is already linked. Unlink it first."
    code-not-found: "That link code is invalid or expired."
    minecraft-denied: "Your linked Minecraft account cannot send messages to that channel right now."

discord:
  # STANDALONE: enables the Paper-owned Discord bot for bridge/linking/console.
  # PROXY: enables only discord.console.* on this backend; bridge/account-linking targets must be configured on Velocity.
  enabled: false
  bot-token: ""
  default-channel-id: ""
  format: "[{source_server}] [{channel_id}] {rank_prefix}{sender_name}: {plain_text}"
  # If true, Minecraft -> Discord bridge output breaks Discord mention tokens before sending.
  # This prevents players from pinging Discord users, roles, @everyone or @here by typing raw Discord mention syntax in Minecraft.
  prevent-mentions-from-minecraft: true
  connection-messages:
    # STANDALONE only. In PROXY, configure Discord join/quit mirrors in Velocity's velocity-discord.yml.
    # If true, CoreChatX mirrors accepted join, first-join and quit messages to Discord.
    # Messages are sent only when the Minecraft join/quit message is actually announced.
    enabled: false
    # Discord channel ids that should receive join/quit mirrors.
    # Empty list = discord.default-channel-id.
    channels: []
    # Tokens: {source}, {source_type}, {source_server}, {channel_id}, {sender_name}, {rank_prefix}, {plain_text}, {message}
    format: "{plain_text}"
    # Optional action-specific plain-text formats. Leave empty to use format above.
    join-format: ""
    first-join-format: ""
    quit-format: ""
    embed:
      # If true, join/quit mirrors are sent as a Discord embed instead of plain content.
      enabled: false
      # Hex color used for the embed side bar.
      color: "#57F287"
      # Optional action-specific colors. Leave empty to use color above.
      join-color: "#57F287"
      first-join-color: "#57F287"
      quit-color: "#ED4245"
      # Leave title empty for a compact embed with only the description.
      title: ""
      # Supports the same tokens as connection-messages.format.
      description: "{plain_text}"
      # Optional action-specific descriptions. Leave empty to use description above.
      join-description: ""
      first-join-description: ""
      quit-description: ""
  event-messages:
    # STANDALONE only. In PROXY, configure event mirrors in Velocity's velocity-discord.yml.
    # If true, CoreChatX mirrors supported server events to Discord.
    # Individual event sections below can still be disabled separately.
    enabled: false
    # CoreChatX channel ids that should receive event mirrors.
    # Empty list = all enabled channels with export-to-bridges: true and a Discord target.
    # Individual event channels override this list when non-empty.
    channels: []
    # Default format for any event that does not override it.
    # Tokens: {source}, {source_type}, {source_server}, {channel_id}, {sender_name}, {rank_prefix}, {plain_text}, {message}
    format: "{plain_text}"
    embed:
      # Default embed settings for any event that does not override them.
      enabled: true
      color: "#5865F2"
      title: ""
      description: "{plain_text}"
    events:
      death:
        enabled: true
        channels: []
        format: ""
        embed:
          enabled: true
          color: "#ED4245"
          title: ""
          description: ""
      advancement:
        enabled: true
        channels: []
        format: ""
        embed:
          enabled: true
          color: "#FEE75C"
          title: ""
          description: ""
  console:
    # Allows this Paper backend to act as a Discord console bot even when chat bridge/account linking are disabled.
    # In PROXY mode this is the only Paper Discord feature that can run.
    # Use a separate Discord bot token per backend console to avoid duplicated gateway sessions.
    enabled: false
    # Discord channel id used as the console channel.
    channel-id: ""
    # Messages starting with this prefix are executed as Paper console commands.
    # Set to "" to execute every message in the console channel as a command.
    command-prefix: "!"
    # If true, Paper console log lines are mirrored live to the Discord console channel.
    live-log: true
    live-log-format:
      # Discord messages are edited until this rendered size is reached, then a new silent message is sent.
      max-message-chars: 1800
      # Wrap live console log blocks in Discord monospace code blocks.
      monospace: true
      # Prefix added to every mirrored console line. Uses this backend JVM local time.
      line-prefix: "[{date} {hour}] "
      date-format: "yyyy-MM-dd"
      hour-format: "HH:mm:ss"
    # Sends a short Discord acknowledgement after dispatching a command.
    send-command-feedback: true
    # Empty allow lists mean anyone who can write in the configured Discord channel can run commands.
    allowed-user-ids: []
    allowed-role-ids: []
  player-list:
    # STANDALONE only. In PROXY mode configure the player-list command in Velocity's velocity-discord.yml.
    # Shows online players from this Paper server.
    enabled: false
    # Text command listened in Discord channels visible to the bot. Set to "" to disable the text command.
    command: "!playerlist"
    # Also register a slash command. Slash commands can use true ephemeral replies.
    register-slash-command: true
    slash-command-name: "playerlist"
    # CHANNEL = public embed, DM = private DM, EPHEMERAL = slash-only private reply.
    # Text commands cannot be ephemeral, so EPHEMERAL falls back to DM for !playerlist.
    response-visibility: "CHANNEL"
    max-players: 80
    embed:
      color: "#5865F2"
      title: "Online players ({count})"
      empty-description: "No players are currently online."
      # Tokens: {player_name}, {player_nickname}, {server}
      line-format: "- {player_nickname}"
      more-format: "... and {hidden_count} more."
  channel-description:
    # STANDALONE only. In PROXY mode configure channel descriptions in Velocity's velocity-discord.yml.
    # Updates the description/topic of Discord text channels.
    enabled: false
    # Discord rate limits channel metadata updates; keep this at 60 seconds or higher.
    interval-seconds: 300
    triggers:
      # Queue a debounced description update when a player joins this standalone server.
      on-connection: true
      # Queue a debounced description update when a player leaves this standalone server.
      on-disconnection: true
      # When many players join/quit at once, CoreChatX waits this long after the last event before updating Discord.
      event-debounce-seconds: 5
    # Each entry updates one Discord text channel description.
    # The description string is passed through PlaceholderAPI when PlaceholderAPI is installed and enabled.
    # Internal placeholders:
    # {online} = players online on this standalone server.
    # {online_in_group} = same as {online} in STANDALONE.
    entries:
      # - channel-id: "123456789012345678"
      #   description: "Players {online}/1000"
  server-status:
    # STANDALONE only. In PROXY mode configure proxy/backend status messages in Velocity's velocity-discord.yml.
    # Sends Discord embed messages when this standalone server starts and stops cleanly.
    enabled: false
    default:
      enabled: true
      # Discord channel ids. Empty falls back to discord.default-channel-id.
      channels: []
      embed:
        online:
          enabled: true
          color: "#57F287"
          title: "Server online"
          description: "`{server}` is now online."
        offline:
          enabled: true
          color: "#ED4245"
          title: "Server offline"
          description: "`{server}` is now offline."
    # Per standalone server override. Keys must match deployment.server-id.
    # Any missing field inherits from default; write a custom title/description to avoid showing the technical {server}.
    servers:
      # paper-1:
      #   channels:
      #     - "123456789012345678"
      #   embed:
      #     online:
      #       title: "Survival online"
      #       description: "The survival server is ready."
  # Optional per-channel overrides:
  # channel-overrides:
  #   global: "123456789012345678"
  channel-overrides: {}
  inbound:
    enabled: false
    default-channel: "global"
    max-length: 400
    # Format used for Discord -> Minecraft messages.
    # Tokens: {source}, {source_type}, {channel_id}, {channel_prefix}, {sender_name}, {player_name}, {player_nickname}, {discord_name}, {discord_id}, {rank_prefix}, {role_color}, {plain_text}, {message}
    # When account-linking is enabled and the Discord user is linked, {sender_name}, {player_name}, {player_nickname}, and {rank_prefix} use the linked Minecraft identity.
    # Use {role_color} as a MiniMessage color tag, for example: "{role_color}{rank_prefix}</role_color> "
    format: "{channel_prefix}[Discord] {role_color}{rank_prefix}</role_color>{sender_name}: {plain_text}"
    # Optional per Discord route account-link override.
    # Values: inherit, true, false.
    # route-overrides:
    #   "123456789012345678":
    #     require-linked: true
    route-overrides: {}
    # Map Discord channel ids to CoreChatX channel ids.
    # channel-routes:
    #   "123456789012345678": "staff"
    channel-routes: {}
```

Important operational note:
- Added `{link_command}` (the Discord command name without `/`) to linking messages. Use `/{link_command} code:{code}`; it reads `account-linking.link-command-name` from the standalone bot or the Velocity authority. Exact older stock messages are adapted automatically; add the placeholder manually to customized messages.
- Discord inbound requires `MESSAGE CONTENT` intent on the bot
- Discord inbound uses the Discord Gateway through JDA, not REST polling
- `deployment.bridges-allowed: false` prevents Discord outbound and inbound bridge runtime from starting, but `discord.console.*` may still start when `discord.enabled` and `discord.console.enabled` are true
- `discord.enabled: false` disables Discord inbound even if `discord.inbound.enabled: true`
- Discord outbound applies a small backoff when Discord responds with HTTP 429 rate limits
- Discord outbound clamps formatted messages to a safe API-sized payload and logs when truncation happens
- the bot must also have access to the guild channels listed in `discord.default-channel-id` or `discord.inbound.channel-routes`
- CoreChatX ignores inbound messages from bots and webhooks
- inbound messages are sanitized and clamped by `discord.inbound.max-length` before they enter Minecraft chat
- `account-linking.sync-mc-name` keeps the linked guild member nickname aligned to the Minecraft nickname, falling back to the real username
- `connection-messages` mirrors only join/quit announcements actually accepted by the CoreChatX lifecycle; `event-messages` currently supports death and advancement sources
- `player-list` has a text command and optional slash command; `EPHEMERAL` is real for slash replies and falls back to DM for text commands
- `channel-description.interval-seconds` is clamped to at least 60 seconds and connection-triggered updates are debounced
- `server-status` sends standalone startup and clean-shutdown embeds with optional per-server overrides
- in proxy mode, Discord bridge I/O and account linking are configured on Velocity; Paper `discord.yml` can only run the optional console-only backend bot
- use a separate Discord bot token for each proxy backend console bot to avoid duplicated gateway sessions
- per-channel Discord formats can be configured in `channels.yml` under `channels.<id>.discord.outbound-format` and `channels.<id>.discord.inbound-format`

---

## 4.11 `telegram.yml`

Purpose:
- Telegram outbound formatting and routing
- Telegram Bot API long-polling inbound relay settings
- route mapping from Telegram chats or forum topics into CoreChatX channels

Current bundled default:

```yml
# Telegram bridge.
# Uses Telegram Bot API only.
# Inbound uses long polling through getUpdates(timeout=...).
# Outbound uses sendMessage.
# No webhook, no Telegram4J, no MTProto.

telegram:
  enabled: false

  bot-token: ""

  # Fallback target for outbound messages when no per-channel target is configured.
  # Can be a numeric chat id or a Bot API-supported @username target.
  default-chat-id: ""

  format: "[{source_server}] [{channel_id}] {sender_name}: {plain_text}"

  outbound:
    # Per-CoreChatX-channel Telegram targets.
    # message-thread-id targets a Telegram forum topic when greater than 0.
    channel-targets:
      global:
        chat-id: ""
        message-thread-id: 0
      staff:
        chat-id: ""
        message-thread-id: 0

  inbound:
    enabled: false

    # Long polling timeout passed to Telegram getUpdates.
    timeout-seconds: 30

    # Small delay between normal long-poll cycles.
    retry-delay-seconds: 3

    # Backoff delay after network/API/parsing errors.
    error-backoff-seconds: 10

    skip-pending-on-start: true
    max-length: 400
    default-channel: "global"
    # Display name used for Telegram -> Minecraft messages.
    # Tokens: {source}, {source_type}, {sender_name}
    # Set to "{sender_name}" to remove the [Telegram] prefix.
    display-name-format: "[{source}] {sender_name}"

    # Logs detected safe route keys to help configure groups/topics.
    debug-route-detection: false

    # Inbound route map.
    # Keys can be "chatId" or "chatId:messageThreadId".
    routes:
      # "-1001111111111": "global"
      # "-1001111111111:25": "staff"
```

Important operational note:
- Telegram uses Telegram Bot API long polling through `getUpdates`
- Telegram does not use Telegram4J
- per-channel Telegram formats can be configured in `channels.yml` under `channels.<id>.telegram.outbound-format` and `channels.<id>.telegram.inbound-format`
- Telegram does not use MTProto
- Telegram does not use webhook mode and does not start an embedded HTTP server
- no `api-id` or `api-hash` are required; only `telegram.bot-token` is needed
- outbound supports per-channel Telegram targets through `telegram.outbound.channel-targets`
- outbound supports Telegram forum topics through `message-thread-id`
- Telegram outbound clamps formatted messages to a safe Bot API-sized payload and logs when truncation happens
- inbound routes can use `chatId` or `chatId:messageThreadId`
- `debug-route-detection: true` logs safe detected route keys to help admins configure group/topic routing
- `deployment.bridges-allowed: false` prevents Telegram outbound and inbound runtime from starting even if `telegram.enabled` or `telegram.inbound.enabled` is true
- `skip-pending-on-start: true` prevents old queued updates from flooding Minecraft when the bridge starts
- Telegram long-polling requests use a bounded HTTP timeout so reloads cannot leave an old polling request hanging indefinitely
- Telegram inbound timing values are clamped: `timeout-seconds` to `1..60`, `retry-delay-seconds` to `0..30`, and `error-backoff-seconds` to `1..300`
- inbound messages are sanitized and clamped by `telegram.inbound.max-length` before they enter Minecraft chat

---

## 4.12 `storage.yml`

Purpose:
- choose the restart-scoped standalone runtime backend
- define the durable namespace/scope identity
- configure the MySQL pool, bounded executor, schema journal, scope lease, login hydration, and operation bounds

Current bundled default:

```yml
# Storage defaults.
# STANDALONE runtime data uses YAML by default or the explicitly selected MYSQL backend.
# PROXY runtime data is owned by Velocity; this file remains local backend configuration.

storage:
  backend: "YAML"
  # Stable durable identity. Changes require a full server restart.
  namespace: "production"
  scope: "main"

  # Used only when backend is MYSQL. CoreChatX never falls back to YAML after a MySQL boot failure.
  mysql:
    host: "127.0.0.1"
    port: 3306
    database: "corechatx"
    username: "corechatx"
    # Prefer password-env. The environment value overrides this inline fallback.
    password: ""
    password-env: "CORECHATX_MYSQL_PASSWORD"
    ssl-mode: "VERIFY_IDENTITY"
    connect-timeout-ms: 5000
    validation-timeout-ms: 3000
    query-timeout-seconds: 10
    maximum-pool-size: 6
    minimum-idle: 1
    max-lifetime-ms: 1800000
    keepalive-time-ms: 300000
    executor-threads: 4
    executor-queue-capacity: 256
    # Paper-only bounded waits. Both values accept 1000..60000 milliseconds.
    login-hydration-timeout-ms: 10000
    operation-timeout-ms: 15000
    unavailable-message: "CoreChatX storage is temporarily unavailable. Please try again shortly."
    shutdown-timeout-ms: 15000
    lease-duration-ms: 30000
    lease-renew-interval-ms: 10000
    schema-auto-migrate: true
```

Backend behavior:
- `YAML` is the default and retains the existing atomic temporary-file/replace persistence
- `MYSQL` is active only when written explicitly as `storage.backend`; legacy `storage.sql.*` keys only generate a warning and never enable SQL
- standalone Paper owns the MySQL pool; proxy-mode Paper backends must keep their runtime authority on Velocity and do not open JDBC connections
- MySQL bootstrap is asynchronous and fail-closed: login and storage-dependent commands remain unavailable until schema, scope, lease, global state, and confirmed indexes are ready
- MySQL failure never falls back silently to YAML

Identity and restart rules:
- `backend`, `namespace`, `scope`, and every `mysql.*` value require a full restart
- `/corechatx reload` retains the boot pool, executor, lease, confirmed cache, and storage identity; edited restart-only values are rejected until restart
- changing YAML/MySQL authority by editing the enum alone is rejected when authoritative data already exists; use the journaled `/ccxstorage` migration or rollback workflow below
- an open migration/rollback journal reconstructs a mutation freeze before ordinary repositories start, including after a crash or restart

Credentials and TLS:
- `password-env` is preferred; a non-blank environment variable overrides `password`
- secrets are not embedded in the JDBC URL or printed by storage configuration diagnostics
- `ssl-mode` is a Connector/J mode such as `VERIFY_IDENTITY`; use `DISABLED` only for a deliberately trusted local test environment. In that explicit mode CoreChatX enables Connector/J RSA public-key retrieval so a fresh MySQL 8 `caching_sha2_password` login can complete without TLS; secure TLS modes never enable that fallback

Pool and executor bounds:
- `validation-timeout-ms` must be lower than `connect-timeout-ms`
- `executor-threads` must be at least `1` and cannot exceed `maximum-pool-size`
- `executor-queue-capacity` is bounded; overload is rejected instead of growing memory without limit
- `query-timeout-seconds` applies to every statement, while Connector/J socket timeout is derived from the same bound
- `max-lifetime-ms`, `keepalive-time-ms`, and `shutdown-timeout-ms` control resource lifetime and bounded shutdown

Admission and response policy:
- `login-hydration-timeout-ms` is the only bounded wait performed by Paper, and it runs in `AsyncPlayerPreLoginEvent`, never on the primary thread
- hydration loads settings/hidden channels, statistics, active channel, ignores, mute state, and Discord link/unlink state as one consistent snapshot
- `operation-timeout-ms` bounds the user-facing response without cancelling an already accepted authoritative transaction; a late commit still updates the confirmed cache and retains per-player mutation ordering
- `unavailable-message` is the non-blank login/command message used while authority is unavailable

Schema and lease policy:
- `schema-auto-migrate: true` installs or resumes the checksummed V1 runtime schema, V2 migration-control extension, V3 channel-persistence preference, and V4 advancement records under an exclusive database lock; CoreChatX 2026.3.1 requires V4 even when advancement sync is disabled
- history is journaled as `RUNNING`, `SUCCESS`, or `FAILED`; final table/column/engine/unique-index verification occurs before `SUCCESS`
- `schema-auto-migrate: false` refuses startup when a required version is missing; externally managed schemas must include V1 through V4 before boot
- `lease-duration-ms` and `lease-renew-interval-ms` use database time; another live owner for the same scope is rejected and expired takeover receives a newer fencing token

### Storage maintenance and migration workflow

`/ccxstorage` is the recovery-safe storage control plane. It is registered before normal
runtime services so `status`, validation, parity checks, resume, and safe abort remain
available when an incomplete transition intentionally keeps gameplay storage fail-closed.
Inspection and backups require `corechatx.command.storage` (default `op`); migration and
rollback state changes are console-only even when a player is an operator.

Paper operates one standalone scope:

```text
/ccxstorage status
/ccxstorage check files
/ccxstorage check mysql
/ccxstorage check parity <run-uuid>
/ccxstorage backup files
/ccxstorage backup mysql
/ccxstorage backup list
/ccxstorage backup verify <backup-id-or-file>
/ccxstorage migrate files-to-mysql plan
/ccxstorage migrate files-to-mysql execute <run-uuid> <confirmation-token>
/ccxstorage migrate files-to-mysql status
/ccxstorage migrate files-to-mysql resume <run-uuid> [confirmation-token]
/ccxstorage migrate files-to-mysql abort <run-uuid>
/ccxstorage rollback mysql-to-files plan
/ccxstorage rollback mysql-to-files execute <run-uuid> <confirmation-token>
/ccxstorage rollback mysql-to-files status
/ccxstorage rollback mysql-to-files resume <run-uuid> [confirmation-token]
/ccxstorage rollback mysql-to-files abort <run-uuid>
/ccxstorage history
```

Velocity reads one global backend choice but owns one authoritative scope per configured
network-channel group. Read-only checks and backups therefore require either
`--scope <group>` or `--all-scopes`. Backend transitions must cover every configured group:

```text
/ccxstorage status
/ccxstorage check files --scope <group>
/ccxstorage check mysql --all-scopes
/ccxstorage check parity --all-scopes
/ccxstorage backup files --all-scopes
/ccxstorage backup mysql --scope <group>
/ccxstorage backup list
/ccxstorage backup verify <backup-id-or-file>
/ccxstorage history --all-scopes
/ccxstorage migrate files-to-mysql plan --all-scopes
/ccxstorage migrate files-to-mysql execute --all-scopes <group>=<run-uuid>=<token> ...
/ccxstorage migrate files-to-mysql status --all-scopes
/ccxstorage migrate files-to-mysql resume --all-scopes [<group>=<token> ...]
/ccxstorage migrate files-to-mysql abort --all-scopes
/ccxstorage rollback mysql-to-files plan --all-scopes
/ccxstorage rollback mysql-to-files execute --all-scopes <group>=<run-uuid>=<token> ...
/ccxstorage rollback mysql-to-files status --all-scopes
/ccxstorage rollback mysql-to-files resume --all-scopes [<group>=<token> ...]
/ccxstorage rollback mysql-to-files abort --all-scopes
```

Safe files-to-MySQL cutover:

1. Run `check files`, then `plan`; copy the emitted run UUID and short-lived token.
2. Run `execute`. CoreChatX drains accepted mutations, flushes YAML, rechecks the source,
   creates and verifies an immutable backup, proves the target empty, imports, verifies
   canonical parity, and leaves YAML frozen behind a durable journal.
3. Follow the exact terminal instruction: change `storage.backend` to `MYSQL` and restart.
4. Startup verifies the run, acquires the MySQL lease, hydrates the runtime, marks the run
   active, and only then closes the local journal.

Safe MySQL-to-files rollback always exports the latest database state; never restore a
pre-cutover YAML archive over a MySQL authority that has accepted newer writes. Run the
rollback `plan` and `execute`, change the backend to `YAML`, then restart. Startup verifies
the durable database run, resumes the crash-safe staged-file promotion, retains the former
live files under `storage-rollbacks/<run>-originals`, verifies parity, and activates YAML.

Backups are published only after checksum verification. Their ZIP manifest includes the
platform, plugin/Java versions, UTC time, actor, storage identity, transition evidence,
per-domain hashes, and artifact hashes. Credentials and storage configuration files are
excluded. `backup mysql` is a portable logical CoreChatX snapshot, not a replacement for a
DBA physical backup. Confirmation tokens are printed only by `plan`, expire after ten
minutes, are stored in MySQL only as hashes, and are never cached for tab completion.

If execute/resume fails after a journal exists, do not delete the journal or staging files.
Use `status`, `check parity`, `resume`, or the direction-specific safe `abort`. In
recovery-only startup, a successful abort requires one restart before ordinary services are
reconstructed. If MySQL state cannot prove an abort safe, CoreChatX deliberately remains
frozen.

Migration run IDs are valid only within the configured storage scope. Aborting a planned or failed files-to-MySQL run changes its metadata without deleting runtime rows. An imported pre-cutover run can remove staged rows only while it exclusively owns the transition, has no active runtime lease, and the current canonical fingerprint still matches its import. Changed data, another incomplete transition, or an ambiguous `RUNNING` state makes abort fail safely; inspect history and backups before recovery.

A verified abort now records the local terminal state `ABORTED`, while `CLOSED`
identifies a completed cutover. A new attempt after abort starts from the original source;
it does not require deleting the journal. Legacy `CLOSED` aborts are reconciled by `plan`
or `execute` only when the matching MySQL run proves that the same scope and direction
were aborted. On Velocity, `abort --all-scopes` also cleans plans created before any local
journal was published and permits safe repeated aborts. An active/imported run with a
missing journal is not silently treated as a plan. After a new plan, use its new run IDs
and confirmation tokens.

Keep the corrected JARs for subsequent maintenance: older builds do not recognize the
new `ABORTED` local journal state. Do not edit transition files or database checksums to
make an older build accept them. Source builds preserve the original SQL resource bytes
through `.gitattributes`; schema checksum validation remains strict.

---

## 4.13 `locales/en_us.yml`

Purpose:
- locale override file
- per-key localized message overrides

Current bundled default:

```yml
# Locale overrides for player-facing messages.
# Missing keys fall back to messages.yml.

general:
  player_not_found: "<red>Player not found.</red>"

commands:
  corechatx-help:
    header: "{prefix} <gray>Available CoreChatX subcommands:</gray>"
    reload: "<gray>/corechatx reload</gray>"
    settings: "<gray>/corechatx settings</gray>"
    locale: "<gray>/corechatx locale [tag]</gray>"
    itemcache: "<gray>/corechatx itemcache [warmup|status|cancel]</gray>"

privacy:
  ignore:
    usage: "<red>Usage: /ignore <player></red>"
    self: "<red>You cannot ignore yourself.</red>"
    already: "<yellow>You are already ignoring that player.</yellow>"
    success: "<gray>You are now ignoring <white>{target_name}</white>.</gray>"

moderation:
  clear-chat-sender: "{prefix} <gray>Cleared chat for <white>{count}</white> online player(s).</gray>"
```

How locale resolution works now:
1. selected player locale file
2. `en_us.yml`
3. `messages.yml`

That means locale files are override layers, not the only message source.

---

## 5. Paper Runtime Data Files

These files are not your main admin-facing config, but they are part of the live plugin state.
They are authoritative only in `STANDALONE`.
In `PROXY`, equivalent runtime data is stored by the Velocity module under `plugins/corechatx/data/groups/<encoded-channel>/`, while Paper keeps only runtime caches and local static config.

## 5.1 `playerdata.yml`

Purpose:
- per-player saved settings

Bundled default:

```yml
players: {}
```

Typical keys written at runtime per UUID:
- `ping-sound`
- `ping-actionbar`
- `social-spy`
- `pm-enabled`
- `mention-notifications`
- `staff-chat-enabled`
- `hidden-channels.<channel-id>` with `0` for a permanent hide or an absolute expiration timestamp
- `chat-bubbles-enabled`
- `locale`

This file is normally not edited by hand.

Proxy authority note:
- in `PROXY` mode, player settings and nicknames are written to Velocity-owned runtime storage, not to this Paper YAML file
- expired hidden-channel entries are compacted when the player manages visibility; chat delivery checks do not write storage
- receiving backends still respect their own permissions; an active channel from Velocity is not forced if the player cannot use that channel on the destination backend

---

## 5.2 `state.yml`

Purpose:
- global runtime state

Bundled default:

```yml
first-joins:
  count: 0
chat:
  muted: false
```

This file stores:
- first-join counter
- current global chat-muted state

---

## 5.3 `channeldata.yml`

Purpose:
- per-player active channel selection

Created:
- on demand, when players actually switch away from the implicit default

Typical structure:

```yml
players:
  00000000-0000-0000-0000-000000000000:
    active-channel: "staff"
```

---

## 5.4 `ignoredata.yml`

Purpose:
- ignore lists

Created:
- on demand, when ignore data exists

Typical structure:

```yml
players:
  00000000-0000-0000-0000-000000000000:
    - "11111111-1111-1111-1111-111111111111"
    - "22222222-2222-2222-2222-222222222222"
```

---

## 5.5 `mutedata.yml`

Purpose:
- active mute records

Created:
- on demand, when mute data exists

Typical structure:

```yml
players:
  00000000-0000-0000-0000-000000000000:
    created-at: 1710000000000
    until: 1710003600000
    reason: "Spam"
    actor: "33333333-3333-3333-3333-333333333333"
    blocks-private-messages: true
```

For permanent mutes, `until` may be missing or non-positive depending on how the record was created.

---

## 5.6 `discordlinks.yml`

Purpose:
- standalone Discord/Minecraft link records
- pending one-time link codes and their expiration

Created:
- on demand in `STANDALONE` mode when a link or pending code is saved

Typical structure:

```yml
links:
  00000000-0000-0000-0000-000000000000:
    player-name: "PlayerName"
    discord-user-id: "123456789012345678"
    updated-at: 1710000000000
pending:
  ABC123:
    player-id: "00000000-0000-0000-0000-000000000000"
    player-name: "PlayerName"
    created-at: 1710000000000
    expires-at: 1710000600000
```

Behavior:
- one Minecraft UUID and one Discord user ID can belong to only one active link
- saving a link removes conflicting link records and any pending codes for that player
- expired pending codes are pruned; deleting this file removes standalone links and outstanding codes
- in `PROXY` mode this Paper file is not authoritative; Velocity stores links, pending codes, and durable unlink tombstones under the matching group directory

---

## 6. Velocity Proxy

The proxy side owns routing plus proxy-mode runtime data.

Folder:

```text
plugins/corechatx/
```

## 6.1 `velocity-config.properties`

Purpose:
- declare one or more plugin messaging channels used as isolated CoreChatX groups
- control proxy-provided group player chat completions and TAB entries
- document where proxy-owned runtime data is stored
- optionally pin Velocity backend names to CoreChatX groups so pre-backend Discord login gates can run before Paper receives the player

Current bundled default:

```properties
# CoreChatX Velocity proxy settings.

# --- Network groups / channels ---
# Comma-separate values to split this proxy into isolated CoreChatX network groups.
# Each Paper backend joins the group matching its deployment.network-channel.
network-channel=corechatx:main

# Optional backend -> network-channel pins.
# These are required only when Velocity must decide before a backend receives the player,
# such as required Discord link/role login gates in multi-group deployments.
# Keys are Velocity backend names; values must match one value from network-channel.
# backend-groups.survival-1=corechatx:survival
# backend-groups.survival-2=corechatx:survival

# --- Update notifications ---
# Console only; backend Paper instances notify their OP players.
# Stable releases are recommended; alpha/beta builds are announced for testing.
# Checks after startup, then every 1-168 hours. No automatic installation.
update-check.enabled=true
update-check.interval-hours=24

# --- Player directory ---
# Adds group player names and @names to client chat completions.
player-directory.chat-completions=true

# Adds group online players to TAB where Velocity exposes them.
player-directory.tab-entries=true

# --- Optional hooks ---
# Suppresses join, first-join, quit and Discord connection announcements for vanished players.
# Requires PremiumVanish on Velocity; no API library is bundled by CoreChatX.
hooks.premiumvanish=true

# --- Runtime data storage ---
# In PROXY mode, Velocity is the authority for player settings, nicknames, ignore lists, active channels,
# mutes, global state, Discord links and pending link codes.
# Runtime proxy data is stored separately under data/groups/<encoded-channel>/*.yml.
# Do not place player state, mutes, privacy or Discord links in this config file.

# Discord bot/account-linking settings live in velocity-discord.yml.
# Velocity-owned PROXY join/quit/first-join message formats live in velocity-messages.yml.
```

Important rules:
- each listed `network-channel` value creates a separate CoreChatX group
- each Paper backend joins the group matching its own `deployment.network-channel`
- `backend-groups.<velocity-server-name>=<network-channel>` is optional for normal routing but required for true pre-backend account-linking/role kicks in multi-group setups
- changing this file requires a Velocity restart
- changing `network-channel` also requires restart on affected backends after their `deployment.network-channel` is aligned
- Velocity startup prints the same `CORECHATX` banner shape with version, author, Velocity architecture, and project-link placeholder
- if invalid, the proxy logs degraded routing state instead of silently pretending everything is fine
- the same lowercase namespaced-key validation used by Paper is applied here
- Velocity normalizes packet source identity to the real backend connection and logs mismatches
- `player-directory.chat-completions: false` leaves client chat completions untouched by CoreChatX
- `player-directory.tab-entries: false` leaves client TAB entries untouched by CoreChatX
- in `PROXY`, Velocity owns runtime data under `data/groups/<encoded-channel>/` with YAML or in isolated database scopes with MySQL; Paper runtime YAML files are not the authority for cross-server state
- in `PROXY`, Discord bridge I/O, account-linking and required-play role checks are configured in Velocity `velocity-discord.yml`; there is no backend `authority-server` carrier requirement

---

## 6.2 `velocity-storage.yml`

Purpose:
- choose `YAML` or `MYSQL` for the Velocity-owned runtime authority
- define the restart-scoped namespace shared by all configured groups
- configure the one process-wide MySQL pool/executor and bounded proxy operation response

Current bundled default:

```yml
# CoreChatX Velocity authoritative runtime storage.
# YAML remains the default. MYSQL is explicit and never falls back to YAML after a boot failure.
storage:
  backend: "YAML"
  namespace: "production"
  # Bounded terminal response timeout for proxy-data and Discord storage operations (1000..60000 ms).
  operation-timeout-ms: 15000

  mysql:
    host: "127.0.0.1"
    port: 3306
    database: "corechatx"
    username: "corechatx"
    # Prefer password-env. Its value overrides this inline fallback.
    password: ""
    password-env: "CORECHATX_MYSQL_PASSWORD"
    ssl-mode: "VERIFY_IDENTITY"
    connect-timeout-ms: 5000
    validation-timeout-ms: 3000
    query-timeout-seconds: 10
    maximum-pool-size: 6
    minimum-idle: 1
    max-lifetime-ms: 1800000
    keepalive-time-ms: 300000
    executor-threads: 4
    executor-queue-capacity: 256
    shutdown-timeout-ms: 15000
    lease-duration-ms: 30000
    lease-renew-interval-ms: 10000
    schema-auto-migrate: true
```

Important rules:
- Velocity is the only MySQL owner in `PROXY`; Paper backends continue to use proxy repositories and never open a database connection
- all groups share one Hikari pool and bounded executor but use isolated numeric scopes derived from namespace, proxy authority, and group channel
- startup returns a Velocity `EventTask` and publishes no routing/Discord runtime until every configured group authority is ready
- one failed group keeps the entire MySQL runtime unavailable; there is no partial YAML fallback
- `operation-timeout-ms` bounds the backend/JDA response stage without cancelling the authoritative commit or its confirmed-cache update
- backend, namespace, pool, executor, schema, and lease settings all require a full Velocity restart
- the password environment override, schema journal, structural verification, DB-time lease, fencing token, and resource bounds follow the same rules documented for Paper `storage.yml`

---

## 6.3 `velocity-messages.yml`

Purpose:
- proxy-owned join, quit, and first-join announcement switches and formats
- the nickname prefix used when Velocity renders proxy/group announcements
- the persistent first-join counter behavior for each CoreChatX group

Current bundled default:

```yml
# CoreChatX Velocity messages.
# In PROXY mode, network join/quit/first-join announcements are owned and rendered by Velocity.
# Paper messages.yml is still used for STANDALONE and local-only Paper announcements.

nicknames:
  # Prefix inserted directly into {player_nickname} only when a player has a custom nickname.
  # Keep this aligned with Paper config.yml -> nicknames.prefix for matching visual output.
  prefix: ""

first-join:
  # If true, the first accepted proxy/group join uses join-quit.first-join instead of join-quit.join.
  enabled: true
  # If true, Velocity increments and exposes {count} in the first-join format.
  counter-enabled: true

join-quit:
  # These switches affect only Velocity-owned PROXY network announcements.
  join-enabled: true
  quit-enabled: true
  # MiniMessage format. Placeholders: {player_name}, {player_nickname}.
  # PlaceholderAPI placeholders like %luckperms_prefix% are resolved through PAPIProxyBridge when installed.
  join: "<dark_gray>[</dark_gray><green>+</green><dark_gray>]</dark_gray> <white>{player_nickname}</white>"
  # MiniMessage format. Placeholders: {player_name}, {player_nickname}.
  # PlaceholderAPI placeholders like %luckperms_prefix% are resolved through PAPIProxyBridge when installed.
  quit: "<dark_gray>[</dark_gray><red>-</red><dark_gray>]</dark_gray> <white>{player_nickname}</white>"
  # MiniMessage format. Placeholders: {player_name}, {player_nickname}, {count}.
  # PlaceholderAPI placeholders like %luckperms_prefix% are resolved through PAPIProxyBridge when installed.
  first-join: "<dark_gray>[</dark_gray><gradient:#79d6b8:#5aa9ff>Welcome</gradient><dark_gray>]</dark_gray> <white>{player_nickname}</white><gray> is joining for the first time as player </gray><white>#{count}</white><gray>.</gray>"
```

Important rules:
- these announcements are emitted once at proxy/group lifecycle level instead of once per backend
- PlaceholderAPI values require PAPIProxyBridge on Velocity and participating Paper backends
- keep `nicknames.prefix` aligned with Paper `config.yml` when identical display output is desired
- this file is loaded only at Velocity startup; restart the proxy after changing it

---

## 6.4 `velocity-discord.yml`

This file exists only on Velocity and is used when Paper backends run in `deployment.mode: "PROXY"`.
In proxy mode, the Discord bot for account linking, login role checks and Discord bridge I/O must live on Velocity.
Paper backends may still run separate console-only Discord bots through Paper `discord.yml -> discord.console.*`.
In standalone mode, ignore this file and configure Paper `discord.yml` instead.

```yml
# CoreChatX Velocity Discord settings.
# In PROXY deployments this is the authority for Discord bridge, account linking and login gates.
# Paper keeps discord.yml for STANDALONE mode and optional per-backend console-only bots.

account-linking:
  # Master switch for Discord-Minecraft account linking handled by Velocity.
  enabled: false
  # If true, linked Discord members get their server nickname synced to their Minecraft nickname.
  # Uses velocity-messages.yml -> nicknames.prefix when a custom nickname is set.
  # Falls back to the Minecraft player name without the prefix when no custom nickname is set.
  sync-mc-name: false
  # If true, unlinked Discord users cannot write from Discord into Minecraft bridge channels.
  require-linked: false
  # Deletes blocked unlinked Discord messages when the bot has Manage Messages in that channel.
  delete-unlinked-messages: true
  # Sends a private DM explaining why the Discord message was blocked.
  dm-unlinked-users: true
  # If true, linked Discord users may chat while the Minecraft account is offline when stored data can be resolved.
  allow-offline-linked-players: true
  # If true, Minecraft mute state blocks linked Discord inbound messages.
  enforce-minecraft-mutes: true
  # If true, the linked Minecraft account must have permission to send to the target CoreChatX channel.
  # Velocity carries this policy to Paper; Paper performs the actual Bukkit/LuckPerms permission check.
  enforce-channel-send-permission: true
  # If true, Velocity denies backend entry to unlinked players and provides a Discord link code.
  # If linking is unavailable or code creation fails, entry remains denied.
  require-linked-to-play: false
  required-play-roles:
    # Live whitelist for require-linked-to-play. Linked players must keep at least one listed Discord role.
    # Removing the last allowed role, or leaving the guild, disconnects an online player from its current CoreChatX group and blocks later joins.
    # Enable the privileged Server Members Intent for this bot in the Discord Developer Portal.
    enabled: false
    # Discord guild/server id used for role checks. If blank and the bot is in one guild, that guild is used automatically.
    guild-id: ""
    # Discord role ids allowed to play. Empty list disables only the role gate.
    role-ids: []
    # If true, linked players are denied when Discord role verification cannot be completed.
    deny-if-unverifiable: true
    # Optional per CoreChatX network-channel overrides.
    # Missing fields inherit the global values above. Set enabled: false to disable the role gate for one group.
    # Group ids must match velocity-config.properties network-channel values.
    groups:
      # corechatx:survival:
      #   enabled: true
      #   guild-id: ""
      #   role-ids:
      #     - "123456789012345678"
      #   deny-if-unverifiable: true
      # corechatx:minigames:
      #   enabled: true
      #   role-ids:
      #     - "234567890123456789"
  # Link codes generated by /discord link or required-link-to-play expire after this many minutes.
  code-expire-minutes: 10
  # Discord slash command names registered by the Velocity bot.
  # Change these if another bot/plugin already owns /link or /unlink in the guild.
  link-command-name: "link"
  unlink-command-name: "unlink"
  messages:
    unlinked-dm: "Link your Minecraft account before chatting in this channel. Run /discord link in-game, then use the Discord /{link_command} command with that code here."
    linked: "Your Discord account is now linked to {player_name}."
    unlinked: "Your Discord account has been unlinked."
    not-linked: "This Discord account is not linked to a Minecraft account."
    already-linked: "This Discord account or Minecraft account is already linked. Unlink it first."
    code-not-found: "That link code is invalid or expired."
    disabled: "CoreChatX Discord account linking is disabled."
    unavailable: "CoreChatX cannot complete that Discord linking action right now."
    link-required-kick: "<red>You must link your Discord account to play.</red>\n<gray>Use Discord command </gray><white>/{link_command} code:{code}</white><gray> within </gray><white>{minutes}</white><gray> minute(s).</gray>"
    missing-required-role-kick: "<red>Your Discord account is linked, but you do not have the required Discord role to play.</red>"
    role-check-unavailable-kick: "<red>Discord role verification is temporarily unavailable. Try again later.</red>"
    link-check-unavailable-kick: "<red>Discord account link verification is temporarily unavailable. Try again later.</red>"

discord:
  # Starts the Velocity-owned Discord bot for PROXY deployments.
  enabled: false
  bot-token: ""
  default-channel-id: ""
  connection-messages:
    # If true, accepted proxy-level join, first-join and quit messages are mirrored to Discord once per CoreChatX group.
    enabled: false
    # Discord channel ids that should receive join/quit mirrors.
    # Empty list = discord.default-channel-id.
    channels: []
    # Tokens: {source}, {source_type}, {source_server}, {channel_id}, {sender_name}, {rank_prefix}, {plain_text}, {message}
    format: "{plain_text}"
    # Optional action-specific plain-text formats. Leave empty to use format above.
    join-format: ""
    first-join-format: ""
    quit-format: ""
    embed:
      # If true, join/quit mirrors are sent as a Discord embed instead of plain content.
      enabled: false
      # Hex color used for the embed side bar.
      color: "#57F287"
      # Optional action-specific colors. Leave empty to use color above.
      join-color: "#57F287"
      first-join-color: "#57F287"
      quit-color: "#ED4245"
      # Leave title empty for a compact embed with only the description.
      title: ""
      # Supports the same tokens as connection-messages.format.
      description: "{plain_text}"
      # Optional action-specific descriptions. Leave empty to use description above.
      join-description: ""
      first-join-description: ""
      quit-description: ""
  event-messages:
    # If true, supported backend server events are mirrored to Discord once per CoreChatX group.
    # Supported source_type values for now: death, advancement.
    enabled: false
    # Discord channel ids that should receive event mirrors.
    # Empty list = discord.default-channel-id.
    channels: []
    # Tokens: {source}, {source_type}, {source_server}, {channel_id}, {sender_name}, {rank_prefix}, {plain_text}, {message}
    format: "{plain_text}"
    embed:
      # Event mirrors are sent as embeds when enabled.
      enabled: true
      color: "#5865F2"
      title: ""
      description: "{plain_text}"
    events:
      death:
        enabled: true
        # Discord channel ids. Empty falls back to event-messages.channels.
        channels: []
        # Leave empty to use event-messages.format.
        format: ""
        embed:
          enabled: true
          color: "#ED4245"
          title: ""
          # Leave empty to use event-messages.embed.description.
          description: ""
      advancement:
        enabled: true
        # Discord channel ids. Empty falls back to event-messages.channels.
        channels: []
        # Leave empty to use event-messages.format.
        format: ""
        embed:
          enabled: true
          color: "#FEE75C"
          title: ""
          # Leave empty to use event-messages.embed.description.
          description: ""
  console:
    # Allows the Velocity Discord bot to execute proxy console commands from one Discord channel.
    # When live-log is true, proxy console lines are mirrored into the same Discord channel.
    enabled: false
    channel-id: ""
    # Set to "" to execute every message in the console channel as a command.
    command-prefix: "!"
    live-log: false
    live-log-format:
      # Discord messages are edited until this rendered size is reached, then a new silent message is sent.
      max-message-chars: 1800
      # Wrap live console log blocks in Discord monospace code blocks.
      monospace: true
      # Prefix added to every mirrored console line. Uses this proxy JVM local time.
      line-prefix: "[{date} {hour}] "
      date-format: "yyyy-MM-dd"
      hour-format: "HH:mm:ss"
    # Empty allow lists mean anyone who can write in the configured Discord channel can run commands.
    allowed-user-ids: []
    allowed-role-ids: []
    max-response-chars: 1800
  player-list:
    # PROXY mode player-list command. The Discord channel route selects which CoreChatX network-channel group is listed.
    enabled: false
    # Text command listened in mapped Discord bridge channels. Set to "" to disable the text command.
    command: "!playerlist"
    # Also register a slash command. Slash commands can use true ephemeral replies.
    register-slash-command: true
    slash-command-name: "playerlist"
    # CHANNEL = public embed, DM = private DM, EPHEMERAL = slash-only private reply.
    # Text commands cannot be ephemeral, so EPHEMERAL falls back to DM for !playerlist.
    response-visibility: "CHANNEL"
    max-players: 80
    embed:
      color: "#5865F2"
      title: "Online players ({count})"
      empty-description: "No players are currently online."
      # Tokens: {player_name}, {player_nickname}, {server}.
      # PlaceholderAPI placeholders are resolved per listed player through PAPIProxyBridge when installed.
      line-format: "- {player_nickname} - {server}"
      # Count placeholders: {count}, {shown_count}, {hidden_count}. PAPI placeholders use a player from the listed group when available.
      more-format: "... and {hidden_count} more."
  channel-description:
    # Updates the description/topic of Discord text channels from the Velocity bot.
    enabled: false
    # Discord rate limits channel metadata updates; keep this at 60 seconds or higher.
    interval-seconds: 300
    triggers:
      # Queue a debounced description update when a player enters a configured CoreChatX group.
      on-connection: true
      # Queue a debounced description update when a player leaves the proxy.
      on-disconnection: true
      # Queue a debounced description update when a player moves between CoreChatX groups.
      on-group-change: true
      # When many players connect/switch/disconnect at once, CoreChatX waits this long after the last event before updating Discord.
      event-debounce-seconds: 5
    # Each entry updates one Discord text channel description.
    # network-channel selects the CoreChatX Velocity group used by {online_in_group}.
    # With a single configured group, network-channel can be left blank.
    # PlaceholderAPI placeholders like %server_tps% are resolved through PAPIProxyBridge when it is installed on
    # Velocity and on the backend servers in this group. If no player is online in the group, only CoreChatX
    # internal placeholders can be resolved.
    # Internal placeholders:
    # {online} = players online on the whole Velocity proxy.
    # {online_in_group} = players online inside the selected CoreChatX network-channel group.
    entries:
      # - channel-id: "123456789012345678"
      #   network-channel: "corechatx:survival"
      #   description: "Players {online_in_group}/{online}"
  server-status:
    # Sends Discord embed messages for proxy startup/shutdown and backend online/offline state changes.
    enabled: false
    # Velocity pings backend servers listed in velocity-config.properties backend-groups.*.
    interval-seconds: 10
    offline-threshold: 3
    online-threshold: 3
    proxy:
      enabled: true
      # Token value used by {server} for proxy online/offline messages.
      id: "velocity"
      # Empty channels fall back to default.channels, then discord.default-channel-id.
      channels: []
      embed:
        online:
          enabled: true
          color: "#57F287"
          title: "Proxy online"
          description: "`{server}` is now online."
        offline:
          enabled: true
          color: "#ED4245"
          title: "Proxy offline"
          description: "`{server}` is now offline."
    default:
      enabled: true
      # Discord channel ids. Empty falls back to discord.default-channel-id.
      channels: []
      embed:
        online:
          enabled: true
          color: "#57F287"
          title: "Server online"
          description: "`{server}` is now online."
        offline:
          enabled: true
          color: "#ED4245"
          title: "Server offline"
          description: "`{server}` is now offline."
    # Per backend override. Keys must match backend-groups.<server> in velocity-config.properties.
    # Any missing field inherits from default; write a custom title/description to avoid showing the technical {server}.
    servers:
      # survival-1:
      #   channels:
      #     - "123456789012345678"
      #   embed:
      #     offline:
      #       color: "#ED4245"
      #       title: "Survival is offline"
      #       description: "The main survival backend is not reachable."
  # Fallback format used when a backend does not provide a channel-specific Discord template.
  # PlaceholderAPI placeholders are resolved through PAPIProxyBridge with the sender UUID when available.
  format: "[{source_server}] [{channel_id}] {rank_prefix}{sender_name}: {plain_text}"
  # If true, Minecraft -> Discord bridge output breaks Discord mention tokens before sending.
  # This prevents players from pinging Discord users, roles, @everyone or @here by typing raw Discord mention syntax in Minecraft.
  prevent-mentions-from-minecraft: true
  # Optional CoreChatX channel id -> Discord channel id overrides.
  # channel-overrides:
  #   global: "123456789012345678"
  channel-overrides: {}
  inbound:
    enabled: false
    default-channel: "global"
    max-length: 400
    # Map Discord channel ids to CoreChatX channel ids.
    # With one network-channel group, a simple string value is enough:
    # channel-routes:
    #   "123456789012345678": "global"
    #
    # With multiple Velocity network-channel groups, use object values and select the target group:
    # channel-routes:
    #   "123456789012345678":
    #     channel: "global"
    #     network-channel: "corechatx:survival"
    #     require-linked: inherit
    channel-routes: {}
    # Optional per Discord route account-link override.
    # Values: inherit, true, false.
    route-overrides: {}
```

Important rules:
- `discord.enabled` starts the Velocity-owned Discord bot
- `account-linking.enabled` enables Velocity-owned Discord/Minecraft linking for proxy groups
- `account-linking.require-linked` blocks unlinked Discord users from writing through configured Discord inbound routes
- `allow-offline-linked-players`, `enforce-minecraft-mutes`, and `enforce-channel-send-permission` are Velocity-owned in proxy mode and are forwarded to Paper for linked Discord inbound messages
- `require-linked-to-play` denies unlinked Minecraft players entry before connecting to a proxy backend, with a Velocity-generated link code when available
- in both standalone and proxy deployments, mandatory linking remains enforced when the bot/link command is unavailable or code creation fails; no unlinked player is admitted as a fallback
- already linked players continue through the optional role gate; `deny-if-unverifiable` controls only role-check failures and never bypasses mandatory linking
- the unavailable-link denial is configurable as `discord.link-check-unavailable-kick` in Paper `messages.yml` and `account-linking.messages.link-check-unavailable-kick` in Velocity `velocity-discord.yml`
- `required-play-roles.role-ids` must contain numeric Discord role IDs, not role names
- an active role whitelist requires the privileged **Server Members Intent**; removing the last allowed role or leaving the guild disconnects an online linked player, and the login gate blocks reconnection
- `required-play-roles.groups.<network-channel>` can override `enabled`, `guild-id`, `role-ids`, and `deny-if-unverifiable` per isolated CoreChatX group
- missing group override fields inherit the global `required-play-roles` value; setting `enabled: false` disables the role gate for that group
- if `guild-id` is blank, the bot must be in exactly one guild for role checks to be verifiable
- `discord.default-channel-id` and `discord.channel-overrides` are the Velocity-side targets for Minecraft -> Discord messages
- `discord.inbound.channel-routes` maps Discord channel IDs to CoreChatX channel IDs; in multi-group setups use object routes with `network-channel`
- a nonblank Discord-rendered string supplied by Paper is always used, preserving backend/per-channel formatting; `discord.format` is the fallback when the backend packet has no rendered text
- there is no `discord.use-paper-outbound-format` option
- `account-linking.sync-mc-name` updates linked Discord nicknames from proxy-owned Minecraft nickname state
- `discord.connection-messages` and `discord.event-messages` mirror proxy/group joins, quits, first joins, deaths, and advancements without duplicate backend fanout
- `discord.player-list` supports group-aware text and slash responses; `discord.channel-description` supports whole-proxy and per-group counts
- `discord.server-status` reports proxy lifecycle and debounced backend online/offline transitions; backend monitoring requires `backend-groups.*` pins in `velocity-config.properties`
- Paper `discord.yml` is still used for standalone mode. In proxy mode, use it only for optional per-backend `discord.console.*` bots with separate bot tokens.

---

## 6.5 `velocity-advancements.properties`

Purpose:
- configure the disabled-by-default advancement endpoint for PROXY deployments
- bind each participating backend to its CoreChatX group and a unique authentication token

Current generated default:

```properties
# Optional full advancement synchronization. Restart proxy and backends after configuration.
# The HTTP listener binds ONLY to 127.0.0.1. Remote backends require an HTTPS reverse proxy or tunnel.
enabled=false
port=8767
# Bind a UNIQUE random token (at least 32 random bytes) to each registered Velocity backend.
# Every backend must also be pinned to this group in velocity-config.properties.
# backend.alpha-1.group=corechatx:main
# backend.alpha-1.token=${CORECHATX_ADVANCEMENT_ALPHA_1_TOKEN}
```

Important rules:
- this file is generated by the proxy when missing; it is not a bundled resource
- `enabled=false` keeps the endpoint disabled independently of each Paper backend's `advancement-sync.enabled` setting
- when enabled, the listener binds only to `127.0.0.1` on the configured `port`; remote backends require HTTPS or an encrypted tunnel
- `backend.<name>.group` must match the backend's explicit `backend-groups.<name>` pin in `velocity-config.properties`; explicit pins are required even with one group
- `backend.<name>.token` must be unique per backend and match that Paper backend's `advancement-sync.token`; environment references resolve in the Java process reading the file
- all endpoint settings and Paper `advancement-sync.*` values require restart; reload does not replace endpoint credentials
- follow [the full advancement synchronization guide](ADVANCEMENT_SYNC.md) before enabling the endpoint or changing credentials; it covers backups, backend registration, secret generation, deployment, and live verification

---

## 7. Regenerating a Clean Config Set

If you want a clean reset, stop the affected servers and proxy and back up their current admin configuration before deleting any files. Preserve runtime data and storage backups; this procedure resets configuration only.

### Paper backend

Delete the generated admin config files:

```text
config.yml
messages.yml
chat.yml
channels.yml
privacy.yml
moderation.yml
pings.yml
filter.yml
chatitems.yml
keywords.yml
chatbubbles.yml
discord.yml
telegram.yml
storage.yml
locales/
```

Then restart the server.
CoreChatX recreates the bundled defaults automatically.

If you are using proxy mode, you must then reapply:
- `deployment.mode: "PROXY"`
- unique `deployment.server-id`
- `deployment.network-features-allowed: true`

### Velocity proxy

Delete:

```text
plugins/corechatx/velocity-config.properties
plugins/corechatx/velocity-discord.yml
plugins/corechatx/velocity-messages.yml
plugins/corechatx/velocity-storage.yml
plugins/corechatx/velocity-advancements.properties
```

Then restart Velocity.
The proxy module recreates the four bundled default files and the disabled advancement endpoint template. Resetting `velocity-advancements.properties` removes its backend credential bindings; reapply the intended groups and tokens from your backup and follow [the advancement setup guide](ADVANCEMENT_SYNC.md) before enabling synchronization again.

---

## 8. Command Reference

Most commands below are Paper gameplay commands. `/ccxstorage` is registered on both Paper
and Velocity; its complete platform-specific grammar and restart workflow are documented in
the storage-maintenance section above.

| Command | Permission (default) | Behavior |
| --- | --- | --- |
| `/corechatx` or `/ccx` | `corechatx.command.corechatx` (`true`) | Shows only the root subcommands the sender can use. |
| `/corechatx reload` | `corechatx.command.reload` (`op`) | Rebuilds Paper configuration, repositories, services, bridges, tasks, snapshots, and bubbles using the reload-safe lifecycle. |
| `/corechatx settings` | `corechatx.command.settings` (`true`) | Opens the same player GUI as `/chatsettings`. |
| `/corechatx locale [tag]` | `corechatx.command.locale` (`true`) | Shows or changes the player's locale. |
| `/corechatx itemcache <warmup\|status\|cancel>` | `corechatx.command.itemcache` (`op`) | Manages Discord ChatItem render-cache warmup; console may use it without a permission check. |
| `/ccxstorage <status\|check\|backup\|migrate\|rollback\|history>` | `corechatx.command.storage` (`op`) | Validates, backs up, migrates, resumes, aborts, and audits authoritative storage; migration/rollback mutations are console-only. |
| `/msg <player> <message>` (`/tell`, `/whisper`, `/w`) | `corechatx.command.msg` (`true`) | Sends a private message, including proxy routing when available. |
| `/reply <message>` (`/r`) | `corechatx.command.reply` (`true`) | Replies to the current runtime conversation target. |
| `/socialspy` (`/spy`) | `corechatx.command.socialspy` (`op`) | Toggles persistent PM social spy. |
| `/broadcast <message>` (`/bc`) | `corechatx.command.broadcast` (`op`) | Sends the configured formatted staff broadcast. |
| `/nick <nickname\|off>` | `corechatx.command.nick` (`true`) | Sets or clears the sender's persistent nickname; `clear` and `reset` also clear it. |
| `/nick <player> <nickname\|off>` | `corechatx.command.nick.others` (`op`) | Sets or clears another online player's nickname. |
| `/realname <nickname>` | `corechatx.command.realname` (`true`) | Resolves a custom nickname to the real Minecraft username. |
| `/discord link` | `corechatx.command.discord.link` (`true`) | Generates a one-time Discord link code. |
| `/discord unlink` | `corechatx.command.discord.unlink` (`true`) | Removes the sender's Discord link. |
| `/discord linked` | `corechatx.command.discord.linked` (`true`) | Shows the sender's Discord link state. |
| `/discord linkadmin <player> <discord_user_id>` | `corechatx.command.discord.admin` (`op`) | Forces a link for an online/offline known player or UUID. |
| `/discord unlink <player\|discord_user_id>` | `corechatx.command.discord.admin` (`op`) | Removes another player's link by known player/UUID or Discord user ID. |
| `/ping <sound\|actionbar> [on\|off\|toggle\|status]` | `corechatx.command.ping` (`true`) | Reads or changes mention/custom-ping notification preferences. |
| `/channel list` | `corechatx.command.channel` (`true`) | Lists channels the player can access. |
| `/channel set <id>` | `corechatx.command.channel` (`true`) | Selects an enabled, accessible, visible channel. |
| `/hidechannel <channel> [minutes]` | `corechatx.command.hidechannel` (`true`) | Hides an accessible channel permanently or for a positive whole number of minutes. |
| `/unhidechannel <channel>` | `corechatx.command.unhidechannel` (`true`) | Restores one of the player's hidden channels. |
| `/ignore <player>` | `corechatx.command.ignore` (`true`) | Adds a player to the PM ignore list and applies the configured public-chat ignore mode. |
| `/unignore <player>` | `corechatx.command.unignore` (`true`) | Removes a player from the ignore list. |
| `/ignorelist` | `corechatx.command.ignorelist` (`true`) | Lists ignored players. |
| `/pmtoggle` | `corechatx.command.pmtoggle` (`true`) | Toggles receipt of private messages. |
| `/chatsettings` (`/ccxsettings`) | `corechatx.command.settings` (`true`) | Opens the player communication settings GUI. |
| `/mute <player> [duration] [reason...]` | `corechatx.command.mute` (`op`) | Mutes a known player; duration accepts `<number><s\|m\|h\|d>`, while omitted/`permanent` is permanent. |
| `/unmute <player>` | `corechatx.command.unmute` (`op`) | Removes an active mute. |
| `/mutechat` | `corechatx.command.mutechat` (`op`) | Toggles the persistent global public-chat mute. |
| `/clearchat` | `corechatx.command.clearchat` (`op`) | Clears visible chat for online players using the configured line count. |

Configured channel shortcuts add `/shortcut` and `/shortcut <message>` dynamically;
they reuse the channel's send/access rules and do not introduce a separate fixed permission.
The internal `/corechatx item <snapshot-uuid> [view]` action is generated by clickable
ChatItem components and opens an existing snapshot; it is not shown as an admin/player
workflow command.

---

## 9. Permission Reference

Some permissions are defined in config files and can be changed by the server owner:
- `pings.yml -> custom-pings.<id>.use-permission`
- `pings.yml -> custom-pings.<id>.receive-permission`
- `keywords.yml -> keywords.<id>.permission`
- `channels.yml -> channels.<id>.permission-send`
- `channels.yml -> channels.<id>.permission-receive`
- `privacy.yml -> private-messages.staff-bypass-permission`
- `chatitems.yml -> tokens.<type>.permission`

These nodes may not all be listed in `plugin.yml` because they are configurable values,
not fixed plugin API. `channels.yml`, `pings.yml`, and `privacy.yml` validate malformed
dynamic permission nodes and disable only the broken binding. An invalid keyword
permission disables only that keyword. ChatItem token permissions are used as configured,
so keep them valid Bukkit permission nodes.

Fixed non-command permissions bundled in `plugin.yml`:
- moderation bypasses: `corechatx.moderation.bypass.mutechat`, `corechatx.moderation.bypass.repeat`, and `corechatx.moderation.bypass.caps` (`op`)
- cooldown bypasses: `corechatx.cooldown.bypass.public` and `corechatx.cooldown.bypass.pm` (`op`)
- shared staff example: `corechatx.staff` (`op`)
- bubbles: `corechatx.chatbubbles.use` (`op`)
- ChatItems: `corechatx.chatitem.item`, `.shulker`, `.armor`, `.hotbar`, `.inventory`, and `.enderchest` (`op`)
- storage maintenance: `corechatx.command.storage` (`op`); migration and rollback mutations remain console-only
- all player-authored legacy colors: `corechatx.format.color` or `corechatx.format.color.*` (`op`)
- individual player-authored colors: `corechatx.format.color.black`, `corechatx.format.color.dark_blue`, `corechatx.format.color.dark_green`, `corechatx.format.color.dark_aqua`, `corechatx.format.color.dark_red`, `corechatx.format.color.dark_purple`, `corechatx.format.color.gold`, `corechatx.format.color.gray`, `corechatx.format.color.dark_gray`, `corechatx.format.color.blue`, `corechatx.format.color.green`, `corechatx.format.color.aqua`, `corechatx.format.color.red`, `corechatx.format.color.light_purple`, `corechatx.format.color.yellow`, and `corechatx.format.color.white` (`op`)
- all player-authored legacy styles: `corechatx.format.style` or `corechatx.format.style.*` (`op`)
- individual player-authored styles: `corechatx.format.style.magic`, `corechatx.format.style.bold`, `corechatx.format.style.strikethrough`, `corechatx.format.style.underline`, `corechatx.format.style.italic`, and `corechatx.format.style.reset` (`op`)

Nickname formatting is deliberately separate from player-authored chat formatting:
- `corechatx.nick.color` grants all nickname colors (`op`), while individual nodes default to `false`
- individual nickname colors are `corechatx.nick.color.black`, `corechatx.nick.color.dark-blue`, `corechatx.nick.color.dark-green`, `corechatx.nick.color.dark-aqua`, `corechatx.nick.color.dark-red`, `corechatx.nick.color.dark-purple`, `corechatx.nick.color.gold`, `corechatx.nick.color.gray`, `corechatx.nick.color.dark-gray`, `corechatx.nick.color.blue`, `corechatx.nick.color.green`, `corechatx.nick.color.aqua`, `corechatx.nick.color.red`, `corechatx.nick.color.light-purple`, `corechatx.nick.color.yellow`, `corechatx.nick.color.white`, `corechatx.nick.color.hex`, and `corechatx.nick.color.gradient`
- `corechatx.nick.format` grants all nickname styles (`op`), while individual nodes default to `false`
- individual nickname styles are `corechatx.nick.format.obfuscated`, `corechatx.nick.format.bold`, `corechatx.nick.format.strikethrough`, `corechatx.nick.format.underline`, `corechatx.nick.format.italic`, and `corechatx.nick.format.reset`

Command permissions and defaults are listed in the command table above. Player-facing
commands default to `true`; staff, moderation, reload, item-cache, storage, cross-player nickname,
and Discord administration permissions default to `op`.

---

## 10. Practical Admin Notes

- Keep `messages.yml` as the main wording file unless you actively need locale-specific overrides.
- Use LuckPerms for rank titles/prefixes, and use CoreChatX for layout.
- Keep `group-formats` keyed to the LuckPerms primary group in lowercase.
- Keep `YAML` unless you deliberately provision and validate `MYSQL`; changing the enum alone is not a migration of existing runtime data.
- When testing a network, always verify backend `server-id` values are unique.
- If a custom permission node in `channels.yml`, `pings.yml`, or `privacy.yml` is malformed, CoreChatX warns and disables only that specific binding; malformed keyword permissions disable only that keyword.
- If you delete runtime data files such as `playerdata.yml` or `mutedata.yml`, you are deleting live player/plugin state, not just decorative cache.
- CoreChatX starts bStats on Paper and Velocity; opt-out is controlled by the platform-wide bStats files (`plugins/bStats/config.yml` on Paper and `plugins/bStats/config.txt` on Velocity), not by a CoreChatX config key.

Operational guidance:
- treat `config.yml -> deployment.*` and `velocity-config.properties -> network-channel` as boot identity, not casual reload settings
- keep one source of truth for each visual decision; do not duplicate the same format across many plugins
- use channels for routing rules instead of hardcoding bridge behavior in several places
- use PlaceholderAPI in trusted templates, not as a way to let players execute arbitrary placeholder expansion through chat
- keep bridge tokens private and never paste them into public support logs
- back up runtime data before manually editing player settings, mutes, ignores, or active channel state

---

## 11. Troubleshooting Quick Reference

### Startup banner does not appear

Check that the correct jar is installed for the platform.
The Paper jar must be on Paper, and the Velocity jar must be on Velocity.
On startup, CoreChatX prints a `CORECHATX` banner with version, author, architecture, and a project-link placeholder.

### `/corechatx reload` does not apply a change

Some settings are identity or transport settings and require restart:
- `deployment.mode`
- `deployment.server-id`
- `deployment.network-channel`
- every setting in Velocity `velocity-config.properties`, `velocity-discord.yml`, `velocity-messages.yml`, and `velocity-storage.yml`

If the change affects runtime transport, restart the affected backend or proxy instead of relying on reload.

### Network messages do not cross servers

Verify:
- every backend uses `deployment.mode: "PROXY"`
- every backend has a unique `deployment.server-id`
- every backend has `deployment.network-features-allowed: true`
- every backend `deployment.network-channel` is present in Velocity `velocity-config.properties -> network-channel`
- the Velocity jar is installed and started
- at least one eligible player connection exists for plugin-message transport when Paper needs a packet carrier

Also check that the channel itself is configured as `scope: NETWORK`.
In standalone mode, `NETWORK` channels fall back to normal local chat behavior.

### Discord or Telegram messages do not send

Verify:
- `deployment.bridges-allowed: true`
- the specific bridge `enabled` value is true
- the CoreChatX channel has `export-to-bridges: true`
- tokens, channel ids, chat ids, and topic ids are valid
- outbound routing points to the intended external target

In proxy mode, outbound export is performed only from the source backend to avoid duplicate external messages.

### Discord or Telegram inbound does not appear in Minecraft

Verify:
- inbound is enabled for that bridge
- the inbound route points to an existing CoreChatX channel
- the backend running the inbound listener is one that should locally display the message
- for Discord, the bot has the required Message Content intent when message content is needed
- for Telegram, the bot is reachable through Bot API long polling

Telegram uses Bot API `getUpdates`.
It does not use MTProto, Telegram4J, webhook mode, or an embedded HTTP server.

### Removing a Discord whitelist role does not disconnect the player

Verify:
- the account-linking role gate is enabled for the affected network group
- the bot has the privileged **Server Members Intent** enabled in the Discord Developer Portal
- the bot was restarted after enabling that intent
- `guild-id` and `role-ids` identify the expected guild and numeric Discord roles
- the Minecraft account is linked to the Discord member being changed

CoreChatX evaluates login against the current Discord membership and also consumes live
member-role and guild-leave events. Losing the final configured role, leaving, being
kicked, or being banned from the configured guild disconnects an online linked player.
The login gate then blocks reconnection until the Discord requirement is satisfied.

### PlaceholderAPI placeholders do not render

Verify:
- PlaceholderAPI is installed on that backend
- `hooks.placeholderapi: true`
- the expansion that owns the placeholder is installed and working
- the string being edited is a supported server-controlled template

Raw player message bodies do not pass through PlaceholderAPI.
Mention token PlaceholderAPI context is the mentioned player, using `OfflinePlayer` where possible for cross-backend mentions.

### Mentions do not notify players

Verify:
- mentions are enabled in `chat.yml`
- the channel has `allow-mentions: true`
- the target player allows mention notifications
- ignore and privacy settings are not blocking the notification
- permissions and staff bypass rules are configured as intended

### ChatItems work locally but not across servers

Verify:
- backend and Velocity network settings match
- ChatItems are enabled for the channel
- remote snapshot request limits are not rejecting the item bundle
- the snapshot has not expired
- `network-features-allowed` is true on participating backends

Cross-server ChatItems use lightweight refs in chat and on-demand snapshot retrieval through Velocity.
They intentionally avoid embedding a full inventory payload into every chat packet.

### Discord ChatItem images do not render

Verify:
- `chatitems.yml -> discord-images.enabled: true`
- the Minecraft source channel allows ChatItems and bridge export
- the sender has the configured token permission
- vanilla assets can be downloaded or already exist in the local cache
- optional resource-pack paths resolve from `plugins/CoreChatX/`
- the image count and network snapshot limits are not rejecting the request

Use `/corechatx itemcache status` to inspect warmup state. A rendering failure does not
break the Minecraft ChatItem preview; it only prevents the Discord attachment.

### Chat bubbles are missing

Verify:
- chat bubbles are enabled in `chatbubbles.yml`
- the player has the bubble permission
- the player has not disabled bubbles in settings
- the channel has `allow-chat-bubbles: true`
- the message passed normal CoreChatX checks

In proxy mode, bubbles stay local to the backend where the sender is physically playing.

### A config permission warning appears

Check dynamic permission nodes in:
- `channels.yml`
- `pings.yml`
- `privacy.yml`
- `keywords.yml`
- `chatitems.yml`

Malformed nodes disable only the affected binding or keyword where validation is available.
They do not require deleting the whole config.

### A runtime data file looks wrong

Stop the server, back up the file, then inspect it.
Runtime files such as `playerdata.yml`, `channeldata.yml`, `ignoredata.yml`, `mutedata.yml`, and `discordlinks.yml` are live state.
Deleting or editing them changes player/plugin data.

---

## 12. Production Validation Checklist

Before opening a server to players:
- boot every Paper backend once and confirm the `CORECHATX` startup banner
- boot Velocity once and confirm the proxy-side `CORECHATX` startup banner
- run a normal public chat message
- run a channel switch and verify send/receive permissions
- test a configured channel shortcut in switch and one-shot send forms
- test permanent and timed `/hidechannel`, then `/unhidechannel`
- test `/msg` and `/reply`
- disconnect/rejoin a PM participant and confirm the previous-session reply target is gone
- test `/nick`, `/realname`, and nickname formatting permissions
- test mentions, custom pings, and notification toggles
- test the configured public-chat ignore mode and one per-channel override
- test one PlaceholderAPI value in a server-controlled template
- test one keyword hover/click action
- test one ChatItem preview locally
- if Discord ChatItem images are enabled, test an image plus its item-inspection selector
- in proxy mode, test one network channel message from each backend
- in proxy mode, test one cross-backend PM
- in proxy mode, test one cross-backend ChatItem preview click
- test Discord outbound and inbound if enabled
- test Discord link/unlink, nickname sync, player list, event/connection mirrors, descriptions, and status messages for every feature you enable
- if Discord role admission is enabled, remove the final allowed role while the player is online and confirm disconnect plus blocked reconnect
- test Telegram outbound, inbound, and topic routing if enabled
- test mute, mutechat, clear chat, social spy, ignore, and PM toggle behavior
- run `/corechatx reload` after a harmless wording change and confirm it applies

For source builds, useful checks are:

```bash
mvn clean test
mvn clean package -DskipTests
git diff --check
```

The Paper and Velocity runtime jars embed `corechatx-common`, `corechatx-storage-mysql`,
HikariCP and Connector/J through a narrow Maven Shade allowlist with merged JDBC service
metadata. Install only the two platform jars; do not install internal modules or JDBC jars
separately. Other Paper libraries remain declared through `plugin.yml`; Velocity keeps its
existing runtime library loading under `plugins/corechatx/libs`.

---

## 13. Related Documents

- `PLUGIN_FEATURES_LISTED.md`: feature overview written for server owners and presentation pages
- this file: exact config keys, defaults, restart rules, runtime-data ownership, troubleshooting, and operational notes

This document is aligned to the current codebase and bundled defaults as of the present project state.


## Per-player channel persistence

In /ccxsettings (also /chatsettings), the compass item **Channel** switches between **Persistent** and **Non persistent**. Persistent is the default for existing and new players.

- Persistent keeps the selected active channel across disconnects and server restarts.
- Non persistent keeps the current session's selection, then returns to the configured default channel on the next connection. Changing the option does not immediately change the current channel.
- A backend transfer within the same proxy connection keeps the active channel. Each isolated proxy group applies its own saved preference once per connection.
- One-shot shortcut messages do not change the active channel. An unavailable/deleted selected channel still falls back to the configured default.

The preference is stored as persistent-channel-enabled in player YAML and in MySQL as ccx_player_settings.persistent_channel_enabled. Missing legacy YAML values and the additive V003 schema migration default to true. MySQL resets the saved selection before standalone admission; Velocity prepares each group before backend entry. An empty active-channel value means resolve the current backend's configured default.

Upgrade Paper and Velocity together: this field uses plugin-message protocol 29, so older protocol-28 JARs must not remain in a mixed network. The channel preference was introduced in MySQL V003; CoreChatX 2026.3.1 also requires V004 for advancement records, even when advancement sync is disabled. Installations with schema-auto-migrate=false must arrange the schema upgrade before boot. Existing V001/V002/V003 checksums are unchanged. Older builds reject schema versions newer than they support; reverting only the JAR is not a database downgrade.

Logical backups, YAML/MySQL migration and rollback retain this preference. Without advancement records, canonical exports keep legacy format 1 when every player uses persistent channels, preserving historical hashes; snapshots containing a channel-persistence opt-out use format 2. Snapshots containing advancement records use format 3. All three formats remain readable in 2026.3.1.
