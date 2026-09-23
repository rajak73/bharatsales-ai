import { useState, useEffect } from 'react';
import {
  Avatar,
  Card,
  EmptyState,
  LoadingRegion,
  PageHeader,
  PageSection,
  ProgressBar,
  SearchInput,
  Skeleton,
  StatCard,
  StatGrid,
  StatusPill,
  Toolbar,
  formatINR,
  formatNumber,
  formatPercent,
} from '@bharatsales/ui';
import { PerformanceService, UsersService } from '@bharatsales/api-client';
import { Trophy, Target, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const METRIC_LABELS: Record<string, string> = {
  SalesValue: 'Revenue',
  VisitCount: 'Visits',
  ProductiveCalls: 'Productive calls',
  CollectionValue: 'Collections',
};
const isMoney = (m?: string) => !m || m === 'SalesValue' || m === 'CollectionValue';
const fmt = (v: unknown, m?: string) => {
  const n = Number(v) || 0;
  return isMoney(m) ? formatINR(n, { compact: true }) : formatNumber(n);
};

export default function PerformancePage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [repNames, setRepNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [targetData, users] = await Promise.all([
        PerformanceService.getTeamTargets(),
        UsersService.getUsers(),
      ]);
      setTargets(targetData || []);
      const nameMap: Record<string, string> = {};
      (users || []).forEach(u => { nameMap[u.id] = u.name; });
      setRepNames(nameMap);
    } catch (error) {
      console.error('Failed to fetch team performance:', error);
      setLoadError(getErrorMessage(error) ?? 'Failed to load team performance.');
    } finally {
      setLoading(false);
    }
  };

  const ranked = [...targets].sort((a, b) => (b.meta?.achievementPercentage ?? 0) - (a.meta?.achievementPercentage ?? 0));
  const nameOf = (t: any) => t.entityName || repNames[t.entityId] || t.entityId;
  const visible = search ? ranked.filter(t => String(nameOf(t)).toLowerCase().includes(search.toLowerCase())) : ranked;

  const avg = ranked.length ? ranked.reduce((s, t) => s + (t.meta?.achievementPercentage ?? 0), 0) / ranked.length : 0;
  const achieved = ranked.filter(t => t.status === 'Achieved').length;
  const atRisk = ranked.filter(t => t.status === 'At Risk').length;

  return (
    <PageSection>
      <PageHeader title="Team performance" description="Target vs achievement scorecards for your team, ranked by achievement." />

      <StatGrid columns={4}>
        <StatCard label="Targets tracked" value={formatNumber(ranked.length)} icon={<Target />} loading={loading} />
        <StatCard label="Avg achievement" value={formatPercent(avg, { decimals: 0 })} icon={<TrendingUp />} tone="info" loading={loading} />
        <StatCard label="Achieved" value={formatNumber(achieved)} icon={<CheckCircle2 />} tone="success" loading={loading} />
        <StatCard label="At risk" value={formatNumber(atRisk)} icon={<AlertTriangle />} tone={atRisk > 0 ? 'danger' : 'neutral'} loading={loading} />
      </StatGrid>

      {loading ? (
        <LoadingRegion label="Loading scorecards" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map(i => (
            <Card key={i} padding="lg" className="space-y-3">
              <div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-32" /></div>
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-4 w-40" />
            </Card>
          ))}
        </LoadingRegion>
      ) : loadError ? (
        <ErrorState title="Couldn't load team performance" message={loadError} onRetry={fetchData} />
      ) : ranked.length === 0 ? (
        <EmptyState bordered icon={<Target />} title="No targets assigned yet"
          description="Set targets for your reps on the Targets page to see their scorecards here." />
      ) : (
        <>
          {ranked.length > 6 && (
            <Toolbar>
              <SearchInput value={search} onValueChange={setSearch} placeholder="Search reps" aria-label="Search reps" containerClassName="w-full sm:max-w-sm" />
            </Toolbar>
          )}
          {visible.length === 0 ? (
            <EmptyState size="compact" bordered title="No matches" description={`No reps match “${search}”.`} />
          ) : (
            <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Team scorecards, ranked">
              {visible.map((target) => {
                const rank = ranked.indexOf(target) + 1;
                const pct = target.meta?.achievementPercentage ?? 0;
                const bar = pct >= 100 ? 'success' : pct >= 75 ? 'primary' : pct >= 50 ? 'warning' : 'danger';
                return (
                  <li key={target.id}>
                    <Card padding="lg" className="h-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={String(nameOf(target))} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {rank === 1 && <Trophy className="h-4 w-4 shrink-0 text-saffron-600" aria-label="Top performer" />}
                              <span className="truncate font-semibold text-gray-900">{nameOf(target)}</span>
                            </div>
                            <div className="text-xs text-foreground-subtle">
                              #{rank} · {METRIC_LABELS[target.targetMetric || 'SalesValue'] ?? target.targetMetric}
                            </div>
                          </div>
                        </div>
                        <StatusPill status={target.status} size="sm" />
                      </div>
                      <ProgressBar value={pct} label={`${nameOf(target)} achievement`} tone={bar} size="md" className="mt-4" />
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-medium tabular-nums text-gray-900">{formatPercent(pct, { decimals: 0 })} <span className="font-normal text-foreground-subtle">achieved</span></span>
                        <span className="tabular-nums text-foreground-muted">
                          {fmt(target.actualValue, target.targetMetric)} / {fmt(target.targetValue, target.targetMetric)}
                        </span>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </PageSection>
  );
}
