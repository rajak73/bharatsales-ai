import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ReportsService } from '@bharatsales/api-client';
import { Report, ReportStats } from '@bharatsales/shared-types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  LoadingRegion,
  Modal,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
  StatGrid,
  StatusPill,
  Toolbar,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileBarChart,
  FileClock,
  FileDown,
  Play,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const MAX_POLL_ATTEMPTS = 60;

type RunState = 'running' | 'downloading' | 'done' | 'failed' | 'timeout';

const EMPTY_SCHEDULE = { report: '', frequency: 'Daily', time: '08:00', recipients: '', format: 'PDF' };

export default function ReportsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState<{ report?: string; recipients?: string }>({});
  const [runStates, setRunStates] = useState<Record<string, RunState>>({});

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const user = useCurrentUser();
  // Report-generation polls still running; cleared on unmount.
  const pollIntervals = useRef(new Set<ReturnType<typeof setInterval>>());

  useEffect(() => {
    const intervals = pollIntervals.current;
    return () => {
      intervals.forEach(clearInterval);
      intervals.clear();
    };
  }, []);

  const DISTRIBUTOR_CATEGORIES = ['Supply Chain', 'Returns', 'Finance'];
  const isDistributor = user?.role === 'Distributor';
  const availableCategories = isDistributor
    ? DISTRIBUTOR_CATEGORIES
    : ['Sales', 'HR', 'Execution', 'Supply Chain', 'Returns', 'Claims', 'Performance', 'Finance', 'Audit'];

  useEffect(() => {
    fetchData();

  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [reportsData, statsData] = await Promise.all([
        ReportsService.getReports(),
        ReportsService.getReportStats()
      ]);
      setAllReports(reportsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load reports. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter reports
  const filteredReports = allReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || report.category === categoryFilter;
    const matchesRoleScope = !isDistributor || DISTRIBUTOR_CATEGORIES.includes(report.category);
    return matchesSearch && matchesCategory && matchesRoleScope;
  });

  const setRunState = (reportName: string, state: RunState) =>
    setRunStates((prev) => ({ ...prev, [reportName]: state }));

  const stopPolling = (interval: ReturnType<typeof setInterval>) => {
    clearInterval(interval);
    pollIntervals.current.delete(interval);
  };

  const handleRunReport = async (reportName: string) => {
    try {
      setRunState(reportName, 'running');
      toast.info({ title: `Generating "${reportName}"`, description: 'The download starts automatically when it’s ready.' });
      const { jobId } = await ReportsService.runReport({ reportName });

      // Poll for completion (at most MAX_POLL_ATTEMPTS, stopped on unmount)
      let attempts = 0;
      let inFlight = false;
      const interval = setInterval(async () => {
        if (inFlight) return;
        attempts += 1;
        if (attempts > MAX_POLL_ATTEMPTS) {
          stopPolling(interval);
          setRunState(reportName, 'timeout');
          toast.warning(`"${reportName}" is taking longer than expected. Please try again later.`);
          return;
        }
        inFlight = true;
        try {
          const status = await ReportsService.getJobStatus(jobId);
          // Stopped (unmounted / capped) while the request was pending.
          if (!pollIntervals.current.has(interval)) return;
          if (status.status === 'Completed') {
            stopPolling(interval);
            setRunState(reportName, 'downloading');

            // Get export URL and download
            const exportData = await ReportsService.getExport(jobId);
            const blob = new Blob([exportData.data || ''], { type: exportData.contentType || 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = exportData.filename || `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setRunState(reportName, 'done');
            toast.success({ title: `"${reportName}" is ready`, description: 'Check your downloads folder.' });
          } else if (status.status === 'Failed') {
            stopPolling(interval);
            setRunState(reportName, 'failed');
            toast.error(`Failed to generate "${reportName}".`);
          }
        } catch (e) {
          stopPolling(interval);
          console.error(e);
          setRunState(reportName, 'failed');
          toast.error(getErrorMessage(e) ?? `Couldn't finish "${reportName}". Try again.`);
        } finally {
          inFlight = false;
        }
      }, 1000);
      pollIntervals.current.add(interval);
    } catch (err) {
      console.error(err);
      setRunState(reportName, 'failed');
      toast.error(getErrorMessage(err) ?? 'Failed to request report generation.');
    }
  };

  const handleScheduleReport = async () => {
    if (schedule.report && schedule.recipients) {
      try {
        setScheduling(true);
        await ReportsService.scheduleReport(schedule);
        toast.success(`"${schedule.report}" has been scheduled`);
        setShowScheduleModal(false);
        setSchedule(EMPTY_SCHEDULE);
        fetchData(); // Refresh stats to show new scheduled report count
      } catch (err) {
        console.error(err);
        toast.error(getErrorMessage(err) ?? 'Failed to schedule report.');
      } finally {
        setScheduling(false);
      }
    }
  };

  const openSchedule = (reportName = '') => {
    setScheduleErrors({});
    if (reportName) setSchedule((s) => ({ ...s, report: reportName }));
    setShowScheduleModal(true);
  };

  const closeSchedule = () => {
    if (scheduling) return;
    setShowScheduleModal(false);
  };

  const onSubmitSchedule = (e: FormEvent) => {
    e.preventDefault();
    const errors: typeof scheduleErrors = {};
    if (!schedule.report) errors.report = 'Select a report to schedule';
    if (!schedule.recipients.trim()) errors.recipients = 'Enter at least one email address';
    setScheduleErrors(errors);
    if (errors.report) return document.getElementById('schedule-report')?.focus();
    if (errors.recipients) return document.getElementById('schedule-recipients')?.focus();
    handleScheduleReport();
  };

  const hasFilters = Boolean(searchTerm) || categoryFilter !== 'All Categories';
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All Categories');
  };

  const initialLoading = loading && allReports.length === 0;
  const runningCount = Object.values(runStates).filter((s) => s === 'running' || s === 'downloading').length;

  const runButton = (report: Report) => {
    const state = runStates[report.name];
    if (state === 'running') {
      return (
        <Button size="sm" loading aria-live="polite">
          Generating…
        </Button>
      );
    }
    if (state === 'downloading') {
      return (
        <Button size="sm" loading leftIcon={<Download />}>
          Downloading…
        </Button>
      );
    }
    if (state === 'failed' || state === 'timeout') {
      return (
        <Button size="sm" variant="outline" leftIcon={<RotateCcw />} onClick={() => handleRunReport(report.name)}>
          Try again
        </Button>
      );
    }
    if (state === 'done') {
      return (
        <Button size="sm" variant="outline" leftIcon={<FileDown />} onClick={() => handleRunReport(report.name)}>
          Run again
        </Button>
      );
    }
    return (
      <Button size="sm" leftIcon={<Play />} onClick={() => handleRunReport(report.name)}>
        Run report
      </Button>
    );
  };

  const runNote = (state: RunState | undefined) => {
    switch (state) {
      case 'running':
        return <span className="flex items-center gap-1 text-xs text-warning-700"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Generating — keep this page open</span>;
      case 'downloading':
        return <span className="flex items-center gap-1 text-xs text-primary-700"><Download className="h-3.5 w-3.5" aria-hidden="true" />Preparing download</span>;
      case 'done':
        return <span className="flex items-center gap-1 text-xs text-success-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Downloaded</span>;
      case 'failed':
        return <span className="flex items-center gap-1 text-xs text-danger-700"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />Generation failed</span>;
      case 'timeout':
        return <span className="flex items-center gap-1 text-xs text-warning-700"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />Taking too long</span>;
      default:
        return null;
    }
  };

  return (
    <PageSection>
      <PageHeader
        title="Reports"
        description={
          initialLoading
            ? 'Generate, download and schedule reports.'
            : `Generate, download and schedule reports · ${formatNumber(filteredReports.length)} available`
        }
        actions={
          <Button variant="outline" leftIcon={<CalendarClock />} onClick={() => openSchedule()} disabled={allReports.length === 0}>
            Schedule report
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard label="Report types" value={formatNumber(stats?.total || 0)} icon={<FileBarChart />} tone="neutral" loading={initialLoading} />
        <StatCard label="Scheduled" value={formatNumber(stats?.scheduled || 0)} icon={<CalendarClock />} tone="info" loading={initialLoading} />
        <StatCard
          label="Generated today"
          value={formatNumber(stats?.generatedToday || 0)}
          icon={<CheckCircle2 />}
          tone="success"
          loading={initialLoading}
          hint={runningCount ? `${runningCount} running now` : undefined}
        />
        <StatCard label="Pending export" value={formatNumber(stats?.pendingExport || 0)} icon={<FileClock />} tone="warning" loading={initialLoading} />
      </StatGrid>

      {(user?.role === 'Organization Admin' || user?.role === 'Sales Manager') && (
        <Link
          to="/dashboard/reports/dsr"
          className="group flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-soft transition-colors hover:border-primary-200 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600" aria-hidden="true">
            <TrendingUp className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-gray-900">Daily sales report (DSR)</span>
            <span className="block text-sm text-foreground-subtle">Visits, orders and collections by rep for any day</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" aria-hidden="true" />
        </Link>
      )}

      <Toolbar>
        <SearchInput
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder="Search reports…"
          aria-label="Search reports"
          containerClassName="w-full sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Select
            hideLabel
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[{ value: 'All Categories', label: 'All categories' }, ...availableCategories.map((c) => ({ value: c, label: c }))]}
            containerClassName="w-full sm:w-48"
          />
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </Toolbar>

      {loadError && allReports.length === 0 ? (
        <ErrorState title="Couldn't load reports" message={loadError} onRetry={fetchData} />
      ) : initialLoading ? (
        <LoadingRegion label="Loading reports" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </LoadingRegion>
      ) : filteredReports.length === 0 ? (
        hasFilters ? (
          <EmptyState
            bordered
            icon={<FileBarChart />}
            title="No reports match"
            description="Try a different search or category."
            action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <EmptyState
            bordered
            icon={<FileBarChart />}
            title="No reports available"
            description="Reports for your role will appear here once your organization is set up."
          />
        )
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Reports">
          {filteredReports.map((report) => {
            const state = runStates[report.name];
            return (
              <li key={report.id || report.name}>
                <Card className="flex h-full flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="primary" size="sm">{report.category}</Badge>
                    {report.lastRun && <span className="truncate text-xs text-foreground-subtle">Last run {report.lastRun}</span>}
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-gray-900">{report.name}</h2>
                  <p className="mt-1 flex-1 text-sm text-foreground-muted">{report.desc}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                    <div className="min-w-0" aria-live="polite">
                      {runNote(state) ?? (report.status ? <StatusPill status={report.status} size="sm" /> : null)}
                    </div>
                    <div className="flex items-center gap-1">
                      <IconButton size="sm" icon={<CalendarClock />} onClick={() => openSchedule(report.name)} aria-label={`Schedule ${report.name}`} />
                      {runButton(report)}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={showScheduleModal}
        onClose={closeSchedule}
        dismissible={!scheduling}
        title="Schedule report"
        description="We'll email the report to the recipients on this schedule."
        footer={
          <>
            <Button variant="outline" onClick={closeSchedule} disabled={scheduling}>
              Cancel
            </Button>
            <Button type="submit" form="schedule-report-form" loading={scheduling} leftIcon={<CalendarClock />}>
              Schedule report
            </Button>
          </>
        }
      >
        <form id="schedule-report-form" onSubmit={onSubmitSchedule} noValidate className="space-y-3">
          <Select
            id="schedule-report"
            data-autofocus
            label="Report"
            required
            placeholder="Select report"
            value={schedule.report}
            onChange={(e) => {
              setSchedule({ ...schedule, report: e.target.value });
              setScheduleErrors((er) => ({ ...er, report: undefined }));
            }}
            options={allReports.map((r) => ({ value: r.name, label: r.name }))}
            error={scheduleErrors.report}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Frequency"
              value={schedule.frequency}
              onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
              options={['Daily', 'Weekly', 'Monthly'].map((f) => ({ value: f, label: f }))}
            />
            <Input
              label="Time"
              type="time"
              value={schedule.time}
              onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
            />
          </div>
          <Input
            id="schedule-recipients"
            label="Recipients"
            required
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={schedule.recipients}
            onChange={(e) => {
              setSchedule({ ...schedule, recipients: e.target.value });
              setScheduleErrors((er) => ({ ...er, recipients: undefined }));
            }}
            error={scheduleErrors.recipients}
          />
          <Select
            label="Format"
            value={schedule.format}
            onChange={(e) => setSchedule({ ...schedule, format: e.target.value })}
            options={['PDF', 'Excel', 'CSV'].map((f) => ({ value: f, label: f }))}
          />
        </form>
      </Modal>
    </PageSection>
  );
}
