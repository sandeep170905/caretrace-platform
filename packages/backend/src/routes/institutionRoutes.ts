import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { Institution } from '@caretrace/shared';
import { NotificationService } from '../services/notificationService';

export const institutionRouter = Router();

// List all institutions
institutionRouter.get('/', (req: Request, res: Response) => {
  const institutions = db.getInstitutions();
  res.json({ success: true, institutions });
});

// Get institution detail by ID with its active requirements
institutionRouter.get('/:id', (req: Request, res: Response) => {
  const institution = db.getInstitutionById(req.params.id);
  if (!institution) {
    return res.status(404).json({ success: false, error: 'Institution not found' });
  }

  const requirements = db.getRequirements().filter(r => r.institutionId === institution.id);
  const incomingDonations = db.getDonations().filter(
    d => d.institutionId === institution.id && d.status !== 'CONFIRMED'
  );
  const completedDonations = db.getDonations().filter(
    d => d.institutionId === institution.id && d.status === 'CONFIRMED'
  );

  res.json({
    success: true,
    institution,
    requirements,
    incomingDonations,
    completedDonations
  });
});

// Register new institution
institutionRouter.post('/register', (req: Request, res: Response) => {
  const {
    name,
    registrationNumber,
    taxId,
    address,
    city,
    state,
    postalCode,
    latitude,
    longitude,
    capacity,
    currentChildrenCount,
    contactEmail,
    contactPhone,
    description
  } = req.body;

  if (!name || !registrationNumber || !contactEmail) {
    return res.status(400).json({ success: false, error: 'Missing mandatory fields' });
  }

  const newInst: Institution = {
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

  db.upsertInstitution(newInst);

  NotificationService.broadcast('INSTITUTION_REGISTERED', {
    id: newInst.id,
    name: newInst.name
  });

  res.status(201).json({ success: true, institution: newInst });
});

// Verify institution (Admin action)
institutionRouter.patch('/:id/verify', (req: Request, res: Response) => {
  const inst = db.getInstitutionById(req.params.id);
  if (!inst) return res.status(404).json({ success: false, error: 'Institution not found' });

  inst.verified = true;
  inst.verificationDate = new Date().toISOString();
  inst.trustScore = Math.max(85, inst.trustScore);
  db.upsertInstitution(inst);

  NotificationService.broadcast('INSTITUTION_VERIFIED', {
    id: inst.id,
    name: inst.name
  });

  res.json({ success: true, institution: inst });
});

