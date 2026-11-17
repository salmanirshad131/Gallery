/**
 * Apple Design System & Liquid Glass Helpers
 * Strictly adhering to Apple HIG, WWDC Fluid Interface principles, and macOS Tahoe / iOS 26.
 */

export const APPLE_SPRING = {
  type: 'spring' as const,
  stiffness: 480,
  damping: 30,
  mass: 0.8,
};

export const APPLE_SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 28,
  mass: 1,
};

export const APPLE_SPRING_BOUNCE = {
  type: 'spring' as const,
  stiffness: 550,
  damping: 22,
  mass: 0.6,
};

export const APPLE_COLORS = {
  blue: '#0071e3',
  blueDark: '#0a84ff',
  heart: '#ff2d55',
  heartDark: '#ff375f',
  yellow: '#ffcc00',
  orange: '#ff9500',
  purple: '#af52de',
  green: '#34c759',
  teal: '#30b0c7',
};

export const APPLE_GLASS_CLASSES = {
  sidebar:
    'bg-[#f6f6f8]/85 dark:bg-[#151517]/80 backdrop-blur-2xl border-r border-black/[0.06] dark:border-white/[0.08]',
  toolbar:
    'bg-[#ffffff]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-b border-black/[0.07] dark:border-white/[0.09]',
  pill:
    'bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md transition-colors apple-press',
  pillActive:
    'bg-white dark:bg-[#323236] text-[#0071e3] dark:text-[#0a84ff] shadow-sm border border-black/[0.06] dark:border-white/[0.12]',
  card:
    'bg-[#ffffff] dark:bg-[#1e1e20] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] border border-black/[0.05] dark:border-white/[0.06]',
  modal:
    'bg-[#ffffff]/92 dark:bg-[#1c1c1f]/92 backdrop-blur-3xl shadow-[0_24px_64px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/[0.12]',
  badge:
    'bg-black/55 dark:bg-black/65 text-white backdrop-blur-md border border-white/20 shadow-xs',
};
