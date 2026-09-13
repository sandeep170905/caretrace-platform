import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { LedgerService } from '../services/ledgerService';

export const adminRouter = Router();

// Admin platform analytics
adminRouter.get('/stats', (req: Request, res: Response) => {
  const users = db.getUsers();
  const institutions = db.getInstitutions();
  const requirements = db.getRequirements();
  const donations = db.getDonations();
  const blocks = db.getLedgerBlocks();
  const riskLogs = db.getRiskAuditLogs();
  const ledgerIntegrity = LedgerService.verifyChain();

  const totalChildren = institutions.reduce((acc, inst) => acc + inst.currentChildrenCount, 0);
  const deliveredDonations = donations.filter(d => d.status === 'CONFIRMED');

  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      institutionsCount: institutions.length,
      verifiedInstitutions: institutions.filter(i => i.verified).length,
      totalChildrenSupported: totalChildren,
      totalRequirements: requirements.length,
      activeRequirements: requirements.filter(r => r.status === 'VERIFIED').length,
      totalDonations: donations.length,
      completedDonations: deliveredDonations.length,
      inTransitDonations: donations.filter(d => d.status === 'IN_TRANSIT').length,
      totalLedgerBlocks: blocks.length,
      unresolvedRiskFlags: riskLogs.filter(f => !f.resolved).length,
      chainIntegrityStatus: ledgerIntegrity.isValid ? 'SECURE' : 'COMPROMISED'
    }
  });
});

// Admin risk audit logs
adminRouter.get('/risk-logs', (req: Request, res: Response) => {
  const logs = db.getRiskAuditLogs();
  res.json({ success: true, count: logs.length, logs });
});

// Resolve risk flag
adminRouter.post('/risk-logs/resolve', (req: Request, res: Response) => {
  const { ruleId, adminName } = req.body;
  if (!ruleId) return res.status(400).json({ success: false, error: 'ruleId required' });

  db.resolveRiskFlag(ruleId, adminName || 'Compliance Admin');
  res.json({ success: true, message: `Risk flag ${ruleId} marked resolved.` });
});

// Get all donations awaiting pickup courier assignment
adminRouter.get('/pending-courier-assignments', (req: Request, res: Response) => {
  const donations = db.getDonations().filter(
    d => !d.pickupAgentId || d.status === 'MATCHED'
  );
  res.json({ success: true, count: donations.length, donations });
});

// Admin manually assigns courier to a donation
adminRouter.post('/assign-courier', (req: Request, res: Response) => {
  const { donationId, agentId } = req.body;
  if (!donationId || !agentId) {
    return res.status(400).json({ success: false, error: 'donationId and agentId are required' });
  }

  const donation = db.getDonationById(donationId);
  if (!donation) {
    return res.status(404).json({ success: false, error: 'Donation not found' });
  }

  const agent = db.getUserById(agentId);
  if (!agent || agent.role !== 'PICKUP_AGENT') {
    return res.status(404).json({ success: false, error: 'Valid pickup agent not found' });
  }

  donation.pickupAgentId = agent.id;
  donation.pickupAgentName = agent.name;
  donation.status = 'PICKUP_SCHEDULED';
  donation.updatedAt = new Date().toISOString();
  db.upsertDonation(donation);

  // Broadcast to live SSE stream
  const { NotificationService } = require('../services/notificationService');
  NotificationService.broadcast('DONATION_STATUS_UPDATED', {
    donationId: donation.id,
    status: donation.status,
    agentName: agent.name,
    message: `Courier ${agent.name} assigned to consignment ${donation.id}`
  });

  res.json({ success: true, donation, message: `Consignment ${donation.id} assigned to courier ${agent.name}` });
});

// Admin 1-Click Auto-Assign all pending donations to active field courier
adminRouter.post('/auto-assign-all', (req: Request, res: Response) => {
  const agents = db.getUsers().filter(u => u.role === 'PICKUP_AGENT');
  if (agents.length === 0) {
    return res.status(400).json({ success: false, error: 'No active pickup agents available' });
  }

  const defaultAgent = agents[0]; // Sakthivel S
  const pending = db.getDonations().filter(d => !d.pickupAgentId || d.status === 'MATCHED');

  const now = new Date().toISOString();
  pending.forEach(d => {
    d.pickupAgentId = defaultAgent.id;
    d.pickupAgentName = defaultAgent.name;
    d.status = 'PICKUP_SCHEDULED';
    d.updatedAt = now;
    db.upsertDonation(d);
  });

  const { NotificationService } = require('../services/notificationService');
  NotificationService.broadcast('DONATION_STATUS_UPDATED', {
    message: `All ${pending.length} pending consignments auto-dispatched to ${defaultAgent.name}`
  });

  res.json({
    success: true,
    count: pending.length,
    agent: defaultAgent.name,
    message: `Successfully dispatched ${pending.length} consignments to courier ${defaultAgent.name}`
  });
});

