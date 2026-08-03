import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { VisitsService } from '@bharatsales/api-client';
import { colors, formatCurrency } from '../../../src/lib/theme';
import { useCurrentAttendanceSession } from '../../../src/hooks/useAttendance';
import { getCurrentLocation } from '../../../src/hooks/useAttendance';
import { captureCameraPhoto, uploadCapturedPhoto } from '../../../src/lib/photoCapture';
import { useLocalOutlets } from '../../../src/hooks/useLocalData';
import { useCartStore } from '../../../src/store/cartStore';
import { callPhone, openWhatsApp, navigateToLocation } from '../../../src/lib/deepLinks';
import { Button } from '../../../src/components/ui';

export default function OutletVisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = useCurrentAttendanceSession();
  const { data: outlets = [] } = useLocalOutlets();
  const outlet: any = outlets.find((o: any) => o.id === id);
  const setOutlet = useCartStore((s) => s.setOutlet);

  const [status, setStatus] = useState<'pending' | 'checking_in' | 'checked_in'>('pending');
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [geofenceWarning, setGeofenceWarning] = useState('');
  const [busy, setBusy] = useState(false);

  if (!outlet) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Outlet not found in local cache. Pull to sync and try again.</Text>
      </SafeAreaView>
    );
  }

  const handleTakePhoto = async () => {
    setError('');
    try {
      const photo = await captureCameraPhoto();
      if (photo) setPhotoUri(photo.uri);
    } catch (err: any) {
      setError(err?.message || 'Failed to capture photo.');
    }
  };

  const handleCheckIn = async () => {
    if (!session) {
      setError('You must start your day before checking into an outlet.');
      return;
    }
    if (!photoUri) {
      setError('A shopfront photo is mandatory for check-in.');
      return;
    }
    setStatus('checking_in');
    setBusy(true);
    setError('');
    setGeofenceWarning('');
    try {
      const loc = await getCurrentLocation();
      const photoUrl = await uploadCapturedPhoto({ uri: photoUri }, `visit-${outlet.id}.jpg`);
      const visit: any = await VisitsService.checkIn({ outletId: outlet.id, ...loc, photoUrl });
      setActiveVisitId(visit._id || visit.id);
      setStatus('checked_in');
      if (!visit.isWithinGeofence) {
        setGeofenceWarning(`You checked in from ${visit.distanceFromOutlet}m away. This is outside the allowed radius and has been flagged.`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to check in');
      setStatus('pending');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeVisitId) return;
    setBusy(true);
    try {
      await VisitsService.checkOut(activeVisitId);
      router.back();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to check out');
    } finally {
      setBusy(false);
    }
  };

  const goToOrderBooking = () => {
    setOutlet(outlet.id);
    router.push('/(rep)/catalog');
  };

  const outstanding = outlet?.commercial?.outstandingBalance;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.outletName}>{outlet.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.addressText}>{outlet.location?.address || 'Unknown Address'}</Text>
          </View>
          <View style={styles.quickContactRow}>
            {outlet.mobile && (
              <>
                <TouchableOpacity style={styles.quickContactBtn} onPress={() => callPhone(outlet.mobile)}>
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={styles.quickContactText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickContactBtn} onPress={() => openWhatsApp(outlet.mobile)}>
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={styles.quickContactText}>WhatsApp</Text>
                </TouchableOpacity>
              </>
            )}
            {outlet.location?.latitude && outlet.location?.longitude && (
              <TouchableOpacity
                style={styles.quickContactBtn}
                onPress={() => navigateToLocation(outlet.location.latitude, outlet.location.longitude, outlet.name)}
              >
                <Ionicons name="navigate" size={16} color="#fff" />
                <Text style={styles.quickContactText}>Navigate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {geofenceWarning ? (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={18} color="#B45309" />
              <Text style={styles.warningText}>{geofenceWarning}</Text>
            </View>
          ) : null}

          {outstanding !== undefined && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Outstanding Balance</Text>
              <Text style={styles.balanceValue}>{formatCurrency(outstanding)}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Visit Status</Text>

            {status === 'checked_in' ? (
              <View>
                <View style={styles.checkedInBanner}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <Text style={styles.checkedInText}>Checked In</Text>
                </View>
                <View style={styles.actionGrid}>
                  <TouchableOpacity style={styles.gridButton} onPress={goToOrderBooking}>
                    <Ionicons name="cart" size={22} color={colors.primary} />
                    <Text style={styles.gridButtonText}>Book Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.gridButton, { backgroundColor: colors.successLight }]} onPress={() => router.push({ pathname: '/(rep)/collection', params: { outletId: outlet.id } })}>
                    <Ionicons name="cash" size={22} color={colors.success} />
                    <Text style={[styles.gridButtonText, { color: colors.success }]}>Payment</Text>
                  </TouchableOpacity>
                </View>
                <Button
                  label="Check Out"
                  onPress={handleCheckOut}
                  loading={busy}
                  variant="danger"
                  icon={<Ionicons name="exit" size={20} color={colors.danger} />}
                />
              </View>
            ) : (
              <View>
                <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                  <Ionicons name="camera" size={18} color={colors.text} />
                  <Text style={styles.photoButtonText}>{photoUri ? 'Retake Shopfront Photo' : 'Take Shopfront Photo'}</Text>
                </TouchableOpacity>
                {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
                <Button
                  label="Check In to Outlet"
                  onPress={handleCheckIn}
                  loading={status === 'checking_in'}
                  disabled={!photoUri}
                  icon={<Ionicons name="location" size={20} color="#fff" />}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.9)', marginLeft: 2 },
  outletName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  addressText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  quickContactRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickContactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  quickContactText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { padding: 20, gap: 16 },
  error: { backgroundColor: colors.dangerLight, color: colors.danger, padding: 12, borderRadius: 10, fontSize: 13 },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.warningLight, borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 14 },
  warningText: { flex: 1, color: '#92400E', fontSize: 13, fontWeight: '500' },
  balanceCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  balanceLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  balanceValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16 },
  checkedInBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successLight, padding: 14, borderRadius: 12, marginBottom: 16 },
  checkedInText: { color: colors.success, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridButton: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 14, alignItems: 'center', paddingVertical: 18, gap: 6 },
  gridButtonText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  checkOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.dangerLight, borderRadius: 14, paddingVertical: 14 },
  checkOutText: { color: colors.danger, fontWeight: '700' },
  photoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, marginBottom: 12 },
  photoButtonText: { fontWeight: '600', color: colors.text },
  preview: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  checkInButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16 },
  checkInText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
