import { CyberpunkTheme } from '@/lib/a2ui/types';

/**
 * Cyberpunk Theme Configuration for OpenMind AI
 * Neon colors, glow effects, and matrix-inspired styling
 */

export const openmindCyberpunkTheme: CyberpunkTheme = {
  primary: '#00ffff', // Electric Cyan
  secondary: '#ff00ff', // Neon Magenta
  accent: '#39ff14', // Neon Lime Green
  glow: '0 0 20px rgba(0, 255, 255, 0.5)',
  background: 'rgba(0, 0, 0, 0.95)',
  text: '#ffffff',
  fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace'
};

// Cyberpunk CSS Classes
export const cyberpunkClasses = {
  // Neon glow effects
  neonGlow: `
    text-cyan-400
    drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]
    animate-pulse
  `,
  neonPurple: `
    text-purple-400
    drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]
  `,
  neonMagenta: `
    text-pink-400
    drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]
  `,
  neonLime: `
    text-lime-400
    drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]
  `,
  neonOrange: `
    text-orange-400
    drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]
  `,

  // Background effects
  matrixBg: `
    bg-black/90
    backdrop-blur-sm
    border border-cyan-500/30
    shadow-[0_0_30px_rgba(34,211,238,0.2)]
  `,
  holographic: `
    bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20
    border border-purple-500/30
  `,
  scanline: `
    relative
    before:absolute before:inset-0 before:bg-gradient-to-b
    before:from-transparent before:via-cyan-500/10 before:to-transparent
    before:animate-pulse
  `,
  glitch: `
    relative
    before:absolute before:inset-0 before:bg-cyan-500/20
    before:animate-[glitch_0.3s_infinite]
    after:absolute after:inset-0 after:bg-purple-500/20
    after:animate-[glitch_0.3s_infinite_reverse]
  `,

  // Interactive effects
  hoverGlow: `
    transition-all duration-300
    hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]
    hover:border-cyan-400/60
    hover:scale-105
  `,
  clickPulse: `
    active:animate-ping
    active:scale-95
  `,

  // Text effects
  glitchText: `
    animate-pulse
    relative
    before:absolute before:inset-0 before:text-cyan-400 before:animate-[glitch_0.2s_infinite]
    before:opacity-80
  `,
  typeWriter: `
    animate-[typewriter_2s_steps(40)_1s_both]
    overflow-hidden
    whitespace-nowrap
    border-r-2 border-cyan-400
  `,

  // Layout effects
  floating: `
    animate-bounce
    hover:animate-none
  `,
  rotate: `
    animate-spin
    hover:animate-none
  `,
};

// Cyberpunk Avatar Configuration
export const cyberpunkAvatars = {
  primary: {
    src: '/images/cyberpunk/neon-cyberpunk-oracle.jpg',
    alt: 'Neon Cyberpunk Oracle - Primary Avatar',
    description: 'A humanoid figure with neon blue left eye, yellow right eye, surrounded by falling matrix code',
    className: 'w-16 h-16 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
  },
  background: {
    src: '/images/cyberpunk/matrix-face-bg.jpg',
    alt: 'Matrix Face Background',
    description: 'Classic matrix face with green falling code pattern',
    className: 'opacity-20 absolute inset-0 object-cover'
  }
};

// Cyberpunk Color Palette
export const cyberpunkColors = {
  // Primary colors
  cyan: '#00ffff',
  magenta: '#ff00ff',
  lime: '#39ff14',
  orange: '#ff6600',
  purple: '#9933ff',

  // Background variants
  dark: '#000000',
  matrix: '#001100',
  neon: '#0a0a0a',

  // Accent colors
  electric: '#00ffff',
  plasma: '#ff00ff',
  laser: '#39ff14',

  // UI element colors
  border: 'rgba(0, 255, 255, 0.3)',
  hover: 'rgba(0, 255, 255, 0.6)',
  active: 'rgba(255, 255, 255, 0.9)',
};

// Cyberpunk Typography
export const cyberpunkTypography = {
  fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
  headings: {
    h1: 'text-4xl font-bold tracking-wider text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]',
    h2: 'text-2xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    h3: 'text-xl font-semibold text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]',
  },
  body: {
    large: 'text-lg text-white',
    medium: 'text-base text-gray-200',
    small: 'text-sm text-gray-400',
  },
  special: {
    matrix: 'text-green-400 font-mono animate-pulse',
    neon: 'text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]',
    glitch: 'text-purple-300 animate-pulse',
  }
};

// Animation keyframes (to be added to globals.css)
export const cyberpunkAnimations = `
  @keyframes glitch {
    0%, 100% { transform: translateX(0); }
    10% { transform: translateX(-2px); }
    20% { transform: translateX(2px); }
    30% { transform: translateX(-1px); }
    40% { transform: translateX(1px); }
    50% { transform: translateX(-2px); }
    60% { transform: translateX(2px); }
    70% { transform: translateX(-1px); }
    80% { transform: translateX(1px); }
    90% { transform: translateX(-1px); }
  }

  @keyframes matrix-rain {
    0% { transform: translateY(-100vh); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }

  @keyframes neon-pulse {
    0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.5); }
    50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.6); }
  }

  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes hologram {
    0%, 100% { opacity: 1; transform: translateY(0); }
    50% { opacity: 0.7; transform: translateY(-2px); }
  }
`;