/* Documentation catalog: titles, categories, order and per-page HTML paths. */
window.COREX_DOCS = {
  "schemaVersion": 2,
  "meta": {
    "product": "CoreChatX",
    "articleCount": 67,
    "editingModel": "Article HTML is maintained in assets/content/docs/. This file contains the catalog; tools/build-docs-bundle.mjs assembles the offline bodies."
  },
  "groups": [
    {
      "id": "overview",
      "label": "Feature overview",
      "icon": "layers"
    },
    {
      "id": "getting-started",
      "label": "Getting started",
      "icon": "compass"
    },
    {
      "id": "paper",
      "label": "Paper configuration",
      "icon": "server"
    },
    {
      "id": "velocity",
      "label": "Velocity configuration",
      "icon": "network"
    },
    {
      "id": "runtime",
      "label": "Runtime data",
      "icon": "database"
    },
    {
      "id": "reference",
      "label": "Reference & operations",
      "icon": "book"
    }
  ],
  "hubs": {
    "overviewCategories": [
      {
        "id": "start-here",
        "title": "Start here",
        "articles": [
          "introduction",
          "why-corechatx",
          "current-state",
          "one-suite-not-ten-plugins"
        ]
      },
      {
        "id": "chat-interactions",
        "title": "Chat & rich interactions",
        "articles": [
          "polished-public-chat",
          "channels",
          "private-messages",
          "mentions-and-pings",
          "kyori-adventure-and-minimessage",
          "placeholderapi-powered-interactions",
          "interactive-keywords",
          "chat-item-previews",
          "chat-bubbles"
        ]
      },
      {
        "id": "player-experience",
        "title": "Player experience & control",
        "articles": [
          "persistent-nicknames",
          "player-controls",
          "locale-support",
          "moderation-tools"
        ]
      },
      {
        "id": "connected-communities",
        "title": "Connected communities",
        "articles": [
          "discord-and-telegram-bridges",
          "velocity-network-support"
        ]
      },
      {
        "id": "operations-project",
        "title": "Operations & project",
        "articles": [
          "commands",
          "admin-experience",
          "verified",
          "future-direction",
          "summary"
        ]
      }
    ]
  },
  "articles": [
    {
      "id": "overview/introduction",
      "group": "overview",
      "title": "Introduction",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "file",
      "bodyFile": "assets/content/docs/overview/introduction.html"
    },
    {
      "id": "overview/why-corechatx",
      "group": "overview",
      "title": "Why CoreChatX",
      "description": "One communication experience instead of overlapping plugins.",
      "icon": "file",
      "bodyFile": "assets/content/docs/overview/why-corechatx.html"
    },
    {
      "id": "overview/current-state",
      "group": "overview",
      "title": "Current State",
      "description": "Platforms, storage, integrations and the scope of this reference.",
      "icon": "file",
      "bodyFile": "assets/content/docs/overview/current-state.html"
    },
    {
      "id": "overview/one-suite-not-ten-plugins",
      "group": "overview",
      "title": "One Suite, Not Ten Plugins",
      "description": "How chat, privacy, previews and bridges work together.",
      "icon": "file",
      "bodyFile": "assets/content/docs/overview/one-suite-not-ten-plugins.html"
    },
    {
      "id": "overview/polished-public-chat",
      "group": "overview",
      "title": "Polished Public Chat",
      "description": "Formats, ranks, connection messages and safe player input.",
      "icon": "message",
      "bodyFile": "assets/content/docs/overview/polished-public-chat.html"
    },
    {
      "id": "overview/kyori-adventure-and-minimessage",
      "group": "overview",
      "title": "Kyori Adventure And MiniMessage",
      "description": "Rich text, hover content and clickable interactions.",
      "icon": "code",
      "bodyFile": "assets/content/docs/overview/kyori-adventure-and-minimessage.html"
    },
    {
      "id": "overview/placeholderapi-powered-interactions",
      "group": "overview",
      "title": "PlaceholderAPI-Powered Interactions",
      "description": "Dynamic values inside trusted server templates.",
      "icon": "code",
      "bodyFile": "assets/content/docs/overview/placeholderapi-powered-interactions.html"
    },
    {
      "id": "overview/persistent-nicknames",
      "group": "overview",
      "title": "Persistent Nicknames",
      "description": "Persistent display names without losing real player identity.",
      "icon": "user",
      "bodyFile": "assets/content/docs/overview/persistent-nicknames.html"
    },
    {
      "id": "overview/interactive-keywords",
      "group": "overview",
      "title": "Interactive Keywords",
      "description": "Turn simple tokens into reusable, clickable chat elements.",
      "icon": "cursor",
      "bodyFile": "assets/content/docs/overview/interactive-keywords.html"
    },
    {
      "id": "overview/mentions-and-pings",
      "group": "overview",
      "title": "Mentions And Pings",
      "description": "Player mentions, custom triggers and notification controls.",
      "icon": "bell",
      "bodyFile": "assets/content/docs/overview/mentions-and-pings.html"
    },
    {
      "id": "overview/channels",
      "group": "overview",
      "title": "Channels",
      "description": "Permissions, delivery scopes, routing and personal visibility.",
      "icon": "hash",
      "bodyFile": "assets/content/docs/overview/channels.html"
    },
    {
      "id": "overview/private-messages",
      "group": "overview",
      "title": "Private Messages",
      "description": "Direct messages, replies, social spy and cross-server delivery.",
      "icon": "mail",
      "bodyFile": "assets/content/docs/overview/private-messages.html"
    },
    {
      "id": "overview/moderation-tools",
      "group": "overview",
      "title": "Moderation Tools",
      "description": "Mutes, filters, anti-repeat, anti-caps and staff bypasses.",
      "icon": "shield",
      "bodyFile": "assets/content/docs/overview/moderation-tools.html"
    },
    {
      "id": "overview/chat-item-previews",
      "group": "overview",
      "title": "Chat Item Previews",
      "description": "Share item and inventory snapshots in Minecraft and Discord.",
      "icon": "box",
      "bodyFile": "assets/content/docs/overview/chat-item-previews.html"
    },
    {
      "id": "overview/chat-bubbles",
      "group": "overview",
      "title": "Chat Bubbles",
      "description": "Local overhead messages with player, world and channel controls.",
      "icon": "message",
      "bodyFile": "assets/content/docs/overview/chat-bubbles.html"
    },
    {
      "id": "overview/player-controls",
      "group": "overview",
      "title": "Player Controls",
      "description": "Personal communication preferences that follow the player.",
      "icon": "sliders",
      "bodyFile": "assets/content/docs/overview/player-controls.html"
    },
    {
      "id": "overview/locale-support",
      "group": "overview",
      "title": "Locale Support",
      "description": "Per-player locale selection with layered message fallbacks.",
      "icon": "globe",
      "bodyFile": "assets/content/docs/overview/locale-support.html"
    },
    {
      "id": "overview/discord-and-telegram-bridges",
      "group": "overview",
      "title": "Discord And Telegram Bridges",
      "description": "Optional two-way bridges, linking, events and routing.",
      "icon": "bridge",
      "bodyFile": "assets/content/docs/overview/discord-and-telegram-bridges.html"
    },
    {
      "id": "overview/velocity-network-support",
      "group": "overview",
      "title": "Velocity Network Support",
      "description": "Group-aware communication and proxy-owned shared state.",
      "icon": "network",
      "bodyFile": "assets/content/docs/overview/velocity-network-support.html"
    },
    {
      "id": "overview/commands",
      "group": "overview",
      "title": "Commands",
      "description": "The player and administrator command surface at a glance.",
      "icon": "terminal",
      "bodyFile": "assets/content/docs/overview/commands.html"
    },
    {
      "id": "overview/admin-experience",
      "group": "overview",
      "title": "Admin Experience",
      "description": "Validation, lifecycle, storage and maintenance behavior.",
      "icon": "file",
      "bodyFile": "assets/content/docs/overview/admin-experience.html"
    },
    {
      "id": "overview/verified",
      "group": "overview",
      "title": "Verified",
      "description": "Recorded tests, laboratory scope and explicit validation limits.",
      "icon": "check",
      "bodyFile": "assets/content/docs/overview/verified.html"
    },
    {
      "id": "overview/future-direction",
      "group": "overview",
      "title": "Future Direction",
      "description": "Planned directions, not currently promised functionality.",
      "icon": "arrow",
      "bodyFile": "assets/content/docs/overview/future-direction.html"
    },
    {
      "id": "overview/summary",
      "group": "overview",
      "title": "Summary",
      "description": "A complete recap of the supplied feature overview.",
      "icon": "file",
      "bodyFile": "assets/content/docs/overview/summary.html"
    },
    {
      "id": "instructions/introduction",
      "group": "getting-started",
      "title": "About this reference",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "file",
      "bodyFile": "assets/content/docs/instructions/introduction.html"
    },
    {
      "id": "instructions/before-you-configure",
      "group": "getting-started",
      "title": "Before You Configure",
      "description": "Requirements, terminology and the runtime ownership model.",
      "icon": "file",
      "bodyFile": "assets/content/docs/instructions/before-you-configure.html"
    },
    {
      "id": "instructions/layout-overview",
      "group": "getting-started",
      "title": "Layout Overview",
      "description": "Generated configuration files and runtime directories.",
      "icon": "file",
      "bodyFile": "assets/content/docs/instructions/layout-overview.html"
    },
    {
      "id": "instructions/reload-vs-restart",
      "group": "getting-started",
      "title": "Reload vs Restart",
      "description": "Exactly which changes can be reloaded and which need a restart.",
      "icon": "file",
      "bodyFile": "assets/content/docs/instructions/reload-vs-restart.html"
    },
    {
      "id": "instructions/quick-install-patterns",
      "group": "getting-started",
      "title": "Quick Install Patterns",
      "description": "Standalone Paper and Velocity network installation checklists.",
      "icon": "file",
      "bodyFile": "assets/content/docs/instructions/quick-install-patterns.html"
    },
    {
      "id": "paper/files",
      "group": "paper",
      "title": "Paper Backend Files",
      "description": "Every documented Paper configuration file in one place.",
      "icon": "file",
      "bodyFile": "assets/content/docs/paper/files.html"
    },
    {
      "id": "paper/config-yml",
      "group": "paper",
      "title": "config.yml",
      "description": "Deployment identity, integrations, announcements and runtime gates.",
      "icon": "file",
      "configFile": {
        "type": "config-file",
        "id": "paper/config.yml"
      },
      "bodyFile": "assets/content/docs/paper/config-yml.html"
    },
    {
      "id": "paper/chat-yml",
      "group": "paper",
      "title": "chat.yml",
      "description": "Public formats, mention rendering and message cooldowns.",
      "icon": "file",
      "configFile": {
        "type": "config-file",
        "id": "paper/chat.yml"
      },
      "bodyFile": "assets/content/docs/paper/chat-yml.html"
    },
    {
      "id": "paper/messages-yml",
      "group": "paper",
      "title": "messages.yml",
      "description": "Player-facing text, command feedback and message templates.",
      "icon": "file",
      "configFile": {
        "type": "config-file",
        "id": "paper/messages.yml"
      },
      "bodyFile": "assets/content/docs/paper/messages-yml.html"
    },
    {
      "id": "paper/channels-yml",
      "group": "paper",
      "title": "channels.yml",
      "description": "Channel scopes, permissions, visibility and bridge behavior.",
      "icon": "hash",
      "configFile": {
        "type": "config-file",
        "id": "paper/channels.yml"
      },
      "bodyFile": "assets/content/docs/paper/channels-yml.html"
    },
    {
      "id": "paper/pings-yml",
      "group": "paper",
      "title": "pings.yml",
      "description": "Mention notifications, custom ping triggers and permission rules.",
      "icon": "bell",
      "configFile": {
        "type": "config-file",
        "id": "paper/pings.yml"
      },
      "bodyFile": "assets/content/docs/paper/pings-yml.html"
    },
    {
      "id": "paper/privacy-yml",
      "group": "paper",
      "title": "privacy.yml",
      "description": "Private messages, ignore modes and staff bypass behavior.",
      "icon": "lock",
      "configFile": {
        "type": "config-file",
        "id": "paper/privacy.yml"
      },
      "bodyFile": "assets/content/docs/paper/privacy-yml.html"
    },
    {
      "id": "paper/moderation-yml",
      "group": "paper",
      "title": "moderation.yml",
      "description": "Mute behavior, global chat mute, anti-repeat and anti-caps.",
      "icon": "shield",
      "configFile": {
        "type": "config-file",
        "id": "paper/moderation.yml"
      },
      "bodyFile": "assets/content/docs/paper/moderation-yml.html"
    },
    {
      "id": "paper/filter-yml",
      "group": "paper",
      "title": "filter.yml",
      "description": "Word filtering, replacement characters and optional hover text.",
      "icon": "shield",
      "configFile": {
        "type": "config-file",
        "id": "paper/filter.yml"
      },
      "bodyFile": "assets/content/docs/paper/filter-yml.html"
    },
    {
      "id": "paper/chatitems-yml",
      "group": "paper",
      "title": "chatitems.yml",
      "description": "Tokens, snapshots, Discord images and network safety limits.",
      "icon": "box",
      "configFile": {
        "type": "config-file",
        "id": "paper/chatitems.yml"
      },
      "bodyFile": "assets/content/docs/paper/chatitems-yml.html"
    },
    {
      "id": "paper/keywords-yml",
      "group": "paper",
      "title": "keywords.yml",
      "description": "Reusable interactive tokens with permissions and placeholders.",
      "icon": "cursor",
      "configFile": {
        "type": "config-file",
        "id": "paper/keywords.yml"
      },
      "bodyFile": "assets/content/docs/paper/keywords-yml.html"
    },
    {
      "id": "paper/chatbubbles-yml",
      "group": "paper",
      "title": "chatbubbles.yml",
      "description": "Overhead messages, TextDisplay appearance and cleanup.",
      "icon": "message",
      "configFile": {
        "type": "config-file",
        "id": "paper/chatbubbles.yml"
      },
      "bodyFile": "assets/content/docs/paper/chatbubbles-yml.html"
    },
    {
      "id": "paper/discord-yml",
      "group": "paper",
      "title": "discord.yml",
      "description": "Standalone Discord bridge, linking, events and console tools.",
      "icon": "bridge",
      "configFile": {
        "type": "config-file",
        "id": "paper/discord.yml"
      },
      "bodyFile": "assets/content/docs/paper/discord-yml.html"
    },
    {
      "id": "paper/telegram-yml",
      "group": "paper",
      "title": "telegram.yml",
      "description": "Bot API routing, forum topics and long-polling settings.",
      "icon": "send",
      "configFile": {
        "type": "config-file",
        "id": "paper/telegram.yml"
      },
      "bodyFile": "assets/content/docs/paper/telegram-yml.html"
    },
    {
      "id": "paper/storage-yml",
      "group": "paper",
      "title": "storage.yml",
      "description": "YAML/MySQL authority, safe migrations, backups and rollback.",
      "icon": "database",
      "configFile": {
        "type": "config-file",
        "id": "paper/storage.yml"
      },
      "bodyFile": "assets/content/docs/paper/storage-yml.html"
    },
    {
      "id": "paper/locales-en-us-yml",
      "group": "paper",
      "title": "locales/en_us.yml",
      "description": "Locale override layers and message fallback resolution.",
      "icon": "globe",
      "configFile": {
        "type": "config-file",
        "id": "paper/locales/en_us.yml"
      },
      "bodyFile": "assets/content/docs/paper/locales-en-us-yml.html"
    },
    {
      "id": "runtime/files",
      "group": "runtime",
      "title": "Paper Runtime Data Files",
      "description": "Live player and plugin state: ownership and preservation.",
      "icon": "database",
      "bodyFile": "assets/content/docs/runtime/files.html"
    },
    {
      "id": "runtime/playerdata-yml",
      "group": "runtime",
      "title": "playerdata.yml",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "sliders",
      "bodyFile": "assets/content/docs/runtime/playerdata-yml.html"
    },
    {
      "id": "runtime/state-yml",
      "group": "runtime",
      "title": "state.yml",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "file",
      "bodyFile": "assets/content/docs/runtime/state-yml.html"
    },
    {
      "id": "runtime/channeldata-yml",
      "group": "runtime",
      "title": "channeldata.yml",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "hash",
      "bodyFile": "assets/content/docs/runtime/channeldata-yml.html"
    },
    {
      "id": "runtime/ignoredata-yml",
      "group": "runtime",
      "title": "ignoredata.yml",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "file",
      "bodyFile": "assets/content/docs/runtime/ignoredata-yml.html"
    },
    {
      "id": "runtime/mutedata-yml",
      "group": "runtime",
      "title": "mutedata.yml",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "file",
      "bodyFile": "assets/content/docs/runtime/mutedata-yml.html"
    },
    {
      "id": "runtime/discordlinks-yml",
      "group": "runtime",
      "title": "discordlinks.yml",
      "description": "Complete documentation reference, configuration details and operational notes.",
      "icon": "bridge",
      "bodyFile": "assets/content/docs/runtime/discordlinks-yml.html"
    },
    {
      "id": "velocity/introduction",
      "group": "velocity",
      "title": "Velocity Proxy",
      "description": "Proxy configuration and shared runtime authority.",
      "icon": "network",
      "bodyFile": "assets/content/docs/velocity/introduction.html"
    },
    {
      "id": "velocity/velocity-config-properties",
      "group": "velocity",
      "title": "velocity-config.properties",
      "description": "Isolated network groups, backend pins and player directory.",
      "icon": "network",
      "configFile": {
        "type": "config-file",
        "id": "velocity/velocity-config.properties"
      },
      "bodyFile": "assets/content/docs/velocity/velocity-config-properties.html"
    },
    {
      "id": "velocity/velocity-storage-yml",
      "group": "velocity",
      "title": "velocity-storage.yml",
      "description": "Proxy-owned storage and one shared MySQL pool.",
      "icon": "database",
      "configFile": {
        "type": "config-file",
        "id": "velocity/velocity-storage.yml"
      },
      "bodyFile": "assets/content/docs/velocity/velocity-storage-yml.html"
    },
    {
      "id": "velocity/velocity-messages-yml",
      "group": "velocity",
      "title": "velocity-messages.yml",
      "description": "Group-level connection announcements and nicknames.",
      "icon": "network",
      "configFile": {
        "type": "config-file",
        "id": "velocity/velocity-messages.yml"
      },
      "bodyFile": "assets/content/docs/velocity/velocity-messages-yml.html"
    },
    {
      "id": "velocity/velocity-discord-yml",
      "group": "velocity",
      "title": "velocity-discord.yml",
      "description": "Proxy-owned Discord routing, linking and login gates.",
      "icon": "bridge",
      "configFile": {
        "type": "config-file",
        "id": "velocity/velocity-discord.yml"
      },
      "bodyFile": "assets/content/docs/velocity/velocity-discord-yml.html"
    },
    {
      "id": "velocity/velocity-advancements-properties",
      "group": "velocity",
      "title": "velocity-advancements.properties",
      "description": "Optional advancement endpoint and backend credentials.",
      "icon": "network",
      "configFile": {
        "type": "config-file",
        "id": "generated/velocity-advancements.properties"
      },
      "bodyFile": "assets/content/docs/velocity/velocity-advancements-properties.html"
    },
    {
      "id": "reference/regenerating-a-clean-config-set",
      "group": "reference",
      "title": "Regenerating a Clean Config Set",
      "description": "Reset configuration safely without deleting live player data.",
      "icon": "file",
      "bodyFile": "assets/content/docs/reference/regenerating-a-clean-config-set.html"
    },
    {
      "id": "reference/command-reference",
      "group": "reference",
      "title": "Command Reference",
      "description": "Exact command syntax, permissions, defaults and behavior.",
      "icon": "terminal",
      "bodyFile": "assets/content/docs/reference/command-reference.html"
    },
    {
      "id": "reference/permission-reference",
      "group": "reference",
      "title": "Permission Reference",
      "description": "Fixed and configurable permissions, colors and nickname styles.",
      "icon": "key",
      "bodyFile": "assets/content/docs/reference/permission-reference.html"
    },
    {
      "id": "reference/practical-admin-notes",
      "group": "reference",
      "title": "Practical Admin Notes",
      "description": "Operational guidance, privacy and safe administration.",
      "icon": "file",
      "bodyFile": "assets/content/docs/reference/practical-admin-notes.html"
    },
    {
      "id": "reference/troubleshooting-quick-reference",
      "group": "reference",
      "title": "Troubleshooting Quick Reference",
      "description": "Checks for startup, networking, bridges, previews and storage.",
      "icon": "help",
      "bodyFile": "assets/content/docs/reference/troubleshooting-quick-reference.html"
    },
    {
      "id": "reference/production-validation-checklist",
      "group": "reference",
      "title": "Production Validation Checklist",
      "description": "A pre-opening checklist for your own server installation.",
      "icon": "file",
      "bodyFile": "assets/content/docs/reference/production-validation-checklist.html"
    },
    {
      "id": "reference/related-documents",
      "group": "reference",
      "title": "Related Documents",
      "description": "Feature overview, configuration reference and related resources.",
      "icon": "file",
      "bodyFile": "assets/content/docs/reference/related-documents.html"
    },
    {
      "id": "reference/per-player-channel-persistence",
      "group": "reference",
      "title": "Per-player channel persistence",
      "description": "Persistent and session-only channel preferences and upgrades.",
      "icon": "hash",
      "bodyFile": "assets/content/docs/reference/per-player-channel-persistence.html"
    },
    {
      "id": "reference/source-notes",
      "group": "reference",
      "title": "Documentation scope",
      "description": "Wiki content, configuration snapshots, release boundaries and public references.",
      "icon": "book",
      "bodyFile": "assets/content/docs/reference/source-notes.html"
    }
  ]
};
