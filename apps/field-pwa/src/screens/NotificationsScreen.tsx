import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, BellOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationsService } from '@bharatsales/api-client';
import type { AppNotification } from '@bharatsales/shared-types';

export function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The server derives the user from the auth token — this param is unused by the API.
    NotificationsService.getNotifications('')
      .then(setNotifications)
      .catch(() => setError('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 24 * 60) return `${Math.round(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleMarkRead = async (notif: AppNotification) => {
    if (notif.read) return;
    setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, read: true } : n)));
    try {
      await NotificationsService.markAsRead(notif.id);
    } catch {
      // best-effort — leave marked as read locally even if the sync fails
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-24">
      {/* Top App Bar */}
      <div className="bg-primary-600 px-5 pt-12 pb-4 flex items-center shadow-md sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="text-white mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold tracking-tight">Notifications</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <BellOff className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No notifications yet</h3>
            <p className="text-sm text-gray-500 mt-1">You'll see route assignments and order updates here.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleMarkRead(notif)}
              className={`w-full text-left bg-white p-4 rounded-xl shadow-sm border transition-colors ${notif.read ? 'border-gray-100' : 'border-primary-200 bg-primary-50/30'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-gray-100 text-gray-500' : 'bg-primary-100 text-primary-600'}`}>
                  <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-sm ${notif.read ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>{notif.title}</h3>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">{formatTime(notif.time)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
