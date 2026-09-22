import fs from 'fs';
import path from 'path';
import {
  User,
  Institution,
  Requirement,
  Donation,
  LedgerBlock,
  RiskFlag,
  TransitTelemetry,
  Announcement
} from '@caretrace/shared';

export interface DatabaseSchema {
  users: User[];
  institutions: Institution[];
  requirements: Requirement[];
  donations: Donation[];
  ledgerBlocks: LedgerBlock[];
  riskAuditLogs: RiskFlag[];
  transitTelemetry: Record<string, TransitTelemetry>;
  announcements?: Announcement[];
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'caretrace.db.json');

export class Database {
  private data: DatabaseSchema = {
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

  private ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.announcements) {
          this.data.announcements = [];
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Failed to load existing db, initializing fresh:', err);
      this.save();
    }
  }

  public save() {
    try {
      this.ensureDirectoryExists();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public upsertUser(user: User) {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) this.data.users[idx] = user;
    else this.data.users.push(user);
    this.save();
  }

  // Institutions
  public getInstitutions(): Institution[] {
    return this.data.institutions;
  }

  public getInstitutionById(id: string): Institution | undefined {
    return this.data.institutions.find(i => i.id === id);
  }

  public upsertInstitution(inst: Institution) {
    const idx = this.data.institutions.findIndex(i => i.id === inst.id);
    if (idx >= 0) this.data.institutions[idx] = inst;
    else this.data.institutions.push(inst);
    this.save();
  }

  // Requirements
  public getRequirements(): Requirement[] {
    return this.data.requirements;
  }

  public getRequirementById(id: string): Requirement | undefined {
    return this.data.requirements.find(r => r.id === id);
  }

  public upsertRequirement(req: Requirement) {
    const idx = this.data.requirements.findIndex(r => r.id === req.id);
    if (idx >= 0) this.data.requirements[idx] = req;
    else this.data.requirements.push(req);
    this.save();
  }

  public deleteRequirement(id: string): boolean {
    const idx = this.data.requirements.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.data.requirements.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Donations
  public getDonations(): Donation[] {
    return this.data.donations;
  }

  public getDonationById(id: string): Donation | undefined {
    return this.data.donations.find(d => d.id === id);
  }

  public upsertDonation(donation: Donation) {
    const idx = this.data.donations.findIndex(d => d.id === donation.id);
    if (idx >= 0) this.data.donations[idx] = donation;
    else this.data.donations.push(donation);
    this.save();
  }

  public getDonationsByDonor(donorId: string): Donation[] {
    return this.data.donations.filter(d => d.donorId === donorId);
  }

  // Ledger Blocks
  public getLedgerBlocks(): LedgerBlock[] {
    return this.data.ledgerBlocks.sort((a, b) => a.index - b.index);
  }

  public getLedgerBlocksForDonation(donationId: string): LedgerBlock[] {
    return this.data.ledgerBlocks
      .filter(b => b.donationId === donationId)
      .sort((a, b) => a.index - b.index);
  }

  public addLedgerBlock(block: LedgerBlock) {
    this.data.ledgerBlocks.push(block);
    this.save();
  }

  // Tamper Block Demo Helper (to prove cryptographic integrity detection)
  public tamperBlock(index: number, modifiedDetails: string) {
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
  public getRiskAuditLogs(): RiskFlag[] {
    return this.data.riskAuditLogs;
  }

  public addRiskAuditLog(flag: RiskFlag) {
    this.data.riskAuditLogs.unshift(flag);
    this.save();
  }

  public resolveRiskFlag(ruleId: string, resolvedBy: string) {
    const flag = this.data.riskAuditLogs.find(f => f.ruleId === ruleId && !f.resolved);
    if (flag) {
      flag.resolved = true;
      flag.resolvedBy = resolvedBy;
      flag.resolvedAt = new Date().toISOString();
      this.save();
    }
  }

  // Transit Telemetry
  public getTransitTelemetry(donationId: string): TransitTelemetry | undefined {
    return this.data.transitTelemetry[donationId];
  }

  public upsertTransitTelemetry(telemetry: TransitTelemetry) {
    this.data.transitTelemetry[telemetry.donationId] = telemetry;
    this.save();
  }

  public reset() {
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
  public getAnnouncements(): Announcement[] {
    return this.data.announcements || [];
  }

  public getActiveAnnouncements(): Announcement[] {
    const all = this.data.announcements || [];
    const now = new Date();
    return all.filter(a => {
      if (a.active === false) return false;
      if (a.expiresAt && new Date(a.expiresAt) <= now) return false;
      return true;
    });
  }

  public getAnnouncementById(id: string): Announcement | undefined {
    return (this.data.announcements || []).find(a => a.id === id);
  }

  public upsertAnnouncement(ann: Announcement) {
    if (!this.data.announcements) {
      this.data.announcements = [];
    }
    const idx = this.data.announcements.findIndex(a => a.id === ann.id);
    if (idx >= 0) {
      this.data.announcements[idx] = ann;
    } else {
      this.data.announcements.unshift(ann); // newest first
    }
    this.save();
  }
}

export const db = new Database();

