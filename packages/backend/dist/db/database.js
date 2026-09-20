"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, '../../data');
const DB_FILE = path_1.default.join(DATA_DIR, 'caretrace.db.json');
class Database {
    data = {
        users: [],
        institutions: [],
        requirements: [],
        donations: [],
        ledgerBlocks: [],
        riskAuditLogs: [],
        transitTelemetry: {},
        announcements: []
    };
    constructor() {
        this.ensureDirectoryExists();
        this.load();
    }
    ensureDirectoryExists() {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
    }
    load() {
        try {
            if (fs_1.default.existsSync(DB_FILE)) {
                const raw = fs_1.default.readFileSync(DB_FILE, 'utf-8');
                this.data = JSON.parse(raw);
                if (!this.data.announcements) {
                    this.data.announcements = [];
                }
            }
            else {
                this.save();
            }
        }
        catch (err) {
            console.warn('Failed to load existing db, initializing fresh:', err);
            this.save();
        }
    }
    save() {
        try {
            this.ensureDirectoryExists();
            fs_1.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to save database file:', err);
        }
    }
    // Users
    getUsers() {
        return this.data.users;
    }
    getUserById(id) {
        return this.data.users.find(u => u.id === id);
    }
    getUserByEmail(email) {
        return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    upsertUser(user) {
        const idx = this.data.users.findIndex(u => u.id === user.id);
        if (idx >= 0)
            this.data.users[idx] = user;
        else
            this.data.users.push(user);
        this.save();
    }
    // Institutions
    getInstitutions() {
        return this.data.institutions;
    }
    getInstitutionById(id) {
        return this.data.institutions.find(i => i.id === id);
    }
    upsertInstitution(inst) {
        const idx = this.data.institutions.findIndex(i => i.id === inst.id);
        if (idx >= 0)
            this.data.institutions[idx] = inst;
        else
            this.data.institutions.push(inst);
        this.save();
    }
    // Requirements
    getRequirements() {
        return this.data.requirements;
    }
    getRequirementById(id) {
        return this.data.requirements.find(r => r.id === id);
    }
    upsertRequirement(req) {
        const idx = this.data.requirements.findIndex(r => r.id === req.id);
        if (idx >= 0)
            this.data.requirements[idx] = req;
        else
            this.data.requirements.push(req);
        this.save();
    }
    deleteRequirement(id) {
        const idx = this.data.requirements.findIndex(r => r.id === id);
        if (idx >= 0) {
            this.data.requirements.splice(idx, 1);
            this.save();
            return true;
        }
        return false;
    }
    // Donations
    getDonations() {
        return this.data.donations;
    }
    getDonationById(id) {
        return this.data.donations.find(d => d.id === id);
    }
    upsertDonation(donation) {
        const idx = this.data.donations.findIndex(d => d.id === donation.id);
        if (idx >= 0)
            this.data.donations[idx] = donation;
        else
            this.data.donations.push(donation);
        this.save();
    }
    // Ledger Blocks
    getLedgerBlocks() {
        return this.data.ledgerBlocks.sort((a, b) => a.index - b.index);
    }
    getLedgerBlocksForDonation(donationId) {
        return this.data.ledgerBlocks
            .filter(b => b.donationId === donationId)
            .sort((a, b) => a.index - b.index);
    }
    addLedgerBlock(block) {
        this.data.ledgerBlocks.push(block);
        this.save();
    }
    // Tamper Block Demo Helper (to prove cryptographic integrity detection)
    tamperBlock(index, modifiedDetails) {
        const block = this.data.ledgerBlocks.find(b => b.index === index);
        if (block) {
            block.details = modifiedDetails;
            // Intentionally do NOT recompute blockHash to simulate malicious database record modification
            this.save();
            return true;
        }
        return false;
    }
    // Risk Audit Logs
    getRiskAuditLogs() {
        return this.data.riskAuditLogs;
    }
    addRiskAuditLog(flag) {
        this.data.riskAuditLogs.unshift(flag);
        this.save();
    }
    resolveRiskFlag(ruleId, resolvedBy) {
        const flag = this.data.riskAuditLogs.find(f => f.ruleId === ruleId && !f.resolved);
        if (flag) {
            flag.resolved = true;
            flag.resolvedBy = resolvedBy;
            flag.resolvedAt = new Date().toISOString();
            this.save();
        }
    }
    // Transit Telemetry
    getTransitTelemetry(donationId) {
        return this.data.transitTelemetry[donationId];
    }
    upsertTransitTelemetry(telemetry) {
        this.data.transitTelemetry[telemetry.donationId] = telemetry;
        this.save();
    }
    reset() {
        this.data = {
            users: [],
            institutions: [],
            requirements: [],
            donations: [],
            ledgerBlocks: [],
            riskAuditLogs: [],
            transitTelemetry: {},
            announcements: []
        };
        this.save();
    }
    // Announcements
    getAnnouncements() {
        return this.data.announcements || [];
    }
    getActiveAnnouncements() {
        const all = this.data.announcements || [];
        const now = new Date();
        return all.filter(a => {
            if (a.active === false)
                return false;
            if (a.expiresAt && new Date(a.expiresAt) <= now)
                return false;
            return true;
        });
    }
    getAnnouncementById(id) {
        return (this.data.announcements || []).find(a => a.id === id);
    }
    upsertAnnouncement(ann) {
        if (!this.data.announcements) {
            this.data.announcements = [];
        }
        const idx = this.data.announcements.findIndex(a => a.id === ann.id);
        if (idx >= 0) {
            this.data.announcements[idx] = ann;
        }
        else {
            this.data.announcements.unshift(ann); // newest first
        }
        this.save();
    }
}
exports.db = new Database();
