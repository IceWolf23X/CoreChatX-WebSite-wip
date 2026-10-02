# CoreChatX Feature List

CoreChatX is a complete communication suite for Minecraft servers.
It brings chat, private messages, channels, mentions, pings, chat item previews, chat bubbles, moderation, player settings, locales, and external bridges into one polished system.

The idea is simple: server chat should feel like one product, not a stack of separate plugins that each need their own configuration, commands, and maintenance.

This page is a commercial-style feature overview.
Exact config keys, defaults, limits, and operational details are documented in `PLUGIN_CONFIGURATION_INSTRUCTIONS.md`.

---

## Why CoreChatX

Many servers end up installing one plugin for chat, another for private messages, another for mentions, another for channels, another for Discord, another for Telegram, another for chat bubbles, another for item previews, and then one more just to keep the whole setup consistent.

That works, technically.
It also turns chat into a maintenance hobby.

CoreChatX is built for server owners who want the whole communication experience to feel consistent:

- one visual language
- one permission model
- one player settings flow
- one network-aware chat layer
- one place to manage public chat, PMs, channels, pings, bridges, moderation, and rich interactions

It is not trying to be "yet another chat plugin".
It is trying to replace scattered chat-related plugin stacks with one clean, friendly, server-ready system.

---

## Current State

CoreChatX currently:

- supports Paper `1.21.11`, with additional live verification on Paper `26.2` build `112` for the recorded scenarios below
- ships separate `corechatx-paper` and `corechatx-velocity` jars
- uses `CoreChatX` as the Paper plugin name
- uses `corechatx` as the Velocity plugin id
- works on standalone Paper servers
- works on Velocity networks with multiple Paper backends
- keeps YAML as the default runtime backend and supports explicit MySQL authority for standalone Paper or Velocity-owned proxy groups
- provides fail-closed, backup-first YAML-to-MySQL migration and latest-state MySQL-to-YAML rollback tooling on Paper and Velocity
- has been tested on a live Paper test server
- has been tested on a small live Velocity network
- supports Discord inbound and outbound messages
- supports Telegram inbound and outbound messages
- supports Telegram forum topic routing
- includes optional chat bubbles above players
- keeps player communication settings aligned across server switches
- optionally synchronizes full advancement criteria across a Velocity group, merging existing progress with silent restoration and live public announcements; disabled by default, with an authenticated endpoint and YAML/MySQL authority ([setup and limits](ADVANCEMENT_SYNC.md))
- supports persistent or timed per-player channel hiding
- supports Discord account linking and optional role-based login gates
- supports persistent nicknames with real-name lookup and granular formatting permissions
- can render ChatItem snapshots as Discord images with interactive item inspection
- checks Modrinth asynchronously for updates, notifying console and OP players; green console banners recommend stable updates, while yellow banners identify alpha/beta builds as experimental

---

## One Suite, Not Ten Plugins

CoreChatX covers the core communication stack:

- public chat
- private messages
- replies
- channels
- mentions
- custom pings
- interactive keywords
- chat item previews
- chat bubbles
- moderation tools
- player settings
- persistent nicknames and real-name lookup
- locale support
- Discord bridge
- Telegram bridge
- standalone and Velocity network setups

The value is not just the feature count.
The value is that these features know about each other.

Channels can affect formatting and bridge export.
Mentions can respect player settings.
Private messages can work with social spy and ignore rules.
Network chat can carry rich Adventure components and ChatItem preview references.
Bridges can follow channel routing instead of acting like a separate side project.

Optional death announcements can also cross Paper backends within the same Velocity group.
Enable `death-messages.network-enabled` on every participating backend to send and receive
the original public death component, preserving translations and formatting without a duplicate
on the source server. This defaults to `false`; cancelled, hidden and team-restricted deaths
stay local. It requires updated Paper and Velocity builds and is independent of Discord death mirrors.

That is the difference between a chat system and separate plugins with overlapping commands and disconnected configuration.

---

