import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { Requirement, RequirementStatus } from '@caretrace/shared';
import { FraudScoringService } from '../services/fraudScoringService';
import { MLRiskService } from '../services/mlRiskService';
import { NotificationService } from '../services/notificationService';

export const requirementRouter = Router();

// List all requirements with optional filters
requirementRouter.get('/', (req: Request, res: Response) => {
  let requirements = db.getRequirements();

  const { category, urgency, status, institutionId } = req.query;

  if (category) {
    requirements = requirements.filter(r => r.category === category);
  }
  if (urgency) {
    requirements = requirements.filter(r => r.urgency === urgency);
  }
  if (status) {
    requirements = requirements.filter(r => r.status === status);
  }
  if (institutionId) {
    requirements = requirements.filter(r => r.institutionId === institutionId);
  }

  res.json({ success: true, count: requirements.length, requirements });
});

// Get single requirement
requirementRouter.get('/:id', (req: Request, res: Response) => {
  const requirement = db.getRequirementById(req.params.id);
  if (!requirement) {
    return res.status(404).json({ success: false, error: 'Requirement not found' });
  }
  res.json({ success: true, requirement });
});

// Post a new requirement (Institutions)
requirementRouter.post('/', (req: Request, res: Response) => {
  const {
    institutionId,
    category,
    title,
    description,
    targetQuantity,
    unit,
    urgency,
    documents
  } = req.body;

  if (!institutionId || !category || !title || !targetQuantity) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const inst = db.getInstitutionById(institutionId);
  if (!inst) {
    return res.status(404).json({ success: false, error: 'Institution not found' });
  }

  if (!inst.verified) {
    return res.status(403).json({
      success: false,
      error: 'Institution is unverified. Legal accreditation must be approved by Admin before posting requirements.'
    });
  }

  const now = new Date().toISOString();
  const partialReq: Partial<Requirement> = {
    institutionId,
    category,
    title,
    description: description || '',
    targetQuantity: Number(targetQuantity),
    unit: unit || 'units',
    urgency: urgency || 'MEDIUM',
    documents: documents || []
  };

  // Run Rule-Based Authenticity & Fraud Scoring Engine
  const scoringResult = FraudScoringService.evaluateAndLogRequirement(partialReq, institutionId);

  // Run ML Secondary Classifier (Logistic Regression)
  const pastReqs = db.getRequirements().filter(r => r.institutionId === institutionId);
  const mlPrediction = MLRiskService.predictRisk(partialReq, inst, pastReqs);

  // Auto-verify if score >= 70 and institution is verified; otherwise mark PENDING review
  let status: RequirementStatus = 'PENDING';
  if (inst.verified && scoringResult.isApproved) {
    status = 'VERIFIED';
  }

  const newRequirement: Requirement = {
    id: `req-${Date.now()}`,
    institutionId,
    institutionName: inst.name,
    category,
    title,
    description: description || '',
    targetQuantity: Number(targetQuantity),
    unit: unit || 'units',
    fulfilledQuantity: 0,
    urgency: urgency || 'MEDIUM',
    status,
    authenticityScore: scoringResult.score,
    mlRiskScore: mlPrediction.mlRiskScore,
    mlRiskTier: mlPrediction.mlRiskTier,
    riskFlags: scoringResult.flags,
    documents: documents || [],
    createdAt: now,
    updatedAt: now
  };

  db.upsertRequirement(newRequirement);

  NotificationService.broadcast('REQUIREMENT_CREATED', {
    requirement: newRequirement,
    scoringResult,
    mlPrediction
  });

  res.status(201).json({
    success: true,
    requirement: newRequirement,
    scoring: scoringResult
  });
});

// Admin verify or reject requirement
requirementRouter.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const requirement = db.getRequirementById(req.params.id);
  if (!requirement) {
    return res.status(404).json({ success: false, error: 'Requirement not found' });
  }

  requirement.status = status;
  requirement.updatedAt = new Date().toISOString();
  db.upsertRequirement(requirement);

  NotificationService.broadcast('REQUIREMENT_STATUS_UPDATED', { requirement });

  res.json({ success: true, requirement });
});

// Update / edit requirement (Institutions)
requirementRouter.put('/:id', (req: Request, res: Response) => {
  const requirement = db.getRequirementById(req.params.id);
  if (!requirement) {
    return res.status(404).json({ success: false, error: 'Requirement not found' });
  }

  const { title, description, targetQuantity, unit, urgency, category } = req.body;

  if (title) requirement.title = title.trim();
  if (description !== undefined) requirement.description = description.trim();
  if (targetQuantity) requirement.targetQuantity = Number(targetQuantity);
  if (unit) requirement.unit = unit.trim();
  if (urgency) requirement.urgency = urgency;
  if (category) requirement.category = category;
  requirement.updatedAt = new Date().toISOString();

  db.upsertRequirement(requirement);

  NotificationService.broadcast('REQUIREMENT_UPDATED', { requirement });
  res.json({ success: true, requirement, message: 'Requirement updated successfully' });
});

// Close requirement (Institutions / Director)
requirementRouter.patch('/:id/close', (req: Request, res: Response) => {
  const requirement = db.getRequirementById(req.params.id);
  if (!requirement) {
    return res.status(404).json({ success: false, error: 'Requirement not found' });
  }

  requirement.status = 'FULFILLED';
  requirement.updatedAt = new Date().toISOString();
  db.upsertRequirement(requirement);

  NotificationService.broadcast('REQUIREMENT_STATUS_UPDATED', { requirement });
  res.json({ success: true, requirement, message: 'Requirement marked as closed/fulfilled' });
});

// Delete requirement
requirementRouter.delete('/:id', (req: Request, res: Response) => {
  const deleted = db.deleteRequirement(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Requirement not found' });
  }

  NotificationService.broadcast('REQUIREMENT_DELETED', { id: req.params.id });
  res.json({ success: true, message: 'Requirement deleted' });
});

