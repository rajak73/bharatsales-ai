'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import AiChatbot from '../../components/AiChatbot';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Check authentication token
      const token = localStorage.getItem('bharatsales_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Decode JWT payload without external library
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      
      const payload = JSON.parse(jsonPayload);

      setUser({
        name: payload.name || 'User',
        role: payload.role || 'Sales Representative',
        email: payload.email || ''
      });
      setLoading(false);
    } catch (e) {
      console.error('Failed to parse token', e);
      localStorage.removeItem('bharatsales_token');
      router.push('/login');
    }
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030914]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030914] flex relative overflow-hidden font-sans">
      {/* Animated Mesh/Orb Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '10s' }}></div>
      <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[100px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '12s' }}></div>

      <Sidebar open={sidebarOpen} user={user} />
      
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 flex flex-col relative z-10`}>
        <Header 
          user={user} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        <main className="p-6 flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Floating AI Assistant */}
      <AiChatbot />
    </div>
  );
}
