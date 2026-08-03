import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CollectionsService, FinanceService } from '@bharatsales/api-client';
import { colors, formatCurrency } from '../../src/lib/theme';
import { spacing, radius, typography } from '../../src/theme/tokens';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill } from '../../src/components/ui';

type Tab = 'collections' | 'invoices';

export default function PaymentsScreen() {
  const [tab, setTab] = useState<Tab>('collections');
  const isOnline = useIsOnline();

  const { data: collections = [], isLoading: loadingCollections, isError: errorCollections, refetch: refetchCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => CollectionsService.getCollections(),
    enabled: tab === 'collections',
  });

  const { data: invoices = [], isLoading: loadingInvoices, isError: errorInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => FinanceService.getInvoices(),
    enabled: tab === 'invoices',
  });

  const pendingCollections = (collections as any[]).filter((c) => c.status === 'Pending');
  const clearedCollections = (collections as any[]).filter((c) => c.status !== 'Pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Payments" />

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'collections' && styles.tabActive]} onPress={() => setTab('collections')}>
          <Text style={[styles.tabText, tab === 'collections' && styles.tabTextActive]}>Collections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'invoices' && styles.tabActive]} onPress={() => setTab('invoices')}>
          <Text style={[styles.tabText, tab === 'invoices' && styles.tabTextActive]}>Invoices</Text>
        </TouchableOpacity>
      </View>

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
            ListEmptyComponent={<EmptyState icon="wallet-outline" title="No collections yet" />}
            renderItem={({ item }: any) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.receiptNumber}</Text>
                  <Text style={styles.rowMeta}>{item.paymentMode} • {new Date(item.collectionDate).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                  <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
                  <StatusPill label={item.status} tone={item.status === 'Pending' ? 'warning' : 'success'} />
                </View>
              </View>
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
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No invoices yet" />}
          renderItem={({ item }: any) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.invoiceNumber}</Text>
                <Text style={styles.rowMeta}>Due: {formatCurrency((item.totalAmount || 0) - (item.paidAmount || 0))}</Text>
              </View>
              <Text style={styles.rowAmount}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  list: { padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowTitle: { ...typography.h3, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  rowAmount: { ...typography.h3, color: colors.text },
});
