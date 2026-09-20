"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryRouter = void 0;
const express_1 = require("express");
const database_1 = require("../db/database");
const qrService_1 = require("../services/qrService");
const ledgerService_1 = require("../services/ledgerService");
const notificationService_1 = require("../services/notificationService");
const transitService_1 = require("../services/transitService");
const fraudScoringService_1 = require("../services/fraudScoringService");
exports.deliveryRouter = (0, express_1.Router)();
// Confirm delivery handover via QR scan + recipient signature
exports.deliveryRouter.post('/scan', (req, res) => {
    const { qrPayload, recipientName, signature, notes, photoUrl, actorId } = req.body;
    if (!qrPayload) {
        return res.status(400).json({ success: false, error: 'qrPayload is required' });
    }
    // 1. Verify QR Payload
    const verification = qrService_1.QRService.verifyPayloadString(qrPayload);
    if (!verification.valid || !verification.donationId) {
        return res.status(400).json({ success: false, error: verification.error || 'Invalid QR code' });
    }
    const donation = database_1.db.getDonationById(verification.donationId);
    if (!donation) {
        return res.status(404).json({ success: false, error: 'Donation not found for scanned ID' });
    }
    const actor = database_1.db.getUserById(actorId || '') || {
        id: 'user-inst-dir',
        name: recipientName || 'Sister Maria (Director)',
        role: 'INSTITUTION'
    };
    const now = new Date().toISOString();
    // 2. Check for transit velocity anomalies
    if (donation.pickupTimestamp) {
        const distanceKm = transitService_1.TransitService.calculateDistanceKm(donation.pickupCoordinates, donation.destinationCoordinates);
        fraudScoringService_1.FraudScoringService.checkDeliveryAnomaly(donation.id, donation.pickupTimestamp, now, distanceKm);
    }
    // 3. Mark transit as 100% complete
    transitService_1.TransitService.advanceSimulation(donation.id, 100);
    // 4. Update Donation Status
    donation.status = 'CONFIRMED';
    donation.deliveryTimestamp = now;
    donation.recipientSignature = signature || 'Digital Handover Confirmed';
    donation.confirmationNotes = `${recipientName || 'Institution Staff'} - ${notes || 'Goods inspected in excellent condition.'}`;
    if (photoUrl)
        donation.proofPhotoUrl = photoUrl;
    donation.updatedAt = now;
    database_1.db.upsertDonation(donation);
    const hasPhoto = Boolean(photoUrl);
    // 5. Mine Final Immutable Proof-of-Delivery Block on Ledger
    const ledgerBlock = ledgerService_1.LedgerService.recordCheckpoint(donation.id, 'DELIVERY_CONFIRMED', { id: actor.id, role: actor.role, name: actor.name }, `Delivery verified and accepted at ${donation.institutionName}. Proof of delivery authenticated${hasPhoto ? ' with attached handover photo proof.' : '.'}`, {
        recipient: recipientName || actor.name,
        signature: donation.recipientSignature,
        notes: donation.confirmationNotes,
        itemsConfirmedCount: donation.items.length,
        hasPhotoProof: hasPhoto,
        photoAttached: hasPhoto
    });
    // 6. Generate Proof of Delivery Certificate
    const certificate = ledgerService_1.LedgerService.generateCertificate(donation.id);
    // 7. Broadcast real-time delivery confirmation
    notificationService_1.NotificationService.broadcast('DONATION_DELIVERED', {
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
exports.deliveryRouter.get('/certificate/:donationId', (req, res) => {
    const certificate = ledgerService_1.LedgerService.generateCertificate(req.params.donationId);
    if (!certificate) {
        return res.status(404).json({ success: false, error: 'Certificate not available or donation incomplete' });
    }
    res.json({ success: true, certificate });
});
