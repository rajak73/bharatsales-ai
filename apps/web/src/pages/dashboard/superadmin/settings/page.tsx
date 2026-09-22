import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Save } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  LoadingRegion,
  PageHeader,
  PageSection,
  Skeleton,
  Switch,
  useToast,
} from '@bharatsales/ui';
import { ErrorState, getErrorMessage } from '../../../../components/common/ErrorState';

export default function PlatformSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    SuperadminService.getPlatformSettings()
      .then(setSettings)
      .catch((err) => {
        console.error('Failed to load platform settings:', err);
        setLoadError(getErrorMessage(err) ?? "Couldn't load platform settings. Check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await SuperadminService.updatePlatformSettings({
        defaultTrialDays: settings.defaultTrialDays,
        maintenanceMode: settings.maintenanceMode,
      });
      toast.success('Platform settings saved');
    } catch (error) {
      console.error('Failed to save platform settings:', error);
      toast.error(getErrorMessage(error) ?? "Couldn't save platform settings. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const header = <PageHeader title="Platform settings" description="Platform-wide configuration, separate from each organization’s own settings." />;

  if (loadError && !settings) {
    return (
      <PageSection>
        {header}
        <ErrorState title="Couldn't load platform settings" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      </PageSection>
    );
  }

  return (
    <PageSection>
      {header}

      <Card className="max-w-2xl">
        {loading || !settings ? (
          <LoadingRegion label="Loading platform settings" className="space-y-4 p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </LoadingRegion>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <CardHeader title="Tenant defaults" description="Applied across every organization on the platform." divided />
            <CardBody className="space-y-4">
              <Input
                label="Default trial period"
                type="number"
                inputMode="numeric"
                min={0}
                value={settings.defaultTrialDays}
                onChange={(e) => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })}
                rightElement={<span className="pr-3 text-sm text-foreground-subtle">days</span>}
                helperText="Applied when a new organization signs up."
                containerClassName="sm:max-w-xs"
              />
              <div className="border-t border-border pt-4">
                <Switch
                  checked={Boolean(settings.maintenanceMode)}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  label="Maintenance mode"
                  description="When on, logins other than Super Admin should be blocked. Enforcement at login isn’t wired up yet."
                />
                {settings.maintenanceMode && (
                  <Alert tone="warning" className="mt-4">
                    Maintenance mode will be turned on for every organization when you save.
                  </Alert>
                )}
              </div>
            </CardBody>
            <CardFooter>
              <Button type="submit" loading={saving} leftIcon={<Save />}>
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </PageSection>
  );
}
