import { useEffect, useState } from 'react';
import { BeatsService, AttendanceService, OrdersService, TargetsService } from '@bharatsales/api-client';
import { MapPin, Clock, ShoppingCart, Target } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  PageSection,
  StatCard,
  StatGrid,
  formatDateTime,
  formatINR,
  formatNumber,
  formatPercent,
} from '@bharatsales/ui';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';
import { CardSkeleton, ProgressMeter, RecentOrdersList, ViewAllLink, firstName, todayLabel } from './widgets';

/** A target belongs to this rep and its period covers today. */
function isMyCurrentTarget(t: any, userId: string | undefined, now: Date): boolean {
  if (!userId) return false;
  const owner = t.entityType === 'User' ? t.entityId : t.userId;
  if (owner !== userId) return false;
  const start = t.startDate ? new Date(t.startDate) : null;
  const end = t.endDate ? new Date(t.endDate) : null;
  return (!start || start <= now) && (!end || end >= now);
}

export function SalesRepDashboard({ userName }: { userName: string }) {
  const user = useCurrentUser();
  const [beat, setBeat] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    // allSettled: show whatever loaded, and surface the first failure with a retry.
    Promise.allSettled([
      BeatsService.getTodayBeat(),
      AttendanceService.getCurrentSession(),
      OrdersService.getOrders({ mine: true }),
      // Reps can read /targets (Targets:Read) but not the Analytics-gated
      // /api/v1/performance/targets, so filter the org list to their own.
      TargetsService.getTargets(),
    ])
      .then(([b, s, o, t]) => {
        if (cancelled) return;
        const now = new Date();
        setBeat(b.status === 'fulfilled' ? b.value : null);
        setSession(s.status === 'fulfilled' ? s.value : null);
        setOrders(o.status === 'fulfilled' ? o.value || [] : []);
        setTargets(t.status === 'fulfilled' ? (t.value || []).filter((x: any) => isMyCurrentTarget(x, user.id, now)) : []);
        const failed = [b, s, o, t].find((r): r is PromiseRejectedResult => r.status === 'rejected');
        if (failed) setLoadError(getErrorMessage(failed.reason) ?? 'Some of your dashboard could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, user.id]);

  const todayOrders = orders.filter((o) => {
    const created = new Date(o.createdAt);
    const now = new Date();
    return created.toDateString() === now.toDateString();
  });
  const totalTarget = targets.reduce((sum, t) => sum + (t.targetValue ?? t.targetAmount ?? 0), 0);
  const totalActual = targets.reduce((sum, t) => sum + (t.actualValue || 0), 0);
  const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  const attendanceLabel = session?.status === 'Active' ? 'Checked in' : session?.status === 'On_Break' ? 'On break' : 'Not started';
  const attendanceTone = session?.status === 'Active' ? 'success' : session?.status === 'On_Break' ? 'warning' : 'neutral';
  const outletsCount = beat?.beat?.outlets?.length ?? 0;
  const completedVisits = beat?.completedVisits ?? 0;
  const beatPct = outletsCount > 0 ? (completedVisits / outletsCount) * 100 : 0;
  const todayValue = todayOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);

  return (
    <PageSection>
      <PageHeader title={`Welcome back, ${firstName(userName)}`} description={`${todayLabel()} · Your beat and targets for today.`} />

      {loadError && !loading && (
        <ErrorState title="Couldn't load all of your dashboard" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      <StatGrid columns={4}>
        <StatCard
          label="Attendance"
          value={attendanceLabel}
          hint={session?.startTime ? `Since ${formatDateTime(session.startTime)}` : undefined}
          icon={<Clock />}
          tone={attendanceTone}
          loading={loading}
        />
        <StatCard
          label="Today's beat progress"
          value={`${formatNumber(completedVisits)}/${formatNumber(outletsCount)}`}
          hint="Outlets visited"
          icon={<MapPin />}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="Today's orders"
          value={formatNumber(todayOrders.length)}
          hint={todayOrders.length > 0 ? formatINR(todayValue) : undefined}
          icon={<ShoppingCart />}
          loading={loading}
        />
        <StatCard
          label="Target achievement"
          value={formatPercent(achievementPct, { decimals: 0 })}
          icon={<Target />}
          tone={achievementPct >= 100 ? 'success' : 'warning'}
          loading={loading}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Today's orders" actions={<ViewAllLink to="/dashboard/orders" />} divided />
          {loading ? (
            <CardSkeleton rows={4} label="Loading today's orders" padded />
          ) : (
            <RecentOrdersList
              orders={todayOrders.slice(0, 5)}
              emptyTitle="No orders booked today yet"
              emptyDescription="Orders you book during outlet visits will show up here."
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Your progress" divided />
          <CardBody className="space-y-4">
            {loading ? (
              <CardSkeleton rows={3} label="Loading progress" />
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-gray-900">Beat</span>
                    <span className="tabular-nums text-foreground-muted">
                      {formatNumber(completedVisits)} of {formatNumber(outletsCount)} outlets
                    </span>
                  </div>
                  <ProgressMeter value={beatPct} label="Beat completion today" />
                  {outletsCount === 0 && <p className="text-xs text-foreground-subtle">No beat assigned for today.</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-gray-900">Target</span>
                    <span className="tabular-nums text-foreground-muted">
                      {formatINR(totalActual, { compact: true })} of {formatINR(totalTarget, { compact: true })}
                    </span>
                  </div>
                  <ProgressMeter value={achievementPct} label="Target achievement" />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </PageSection>
  );
}
