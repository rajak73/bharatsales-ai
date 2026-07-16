import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAttendance } from '../contexts/AttendanceContext';
import { VisitsService } from '@bharatsales/api-client';
import type { Outlet } from '@bharatsales/shared-types';
import { MapPin, CheckCircle2, AlertTriangle, Loader2, Navigation, ShoppingCart, IndianRupee } from 'lucide-react';
import CollectionScreen from './CollectionScreen';

export function OutletVisitScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const outlet = state?.outlet as Outlet;
  
  const { activeSession } = useAttendance();
  const [visitStatus, setVisitStatus] = useState<'pending' | 'checking_in' | 'checked_in'>('pending');
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [geofenceWarning, setGeofenceWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCollection, setShowCollection] = useState(false);

  if (!outlet) {
    return <div className="p-6">Outlet data not found</div>;
  }

  if (showCollection) {
    return <CollectionScreen outletId={outlet.id} onBack={() => setShowCollection(false)} />;
  }

  const handleCheckIn = async () => {
    if (!activeSession) {
      setError('You must start your day before checking into an outlet.');
      return;
    }

    setVisitStatus('checking_in');
    setError(null);
    setGeofenceWarning(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setVisitStatus('pending');
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
          
          const visit = await VisitsService.checkIn({
            outletId: outlet.id,
            ...loc
          });

          setActiveVisitId(visit._id);
          setVisitStatus('checked_in');

          if (!visit.isWithinGeofence) {
            setGeofenceWarning(`You checked in from ${visit.distanceFromOutlet}m away. This is outside the allowed radius and has been flagged.`);
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to check in');
          setVisitStatus('pending');
        }
      },
      () => {
        setError(`Location access denied. Please enable GPS to check in.`);
        setVisitStatus('pending');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckOut = async () => {
    if (!activeVisitId) return;
    try {
      await VisitsService.checkOut(activeVisitId);
      navigate(-1);
    } catch (err) {
      setError('Failed to check out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 px-6 pt-12 pb-6 text-white shadow-md rounded-b-3xl">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-blue-100 hover:text-white">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{outlet.name}</h1>
        <p className="opacity-90 flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4" /> {outlet.location?.address || 'Unknown Address'}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        {geofenceWarning && (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm font-medium">{geofenceWarning}</p>
          </div>
        )}

        {/* Visit Control Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Visit Status</h2>
          
          {visitStatus === 'checked_in' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-bold">Checked In</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/catalog', { state: { outletId: outlet.id } })}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100"
                >
                  <ShoppingCart className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Book Order</span>
                </button>
                <button 
                  onClick={() => setShowCollection(true)}
                  className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100"
                >
                  <IndianRupee className="w-6 h-6 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-700">Payment</span>
                </button>
                <button 
                  onClick={handleCheckOut}
                  className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 col-span-2"
                >
                  <Navigation className="w-6 h-6 text-red-600 mb-2" />
                  <span className="text-sm font-medium text-red-700">Check Out</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={visitStatus === 'checking_in'}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {visitStatus === 'checking_in' ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Checking in...</>
              ) : (
                <><MapPin className="w-6 h-6" /> Check In to Outlet</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
