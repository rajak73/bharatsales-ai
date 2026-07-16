'use client';

import { useState } from 'react';

export default function DistributorReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [successMessage, setSuccessMessage] = useState('');

  const reports = [
    { name: 'Fill Rate Report', desc: 'Order fulfillment performance', category: 'Performance', lastRun: '2 hours ago' },
    { name: 'Inventory Ageing', desc: 'Stock ageing analysis', category: 'Inventory', lastRun: '1 hour ago' },
    { name: 'Order Status Report', desc: 'Orders by status', category: 'Orders', lastRun: '3 hours ago' },
    { name: 'Collection & Ageing', desc: 'Payment collections', category: 'Finance', lastRun: '4 hours ago' },
    { name: 'Sales Summary', desc: 'Period-wise sales', category: 'Sales', lastRun: '1 day ago' },
    { name: 'Returns Analysis', desc: 'Return patterns', category: 'Returns', lastRun: '1 day ago' },
  ];

  const kpis = [
    { label: 'Fill Rate', value: '94%', target: '90%', status: 'above' },
    { label: 'Avg Dispatch Time', value: '4.2 hrs', target: '6 hrs', status: 'above' },
    { label: 'Order Accuracy', value: '98.5%', target: '95%', status: 'above' },
    { label: 'Expiry Loss', value: '0.3%', target: '1%', status: 'below' },
  ];

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRunReport = (reportName: string) => {
    setSuccessMessage(`"${reportName}" generated successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {successMessage && (<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div><button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button></div>)}

      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1><p className="text-gray-500">Distributor performance and analytics • {filteredReports.length} reports</p></div><button className="btn-primary text-sm">Schedule Report</button></div>

      <div className="grid grid-cols-4 gap-4">{kpis.map((kpi) => (<div key={kpi.label} className="card text-center"><div className="text-2xl font-bold text-gray-900">{kpi.value}</div><div className="text-sm text-gray-500">{kpi.label}</div><div className="text-xs text-gray-400 mt-1">Target: {kpi.target}</div></div>))}</div>

      <div className="card"><div className="flex flex-wrap gap-4"><input type="text" placeholder="Search reports..." className="input-field w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><select className="input-field w-40" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option>All Categories</option><option>Performance</option><option>Inventory</option><option>Orders</option><option>Finance</option><option>Sales</option><option>Returns</option></select></div></div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredReports.length > 0 ? filteredReports.map((report) => (<div key={report.name} className="card-hover"><div className="flex items-center justify-between mb-3"><span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">{report.category}</span><span className="text-xs text-gray-400">{report.lastRun}</span></div><h3 className="font-bold text-gray-900 mb-1">{report.name}</h3><p className="text-sm text-gray-500 mb-4">{report.desc}</p><button onClick={() => handleRunReport(report.name)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Run Report</button></div>)) : (<div className="col-span-3 card text-center py-12"><div className="text-4xl mb-2">📈</div><p className="text-gray-500">No reports found</p></div>)}</div>
    </div>
  );
}
