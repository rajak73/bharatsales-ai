'use client';

import { useState, useEffect } from 'react';
import { ReportsService } from '@bharatsales/api-client';
import { Report, ReportStats } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [schedule, setSchedule] = useState({ report: '', frequency: 'Daily', time: '08:00', recipients: '', format: 'PDF' });
  
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        ReportsService.getReports('org-1'),
        ReportsService.getReportStats('org-1')
      ]);
      setAllReports(reportsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports
  const filteredReports = allReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || report.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRunReport = (reportName: string) => {
    setSuccessMessage(`"${reportName}" has been generated successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleScheduleReport = () => {
    if (schedule.report && schedule.recipients) {
      setSuccessMessage(`"${schedule.report}" has been scheduled!`);
      setShowScheduleModal(false);
      setSchedule({ report: '', frequency: 'Daily', time: '08:00', recipients: '', format: 'PDF' });
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Generate and schedule reports • {filteredReports.length} reports available</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowScheduleModal(true)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            📅 Schedule Report
          </button>
          <button className="btn-primary text-sm">+ Custom Report</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
          <div className="text-sm text-gray-500">Report Types</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{stats?.scheduled || 0}</div>
          <div className="text-sm text-gray-500">Scheduled</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{stats?.generatedToday || 0}</div>
          <div className="text-sm text-gray-500">Generated Today</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-saffron-600">{stats?.pendingExport || 0}</div>
          <div className="text-sm text-gray-500">Pending Export</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search reports..."
            className="input-field w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input-field w-40"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option>All Categories</option>
            <option>Sales</option>
            <option>HR</option>
            <option>Execution</option>
            <option>Distribution</option>
            <option>Inventory</option>
            <option>Performance</option>
            <option>Finance</option>
            <option>Admin</option>
          </select>
          {(searchTerm || categoryFilter !== 'All Categories') && (
            <button
              onClick={() => { setSearchTerm(''); setCategoryFilter('All Categories'); }}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id || report.name} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">{report.category}</span>
                <span className="text-xs text-gray-400">{report.lastRun}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{report.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{report.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">{report.status}</span>
                <button
                  onClick={() => handleRunReport(report.name)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Run Report
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 card text-center py-12">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-gray-500">No reports found</p>
            <button onClick={() => { setSearchTerm(''); setCategoryFilter('All Categories'); }} className="mt-2 text-primary-600 text-sm font-medium">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Schedule Report</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report *</label>
                <select
                  className="input-field"
                  value={schedule.report}
                  onChange={(e) => setSchedule({ ...schedule, report: e.target.value })}
                >
                  <option value="">Select report</option>
                  {allReports.map(report => (
                    <option key={report.name} value={report.name}>{report.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    className="input-field"
                    value={schedule.frequency}
                    onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    className="input-field"
                    value={schedule.time}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipients *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="email@company.com"
                  value={schedule.recipients}
                  onChange={(e) => setSchedule({ ...schedule, recipients: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  className="input-field"
                  value={schedule.format}
                  onChange={(e) => setSchedule({ ...schedule, format: e.target.value })}
                >
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>CSV</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleScheduleReport}
                disabled={!schedule.report || !schedule.recipients}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
