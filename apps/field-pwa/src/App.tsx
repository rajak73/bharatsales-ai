import './App.css'
import { useSyncEngine } from './hooks/useSyncEngine'
import { db } from './database/db'
import { MobileLayout } from './components/MobileLayout'
import { HomeScreen } from './screens/HomeScreen'
import { OutletsScreen } from './screens/OutletsScreen'
import { CatalogScreen } from './screens/CatalogScreen'
import { CartScreen } from './screens/CartScreen'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AttendanceProvider } from './contexts/AttendanceContext'
import { AttendanceScreen } from './screens/AttendanceScreen'
import { OutletVisitScreen } from './screens/OutletVisitScreen'
import { LoginScreen } from './screens/LoginScreen'
import { LogOut } from 'lucide-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function ProfileScreen() {
  const { pendingCount, forceSync } = useSyncEngine();
  const { logout } = useAuth();
  
  const handleAddFakeAction = async () => {
    await db.syncQueue.add({
      action: 'UPDATE_OUTLET',
      status: 'PENDING',
      createdAt: Date.now(),
      payload: { name: 'Fake Offline Outlet', location: { latitude: 0, longitude: 0 } }
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-2">Sync Status</h3>
        <p className="text-sm text-gray-500 mb-4">Pending items in queue: {pendingCount}</p>
        
        <div className="space-y-3">
          <button
            type="button"
            onClick={forceSync}
            className="w-full bg-primary-50 text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-100"
          >
            Force Sync Now
          </button>
          <button
            type="button"
            onClick={handleAddFakeAction}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Add Fake Action (For Testing)
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-100"
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

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AttendanceProvider>
      <CartProvider>
        {/* Sync Status Banner */}
        <div style={{
          backgroundColor: isOnline ? (pendingCount > 0 ? '#fbbf24' : '#10b981') : '#ef4444',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {!isOnline 
            ? `Offline mode active. (${pendingCount} pending)`
            : pendingCount > 0 
              ? `Syncing ${pendingCount} items to cloud...`
              : `Online and synced`}
        </div>

        <MobileLayout>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/outlets" element={<OutletsScreen />} />
            <Route path="/catalog" element={<CatalogScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/attendance" element={<AttendanceScreen />} />
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


