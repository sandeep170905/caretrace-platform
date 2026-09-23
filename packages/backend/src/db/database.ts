import fs from 'fs';
import path from 'path';
import BetterSqlite3 from 'better-sqlite3';
import knex, { Knex } from 'knex';
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
import {
  userToRow,
  rowToUser,
  institutionToRow,
  rowToInstitution,
  requirementToRow,
  rowToRequirement,
  donationToRow,
  rowToDonation,
  announcementToRow,
  rowToAnnouncement,
  riskFlagToRow,
  rowToRiskFlag,
  telemetryToRow,
  rowToTelemetry,
  initSqlSchema
} from './sqlSchema';

const DATA_DIR = path.resolve(__dirname, '../../data');
const SQLITE_FILE = path.join(DATA_DIR, 'caretrace.sqlite');
const LEDGER_FILE = path.join(DATA_DIR, 'caretrace.ledger.json');

export class Database {
  private isPostgres: boolean;
  private pgKnex?: Knex;
  private sqlite?: BetterSqlite3.Database;

  public getEngine(): 'postgres' | 'sqlite' {
    return this.isPostgres ? 'postgres' : 'sqlite';
  }

  // In-memory ledger store (ISSUE 2: separate, tamper-evident hash-chain)
  private ledgerBlocks: LedgerBlock[] = [];

  // Memory cache for PostgreSQL mode to support zero-latency reads
  private pgCache: {
    users: User[];
    institutions: Institution[];
    requirements: Requirement[];
    donations: Donation[];
    announcements: Announcement[];
    riskAuditLogs: RiskFlag[];
    transitTelemetry: Record<string, TransitTelemetry>;
  } = {
    users: [],
    institutions: [],
    requirements: [],
    donations: [],
    announcements: [],
    riskAuditLogs: [],
    transitTelemetry: {}
  };

