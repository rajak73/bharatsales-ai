import { useState, useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { SettingsService, SupportService, AuthService } from '@bharatsales/api-client';
import { Settings } from '@bharatsales/shared-types';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  LoadingRegion,
  PageHeader,
  PageSection,
  Select,
  Skeleton,
  TabPanel,
  Tabs,
  Textarea,
  cn,
  formatDateTime,
  formatINR,
  useToast,
} from '@bharatsales/ui';
import { Building2, ClipboardList, IndianRupee, Laptop, Lock, MapPin, Percent, Save, Send, Ticket } from 'lucide-react';
import { getErrorMessage } from '../../../components/common/ErrorState';

const INDUSTRIES = ['FMCG', 'Pharmaceutical', 'Consumer Goods', 'Paint & Building Materials', 'Agri Inputs'];
const TIMEZONES = ['Asia/Kolkata (IST)', 'Asia/Dubai (GST)', 'America/New_York (EST)'];
const CURRENCIES = ['INR (₹)', 'USD ($)', 'AED (د.إ)'];
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Options for a legacy text-valued <select>; keeps an unlisted saved value selectable. */
const textOptions = (list: string[], current?: string) =>
  (current && !list.includes(current) ? [current, ...list] : list).map((v) => ({ value: v, label: v }));

