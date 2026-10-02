/*
 * CoreX website theme — landing page content.
 * Reorder sections with `order`, replace text, links and icons here; no HTML edit is required.
 * Icons refer to SVG symbol ids declared by the theme shell (for example `message` -> #i-message).
 */
window.COREX_LANDING = {
  order: ['hero', 'compatibility', 'features', 'setup', 'bridges', 'docsPromo', 'faq', 'finalCta'],

  header: {
    nav: [
      { label: 'Features', href: '#/features', nav: 'features' },
      { label: 'Setup', href: '#/setup', nav: 'setup' },
      { label: 'Documentation', href: '#/docs/overview', nav: 'docs', docsLink: true },
      { label: 'FAQ', href: '#/faq', nav: 'faq' },
      { label: 'Releases', href: '#/releases', nav: 'releases' }
    ]
  },

  hero: {
    eyebrow: 'Made for Minecraft communities',
    title: [
      { text: 'One suite,' },
      { text: 'not ten plugins.', accent: true }
    ],
    description: 'Your conversations, connected. Bring chat, player controls and community bridges together — without the plugin juggling.',
    actions: [
      { label: 'Get CoreChatX', linkKey: 'download', icon: 'arrow', style: 'primary' },
      { label: 'Explore the docs', href: '#/docs/overview', icon: 'book', docsLink: true }
    ],
    platforms: ['Standalone Paper', 'Velocity networks'],
    preview: {
      assetKey: 'heroPreview',
      ariaLabel: 'In-game chat preview',
      topLeft: 'CORECHATX / IN-GAME',
      placeholderLabel: 'SCREENSHOT PLACEHOLDER',
      placeholderTitle: 'A space for your server.',
      placeholderText: 'Your in-game chat screenshot belongs here.',
      dimensions: 'IN-GAME CAPTURE / 01',
      captionLeft: 'Chat, the way you make it.',
      captionRight: 'Paper + Velocity',
      tag: 'One connected experience.'
    }
  },

  compatibility: {
    labelLines: ['BUILT TO WORK', 'WITH YOUR SETUP'],
    items: [
      { label: 'Paper', icon: 'server' },
      { label: 'Velocity', icon: 'network' },
      { label: 'Adventure', icon: 'code' },
      { label: 'YAML / MySQL', icon: 'database' },
      { label: 'Discord', icon: 'discord' },
      { label: 'Telegram', icon: 'send' }
    ]
  },

  features: {
    id: 'features',
    number: '01 /',
    eyebrow: 'The communication suite',
    title: ['Separate features.', 'One shared language.'],
    description: 'Not just more features. Features that understand each other — your channels, permissions, player preferences and network.',
    cards: [
      {
        icon: 'message',
        title: 'A conversation, not a config stack.',
        text: 'Public chat, private messages, replies and channels. One connected layer, from a local world to your whole network.',
        link: { label: 'Explore communication', href: '#/docs/overview/polished-public-chat' }
      },
      {
        icon: 'cursor',
        title: 'More than plain text.',
        text: 'Rich formatting, mentions, custom pings and clickable keywords. Make every interaction feel like part of your server.',
        link: { label: 'Explore rich interactions', href: '#/docs/overview/interactive-keywords' }
      },
      {
        icon: 'box',
        title: 'Show it. Don’t describe it.',
        text: 'Clickable item, shulker, armor and inventory snapshots — in Minecraft, across backends and as rendered Discord previews.',
        link: { label: 'Explore ChatItems', href: '#/docs/overview/chat-item-previews' }
      },
      {
        icon: 'shield',
        title: 'Control without the overlap.',
        text: 'Mutes, anti-repeat, anti-caps and word filtering. Moderation that already understands your channels and private messages.',
        link: { label: 'Explore moderation', href: '#/docs/overview/moderation-tools' }
      },
      {
        icon: 'sliders',
        title: 'Let players make it theirs.',
        text: 'Persistent nicknames, privacy controls, hidden channels, locales and notification preferences. All in one settings flow.',
        link: { label: 'Explore player controls', href: '#/docs/overview/player-controls' }
      },
      {
        icon: 'message',
        title: 'Bring the chat into the world.',
        text: 'Optional overhead chat bubbles with channel rules, player toggles, distance limits and automatic cleanup.',
        link: { label: 'Explore chat bubbles', href: '#/docs/overview/chat-bubbles' }
      }
    ],
    bottom: {
      strong: 'One place for the whole experience.',
      text: 'Formatting, privacy, previews, bridges and more.',
      link: { label: 'See the complete overview', href: '#/docs/overview' }
    }
  },

  setup: {
    id: 'setup',
    number: '02 /',
    eyebrow: 'Your server. Your scale.',
    title: ['One world or a whole network.', 'The same conversation.'],
    tabAriaLabel: 'Choose a deployment',
    modes: [
      {
        id: 'standalone',
        tabLabel: 'Standalone',
        tabIcon: 'server',
        title: 'Everything starts with Paper.',
        text: 'Run the communication suite on a single server. Keep configuration and runtime data in one place, with YAML by default and MySQL when you choose it.',
        steps: [
          'Install the Paper JAR on your server.',
          'Start once to generate the configuration.',
          'Choose your channels, formats and features.'
        ],
        link: { label: 'Follow the standalone guide', href: '#/docs/instructions/quick-install-patterns~standalone-paper' },
        topology: {
          labelLeft: 'DEPLOYMENT / STANDALONE',
          labelRight: '01 SERVER',
          nodes: [
            { icon: 'users', label: 'Your players' },
            { icon: 'server', label: 'Paper', small: 'CoreChatX Paper', primary: true },
            { icon: 'database', label: 'YAML / MySQL' }
          ],
          note: 'Paper owns configuration and runtime state. No proxy module is required.'
        }
      },
      {
        id: 'network',
        tabLabel: 'Velocity network',
        tabIcon: 'network',
        title: 'Different servers. Shared context.',
        text: 'Let network channels, private messages and player settings follow the same community. Velocity owns the shared state, isolated by your configured network groups.',
        steps: [
          'Install the Paper JAR on every backend.',
          'Install the Velocity JAR on your proxy.',
          'Match group channels and assign unique server IDs.'
        ],
        link: { label: 'Follow the network guide', href: '#/docs/instructions/quick-install-patterns~velocity-network' },
        topology: {
          labelLeft: 'DEPLOYMENT / PROXY',
          labelRight: 'GROUP-AWARE',
          nodes: [
            { icon: 'network', label: 'Velocity', small: 'Shared authority', primary: true },
            { group: [
              { icon: 'server', label: 'Lobby' },
              { icon: 'server', label: 'Survival' }
            ] },
            { icon: 'users', label: 'Your players' }
          ],
          note: 'Discord is proxy-owned. Telegram and chat bubbles remain on Paper backends.'
        }
      }
    ]
  },

  bridges: {
    number: '03 /',
    eyebrow: 'Beyond the game',
    title: ['Let the conversation', 'travel with your community.'],
    description: 'Bring selected channels into Discord or Telegram — and messages back into Minecraft. Routing follows your chat rules, not a second disconnected system.',
    disclosure: 'Bridges are optional. When enabled, selected messages and display information are shared with the services you configure.',
    cards: [
      {
        icon: 'discord', title: 'Discord',
        text: 'Two-way chat, account linking, optional role gates, event messages and rendered item previews.',
        link: { label: 'Discord reference', href: '#/docs/paper/discord-yml' }
      },
      {
        icon: 'send', title: 'Telegram',
        text: 'Two-way chat with per-channel targets, forum topic routing and Bot API long polling.',
        link: { label: 'Telegram reference', href: '#/docs/paper/telegram-yml' }
      }
    ]
  },

  docsPromo: {
    eyebrow: 'Everything, documented.',
    title: ['Understand the features.', 'Then make them yours.'],
    description: 'A full feature overview and a detailed configuration reference. From the first install to the last setting.',
    cards: [
      {
        icon: 'layers', title: 'Overview', href: '#/docs/overview',
        text: 'What each feature does, how it fits and where it can take your chat.'
      },
      {
        icon: 'code', title: 'Instructions', href: '#/docs/instructions',
        text: 'Files, defaults, permissions, operational notes and troubleshooting.'
      }
    ]
  },

  faq: {
    id: 'faq',
    number: '04 /',
    eyebrow: 'Good questions',
    title: 'Before you install.',
    description: 'The essentials, without a wall of configuration.',
    introLink: { label: 'Start with the requirements', href: '#/docs/instructions/before-you-configure' },
    items: [
      {
        question: 'Do I need a Velocity proxy?',
        answer: 'No. A standalone Paper server only needs the Paper JAR. Add the Velocity JAR on your proxy and the Paper JAR on every backend when you need cross-server routing and shared player state.',
        link: { label: 'Read the reference', href: '#/docs/instructions/quick-install-patterns' }
      },
      {
        question: 'Is MySQL required?',
        answer: 'No. YAML is the default. MySQL is an explicit option for standalone Paper or Velocity-owned groups. Existing data must be moved through the documented migration workflow; changing the backend setting alone is not a migration.',
        link: { label: 'Read the reference', href: '#/docs/paper/storage-yml' }
      },
      {
        question: 'Can I choose which features and bridges to use?',
        answer: 'Yes. Configuration includes feature switches, per-channel permissions and routing rules. Discord and Telegram bridges are optional and only run when enabled and configured. A Discord console-only bot has its own controls.',
        link: { label: 'Read the reference', href: '#/docs/paper/config-yml' }
      },
      {
        question: 'Will player preferences follow server switches?',
        answer: 'In proxy mode, Velocity owns shared player preferences, nicknames, hidden channels, ignore lists and moderation state within each configured group. Destination backends still apply their own permissions.',
        link: { label: 'Read the reference', href: '#/docs/overview/velocity-network-support' }
      },
      {
        question: 'Do configuration changes need a restart?',
        answer: 'Most Paper wording, formatting and feature settings can be applied with /corechatx reload. Deployment identity, storage identity and advancement endpoint settings need a restart. Every Velocity configuration change requires a proxy restart.',
        link: { label: 'Read the reference', href: '#/docs/instructions/reload-vs-restart' }
      }
    ]
  },

  finalCta: {
    title: ['Less plugin juggling.', 'More community.'],
    description: 'Start with the right JAR. Build the chat experience that fits your server.',
    actions: [
      { label: 'Get CoreChatX', linkKey: 'download', icon: 'arrow', style: 'primary' },
      { label: 'Read the setup guide', href: '#/docs/instructions' }
    ]
  },

  footer: {
    caption: 'One suite, not ten plugins.',
    nav: [
      { label: 'Overview', href: '#/docs/overview' },
      { label: 'Instructions', href: '#/docs/instructions' },
      { label: 'GitHub', linkKey: 'github', external: true },
      { label: 'Releases', linkKey: 'download' },
      { label: 'Modrinth', linkKey: 'modrinth', external: true }
    ],
    copyright: '© 2026 CoreChatX · A CoreX plugin by IceWolf23X.',
    sourceLink: { label: 'Documentation sources & scope', href: '#/docs/reference/source-notes' }
  }
};
