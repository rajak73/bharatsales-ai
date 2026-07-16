import { useState } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { Clock, MapPin, Loader2, CheckCircle2 } from 'lucide-react';

export function AttendanceScreen() {
  const { activeSession, startDay, endDay, isLoading } = useAttendance();
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAttendanceAction = async () => {
    setIsLocating(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          if (activeSession) {
            await endDay(loc);
          } else {
            await startDay(loc);
          }
        } catch (err) {
          setError('Failed to record attendance. Please try again.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setError(`Location access denied: ${error.message}. Please enable GPS.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Daily Attendance</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-8 text-center text-white ${activeSession ? 'bg-green-600' : 'bg-gray-800'}`}>
          {activeSession ? (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold">You are On Duty</h2>
              <p className="opacity-80 mt-2">Started at {new Date(activeSession.startTime).toLocaleTimeString()}</p>
            </>
          ) : (
            <>
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold">You are Off Duty</h2>
              <p className="opacity-80 mt-2">Start your day to unlock visits & orders</p>
            </>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="flex items-start gap-4 mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
            <MapPin className="w-6 h-6 flex-shrink-0 mt-0.5 text-blue-600" />
            <p className="text-sm">
              Your location is recorded during attendance to verify your starting and ending territory.
            </p>
          </div>

          <button
            onClick={handleAttendanceAction}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-lg font-bold transition-all
              ${activeSession 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl shadow-blue-600/20'
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLocating ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Getting Location...</>
            ) : activeSession ? (
              'End Day'
            ) : (
              'Start Day'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
