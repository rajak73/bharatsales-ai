'use client';

import { useState, useEffect } from 'react';
import { NotificationsService } from '@bharatsales/api-client';
import { AppNotification } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationsService.getNotifications('user-1');
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || n.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationsService.markAsRead(id);
      setSuccessMessage('Notification marked as read');
      fetchNotifications();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationsService.markAllAsRead('user-1');
      setSuccessMessage('All notifications marked as read!');
      fetchNotifications();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return '📋';
      case 'approval': return '⚠️';
      case 'sync': return '🔄';
      case 'target': return '🎯';
      case 'expiry': return '⏰';
      case 'collection': return '💰';
      default: return '📢';
    }
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
        <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-gray-500">{unreadCount} unread notifications</p></div>
        <div className="flex space-x-3">
          <button onClick={handleMarkAllRead} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Mark All Read</button>
          <button className="btn-primary text-sm">Settings</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center"><div className="text-2xl font-bold text-gray-900">{notifications.length}</div><div className="text-sm text-gray-500">Total</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-red-600">{unreadCount}</div><div className="text-sm text-gray-500">Unread</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-600">{notifications.filter(n => n.read).length}</div><div className="text-sm text-gray-500">Read</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-primary-600">6</div><div className="text-sm text-gray-500">Templates</div></div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input type="text" placeholder="Search notifications..." className="input-field w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="input-field w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All Types</option><option>order</option><option>approval</option><option>sync</option><option>target</option><option>expiry</option><option>collection</option></select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div key={notif.id} className={`px-6 py-4 flex items-start space-x-3 ${!notif.read ? 'bg-primary-50' : ''}`}>
                <span className="text-xl mt-0.5">{getIcon(notif.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</span>
                    {!notif.read && <span className="w-2 h-2 bg-primary-600 rounded-full"></span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                  <span className="text-xs text-gray-400 mt-1">{notif.time}</span>
                </div>
                {!notif.read && (
                  <button onClick={() => handleMarkAsRead(notif.id)} className="text-primary-600 text-xs font-medium hover:text-primary-700">Mark Read</button>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400"><div className="text-4xl mb-2">🔔</div><p className="text-sm">No notifications found</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
