import type { ReactNode } from 'react';
import { Store, Package, User, ShoppingCart, Home } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'Home';
    if (path.startsWith('/outlets')) return 'Outlets';
    if (path.startsWith('/catalog')) return 'Catalog';
    if (path.startsWith('/cart')) return 'Cart';
    if (path.startsWith('/profile')) return 'Profile';
    return '';
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-16">
      {/* Main Content Area - scrollable */}
      <main className="flex-1 overflow-y-auto w-full pt-12">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === 'Home' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={() => navigate('/outlets')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === 'Outlets' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Store className="w-6 h-6" />
          <span className="text-[10px] font-medium">Outlets</span>
        </button>

        <button
          onClick={() => navigate('/catalog')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === 'Catalog' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-medium">Catalog</span>
        </button>

        <button
          onClick={() => navigate('/cart')}
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === 'Cart' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cart</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === 'Profile' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
}
