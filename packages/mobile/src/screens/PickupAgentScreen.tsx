import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Donation, LedgerBlock } from '@caretrace/shared';
import { fetchDonations, scanPickup, scanDelivery } from '../api/mobileClient';
import { ConsignmentDetailModal } from '../components/ConsignmentDetailModal';

interface Props {
  agentId: string;
  agentName: string;
}

export const PickupAgentScreen: React.FC<Props> = ({ agentId, agentName }) => {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PICKUPS' | 'IN_TRANSIT' | 'ALL'>('PICKUPS');

  // Camera QR Scanner state
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Simulation Fallback state (for testing without camera)
  const [simulateModalVisible, setSimulateModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<{
    title: string;
    message: string;
    block?: LedgerBlock;
  } | null>(null);

  const loadManifest = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all donations assigned to this agent or active in the network
      const all = await fetchDonations();
      // Filter for this agent or open tasks
      const agentTasks = all.filter(d => 
        d.pickupAgentId === agentId || 
        ['PICKUP_SCHEDULED', 'IN_TRANSIT', 'CONFIRMED'].includes(d.status)
      );
      setDonations(agentTasks);
    } catch (err: any) {
      Alert.alert('Connection Error', err.message || 'Failed to fetch courier manifest');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  // Filter tasks based on active tab
  const pickups = donations.filter(d => ['MATCHED', 'PICKUP_SCHEDULED'].includes(d.status));
  const inTransit = donations.filter(d => ['PICKED_UP', 'IN_TRANSIT'].includes(d.status));
  const completed = donations.filter(d => d.status === 'CONFIRMED');

  const displayedList = activeTab === 'PICKUPS' 
    ? pickups 
    : activeTab === 'IN_TRANSIT' 
      ? inTransit 
      : donations;

  // Handler for Scan-to-Advance Status
  const handleProcessScanPayload = async (rawPayload: string) => {
    try {
      setProcessing(true);
      setScanned(true);

      // Parse payload to find corresponding donation
      let donationId = '';
      try {
        const parsed = JSON.parse(rawPayload);
        donationId = parsed.donationId;
      } catch {
        // Plain string format CT-2026-XXXX
        donationId = rawPayload.trim();
      }

      const targetDonation = donations.find(d => d.id === donationId || d.qrCodePayload === rawPayload);
      if (!targetDonation) {
        throw new Error(`No active consignment matches scanned code: ${donationId || rawPayload}`);
      }

      if (['MATCHED', 'PICKUP_SCHEDULED'].includes(targetDonation.status)) {
        // Step 1: Advance to IN_TRANSIT
        const res = await scanPickup(
          targetDonation.qrCodePayload,
          agentId,
          `Doorstep pickup confirmed by Field Agent ${agentName}.`
        );
        setLastActionResult({
          title: '✓ Pickup Verified & In-Transit',
          message: `Consignment ${targetDonation.id} accepted into transit custody. Mined Ledger Block #${res.ledgerBlock.index}.`,
          block: res.ledgerBlock
        });
      } else if (['PICKED_UP', 'IN_TRANSIT'].includes(targetDonation.status)) {
        // Step 2: Advance to CONFIRMED
        const res = await scanDelivery({
          qrPayload: targetDonation.qrCodePayload,
          recipientName: `${targetDonation.institutionName} Representative`,
          signature: `Accepted by ${targetDonation.institutionName}`,
          notes: 'Goods inspected and received in perfect order.',
          actorId: agentId
        });
        setLastActionResult({
          title: '🎉 Handover Successfully Confirmed',
          message: `Delivery completed for ${targetDonation.id}! Tamper-evident proof certificate minted and sealed on chain.`,
          block: res.ledgerBlock
        });
      } else {
        throw new Error(`Consignment ${targetDonation.id} is already in state: ${targetDonation.status}`);
      }

      setScannerVisible(false);
      setSimulateModalVisible(false);
      await loadManifest();
    } catch (err: any) {
      Alert.alert('Scan Verification Error', err.message || 'Failed to process QR code');
    } finally {
      setProcessing(false);
      setScanned(false);
    }
  };

  const openCameraScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Access Required',
          'Camera permission is needed to scan QR codes. You can also use the "Simulate QR Scan" button below.'
        );
        return;
      }
    }
    setScanned(false);
    setScannerVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Agent Banner */}
      <View style={styles.agentHeader}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>🚚</Text>
        </View>
        <View style={styles.agentInfo}>
          <Text style={styles.agentWelcome}>Logistics Field Agent</Text>
          <Text style={styles.agentName}>{agentName}</Text>
          <Text style={styles.agentMeta}>Chennai Field Operations Hub · Online</Text>
        </View>
      </View>

      {/* Action Bar with Real Camera & Simulate Scan fallback button */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={openCameraScanner}
          activeOpacity={0.8}
        >
          <Text style={styles.scanBtnText}>📷 Open Camera QR</Text>
        </TouchableOpacity>

        {/* Fallback button specifically requested in user requirements */}
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={() => setSimulateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.simulateBtnText}>⚡ Simulate QR Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Manifest Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PICKUPS' && styles.tabActive]}
          onPress={() => setActiveTab('PICKUPS')}
        >
          <Text style={[styles.tabText, activeTab === 'PICKUPS' && styles.tabTextActive]}>
            Pickups ({pickups.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'IN_TRANSIT' && styles.tabActive]}
          onPress={() => setActiveTab('IN_TRANSIT')}
        >
          <Text style={[styles.tabText, activeTab === 'IN_TRANSIT' && styles.tabTextActive]}>
            In Transit ({inTransit.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.tabActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            Completed ({completed.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manifest Task List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.mutedText}>Updating courier manifest...</Text>
        </View>
      ) : displayedList.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No tasks in this category</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'PICKUPS'
              ? 'All scheduled donor pickups are complete.'
              : activeTab === 'IN_TRANSIT'
                ? 'No packages currently in transit.'
                : 'No past completed handovers.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedList}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const isPickupPending = ['MATCHED', 'PICKUP_SCHEDULED'].includes(item.status);
            const isInTransit = ['PICKED_UP', 'IN_TRANSIT'].includes(item.status);
            const isDelivered = item.status === 'CONFIRMED';

            return (
              <View style={styles.manifestCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.manifestId}>{item.id}</Text>
                    <Text style={styles.manifestType}>{item.type}</Text>
                  </View>
                  <View style={[
                    styles.manifestBadge,
                    isPickupPending && styles.badgeAmber,
                    isInTransit && styles.badgeBlue,
                    isDelivered && styles.badgeTeal
                  ]}>
                    <Text style={[
                      styles.manifestBadgeText,
                      isPickupPending && styles.textAmber,
                      isInTransit && styles.textBlue,
                      isDelivered && styles.textTeal
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Locations */}
                <View style={styles.locationGroup}>
                  <View style={styles.locationRow}>
                    <Text style={styles.locIcon}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locLabel}>PICKUP FROM DONOR ({item.donorName})</Text>
                      <Text style={styles.locValue}>{item.pickupAddress}</Text>
                    </View>
                  </View>
                  <View style={styles.locationRow}>
                    <Text style={styles.locIcon}>🏢</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locLabel}>DELIVER TO ({item.institutionName})</Text>
                      <Text style={styles.locValue}>{item.destinationAddress}</Text>
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.itemsSummary}>
                  <Text style={styles.itemsSummaryText}>
                    📦 {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </Text>
                </View>

                {/* Quick Advance Action Button */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => setSelectedDonationId(item.id)}
                  >
                    <Text style={styles.detailBtnText}>View Chain →</Text>
                  </TouchableOpacity>

                  {isPickupPending && (
                    <TouchableOpacity
                      style={styles.actionBtnPickup}
                      onPress={() => handleProcessScanPayload(item.qrCodePayload)}
                    >
                      <Text style={styles.actionBtnText}>Confirm Pickup (Scan QR)</Text>
                    </TouchableOpacity>
                  )}

                  {isInTransit && (
                    <TouchableOpacity
                      style={styles.actionBtnDeliver}
                      onPress={() => handleProcessScanPayload(item.qrCodePayload)}
                    >
                      <Text style={styles.actionBtnText}>Confirm Handover (Scan QR)</Text>
                    </TouchableOpacity>
                  )}

                  {isDelivered && (
                    <View style={styles.confirmedPill}>
                      <Text style={styles.confirmedPillText}>✓ Handover Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Native Camera QR Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Align QR Code within Frame</Text>
            <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.scannerClose}>
              <Text style={styles.scannerCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr']
            }}
            onBarcodeScanned={scanned ? undefined : ({ data }) => handleProcessScanPayload(data)}
          />

          <View style={styles.scannerOverlay}>
            <View style={styles.scanTargetBox} />
            <Text style={styles.scanInstructions}>
              Point camera at Donor or Institution verification QR
            </Text>
          </View>
        </View>
      </Modal>

      {/* Simulate QR Scan Fallback Modal */}
      <Modal
        visible={simulateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSimulateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.simulateModalContent}>
            <View style={styles.simulateHeader}>
              <Text style={styles.simulateTitle}>⚡ Simulate Field QR Scan</Text>
              <TouchableOpacity onPress={() => setSimulateModalVisible(false)}>
                <Text style={styles.simulateClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.simulateDesc}>
              Select any active consignment to simulate a physical scanner read without using device camera hardware:
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {donations.filter(d => d.status !== 'CONFIRMED').length === 0 ? (
                <Text style={styles.noActiveText}>No pending pickups or in-transit consignments.</Text>
              ) : (
                donations
                  .filter(d => d.status !== 'CONFIRMED')
                  .map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.simItem}
                      onPress={() => handleProcessScanPayload(item.qrCodePayload)}
                    >
                      <View>
                        <Text style={styles.simItemId}>{item.id} ({item.status})</Text>
                        <Text style={styles.simItemSub}>{item.institutionName}</Text>
                      </View>
                      <Text style={styles.simActionArrow}>Advance Status →</Text>
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.simCancelBtn}
              onPress={() => setSimulateModalVisible(false)}
            >
              <Text style={styles.simCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scan Result Modal */}
      <Modal
        visible={!!lastActionResult}
        transparent
        animationType="slide"
        onRequestClose={() => setLastActionResult(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContent}>
            <Text style={styles.resultTitle}>{lastActionResult?.title}</Text>
            <Text style={styles.resultMessage}>{lastActionResult?.message}</Text>

            {lastActionResult?.block && (
              <View style={styles.resultBlockBox}>
                <Text style={styles.resultBlockLabel}>MINED LEDGER CHECKPOINT</Text>
                <Text style={styles.resultBlockHash} numberOfLines={1}>
                  Hash: {lastActionResult.block.blockHash}
                </Text>
                <Text style={styles.resultBlockActor}>
                  Signer: {lastActionResult.block.actorName} ({lastActionResult.block.actorRole})
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.resultDoneBtn}
              onPress={() => setLastActionResult(null)}
            >
              <Text style={styles.resultDoneBtnText}>Dismiss & Return to Manifest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#042f2e',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  agentAvatarText: {
    fontSize: 22
  },
  agentInfo: {
    flex: 1
  },
  agentWelcome: {
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: '600'
  },
  agentName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800'
  },
  agentMeta: {
    color: '#5eead4',
    fontSize: 11,
    marginTop: 2
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  scanBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 6
  },
  scanBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  simulateBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 6
  },
  simulateBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  tabTextActive: {
    color: '#0f172a'
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
  emptyBox: {
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
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  manifestId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  manifestType: {
    fontSize: 11,
    color: '#64748b'
  },
  manifestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeAmber: {
    backgroundColor: '#fef3c7'
  },
  badgeBlue: {
    backgroundColor: '#e0f2fe'
  },
  badgeTeal: {
    backgroundColor: '#ccfbf1'
  },
  manifestBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  textAmber: {
    color: '#b45309'
  },
  textBlue: {
    color: '#0284c7'
  },
  textTeal: {
    color: '#0d9488'
  },
  locationGroup: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3
  },
  locIcon: {
    fontSize: 12,
    marginRight: 8,
    marginTop: 2
  },
  locLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b'
  },
  locValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600'
  },
  itemsSummary: {
    marginBottom: 10
  },
  itemsSummaryText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  detailBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  detailBtnText: {
    color: '#0d9488',
    fontWeight: '700',
    fontSize: 12
  },
  actionBtnPickup: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  actionBtnDeliver: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },
  confirmedPill: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  confirmedPillText: {
    color: '#0d9488',
    fontWeight: '800',
    fontSize: 11
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000'
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 20,
    zIndex: 10
  },
  scannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  scannerClose: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8
  },
  scannerCloseText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanTargetBox: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#0d9488',
    borderRadius: 16,
    backgroundColor: 'transparent'
  },
  scanInstructions: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  simulateModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%'
  },
  simulateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  simulateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  simulateClose: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
    padding: 4
  },
  simulateDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14
  },
  simItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  simItemId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  simItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  simActionArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7'
  },
  noActiveText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 20
  },
  simCancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center'
  },
  simCancelText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13
  },
  resultModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center'
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8
  },
  resultMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16
  },
  resultBlockBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16
  },
  resultBlockLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4
  },
  resultBlockHash: {
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontSize: 11
  },
  resultBlockActor: {
    color: '#a7f3d0',
    fontSize: 11,
    marginTop: 4
  },
  resultDoneBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center'
  },
  resultDoneBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  }
});
