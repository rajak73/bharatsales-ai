import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { NotificationsService } from '@bharatsales/api-client';
import { AppNotification } from '@bharatsales/shared-types';
import {
  Button,
  Card,
  EmptyState,
  LoadingRegion,
  PageHeader,
  PageSection,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
  StatGrid,
  TabPanel,
  Tabs,
  Toolbar,
  cn,
  formatNumber,
  formatRelativeTime,
  useToast,
} from '@bharatsales/ui';
import {
  AlertTriangle,
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  ClipboardList,
  Clock,
  MailOpen,
  RefreshCw,
  Target,
  Wallet,
} from 'lucide-react';
import { ErrorState, getErrorMessage } from '../../../components/common/ErrorState';

const ALL_TYPES = 'All Types';
const TYPE_OPTIONS = [
  { value: ALL_TYPES, label: 'All types' },
  { value: 'order', label: 'Orders' },
  { value: 'approval', label: 'Approvals' },
  { value: 'sync', label: 'Sync' },
  { value: 'target', label: 'Targets' },
  { value: 'expiry', label: 'Expiry' },
  { value: 'collection', label: 'Collections' },
];

const TYPE_STYLE: Record<string, { icon: LucideIcon; className: string }> = {
  order: { icon: ClipboardList, className: 'bg-primary-50 text-primary-600' },
  approval: { icon: AlertTriangle, className: 'bg-warning-50 text-warning-600' },
  sync: { icon: RefreshCw, className: 'bg-info-50 text-info-600' },
  target: { icon: Target, className: 'bg-success-50 text-success-600' },
  expiry: { icon: Clock, className: 'bg-danger-50 text-danger-600' },
  collection: { icon: Wallet, className: 'bg-success-50 text-success-600' },
};

export default function NotificationsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setLoadError('');
      // The server derives the user from the auth token — this param is unused by the API.
      const data = await NotificationsService.getNotifications('');
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load notifications. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = n.title.toLowerCase().includes(q) || (n.message ?? '').toLowerCase().includes(q);
    const matchesType = typeFilter === ALL_TYPES || n.type === typeFilter;
    const matchesRead = readFilter === 'all' || !n.read;
    return matchesSearch && matchesType && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasFilters = Boolean(searchTerm) || typeFilter !== ALL_TYPES || readFilter !== 'all';
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter(ALL_TYPES);
    setReadFilter('all');
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setMarkingId(id);
      await NotificationsService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error) ?? "Couldn't mark the notification as read. Try again.");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await NotificationsService.markAllAsRead('');
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error) ?? "Couldn't mark notifications as read. Try again.");
    } finally {
      setMarkingAll(false);
    }
  };

  const initialLoading = loading && notifications.length === 0;

  const renderList = () => {
    if (loadError && notifications.length === 0) {
      return <ErrorState title="Couldn't load notifications" message={loadError} onRetry={fetchNotifications} className="border-0" />;
    }
    if (initialLoading) {
      return (
        <LoadingRegion label="Loading notifications" className="divide-y divide-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 px-4 py-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </LoadingRegion>
      );
    }
    if (filteredNotifications.length === 0) {
      if (hasFilters) {
        return (
          <EmptyState
            size="compact"
            icon={<BellOff />}
            title={readFilter === 'unread' && !searchTerm && typeFilter === ALL_TYPES ? "You're all caught up" : 'No notifications match'}
            description={readFilter === 'unread' && !searchTerm && typeFilter === ALL_TYPES ? 'No unread notifications.' : 'Try a different search or type.'}
            action={<Button variant="outline" onClick={clearFilters}>Show all notifications</Button>}
          />
        );
      }
      return (
        <EmptyState
          size="compact"
          icon={<BellOff />}
          title="No notifications yet"
          description="Order approvals, target updates and collection alerts will show up here."
        />
      );
    }
    return (
      <ul className="divide-y divide-border">
        {filteredNotifications.map((notif) => {
          const style = TYPE_STYLE[notif.type] ?? { icon: Bell, className: 'bg-gray-100 text-gray-500' };
          const Icon = style.icon;
          return (
            <li key={notif.id} className={cn('flex items-start gap-3 px-4 py-3', !notif.read && 'bg-primary-50/50')}>
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.className)} aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className={cn('min-w-0 flex-1 text-sm', !notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                    {!notif.read && <span className="sr-only">Unread: </span>}
                    {notif.title}
                  </p>
                  {!notif.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />}
                </div>
                {notif.message && <p className="mt-0.5 text-sm text-foreground-muted">{notif.message}</p>}
                <p className="mt-1 text-xs text-foreground-subtle">{notif.time || formatRelativeTime(notif.createdAt)}</p>
              </div>
              {!notif.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Check />}
                  loading={markingId === notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  aria-label={`Mark "${notif.title}" as read`}
                  className="shrink-0"
                >
                  <span className="hidden sm:inline">Mark read</span>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <PageSection>
      <PageHeader
        title="Notifications"
        description={loading && notifications.length === 0 ? 'Alerts about orders, approvals and targets.' : `${formatNumber(unreadCount)} unread`}
        actions={
          <Button variant="outline" leftIcon={<CheckCheck />} onClick={handleMarkAllRead} loading={markingAll} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        }
      />

      <StatGrid columns={3}>
        <StatCard label="Total" value={formatNumber(notifications.length)} icon={<Bell />} tone="neutral" loading={initialLoading} />
        <StatCard label="Unread" value={formatNumber(unreadCount)} icon={<BellRing />} tone="accent" loading={initialLoading} onClick={() => setReadFilter('unread')} />
        <StatCard label="Read" value={formatNumber(notifications.filter(n => n.read).length)} icon={<MailOpen />} tone="success" loading={initialLoading} />
      </StatGrid>

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-border px-4 py-3">
          <Tabs
            id="notif-read"
            aria-label="Filter by read status"
            variant="pills"
            value={readFilter}
            onValueChange={(v) => setReadFilter(v as 'all' | 'unread')}
            items={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', count: unreadCount },
            ]}
          />
          <Toolbar>
            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search notifications…"
              aria-label="Search notifications"
              containerClassName="w-full sm:max-w-xs"
            />
            <Select
              hideLabel
              label="Type"
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              containerClassName="w-full sm:w-44"
            />
          </Toolbar>
        </div>
        <TabPanel tabsId="notif-read" value={readFilter} active aria-live="polite" aria-busy={loading}>
          {renderList()}
        </TabPanel>
      </Card>
    </PageSection>
  );
}