## Polished Public Chat

CoreChatX gives public chat the kind of foundation players actually notice:

- clean chat formats
- rank-aware layouts
- channel-aware layouts
- LuckPerms prefix support
- PlaceholderAPI support in server-controlled templates
- join, quit, and first-join messages
- optional PremiumVanish hooks on Paper and Velocity suppress hidden players' connection announcements and their Discord/Telegram mirrors
- message cleanup and sanitization
- anti-repeat checks
- anti-caps checks
- word filtering
- configurable legacy color/style permissions for player-authored messages
- public-chat ignore modes that can suppress notifications or hide ignored senders

Player-written messages stay safe.
Server-owned templates can use dynamic placeholders, while normal player input is kept under control before it becomes a rich chat component.

---

## Kyori Adventure And MiniMessage

CoreChatX is built around Kyori Adventure and MiniMessage formatting.
That means server owners can create modern chat components without being trapped in old color-code-only formatting.

MiniMessage support makes it easy to use:

- colors
- gradients
- hover text
- click actions
- suggested commands
- copy-to-clipboard actions
- reusable formatting patterns
- clean rich text across chat, messages, previews, and bridge output

This gives CoreChatX a modern Paper-native feel instead of a legacy chat setup with richer formatting bolted on afterward.

---

## PlaceholderAPI-Powered Interactions

CoreChatX can combine MiniMessage with PlaceholderAPI inside server-controlled templates.

That opens the door to fast, flexible interactions based on:

- player data
- ranks and groups
- economy values
- server stats
- world data
- progression systems
- installed PlaceholderAPI expansions
- custom server logic exposed through placeholders

In practice, this means server owners can build dynamic chat interactions without extra glue just to make a hover line or click action show something useful.

If PlaceholderAPI can expose it, CoreChatX can help turn it into part of the chat experience.

When PlaceholderAPI is installed, CoreChatX also exposes its own nickname, first-join
date, and message-count placeholders for use by other plugins.

---

## Persistent Nicknames

Players can set a persistent CoreChatX nickname without replacing the real Minecraft
identity used for permissions, routing, or administration.

The nickname system includes:

- `/nick <nickname|off>` for self-service changes
- operator-controlled `/nick <player> <nickname|off>`
- `/realname <nickname>` lookup
- duplicate and real-username collision prevention
- configurable visible-length and character validation
- granular legacy color, hex, gradient, and style permissions
- nickname-aware chat, mentions, joins, previews, player lists, and bridge output
- proxy-owned persistence and synchronization across backend switches
- optional synchronization to the linked Discord member nickname

---

## Interactive Keywords

Interactive keywords let players type simple tokens such as:

- `[discord]`
- `[rules]`
- `[store]`
- `[vote]`
- `[map]`

CoreChatX can turn those tokens into polished clickable chat elements.

They can include:

- hover text
- click commands
- suggested commands
- URLs
- copied text
- optional permissions
- channel restrictions
- optional PlaceholderAPI rendering

This is the kind of small feature that often becomes "add another plugin".
Here, it is just part of the chat suite.

---

## Mentions And Pings

Mentions and pings are built directly into the message flow.

They support:

- player mentions
- `@Player` and exact-name mention behavior
- custom ping triggers
- sound notifications
- actionbar notifications
- per-player ping toggles
- staff-friendly ping rules
- cross-server mention awareness
- mention formatting based on the mentioned player

Because mentions are part of CoreChatX itself, they can work with formatting, notifications, privacy choices, and Velocity network presence instead of pretending every server is isolated.

---

## Channels

CoreChatX supports multiple channel styles:

- global chat
- local chat
- staff chat
- network-wide chat
- role-based chat spaces
- custom server-defined channels

Channel delivery scopes are explicit: `NETWORK` crosses matching Velocity groups,
`SERVER` stays on one backend, and `LOCAL_RADIUS` stays within a configurable world radius.

Channels can decide:

