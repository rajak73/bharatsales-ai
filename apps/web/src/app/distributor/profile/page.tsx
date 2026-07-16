'use client';

import { useState } from 'react';

export default function DistributorProfilePage() {
  const [successMessage, setSuccessMessage] = useState('');
  const [profile, setProfile] = useState({ name: 'Royal Distributors', owner: 'Vikram Royal', gstin: '29AAECR1234F1Z5', address: 'Industrial Area, Phase 2, Bangalore', state: 'Karnataka', pin: '560001', mobile: '+91 98765 43210', email: 'royal@distributors.com', territory: 'Zone A & B' });
  const [staff, setStaff] = useState([{ name: 'Rajesh Kumar', role: 'Manager', mobile: '+91 98765 43220', status: 'Active' }, { name: 'Priya Patel', role: 'Packer', mobile: '+91 98765 43221', status: 'Active' }, { name: 'Amit Singh', role: 'Driver', mobile: '+91 98765 43222', status: 'Active' }]);

  const handleSave = () => { setSuccessMessage('Profile updated successfully!'); setTimeout(() => setSuccessMessage(''), 3000); };
  const handleAddStaff = () => { setSuccessMessage('Staff member added!'); setTimeout(() => setSuccessMessage(''), 3000); };

  return (
    <div className="space-y-6">
      {successMessage && (<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div><button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button></div>)}

      <div><h1 className="text-2xl font-bold text-gray-900">Distributor Profile</h1><p className="text-gray-500">Manage your distributor profile and staff</p></div>

      <div className="card"><div className="flex items-start space-x-6"><div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center"><span className="text-3xl font-bold text-primary-700">RD</span></div><div className="flex-1 grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Name:</span> <span className="font-medium">{profile.name}</span></div><div><span className="text-gray-500">Owner:</span> <span className="font-medium">{profile.owner}</span></div><div><span className="text-gray-500">GSTIN:</span> <span className="font-medium">{profile.gstin}</span></div><div><span className="text-gray-500">Territory:</span> <span className="font-medium">{profile.territory}</span></div></div></div><button onClick={handleSave} className="btn-primary text-sm mt-4">Save Changes</button></div>

      <div className="card"><h3 className="font-bold text-gray-900 mb-4">Territory Mapping</h3><div className="grid grid-cols-2 gap-4"><div><h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Territories</h4><div className="space-y-2">{['Zone A - Beat 1', 'Zone A - Beat 2', 'Zone A - Beat 3', 'Zone B - Beat 1', 'Zone B - Beat 2'].map((beat) => (<div key={beat} className="flex items-center justify-between p-2 bg-gray-50 rounded"><span className="text-sm">{beat}</span><span className="text-xs text-green-600">Active</span></div>))}</div></div><div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-gray-400">Territory Map</span></div></div></div>

      <div className="card overflow-hidden p-0"><div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-900">Staff Users</h3><button onClick={handleAddStaff} className="btn-primary text-sm py-2">+ Add Staff</button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Role</th><th className="px-6 py-3 font-medium">Mobile</th><th className="px-6 py-3 font-medium">Status</th></tr></thead><tbody>{staff.map((member) => (<tr key={member.name} className="border-t border-gray-100"><td className="px-6 py-3 font-medium text-gray-900">{member.name}</td><td className="px-6 py-3 text-gray-600">{member.role}</td><td className="px-6 py-3 text-gray-600">{member.mobile}</td><td className="px-6 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{member.status}</span></td></tr>))}</tbody></table></div></div>
    </div>
  );
}
