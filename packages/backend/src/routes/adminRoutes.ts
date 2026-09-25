import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { LedgerService } from '../services/ledgerService';
import { Announcement } from '@caretrace/shared';

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
adminRouter.post('/risk-logs/resolve', async (req: Request, res: Response) => {
  const { ruleId, adminName } = req.body;
  if (!ruleId) return res.status(400).json({ success: false, error: 'ruleId required' });

  await db.resolveRiskFlag(ruleId, adminName || 'Compliance Admin');
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
adminRouter.post('/assign-courier', async (req: Request, res: Response) => {
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
  await db.upsertDonation(donation);

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
adminRouter.post('/auto-assign-all', async (req: Request, res: Response) => {
  const agents = db.getUsers().filter(u => u.role === 'PICKUP_AGENT');
  if (agents.length === 0) {
    return res.status(400).json({ success: false, error: 'No active pickup agents available' });
  }

  const defaultAgent = agents[0]; // Sakthivel S
  const pending = db.getDonations().filter(d => !d.pickupAgentId || d.status === 'MATCHED');

  const now = new Date().toISOString();
  for (const d of pending) {
    d.pickupAgentId = defaultAgent.id;
    d.pickupAgentName = defaultAgent.name;
    d.status = 'PICKUP_SCHEDULED';
    d.updatedAt = now;
    await db.upsertDonation(d);
  }

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

// Direct database persistence diagnostic endpoint
adminRouter.get('/db-diagnostic', async (req: Request, res: Response) => {
  try {
    const diagnostic = await db.getPostgresDiagnostic();
    res.json({ success: true, diagnostic });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Re-seed demo database cleanly
adminRouter.post('/reset-seed', async (req: Request, res: Response) => {
  const { runSeed } = require('../db/seed');
  await runSeed();
  res.json({ success: true, message: 'Database reset and re-seeded successfully with localized Chennai records.' });
});

// ---------------- BROADCAST ANNOUNCEMENTS ----------------

// Get all announcements (for Admin overview)
adminRouter.get('/announcements', (req: Request, res: Response) => {
  const announcements = db.getAnnouncements();
  res.json({ success: true, count: announcements.length, announcements });
});

// Post a new broadcast announcement
adminRouter.post('/announcements', async (req: Request, res: Response) => {
  const { title, message, urgency, expiresAt, createdBy } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Announcement title is required' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Announcement message is required' });
  }

  const announcementId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const announcement: Announcement = {
    id: announcementId,
    title: title.trim(),
    message: message.trim(),
    urgency: urgency === 'URGENT' ? 'URGENT' : 'GENERAL',
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    active: true,
    createdBy: createdBy || 'Sandeep R (Platform Admin)'
  };

  await db.upsertAnnouncement(announcement);

  // Broadcast live to all connected clients via SSE stream
  const { NotificationService } = require('../services/notificationService');
  NotificationService.broadcast('ANNOUNCEMENT_CREATED', announcement);

  res.status(201).json({
    success: true,
    announcement,
    message: `Announcement broadcast successfully across CareTrace platform.`
  });
});

// Dismiss/deactivate an announcement early
adminRouter.patch('/announcements/:id/dismiss', async (req: Request, res: Response) => {
  const { id } = req.params;
  const announcement = db.getAnnouncementById(id);

  if (!announcement) {
    return res.status(404).json({ success: false, error: 'Announcement not found' });
  }

  announcement.active = false;
  await db.upsertAnnouncement(announcement);

  // Broadcast dismissal event
  const { NotificationService } = require('../services/notificationService');
  NotificationService.broadcast('ANNOUNCEMENT_DISMISSED', {
    id: announcement.id,
    title: announcement.title,
    message: `Announcement was dismissed early by Admin.`
  });

  res.json({
    success: true,
    announcement,
    message: `Announcement ${id} dismissed early.`
  });
});


