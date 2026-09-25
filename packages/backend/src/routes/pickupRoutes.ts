import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { QRService } from '../services/qrService';
import { LedgerService } from '../services/ledgerService';
import { NotificationService } from '../services/notificationService';
import { TransitService } from '../services/transitService';

export const pickupRouter = Router();

// Get active pickups for agent
pickupRouter.get('/assigned/:agentId', (req: Request, res: Response) => {
  const { agentId } = req.params;
  const donations = db.getDonations().filter(
    d => d.pickupAgentId === agentId && ['PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
  );
  res.json({ success: true, count: donations.length, donations });
});

// Agent scans QR at donor location to confirm pickup
pickupRouter.post('/scan', async (req: Request, res: Response) => {
  const { qrPayload, agentId, notes } = req.body;

  if (!qrPayload || !agentId) {
    return res.status(400).json({ success: false, error: 'qrPayload and agentId are required' });
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

  const agent = db.getUserById(agentId);
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
  await db.upsertDonation(donation);

  // Mine Immutable SHA-256 Ledger Block
  const ledgerBlock = LedgerService.recordCheckpoint(
    donation.id,
    'PICKUP_VERIFIED',
    { id: agent.id, role: 'PICKUP_AGENT', name: agent.name },
    `Physical pickup authenticated via QR scan by Agent ${agent.name}. Consignment in transit.`,
    {
      agent: agent.name,
      pickupLocation: donation.pickupAddress,
      notes: notes || 'Physical items verified against manifest.'
    }
  );

  // Initialize or step transit simulation
  TransitService.advanceSimulation(donation.id, 10);

  // Broadcast real-time status update to Donor and Institution
  NotificationService.broadcast('DONATION_STATUS_UPDATED', {
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

