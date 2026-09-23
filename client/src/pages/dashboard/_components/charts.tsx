/**
 * Recharts-based chart for the dashboard pages (home + sales). Kept in its own
 * module so it can be lazy-loaded: recharts is ~100 KB gzipped and most role
 * dashboards don't need it.
 * One series colour (primary-600), recessive grid/axes, ₹ ticks in compact
 * Indian units, and a visually-hidden data table so the chart is never the
 * only way to read the numbers.
 */
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { CHART_THEME, EmptyState } from '@bharatsales/ui';
import { BarChart3 } from 'lucide-react';
import { fmt, type SeriesPoint, type ValueFormat } from './widgets';

/** Token colours for recharts (see CHART_THEME in @bharatsales/ui). */
export const CHART_COLORS = CHART_THEME;

function ChartTooltip({ active, payload, format }: TooltipProps<number, string> & { format: ValueFormat }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as SeriesPoint;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-overlay">
      <p className="text-xs text-foreground-subtle">{p.label}</p>
      <p className="font-semibold tabular-nums text-gray-900">{fmt(p.value, format)}</p>
      {p.meta && <p className="text-xs text-foreground-muted">{p.meta}</p>}
    </div>
  );
}

/** Single-series vertical bar chart. */
export function TrendBarChart({
  data,
  format = 'number',
  height = 240,
  label,
  highlightMax = false,
}: {
  data: SeriesPoint[];
  format?: ValueFormat;
  height?: number;
  /** Accessible name for the chart. */
  label: string;
  highlightMax?: boolean;
}) {
  const hasData = data.some((d) => d.value > 0);
  if (!hasData) {
    return (
      <EmptyState
        size="compact"
        icon={<BarChart3 />}
        title="No activity in this period"
        description="The chart fills in as orders come in."
      />
    );
  }
  const max = Math.max(...data.map((d) => d.value));
  return (
    <figure className="m-0">
      <div role="img" aria-label={label} style={{ height }} className="w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              width={format === 'inr' ? 56 : 36}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
              tickFormatter={(v: number) => fmt(v, format, true)}
            />
            <Tooltip cursor={{ fill: CHART_COLORS.cursor }} content={<ChartTooltip format={format} />} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={!highlightMax || d.value === max ? CHART_COLORS.series : CHART_COLORS.seriesMuted} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{fmt(d.value, format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}


export default TrendBarChart;
