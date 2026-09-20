"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const database_1 = require("../db/database");
const ledgerService_1 = require("../services/ledgerService");
exports.adminRouter = (0, express_1.Router)();
// Admin platform analytics
exports.adminRouter.get('/stats', (req, res) => {
    const users = database_1.db.getUsers();
    const institutions = database_1.db.getInstitutions();
    const requirements = database_1.db.getRequirements();
    const donations = database_1.db.getDonations();
    const blocks = database_1.db.getLedgerBlocks();
    const riskLogs = database_1.db.getRiskAuditLogs();
    const ledgerIntegrity = ledgerService_1.LedgerService.verifyChain();
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
exports.adminRouter.get('/risk-logs', (req, res) => {
    const logs = database_1.db.getRiskAuditLogs();
    res.json({ success: true, count: logs.length, logs });
});
// Resolve risk flag
exports.adminRouter.post('/risk-logs/resolve', (req, res) => {
    const { ruleId, adminName } = req.body;
    if (!ruleId)
        return res.status(400).json({ success: false, error: 'ruleId required' });
    database_1.db.resolveRiskFlag(ruleId, adminName || 'Compliance Admin');
    res.json({ success: true, message: `Risk flag ${ruleId} marked resolved.` });
});
// Get all donations awaiting pickup courier assignment
exports.adminRouter.get('/pending-courier-assignments', (req, res) => {
    const donations = database_1.db.getDonations().filter(d => !d.pickupAgentId || d.status === 'MATCHED');
    res.json({ success: true, count: donations.length, donations });
});
// Admin manually assigns courier to a donation
exports.adminRouter.post('/assign-courier', (req, res) => {
    const { donationId, agentId } = req.body;
    if (!donationId || !agentId) {
        return res.status(400).json({ success: false, error: 'donationId and agentId are required' });
    }
    const donation = database_1.db.getDonationById(donationId);
    if (!donation) {
        return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    const agent = database_1.db.getUserById(agentId);
    if (!agent || agent.role !== 'PICKUP_AGENT') {
        return res.status(404).json({ success: false, error: 'Valid pickup agent not found' });
    }
    donation.pickupAgentId = agent.id;
    donation.pickupAgentName = agent.name;
    donation.status = 'PICKUP_SCHEDULED';
    donation.updatedAt = new Date().toISOString();
    database_1.db.upsertDonation(donation);
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
exports.adminRouter.post('/auto-assign-all', (req, res) => {
    const agents = database_1.db.getUsers().filter(u => u.role === 'PICKUP_AGENT');
    if (agents.length === 0) {
        return res.status(400).json({ success: false, error: 'No active pickup agents available' });
    }
    const defaultAgent = agents[0]; // Sakthivel S
    const pending = database_1.db.getDonations().filter(d => !d.pickupAgentId || d.status === 'MATCHED');
    const now = new Date().toISOString();
    pending.forEach(d => {
        d.pickupAgentId = defaultAgent.id;
        d.pickupAgentName = defaultAgent.name;
        d.status = 'PICKUP_SCHEDULED';
        d.updatedAt = now;
        database_1.db.upsertDonation(d);
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
// Re-seed demo database cleanly
exports.adminRouter.post('/reset-seed', (req, res) => {
    const { runSeed } = require('../db/seed');
    runSeed();
    res.json({ success: true, message: 'Database reset and re-seeded successfully with localized Chennai records.' });
});
// ---------------- BROADCAST ANNOUNCEMENTS ----------------
// Get all announcements (for Admin overview)
exports.adminRouter.get('/announcements', (req, res) => {
    const announcements = database_1.db.getAnnouncements();
    res.json({ success: true, count: announcements.length, announcements });
});
// Post a new broadcast announcement
exports.adminRouter.post('/announcements', (req, res) => {
    const { title, message, urgency, expiresAt, createdBy } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Announcement title is required' });
    }
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Announcement message is required' });
    }
    const announcementId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const announcement = {
        id: announcementId,
        title: title.trim(),
        message: message.trim(),
        urgency: urgency === 'URGENT' ? 'URGENT' : 'GENERAL',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        active: true,
        createdBy: createdBy || 'Sandeep R (Platform Admin)'
    };
    database_1.db.upsertAnnouncement(announcement);
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
exports.adminRouter.patch('/announcements/:id/dismiss', (req, res) => {
    const { id } = req.params;
    const announcement = database_1.db.getAnnouncementById(id);
    if (!announcement) {
        return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    announcement.active = false;
    database_1.db.upsertAnnouncement(announcement);
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
