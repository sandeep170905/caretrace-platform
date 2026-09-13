import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Donation, LedgerBlock, LedgerVerificationResult } from '@caretrace/shared';
import { fetchDonationDetail, fetchLedgerVerification } from '../api/mobileClient';
import { ChainOfCustodyTimeline } from './ChainOfCustodyTimeline';

interface Props {
  donationId: string | null;
  onClose: () => void;
}

export const ConsignmentDetailModal: React.FC<Props> = ({ donationId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [verification, setVerification] = useState<LedgerVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!donationId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchDonationDetail(donationId),
      fetchLedgerVerification(donationId)
    ])
      .then(([detailRes, verifyRes]) => {
        if (!mounted) return;
        setDonation(detailRes.donation);
        setBlocks(detailRes.blocks);
        setQrDataUrl(detailRes.qrDataUrl);
        setVerification(verifyRes);
        setLoading(false);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message || 'Failed to load consignment details');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [donationId]);

  if (!donationId) return null;

  return (
    <Modal visible={!!donationId} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerId}>{donationId}</Text>
            <Text style={styles.headerSubtitle}>Custody & Verification</Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={styles.loadingText}>Verifying Cryptographic Ledger...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onClose}>
              <Text style={styles.retryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : donation ? (
          <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Status & Integrity Banner */}
            <View style={styles.integrityBanner}>
              <View style={styles.integrityRow}>
                <View style={[styles.integrityBadge, verification?.isValid ? styles.badgeSuccess : styles.badgeDanger]}>
                  <Text style={styles.integrityBadgeText}>
                    {verification?.isValid ? '✓ SHA-256 LEDGER SECURE' : '⚠ INTEGRITY WARNING'}
                  </Text>
                </View>
                <Text style={styles.statusPill}>{donation.status}</Text>
              </View>
              <Text style={styles.integrityMeta}>
                {blocks.length} Cryptographic Blocks Verified · Consignment Genesis: {new Date(donation.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>Consignment Verification QR</Text>
              <Text style={styles.qrSubtitle}>Scan at physical pickup and delivery handover</Text>
              
              <View style={styles.qrContainer}>
                {qrDataUrl ? (
                  <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
                ) : (
                  <View style={styles.qrFallback}>
                    <Text style={styles.qrFallbackText}>[QR CODE]</Text>
                    <Text style={styles.qrFallbackId}>{donation.id}</Text>
                  </View>
                )}
              </View>

              <View style={styles.payloadBox}>
                <Text style={styles.payloadLabel}>CRYPTOGRAPHIC QR PAYLOAD</Text>
                <Text selectable style={styles.payloadText}>{donation.qrCodePayload}</Text>
              </View>
            </View>

            {/* Consignment Items */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Manifest Items</Text>
              {donation.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.quantity} {item.unit || 'units'}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>DESTINATION INSTITUTION</Text>
                <Text style={styles.addressName}>{donation.institutionName}</Text>
                <Text style={styles.addressDetail}>{donation.destinationAddress}</Text>
              </View>

              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>PICKUP LOCATION</Text>
                <Text style={styles.addressDetail}>{donation.pickupAddress}</Text>
              </View>
            </View>

            {/* Visual Chain of Custody Timeline */}
            <ChainOfCustodyTimeline
              currentStatus={donation.status}
              blocks={blocks}
            />
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#0f172a'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  headerTitleGroup: {
    alignItems: 'center'
  },
  headerId: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16
  },
  retryBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  scrollContent: {
    padding: 16
  },
  integrityBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  integrityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  integrityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeSuccess: {
    backgroundColor: '#ccfbf1'
  },
  badgeDanger: {
    backgroundColor: '#fee2e2'
  },
  integrityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0d9488'
  },
  statusPill: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  integrityMeta: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500'
  },
  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14
  },
  qrContainer: {
    width: 190,
    height: 190,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 14
  },
  qrImage: {
    width: '100%',
    height: '100%'
  },
  qrFallback: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0d9488'
  },
  qrFallbackId: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 4
  },
  payloadBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  payloadLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 3
  },
  payloadText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#334155'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  itemName: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600'
  },
  itemQty: {
    fontSize: 14,
    color: '#0d9488',
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12
  },
  addressBlock: {
    marginBottom: 10
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2
  },
  addressName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  addressDetail: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1
  }
});

