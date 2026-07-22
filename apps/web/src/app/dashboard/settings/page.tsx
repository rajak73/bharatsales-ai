'use client';

import { useState, useEffect } from 'react';
import { SettingsService } from '@bharatsales/api-client';
import { Settings } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('company');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    organizationId: '',
    companyName: '',
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getSettings();
      if (data) setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await SettingsService.updateSettings(settings);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
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

  const sections = [
    { id: 'company', label: 'Company Profile', icon: '🏢' },
    { id: 'attendance', label: 'Attendance & Geofence', icon: '📍' },
    { id: 'order', label: 'Order & Approval', icon: '📋' },
    { id: 'notification', label: 'Notifications', icon: '🔔' },
    { id: 'integration', label: 'Integrations', icon: '🔗' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure your organization, policies, and integrations</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary text-sm disabled:opacity-50">💾 Save Changes</button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              {/* Company Profile */}
          {activeSection === 'company' && (
            <div className="card space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Company Profile</h3>
                <p className="text-sm text-gray-500 mb-6">Manage your company details and branding</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    className="input-field"
                    value={settings.industry}
                    onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                  >
                    <option>FMCG</option>
                    <option>Pharmaceutical</option>
                    <option>Consumer Goods</option>
                    <option>Paint & Building Materials</option>
                    <option>Agri Inputs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    className="input-field"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  >
                    <option>Asia/Kolkata (IST)</option>
                    <option>Asia/Dubai (GST)</option>
                    <option>America/New_York (EST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    className="input-field"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  >
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>AED (د.إ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
                  <select
                    className="input-field"
                    value={settings.fiscalYearStart}
                    onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                  >
                    <option value="04-01">April (01-04)</option>
                    <option value="01-01">January (01-01)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Attendance & Geofence */}
          {activeSection === 'attendance' && (
            <div className="card space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance & Geofence</h3>
                <p className="text-sm text-gray-500 mb-6">Configure attendance policies and geofence settings</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geofence Radius (meters)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.geofenceRadius}
                    onChange={(e) => setSettings({ ...settings, geofenceRadius: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Default: 5 meters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Accuracy Tolerance (m)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.gpsAccuracy}
                    onChange={(e) => setSettings({ ...settings, gpsAccuracy: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Default: 10 meters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start</label>
                  <input
                    type="time"
                    className="input-field"
                    value={settings.shiftStart}
                    onChange={(e) => setSettings({ ...settings, shiftStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift End</label>
                  <input
                    type="time"
                    className="input-field"
                    value={settings.shiftEnd}
                    onChange={(e) => setSettings({ ...settings, shiftEnd: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <button
                      key={day}
                      onClick={() => handleWorkingDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        settings.workingDays.includes(day)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Order & Approval */}
          {activeSection === 'order' && (
            <div className="card space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order & Approval Settings</h3>
                <p className="text-sm text-gray-500 mb-6">Configure order approval thresholds and discount authority</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Approval Threshold (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.orderApprovalThreshold}
                    onChange={(e) => setSettings({ ...settings, orderApprovalThreshold: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Orders above this amount require approval</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Authority (%)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.discountAuthority}
                    onChange={(e) => setSettings({ ...settings, discountAuthority: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Max discount rep can give without approval</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Approval Triggers</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Discount above rep authority</li>
                  <li>• Credit limit exceeded</li>
                  <li>• Overdue outlet order</li>
                  <li>• Below minimum price</li>
                  <li>• Large order threshold</li>
                </ul>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notification' && (
            <div className="card space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Settings</h3>
                <p className="text-sm text-gray-500 mb-6">Configure notification channels and preferences</p>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Order Confirmations', desc: 'Send when new order is placed', enabled: true },
                  { name: 'Payment Receipts', desc: 'Send when payment is received', enabled: true },
                  { name: 'Delivery Updates', desc: 'Send delivery status changes', enabled: true },
                  { name: 'Target Alerts', desc: 'Send when target is achieved', enabled: false },
                  { name: 'Overdue Reminders', desc: 'Send for overdue invoices', enabled: true },
                ].map((notif) => (
                  <div key={notif.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{notif.name}</div>
                      <div className="text-sm text-gray-500">{notif.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeSection === 'integration' && (
            <div className="card space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Integrations</h3>
                <p className="text-sm text-gray-500 mb-6">Configure third-party integrations</p>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Maps & Geocoding', provider: 'OpenStreetMap', status: 'Active' },
                  { name: 'Tally / ERP', provider: 'Not Configured', status: 'Not Configured' },
                  { name: 'WhatsApp Business', provider: 'Not Configured', status: 'Not Configured' },
                  { name: 'SMS / OTP', provider: 'Not Configured', status: 'Not Configured' },
                  { name: 'Email (SMTP)', provider: 'Not Configured', status: 'Not Configured' },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{integration.name}</div>
                      <div className="text-sm text-gray-500">Provider: {integration.provider}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      integration.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {integration.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="card space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h3>
                <p className="text-sm text-gray-500 mb-6">Configure security policies</p>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Session Timeout', value: '30 minutes of inactivity', enabled: true },
                  { name: 'Max Concurrent Sessions', value: '3 per user', enabled: true },
                  { name: 'Device Verification', value: 'OTP for new devices', enabled: true },
                  { name: 'Force Password Reset', value: 'Every 90 days', enabled: true },
                  { name: 'Login Rate Limiting', value: '5 attempts per 15 minutes', enabled: true },
                  { name: 'Account Lockout', value: 'After 10 failed attempts', enabled: true },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.value}</div>
                    </div>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
