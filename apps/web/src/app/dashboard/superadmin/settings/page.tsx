'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Loader2 } from 'lucide-react';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    SuperadminService.getPlatformSettings()
      .then(setSettings)
      .catch((err) => console.error('Failed to load platform settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await SuperadminService.updatePlatformSettings({
        defaultTrialDays: settings.defaultTrialDays,
        maintenanceMode: settings.maintenanceMode,
      });
      setSuccessMessage('Platform settings saved.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save platform settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500">Platform-wide configuration, distinct from per-organization settings.</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-sm text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      <div className="card space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Trial Period (days)</label>
          <input
            type="number"
            className="input-field"
            value={settings.defaultTrialDays}
            onChange={(e) => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })}
          />
          <p className="text-xs text-gray-400 mt-1">Applied when a new organization signs up.</p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
            <p className="text-xs text-gray-400">When enabled, non-Super-Admin logins should be blocked (enforcement is not yet wired to login).</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
