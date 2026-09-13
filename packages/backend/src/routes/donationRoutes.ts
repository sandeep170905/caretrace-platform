import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { Donation, DonationStatus } from '@caretrace/shared';
import { LedgerService } from '../services/ledgerService';
import { QRService } from '../services/qrService';
import { NotificationService } from '../services/notificationService';
import { TransitService } from '../services/transitService';

export const donationRouter = Router();

// List donations with optional filters
donationRouter.get('/', (req: Request, res: Response) => {
  let donations = db.getDonations();

  const { donorId, institutionId, agentId, status } = req.query;

  if (donorId) donations = donations.filter(d => d.donorId === donorId);
  if (institutionId) donations = donations.filter(d => d.institutionId === institutionId);
  if (agentId) donations = donations.filter(d => d.pickupAgentId === agentId);
  if (status) donations = donations.filter(d => d.status === status);

  res.json({ success: true, count: donations.length, donations });
});

// Get single donation by ID with full chain & QR code image
donationRouter.get('/:id', async (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ success: false, error: 'Donation not found' });
  }

  const blocks = db.getLedgerBlocksForDonation(donation.id);
  const qrDataUrl = await QRService.generateQRDataUrl(donation.qrCodePayload);
  const telemetry = db.getTransitTelemetry(donation.id);

  res.json({
    success: true,
    donation,
    blocks,
    qrDataUrl,
    telemetry
  });
});

// Create a new donation matching a requirement
donationRouter.post('/', async (req: Request, res: Response) => {
  const {
    donorId,
    requirementId,
    type,
    items,
    pickupAddress,
    pickupCoordinates
  } = req.body;

  if (!donorId || !requirementId || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing required donation fields' });
  }

  const donor = db.getUserById(donorId);
  if (!donor) return res.status(404).json({ success: false, error: 'Donor not found' });

  const requirement = db.getRequirementById(requirementId);
  if (!requirement) return res.status(404).json({ success: false, error: 'Requirement not found' });

  const institution = db.getInstitutionById(requirement.institutionId);
  if (!institution) return res.status(404).json({ success: false, error: 'Institution not found' });

  // Generate unique human-readable & cryptographic Donation ID
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const donationId = `CT-2026-${randomSuffix}`;

  // Default coordinates if not supplied
  const pCoords = pickupCoordinates || { latitude: 13.0850, longitude: 80.2101 }; // Anna Nagar West Depot, Chennai
  const dCoords = { latitude: institution.latitude, longitude: institution.longitude };

  // Generate cryptographic QR payload
  const qrCodePayload = QRService.createPayloadString(donationId, donor.id, institution.id);

  const now = new Date().toISOString();

  // Requirement 4: Pledged donations enter awaiting pickup assignment (MATCHED)
  const newDonation: Donation = {
    id: donationId,
    donorId: donor.id,
    donorName: donor.name,
    donorEmail: donor.email,
    requirementId: requirement.id,
    requirementTitle: requirement.title,
    institutionId: institution.id,
    institutionName: institution.name,
    type: type || 'PHYSICAL_GOODS',
    items,
    status: 'MATCHED',
    pickupAgentId: undefined,
    pickupAgentName: undefined,
    pickupAddress: pickupAddress || 'Anna Nagar West Logistics Depot, Chennai 600040',
    destinationAddress: `${institution.address}, ${institution.city}, ${institution.state}`,
    pickupCoordinates: pCoords,
    destinationCoordinates: dCoords,
    currentCoordinates: pCoords,
    qrCodePayload,
    createdAt: now,
    updatedAt: now
  };

  db.upsertDonation(newDonation);

  // Record Genesis / Creation Block on Cryptographic Ledger
  const ledgerBlock = LedgerService.recordCheckpoint(
    donationId,
    'DONATION_MATCHED',
    { id: donor.id, role: 'DONOR', name: donor.name },
    `Donation initiated and matched to verified requirement: "${requirement.title}"`,
    {
      items,
      type: newDonation.type,
      institution: institution.name,
      pickupAddress: newDonation.pickupAddress
    }
  );

  // Initialize transit telemetry
  TransitService.getOrInitTelemetry(donationId);

  // Update requirement fulfilled quantity
  const totalItemCount = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0);
  requirement.fulfilledQuantity = Math.min(
    requirement.targetQuantity,
    requirement.fulfilledQuantity + totalItemCount
  );
  if (requirement.fulfilledQuantity >= requirement.targetQuantity) {
    requirement.status = 'FULFILLED';
  }
  db.upsertRequirement(requirement);

  // Real-time broadcast
  NotificationService.broadcast('DONATION_CREATED', {
    donation: newDonation,
    ledgerBlock
  });

  const qrDataUrl = await QRService.generateQRDataUrl(qrCodePayload);

  res.status(201).json({
    success: true,
    donation: newDonation,
    ledgerBlock,
    qrDataUrl
  });
});

