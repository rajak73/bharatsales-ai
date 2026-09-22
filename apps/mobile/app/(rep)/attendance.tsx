import { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';
import { formatTime } from '../../src/lib/theme';
import { useCurrentAttendanceSession, useAttendanceActions, useBackgroundLocationTracking } from '../../src/hooks/useAttendance';
import { captureCameraPhoto, uploadCapturedPhoto } from '../../src/lib/photoCapture';
import { ScreenHeader, Button, Card, Banner, SkeletonBox } from '../../src/components/ui';

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
        <View style={styles.scroll}>
          <SkeletonBox height={180} style={{ borderRadius: radius.lg }} />
          <SkeletonBox height={52} style={{ borderRadius: radius.md, marginTop: spacing.lg }} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          <Card padding={0} style={styles.card}>
            <View style={[styles.statusBanner, { backgroundColor: session ? colors.success : colors.text }]} accessible accessibilityRole="summary">
              <View style={styles.statusIcon}>
                <Ionicons name={session ? 'checkmark-circle' : 'time-outline'} size={40} color="#fff" />
              </View>
              <Text style={styles.statusTitle}>{session ? 'You are On Duty' : 'You are Off Duty'}</Text>
              <Text style={styles.statusSubtitle}>
                {session ? `Started at ${formatTime((session as any).startTime)}` : 'Start your day to unlock visits & orders'}
              </Text>
            </View>

            <View style={styles.body}>
              {error ? <Banner tone="danger" message={error} /> : null}

              <Banner tone="info" icon="location" message="Your location is recorded during attendance to verify your starting and ending territory." />

              {!session && (
                <View style={styles.selfieBlock}>
                  <Text style={styles.stepLabel}>Step 1 · Take a selfie</Text>
                  {selfieUri ? (
                    <Image source={{ uri: selfieUri }} style={styles.preview} accessibilityLabel="Selfie preview" />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Ionicons name="person-circle-outline" size={48} color={colors.textMuted} />
                      <Text style={styles.placeholderText}>No selfie yet</Text>
                    </View>
                  )}
                  <Button
                    label={selfieUri ? 'Retake Selfie' : 'Take Selfie'}
                    variant={selfieUri ? 'ghost' : 'secondary'}
                    onPress={handleTakeSelfie}
                    icon={<Ionicons name="camera" size={20} color={selfieUri ? colors.text : colors.primary} />}
                  />
                  <Text style={styles.stepLabel}>Step 2 · Start your day</Text>
                </View>
              )}

              <Button
                label={session ? 'End Day' : 'Start Day'}
                onPress={handleAction}
                variant={session ? 'danger' : 'primary'}
                loading={busy}
                disabled={!session && !selfieUri}
                icon={<Ionicons name={session ? 'log-out-outline' : 'play-circle'} size={20} color={session ? colors.danger : !selfieUri ? colors.textMuted : '#fff'} />}
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
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { overflow: 'hidden' },
  statusBanner: { padding: spacing.xl, alignItems: 'center' },
  statusIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  statusTitle: { ...typography.h1, color: '#fff', marginTop: spacing.md },
  statusSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs, textAlign: 'center' },
  body: { padding: spacing.lg, gap: spacing.lg },
  selfieBlock: { gap: spacing.md },
  stepLabel: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  preview: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.neutralLight },
  previewPlaceholder: { height: 140, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.bg },
  placeholderText: { ...typography.caption, color: colors.textMuted },
});