export default function SettingsPage() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('company');
  const [loading, setLoading] = useState(true);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', priority: 'Medium' });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    organizationId: '',
    name: '',
    industry: 'FMCG',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    fiscalYearStart: '04-01',
    geofenceRadius: '5',
    gpsAccuracy: '10',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shiftStart: '09:00',
    shiftEnd: '18:00',
    orderApprovalThreshold: '50000',
    discountAuthority: '10',
  });
  const [saving, setSaving] = useState(false);
  const [settingsLoadError, setSettingsLoadError] = useState('');

  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<any | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await AuthService.getActiveSessions();
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId);
      await AuthService.revokeSession(sessionId);
      await fetchSessions();
      toast.success('Session revoked');
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't revoke the session. Try again.");
    } finally {
      setRevokingId(null);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setSettingsLoadError('');
      const data = await SettingsService.getSettings();
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          workingDays: data.workingDays || prev.workingDays || [],
        }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettingsLoadError(getErrorMessage(error) ?? "Couldn't load your saved settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await SettingsService.updateSettings(settings);
      toast.success('Settings saved');
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error) ?? "Couldn't save settings. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingDayToggle = (day: string) => {
    setSettings({
      ...settings,
      workingDays: settings.workingDays.includes(day)
        ? settings.workingDays.filter(d => d !== day)
        : [...settings.workingDays, day],
    });
  };

  const handleRaiseTicket = async () => {
    if (!ticketForm.subject || !ticketForm.message) return;
    try {
      setSubmittingTicket(true);
      await SupportService.createTicket(ticketForm);
      setTicketForm({ subject: '', message: '', priority: 'Medium' });
      toast.success({ title: 'Support ticket raised', description: 'Our team will reply by email.' });
    } catch (error) {
      console.error('Failed to raise support ticket:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't raise the ticket. Try again.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const sections = [
    { value: 'company', label: 'Company profile', icon: <Building2 /> },
    { value: 'attendance', label: 'Attendance & geofence', icon: <MapPin /> },
    { value: 'order', label: 'Orders & approvals', icon: <ClipboardList /> },
    { value: 'sessions', label: 'Active sessions', icon: <Lock />, count: sessionsLoading ? undefined : sessions.length },
    { value: 'support', label: 'Support', icon: <Ticket /> },
  ];

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings({ ...settings, [key]: value });

  const saveFooter = (
    <CardFooter className="justify-end">
      <Button type="submit" loading={saving} leftIcon={<Save />}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </CardFooter>
  );

  const formSkeleton = (
    <Card>
      <LoadingRegion label="Loading settings" className="space-y-4 p-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </LoadingRegion>
    </Card>
  );

  const settingsForm = (id: string, title: string, description: string, body: ReactNode) =>
    loading ? (
      formSkeleton
    ) : (
      <Card>
        <form id={id} onSubmit={onSave} noValidate>
          <CardHeader title={title} description={description} divided />
          <CardBody>{body}</CardBody>
          {saveFooter}
        </form>
      </Card>
    );

  const threshold = Number(settings.orderApprovalThreshold);

  return (
    <PageSection>
      <PageHeader title="Settings" description="Configure your organization, field policies and account security." />

      {settingsLoadError && (
        <Alert
          tone="warning"
          title="Showing default values"
          actions={<Button size="sm" variant="outline" onClick={fetchSettings}>Try again</Button>}
        >
          {settingsLoadError} Reload your saved settings before making changes, or they may be overwritten.
        </Alert>
      )}

      <Tabs id="settings" aria-label="Settings sections" items={sections} value={activeSection} onValueChange={setActiveSection} />

      {/* Company profile */}
      <TabPanel tabsId="settings" value="company" active={activeSection === 'company'}>
        {settingsForm(
          'settings-company',
          'Company profile',
          'Your company details and branding, shown on invoices and in the app.',
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Company name" value={settings.name} onChange={(e) => set('name', e.target.value)} autoComplete="organization" />
            <Input
              label="Logo URL"
              optional
              type="url"
              placeholder="https://…"
              value={settings.branding?.logoUrl || ''}
              onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, logoUrl: e.target.value } })}
              helperText="Shown in the sidebar in place of your initials."
            />
            <Select label="Industry" value={settings.industry} onChange={(e) => set('industry', e.target.value)} options={textOptions(INDUSTRIES, settings.industry)} />
            <Select label="Timezone" value={settings.timezone} onChange={(e) => set('timezone', e.target.value)} options={textOptions(TIMEZONES, settings.timezone)} />
            <Select label="Currency" value={settings.currency} onChange={(e) => set('currency', e.target.value)} options={textOptions(CURRENCIES, settings.currency)} />
            <Select
              label="Financial year starts"
              value={settings.fiscalYearStart}
              onChange={(e) => set('fiscalYearStart', e.target.value)}
              options={[
                { value: '04-01', label: 'April (01-04)' },
                { value: '01-01', label: 'January (01-01)' },
              ]}
            />
            <Input
              label="GSTIN / VAT number"
              optional
              value={settings.gstNumber || ''}
              onChange={(e) => set('gstNumber', e.target.value)}
              helperText="15 characters, e.g. 29ABCDE1234F1Z5"
              autoCapitalize="characters"
            />
            <Input label="Country" value={settings.country || ''} onChange={(e) => set('country', e.target.value)} autoComplete="country-name" />
            <Textarea
              label="Registered address"
              rows={2}
              value={settings.address || ''}
              onChange={(e) => set('address', e.target.value)}
              containerClassName="sm:col-span-2"
            />
          </div>,
        )}
      </TabPanel>

      {/* Attendance & geofence */}
      <TabPanel tabsId="settings" value="attendance" active={activeSection === 'attendance'}>
        {settingsForm(
          'settings-attendance',
          'Attendance & geofence',
          'How close reps must be to check in, and when their working day runs.',
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Geofence radius"
                type="number"
                inputMode="numeric"
                min={0}
                value={settings.geofenceRadius}
                onChange={(e) => set('geofenceRadius', e.target.value)}
                rightElement={<span className="pr-3 text-sm text-foreground-subtle">m</span>}
                helperText="Default: 5 metres"
              />
              <Input
                label="GPS accuracy tolerance"
                type="number"
                inputMode="numeric"
                min={0}
                value={settings.gpsAccuracy}
                onChange={(e) => set('gpsAccuracy', e.target.value)}
                rightElement={<span className="pr-3 text-sm text-foreground-subtle">m</span>}
                helperText="Default: 10 metres"
              />
              <Input label="Shift starts" type="time" value={settings.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} />
              <Input label="Shift ends" type="time" value={settings.shiftEnd} onChange={(e) => set('shiftEnd', e.target.value)} />
            </div>
            <FormField label="Working days" helperText={`${settings.workingDays.length} of 7 days selected`}>
              {(a11y) => (
                <div role="group" aria-label="Working days" aria-describedby={a11y['aria-describedby']} className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => {
                    const on = settings.workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        aria-label={day}
                        onClick={() => handleWorkingDayToggle(day)}
                        className={cn(
                          'h-11 min-w-[3.25rem] rounded-lg border px-3 text-sm font-medium transition-colors sm:h-10',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                          on
                            ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700'
                            : 'border-border-strong bg-white text-gray-700 hover:bg-surface-subtle',
                        )}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              )}
            </FormField>
          </div>,
        )}
      </TabPanel>

      {/* Orders & approvals */}
      <TabPanel tabsId="settings" value="order" active={activeSection === 'order'}>
        {settingsForm(
          'settings-order',
          'Orders & approvals',
          'When an order needs a manager’s approval before it goes to the distributor.',
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Order approval threshold"
                type="number"
                inputMode="decimal"
                min={0}
                leftIcon={<IndianRupee />}
                value={settings.orderApprovalThreshold}
                onChange={(e) => set('orderApprovalThreshold', e.target.value)}
                helperText={
                  Number.isFinite(threshold) && settings.orderApprovalThreshold !== ''
                    ? `Orders above ${formatINR(threshold)} need approval`
                    : 'Orders above this amount need approval'
                }
              />
              <Input
                label="Discount authority"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                leftIcon={<Percent />}
                value={settings.discountAuthority}
                onChange={(e) => set('discountAuthority', e.target.value)}
                helperText="Maximum discount a rep can give without approval"
              />
            </div>
            <Alert tone="info" title="An order also needs approval when">
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>the discount is above the rep’s authority</li>
                <li>the outlet’s credit limit is exceeded</li>
                <li>the outlet has overdue payments</li>
                <li>a price is below the minimum price</li>
                <li>the order is above the threshold</li>
              </ul>
            </Alert>
          </div>,
        )}
      </TabPanel>

      {/* Active sessions */}
      <TabPanel tabsId="settings" value="sessions" active={activeSection === 'sessions'}>
        <Card>
          <CardHeader
            title="Active sessions"
            description="Devices signed in to your account. Revoke any session you don’t recognise."
            divided
          />
          {sessionsLoading ? (
            <LoadingRegion label="Loading sessions" className="divide-y divide-border">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </LoadingRegion>
          ) : sessions.length === 0 ? (
            <EmptyState size="compact" icon={<Laptop />} title="No active sessions" description="Devices you sign in on will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((s: any) => (
                <li key={s._id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-foreground-subtle" aria-hidden="true">
                    <Laptop className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{s.deviceInfo || 'Unknown device'}</p>
                    <p className="truncate text-xs text-foreground-subtle">
                      {s.ipAddress || 'Unknown IP'} · Expires {formatDateTime(s.expiresAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-danger-600 hover:text-danger-700"
                    loading={revokingId === s._id}
                    onClick={() => setConfirmRevoke(s)}
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </TabPanel>

      {/* Support */}
      <TabPanel tabsId="settings" value="support" active={activeSection === 'support'}>
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRaiseTicket();
            }}
          >
            <CardHeader
              title="Raise a support ticket"
              description="Reach the BharatSales platform team about an issue with your account."
              divided
            />
            <CardBody className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Subject"
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Briefly describe the issue"
                  containerClassName="sm:col-span-2"
                />
                <Select
                  label="Priority"
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                  options={['Low', 'Medium', 'High'].map((p) => ({ value: p, label: p }))}
                />
              </div>
              <Textarea
                label="Message"
                required
                rows={5}
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                placeholder="What happened, what you expected, and any order or outlet numbers involved"
              />
            </CardBody>
            <CardFooter className="flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-foreground-subtle">Subject and message are required.</p>
              <Button
                type="submit"
                loading={submittingTicket}
                disabled={!ticketForm.subject || !ticketForm.message}
                leftIcon={<Send />}
              >
                {submittingTicket ? 'Submitting…' : 'Submit ticket'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabPanel>

      <ConfirmDialog
        open={Boolean(confirmRevoke)}
        onClose={() => setConfirmRevoke(null)}
        tone="danger"
        title="Revoke this session?"
        description={`${confirmRevoke?.deviceInfo || 'This device'} will be signed out and must log in again.`}
        confirmLabel="Revoke session"
        cancelLabel="Keep signed in"
        onConfirm={async () => {
          const id = confirmRevoke?._id;
          if (id) await handleRevokeSession(id);
          setConfirmRevoke(null);
        }}
      />
    </PageSection>
  );
}
