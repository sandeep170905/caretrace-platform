import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { DonationStatus, LedgerBlock } from '@caretrace/shared';

interface StepDef {
  key: string;
  label: string;
  sublabel: string;
  matchedStatuses: DonationStatus[];
  eventType?: string;
}

const TIMELINE_STEPS: StepDef[] = [
  {
    key: 'MATCHED',
    label: 'Requirement Matched & Pledged',
    sublabel: 'Donor committed items; cryptographic genesis recorded',
    matchedStatuses: ['MATCHED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'CONFIRMED'],
    eventType: 'DONATION_MATCHED'
  },
  {
    key: 'PICKUP_SCHEDULED',
    label: 'Pickup Assigned to Courier',
    sublabel: 'Field logistics agent assigned to collect consignment',
    matchedStatuses: ['PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'CONFIRMED'],
    eventType: 'COURIER_ASSIGNED'
  },
  {
    key: 'IN_TRANSIT',
    label: 'Donor Handover & In Transit',
    sublabel: 'QR scanned at donor doorstep; GPS transit telemetry active',
    matchedStatuses: ['PICKED_UP', 'IN_TRANSIT', 'CONFIRMED'],
    eventType: 'PICKUP_VERIFIED'
  },
  {
    key: 'CONFIRMED',
    label: 'Institution Handover Confivered',
    sublabel: 'Director verified goods; tamper-evident proof certificate sealed',
    matchedStatuses: ['CONFIRMED'],
    eventType: 'DELIVERY_CONFIRMED'
  }
];

interface Props {
  currentStatus: DonationStatus;
  blocks: LedgerBlock[];
}

export const ChainOfCustodyTimeline: React.FC<Props> = ({ currentStatus, blocks }) => {
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);

  const getStepState = (stepIndex: number, step: StepDef): 'COMPLETED' | 'ACTIVE' | 'PENDING' => {
    const isStepReached = step.matchedStatuses.includes(currentStatus);

    if (currentStatus === 'CONFIRMED') {
      return 'COMPLETED';
    }

    if (!isStepReached) {
      return 'PENDING';
    }

    // Determine if this is the active (latest reached) step
    const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === currentStatus);
    if (stepIndex === currentStepIndex) {
      return 'ACTIVE';
    }

    if (stepIndex < currentStepIndex) {
      return 'COMPLETED';
    }

    return 'PENDING';
  };

  const findBlockForStep = (step: StepDef): LedgerBlock | undefined => {
    if (!step.eventType) return undefined;
    return blocks.find(b => b.eventType === step.eventType);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Cryptographic Chain of Custody</Text>
        <Text style={styles.badgeText}>SHA-256 Ledger</Text>
      </View>

      <View style={styles.timelineWrapper}>
        {TIMELINE_STEPS.map((step, idx) => {
          const state = getStepState(idx, step);
          const block = findBlockForStep(step);
          const isLast = idx === TIMELINE_STEPS.length - 1;

          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Left Column: Icon & Connecting Line */}
              <View style={styles.indicatorCol}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => block && setSelectedBlock(block)}
                  disabled={!block}
                  style={[
                    styles.circle,
                    state === 'COMPLETED' && styles.circleCompleted,
                    state === 'ACTIVE' && styles.circleActive,
                    state === 'PENDING' && styles.circlePending
                  ]}
                >
                  {state === 'COMPLETED' ? (
                    <Text style={styles.checkIcon}>✓</Text>
                  ) : state === 'ACTIVE' ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <Text style={styles.pendingDot}>○</Text>
                  )}
                </TouchableOpacity>
                {!isLast && (
                  <View
                    style={[
                      styles.connectorLine,
                      state === 'COMPLETED' ? styles.lineCompleted : styles.linePending
                    ]}
                  />
                )}
              </View>

              {/* Right Column: Step Info */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => block && setSelectedBlock(block)}
                disabled={!block}
                style={styles.contentCol}
              >
                <View style={styles.labelRow}>
                  <Text
                    style={[
                      styles.stepLabel,
                      state === 'COMPLETED' && styles.labelCompleted,
                      state === 'ACTIVE' && styles.labelActive,
                      state === 'PENDING' && styles.labelPending
                    ]}
                  >
                    {step.label}
                  </Text>
                  {block && (
                    <View style={styles.blockPill}>
                      <Text style={styles.blockPillText}>Block #{block.index}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.stepSublabel}>{step.sublabel}</Text>

                {block && (
                  <View style={styles.metaRow}>
                    <Text style={styles.actorText}>
                      By: <Text style={styles.actorBold}>{block.actorName}</Text> ({block.actorRole})
                    </Text>
                    <Text style={styles.timestampText}>
                      {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}

                {state === 'ACTIVE' && (
                  <View style={styles.activeBanner}>
                    <Text style={styles.activeBannerText}>● CURRENT STAGE IN PROGRESS</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Ledger Block Detail Modal */}
      <Modal
        visible={!!selectedBlock}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBlock(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ledger Block #{selectedBlock?.index}</Text>
                <Text style={styles.modalSubtitle}>{selectedBlock?.eventType}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedBlock(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>CURRENT BLOCK SHA-256 HASH</Text>
                <Text selectable style={styles.hashText}>{selectedBlock?.blockHash}</Text>
              </View>

              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>PREVIOUS BLOCK HASH</Text>
                <Text selectable style={styles.hashText}>{selectedBlock?.previousHash}</Text>
              </View>

              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>SIGNING ACTOR</Text>
                <Text style={styles.infoValue}>
                  {selectedBlock?.actorName} ({selectedBlock?.actorRole})
                </Text>
                <Text style={styles.infoValueSub}>ID: {selectedBlock?.actorId}</Text>
              </View>

              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>TIMESTAMP</Text>
                <Text style={styles.infoValue}>{selectedBlock?.timestamp}</Text>
              </View>

              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>AUDIT NARRATIVE</Text>
                <Text style={styles.infoValue}>{selectedBlock?.details}</Text>
              </View>

              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>PAYLOAD SHA-256 HASH</Text>
                <Text selectable style={styles.hashText}>{selectedBlock?.payloadHash}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setSelectedBlock(null)}
            >
              <Text style={styles.modalDoneBtnText}>Close Block Explorer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d9488',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  timelineWrapper: {
    paddingLeft: 4
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 70
  },
  indicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  // Exact visual colors matching web specifications:
  circleCompleted: {
    backgroundColor: '#0d9488' // Teal
  },
  circleActive: {
    backgroundColor: '#f59e0b', // Amber/coral
    borderWidth: 3,
    borderColor: '#fef3c7'
  },
  circlePending: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1'
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff'
  },
  pendingDot: {
    color: '#94a3b8',
    fontSize: 14
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginVertical: 4
  },
  lineCompleted: {
    backgroundColor: '#0d9488'
  },
  linePending: {
    backgroundColor: '#e2e8f0'
  },
  contentCol: {
    flex: 1,
    paddingBottom: 16
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700'
  },
  labelCompleted: {
    color: '#0f172a'
  },
  labelActive: {
    color: '#b45309'
  },
  labelPending: {
    color: '#94a3b8'
  },
  stepSublabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  blockPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  blockPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'monospace'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    alignItems: 'center'
  },
  actorText: {
    fontSize: 11,
    color: '#475569'
  },
  actorBold: {
    fontWeight: '700',
    color: '#0f172a'
  },
  timestampText: {
    fontSize: 11,
    color: '#94a3b8'
  },
  activeBanner: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6
  },
  activeBannerText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d9488',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold'
  },
  modalBody: {
    marginBottom: 12
  },
  infoGroup: {
    marginBottom: 14
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500'
  },
  infoValueSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  jsonBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10
  },
  jsonText: {
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontSize: 11
  },
  modalDoneBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  }
});
