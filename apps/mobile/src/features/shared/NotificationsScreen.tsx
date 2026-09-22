import { View, Text, Pressable, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsService } from '@bharatsales/api-client';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatDateTime } from '../../lib/theme';
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
  const { data: notifications = [], isLoading, isError, refetch, isRefetching } = useQuery({
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
        rightAction={{ icon: 'checkmark-done', accessibilityLabel: 'Mark all as read', onPress: () => markAllAsRead.mutate(), disabled: unreadCount === 0 || markAllAsRead.isPending }}
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="No notifications yet" message="You'll see updates about beats, orders, and approvals here." />
          }
          renderItem={({ item }: any) => (
            <Pressable
              style={({ pressed }) => [styles.notifCard, !item.read && styles.notifCardUnread, pressed && { opacity: 0.85 }]}
              onPress={() => !item.read && markAsRead.mutate(item.id || item._id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.message || ''}`}
              accessibilityHint={item.read ? undefined : 'Marks as read'}
            >
              <View style={[styles.notifIcon, !item.read && styles.notifIconUnread]}>
                <Ionicons name={item.read ? 'notifications-outline' : 'notifications'} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, item.read && styles.notifTitleRead]}>{item.title}</Text>
                {item.message ? <Text style={styles.notifMessage} numberOfLines={3}>{item.message}</Text> : null}
                <Text style={styles.notifDate}>{formatDateTime(item.createdAt)}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  stateWrap: { padding: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md, minHeight: 64 },
  notifCardUnread: { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder },
  notifIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.neutralLight, alignItems: 'center', justifyContent: 'center' },
  notifIconUnread: { backgroundColor: colors.card },
  notifTitle: { ...typography.h3, color: colors.text },
  notifTitleRead: { fontFamily: typography.bodyMedium.fontFamily, color: colors.textSecondary },
  notifMessage: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  notifDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: spacing.xs },
});
