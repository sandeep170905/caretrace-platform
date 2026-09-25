"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationRouter = void 0;
const express_1 = require("express");
const database_1 = require("../db/database");
const shared_1 = require("@caretrace/shared");
const ledgerService_1 = require("../services/ledgerService");
const qrService_1 = require("../services/qrService");
const notificationService_1 = require("../services/notificationService");
const transitService_1 = require("../services/transitService");
exports.donationRouter = (0, express_1.Router)();
// List donations with optional filters
exports.donationRouter.get('/', (req, res) => {
    let donations = database_1.db.getDonations();
    const { donorId, institutionId, agentId, status } = req.query;
    if (donorId)
        donations = donations.filter(d => d.donorId === donorId);
    if (institutionId)
        donations = donations.filter(d => d.institutionId === institutionId);
    if (agentId)
        donations = donations.filter(d => d.pickupAgentId === agentId);
    if (status)
        donations = donations.filter(d => d.status === status);
    res.json({ success: true, count: donations.length, donations });
});
// Get single donation by ID with full chain & QR code image
exports.donationRouter.get('/:id', async (req, res) => {
    const donation = database_1.db.getDonationById(req.params.id);
    if (!donation) {
        return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    const blocks = database_1.db.getLedgerBlocksForDonation(donation.id);
    const qrDataUrl = await qrService_1.QRService.generateQRDataUrl(donation.qrCodePayload);
    const telemetry = database_1.db.getTransitTelemetry(donation.id);
    res.json({
        success: true,
        donation,
        blocks,
        qrDataUrl,
        telemetry
    });
});
// Create a new donation matching a requirement
exports.donationRouter.post('/', async (req, res) => {
    const { donorId, requirementId, type, items, pickupAddress, pickupCoordinates } = req.body;
    if (!donorId || !requirementId || !items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing required donation fields' });
    }
    const donor = database_1.db.getUserById(donorId);
    if (!donor)
        return res.status(404).json({ success: false, error: 'Donor not found' });
    const requirement = database_1.db.getRequirementById(requirementId);
    if (!requirement)
        return res.status(404).json({ success: false, error: 'Requirement not found' });
    const institution = database_1.db.getInstitutionById(requirement.institutionId);
    if (!institution)
        return res.status(404).json({ success: false, error: 'Institution not found' });
    // Generate unique human-readable & cryptographic Donation ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const donationId = `CT-2026-${randomSuffix}`;
    // Default coordinates if not supplied
    const pCoords = pickupCoordinates || { latitude: 13.0850, longitude: 80.2101 }; // Anna Nagar West Depot, Chennai
    const dCoords = { latitude: institution.latitude, longitude: institution.longitude };
    // Generate cryptographic QR payload
    const qrCodePayload = qrService_1.QRService.createPayloadString(donationId, donor.id, institution.id);
    const now = new Date().toISOString();
    // Requirement 4: Pledged donations enter awaiting pickup assignment (MATCHED)
    const newDonation = {
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
    await database_1.db.upsertDonation(newDonation);
    // Record Genesis / Creation Block on Cryptographic Ledger
    const ledgerBlock = ledgerService_1.LedgerService.recordCheckpoint(donationId, 'DONATION_MATCHED', { id: donor.id, role: 'DONOR', name: donor.name }, `Donation initiated and matched to verified requirement: "${requirement.title}"`, {
        items,
        type: newDonation.type,
        institution: institution.name,
        pickupAddress: newDonation.pickupAddress
    });
    // Initialize transit telemetry
    transitService_1.TransitService.getOrInitTelemetry(donationId);
    // Update requirement fulfilled quantity
    const totalItemCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    requirement.fulfilledQuantity = Math.min(requirement.targetQuantity, requirement.fulfilledQuantity + totalItemCount);
    if (requirement.fulfilledQuantity >= requirement.targetQuantity) {
        requirement.status = 'FULFILLED';
    }
    await database_1.db.upsertRequirement(requirement);
    // Real-time broadcast
    notificationService_1.NotificationService.broadcast('DONATION_CREATED', {
        donation: newDonation,
        ledgerBlock
    });
    const qrDataUrl = await qrService_1.QRService.generateQRDataUrl(qrCodePayload);
    res.status(201).json({
        success: true,
        donation: newDonation,
        ledgerBlock,
        qrDataUrl
    });
});
// Create a simulated monetary donation via UPI
exports.donationRouter.post('/monetary', async (req, res) => {
    const { donorId, requirementId, amountInr, paymentNote } = req.body;
    const parsedAmount = Number(amountInr);
    if (!donorId || !requirementId || !parsedAmount || parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid donorId, requirementId, and positive amountInr are required' });
    }
    const donor = database_1.db.getUserById(donorId);
    if (!donor)
        return res.status(404).json({ success: false, error: 'Donor not found' });
    const requirement = database_1.db.getRequirementById(requirementId);
    if (!requirement)
        return res.status(404).json({ success: false, error: 'Requirement not found' });
    const institution = database_1.db.getInstitutionById(requirement.institutionId);
    if (!institution)
        return res.status(404).json({ success: false, error: 'Institution not found' });
    // Generate unique human-readable & cryptographic identifiers
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const donationId = `CT-2026-${randomSuffix}`;
    const receiptNumber = `REC-80G-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionRef = `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    // Monetary donation is instantly settled and confirmed
    const newDonation = {
        id: donationId,
        donorId: donor.id,
        donorName: donor.name,
        donorEmail: donor.email,
        requirementId: requirement.id,
        requirementTitle: requirement.title,
        institutionId: institution.id,
        institutionName: institution.name,
        type: 'FUNDS',
        items: [
            {
                name: `Monetary Contribution (${requirement.title})`,
                quantity: 1,
                unit: 'INR',
                estimatedValueInr: parsedAmount
            }
        ],
        status: 'CONFIRMED',
        pickupAddress: 'N/A (Direct Monetary Contribution)',
        destinationAddress: `${institution.address}, ${institution.city}, ${institution.state}`,
        pickupCoordinates: { latitude: 13.0850, longitude: 80.2101 },
        destinationCoordinates: { latitude: institution.latitude, longitude: institution.longitude },
        qrCodePayload: `CARETRACE:MONETARY:${donationId}:${transactionRef}`,
        monetaryAmountInr: parsedAmount,
        receiptNumber,
        paymentMethod: 'Direct Monetary Contribution',
        upiTransactionId: transactionRef,
        deliveryTimestamp: now,
        confirmationNotes: paymentNote || `Monetary contribution of ₹${parsedAmount.toLocaleString('en-IN')} confirmed to ${institution.name} (Txn Ref: ${transactionRef}).`,
        createdAt: now,
        updatedAt: now
    };
    await database_1.db.upsertDonation(newDonation);
    // Record MONETARY_DONATION_CONFIRMED on the Cryptographic Ledger
    const ledgerBlock = ledgerService_1.LedgerService.recordCheckpoint(donationId, 'MONETARY_DONATION_CONFIRMED', { id: donor.id, role: 'DONOR', name: donor.name }, `Monetary contribution of ₹${parsedAmount.toLocaleString('en-IN')} confirmed for ${institution.name} (Receipt #${receiptNumber})`, {
        amountInr: parsedAmount,
        donorId: donor.id,
        donorName: donor.name,
        institutionId: institution.id,
        institutionName: institution.name,
        receiptNumber,
        transactionRef
    });
    // Build Section 80G Digital Tax Exemption Receipt (Demo Sample)
    const receipt = {
        receiptNumber,
        donationId,
        amountInr: parsedAmount,
        amountInWords: (0, shared_1.numberToIndianWords)(parsedAmount),
        date: now,
        donorName: donor.name,
        donorEmail: donor.email,
        donorPhone: donor.phone,
        institutionName: institution.name,
        institutionRegistrationNumber: institution.registrationNumber,
        institutionTaxId: institution.taxId,
        institutionAddress: `${institution.address}, ${institution.city}, ${institution.state} ${institution.postalCode}`,
        requirementTitle: requirement.title,
        paymentMethod: 'Direct Monetary Contribution',
        upiTransactionId: transactionRef,
        ledgerBlockHash: ledgerBlock.blockHash,
        ledgerBlockIndex: ledgerBlock.index,
        isDemoSample: true
    };
    // Update requirement fulfilled quantity
    requirement.fulfilledQuantity = Math.min(requirement.targetQuantity, requirement.fulfilledQuantity + 1);
    if (requirement.fulfilledQuantity >= requirement.targetQuantity) {
        requirement.status = 'FULFILLED';
    }
    await database_1.db.upsertRequirement(requirement);
    // Broadcast real-time events via SSE
    notificationService_1.NotificationService.broadcast('DONATION_CREATED', {
        donation: newDonation,
        ledgerBlock
    });
    notificationService_1.NotificationService.broadcast('DONATION_STATUS_UPDATED', {
        donation: newDonation,
        status: 'CONFIRMED'
    });
    res.status(201).json({
        success: true,
        donation: newDonation,
        ledgerBlock,
        receipt,
        transactionRef
    });
});
// Retrieve Section 80G Tax Exemption Receipt for any monetary donation
exports.donationRouter.get('/:id/receipt', (req, res) => {
    const donation = database_1.db.getDonationById(req.params.id);
    if (!donation) {
        return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    if (donation.type !== 'FUNDS' || !donation.monetaryAmountInr) {
        return res.status(400).json({ success: false, error: 'Donation is not a monetary contribution' });
    }
    const institution = database_1.db.getInstitutionById(donation.institutionId);
    if (!institution) {
        return res.status(404).json({ success: false, error: 'Institution not found' });
    }
    const blocks = database_1.db.getLedgerBlocksForDonation(donation.id);
    const monetaryBlock = blocks.find(b => b.eventType === 'MONETARY_DONATION_CONFIRMED') || blocks[0];
    const receipt = {
        receiptNumber: donation.receiptNumber || `REC-80G-2026-${donation.id.replace(/\D/g, '')}`,
        donationId: donation.id,
        amountInr: donation.monetaryAmountInr,
        amountInWords: (0, shared_1.numberToIndianWords)(donation.monetaryAmountInr),
        date: donation.createdAt,
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        donorPhone: '+91 98401 23456',
        institutionName: institution.name,
        institutionRegistrationNumber: institution.registrationNumber,
        institutionTaxId: institution.taxId,
        institutionAddress: `${institution.address}, ${institution.city}, ${institution.state} ${institution.postalCode}`,
        requirementTitle: donation.requirementTitle,
        paymentMethod: donation.paymentMethod || 'Direct Monetary Contribution',
        upiTransactionId: donation.upiTransactionId || `TXN-2026-${donation.id.replace(/\D/g, '')}`,
        ledgerBlockHash: monetaryBlock ? monetaryBlock.blockHash : (donation.ledgerBlockHash || '0'.repeat(64)),
        ledgerBlockIndex: monetaryBlock ? monetaryBlock.index : 0,
        isDemoSample: true
    };
    res.json({ success: true, receipt });
});
