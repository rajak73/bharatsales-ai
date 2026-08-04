import Link from 'next/link';
import { Menu, Search, Bell } from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center px-3 py-3">
        {/* Mobile-only: the sidebar is off-canvas below md, so this is the
            only way to open it there. Desktop has its own collapse toggle
            inside the sidebar itself. */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 mr-3 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors shrink-0"
          title={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search outlets, orders, products..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center ml-auto">
          <Link
            href="/dashboard/notifications"
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
