import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Donation } from '@caretrace/shared';
import { fetchDonations } from '../api/mobileClient';
import { ConsignmentDetailModal } from '../components/ConsignmentDetailModal';

interface Props {
  donorId: string;
  donorName: string;
}

export const DonorHomeScreen: React.FC<Props> = ({ donorId, donorName }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Fetch donations for Ajith or all donor consignments
      const list = await fetchDonations({ donorId });
      setDonations(list);
    } catch (err: any) {
      setError(err.message || 'Could not connect to CareTrace server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [donorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Compute impact stats
  const totalCount = donations.length;
  const inTransitCount = donations.filter(d => ['PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length;
  const deliveredCount = donations.filter(d => d.status === 'CONFIRMED').length;
  const scheduledCount = donations.filter(d => ['MATCHED', 'PICKUP_SCHEDULED'].includes(d.status)).length;

  const renderStatusBadge = (status: string) => {
    let bg = '#e2e8f0';
    let text = '#475569';
    let label = status;

    if (status === 'CONFIRMED') {
      bg = '#ccfbf1';
      text = '#0d9488';
      label = '✓ DELIVERED';
    } else if (status === 'IN_TRANSIT' || status === 'PICKED_UP') {
      bg = '#fef3c7';
      text = '#b45309';
      label = '● IN TRANSIT';
    } else if (status === 'PICKUP_SCHEDULED') {
      bg = '#e0f2fe';
      text = '#0369a1';
      label = 'COURIER ASSIGNED';
    } else if (status === 'MATCHED') {
      bg = '#f1f5f9';
      text = '#64748b';
      label = 'PLEDGED';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Donor Banner */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{donorName.charAt(0)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.profileName}>{donorName}</Text>
          <Text style={styles.profileRole}>Verified Contributor · Chennai Region</Text>
        </View>
      </View>

      {/* Impact Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total Pledged</Text>
        </View>
        <View style={[styles.statCard, styles.statActive]}>
          <Text style={[styles.statNumber, styles.textAmber]}>{inTransitCount}</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
        <View style={[styles.statCard, styles.statDelivered]}>
          <Text style={[styles.statNumber, styles.textTeal]}>{deliveredCount}</Text>
          <Text style={styles.statLabel}>Handover Confirmed</Text>
        </View>
      </View>

      {/* Tracked Consignments Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tracked Consignments</Text>
        <Text style={styles.sectionSubtitle}>Tamper-Evident SHA-256 Ledger</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.mutedText}>Fetching verifiable consignments...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Notice</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : donations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No active donations found</Text>
          <Text style={styles.emptySubtitle}>Pledge supplies or browse verified needs to initiate custody tracking.</Text>
        </View>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.consignmentCard}
              activeOpacity={0.8}
              onPress={() => setSelectedDonationId(item.id)}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.consignmentId}>{item.id}</Text>
                  <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                {renderStatusBadge(item.status)}
              </View>

              <View style={styles.institutionRow}>
                <Text style={styles.institutionLabel}>To Sanctuary:</Text>
                <Text style={styles.institutionName}>{item.institutionName}</Text>
              </View>

              <View style={styles.itemsSummary}>
                <Text style={styles.itemsText} numberOfLines={1}>
                  📦 {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.viewTimelineLink}>Tap to view Chain of Custody & QR →</Text>
                <View style={styles.shaPill}>
                  <Text style={styles.shaPillText}>SHA-256</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Consignment Detail Modal */}
      <ConsignmentDetailModal
        donationId={selectedDonationId}
        onClose={() => setSelectedDonationId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800'
  },
  profileInfo: {
    flex: 1
  },
  welcomeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500'
  },
  profileName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800'
  },
  profileRole: {
    color: '#2dd4bf',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1
  },
  statActive: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb'
  },
  statDelivered: {
    borderColor: '#99f6e4',
    backgroundColor: '#f0fdfa'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a'
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center'
  },
  textAmber: {
    color: '#b45309'
  },
  textTeal: {
    color: '#0d9488'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#0d9488',
    fontWeight: '700'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  mutedText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    alignItems: 'center',
    marginVertical: 12
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4
  },
  errorBody: {
    color: '#7f1d1d',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12
  },
  retryBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  },
  consignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  consignmentId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  institutionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 6
  },
  institutionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  itemsSummary: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10
  },
  itemsText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8
  },
  viewTimelineLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d9488'
  },
  shaPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  shaPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b'
  }
});

