import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { QRService } from '../services/qrService';
import { LedgerService } from '../services/ledgerService';
import { NotificationService } from '../services/notificationService';
import { TransitService } from '../services/transitService';
import { FraudScoringService } from '../services/fraudScoringService';

export const deliveryRouter = Router();

// Confirm delivery handover via QR scan + recipient signature
deliveryRouter.post('/scan', (req: Request, res: Response) => {
  const { qrPayload, recipientName, signature, notes, photoUrl, actorId } = req.body;

  if (!qrPayload) {
    return res.status(400).json({ success: false, error: 'qrPayload is required' });
  }

  // 1. Verify QR Payload
  const verification = QRService.verifyPayloadString(qrPayload);
  if (!verification.valid || !verification.donationId) {
    return res.status(400).json({ success: false, error: verification.error || 'Invalid QR code' });
  }

  const donation = db.getDonationById(verification.donationId);
  if (!donation) {
    return res.status(404).json({ success: false, error: 'Donation not found for scanned ID' });
  }

  const actor = db.getUserById(actorId || '') || {
    id: 'user-inst-dir',
    name: recipientName || 'Sister Maria (Director)',
    role: 'INSTITUTION' as const
  };

  const now = new Date().toISOString();

  // 2. Check for transit velocity anomalies
  if (donation.pickupTimestamp) {
    const distanceKm = TransitService.calculateDistanceKm(
      donation.pickupCoordinates,
      donation.destinationCoordinates
    );
    FraudScoringService.checkDeliveryAnomaly(donation.id, donation.pickupTimestamp, now, distanceKm);
  }

  // 3. Mark transit as 100% complete
  TransitService.advanceSimulation(donation.id, 100);

  // 4. Update Donation Status
  donation.status = 'CONFIRMED';
  donation.deliveryTimestamp = now;
  donation.recipientSignature = signature || 'Digital Handover Confirmed';
  donation.confirmationNotes = `${recipientName || 'Institution Staff'} - ${notes || 'Goods inspected in excellent condition.'}`;
  if (photoUrl) donation.proofPhotoUrl = photoUrl;
  donation.updatedAt = now;
  db.upsertDonation(donation);

  const hasPhoto = Boolean(photoUrl);

  // 5. Mine Final Immutable Proof-of-Delivery Block on Ledger
  const ledgerBlock = LedgerService.recordCheckpoint(
    donation.id,
    'DELIVERY_CONFIRMED',
    { id: actor.id, role: actor.role as any, name: actor.name },
    `Delivery verified and accepted at ${donation.institutionName}. Proof of delivery authenticated${hasPhoto ? ' with attached handover photo proof.' : '.'}`,
    {
      recipient: recipientName || actor.name,
      signature: donation.recipientSignature,
      notes: donation.confirmationNotes,
      itemsConfirmedCount: donation.items.length,
      hasPhotoProof: hasPhoto,
      photoAttached: hasPhoto
    }
  );

  // 6. Generate Proof of Delivery Certificate
  const certificate = LedgerService.generateCertificate(donation.id);

  // 7. Broadcast real-time delivery confirmation
  NotificationService.broadcast('DONATION_DELIVERED', {
    donationId: donation.id,
    donorName: donation.donorName,
    institutionName: donation.institutionName,
    message: `🎉 Great news! Your donation ${donation.id} has been delivered & confirmed on-chain.`,
    certificate,
    ledgerBlock
  });

  res.json({
    success: true,
    message: 'Delivery successfully confirmed and sealed on tamper-evident ledger.',
    donation,
    certificate,
    ledgerBlock
  });
});

// Retrieve Proof of Delivery Certificate
deliveryRouter.get('/certificate/:donationId', (req: Request, res: Response) => {
  const certificate = LedgerService.generateCertificate(req.params.donationId);
  if (!certificate) {
    return res.status(404).json({ success: false, error: 'Certificate not available or donation incomplete' });
  }
  res.json({ success: true, certificate });
});

