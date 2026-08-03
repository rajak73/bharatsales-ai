'use client';

import { useState, useEffect } from 'react';
import { SettingsService, SupportService, AuthService } from '@bharatsales/api-client';
import { Settings } from '@bharatsales/shared-types';
import { Loader2, Building2, MapPin, ClipboardList, Lock, Ticket, Save, CheckCircle, X } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('company');
  const [successMessage, setSuccessMessage] = useState('');
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

  const [sessions, setSessions] = useState<any[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId);
      await AuthService.revokeSession(sessionId);
      await fetchSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    } finally {
      setRevokingId(null);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await SettingsService.updateSettings(settings);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
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
      setSuccessMessage('Support ticket raised successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to raise support ticket:', error);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const sections = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'attendance', label: 'Attendance & Geofence', icon: MapPin },
    { id: 'order', label: 'Order & Approval', icon: ClipboardList },
    { id: 'sessions', label: 'Active Sessions', icon: Lock },
    { id: 'support', label: 'Support', icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your organization, policies, and integrations</p>
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
                  <section.icon className="w-4 h-4" />
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
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://..."
                    value={settings.branding?.logoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, logoUrl: e.target.value } })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown in the sidebar in place of your initials</p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST / VAT Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.gstNumber || ''}
                    onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.country || ''}
                    onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
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
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
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
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          {activeSection === 'sessions' && (
            <div className="card space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Active Sessions</h3>
                <p className="text-sm text-gray-500 mb-4">Devices currently signed in to your account. Revoke any session you don't recognize.</p>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-400">No active sessions found.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sessions.map((s: any) => (
                    <div key={s._id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.deviceInfo || 'Unknown device'}</p>
                        <p className="text-xs text-gray-500">{s.ipAddress || 'Unknown IP'} · Expires {new Date(s.expiresAt).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(s._id)}
                        disabled={revokingId === s._id}
                        className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        {revokingId === s._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Revoke'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Support */}
          {activeSection === 'support' && (
            <div className="card space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Raise a Support Ticket</h3>
                <p className="text-sm text-gray-500 mb-4">Reach the BharatSales platform team about an issue with your account.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  className="input-field"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Briefly describe the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  placeholder="Describe the issue in detail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="input-field"
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <button
                onClick={handleRaiseTicket}
                disabled={submittingTicket || !ticketForm.subject || !ticketForm.message}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {submittingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Ticket'}
              </button>
            </div>
          )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
