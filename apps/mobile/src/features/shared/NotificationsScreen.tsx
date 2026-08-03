import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsService } from '@bharatsales/api-client';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useIsOnline } from '../../hooks/useIsOnline';

interface NotificationsScreenProps {
  // Distributor reaches this as a pushed screen (needs a back arrow); the
  // Sales Rep tab bar reaches it as a tab root (no back arrow makes sense).
  showBack?: boolean;
}

// Shared between (rep) and (distributor) route groups — identical backend
// contract (GET /notifications, mark-read/mark-all-read) for both roles.
export function NotificationsScreen({ showBack = false }: NotificationsScreenProps) {
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();
  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationsService.getNotifications(''),
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => NotificationsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => NotificationsService.markAllAsRead(''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = (notifications as any[]).filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        showBack={showBack}
        rightAction={{ icon: null, label: 'Mark all read', onPress: () => markAllAsRead.mutate() }}
      />

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={5} /></View>
      ) : isError ? (
        <View style={styles.stateWrap}>
          <ErrorState offline={!isOnline} onRetry={() => refetch()} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={notifications as any[]}
          keyExtractor={(item: any) => item.id || item._id}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="No notifications yet" message="You'll see updates about beats, orders, and approvals here." />
          }
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
              onPress={() => !item.read && markAsRead.mutate(item.id || item._id)}
            >
              <View style={styles.notifIcon}><Ionicons name="notifications" size={16} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notifDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  stateWrap: { padding: spacing.lg },
  list: { padding: spacing.lg, gap: spacing.sm },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  notifCardUnread: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  notifIcon: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  notifTitle: { ...typography.h3, color: colors.text },
  notifMessage: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  notifDate: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.xs, textTransform: 'none' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: spacing.xs },
});
