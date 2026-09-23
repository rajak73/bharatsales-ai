import { useState, type ReactNode } from 'react';
import { OnboardingService } from '@bharatsales/api-client';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Download,
  Factory,
  Network,
  Package,
  Plus,
  Receipt,
  Rocket,
  Settings,
  Store,
  Upload,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  StatusPill,
  cn,
  useToast,
} from '@bharatsales/ui';
import { BrandLogo } from '../_public/brand';

const STEP_ICONS: Record<number, ReactNode> = {
  1: <Building2 />,
  2: <Receipt />,
  3: <Settings />,
  4: <Network />,
  5: <Users />,
  6: <Package />,
  7: <Factory />,
  8: <Rocket />,
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', tradeName: '', gstin: '', industry: 'FMCG', timezone: 'Asia/Kolkata', fiscalYearStart: '04-01', geofenceRadius: '5', gpsAccuracy: '10', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], shiftStart: '09:00', shiftEnd: '18:00', orderApprovalThreshold: '50000', discountAuthority: '10' });

  const steps = [{ id: 1, name: 'Company' }, { id: 2, name: 'Fiscal & tax' }, { id: 3, name: 'Policies' }, { id: 4, name: 'Hierarchy' }, { id: 5, name: 'Users' }, { id: 6, name: 'Products' }, { id: 7, name: 'Channels' }, { id: 8, name: 'Go live' }];

  const handleGoLive = async () => {
    setSaving(true);
    try {
      await OnboardingService.completeOnboarding();
      setSuccessMessage('Organization activated successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      console.error('Failed to complete onboarding', error);
      toast.error("Couldn't activate your organisation. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = async () => {
    setSaving(true);
    try {
      await OnboardingService.saveStep(currentStep, formData);
      setCurrentStep(Math.min(8, currentStep + 1));
    } catch (error) {
      const err = error as any;
      console.error('Failed to save step', err.response?.data || err.message);
      toast.error("Couldn't save this step. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingDayToggle = (day: string) => { setFormData({ ...formData, workingDays: formData.workingDays.includes(day) ? formData.workingDays.filter(d => d !== day) : [...formData.workingDays, day] }); };

  const current = steps[currentStep - 1];
  const progress = Math.round((currentStep / 8) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-header border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">
          <BrandLogo />
          <span className="text-sm text-foreground-muted">
            Step <span className="font-semibold text-gray-900 tabular-nums">{currentStep}</span> of 8
          </span>
        </div>
        {/* Progress bar (all sizes) */}
        <div
          className="h-1 w-full bg-gray-100"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-1 bg-primary-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[14rem_1fr] lg:gap-6 lg:px-6 lg:py-6">
        {/* Step navigation: horizontal scroller on phones, vertical list on desktop */}
        <nav aria-label="Onboarding steps" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ol className="flex gap-2 lg:flex-col lg:gap-1">
            {steps.map((step) => {
              const active = currentStep === step.id;
              const done = currentStep > step.id;
              return (
                <li key={step.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors lg:min-h-0',
                      active ? 'bg-primary-50 text-primary-700' : done ? 'text-gray-800 hover:bg-gray-100' : 'text-foreground-subtle hover:bg-gray-100',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs [&_svg]:h-3.5 [&_svg]:w-3.5',
                        active ? 'bg-primary-600 text-white' : done ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      {done ? <Check /> : STEP_ICONS[step.id]}
                    </span>
                    <span className="whitespace-nowrap">{step.name}</span>
                    {done && <span className="sr-only">(completed)</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <main id="main-content" className="min-w-0 space-y-4">
          {successMessage && (
            <Alert tone="success" onDismiss={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          {currentStep === 1 && (
            <StepSection title="Company profile" description="Tell us about your organisation.">
              <Card>
                <CardBody className="grid gap-3 sm:grid-cols-2">
                  <Input label="Legal name" required placeholder="Your Company Pvt Ltd" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                  <Input label="Trade name" optional placeholder="Brand name" value={formData.tradeName} onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })} />
                  <Input
                    label="GSTIN"
                    optional
                    placeholder="29AAECR1234F1Z5"
                    helperText="15 characters, as on your GST certificate"
                    autoCapitalize="characters"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                  <Select
                    label="Industry"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    options={['FMCG', 'Pharmaceutical', 'Consumer Goods', 'Paint & Building Materials', 'Agri Inputs'].map((v) => ({ value: v, label: v }))}
                  />
                </CardBody>
              </Card>
            </StepSection>
          )}

          {currentStep === 2 && (
            <StepSection title="Fiscal & tax setup" description="Configure your fiscal year and tax defaults.">
              <Card>
                <CardBody className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Fiscal year starts"
                    required
                    value={formData.fiscalYearStart}
                    onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
                    options={[
                      { value: '04-01', label: 'April (01-04)' },
                      { value: '01-01', label: 'January (01-01)' },
                    ]}
                  />
                  <Select label="Default GST rate" options={['18%', '12%', '5%', '28%'].map((v) => ({ value: v, label: v }))} />
                </CardBody>
              </Card>
            </StepSection>
          )}

          {currentStep === 3 && (
            <StepSection title="Working policies" description="Configure attendance, geofence and order policies.">
              <Card>
                <CardHeader title="Attendance" />
                <CardBody className="grid gap-3 sm:grid-cols-2">
                  <fieldset className="sm:col-span-2">
                    <legend className="mb-1.5 text-sm font-medium text-gray-800">Working days</legend>
                    <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                          const on = formData.workingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              aria-pressed={on}
                              onClick={() => handleWorkingDayToggle(day)}
                              className={cn(
                                'min-h-[44px] min-w-[3.25rem] rounded-lg border px-3 text-sm font-medium transition-colors sm:min-h-[36px]',
                                on ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-border bg-white text-foreground-muted hover:bg-gray-50',
                              )}
                            >
                              {day}
                            </button>
                          );
                        })}
                    </div>
                  </fieldset>
                  <Input label="Shift start" type="time" value={formData.shiftStart} onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Geofence" />
                <CardBody className="grid gap-3 sm:grid-cols-2">
                  <Input label="Geofence radius" type="number" inputMode="numeric" rightElement="m" value={formData.geofenceRadius} onChange={(e) => setFormData({ ...formData, geofenceRadius: e.target.value })} />
                  <Input label="GPS accuracy" type="number" inputMode="numeric" rightElement="m" value={formData.gpsAccuracy} onChange={(e) => setFormData({ ...formData, gpsAccuracy: e.target.value })} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Orders" />
                <CardBody className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Order approval threshold"
                    type="number"
                    inputMode="decimal"
                    leftIcon={<span className="text-sm font-medium">₹</span>}
                    helperText="Orders above this amount need manager approval"
                    value={formData.orderApprovalThreshold}
                    onChange={(e) => setFormData({ ...formData, orderApprovalThreshold: e.target.value })}
                  />
                  <Input label="Discount authority" type="number" inputMode="decimal" rightElement="%" value={formData.discountAuthority} onChange={(e) => setFormData({ ...formData, discountAuthority: e.target.value })} />
                </CardBody>
              </Card>
            </StepSection>
          )}

          {currentStep === 4 && (
            <StepSection title="Sales hierarchy" description="Define your sales organisation structure.">
              <Card>
                <CardHeader title="Hierarchy structure" divided actions={<Button size="sm" leftIcon={<Plus />}>Add zone</Button>} />
                <ul className="divide-y divide-border">
                  {[{ name: 'South Zone', regions: 2, areas: 4 }, { name: 'North Zone', regions: 1, areas: 3 }, { name: 'West Zone', regions: 2, areas: 5 }].map((zone) => (
                    <li key={zone.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                          <Network className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">{zone.name}</div>
                          <div className="text-xs text-foreground-subtle">{zone.regions} regions · {zone.areas} areas</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" aria-label={`Manage ${zone.name}`}>Manage</Button>
                    </li>
                  ))}
                </ul>
              </Card>
            </StepSection>
          )}

          {currentStep === 5 && (
            <StepSection title="User setup" description="Invite team members or import them from a file.">
              <Card>
                <CardHeader
                  title="Team members"
                  divided
                  actions={
                    <>
                      <Button variant="outline" size="sm" leftIcon={<Upload />}>Import CSV</Button>
                      <Button size="sm" leftIcon={<UserPlus />}>Invite user</Button>
                    </>
                  }
                />
                <ul className="divide-y divide-border">
                  {[{ name: 'Rahul Kumar', email: 'rahul@company.com', role: 'Sales Manager', status: 'Active' }, { name: 'Amit Singh', email: 'amit@company.com', role: 'Sales Rep', status: 'Invited' }].map((user) => (
                    <li key={user.email} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="truncate text-xs text-foreground-subtle">{user.email} · {user.role}</div>
                        </div>
                      </div>
                      <StatusPill status={user.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            </StepSection>
          )}

          {currentStep === 6 && (
            <StepSection title="Product import" description="Import your product catalogue.">
              <Card>
                <CardBody>
                  <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border-strong px-4 py-8 text-center">
                    <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <Package className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-medium text-gray-900">Upload your product catalogue</p>
                    <p className="mt-1 max-w-sm text-sm text-foreground-subtle">Download the template, fill in your products, then upload it here.</p>
                    <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Button variant="outline" leftIcon={<Download />}>Download template</Button>
                      <Button leftIcon={<Upload />}>Upload file</Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </StepSection>
          )}

          {currentStep === 7 && (
            <StepSection title="Channel setup" description="Add distributors, warehouses and outlets.">
              <div className="grid gap-3 sm:grid-cols-3">
                {[{ icon: <Factory />, title: 'Distributors', desc: 'Add distribution partners', action: 'Add distributor' }, { icon: <Warehouse />, title: 'Warehouses', desc: 'Set up warehouse locations', action: 'Add warehouse' }, { icon: <Store />, title: 'Outlets', desc: 'Import retail outlets', action: 'Import outlets' }].map((item) => (
                  <Card key={item.title} padding="md" className="flex flex-col">
                    <span aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 [&_svg]:h-5 [&_svg]:w-5">
                      {item.icon}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                    <p className="mb-4 mt-1 flex-1 text-sm text-foreground-subtle">{item.desc}</p>
                    <Button variant="outline" size="sm" fullWidth>{item.action}</Button>
                  </Card>
                ))}
              </div>
            </StepSection>
          )}

          {currentStep === 8 && (
            <StepSection title="Go live" description="Review your setup and activate your organisation.">
              <Card>
                <CardHeader title="Validation summary" divided />
                <ul className="divide-y divide-border">
                  {[{ label: 'Company Profile', status: 'Complete', ok: true }, { label: 'Fiscal & Tax Setup', status: 'Complete', ok: true }, { label: 'Policies Configured', status: 'Complete', ok: true }, { label: 'Hierarchy Created', status: '3 zones', ok: true }, { label: 'Users Invited', status: '3 users', ok: true }, { label: 'Products Imported', status: 'Pending', ok: false }].map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <Badge tone={item.ok ? 'success' : 'warning'} icon={item.ok ? <CheckCircle2 /> : <AlertTriangle />}>
                        {item.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border px-4 py-3">
                  <Button onClick={handleGoLive} size="lg" fullWidth loading={saving} leftIcon={<Rocket />} disabled={!!successMessage}>
                    {saving ? 'Activating…' : 'Activate & go live'}
                  </Button>
                </div>
              </Card>
            </StepSection>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button variant="outline" leftIcon={<ArrowLeft />} onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1 || saving}>
              Previous
            </Button>
            {currentStep < 8 && (
              <Button rightIcon={<ArrowRight />} onClick={handleNextStep} loading={saving}>
                {saving ? 'Saving…' : `Save & continue`}
              </Button>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            Step {currentStep} of 8: {current?.name}
          </p>
        </main>
      </div>
    </div>
  );
}

function StepSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
