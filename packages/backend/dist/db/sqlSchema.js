"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSqlSchema = initSqlSchema;
exports.userToRow = userToRow;
exports.rowToUser = rowToUser;
exports.institutionToRow = institutionToRow;
exports.rowToInstitution = rowToInstitution;
exports.requirementToRow = requirementToRow;
exports.rowToRequirement = rowToRequirement;
exports.donationToRow = donationToRow;
exports.rowToDonation = rowToDonation;
exports.announcementToRow = announcementToRow;
exports.rowToAnnouncement = rowToAnnouncement;
exports.riskFlagToRow = riskFlagToRow;
exports.rowToRiskFlag = rowToRiskFlag;
exports.telemetryToRow = telemetryToRow;
exports.rowToTelemetry = rowToTelemetry;
/**
 * Creates all relational application tables if they do not already exist.
 * Works identically across SQLite and PostgreSQL through Knex schema builder.
 */
async function initSqlSchema(db) {
    // 1. Users table
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
        await db.schema.createTable('users', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.string('email').unique().notNullable();
            t.string('role').notNullable();
            t.string('phone');
            t.text('avatar');
            t.string('institution_id');
            t.string('password_hash');
            t.string('created_at').notNullable();
        });
    }
    // 2. Institutions table
    const hasInstitutions = await db.schema.hasTable('institutions');
    if (!hasInstitutions) {
        await db.schema.createTable('institutions', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.string('registration_number').notNullable();
            t.string('tax_id').notNullable();
            t.string('address').notNullable();
            t.string('city').notNullable();
            t.string('state').notNullable();
            t.string('postal_code').notNullable();
            t.float('latitude').notNullable();
            t.float('longitude').notNullable();
            t.integer('capacity').notNullable();
            t.integer('current_children_count').notNullable();
            t.boolean('verified').notNullable().defaultTo(false);
            t.string('verification_date');
            t.integer('trust_score').notNullable().defaultTo(50);
            t.string('contact_email').notNullable();
            t.string('contact_phone').notNullable();
            t.text('description').notNullable();
            t.string('website');
        });
    }
    // 3. Requirements table
    const hasRequirements = await db.schema.hasTable('requirements');
    if (!hasRequirements) {
        await db.schema.createTable('requirements', (t) => {
            t.string('id').primary();
            t.string('institution_id').notNullable();
            t.string('institution_name').notNullable();
            t.string('category').notNullable();
            t.string('title').notNullable();
            t.text('description').notNullable();
            t.integer('target_quantity').notNullable();
            t.string('unit').notNullable();
            t.integer('fulfilled_quantity').notNullable().defaultTo(0);
            t.string('urgency').notNullable();
            t.string('status').notNullable();
            t.integer('authenticity_score').notNullable();
            t.float('ml_risk_score').notNullable();
            t.string('ml_risk_tier').notNullable();
            t.text('risk_flags_json');
            t.text('documents_json');
            t.string('created_at').notNullable();
            t.string('updated_at').notNullable();
        });
    }
    // 4. Donations table
    const hasDonations = await db.schema.hasTable('donations');
    if (!hasDonations) {
        await db.schema.createTable('donations', (t) => {
            t.string('id').primary();
            t.string('donor_id').notNullable();
            t.string('donor_name').notNullable();
            t.string('donor_email').notNullable();
            t.string('requirement_id').notNullable();
            t.string('requirement_title').notNullable();
            t.string('institution_id').notNullable();
            t.string('institution_name').notNullable();
            t.string('type').notNullable();
            t.text('items_json').notNullable();
            t.string('status').notNullable();
            t.string('pickup_agent_id');
            t.string('pickup_agent_name');
            t.string('pickup_address').notNullable();
            t.string('destination_address').notNullable();
            t.text('pickup_coordinates_json').notNullable();
            t.text('destination_coordinates_json').notNullable();
            t.text('current_coordinates_json').notNullable();
            t.text('qr_code_payload').notNullable();
            t.string('pickup_timestamp');
            t.string('delivery_timestamp');
            t.text('confirmation_notes');
            t.text('recipient_signature');
            t.text('proof_photo_url');
            t.integer('monetary_amount_inr');
            t.string('receipt_number');
            t.string('payment_method');
            t.string('upi_transaction_id');
            t.string('ledger_block_hash');
            t.string('created_at').notNullable();
            t.string('updated_at').notNullable();
        });
    }
    // 5. Announcements table
    const hasAnnouncements = await db.schema.hasTable('announcements');
    if (!hasAnnouncements) {
        await db.schema.createTable('announcements', (t) => {
            t.string('id').primary();
            t.string('title').notNullable();
            t.text('message').notNullable();
            t.string('urgency').notNullable();
            t.boolean('active').notNullable().defaultTo(true);
            t.string('expires_at');
            t.string('created_by').notNullable();
            t.string('created_at').notNullable();
        });
    }
    // 6. Risk Audit Logs table
    const hasRiskLogs = await db.schema.hasTable('risk_audit_logs');
    if (!hasRiskLogs) {
        await db.schema.createTable('risk_audit_logs', (t) => {
            t.increments('id').primary();
            t.string('rule_id').notNullable();
            t.string('rule_name').notNullable();
            t.string('severity').notNullable();
            t.text('message').notNullable();
            t.string('triggered_at').notNullable();
            t.boolean('resolved').notNullable().defaultTo(false);
            t.string('resolved_by');
            t.string('resolved_at');
        });
    }
    // 7. Transit Telemetry table
    const hasTelemetry = await db.schema.hasTable('transit_telemetry');
    if (!hasTelemetry) {
        await db.schema.createTable('transit_telemetry', (t) => {
            t.string('donation_id').primary();
            t.float('latitude').notNullable();
            t.float('longitude').notNullable();
            t.string('current_address').notNullable();
            t.integer('speed_kmh').notNullable();
            t.integer('estimated_arrival_minutes').notNullable();
            t.integer('progress_percentage').notNullable();
            t.string('last_updated').notNullable();
        });
    }
}
// -------------------------------------------------------------
// Row Mapping Functions (Object <-> SQL Row)
// -------------------------------------------------------------
function userToRow(u) {
    return {
        id: u.id,
        name: u.name,
        email: u.email.toLowerCase(),
        role: u.role,
        phone: u.phone || null,
        avatar: u.avatar || null,
        institution_id: u.institutionId || null,
        password_hash: u.passwordHash || null,
        created_at: u.createdAt || new Date().toISOString()
    };
}
function rowToUser(r) {
    return {
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        phone: r.phone || undefined,
        avatar: r.avatar || undefined,
        institutionId: r.institution_id || undefined,
        passwordHash: r.password_hash || undefined,
        createdAt: r.created_at
    };
}
function institutionToRow(i) {
    return {
        id: i.id,
        name: i.name,
        registration_number: i.registrationNumber,
        tax_id: i.taxId,
        address: i.address,
        city: i.city,
        state: i.state,
        postal_code: i.postalCode,
        latitude: i.latitude,
        longitude: i.longitude,
        capacity: i.capacity,
        current_children_count: i.currentChildrenCount,
        verified: Boolean(i.verified),
        verification_date: i.verificationDate || null,
        trust_score: i.trustScore,
        contact_email: i.contactEmail,
        contact_phone: i.contactPhone,
        description: i.description,
        website: i.website || null
    };
}
function rowToInstitution(r) {
    return {
        id: r.id,
        name: r.name,
        registrationNumber: r.registration_number,
        taxId: r.tax_id,
        address: r.address,
        city: r.city,
        state: r.state,
        postalCode: r.postal_code,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        capacity: Number(r.capacity),
        currentChildrenCount: Number(r.current_children_count),
        verified: Boolean(r.verified),
        verificationDate: r.verification_date || undefined,
        trustScore: Number(r.trust_score),
        contactEmail: r.contact_email,
        contactPhone: r.contact_phone,
        description: r.description,
        website: r.website || undefined
    };
}
function requirementToRow(req) {
    return {
        id: req.id,
        institution_id: req.institutionId,
        institution_name: req.institutionName,
        category: req.category,
        title: req.title,
        description: req.description,
        target_quantity: req.targetQuantity,
        unit: req.unit,
        fulfilled_quantity: req.fulfilledQuantity,
        urgency: req.urgency,
        status: req.status,
        authenticity_score: req.authenticityScore != null ? req.authenticityScore : 100,
        ml_risk_score: req.mlRiskScore != null ? req.mlRiskScore : 0.05,
        ml_risk_tier: req.mlRiskTier || 'LOW',
        risk_flags_json: JSON.stringify(req.riskFlags || []),
        documents_json: JSON.stringify(req.documents || []),
        created_at: req.createdAt || new Date().toISOString(),
        updated_at: req.updatedAt || new Date().toISOString()
    };
}
function rowToRequirement(r) {
    return {
        id: r.id,
        institutionId: r.institution_id,
        institutionName: r.institution_name,
        category: r.category,
        title: r.title,
        description: r.description,
        targetQuantity: Number(r.target_quantity),
        unit: r.unit,
        fulfilledQuantity: Number(r.fulfilled_quantity),
        urgency: r.urgency,
        status: r.status,
        authenticityScore: Number(r.authenticity_score),
        mlRiskScore: Number(r.ml_risk_score),
        mlRiskTier: r.ml_risk_tier,
        riskFlags: r.risk_flags_json ? JSON.parse(r.risk_flags_json) : [],
        documents: r.documents_json ? JSON.parse(r.documents_json) : [],
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}
function donationToRow(d) {
    return {
        id: d.id,
        donor_id: d.donorId,
        donor_name: d.donorName,
        donor_email: d.donorEmail,
        requirement_id: d.requirementId,
        requirement_title: d.requirementTitle,
        institution_id: d.institutionId,
        institution_name: d.institutionName,
        type: d.type,
        items_json: JSON.stringify(d.items || []),
        status: d.status,
        pickup_agent_id: d.pickupAgentId || null,
        pickup_agent_name: d.pickupAgentName || null,
        pickup_address: d.pickupAddress,
        destination_address: d.destinationAddress,
        pickup_coordinates_json: JSON.stringify(d.pickupCoordinates || { latitude: 0, longitude: 0 }),
        destination_coordinates_json: JSON.stringify(d.destinationCoordinates || { latitude: 0, longitude: 0 }),
        current_coordinates_json: JSON.stringify(d.currentCoordinates || { latitude: 0, longitude: 0 }),
        qr_code_payload: d.qrCodePayload,
        pickup_timestamp: d.pickupTimestamp || null,
        delivery_timestamp: d.deliveryTimestamp || null,
        confirmation_notes: d.confirmationNotes || null,
        recipient_signature: d.recipientSignature || null,
        proof_photo_url: d.proofPhotoUrl || null,
        monetary_amount_inr: d.monetaryAmountInr != null ? d.monetaryAmountInr : null,
        receipt_number: d.receiptNumber || null,
        payment_method: d.paymentMethod || null,
        upi_transaction_id: d.upiTransactionId || null,
        ledger_block_hash: d.ledgerBlockHash || null,
        created_at: d.createdAt,
        updated_at: d.updatedAt
    };
}
function rowToDonation(r) {
    return {
        id: r.id,
        donorId: r.donor_id,
        donorName: r.donor_name,
        donorEmail: r.donor_email,
        requirementId: r.requirement_id,
        requirementTitle: r.requirement_title,
        institutionId: r.institution_id,
        institutionName: r.institution_name,
        type: r.type,
        items: r.items_json ? JSON.parse(r.items_json) : [],
        status: r.status,
        pickupAgentId: r.pickup_agent_id || undefined,
        pickupAgentName: r.pickup_agent_name || undefined,
        pickupAddress: r.pickup_address,
        destinationAddress: r.destination_address,
        pickupCoordinates: r.pickup_coordinates_json ? JSON.parse(r.pickup_coordinates_json) : { latitude: 0, longitude: 0 },
        destinationCoordinates: r.destination_coordinates_json ? JSON.parse(r.destination_coordinates_json) : { latitude: 0, longitude: 0 },
        currentCoordinates: r.current_coordinates_json ? JSON.parse(r.current_coordinates_json) : { latitude: 0, longitude: 0 },
        qrCodePayload: r.qr_code_payload,
        pickupTimestamp: r.pickup_timestamp || undefined,
        deliveryTimestamp: r.delivery_timestamp || undefined,
        confirmationNotes: r.confirmation_notes || undefined,
        recipientSignature: r.recipient_signature || undefined,
        proofPhotoUrl: r.proof_photo_url || undefined,
        monetaryAmountInr: r.monetary_amount_inr != null ? Number(r.monetary_amount_inr) : undefined,
        receiptNumber: r.receipt_number || undefined,
        paymentMethod: r.payment_method || undefined,
        upiTransactionId: r.upi_transaction_id || undefined,
        ledgerBlockHash: r.ledger_block_hash || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}
function announcementToRow(a) {
    return {
        id: a.id,
        title: a.title,
        message: a.message,
        urgency: a.urgency,
        active: a.active !== false,
        expires_at: a.expiresAt || null,
        created_by: a.createdBy,
        created_at: a.createdAt
    };
}
function rowToAnnouncement(r) {
    return {
        id: r.id,
        title: r.title,
        message: r.message,
        urgency: r.urgency,
        active: Boolean(r.active),
        expiresAt: r.expires_at || undefined,
        createdBy: r.created_by,
        createdAt: r.created_at
    };
}
function riskFlagToRow(f) {
    return {
        rule_id: f.ruleId,
        rule_name: f.ruleName,
        severity: f.severity,
        message: f.message,
        triggered_at: f.triggeredAt,
        resolved: Boolean(f.resolved),
        resolved_by: f.resolvedBy || null,
        resolved_at: f.resolvedAt || null
    };
}
function rowToRiskFlag(r) {
    return {
        ruleId: r.rule_id,
        ruleName: r.rule_name,
        severity: r.severity,
        message: r.message,
        triggeredAt: r.triggered_at,
        resolved: Boolean(r.resolved),
        resolvedBy: r.resolved_by || undefined,
        resolvedAt: r.resolved_at || undefined
    };
}
function telemetryToRow(t) {
    return {
        donation_id: t.donationId,
        latitude: t.latitude,
        longitude: t.longitude,
        current_address: t.currentAddress,
        speed_kmh: t.speedKmh,
        estimated_arrival_minutes: t.estimatedArrivalMinutes,
        progress_percentage: t.progressPercentage,
        last_updated: t.lastUpdated
    };
}
function rowToTelemetry(r) {
    return {
        donationId: r.donation_id,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        currentAddress: r.current_address,
        speedKmh: Number(r.speed_kmh),
        estimatedArrivalMinutes: Number(r.estimated_arrival_minutes),
        progressPercentage: Number(r.progress_percentage),
        lastUpdated: r.last_updated
    };
}
