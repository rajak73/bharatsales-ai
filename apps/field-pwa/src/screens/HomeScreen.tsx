import { Bell, Store, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TargetsService } from '@bharatsales/api-client';

export function HomeScreen() {

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const targets = await TargetsService.getTargets();
        let userId = 'unknown';
        try {
          const token = localStorage.getItem('bharatsales_token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
          }
        } catch {
          // ignore parsing error
        }

        const myTarget = targets.find(t => t.entityType === 'User' && t.entityId === userId && t.period === 'Daily');
          setTargetData({
            goal: myTarget.targetValue || 0,
            achieved: myTarget.achievedValue || 0,
            percentage: myTarget.targetValue ? Math.round(((myTarget.achievedValue || 0) / myTarget.targetValue) * 100) : 0,
            shopsVisited: 0,
            totalShops: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch target', err);
      }
    };
    fetchTarget();
  }, []);

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const [targetData, setTargetData] = useState({
    goal: 0,
    achieved: 0,
    percentage: 0,
    shopsVisited: 0,
    totalShops: 0,
  });

  const smartBeatOutlets = [
    {
      id: '1',
      name: 'Sharma Provision Store',
      location: 'Sector 12',
      status: 'visited',
      visitedAt: '9:15 AM',
      amount: 8500,
      highValue: false,
    },
    {
      id: '2',
      name: 'Rahul General Traders',
      location: 'Sector 14, Karol Bagh',
      status: 'pending',
      potential: 18500,
      highValue: true,
    },
    {
      id: '3',
      name: 'Pooja Stationery',
      location: 'Sector 18',
      status: 'skipped', // or pending visited
      visitedAt: '9:45 AM',
      highValue: false,
    },
    {
      id: '4',
      name: 'Jai Hind Sweets',
      location: 'Upcoming',
      status: 'upcoming',
      highValue: false,
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-24">
      {/* Top App Bar */}
      <div className="bg-[#2D3A8C] px-5 pt-12 pb-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            {/* Approximating the B with chart arrow logo */}
            <div className="text-[#2D3A8C] font-bold text-lg italic tracking-tighter flex">
              <span className="relative">
                B
                <div className="absolute -top-[2px] -right-[6px] w-2 h-2 border-t border-r border-cyan-400 transform -rotate-45"></div>
              </span>
            </div>
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight">BharatSales AI</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm border border-white/30">
            RA
          </div>
          <button className="text-white relative">
            <Bell size={22} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#2D3A8C] rounded-full"></span>
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        
        {/* Target Progress Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-[#1E293B] text-lg font-bold mb-4">Today's Target Progress</h2>
          
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Goal</p>
              <p className="text-[#1E293B] font-bold">{formatCurrency(targetData.goal)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Achieved</p>
              <p className="text-[#1E293B] font-bold">{formatCurrency(targetData.achieved)}</p>
            </div>
          </div>

          <div className="relative h-6 w-full bg-[#E2E8F0] rounded-full overflow-hidden mb-4 shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-[#2D3A8C] rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
              style={{ width: `${targetData.percentage}%` }}
            >
              <span className="text-white text-xs font-bold">{targetData.percentage}%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-[#64748B]">Status: <span className="text-green-600 font-bold">On Track! Keep going!</span></p>
            <p className="text-xs font-bold text-[#1E293B] bg-slate-100 px-2.5 py-1 rounded-lg">
              {targetData.shopsVisited}/{targetData.totalShops} Shops Visited
            </p>
          </div>
        </div>

        {/* Smart Beat Section */}
        <div>
          <h2 className="text-[#1E293B] text-xl font-bold">Smart Beat</h2>
          <p className="text-[#64748B] text-sm mt-1 mb-4">Retail shops on today's route</p>

          <div className="space-y-3">
            {smartBeatOutlets.map((outlet) => (
              <div key={outlet.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                
                {/* High Value Badge */}
                {outlet.highValue && (
                  <div className="absolute top-3 right-3 bg-[#1E293B] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                    ⭐ High Value
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    outlet.status === 'visited' ? 'bg-green-100 text-green-600' :
                    outlet.status === 'pending' ? 'bg-[#E0E7FF] text-[#2D3A8C]' :
                    outlet.status === 'skipped' ? 'bg-red-50 text-red-500' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    <Store size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="font-bold text-[#1E293B] truncate pr-2">{outlet.name}</h3>
                    
                    {outlet.status === 'visited' && (
                      <>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-[#64748B]">Visited {outlet.visitedAt}</p>
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <p className="text-sm font-bold text-[#1E293B] mt-1 text-right absolute right-4 bottom-4">
                          {formatCurrency(outlet.amount!)}
                        </p>
                      </>
                    )}

                    {outlet.status === 'pending' && (
                      <>
                        <p className="text-xs text-[#64748B] mt-0.5 truncate">{outlet.location}</p>
                        <p className="text-xs text-[#64748B] mt-1">
                          Pending Order<br />
                          Potential: <span className="font-bold text-[#1E293B]">{formatCurrency(outlet.potential!)}</span>
                        </p>
                        <button className="mt-3 bg-[#E0E7FF] text-[#2D3A8C] font-bold text-xs px-4 py-2 rounded-lg hover:bg-[#C7D2FE] transition-colors">
                          Visit Now
                        </button>
                      </>
                    )}

                    {outlet.status === 'skipped' && (
                      <>
                        <p className="text-xs font-bold text-[#64748B] absolute right-4 top-4">Pending</p>
                        <p className="text-xs text-[#64748B] mt-0.5">Visited {outlet.visitedAt}</p>
                        <p className="text-xs text-[#64748B] mt-0.5 truncate">{outlet.location}</p>
                      </>
                    )}

                    {outlet.status === 'upcoming' && (
                      <>
                        <p className="text-xs font-bold text-[#64748B] absolute right-4 top-4">Upcoming</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

