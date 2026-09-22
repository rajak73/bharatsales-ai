import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { CheckCircle2, Clock, Ticket } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingRegion,
  PageHeader,
  PageSection,
  SearchInput,
  Skeleton,
  StatusPill,
  TabPanel,
  Tabs,
  Toolbar,
  formatDateTime,
  formatNumber,
  useToast,
} from '@bharatsales/ui';
import type { BadgeTone } from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

const PRIORITY_TONE: Record<string, BadgeTone> = { High: 'danger', Medium: 'warning', Low: 'neutral' };

export default function SupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState('open');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await SuperadminService.getAllTickets();
      setTickets(data || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setLoadError(getErrorMessage(error) ?? "Couldn't load support tickets. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id);
      await SuperadminService.updateTicketStatus(id, status);
      await fetchTickets();
      toast.success(`Ticket marked ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't update the ticket. Try again.");
    } finally {
      setUpdating(null);
    }
  };

  const openTickets = tickets.filter((t) => t.status !== 'Resolved');
  const resolvedTickets = tickets.filter((t) => t.status === 'Resolved');
  const q = search.toLowerCase();
  const visible = (tab === 'open' ? openTickets : tab === 'resolved' ? resolvedTickets : tickets)
    .filter((t) => !q || `${t.subject} ${t.message}`.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const initialLoading = loading && tickets.length === 0;

  const renderBody = () => {
    if (loadError && tickets.length === 0) {
      return <ErrorState title="Couldn't load support tickets" message={loadError} onRetry={fetchTickets} />;
    }
    if (initialLoading) {
      return (
        <LoadingRegion label="Loading tickets" className="grid gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </LoadingRegion>
      );
    }
    if (visible.length === 0) {
      return (
        <EmptyState
          bordered
          icon={<Ticket />}
          title={tickets.length === 0 ? 'No support tickets yet' : search ? 'No tickets match your search' : tab === 'open' ? 'No open tickets' : 'No tickets here'}
          description={tickets.length === 0 ? 'Tickets raised by organizations from their Settings page appear here.' : tab === 'open' && !search ? 'Everything is resolved. Nice work.' : undefined}
          action={search ? <Button variant="outline" onClick={() => setSearch('')}>Clear search</Button> : undefined}
        />
      );
    }
    return (
      <ul className="grid gap-4">
        {visible.map((ticket) => {
          const busy = updating === ticket._id;
          return (
            <li key={ticket._id}>
              <Card padding="md">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-gray-900">{ticket.subject}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-subtle">
                      <Badge tone={PRIORITY_TONE[ticket.priority] ?? 'neutral'} size="sm">{ticket.priority} priority</Badge>
                      <span>{formatDateTime(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <StatusPill status={ticket.status} size="sm" />
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-foreground-muted">{ticket.message}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    {ticket.status !== 'In Progress' && (
                      <Button size="sm" variant="outline" leftIcon={<Clock />} disabled={busy && ticket.status !== 'Resolved'} loading={busy && ticket.status === 'Resolved'} onClick={() => updateStatus(ticket._id, 'In Progress')}>
                        {ticket.status === 'Resolved' ? 'Reopen' : 'Mark in progress'}
                      </Button>
                    )}
                    {ticket.status !== 'Resolved' && (
                      <Button size="sm" leftIcon={<CheckCircle2 />} loading={busy} onClick={() => updateStatus(ticket._id, 'Resolved')}>
                        Mark resolved
                      </Button>
                    )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <PageSection>
      <PageHeader
        title="Support"
        description={initialLoading ? 'Tickets raised by organizations across the platform.' : `Tickets raised by organizations · ${formatNumber(openTickets.length)} open`}
      />

      <Tabs
        id="support-tabs"
        aria-label="Ticket status"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'open', label: 'Open', count: openTickets.length },
          { value: 'resolved', label: 'Resolved', count: resolvedTickets.length },
          { value: 'all', label: 'All', count: tickets.length },
        ]}
      />

      <Toolbar>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search tickets…" aria-label="Search tickets" containerClassName="w-full sm:max-w-xs" />
      </Toolbar>

      <TabPanel tabsId="support-tabs" value={tab} active aria-live="polite">
        {renderBody()}
      </TabPanel>
    </PageSection>
  );
}
