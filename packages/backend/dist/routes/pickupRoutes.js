"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickupRouter = void 0;
const express_1 = require("express");
const database_1 = require("../db/database");
const qrService_1 = require("../services/qrService");
const ledgerService_1 = require("../services/ledgerService");
const notificationService_1 = require("../services/notificationService");
const transitService_1 = require("../services/transitService");
exports.pickupRouter = (0, express_1.Router)();
// Get active pickups for agent
exports.pickupRouter.get('/assigned/:agentId', (req, res) => {
    const { agentId } = req.params;
    const donations = database_1.db.getDonations().filter(d => d.pickupAgentId === agentId && ['PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status));
    res.json({ success: true, count: donations.length, donations });
});
// Agent scans QR at donor location to confirm pickup
exports.pickupRouter.post('/scan', async (req, res) => {
    const { qrPayload, agentId, notes } = req.body;
    if (!qrPayload || !agentId) {
        return res.status(400).json({ success: false, error: 'qrPayload and agentId are required' });
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
    const agent = database_1.db.getUserById(agentId);
    if (!agent) {
        return res.status(404).json({ success: false, error: 'Pickup agent not found' });
    }
    const now = new Date().toISOString();
    // Update Donation status
    donation.status = 'IN_TRANSIT';
    donation.pickupTimestamp = now;
    donation.pickupAgentId = agent.id;
    donation.pickupAgentName = agent.name;
    donation.updatedAt = now;
    await database_1.db.upsertDonation(donation);
    // Mine Immutable SHA-256 Ledger Block
    const ledgerBlock = ledgerService_1.LedgerService.recordCheckpoint(donation.id, 'PICKUP_VERIFIED', { id: agent.id, role: 'PICKUP_AGENT', name: agent.name }, `Physical pickup authenticated via QR scan by Agent ${agent.name}. Consignment in transit.`, {
        agent: agent.name,
        pickupLocation: donation.pickupAddress,
        notes: notes || 'Physical items verified against manifest.'
    });
    // Initialize or step transit simulation
    transitService_1.TransitService.advanceSimulation(donation.id, 10);
    // Broadcast real-time status update to Donor and Institution
    notificationService_1.NotificationService.broadcast('DONATION_STATUS_UPDATED', {
        donationId: donation.id,
        status: donation.status,
        message: `Consignment picked up by ${agent.name} and is en route!`,
        ledgerBlock
    });
    res.json({
        success: true,
        message: 'Pickup verified and logged to tamper-evident ledger.',
        donation,
        ledgerBlock
    });
});
