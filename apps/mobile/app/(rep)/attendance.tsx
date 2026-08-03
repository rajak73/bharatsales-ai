import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';
import { useCurrentAttendanceSession, useAttendanceActions, useBackgroundLocationTracking } from '../../src/hooks/useAttendance';
import { captureCameraPhoto, uploadCapturedPhoto } from '../../src/lib/photoCapture';
import { ScreenHeader, Button, Card } from '../../src/components/ui';

export default function AttendanceScreen() {
  const { data: session, isLoading, refetch, isRefetching } = useCurrentAttendanceSession();
  const { startDay, endDay } = useAttendanceActions();
  useBackgroundLocationTracking((session as any)?.id || (session as any)?._id);

  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleTakeSelfie = async () => {
    setError('');
    try {
      const photo = await captureCameraPhoto();
      if (photo) setSelfieUri(photo.uri);
    } catch (err: any) {
      setError(err?.message || 'Failed to capture photo.');
    }
  };

  const handleAction = async () => {
    setError('');
    if (!session && !selfieUri) {
      setError('A selfie photo is required to start your day.');
      return;
    }
    setBusy(true);
    try {
      if (session) {
        await endDay();
      } else {
        const photoUrl = await uploadCapturedPhoto({ uri: selfieUri! }, 'attendance-selfie.jpg');
        await startDay(photoUrl);
        setSelfieUri(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record attendance. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Attendance" />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <Card padding={0} style={styles.card}>
            <View style={[styles.statusBanner, { backgroundColor: session ? colors.success : '#1E293B' }]}>
              <Ionicons name={session ? 'checkmark-circle' : 'time-outline'} size={48} color="#fff" />
              <Text style={styles.statusTitle}>{session ? 'You are On Duty' : 'You are Off Duty'}</Text>
              <Text style={styles.statusSubtitle}>
                {session ? `Started at ${new Date((session as any).startTime).toLocaleTimeString()}` : 'Start your day to unlock visits & orders'}
              </Text>
            </View>

            <View style={styles.body}>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.infoBox}>
                <Ionicons name="location" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
                <Text style={styles.infoText}>Your location is recorded during attendance to verify your starting and ending territory.</Text>
              </View>

              {!session && (
                <View style={{ marginBottom: spacing.lg }}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleTakeSelfie}>
                    <Ionicons name="camera" size={18} color={colors.text} />
                    <Text style={styles.secondaryButtonText}>{selfieUri ? 'Retake Selfie' : 'Take Selfie'}</Text>
                  </TouchableOpacity>
                  {selfieUri && <Image source={{ uri: selfieUri }} style={styles.preview} />}
                </View>
              )}

              <Button
                label={session ? 'End Day' : 'Start Day'}
                onPress={handleAction}
                variant={session ? 'danger' : 'primary'}
                loading={busy}
                disabled={!session && !selfieUri}
              />
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: spacing.huge },
  card: { overflow: 'hidden' },
  statusBanner: { padding: spacing.xxl, alignItems: 'center' },
  statusTitle: { ...typography.h1, color: '#fff', marginTop: spacing.sm },
  statusSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs, textAlign: 'center' },
  body: { padding: spacing.xl },
  error: { backgroundColor: colors.dangerLight, color: colors.danger, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg, fontSize: 13 },
  infoBox: { flexDirection: 'row', backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.xl },
  infoText: { flex: 1, ...typography.caption, color: '#1E3A8A' },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md },
  secondaryButtonText: { ...typography.bodyMedium, color: colors.text },
  preview: { width: '100%', height: 160, borderRadius: radius.md, marginTop: spacing.md },
});
