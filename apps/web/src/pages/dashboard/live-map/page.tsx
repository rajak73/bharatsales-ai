import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingRegion,
  LoadingState,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
  StatGrid,
  StatusPill,
  cn,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import { LiveMapService, BeatsService } from '@bharatsales/api-client';
import { LiveRep } from '@bharatsales/shared-types';
import { AlertTriangle, RefreshCw, BatteryMedium, BatteryLow, CheckCircle2, MapPin, Users, Store, Navigation, Coffee, Route } from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

// Leaflet touches `window` at import time, so the map lives in its own
// lazily-loaded chunk that is only fetched once this page renders.
const LiveMap = lazy(() => import('./LiveMapComponent'));

const mapFallback = <LoadingState label="Loading live map…" className="h-full" />;

/** Field-status dot colours, matching the map markers. Pill tones come from STATUS_TONES in @bharatsales/ui. */
const REP_STATUS: Record<string, { dot: string }> = {
  'At Outlet': { dot: 'bg-success-500' },
  Traveling: { dot: 'bg-primary-500' },
  'On Break': { dot: 'bg-warning-500' },
  Offline: { dot: 'bg-gray-400' },
};
const repStatus = (s: string) => REP_STATUS[s] ?? REP_STATUS.Offline;

function RouteInsight({ result }: { result: any }) {
  const skipped = result.deviations?.skippedOutlets?.length ?? 0;
  const outOfSeq = result.deviations?.outOfSequenceOutlets?.length ?? 0;
  const ra = result.routeAnalytics;
  return (
    <div className="mt-3 space-y-2">
      {result.hasPlan && (skipped > 0 || outOfSeq > 0) ? (
        <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 p-2 text-xs text-warning-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {skipped > 0 && `${skipped} outlet(s) skipped. `}
            {outOfSeq > 0 && `${outOfSeq} out of sequence.`}
          </span>
        </div>
      ) : result.hasPlan ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-success-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> On planned route
        </p>
      ) : (
        <p className="text-xs text-foreground-subtle">No beat planned for today.</p>
      )}
      {ra && (
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Distance', value: `${ra.totalDistanceKm} km` },
            { label: 'Productive', value: `${ra.productiveTimeMinutes} min` },
            { label: 'Travel', value: `${ra.travelTimeMinutes} min` },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-surface-subtle py-1.5">
              <dd className="text-xs font-semibold tabular-nums text-gray-900">{m.value}</dd>
              <dt className="text-2xs text-foreground-subtle">{m.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function LiveMapPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [liveReps, setLiveReps] = useState<LiveRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deviations, setDeviations] = useState<Record<string, any>>({});
  const [checkingDeviation, setCheckingDeviation] = useState<string | null>(null);
  const inFlight = useRef(false);
  const listRef = useRef<HTMLUListElement>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    // Never stack requests: a slow API plus a 5s poll would otherwise pile
    // up overlapping calls that resolve out of order.
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      if (showLoading) setLoading(true);
      const reps = await LiveMapService.getLiveReps();
      setLiveReps(Array.isArray(reps) ? reps : []);
      setLoadError(null);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Only surface the error on a foreground load; a failed background
      // poll keeps showing the last known positions.
      if (showLoading) setLoadError(getErrorMessage(error) ?? "Couldn't load live locations.");
    } finally {
      inFlight.current = false;
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Initial load

    // Poll every 5 seconds for real-time updates (EventSource cannot send
    // JWT headers). Skip ticks while the tab is hidden.
    const intervalId = setInterval(() => {
      if (document.hidden) return;
      fetchData(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const filteredReps = liveReps.filter(rep => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = rep.name.toLowerCase().includes(q) || (rep.outlet || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Status' || rep.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Location data refreshed');
  };

  const handleCheckDeviation = async (repId: string) => {
    setCheckingDeviation(repId);
    try {
      const result = await BeatsService.checkRouteDeviation(repId);
      setDeviations(prev => ({ ...prev, [repId]: result }));
    } catch (error) {
      console.error('Failed to check route deviation:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't check the route. Try again.");
    } finally {
      setCheckingDeviation(null);
    }
  };

  // Keep the selected rep visible in the side list when picked on the map.
  useEffect(() => {
    if (!selectedId) return;
    listRef.current?.querySelector<HTMLElement>(`[data-rep-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const count = (s: string) => liveReps.filter(r => r.status === s).length;
  const online = liveReps.length - count('Offline');

  return (
    <PageSection>
      <PageHeader
        title="Live team tracking"
        description="Real-time field team locations, updated every few seconds."
        titleAddon={
          !loading && !loadError ? (
            <Badge tone="success" size="sm" dot>
              <span className="tabular-nums">{formatNumber(online)}</span>&nbsp;online
            </Badge>
          ) : undefined
        }
        actions={<Button variant="outline" leftIcon={<RefreshCw />} loading={refreshing} onClick={handleRefresh}>Refresh</Button>}
      />

      <StatGrid columns={4}>
        <StatCard label="Reps tracked" value={formatNumber(liveReps.length)} icon={<Users />} loading={loading} onClick={() => setStatusFilter('All Status')} />
        <StatCard label="At outlet" value={formatNumber(count('At Outlet'))} icon={<Store />} tone="success" loading={loading} onClick={() => setStatusFilter('At Outlet')} />
        <StatCard label="Travelling" value={formatNumber(count('Traveling'))} icon={<Navigation />} tone="primary" loading={loading} onClick={() => setStatusFilter('Traveling')} />
        <StatCard label="On break" value={formatNumber(count('On Break'))} icon={<Coffee />} tone="warning" loading={loading} onClick={() => setStatusFilter('On Break')} />
      </StatGrid>

      {loadError && !loading ? (
        <ErrorState title="Couldn't load live locations" message={loadError} onRetry={() => fetchData()} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Map */}
          <Card className="relative z-0 h-[360px] overflow-hidden sm:h-[460px] lg:col-span-2 lg:h-[calc(100dvh-20rem)] lg:min-h-[520px]">
            <Suspense fallback={mapFallback}>
              <LiveMap reps={filteredReps} selectedId={selectedId} onSelect={setSelectedId} />
            </Suspense>
          </Card>

          {/* Side panel */}
          <Card className="flex flex-col lg:h-[calc(100dvh-20rem)] lg:min-h-[520px]">
            <div className="space-y-3 border-b border-border p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Field team</h2>
                <span className="text-xs tabular-nums text-foreground-subtle">
                  {formatNumber(filteredReps.length)} of {formatNumber(liveReps.length)}
                </span>
              </div>
              <SearchInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search rep or outlet" aria-label="Search reps" />
              <Select hideLabel label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'All Status', label: 'All statuses' },
                  { value: 'At Outlet', label: 'At outlet' },
                  { value: 'Traveling', label: 'Travelling' },
                  { value: 'On Break', label: 'On break' },
                  { value: 'Offline', label: 'Offline' },
                ]} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <LoadingRegion label="Loading reps" className="divide-y divide-border">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="space-y-2 p-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  ))}
                </LoadingRegion>
              ) : filteredReps.length === 0 ? (
                <EmptyState
                  size="compact"
                  icon={<MapPin />}
                  title={liveReps.length === 0 ? 'No reps are sharing location' : 'No reps match'}
                  description={liveReps.length === 0
                    ? 'Reps appear here once they check in on the field app.'
                    : 'Try a different search or status.'}
                  action={liveReps.length > 0 ? (
                    <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); }}>Clear filters</Button>
                  ) : undefined}
                />
              ) : (
                <ul ref={listRef} className="divide-y divide-border" aria-label="Field reps">
                  {filteredReps.map((rep) => {
                    const st = repStatus(rep.status);
                    const selected = rep.id === selectedId;
                    const lowBattery = typeof rep.battery === 'number' && rep.battery < 20;
                    return (
                      <li key={rep.id || rep.name} data-rep-id={rep.id} className={cn('relative p-4', selected && 'bg-primary-50/60')}>
                        {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary-600" aria-hidden="true" />}
                        <button
                          type="button"
                          onClick={() => setSelectedId(selected ? null : rep.id)}
                          aria-pressed={selected}
                          className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', st.dot)} aria-hidden="true" />
                              <span className="truncate font-medium text-gray-900">{rep.name}</span>
                            </span>
                            <span className="shrink-0 text-xs text-foreground-subtle">{rep.lastUpdate}</span>
                          </div>
                          <div className="mt-1 truncate pl-[1.125rem] text-sm text-foreground-muted">{rep.outlet || '—'}</div>
                          <div className="mt-2 flex items-center justify-between pl-[1.125rem]">
                            <StatusPill status={rep.status} size="sm" dot={false} />
                            <span className={cn('flex items-center gap-1 text-xs tabular-nums', lowBattery ? 'font-medium text-danger-700' : 'text-foreground-subtle')}>
                              {lowBattery ? <BatteryLow className="h-3.5 w-3.5" aria-hidden="true" /> : <BatteryMedium className="h-3.5 w-3.5" aria-hidden="true" />}
                              <span className="sr-only">Battery </span>{rep.battery}%
                            </span>
                          </div>
                        </button>

                        <div className="pl-[1.125rem]">
                          {deviations[rep.id] ? (
                            <RouteInsight result={deviations[rep.id]} />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="-ml-2 mt-1"
                              leftIcon={<Route />}
                              loading={checkingDeviation === rep.id}
                              onClick={() => handleCheckDeviation(rep.id)}
                            >
                              {checkingDeviation === rep.id ? 'Checking route…' : 'Check route analytics'}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageSection>
  );
}
