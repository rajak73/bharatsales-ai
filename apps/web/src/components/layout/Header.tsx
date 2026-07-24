import { Menu, Search, Bell, LogOut } from 'lucide-react';
import { AuthService } from '@bharatsales/api-client';

interface HeaderProps {
  user: { name: string; role: string; email: string };
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ user, sidebarOpen, setSidebarOpen }: HeaderProps) {
  const handleLogout = () => {
    AuthService.logout();
  };

  return (
    <header className="bg-white/5 border-b border-white/10 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search outlets, orders, products..." 
              className="w-80 pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:bg-black/40 transition-all outline-none" 
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
            <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <span className="text-cyan-400 font-medium text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-gray-400">{user.role}</div>
            </div>
            <button 
              onClick={handleLogout} 
              className="ml-2 p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors" 
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
