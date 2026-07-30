import type { ReactNode } from 'react';
import { Home, Route as RouteIcon, Package, ClipboardCheck, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MobileLayoutProps {
  children: ReactNode;
}

const TABS = [
  { path: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' || p === '/home' },
  { path: '/beat', label: 'Beat', icon: RouteIcon, match: (p: string) => p.startsWith('/beat') },
  { path: '/orders', label: 'Orders', icon: Package, match: (p: string) => p.startsWith('/orders') },
  { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, match: (p: string) => p.startsWith('/attendance') },
  { path: '/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/profile') },
];

export function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find(tab => tab.match(location.pathname))?.label ?? '';

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-16">
      {/* Main Content Area - scrollable */}
      <main className="flex-1 overflow-y-auto w-full pt-12">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50">
        {TABS.map(({ path, label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === label ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
