'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { SettingsService } from '@bharatsales/api-client';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [org, setOrg] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar defaults to expanded on desktop, but on mobile it's an
  // off-canvas drawer that should start (and stay) closed until opened.
  const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  useEffect(() => {
    if (isMobile()) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (isMobile()) setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      // Check authentication token
      const token = localStorage.getItem('bharatsales_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // The JWT only carries auth claims (sub/email/orgId/role/platformAdmin) —
      // display fields like the user's name live in the 'user' object AuthService
      // stores alongside the token at login, not in the token itself.
      const rawUser = localStorage.getItem('user');
      const storedUser = rawUser ? JSON.parse(rawUser) : null;

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padLength = (4 - (base64.length % 4)) % 4;
      const paddedBase64 = base64 + '='.repeat(padLength);
      const jsonPayload = decodeURIComponent(
        atob(paddedBase64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      const payload = JSON.parse(jsonPayload);

      const role = storedUser?.role || payload.role || 'Sales Representative';
      setUser({
        name: storedUser?.name || 'User',
        role,
        email: storedUser?.email || payload.email || ''
      });

      // Super Admin operates at the platform level, not inside a single
      // tenant, so it keeps the platform "BharatSales" brand instead of
      // fetching one organization's branding.
      if (role !== 'Super Admin' && !payload.platformAdmin) {
        SettingsService.getSettings()
          .then((settings) => setOrg({ name: settings.name, logoUrl: settings.branding?.logoUrl }))
          .catch((err) => console.error('Failed to fetch organization branding', err));
      }

      setLoading(false);
    } catch (e) {
      console.error('Failed to parse token', e);
      localStorage.removeItem('bharatsales_token');
      router.push('/login');
    }
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} user={user} org={org} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 transition-all duration-300 flex flex-col ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="p-6 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
