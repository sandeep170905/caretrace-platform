"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionRouter = void 0;
const express_1 = require("express");
const database_1 = require("../db/database");
const notificationService_1 = require("../services/notificationService");
exports.institutionRouter = (0, express_1.Router)();
// List all institutions
exports.institutionRouter.get('/', (req, res) => {
    const institutions = database_1.db.getInstitutions();
    res.json({ success: true, institutions });
});
// Get institution detail by ID with its active requirements
exports.institutionRouter.get('/:id', (req, res) => {
    const institution = database_1.db.getInstitutionById(req.params.id);
    if (!institution) {
        return res.status(404).json({ success: false, error: 'Institution not found' });
    }
    const requirements = database_1.db.getRequirements().filter(r => r.institutionId === institution.id);
    const incomingDonations = database_1.db.getDonations().filter(d => d.institutionId === institution.id && d.status !== 'CONFIRMED');
    const completedDonations = database_1.db.getDonations().filter(d => d.institutionId === institution.id && d.status === 'CONFIRMED');
    res.json({
        success: true,
        institution,
        requirements,
        incomingDonations,
        completedDonations
    });
});
// Register new institution
exports.institutionRouter.post('/register', (req, res) => {
    const { name, registrationNumber, taxId, address, city, state, postalCode, latitude, longitude, capacity, currentChildrenCount, contactEmail, contactPhone, description } = req.body;
    if (!name || !registrationNumber || !contactEmail) {
        return res.status(400).json({ success: false, error: 'Missing mandatory fields' });
    }
    const newInst = {
        id: `inst-${Date.now()}`,
        name,
        registrationNumber,
        taxId: taxId || '12AA-TN-PENDING',
        address: address || '15 Nelson Manickam Road, Aminjikarai',
        city: city || 'Chennai',
        state: state || 'Tamil Nadu',
        postalCode: postalCode || '600029',
        latitude: latitude || 13.0732,
        longitude: longitude || 80.2183,
        capacity: Number(capacity) || 50,
        currentChildrenCount: Number(currentChildrenCount) || 35,
        verified: false, // Must be verified by admin
        trustScore: 70, // Provisional score
        contactEmail,
        contactPhone: contactPhone || '555-0100',
        description: description || 'Childcare and youth sanctuary institution'
    };
    database_1.db.upsertInstitution(newInst);
    notificationService_1.NotificationService.broadcast('INSTITUTION_REGISTERED', {
        id: newInst.id,
        name: newInst.name
    });
    res.status(201).json({ success: true, institution: newInst });
});
// Verify institution (Admin action)
exports.institutionRouter.patch('/:id/verify', (req, res) => {
    const inst = database_1.db.getInstitutionById(req.params.id);
    if (!inst)
        return res.status(404).json({ success: false, error: 'Institution not found' });
    inst.verified = true;
    inst.verificationDate = new Date().toISOString();
    inst.trustScore = Math.max(85, inst.trustScore);
    database_1.db.upsertInstitution(inst);
    notificationService_1.NotificationService.broadcast('INSTITUTION_VERIFIED', {
        id: inst.id,
        name: inst.name
    });
    res.json({ success: true, institution: inst });
});
