import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AttendanceService } from '@bharatsales/api-client';
import type { AttendanceSession } from '@bharatsales/shared-types';
import { useAuth } from './AuthContext';

interface AttendanceContextType {
  activeSession: AttendanceSession | null;
  isLoading: boolean;
  startDay: (location: { lat: number; lng: number; accuracy: number }) => Promise<void>;
  endDay: (location: { lat: number; lng: number; accuracy: number }) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

import { db } from '../database/db';

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const refreshSession = async () => {
    if (!isAuthenticated) return;
    try {
      const session = await AttendanceService.getCurrentSession();
      setActiveSession(session);
    } catch (error) {
      console.error('Failed to fetch attendance session', error);
      setActiveSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, [isAuthenticated]);

  // Live Tracking Interval
  useEffect(() => {
    if (!activeSession) return;

    // Track every 5 minutes (300000ms)
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              deviceTimestamp: new Date().toISOString(),
              attendanceSession: (activeSession as any).id || (activeSession as any)._id
            };
            
            // Queue ping for background sync
            await db.syncQueue.add({
              action: 'CREATE_LOCATION_PING',
              payload: loc,
              status: 'PENDING',
              createdAt: Date.now()
            });
          },
          (err) => console.warn('Background tracking failed:', err.message),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const startDay = async (location: { lat: number; lng: number; accuracy: number }) => {
    setIsLoading(true);
    try {
      const session = await AttendanceService.startDay({
        ...location,
        deviceTimestamp: new Date().toISOString()
      });
      setActiveSession(session);
    } catch (error) {
      console.error('Failed to start day', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const endDay = async (location: { lat: number; lng: number; accuracy: number }) => {
    setIsLoading(true);
    try {
      await AttendanceService.endDay(location);
      setActiveSession(null);
    } catch (error) {
      console.error('Failed to end day', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AttendanceContext.Provider value={{ activeSession, isLoading, startDay, endDay, refreshSession }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