- who can send
- who can receive
- whether a short command such as `/g` switches or sends once to the channel
- which features are enabled
- how messages look
- whether chat bubbles are allowed
- whether ChatItems are allowed
- whether messages can be exported to Discord or Telegram
- whether ignored senders stay visible, lose notification rights, or are hidden in that channel

Players with the corresponding permissions can also hide an accessible channel with
`/hidechannel <channel> [minutes]` and restore it with `/unhidechannel <channel>`.
A hidden channel cannot be sent to or received by that player; timed hides expire
automatically, permanent hides remain until explicitly removed, and the setting follows
the player across backend switches in proxy mode.

This keeps channel behavior centralized instead of scattered across several plugins with separate ideas of how chat should behave.

---

## Private Messages

Private messaging is part of the same communication system as public chat.

Included tools:

- direct messages
- reply command
- social spy
- ignore controls
- PM toggle
- delivery feedback
- cross-server private messages

The result is a PM system that understands the rest of the plugin: privacy, moderation, network routing, formatting, and player settings all live in the same ecosystem.

---

## Moderation Tools

CoreChatX includes the everyday moderation controls a real server needs:

- player mute
- unmute
- global chat mute
- clear chat
- anti-repeat checks
- anti-caps checks
- word filtering
- staff bypass permissions

Moderation is handled inside the chat layer itself.
That means it works naturally with channels, private messages, network behavior, and player settings.

This avoids making separate moderation and chat tools duplicate or guess each other's state.

---

## Chat Item Previews

Players can share clickable previews for:

- held items
- shulker contents
- armor
- hotbar
- inventory
- ender chest

Multiple ChatItem tokens in the same message can reuse the same captured player state while still opening the correct view.

On a Velocity network, players on another backend can still click and open the preview through lightweight snapshot references and on-demand retrieval.
That keeps network chat cleaner and avoids stuffing heavy item data into the main chat packet.

When Discord export is enabled, CoreChatX can also:

- render item, shulker, armor, hotbar, inventory, and ender-chest snapshots as PNG images
- reproduce item names, lore, enchantments, attributes, potion effects, trims, banners, books, fireworks, durability, and other tooltip details
- load vanilla client assets and layer optional server resource packs
- expose Discord dropdowns that return an ephemeral preview of a selected inventory item
- warm, inspect, or cancel the item render cache through `/corechatx itemcache`

Discord rendering is independent from the in-game preview: an asset/render failure does
not remove the Minecraft ChatItem token.

---

## Chat Bubbles

CoreChatX can show recent chat messages above player heads.

Bubble features include:

- player toggle
- channel rules
- world rules
- sneaking checks
- invisibility checks
- configurable duration
- message wrapping
- stacked recent messages
- distance-based visibility
- cleanup on quit, reload, and shutdown

Chat bubbles use the already processed message, so filtering, channels, mentions, and keywords have already done their job.

On a network, bubbles stay local to the server where the sender is physically playing.
That keeps the feature useful without pretending an overhead bubble can float across servers.

---

## Player Controls

Players get direct control over important communication preferences:

- settings menu
- ping toggles
- PM toggle
- channel switching
- personal Persistent / Non persistent channel selection in `/ccxsettings`: keep the active channel or return to the default on reconnect, while preserving it during proxy backend transfers
- chat bubble toggle
- locale selection
- ignore list controls
- persistent nickname controls and real-name resolution
- permanent or timed personal channel visibility

The ignore system can remain PM-only, suppress public mention/custom-ping notifications,
or hide public messages from ignored players. Each channel may inherit or override the
global public-chat mode.

This makes CoreChatX feel like a player-facing feature, not just an admin-side config file with a chat command attached.

---

## Locale Support

CoreChatX includes a practical locale foundation:

- per-player locale selection
- locale override files
- fallback to the main message file
- cleaner control over player-facing wording

This is useful for multilingual communities and for servers that want every message to sound like it belongs to their brand.

---

## Discord And Telegram Bridges

CoreChatX includes built-in bridge support.

