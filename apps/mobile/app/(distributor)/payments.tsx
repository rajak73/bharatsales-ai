import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CollectionsService, FinanceService } from '@bharatsales/api-client';
import { colors, formatCurrency, formatDate } from '../../src/lib/theme';
import { statusTone } from '../../src/lib/orderStatus';
import { spacing, typography } from '../../src/theme/tokens';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill, ListItem, Chip, ChipRow } from '../../src/components/ui';

type Tab = 'collections' | 'invoices';

export default function PaymentsScreen() {
  const [tab, setTab] = useState<Tab>('collections');
  const isOnline = useIsOnline();

  const { data: collections = [], isLoading: loadingCollections, isError: errorCollections, refetch: refetchCollections, isRefetching: refetchingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => CollectionsService.getCollections(),
    enabled: tab === 'collections',
  });

  const { data: invoices = [], isLoading: loadingInvoices, isError: errorInvoices, refetch: refetchInvoices, isRefetching: refetchingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => FinanceService.getInvoices(),
    enabled: tab === 'invoices',
  });

  const pendingCollections = (collections as any[]).filter((c) => c.status === 'Pending');
  const clearedCollections = (collections as any[]).filter((c) => c.status !== 'Pending');

  const Separator = () => <View style={{ height: spacing.sm }} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Payments" />

      <ChipRow>
        <Chip label="Collections" icon="wallet-outline" selected={tab === 'collections'} onPress={() => setTab('collections')} />
        <Chip label="Invoices" icon="document-text-outline" selected={tab === 'invoices'} onPress={() => setTab('invoices')} />
      </ChipRow>

      {tab === 'collections' ? (
        loadingCollections ? (
          <View style={styles.list}><SkeletonList count={5} /></View>
        ) : errorCollections ? (
          <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetchCollections()} /></View>
        ) : (
          <FlatList
            contentContainerStyle={styles.list}
            data={[...pendingCollections, ...clearedCollections]}
            keyExtractor={(item: any) => item.id || item._id}
            refreshControl={<RefreshControl refreshing={refetchingCollections} onRefresh={refetchCollections} colors={[colors.primary]} tintColor={colors.primary} />}
            ItemSeparatorComponent={Separator}
            ListEmptyComponent={<EmptyState icon="wallet-outline" title="No collections yet" message="Payments collected by sales reps will appear here." />}
            renderItem={({ item }: any) => (
              <ListItem
                icon="cash-outline"
                iconColor={item.status === 'Pending' ? colors.warning : colors.success}
                iconBackground={item.status === 'Pending' ? colors.warningLight : colors.successLight}
                title={item.receiptNumber || 'Receipt'}
                subtitle={`${item.paymentMode} · ${formatDate(item.collectionDate)}`}
                accessibilityLabel={`${item.receiptNumber}, ${formatCurrency(item.amount)}, ${item.status}`}
                trailing={
                  <View style={styles.trailing}>
                    <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                    <StatusPill label={item.status} tone={statusTone(item.status)} />
                  </View>
                }
              />
            )}
          />
        )
      ) : loadingInvoices ? (
        <View style={styles.list}><SkeletonList count={5} /></View>
      ) : errorInvoices ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetchInvoices()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={invoices as any[]}
          keyExtractor={(item: any) => item.id || item._id}
          refreshControl={<RefreshControl refreshing={refetchingInvoices} onRefresh={refetchInvoices} colors={[colors.primary]} tintColor={colors.primary} />}
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No invoices yet" />}
          renderItem={({ item }: any) => {
            const due = (item.totalAmount || 0) - (item.paidAmount || 0);
            return (
              <ListItem
                icon="document-text-outline"
                title={item.invoiceNumber || 'Invoice'}
                subtitle={due > 0 ? `Due ${formatCurrency(due)}` : 'Fully paid'}
                accessibilityLabel={`${item.invoiceNumber}, total ${formatCurrency(item.totalAmount)}, ${due > 0 ? `due ${formatCurrency(due)}` : 'fully paid'}`}
                trailing={
                  <View style={styles.trailing}>
                    <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
                    <StatusPill label={due > 0 ? 'Due' : 'Paid'} tone={due > 0 ? 'warning' : 'success'} />
                  </View>
                }
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxxl },
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { ...typography.h3, color: colors.text },
});
