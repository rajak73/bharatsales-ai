import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BeatsService, PerformanceService } from '@bharatsales/api-client';
import { Target, MapPin, Users, IndianRupee, Map as MapIcon } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  buttonClassName,
  formatINR,
  formatNumber,
  formatPercent,
} from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';
import { BreakdownBars, CardSkeleton, ProgressMeter, ViewAllLink, firstName, todayLabel } from './widgets';

export function SalesManagerDashboard({ userName }: { userName: string }) {
  const [beatCompletion, setBeatCompletion] = useState<any>(null);
  const [teamDSR, setTeamDSR] = useState<any>(null);
  const [teamTargets, setTeamTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    setLoading(true);
    setLoadError(null);
    // allSettled: show whatever loaded, and surface the first failure with a retry.
    Promise.allSettled([BeatsService.getTeamBeatCompletion(), PerformanceService.getTeamDSR(today), PerformanceService.getTeamTargets()])
      .then(([beat, dsr, targets]) => {
        if (cancelled) return;
        setBeatCompletion(beat.status === 'fulfilled' ? beat.value : null);
        setTeamDSR(dsr.status === 'fulfilled' ? dsr.value : null);
        setTeamTargets(targets.status === 'fulfilled' ? targets.value || [] : []);
        const failed = [beat, dsr, targets].find((r): r is PromiseRejectedResult => r.status === 'rejected');
        if (failed) setLoadError(getErrorMessage(failed.reason) ?? "Some of your team's data could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const totalTarget = teamTargets.reduce((sum, t) => sum + (t.targetValue || 0), 0);
  const totalActual = teamTargets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
  const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const reps: any[] = beatCompletion?.reps || [];
  const sortedReps = [...reps].sort((a, b) => (a.completionPercentage ?? 0) - (b.completionPercentage ?? 0));

  return (
    <PageSection>
      <PageHeader
        title={`Welcome back, ${firstName(userName)}`}
        description={`${todayLabel()} · Your team's field activity for today.`}
        actions={
          <Link to="/dashboard/live-map" className={buttonClassName({ variant: 'outline' })}>
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            Live map
          </Link>
        }
      />

      {loadError && !loading && (
        <ErrorState title="Couldn't load all of your team's data" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      <StatGrid columns={4}>
        <StatCard label="Today's team visits" value={formatNumber(teamDSR?.metrics?.totalVisits ?? 0)} icon={<Users />} loading={loading} />
        <StatCard
          label="Team beat completion"
          value={formatPercent(beatCompletion?.teamCompletionPercentage ?? 0, { decimals: 0 })}
          icon={<MapPin />}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Today's team sales"
          value={formatINR(teamDSR?.metrics?.totalOrderValue ?? 0, { compact: true })}
          hint={teamDSR?.metrics?.ordersCount ? `${formatNumber(teamDSR.metrics.ordersCount)} order${teamDSR.metrics.ordersCount === 1 ? '' : 's'} booked` : undefined}
          icon={<IndianRupee />}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Team target achievement"
          value={formatPercent(achievementPct, { decimals: 0 })}
          icon={<Target />}
          tone={achievementPct >= 100 ? 'success' : 'warning'}
          loading={loading}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Rep beat completion today"
            description="Lowest completion first, so you know who to call"
            actions={<ViewAllLink to="/dashboard/beats">Beats</ViewAllLink>}
            divided
          />
          {loading ? (
            <CardSkeleton rows={4} label="Loading beat completion" padded />
          ) : reps.length === 0 ? (
            <EmptyState
              size="compact"
              icon={<MapPin />}
              title="No reps with a beat today"
              description="Plan beats to assign outlets to your reps."
              action={
                <Link to="/dashboard/beats" className={buttonClassName({ variant: 'outline', size: 'sm' })}>
                  Plan beats
                </Link>
              }
            />
          ) : (
            <CardBody>
              <BreakdownBars
                max={100}
                items={sortedReps.map((rep) => ({
                  key: String(rep.userId),
                  label: <span className="font-medium text-gray-900">{rep.name}</span>,
                  value: rep.completionPercentage ?? 0,
                  valueLabel: formatPercent(rep.completionPercentage ?? 0, { decimals: 0 }),
                }))}
              />
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="Team target" description="Current period" divided />
          <CardBody className="space-y-4">
            {loading ? (
              <CardSkeleton rows={2} label="Loading team target" />
            ) : (
              <>
                <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-gray-900">{formatPercent(achievementPct, { decimals: 0 })}</p>
                <ProgressMeter value={achievementPct} label="Team target achievement" />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-foreground-subtle">Achieved</dt>
                    <dd className="font-medium tabular-nums text-gray-900">{formatINR(totalActual, { compact: true })}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-foreground-subtle">Target</dt>
                    <dd className="font-medium tabular-nums text-gray-900">{formatINR(totalTarget, { compact: true })}</dd>
                  </div>
                </dl>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </PageSection>
  );
}