Important disclosure: Discord and Telegram bridges are optional and only run when the server owner enables and configures them.
When enabled, CoreChatX can send selected chat content, player display names, channel labels, and related message formatting to the Discord or Telegram services configured by the server owner.
Inbound bridge messages can also bring Discord or Telegram messages back into configured Minecraft channels.

Bridge features include:

- Discord outbound messages
- Discord inbound messages
- Telegram outbound messages
- Telegram inbound messages
- Telegram forum topic routing
- per-channel bridge targets
- channel-level bridge export control
- global bridge master switch
- cleaner reload and shutdown behavior
- safe message length handling
- Discord/Minecraft account linking
- optional linked-member nickname synchronization
- optional linked-account and Discord-role login gates
- immediate revocation when a linked member loses the final allowed role or leaves the configured guild
- join, quit, first-join, death, and advancement mirrors
- text and slash player-list embeds
- configurable public, DM, or slash-ephemeral player-list responses
- Discord channel-description updates with online counts and PlaceholderAPI support
- proxy and backend online/offline status embeds
- Discord console command relay and live console-log mirroring
- rendered Discord ChatItem images and per-item inspection menus

Discord role-based admission requires the privileged **Server Members Intent**. When
the gate is enabled, CoreChatX checks the linked member at login and reacts to live
role or guild-membership changes: an affected online player is disconnected, and the
same gate prevents reconnection until access is restored.

The bridge layer is treated as part of the chat system, not as a separate external pipe with unrelated routing rules.

That matters because channel rules, formatting, network behavior, and bridge routing should agree with each other.
If they do not, players notice.
Admins notice faster.

---

## Velocity Network Support

CoreChatX supports both standalone Paper servers and Velocity networks.

In network mode, it can keep these features working across servers:

- network-wide chat channels
- cross-server private messages
- player communication settings, nicknames, hidden channels, ignore lists, and moderation state
- player name suggestions
- TAB entries where available
- mentions and pings
- interactive keyword behavior
- ChatItem preview access
- bridge export without duplicate network messages
- proxy-owned Discord account linking, unlink tombstones, and role-based admission
- group-aware join/quit/first-join announcements
- PremiumVanish-aware connection announcements when PremiumVanish is installed on Velocity
- group-aware Discord player lists, channel descriptions, and event/status messages

Velocity isolates runtime state by configured CoreChatX network group. Persistent unlink
tombstones ensure that a backend returning after cache eviction, proxy restart, or more
than seven days offline still receives an authoritative unlink instead of retaining a
stale Discord association.

This is where the "one suite" approach matters most.
A network setup should not require a separate plugin stack on every backend just to make messages, toggles, mentions, and PMs understand that players moved servers.

---

## Commands

The current Paper command surface includes:

- plugin and player tools: `/corechatx` (`/ccx`), reload, settings, locale, and Discord ChatItem cache management
- private communication: `/msg` (`/tell`, `/whisper`, `/w`), `/reply` (`/r`), `/socialspy` (`/spy`), `/pmtoggle`, `/ignore`, `/unignore`, and `/ignorelist`
- channels and notifications: `/channel`, dynamic channel shortcut commands, `/hidechannel`, `/unhidechannel`, and `/ping`
- identity: `/nick` and `/realname`
- Discord linking: `/discord link`, `/discord unlink`, `/discord linked`, plus administrative force-link/unlink operations
- player settings: `/chatsettings` (`/ccxsettings`)
- staff communication and moderation: `/broadcast` (`/bc`), `/mute`, `/unmute`, `/mutechat`, and `/clearchat`

Player-facing commands default to normal access, while reload, moderation, social spy,
broadcast, item-cache administration, cross-player nickname changes, and Discord link
administration default to operators. Dynamic channel, ping, keyword, privacy, and ChatItem
permissions remain configurable.

The commands are designed around the same communication layer, so they feel connected instead of random.

---

## Admin Experience

CoreChatX includes practical behavior for server owners:

