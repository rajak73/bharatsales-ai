/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '@bharatsales/api-client';

// This app is the Sales Representative field app — Super Admin/Organization
// Admin/Sales Manager are Web-only roles per the BRD, and Distributor doesn't
// have its own mobile app yet, so only a Sales Representative may use it here.
const ALLOWED_ROLE = 'Sales Representative';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredRole(): string | undefined {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw).role : undefined;
  } catch {
    return undefined;
  }
}

function clearSession() {
  localStorage.removeItem('bharatsales_token');
  localStorage.removeItem('bharatsales_refresh_token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists on mount, and that it belongs to an allowed role
    const token = localStorage.getItem('bharatsales_token');
    if (token && getStoredRole() === ALLOWED_ROLE) {
      setIsAuthenticated(true);
    } else if (token) {
      clearSession();
    }
    setIsInitializing(false);
  }, []);

  const login = async (credentials: any) => {
    // This calls the API client and sets localStorage if successful
    await AuthService.login(credentials);

    const token = localStorage.getItem('bharatsales_token');
    if (!token) {
      throw new Error('No token received');
    }

    const role = getStoredRole();
    if (role !== ALLOWED_ROLE) {
      clearSession();
      throw new Error('This app is for Sales Representatives only. Please use the BharatSales AI web dashboard for your role.');
    }

    setIsAuthenticated(true);
  };

  const logout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  if (isInitializing) {
    return null; // Or a nice splash screen loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