  constructor() {
    this.ensureDataDir();
    this.isPostgres = Boolean(process.env.DATABASE_URL);

    if (this.isPostgres) {
      console.log('🐘 CareTrace Database Engine: PostgreSQL via DATABASE_URL');
      this.initPostgres();
    } else {
      console.log(`📁 CareTrace Database Engine: SQLite at ${SQLITE_FILE}`);
      this.initSqlite();
    }

    this.loadLedger();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  // -------------------------------------------------------------
  // Engine Initialization: SQLite (Local & Offline Default)
  // -------------------------------------------------------------
  private initSqlite() {
    this.sqlite = new BetterSqlite3(SQLITE_FILE);
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('synchronous = NORMAL');

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        avatar TEXT,
        institution_id TEXT,
        password_hash TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS institutions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        registration_number TEXT NOT NULL,
        tax_id TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        capacity INTEGER NOT NULL,
        current_children_count INTEGER NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        verification_date TEXT,
        trust_score INTEGER NOT NULL DEFAULT 50,
        contact_email TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        description TEXT NOT NULL,
        website TEXT
      );

      CREATE TABLE IF NOT EXISTS requirements (
        id TEXT PRIMARY KEY,
        institution_id TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        target_quantity INTEGER NOT NULL,
        unit TEXT NOT NULL,
        fulfilled_quantity INTEGER NOT NULL DEFAULT 0,
        urgency TEXT NOT NULL,
        status TEXT NOT NULL,
        authenticity_score INTEGER NOT NULL,
        ml_risk_score REAL DEFAULT 0.05,
        ml_risk_tier TEXT DEFAULT 'LOW',
        risk_flags_json TEXT,
        documents_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        donor_id TEXT NOT NULL,
        donor_name TEXT NOT NULL,
        donor_email TEXT NOT NULL,
        requirement_id TEXT NOT NULL,
        requirement_title TEXT NOT NULL,
        institution_id TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        type TEXT NOT NULL,
        items_json TEXT NOT NULL,
        status TEXT NOT NULL,
        pickup_agent_id TEXT,
        pickup_agent_name TEXT,
        pickup_address TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        pickup_coordinates_json TEXT NOT NULL,
        destination_coordinates_json TEXT NOT NULL,
        current_coordinates_json TEXT NOT NULL,
        qr_code_payload TEXT NOT NULL,
        pickup_timestamp TEXT,
        delivery_timestamp TEXT,
        confirmation_notes TEXT,
        recipient_signature TEXT,
        proof_photo_url TEXT,
        monetary_amount_inr INTEGER,
        receipt_number TEXT,
        payment_method TEXT,
        upi_transaction_id TEXT,
        ledger_block_hash TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        urgency TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        expires_at TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS risk_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        triggered_at TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        resolved_by TEXT,
        resolved_at TEXT
      );

      CREATE TABLE IF NOT EXISTS transit_telemetry (
        donation_id TEXT PRIMARY KEY,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        current_address TEXT NOT NULL,
        speed_kmh INTEGER NOT NULL,
        estimated_arrival_minutes INTEGER NOT NULL,
        progress_percentage INTEGER NOT NULL,
        last_updated TEXT NOT NULL
      );
    `);
  }

  private initPromise?: Promise<void>;

  public async init(): Promise<void> {
    if (this.isPostgres && this.initPromise) {
      await this.initPromise;
    }
  }

  // -------------------------------------------------------------
  // Engine Initialization: PostgreSQL (Cloud / Render Production)
  // -------------------------------------------------------------
  private initPostgres() {
    this.pgKnex = knex({
      client: 'pg',
      connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      },
      pool: { min: 2, max: 10 }
    });

    // Run schema migrations and load initial data into memory
    this.initPromise = (async () => {
      try {
        await initSqlSchema(this.pgKnex!);
        console.log('✅ PostgreSQL schema verified & synchronized.');
        await this.syncFromPostgres();
      } catch (err) {
        console.error('❌ Failed to initialize PostgreSQL schema:', err);
      }
    })();
  }

  private async syncFromPostgres() {
    if (!this.pgKnex) return;
    try {
      const usersRows = await this.pgKnex('users').select('*');
      this.pgCache.users = usersRows.map(rowToUser);

      const instRows = await this.pgKnex('institutions').select('*');
      this.pgCache.institutions = instRows.map(rowToInstitution);

      const reqRows = await this.pgKnex('requirements').select('*');
      this.pgCache.requirements = reqRows.map(rowToRequirement);

      const donRows = await this.pgKnex('donations').select('*');
      this.pgCache.donations = donRows.map(rowToDonation);

      const annRows = await this.pgKnex('announcements').select('*').orderBy('created_at', 'desc');
      this.pgCache.announcements = annRows.map(rowToAnnouncement);

      const riskRows = await this.pgKnex('risk_audit_logs').select('*').orderBy('triggered_at', 'desc');
      this.pgCache.riskAuditLogs = riskRows.map(rowToRiskFlag);

      const telRows = await this.pgKnex('transit_telemetry').select('*');
      this.pgCache.transitTelemetry = {};
      telRows.forEach((r) => {
        const tel = rowToTelemetry(r);
        this.pgCache.transitTelemetry[tel.donationId] = tel;
      });
      console.log(`✅ Loaded from PostgreSQL: ${this.pgCache.users.length} users, ${this.pgCache.donations.length} donations.`);
    } catch (err) {
      console.error('Failed to sync data from PostgreSQL:', err);
    }
  }

  // -------------------------------------------------------------
  // ISSUE 2: Separate Cryptographic Ledger Store (Tamper-Evident)
  // -------------------------------------------------------------
  private loadLedger() {
    try {
      if (fs.existsSync(LEDGER_FILE)) {
        const raw = fs.readFileSync(LEDGER_FILE, 'utf-8');
        this.ledgerBlocks = JSON.parse(raw);
      } else {
        // Check fallback in legacy caretrace.db.json if migrating
        const legacyFile = path.join(DATA_DIR, 'caretrace.db.json');
        if (fs.existsSync(legacyFile)) {
          const raw = fs.readFileSync(legacyFile, 'utf-8');
          const legacy = JSON.parse(raw);
          if (Array.isArray(legacy.ledgerBlocks) && legacy.ledgerBlocks.length > 0) {
            this.ledgerBlocks = legacy.ledgerBlocks;
            this.saveLedger();
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load ledger file:', e);
      this.ledgerBlocks = [];
    }
  }

  private saveLedger() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(LEDGER_FILE, JSON.stringify(this.ledgerBlocks, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save ledger file:', e);
    }
  }

  public getLedgerBlocks(): LedgerBlock[] {
    return [...this.ledgerBlocks].sort((a, b) => a.index - b.index);
  }

  public getLedgerBlocksForDonation(donationId: string): LedgerBlock[] {
    return this.ledgerBlocks
      .filter(b => b.donationId === donationId)
      .sort((a, b) => a.index - b.index);
  }

  public addLedgerBlock(block: LedgerBlock) {
    this.ledgerBlocks.push(block);
    this.saveLedger();
  }

  public tamperBlock(index: number, modifiedDetails: string): boolean {
    const block = this.ledgerBlocks.find(b => b.index === index);
    if (block) {
      block.details = modifiedDetails;
      this.saveLedger();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // Users (SQL: SQLite / PostgreSQL)
  // -------------------------------------------------------------
  public getUsers(): User[] {
    if (this.isPostgres) {
      return this.pgCache.users;
    }
    const rows = this.sqlite!.prepare('SELECT * FROM users').all();
    return rows.map(rowToUser);
  }

  public getUserById(id: string): User | undefined {
    if (this.isPostgres) {
      return this.pgCache.users.find(u => u.id === id);
    }
    const row = this.sqlite!.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? rowToUser(row) : undefined;
  }

  public getUserByEmail(email: string): User | undefined {
    const norm = email.toLowerCase().trim();
    if (this.isPostgres) {
      return this.pgCache.users.find(u => u.email.toLowerCase() === norm);
    }
    const row = this.sqlite!.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(norm);
    return row ? rowToUser(row) : undefined;
  }

  public upsertUser(user: User) {
    const row = userToRow(user);

    if (this.isPostgres) {
      const idx = this.pgCache.users.findIndex(u => u.id === user.id);
      if (idx >= 0) this.pgCache.users[idx] = user;
      else this.pgCache.users.push(user);

      this.pgKnex!('users')
        .insert(row)
        .onConflict('id')
        .merge()
        .catch(err => console.error('PostgreSQL upsertUser error:', err));
      return;
    }

    const stmt = this.sqlite!.prepare(`
      INSERT INTO users (id, name, email, role, phone, avatar, institution_id, password_hash, created_at)
      VALUES (@id, @name, @email, @role, @phone, @avatar, @institution_id, @password_hash, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        phone = excluded.phone,
        avatar = excluded.avatar,
        institution_id = excluded.institution_id,
        password_hash = excluded.password_hash;
    `);
    stmt.run(row);
  }

  // -------------------------------------------------------------
  // Institutions (SQL: SQLite / PostgreSQL)
  // -------------------------------------------------------------
  public getInstitutions(): Institution[] {
    if (this.isPostgres) {
      return this.pgCache.institutions;
    }
    const rows = this.sqlite!.prepare('SELECT * FROM institutions').all();
    return rows.map(rowToInstitution);
  }

  public getInstitutionById(id: string): Institution | undefined {
    if (this.isPostgres) {
      return this.pgCache.institutions.find(i => i.id === id);
    }
    const row = this.sqlite!.prepare('SELECT * FROM institutions WHERE id = ?').get(id);
    return row ? rowToInstitution(row) : undefined;
  }

  public upsertInstitution(inst: Institution) {
    const row = institutionToRow(inst);

    if (this.isPostgres) {
      const idx = this.pgCache.institutions.findIndex(i => i.id === inst.id);
      if (idx >= 0) this.pgCache.institutions[idx] = inst;
      else this.pgCache.institutions.push(inst);

      this.pgKnex!('institutions')
        .insert(row)
        .onConflict('id')
        .merge()
        .catch(err => console.error('PostgreSQL upsertInstitution error:', err));
      return;
    }

    const stmt = this.sqlite!.prepare(`
      INSERT INTO institutions (
        id, name, registration_number, tax_id, address, city, state, postal_code,
        latitude, longitude, capacity, current_children_count, verified,
        verification_date, trust_score, contact_email, contact_phone, description, website
      ) VALUES (
        @id, @name, @registration_number, @tax_id, @address, @city, @state, @postal_code,
        @latitude, @longitude, @capacity, @current_children_count, @verified,
        @verification_date, @trust_score, @contact_email, @contact_phone, @description, @website
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        registration_number = excluded.registration_number,
        tax_id = excluded.tax_id,
        address = excluded.address,
        city = excluded.city,
        state = excluded.state,
        postal_code = excluded.postal_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        capacity = excluded.capacity,
        current_children_count = excluded.current_children_count,
        verified = excluded.verified,
        verification_date = excluded.verification_date,
        trust_score = excluded.trust_score,
        contact_email = excluded.contact_email,
        contact_phone = excluded.contact_phone,
        description = excluded.description,
        website = excluded.website;
    `);
    stmt.run({
      ...row,
      verified: row.verified ? 1 : 0
    });
  }

  // -------------------------------------------------------------
  // Requirements (SQL: SQLite / PostgreSQL)
  // -------------------------------------------------------------
  public getRequirements(): Requirement[] {
    if (this.isPostgres) {
      return this.pgCache.requirements;
    }
    const rows = this.sqlite!.prepare('SELECT * FROM requirements').all();
    return rows.map(rowToRequirement);
  }

  public getRequirementById(id: string): Requirement | undefined {
    if (this.isPostgres) {
      return this.pgCache.requirements.find(r => r.id === id);
    }
    const row = this.sqlite!.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
    return row ? rowToRequirement(row) : undefined;
  }

  public upsertRequirement(req: Requirement) {
    const row = requirementToRow(req);

    if (this.isPostgres) {
      const idx = this.pgCache.requirements.findIndex(r => r.id === req.id);
      if (idx >= 0) this.pgCache.requirements[idx] = req;
      else this.pgCache.requirements.push(req);

      this.pgKnex!('requirements')
        .insert(row)
        .onConflict('id')
        .merge()
        .catch(err => console.error('PostgreSQL upsertRequirement error:', err));
      return;
    }

    const stmt = this.sqlite!.prepare(`
      INSERT INTO requirements (
        id, institution_id, institution_name, category, title, description,
        target_quantity, unit, fulfilled_quantity, urgency, status,
        authenticity_score, ml_risk_score, ml_risk_tier, risk_flags_json, documents_json,
        created_at, updated_at
      ) VALUES (
        @id, @institution_id, @institution_name, @category, @title, @description,
        @target_quantity, @unit, @fulfilled_quantity, @urgency, @status,
        @authenticity_score, @ml_risk_score, @ml_risk_tier, @risk_flags_json, @documents_json,
        @created_at, @updated_at
      ) ON CONFLICT(id) DO UPDATE SET
        institution_id = excluded.institution_id,
        institution_name = excluded.institution_name,
        category = excluded.category,
        title = excluded.title,
        description = excluded.description,
        target_quantity = excluded.target_quantity,
        unit = excluded.unit,
        fulfilled_quantity = excluded.fulfilled_quantity,
        urgency = excluded.urgency,
        status = excluded.status,
        authenticity_score = excluded.authenticity_score,
        ml_risk_score = excluded.ml_risk_score,
        ml_risk_tier = excluded.ml_risk_tier,
        risk_flags_json = excluded.risk_flags_json,
        documents_json = excluded.documents_json,
        updated_at = excluded.updated_at;
    `);
    stmt.run(row);
  }

  public deleteRequirement(id: string): boolean {
    if (this.isPostgres) {
      const idx = this.pgCache.requirements.findIndex(r => r.id === id);
      if (idx >= 0) {
        this.pgCache.requirements.splice(idx, 1);
        this.pgKnex!('requirements').where({ id }).delete().catch(console.error);
        return true;
      }
      return false;
    }

    const info = this.sqlite!.prepare('DELETE FROM requirements WHERE id = ?').run(id);
    return info.changes > 0;
  }

  // -------------------------------------------------------------
  // Donations (SQL: SQLite / PostgreSQL)
  // -------------------------------------------------------------
  public getDonations(): Donation[] {
    if (this.isPostgres) {
      return this.pgCache.donations;
    }
    const rows = this.sqlite!.prepare('SELECT * FROM donations').all();
    return rows.map(rowToDonation);
  }

  public getDonationById(id: string): Donation | undefined {
    if (this.isPostgres) {
      return this.pgCache.donations.find(d => d.id === id);
    }
    const row = this.sqlite!.prepare('SELECT * FROM donations WHERE id = ?').get(id);
    return row ? rowToDonation(row) : undefined;
  }

  public getDonationsByDonor(donorId: string): Donation[] {
    return this.getDonations().filter(d => d.donorId === donorId);
  }

  public upsertDonation(donation: Donation) {
    const row = donationToRow(donation);

    if (this.isPostgres) {
      const idx = this.pgCache.donations.findIndex(d => d.id === donation.id);
      if (idx >= 0) this.pgCache.donations[idx] = donation;
      else this.pgCache.donations.push(donation);

      this.pgKnex!('donations')
        .insert(row)
        .onConflict('id')
        .merge()
        .catch(err => console.error('PostgreSQL upsertDonation error:', err));
      return;
    }

    const stmt = this.sqlite!.prepare(`
      INSERT INTO donations (
        id, donor_id, donor_name, donor_email, requirement_id, requirement_title,
        institution_id, institution_name, type, items_json, status,
        pickup_agent_id, pickup_agent_name, pickup_address, destination_address,
        pickup_coordinates_json, destination_coordinates_json, current_coordinates_json,
        qr_code_payload, pickup_timestamp, delivery_timestamp, confirmation_notes,
        recipient_signature, proof_photo_url, monetary_amount_inr, receipt_number,
        payment_method, upi_transaction_id, ledger_block_hash, created_at, updated_at
      ) VALUES (
        @id, @donor_id, @donor_name, @donor_email, @requirement_id, @requirement_title,
        @institution_id, @institution_name, @type, @items_json, @status,
        @pickup_agent_id, @pickup_agent_name, @pickup_address, @destination_address,
        @pickup_coordinates_json, @destination_coordinates_json, @current_coordinates_json,
        @qr_code_payload, @pickup_timestamp, @delivery_timestamp, @confirmation_notes,
        @recipient_signature, @proof_photo_url, @monetary_amount_inr, @receipt_number,
        @payment_method, @upi_transaction_id, @ledger_block_hash, @created_at, @updated_at
      ) ON CONFLICT(id) DO UPDATE SET
        donor_id = excluded.donor_id,
        donor_name = excluded.donor_name,
        donor_email = excluded.donor_email,
        requirement_id = excluded.requirement_id,
        requirement_title = excluded.requirement_title,
        institution_id = excluded.institution_id,
        institution_name = excluded.institution_name,
        type = excluded.type,
        items_json = excluded.items_json,
        status = excluded.status,
        pickup_agent_id = excluded.pickup_agent_id,
        pickup_agent_name = excluded.pickup_agent_name,
        pickup_address = excluded.pickup_address,
        destination_address = excluded.destination_address,
        pickup_coordinates_json = excluded.pickup_coordinates_json,
        destination_coordinates_json = excluded.destination_coordinates_json,
        current_coordinates_json = excluded.current_coordinates_json,
        qr_code_payload = excluded.qr_code_payload,
        pickup_timestamp = excluded.pickup_timestamp,
        delivery_timestamp = excluded.delivery_timestamp,
        confirmation_notes = excluded.confirmation_notes,
        recipient_signature = excluded.recipient_signature,
        proof_photo_url = excluded.proof_photo_url,
        monetary_amount_inr = excluded.monetary_amount_inr,
        receipt_number = excluded.receipt_number,
        payment_method = excluded.payment_method,
        upi_transaction_id = excluded.upi_transaction_id,
        ledger_block_hash = excluded.ledger_block_hash,
        updated_at = excluded.updated_at;
    `);
    stmt.run(row);
  }

  // -------------------------------------------------------------
  // Announcements (SQL: SQLite / PostgreSQL)
  // -------------------------------------------------------------
  public getAnnouncements(): Announcement[] {
    if (this.isPostgres) {
      return this.pgCache.announcements;
    }
    const rows = this.sqlite!.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
    return rows.map(rowToAnnouncement);
  }

  public getActiveAnnouncements(): Announcement[] {
    const all = this.getAnnouncements();
    const now = new Date();
    return all.filter(a => {
      if (a.active === false) return false;
      if (a.expiresAt && new Date(a.expiresAt) <= now) return false;
      return true;
    });
  }

  public getAnnouncementById(id: string): Announcement | undefined {
    if (this.isPostgres) {
      return this.pgCache.announcements.find(a => a.id === id);
    }
    const row = this.sqlite!.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    return row ? rowToAnnouncement(row) : undefined;
  }

  public upsertAnnouncement(ann: Announcement) {
    const row = announcementToRow(ann);

    if (this.isPostgres) {
      const idx = this.pgCache.announcements.findIndex(a => a.id === ann.id);
      if (idx >= 0) this.pgCache.announcements[idx] = ann;
      else this.pgCache.announcements.unshift(ann);

      this.pgKnex!('announcements')
        .insert(row)
        .onConflict('id')
        .merge()
        .catch(err => console.error('PostgreSQL upsertAnnouncement error:', err));
      return;
    }

    const stmt = this.sqlite!.prepare(`
      INSERT INTO announcements (id, title, message, urgency, active, expires_at, created_by, created_at)
      VALUES (@id, @title, @message, @urgency, @active, @expires_at, @created_by, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        message = excluded.message,
        urgency = excluded.urgency,
        active = excluded.active,
        expires_at = excluded.expires_at;
    `);
    stmt.run({
      ...row,
      active: row.active ? 1 : 0
    });
  }

  // -------------------------------------------------------------
  // Risk Audit Logs (SQL: SQLite / PostgreSQL)
  // -------------------------------------------------------------
  public getRiskAuditLogs(): RiskFlag[] {
    if (this.isPostgres) {
      return this.pgCache.riskAuditLogs;
    }
    const rows = this.sqlite!.prepare('SELECT * FROM risk_audit_logs ORDER BY triggered_at DESC').all();
    return rows.map(rowToRiskFlag);
  }

  public addRiskAuditLog(flag: RiskFlag) {
    const row = riskFlagToRow(flag);

    if (this.isPostgres) {
      this.pgCache.riskAuditLogs.unshift(flag);
      this.pgKnex!('risk_audit_logs').insert(row).catch(err => console.error('PostgreSQL addRiskAuditLog error:', err));
      return;
    }

    const stmt = this.sqlite!.prepare(`
      INSERT INTO risk_audit_logs (rule_id, rule_name, severity, message, triggered_at, resolved, resolved_by, resolved_at)
      VALUES (@rule_id, @rule_name, @severity, @message, @triggered_at, @resolved, @resolved_by, @resolved_at);
    `);
    stmt.run({
      ...row,
      resolved: row.resolved ? 1 : 0
    });
  }

  public resolveRiskFlag(ruleId: string, resolvedBy: string) {
    const now = new Date().toISOString();

    if (this.isPostgres) {
      const flag = this.pgCache.riskAuditLogs.find(f => f.ruleId === ruleId && !f.resolved);
      if (flag) {
        flag.resolved = true;
        flag.resolvedBy = resolvedBy;
        flag.resolvedAt = now;
      }
      this.pgKnex!('risk_audit_logs')
        .where({ rule_id: ruleId, resolved: false })
        .update({ resolved: true, resolved_by: resolvedBy, resolved_at: now })
        .catch(err => console.error('PostgreSQL resolveRiskFlag error:', err));
      return;
    }

    this.sqlite!.prepare(`
      UPDATE risk_audit_logs
      SET resolved = 1, resolved_by = ?, resolved_at = ?
      WHERE rule_id = ? AND resolved = 0;
    `).run(resolvedBy, now, ruleId);
  }

  // -------------------------------------------------------------
  // Transit Telemetry (SQL: SQLite / PostgreSQL)
  // -------------------------------------------------------------
  public getTransitTelemetry(donationId: string): TransitTelemetry | undefined {
    if (this.isPostgres) {
      return this.pgCache.transitTelemetry[donationId];
    }
    const row = this.sqlite!.prepare('SELECT * FROM transit_telemetry WHERE donation_id = ?').get(donationId);
    return row ? rowToTelemetry(row) : undefined;
  }

  public upsertTransitTelemetry(telemetry: TransitTelemetry) {
    const row = telemetryToRow(telemetry);

    if (this.isPostgres) {
      this.pgCache.transitTelemetry[telemetry.donationId] = telemetry;
      this.pgKnex!('transit_telemetry')
        .insert(row)
        .onConflict('donation_id')
        .merge()
        .catch(err => console.error('PostgreSQL upsertTransitTelemetry error:', err));
      return;
    }

    const stmt = this.sqlite!.prepare(`
      INSERT INTO transit_telemetry (donation_id, latitude, longitude, current_address, speed_kmh, estimated_arrival_minutes, progress_percentage, last_updated)
      VALUES (@donation_id, @latitude, @longitude, @current_address, @speed_kmh, @estimated_arrival_minutes, @progress_percentage, @last_updated)
      ON CONFLICT(donation_id) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        current_address = excluded.current_address,
        speed_kmh = excluded.speed_kmh,
        estimated_arrival_minutes = excluded.estimated_arrival_minutes,
        progress_percentage = excluded.progress_percentage,
        last_updated = excluded.last_updated;
    `);
    stmt.run(row);
  }

  // -------------------------------------------------------------
  // Reset database tables and ledger to empty state
  // -------------------------------------------------------------
  public reset() {
    this.ledgerBlocks = [];
    this.saveLedger();

    if (this.isPostgres) {
      this.pgCache = {
        users: [],
        institutions: [],
        requirements: [],
        donations: [],
        announcements: [],
        riskAuditLogs: [],
        transitTelemetry: {}
      };
      if (this.pgKnex) {
        Promise.all([
          this.pgKnex('transit_telemetry').del(),
          this.pgKnex('risk_audit_logs').del(),
          this.pgKnex('donations').del(),
          this.pgKnex('requirements').del(),
          this.pgKnex('institutions').del(),
          this.pgKnex('users').del(),
          this.pgKnex('announcements').del()
        ]).catch(err => console.error('PostgreSQL reset error:', err));
      }
      return;
    }

    if (this.sqlite) {
      this.sqlite.exec(`
        DELETE FROM transit_telemetry;
        DELETE FROM risk_audit_logs;
        DELETE FROM donations;
        DELETE FROM requirements;
        DELETE FROM institutions;
        DELETE FROM users;
        DELETE FROM announcements;
      `);
    }
  }

  public close() {
    if (this.sqlite) {
      this.sqlite.close();
    }
    if (this.pgKnex) {
      this.pgKnex.destroy();
    }
  }
}

export const db = new Database();