- clear startup information
- version and author shown on startup
- Paper or Velocity architecture shown on startup
- `CORECHATX` startup banner
- `corechatx.*` permission namespace
- `corechatx:main` default network channel
- safer config validation
- cleaner failure handling
- safer network message handling
- bridge lifecycle handling on reload and shutdown
- config regeneration support
- bStats metrics with a bundled license notice
- atomic YAML runtime writes
- isolated Velocity group storage with persistent Discord unlink tombstones
- one bounded MySQL pool/executor per process, checksummed schema history, DB-time fenced scope leases, monotonic transactional updates, and confirmed runtime caches
- fail-closed asynchronous MySQL startup and Paper pre-login hydration without JDBC on the Paper primary thread
- deterministic MySQL packaging in both runtime jars, including merged JDBC service metadata but excluding test tooling
- deterministic canonical snapshots, immutable checksummed backups, short-lived confirmation plans, parity checks, durable transition journals, crash-safe resume/abort, and retained-original rollback promotion
- recovery-only `/ccxstorage` control planes on Paper and Velocity, with explicit all-group transitions on proxy deployments
- main-thread snapshots before Discord callbacks use live Paper player state
- reload-safe settings GUI service/repository lookup
- quit cleanup for PM reply targets

These are not flashy player-facing features, but they make day-to-day operation much easier to trust and maintain.

---

## Verified

Recorded validation includes:

- build and test passes
- standalone Paper startup
- Velocity startup
- Paper startup in network mode
- command checks
- config regeneration checks
- live Paper test environment checks
- live Velocity network test environment checks

The established YAML deployments and process-level standalone/proxy MySQL lifecycles have
been exercised. The automated suite also covers real MySQL schema, lease, lifecycle,
concurrency, migration, logical export/import parity, rollback preservation, and crash-safe
file promotion.

The bounded laboratory acceptance completed on 2026-09-09 covered authenticated
Minecraft/Discord sessions, YAML-to-MySQL cutover, latest-state rollback, interruption
recovery, and user-visible storage and bridge failures on standalone and Velocity
deployments. The [recorded lab acceptance](<../2026.3.0 roadmap/06_FINAL_INTEGRATION_AND_RELEASE_GATES.md>)
describes the conditional acceptance and its exact scope for those tested builds.

Additional live verification on 2026-09-15 used two authenticated Minecraft 26.2 clients,
Paper 26.2 build 112, and Velocity 4.1.0 build 21. The recorded cases covered advancement
synchronization, silent historical restoration, revocations, cross-backend advancement
and death announcements, and YAML/MySQL persistence. The [advancement guide](ADVANCEMENT_SYNC.md)
records these cases and their boundaries.

These laboratory results apply to the recorded builds and scenarios. Validation with
production data, measured production capacity, and exhaustive configuration/datapack
coverage remain unverified. Telegram runtime checks were excluded from the recorded
laboratory acceptance scope.

---

## Future Direction

CoreChatX is designed to grow into a broader communication hub for common server social systems, such as:

- clans and guilds
- towns and settlements
- lands and territories
- parties and lightweight groups

The goal is to make chat aware of the communities players actually build, while keeping communication centralized, consistent, and pleasant to use.

---

## Summary

CoreChatX gives a server:

- polished public chat
- Kyori Adventure MiniMessage formatting
- PlaceholderAPI-powered dynamic templates
- interactive keywords
- mentions and pings
- channels
- persistent nicknames and real-name lookup
- private messages
- moderation tools
- ChatItem previews
- rendered Discord ChatItem images and item inspection
- chat bubbles
- player settings
- locale support
- Discord and Telegram bridges with account linking, events, status, player lists, and console tools
- standalone Paper support
- Velocity network support

In short, CoreChatX is for servers that want communication to feel intentional.

If your chat setup needs several plugins, multiple bridge configs, and extra placeholder glue just to produce one consistent message, CoreChatX is built to make that experience simpler.
