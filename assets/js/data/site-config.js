/*
 * CoreX website theme — product settings.
 * This is the first file to edit when reusing the theme for another CoreX plugin.
 * Keep credentials and private tokens OUT of this file: everything here is public.
 */
window.COREX_SITE = {
  schemaVersion: 1,
  brand: {
    family: 'CoreX',
    product: 'CoreChatX',
    author: 'IceWolf23X',
    familyLabel: 'A CoreX plugin',
    tagline: 'One suite, not ten plugins.',
    language: 'en',
    logo: 'assets/img/corechatx-logo.png',
    favicon: 'assets/img/corechatx-logo.png',
    description: 'CoreChatX brings Minecraft chat, private messages, channels, previews, moderation and community bridges into one communication suite for Paper and Velocity.'
  },

  links: {
    download: '#/releases',
    modrinth: 'https://modrinth.com/plugin/corechatx',
    github: 'https://github.com/IceWolf23X/CoreChatX-issues',
    issues: 'https://github.com/IceWolf23X/CoreChatX-issues/issues',
    official: 'https://wiki-corechatx.icewolf23x.dev/'
  },

  // Public releases attached to the WEBSITE repository, not to the private plugin.
  // No credentials belong here. Change these two fields when reusing the theme.
  releases: {
    provider: 'github',
    owner: 'IceWolf23X',
    repository: 'CoreChatX-WebSite-wip',
    cacheMinutes: 15,
    requestTimeoutMs: 10000,
    maxPages: 10, // 100 releases/page; refuses partial catalogs if this is exceeded.
    assetNames: {
      paper: ['papermc.jar', 'paper.jar', '*-paper-*.jar', '*-paper.jar'],
      velocity: ['velocity.jar', '*-velocity-*.jar', '*-velocity.jar']
    }
  },

  assets: {
    heroPreview: {
      /* Upload actual screenshots to assets/img/, then add their relative paths.
       * 0 valid images = placeholder; 1 = static image; 2+ = automatic gallery.
       * The commented paths below are examples, not bundled screenshot files. */
      images: [
        // { src: 'assets/img/chat-01.webp', alt: 'Public chat', caption: 'Public chat with mentions.' },
        // { src: 'assets/img/chat-02.webp', alt: 'Item preview', caption: 'Share a saved item preview.' }
      ],
      autoplay: true,
      intervalMs: 5000,       // Full-image dwell time. Minimum 1000 ms.
      transitionMs: 240,      // Fade duration; 0 makes manual changes instantaneous.
      pauseOnHover: true,
      objectFit: 'contain',   // 'contain' shows the whole image; 'cover' may crop it.
      /* Backwards-compatible single-image source, used only if images is empty. */
      src: '',
      alt: 'CoreChatX public chat running in Minecraft'
    }
  },

  theme: {
    default: 'light',
    storageKey: 'corex.theme',
    light: {
      accent: '#7442cf',
      accentHover: '#6333b7',
      accentSoft: '#f0eafb',
      accentLine: '#dacaf5',
      onAccent: '#ffffff',
      page: '#fcfcfb',
      surface: '#ffffff',
      surfaceAlt: '#f5f5f3',
      surfaceHover: '#eeedeb',
      ink: '#24232a',
      muted: '#65636f',
      quiet: '#726d7a',
      line: '#e7e5e9',
      lineStrong: '#d4d1da'
    },
    dark: {
      accent: '#b299f0',
      accentHover: '#c6b1f6',
      accentSoft: '#292333',
      accentLine: '#4a3b66',
      onAccent: '#1c142b',
      page: '#17171a',
      surface: '#1d1d21',
      surfaceAlt: '#232327',
      surfaceHover: '#2b2a30',
      ink: '#eeedf1',
      muted: '#aaa7b3',
      quiet: '#8c8797',
      line: '#313037',
      lineStrong: '#45424e'
    }
  }
};
