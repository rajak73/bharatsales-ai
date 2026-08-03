import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { AttendanceService } from '@bharatsales/api-client';
import { enqueue } from '../db/syncQueue';

const SESSION_QUERY_KEY = ['attendance', 'current'];
const BACKGROUND_PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes, matches field-pwa

export function useCurrentAttendanceSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => AttendanceService.getCurrentSession(),
    staleTime: 60_000,
  });
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number; accuracy: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Please enable GPS to continue.');
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy ?? 0,
  };
}

// Mirrors field-pwa's AttendanceContext: startDay/endDay call the backend
// directly (not offline-queued — attendance is a point-in-time event best
// attempted live), while background location pings while a shift is active
// go through the offline sync queue so they survive connectivity gaps.
export function useAttendanceActions() {
  const queryClient = useQueryClient();

  const startDay = async (photoUrl?: string) => {
    const loc = await getCurrentLocation();
    const session = await AttendanceService.startDay({ ...loc, deviceTimestamp: new Date().toISOString(), photoUrl });
    queryClient.setQueryData(SESSION_QUERY_KEY, session);
    return session;
  };

  const endDay = async () => {
    const loc = await getCurrentLocation();
    await AttendanceService.endDay(loc);
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
  };

  return { startDay, endDay };
}

// Queues a CREATE_LOCATION_PING every 5 minutes while a session is active,
// exactly like field-pwa's AttendanceContext background-tracking effect.
export function useBackgroundLocationTracking(activeSessionId: string | null | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeSessionId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await enqueue('CREATE_LOCATION_PING', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 0,
          deviceTimestamp: new Date().toISOString(),
          attendanceSession: activeSessionId,
        });
      } catch (err) {
        console.warn('[Attendance] Background tracking ping failed', err);
      }
    }, BACKGROUND_PING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeSessionId]);
}
