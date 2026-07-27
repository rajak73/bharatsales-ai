import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotificationsScreen() {
  const navigate = useNavigate();

  const dummyNotifications = [
    {
      id: 1,
      title: 'New Route Assigned',
      message: 'A new beat has been assigned to you for today.',
      time: '10 mins ago',
      read: false
    },
    {
      id: 2,
      title: 'Order Approved',
      message: 'Your order for Sharma Provision Store has been approved by the distributor.',
      time: '1 hour ago',
      read: true
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-24">
      {/* Top App Bar */}
      <div className="bg-[#2D3A8C] px-5 pt-12 pb-4 flex items-center shadow-md sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="text-white mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold tracking-tight">Notifications</h1>
      </div>

      <div className="p-4 space-y-4">
        {dummyNotifications.map((notif) => (
          <div key={notif.id} className={`bg-white p-4 rounded-xl shadow-sm border ${notif.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`text-sm ${notif.read ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>{notif.title}</h3>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{notif.time}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
