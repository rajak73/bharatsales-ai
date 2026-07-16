import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '@bharatsales/api-client';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists on mount
    const token = localStorage.getItem('bharatsales_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsInitializing(false);
  }, []);

  const login = async (credentials: any) => {
    // This calls the API client and sets localStorage if successful
    await AuthService.login(credentials);
    
    const token = localStorage.getItem('bharatsales_token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      throw new Error('No token received');
    }
  };

  const logout = () => {
    localStorage.removeItem('bharatsales_token');
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
