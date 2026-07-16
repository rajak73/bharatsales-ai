'use client';

import { useState, useEffect } from 'react';
import { ScheduledReportsService } from '@bharatsales/api-client';
import { ScheduledReport, RecentExport } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function ScheduledReportsPage() {
  const [successMessage, setSuccessMessage] = useState('');
  
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsData, exportsData] = await Promise.all([
        ScheduledReportsService.getScheduledReports('org-1'),
        ScheduledReportsService.getRecentExports('org-1')
      ]);
      setScheduledReports(reportsData || []);
      setRecentExports(exportsData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleNew = () => {
    setSuccessMessage('New report scheduled successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleStatus = (name: string) => {
    setScheduledReports(scheduledReports.map(r => r.name === name ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r));
    setSuccessMessage(`Report ${name} status updated!`);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Scheduled Reports</h1><p className="text-gray-500">Automate report generation and delivery • {scheduledReports.length} reports</p></div>
        <button onClick={handleScheduleNew} className="btn-primary text-sm">+ Schedule New Report</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{scheduledReports.length}</div><div className="text-sm text-gray-500">Scheduled Reports</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">{scheduledReports.filter(r => r.status === 'Active').length}</div><div className="text-sm text-gray-500">Active</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-600">{scheduledReports.filter(r => r.status === 'Paused').length}</div><div className="text-sm text-gray-500">Paused</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-primary-600">{recentExports.length}</div><div className="text-sm text-gray-500">Exports Today</div></div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Scheduled Reports</h3></div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Report</th><th className="px-6 py-3 font-medium">Frequency</th><th className="px-6 py-3 font-medium">Time</th><th className="px-6 py-3 font-medium">Recipients</th><th className="px-6 py-3 font-medium">Format</th><th className="px-6 py-3 font-medium">Last Sent</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Action</th></tr></thead>
              <tbody>
                {scheduledReports.length > 0 ? (
                  scheduledReports.map((report) => (<tr key={report.id || report.name} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-gray-900">{report.name}</td><td className="px-6 py-3 text-gray-600">{report.frequency}</td><td className="px-6 py-3 text-gray-600">{report.time}</td><td className="px-6 py-3 text-gray-500">{report.recipients}</td><td className="px-6 py-3 text-gray-600">{report.format}</td><td className="px-6 py-3 text-gray-500">{report.lastSent}</td><td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${report.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{report.status}</span></td><td className="px-6 py-3"><button onClick={() => handleToggleStatus(report.name)} className="text-primary-600 text-xs font-medium hover:text-primary-700">{report.status === 'Active' ? 'Pause' : 'Resume'}</button></td></tr>))
                ) : (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No scheduled reports found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Recent Exports</h3></div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Report</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Size</th><th className="px-6 py-3 font-medium">Generated</th><th className="px-6 py-3 font-medium">Expires</th><th className="px-6 py-3 font-medium">Action</th></tr></thead>
              <tbody>
                {recentExports.length > 0 ? (
                  recentExports.map((exp) => (<tr key={exp.id || exp.name} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-gray-900">{exp.name}</td><td className="px-6 py-3 text-gray-600">{exp.type}</td><td className="px-6 py-3 text-gray-600">{exp.size}</td><td className="px-6 py-3 text-gray-500">{exp.generated}</td><td className="px-6 py-3 text-gray-500">{exp.expires}</td><td className="px-6 py-3"><button className="text-primary-600 text-xs font-medium hover:text-primary-700">Download</button></td></tr>))
                ) : (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No recent exports found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
