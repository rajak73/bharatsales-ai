/**
 * Raw colour values for libraries that can't take Tailwind classes
 * (recharts SVG props, leaflet markers). Keep in sync with the tokens in
 * packages/ui/tailwind.config.js — use these instead of hard-coding hex in pages.
 *
 * "Navy + Saffron" theme: series 1 = brand blue, series 2 = saffron,
 * then navy, light blue, light saffron.
 */
export const CHART_THEME = {
  series: '#1b4fd8', // primary-600 — single-series charts
  /** Second series / highlight bar (e.g. "target" vs "achieved"). */
  seriesAccent: '#ff8a1f', // saffron-500
  seriesMuted: '#c2d3fe', // primary-200
  navy: '#0b1f44', // navy-900
  grid: '#e3e8f2', // border
  axis: '#667085', // foreground-subtle
  cursor: '#eef2f8', // surface-subtle
  surface: '#ffffff',
  /** Categorical order: blue, saffron, navy, light blue, light saffron. */
  categorical: ['#1b4fd8', '#ff8a1f', '#0b1f44', '#5b8def', '#ffc285'],
  /** Status marker fills (500 shades). */
  success: '#10b981',
  primary: '#3366e6', // primary-500
  accent: '#ff8a1f', // saffron-500
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#94a3b8', // slate-400
} as const;

/** recharts <XAxis/YAxis tick={…}> */
export const CHART_AXIS_TICK = { fontSize: 11, fill: CHART_THEME.axis };

/** recharts <Tooltip contentStyle={…}> matching the overlay card style. */
export const CHART_TOOLTIP_STYLE = {
  borderRadius: 8,
  border: `1px solid ${CHART_THEME.grid}`,
  boxShadow: '0 8px 24px -8px rgba(11,31,68,0.18)',
  fontSize: 12,
  padding: '6px 10px',
};
