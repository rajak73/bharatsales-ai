import { useState, useRef } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { Clock, MapPin, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { UploadsService } from '@bharatsales/api-client';
import { compressImage } from '../utils/image';

export function AttendanceScreen() {
  const { activeSession, startDay, endDay, isLoading } = useAttendance();
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfie(file);
    setSelfiePreviewUrl(URL.createObjectURL(file));
  };

  const handleAttendanceAction = async () => {
    if (!activeSession && !selfie) {
      setError('A selfie photo is required to start your day.');
      return;
    }

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
            const compressed = await compressImage(selfie!);
            const { url: photoUrl } = await UploadsService.uploadVisitPhoto(compressed, 'attendance-selfie.jpg');
            await startDay(loc, photoUrl);
            setSelfie(null);
            setSelfiePreviewUrl(null);
          }
        } catch {
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-8 pb-24">
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

          <div className="flex items-start gap-4 mb-8 p-4 bg-primary-50 rounded-xl border border-primary-100 text-primary-800">
            <MapPin className="w-6 h-6 flex-shrink-0 mt-0.5 text-primary-600" />
            <p className="text-sm">
              Your location is recorded during attendance to verify your starting and ending territory.
            </p>
          </div>

          {!activeSession && (
            <div className="mb-8 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleSelfieCapture}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium"
              >
                <Camera className="w-5 h-5" />
                {selfie ? 'Retake Selfie' : 'Take Selfie'}
              </button>
              {selfiePreviewUrl && (
                <img src={selfiePreviewUrl} alt="Selfie preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
              )}
            </div>
          )}

          <button
            onClick={handleAttendanceAction}
            disabled={isLocating || (!activeSession && !selfie)}
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-lg font-bold transition-all
              ${activeSession 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl shadow-primary-600/20'
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
