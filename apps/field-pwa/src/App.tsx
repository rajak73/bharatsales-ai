import './App.css'
import { useSyncEngine } from './hooks/useSyncEngine'
import { MobileLayout } from './components/MobileLayout'
import { HomeScreen } from './screens/HomeScreen'
import { TodaysBeatScreen } from './screens/TodaysBeatScreen'
import { OrdersScreen } from './screens/OrdersScreen'
import { OutletsScreen } from './screens/OutletsScreen'
import { CatalogScreen } from './screens/CatalogScreen'
import { CartScreen } from './screens/CartScreen'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AttendanceProvider } from './contexts/AttendanceContext'
import { AttendanceScreen } from './screens/AttendanceScreen'
import { OutletVisitScreen } from './screens/OutletVisitScreen'
import { LoginScreen } from './screens/LoginScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { LogOut, User, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SyncEngine } from './sync/syncEngine'

function getCurrentUser(): { name?: string; email?: string; role?: string } {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return {};
    const user = JSON.parse(raw);
    return { name: user.name, email: user.email, role: user.role };
  } catch {
    return {};
  }
}

function ProfileScreen() {
  const { pendingCount, forceSync, isOnline } = useSyncEngine();
  const { logout } = useAuth();
  const [user] = useState(getCurrentUser);
  const initials = (user.name || user.email || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
          {initials || <User className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 truncate">{user.name || 'Sales Representative'}</p>
          <p className="text-sm text-gray-500 truncate">{user.email || 'No email on file'}</p>
          {user.role && (
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
              {user.role}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          <h3 className="font-semibold text-gray-900">Sync Status</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {isOnline ? (pendingCount > 0 ? `${pendingCount} item(s) waiting to sync.` : 'Everything is synced.') : 'Offline — changes will sync once you reconnect.'}
        </p>

        <button
          type="button"
          onClick={forceSync}
          disabled={!isOnline}
          className="w-full flex items-center justify-center gap-2 bg-primary-50 text-primary-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Force Sync Now
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { isOnline, pendingCount } = useSyncEngine();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isOnline) {
      SyncEngine.pullSync().catch(console.error);
    }
  }, [isAuthenticated, isOnline]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AttendanceProvider>
      <CartProvider>
        {/* Sync Status Banner — only visible while offline or actively syncing */}
        {(!isOnline || pendingCount > 0) && (
          <div
            className={`flex items-center justify-center gap-2 text-white text-xs font-semibold py-2 px-4 ${
              !isOnline ? 'bg-red-500' : 'bg-amber-500'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                Offline mode — {pendingCount} action{pendingCount === 1 ? '' : 's'} queued
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing {pendingCount} item{pendingCount === 1 ? '' : 's'} to the cloud...
              </>
            )}
          </div>
        )}

        <MobileLayout>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/beat" element={<TodaysBeatScreen />} />
            <Route path="/orders" element={<OrdersScreen />} />
            <Route path="/outlets" element={<OutletsScreen />} />
            <Route path="/catalog" element={<CatalogScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/attendance" element={<AttendanceScreen />} />
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/visit" element={<OutletVisitScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MobileLayout>
      </CartProvider>
    </AttendanceProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App


