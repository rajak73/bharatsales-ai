/**
 * BharatSales design tokens (Tailwind preset) — "Navy + Saffron" theme.
 *
 *   navy-900 #0B1F44   sidebar / dark surfaces / hero
 *   primary-600 #1B4FD8 primary actions, links, focus
 *   saffron-500 #FF8A1F accent CTA (one per view), 2nd chart series
 *   background #F4F6FB page · white cards · border #E3E8F2
 *
 * Consumed by apps/web via `presets: [require('@bharatsales/ui/tailwind.config')]`.
 * Every colour key that existed before (primary, saffron, background,
 * foreground, card, border) is kept so existing class names keep working.
 *
 * Neutrals: the default Tailwind `gray` scale is re-pointed at `slate`
 * values, so the ~1,100 existing `gray-*` classes in pages pick up the slate
 * neutral palette without a rename. Prefer the semantic tokens
 * (foreground-muted, surface-muted, border…) in new code.
 */

const slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

// Brand blue — primary actions, links, focus. 600 = #1B4FD8 (brand), 700 = hover.
const primary = {
  50: '#eff4ff',
  100: '#dfe8ff', // soft tint (selected rows, active pills)
  200: '#c2d3fe',
  300: '#97b4fb',
  400: '#5b8def',
  500: '#3366e6',
  600: '#1b4fd8',
  700: '#163fae',
  800: '#15358a',
  900: '#152f6e',
  950: '#0e1d45',
  DEFAULT: '#1b4fd8',
  foreground: '#ffffff',
};

// Navy — sidebar, dark surfaces, hero. DEFAULT/900 = #0B1F44, 800 = hover/active, 950 = deeper.
const navy = {
  50: '#f2f5fb',
  100: '#e1e8f4',
  200: '#c7d2e8', // sidebar text
  300: '#9aabcc', // sidebar section labels / muted on navy
  400: '#6f84ae',
  500: '#4b6394',
  600: '#2e4a80',
  700: '#1f3f78',
  800: '#16336b', // hover / active item on navy
  900: '#0b1f44',
  950: '#071530',
  DEFAULT: '#0b1f44',
  foreground: '#ffffff',
};

// Saffron accent — ONE main CTA / highlight per view. 500 = #FF8A1F (brand), 600 = hover.
// Text on a saffron fill is navy (white on #FF8A1F fails WCAG contrast).
// For saffron-coloured TEXT on white use 700+ (600 and lighter are too pale).
const saffron = {
  50: '#fff8f0',
  100: '#fff1e3', // soft tint
  200: '#ffddb8',
  300: '#ffc285',
  400: '#ffa552',
  500: '#ff8a1f',
  600: '#e9760c',
  700: '#c25e05',
  800: '#9a4a08',
  900: '#7a3c0b',
  950: '#431f05',
  DEFAULT: '#ff8a1f',
  foreground: '#0b1f44',
};

const success = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  DEFAULT: '#059669',
  foreground: '#ffffff',
};

const warning = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  DEFAULT: '#d97706',
  foreground: '#ffffff',
};

const danger = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  DEFAULT: '#dc2626',
  foreground: '#ffffff',
};

const info = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  DEFAULT: '#0284c7',
  foreground: '#ffffff',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        gray: slate,
        primary,
        navy,
        saffron,
        accent: saffron,
        success,
        warning,
        danger,
        info,
        background: '#f4f6fb', // page background
        foreground: {
          DEFAULT: '#0f172a', // headings, body copy
          muted: '#5b6478', // secondary copy (5.9:1 on white)
          subtle: '#667085', // captions/meta (4.9:1 on white, AA)
        },
        card: '#ffffff',
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f7f9fc', // table headers, inset panels
          subtle: '#eef2f8', // hover rows, inset areas
        },
        border: {
          DEFAULT: '#e3e8f2', // card and divider borders
          strong: '#cbd3e1', // input borders
        },
        ring: '#1b4fd8',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Noto Sans',
          'sans-serif',
        ],
        // Headings (h1–h3, PageHeader, card titles, KPI values).
        display: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Page titles use text-xl (mobile) / text-2xl via PageHeader.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xl: '0.75rem', // cards
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        // Named 'soft' (not 'card') because 'card' is also a colour key and shadow-card would clash.
        soft: '0 1px 2px 0 rgb(11 31 68 / 0.04), 0 1px 3px 0 rgb(11 31 68 / 0.03)',
        overlay: '0 12px 32px -8px rgb(15 23 42 / 0.18), 0 4px 8px -4px rgb(15 23 42 / 0.08)',
      },
      zIndex: {
        header: '30',
        sidebar: '40',
        overlay: '50',
        toast: '60',
        tooltip: '70',
      },
      maxWidth: {
        page: '90rem', // 1440px dashboard content width
      },
      keyframes: {
        'bs-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'bs-scale-in': {
          from: { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'bs-slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'bs-slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'bs-slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'bs-shimmer': { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'bs-fade-in 150ms ease-out',
        'scale-in': 'bs-scale-in 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'bs-slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'bs-slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'bs-slide-in-left 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
