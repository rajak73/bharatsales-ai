'use client';

import { useState, useEffect, useMemo } from 'react';
import { HierarchyService, UsersService } from '@bharatsales/api-client';
import { HierarchyNode, HierarchyLevel, User } from '@bharatsales/shared-types';
import { Network, Plus, Map, MapPin, ChevronRight, Users as UsersIcon, Loader2 } from 'lucide-react';

export default function HierarchyPage() {
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Selection state
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  // New Node Form State
  const [newNode, setNewNode] = useState<{
    name: string;
    level: HierarchyLevel;
    parentId: string;
    managerId: string;
  }>({ name: '', level: 'Zone', parentId: '', managerId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hierarchyData, usersData] = await Promise.all([
        HierarchyService.getHierarchyNodes(),
        UsersService.getUsers('org-123')
      ]);
      setNodes(hierarchyData || []);
      // Filter out only managers (Area Managers, etc)
      setManagers(usersData?.filter((u: User) => ['Area Manager', 'Company Admin', 'Sales Representative'].includes(u.role)) || []);
    } catch (error) {
      console.error('Failed to fetch hierarchy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const zones = useMemo(() => nodes.filter(n => n.level === 'Zone'), [nodes]);
  const regions = useMemo(() => nodes.filter(n => n.level === 'Region' && n.parentId === selectedZone), [nodes, selectedZone]);
  const areas = useMemo(() => nodes.filter(n => n.level === 'Area' && n.parentId === selectedRegion), [nodes, selectedRegion]);
  const territories = useMemo(() => nodes.filter(n => n.level === 'Territory' && n.parentId === selectedArea), [nodes, selectedArea]);

  const handleAddNode = async () => {
    try {
      if (!newNode.name) return;
      
      await HierarchyService.createNode({
        name: newNode.name,
        level: newNode.level,
        parentId: newNode.parentId || undefined,
        managerId: newNode.managerId || undefined,
        status: 'Active'
      });
      
      setSuccessMessage(`${newNode.level} "${newNode.name}" created successfully!`);
      setShowAddModal(false);
      setNewNode({ name: '', level: 'Zone', parentId: '', managerId: '' });
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating node:', error);
      alert('Failed to create node');
    }
  };

  const openModalFor = (level: HierarchyLevel, parentId: string) => {
    setNewNode({ name: '', level, parentId, managerId: '' });
    setShowAddModal(true);
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Unassigned';
    return managers.find(m => m.id === managerId)?.name || 'Unknown';
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <Network className="w-6 h-6 text-primary-600" />
             Organizational Hierarchy
          </h1>
          <p className="text-gray-500">Manage Zones, Regions, Areas, and Territories</p>
        </div>
        <button onClick={() => openModalFor('Zone', '')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Zone
        </button>
      </div>

      {/* Hierarchy Browser */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px]">
        {/* ZONES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <h3 className="font-bold text-gray-900 flex items-center gap-2"><Map className="w-4 h-4" /> Zones</h3>
             <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{zones.length}</span>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {zones.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No Zones found</p>}
             {zones.map(zone => (
               <div 
                 key={zone.id} 
                 onClick={() => { setSelectedZone(zone.id); setSelectedRegion(null); setSelectedArea(null); setSelectedTerritory(null); }}
                 className={`p-3 rounded-lg border cursor-pointer transition-all ${
                   selectedZone === zone.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50'
                 }`}
               >
                 <div className="flex justify-between items-center mb-1">
                   <span className="font-bold text-sm text-gray-900">{zone.name}</span>
                   <ChevronRight className={`w-4 h-4 ${selectedZone === zone.id ? 'text-primary-600' : 'text-gray-400'}`} />
                 </div>
                 <div className="flex items-center gap-1 text-xs text-gray-500">
                   <UsersIcon className="w-3 h-3" /> {getManagerName(zone.managerId)}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* REGIONS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <h3 className="font-bold text-gray-900 flex items-center gap-2"><Map className="w-4 h-4" /> Regions</h3>
             {selectedZone && (
               <button onClick={() => openModalFor('Region', selectedZone)} className="text-primary-600 hover:bg-primary-50 p-1 rounded transition-colors">
                 <Plus className="w-4 h-4" />
               </button>
             )}
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {!selectedZone ? (
                <p className="text-sm text-gray-400 text-center py-4">Select a Zone first</p>
             ) : regions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-2">No Regions in this Zone</p>
                  <button onClick={() => openModalFor('Region', selectedZone)} className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100">Add Region</button>
                </div>
             ) : (
                regions.map(region => (
                  <div 
                    key={region.id} 
                    onClick={() => { setSelectedRegion(region.id); setSelectedArea(null); setSelectedTerritory(null); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRegion === region.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-gray-900">{region.name}</span>
                      <ChevronRight className={`w-4 h-4 ${selectedRegion === region.id ? 'text-primary-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <UsersIcon className="w-3 h-3" /> {getManagerName(region.managerId)}
                    </div>
                  </div>
                ))
             )}
           </div>
        </div>

        {/* AREAS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <h3 className="font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Areas</h3>
             {selectedRegion && (
               <button onClick={() => openModalFor('Area', selectedRegion)} className="text-primary-600 hover:bg-primary-50 p-1 rounded transition-colors">
                 <Plus className="w-4 h-4" />
               </button>
             )}
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {!selectedRegion ? (
                <p className="text-sm text-gray-400 text-center py-4">Select a Region first</p>
             ) : areas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-2">No Areas in this Region</p>
                  <button onClick={() => openModalFor('Area', selectedRegion)} className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100">Add Area</button>
                </div>
             ) : (
                areas.map(area => (
                  <div 
                    key={area.id} 
                    onClick={() => { setSelectedArea(area.id); setSelectedTerritory(null); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedArea === area.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-gray-900">{area.name}</span>
                      <ChevronRight className={`w-4 h-4 ${selectedArea === area.id ? 'text-primary-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <UsersIcon className="w-3 h-3" /> {getManagerName(area.managerId)}
                    </div>
                  </div>
                ))
             )}
           </div>
        </div>

        {/* TERRITORIES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <h3 className="font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Territories</h3>
             {selectedArea && (
               <button onClick={() => openModalFor('Territory', selectedArea)} className="text-primary-600 hover:bg-primary-50 p-1 rounded transition-colors">
                 <Plus className="w-4 h-4" />
               </button>
             )}
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {!selectedArea ? (
                <p className="text-sm text-gray-400 text-center py-4">Select an Area first</p>
             ) : territories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-2">No Territories in this Area</p>
                  <button onClick={() => openModalFor('Territory', selectedArea)} className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100">Add Territory</button>
                </div>
             ) : (
                territories.map(territory => (
                  <div 
                    key={territory.id} 
                    onClick={() => { setSelectedTerritory(territory.id); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTerritory === territory.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-gray-900">{territory.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <UsersIcon className="w-3 h-3" /> {getManagerName(territory.managerId)}
                    </div>
                  </div>
                ))
             )}
           </div>
        </div>

      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Add New {newNode.level}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{newNode.level} Name *</label>
                   <input
                     type="text"
                     placeholder={`e.g., North ${newNode.level}`}
                     className="input-field"
                     value={newNode.name}
                     onChange={e => setNewNode({ ...newNode, name: e.target.value })}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Assign Manager</label>
                   <select
                     className="input-field"
                     value={newNode.managerId}
                     onChange={e => setNewNode({ ...newNode, managerId: e.target.value })}
                   >
                     <option value="">-- Unassigned --</option>
                     {managers.map(m => (
                       <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                     ))}
                   </select>
                   <p className="text-xs text-gray-400 mt-1">Users in this node will report to this manager.</p>
                </div>
             </div>

             <div className="flex space-x-3 mt-8">
               <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Cancel</button>
               <button 
                 onClick={handleAddNode}
                 disabled={!newNode.name}
                 className="flex-1 btn-primary disabled:opacity-50"
               >
                 Create {newNode.level}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
