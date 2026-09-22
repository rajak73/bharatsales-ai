import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { VisitsService } from '@bharatsales/api-client';
import { colors, formatCurrency } from '../../../src/lib/theme';
import { radius, spacing, typography, touchTarget } from '../../../src/theme/tokens';
import { useOrgStore } from '../../../src/store/orgStore';
import { useCurrentAttendanceSession, getCurrentLocation } from '../../../src/hooks/useAttendance';
import { captureCameraPhoto, uploadCapturedPhoto } from '../../../src/lib/photoCapture';
import { useLocalOutlets } from '../../../src/hooks/useLocalData';
import { useCartStore } from '../../../src/store/cartStore';
import { callPhone, openWhatsApp, navigateToLocation } from '../../../src/lib/deepLinks';
import { Button, Banner, Card, EmptyState, IconButton, ScreenHeader, StatusPill } from '../../../src/components/ui';
import { useSessionStore } from '../../../src/store/sessionStore';
import { getStoredActiveVisit, setStoredActiveVisit, clearStoredActiveVisit, uuidV4 } from '../../../src/lib/activeVisit';

// Event-handler timestamp; kept out of the component body so the React
// compiler lint doesn't treat it as an impure call during render.
const nowMs = () => Date.now();

export default function OutletVisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = useCurrentAttendanceSession();
  const { data: outlets = [] } = useLocalOutlets();
  const outlet: any = outlets.find((o: any) => o.id === id);
  const setOutlet = useCartStore((s) => s.setOutlet);
  const orgPrimaryColor = useOrgStore((s) => s.primaryColor);

  const [status, setStatus] = useState<'pending' | 'checking_in' | 'checked_in'>('pending');
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [geofenceWarning, setGeofenceWarning] = useState('');
  const [busy, setBusy] = useState(false);
  const userId = useSessionStore((s) => (s.user as any)?.id ?? (s.user as any)?._id);
  // One idempotency key per check-in attempt. It is kept across retries of
  // the same attempt (e.g. the request reached the server but the response
  // was lost to a timeout) so the server returns the visit it already
  // created instead of making a duplicate, and reset once check-in succeeds.
  const checkInKeyRef = useRef<string | null>(null);

  // Restore an active visit for this outlet so Check Out still works after
  // navigating away or an app restart.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getStoredActiveVisit(id, userId).then((stored) => {
      if (cancelled || !stored) return;
      setActiveVisitId(stored.visitId);
      setStatus('checked_in');
    });
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  if (!outlet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Outlet" />
        <View style={styles.body}>
          <EmptyState
            icon="storefront-outline"
            title="Outlet not found"
            message="This outlet isn't in your offline data yet. Go back and pull down to sync, then try again."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
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
      if (!checkInKeyRef.current) checkInKeyRef.current = uuidV4();
      const visit: any = await VisitsService.checkIn({ outletId: outlet.id, ...loc, photoUrl, idempotencyKey: checkInKeyRef.current });
      const visitId = String(visit._id || visit.id);
      checkInKeyRef.current = null;
      setActiveVisitId(visitId);
      setStatus('checked_in');
      await setStoredActiveVisit({ outletId: outlet.id, visitId, userId, checkedInAt: nowMs() });
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
      await clearStoredActiveVisit();
      router.back();
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 404) {
        // The server no longer considers this visit active (already checked
        // out elsewhere / auto-closed) — drop the stale id so the rep can
        // check in again instead of being stuck.
        await clearStoredActiveVisit();
        setActiveVisitId(null);
        setStatus('pending');
      }
      setError(err?.response?.data?.message || err?.message || 'Failed to check out');
    } finally {
      setBusy(false);
    }
  };

  const goToOrderBooking = () => {
    setOutlet(outlet.id);
    router.push('/(rep)/catalog');
  };

  const outstanding = outlet?.commercial?.outstandingBalance;

  const hasCoords = !!(outlet.location?.latitude && outlet.location?.longitude);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: orgPrimaryColor || colors.navy }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={[styles.header, { backgroundColor: orgPrimaryColor || colors.navy }]}>
          <View style={styles.headerTop}>
            <IconButton icon="chevron-back" size={24} tone="onBrand" onPress={() => router.back()} accessibilityLabel="Go back" />
            {status === 'checked_in' ? (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Visit in progress</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.outletName} accessibilityRole="header">{outlet.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.addressText}>{outlet.location?.address || 'Address not available'}</Text>
          </View>
          {(outlet.mobile || hasCoords) && (
            <View style={styles.quickContactRow}>
              {outlet.mobile && (
                <>
                  <ContactButton icon="call" label="Call" onPress={() => callPhone(outlet.mobile)} a11y={`Call ${outlet.name}`} />
                  <ContactButton icon="logo-whatsapp" label="WhatsApp" onPress={() => openWhatsApp(outlet.mobile)} a11y={`WhatsApp ${outlet.name}`} />
                </>
              )}
              {hasCoords && (
                <ContactButton
                  icon="navigate"
                  label="Navigate"
                  onPress={() => navigateToLocation(outlet.location.latitude, outlet.location.longitude, outlet.name)}
                  a11y={`Navigate to ${outlet.name}`}
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {error ? <Banner tone="danger" message={error} /> : null}
          {geofenceWarning ? <Banner tone="warning" title="Outside geofence" message={geofenceWarning} /> : null}

          {outstanding !== undefined && (
            <Card style={styles.balanceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                <Text style={styles.balanceValue}>{formatCurrency(outstanding)}</Text>
              </View>
              {Number(outstanding) > 0 ? <StatusPill label="Due" tone="warning" /> : <StatusPill label="Clear" tone="success" />}
            </Card>
          )}

          <Card>
            <Text style={styles.cardTitle}>Visit</Text>

            {status === 'checked_in' ? (
              <View style={{ gap: spacing.lg }}>
                <Banner tone="success" message="You're checked in. Book an order or record a payment, then check out." />
                <View style={styles.actionGrid}>
                  <Pressable
                    style={({ pressed }) => [styles.gridButton, pressed && { opacity: 0.8 }]}
                    onPress={goToOrderBooking}
                    accessibilityRole="button"
                    accessibilityLabel="Book order"
                  >
                    <View style={[styles.gridIcon, { backgroundColor: colors.primary }]}><Ionicons name="cart" size={22} color="#fff" /></View>
                    <Text style={styles.gridButtonText}>Book Order</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.gridButton, { backgroundColor: colors.successLight, borderColor: colors.successBorder }, pressed && { opacity: 0.8 }]}
                    onPress={() => router.push({ pathname: '/(rep)/collection', params: { outletId: outlet.id } })}
                    accessibilityRole="button"
                    accessibilityLabel="Record payment"
                  >
                    <View style={[styles.gridIcon, { backgroundColor: colors.success }]}><Ionicons name="cash" size={22} color="#fff" /></View>
                    <Text style={[styles.gridButtonText, { color: colors.success }]}>Collect Payment</Text>
                  </Pressable>
                </View>
                <Button
                  label="Check Out"
                  onPress={handleCheckOut}
                  loading={busy}
                  variant="danger"
                  icon={<Ionicons name="exit-outline" size={20} color={colors.danger} />}
                />
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                {!session ? (
                  <Banner
                    tone="warning"
                    message="Start your day before checking into an outlet."
                    action={{ label: 'Start Day', onPress: () => router.push('/(rep)/attendance') }}
                  />
                ) : null}
                <Text style={styles.stepLabel}>Step 1 · Shopfront photo</Text>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.preview} accessibilityLabel="Shopfront photo preview" />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Ionicons name="image-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.placeholderText}>Required for check-in</Text>
                  </View>
                )}
                <Button
                  label={photoUri ? 'Retake Photo' : 'Take Shopfront Photo'}
                  onPress={handleTakePhoto}
                  variant={photoUri ? 'ghost' : 'secondary'}
                  icon={<Ionicons name="camera" size={20} color={photoUri ? colors.text : colors.primary} />}
                />
                <Text style={styles.stepLabel}>Step 2 · Check in</Text>
                <Button
                  label="Check In to Outlet"
                  onPress={handleCheckIn}
                  loading={status === 'checking_in'}
                  disabled={!photoUri}
                  icon={<Ionicons name="location" size={20} color={photoUri ? '#fff' : colors.textMuted} />}
                />
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactButton({ icon, label, onPress, a11y }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickContactBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.quickContactText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: -spacing.sm, marginBottom: spacing.sm },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  liveText: { ...typography.caption, color: '#fff' },
  outletName: { ...typography.h1, fontSize: 24, lineHeight: 30, color: '#fff' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs + 2, marginTop: spacing.sm },
  addressText: { ...typography.body, color: 'rgba(255,255,255,0.9)', flex: 1 },
  quickContactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  quickContactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, minHeight: touchTarget - 4,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: spacing.lg, borderRadius: radius.pill,
  },
  quickContactText: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily, color: '#fff' },
  body: { padding: spacing.lg, gap: spacing.lg },
  balanceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balanceLabel: { ...typography.caption, color: colors.textMuted },
  balanceValue: { ...typography.h1, color: colors.text, marginTop: spacing.xs },
  cardTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  actionGrid: { flexDirection: 'row', gap: spacing.md },
  gridButton: {
    flex: 1, minHeight: 100, backgroundColor: colors.primaryLight, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.sm,
  },
  gridIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  gridButtonText: { ...typography.h3, color: colors.primary },
  stepLabel: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  preview: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.neutralLight },
  previewPlaceholder: { height: 140, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.bg },
  placeholderText: { ...typography.caption, color: colors.textMuted },
});
