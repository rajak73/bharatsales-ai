'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('bharatsales_token');
      if (!token) {
        router.push('/login');
        return;
      }

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

      if (payload.platformAdmin === true) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    } catch (e) {
      console.error('Failed to parse token in superadmin layout', e);
      setAuthorized(false);
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center max-w-md mx-auto">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">
          You do not have permission to access the Super Admin Dashboard. Only platform administrators can view this section.
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-primary-600 text-white rounded font-medium hover:bg-primary-700 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
