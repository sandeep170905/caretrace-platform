"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const database_1 = require("./database");
const ledgerService_1 = require("../services/ledgerService");
const qrService_1 = require("../services/qrService");
const authService_1 = require("../services/authService");
async function runSeed() {
    console.log('🌱 Seeding CareTrace India/Chennai-localized demo dataset...');
    await database_1.db.reset();
    const demoPasswordHash = authService_1.AuthService.hashPassword('caretrace123');
    // 1. Users / Personas
    // Primary Donor for role switcher & active demo flows
    const donorUser = {
        id: 'user-donor-ajith',
        name: 'Ajith R',
        email: 'ajith@caretrace.org',
        role: 'DONOR',
        phone: '+91 98401 23456',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        passwordHash: demoPasswordHash
    };
    // Additional donors for realistic directory & past verified donations
    const donorSanjay = {
        id: 'user-donor-sanjay',
        name: 'Sanjay Verma',
        email: 'sanjay@caretrace.org',
        role: 'DONOR',
        phone: '+91 97908 11223',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        passwordHash: demoPasswordHash
    };
    const donorKarthik = {
        id: 'user-donor-karthik',
        name: 'Karthik V',
        email: 'karthik@caretrace.org',
        role: 'DONOR',
        phone: '+91 99620 44556',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        passwordHash: demoPasswordHash
    };
    // Institution Director (Chennai) - Karunai Karangal Foster Sanctuary
    const institutionDirector = {
        id: 'user-inst-akash',
        name: 'Akash Kumar',
        email: 'director@karunaikarangal.org',
        role: 'INSTITUTION',
        phone: '+91 98403 87654',
        institutionId: 'inst-karunai',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        passwordHash: demoPasswordHash
    };
    // Field Pickup Agent (Chennai)
    const pickupAgent = {
        id: 'user-agent-sakthivel',
        name: 'Sakthivel S',
        email: 'agent.sakthivel@caretrace.org',
        role: 'PICKUP_AGENT',
        phone: '+91 94441 56789',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        passwordHash: demoPasswordHash
    };
    // Admin / Trust & Safety (Chennai)
    const adminUser = {
        id: 'user-admin-sandeep',
        name: 'Sandeep R',
        email: 'sandeep@caretrace.org',
        role: 'ADMIN',
        phone: '+91 98840 99000',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        passwordHash: demoPasswordHash
    };
    await database_1.db.upsertUser(donorUser);
    await database_1.db.upsertUser(donorSanjay);
    await database_1.db.upsertUser(donorKarthik);
    await database_1.db.upsertUser(institutionDirector);
    await database_1.db.upsertUser(pickupAgent);
    await database_1.db.upsertUser(adminUser);
    // 2. Institutions (Chennai-area, plausible fictional child shelters)
    const anbuIllam = {
        id: 'inst-anbu',
        name: "Anbu Illam Children's Sanctuary",
        registrationNumber: 'TN-CH-NGO-2018-4491',
        taxId: '12AA-TN-9923841',
        address: '42 MTH Road, Ambattur Industrial Estate',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600058',
        latitude: 13.1143,
        longitude: 80.1548,
        capacity: 55,
        currentChildrenCount: 48,
        verified: true,
        verificationDate: '2025-01-15T09:00:00.000Z',
        trustScore: 96,
        contactEmail: 'director@anbucare.org',
        contactPhone: '+91 98412 34567',
        description: 'Accredited residential sanctuary caring for 48 orphaned, abandoned, and underprivileged children in Ambattur.',
        website: 'https://anbuillamchennai.org'
    };
    const karunaiKarangal = {
        id: 'inst-karunai',
        name: 'Karunai Karangal Foster Sanctuary',
        registrationNumber: 'TN-CH-NGO-2016-8823',
        taxId: '12AA-TN-7712903',
        address: '18 GST Road, Tambaram Sanatorium',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600047',
        latitude: 12.9279,
        longitude: 80.1216,
        capacity: 80,
        currentChildrenCount: 72,
        verified: true,
        verificationDate: '2024-11-20T14:30:00.000Z',
        trustScore: 92,
        contactEmail: 'director@karunaikarangal.org',
        contactPhone: '+91 98403 87654',
        description: 'Comprehensive residential foster shelter and academic development sanctuary for 72 children in Tambaram.',
        website: 'https://karunaikarangal.org'
    };
    // Flagged unverified institution for demo
    const nanbanShelter = {
        id: 'inst-nanban',
        name: 'Nanban Youth Emergency Shelter',
        registrationNumber: 'TN-PROV-2026-089',
        taxId: 'PENDING-TN-VERIF',
        address: '114 Poonamallee High Road, Poonamallee',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600056',
        latitude: 13.0474,
        longitude: 80.0934,
        capacity: 40,
        currentChildrenCount: 36,
        verified: false, // Intentional unverified status for demo
        trustScore: 55,
        contactEmail: 'contact@nanbanyouthshelter.org',
        contactPhone: '+91 97109 23456',
        description: 'Provisional transit home providing emergency night shelter and nourishment for runaway and destitute youth.',
        website: 'https://nanbanyouthshelter.org'
    };
    await database_1.db.upsertInstitution(anbuIllam);
    await database_1.db.upsertInstitution(karunaiKarangal);
    await database_1.db.upsertInstitution(nanbanShelter);
    // 3. Localized Requirements (Chennai Climate & Common Necessities)
    const req1 = {
        id: 'req-groceries-staples',
        institutionId: anbuIllam.id,
        institutionName: anbuIllam.name,
        category: 'FOOD',
        title: 'Monthly Staple Groceries (Ponni Boiled Rice Bags & Toor Dal)',
        description: 'Fortified Ponni boiled rice (25kg sacks) and unpolished toor dal for monthly kitchen nutrition for 48 resident children.',
        targetQuantity: 100,
        unit: 'bags',
        fulfilledQuantity: 90,
        urgency: 'HIGH',
        status: 'VERIFIED',
        authenticityScore: 95,
        mlRiskScore: 0.08,
        mlRiskTier: 'LOW',
        riskFlags: [],
        documents: [
            {
                id: 'doc-1',
                name: 'Dietary_Sanction_Certificate_Ambattur_2026.pdf',
                url: 'https://caretrace.org/docs/dietary_manifest.pdf',
                type: 'application/pdf',
                uploadedAt: '2026-02-01T10:00:00.000Z'
            }
        ],
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-02-05T14:00:00.000Z'
    };
    const req2 = {
        id: 'req-bedsheets-mosquito-nets',
        institutionId: karunaiKarangal.id,
        institutionName: karunaiKarangal.name,
        category: 'CLOTHING',
        title: 'Pure Cotton Bedsheets & High-Density Mosquito Nets',
        description: 'Breathable pure cotton bedsheets and anti-dengue mosquito nets tailored for Chennai tropical weather.',
        targetQuantity: 80,
        unit: 'sets',
        fulfilledQuantity: 80,
        urgency: 'HIGH',
        status: 'FULFILLED',
        authenticityScore: 92,
        mlRiskScore: 0.11,
        mlRiskTier: 'LOW',
        riskFlags: [],
        documents: [],
        createdAt: '2026-01-20T08:30:00.000Z',
        updatedAt: '2026-02-02T16:00:00.000Z'
    };
    const req3 = {
        id: 'req-firstaid-supplies',
        institutionId: anbuIllam.id,
        institutionName: anbuIllam.name,
        category: 'MEDICINE',
        title: 'First-Aid, ORS Electrolytes & Basic Pediatric Healthcare Packs',
        description: 'Essential clinic supplies: Paracetamol pediatric syrup, ORS rehydration sachets, antiseptic lotions, and sterile cotton bandages.',
        targetQuantity: 40,
        unit: 'kits',
        fulfilledQuantity: 20,
        urgency: 'HIGH',
        status: 'VERIFIED',
        authenticityScore: 88,
        mlRiskScore: 0.14,
        mlRiskTier: 'LOW',
        riskFlags: [],
        documents: [
            {
                id: 'doc-2',
                name: 'District_Health_Inspection_License.pdf',
                url: 'https://caretrace.org/docs/clinic_license.pdf',
                type: 'application/pdf',
                uploadedAt: '2026-02-10T11:20:00.000Z'
            }
        ],
        createdAt: '2026-02-10T11:20:00.000Z',
        updatedAt: '2026-02-10T11:20:00.000Z'
    };
    const req4 = {
        id: 'req-school-uniforms-stationery',
        institutionId: karunaiKarangal.id,
        institutionName: karunaiKarangal.name,
        category: 'EDUCATION',
        title: 'School Uniform Sets & Academic Notebook Stationery Bundles',
        description: 'Tailored uniform pairs (Sizes 26-36) and 192-page ruled long notebooks with geometry stationery sets for academic term.',
        targetQuantity: 60,
        unit: 'sets',
        fulfilledQuantity: 30,
        urgency: 'MEDIUM',
        status: 'VERIFIED',
        authenticityScore: 94,
        mlRiskScore: 0.09,
        mlRiskTier: 'LOW',
        riskFlags: [],
        documents: [],
        createdAt: '2026-02-12T09:00:00.000Z',
        updatedAt: '2026-02-14T15:30:00.000Z'
    };
    // Flagged requirement with localized capacity anomaly on Nanban Youth Shelter (Poonamallee)
    const req5Flagged = {
        id: 'req-nanban-rice-anomaly',
        institutionId: nanbanShelter.id,
        institutionName: nanbanShelter.name,
        category: 'FOOD',
        title: '500 Bags Premium Ponni Boiled Rice (25kg Bulk Bags)',
        description: 'Emergency bulk procurement requisition of 500 rice bags (12,500 kg) for provisional storage.',
        targetQuantity: 500,
        unit: 'bags',
        fulfilledQuantity: 0,
        urgency: 'HIGH',
        status: 'PENDING',
        authenticityScore: 35, // Low score!
        mlRiskScore: 0.89,
        mlRiskTier: 'HIGH',
        riskFlags: [
            {
                ruleId: 'RULE-INST-UNVERIFIED',
                ruleName: 'Unverified Institution',
                severity: 'HIGH',
                message: 'Institution "Nanban Youth Emergency Shelter" has not completed mandatory legal identity verification.',
                triggeredAt: '2026-02-14T12:00:00.000Z'
            },
            {
                ruleId: 'RULE-CAPACITY-EXCESS-FOOD',
                ruleName: 'Capacity Over-Claim (Food & Groceries)',
                severity: 'MEDIUM',
                message: 'Requested 500 units for 36 registered children (13.9 per child), exceeding 4x quota.',
                triggeredAt: '2026-02-14T12:00:00.000Z'
            }
        ],
        documents: [],
        createdAt: '2026-02-14T12:00:00.000Z',
        updatedAt: '2026-02-14T12:00:00.000Z'
    };
    await database_1.db.upsertRequirement(req1);
    await database_1.db.upsertRequirement(req2);
    await database_1.db.upsertRequirement(req3);
    await database_1.db.upsertRequirement(req4);
    await database_1.db.upsertRequirement(req5Flagged);
    // Add risk flags to audit logs table
    for (const flag of req5Flagged.riskFlags) {
        await database_1.db.addRiskAuditLog(flag);
    }
    // 4. Pre-seeded Fully Completed Donation (CT-2026-8801) with full 4-block Ledger Trail
    const donationDeliveredId = 'CT-2026-8801';
    const qrPayloadDelivered = qrService_1.QRService.createPayloadString(donationDeliveredId, donorUser.id, karunaiKarangal.id);
    const donationDelivered = {
        id: donationDeliveredId,
        donorId: donorUser.id,
        donorName: donorUser.name,
        donorEmail: donorUser.email,
        requirementId: req2.id,
        requirementTitle: req2.title,
        institutionId: karunaiKarangal.id,
        institutionName: karunaiKarangal.name,
        type: 'PHYSICAL_GOODS',
        items: [
            { name: 'Pure Cotton Bedsheets (Double-Stitched)', quantity: 40, unit: 'sets', estimatedValueInr: 28000 },
            { name: 'High-Density Anti-Dengue Mosquito Nets', quantity: 40, unit: 'sets', estimatedValueInr: 22000 }
        ],
        status: 'CONFIRMED',
        pickupAgentId: pickupAgent.id,
        pickupAgentName: pickupAgent.name,
        pickupAddress: 'Anna Nagar West Logistics Hub, 2nd Avenue, Anna Nagar, Chennai 600040',
        destinationAddress: `${karunaiKarangal.address}, ${karunaiKarangal.city}, ${karunaiKarangal.state}`,
        pickupCoordinates: { latitude: 13.0850, longitude: 80.2101 }, // Anna Nagar
        destinationCoordinates: { latitude: karunaiKarangal.latitude, longitude: karunaiKarangal.longitude }, // Tambaram
        currentCoordinates: { latitude: karunaiKarangal.latitude, longitude: karunaiKarangal.longitude },
        qrCodePayload: qrPayloadDelivered,
        pickupTimestamp: '2026-02-02T10:15:00.000Z',
        deliveryTimestamp: '2026-02-02T14:45:00.000Z',
        confirmationNotes: 'Akash Kumar (Director) - Received 80 pristine bedsheet and net sets. Inspected and distributed to dormitories.',
        recipientSignature: 'DIGITAL_SIG:AKASH_KUMAR_KARUNAI_TAMBARAM_2026',
        proofPhotoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-02-01T15:00:00.000Z',
        updatedAt: '2026-02-02T14:45:00.000Z'
    };
    await database_1.db.upsertDonation(donationDelivered);
    // Mine the 4 SHA-256 Ledger Blocks for CT-2026-8801
    ledgerService_1.LedgerService.recordCheckpoint(donationDeliveredId, 'DONATION_MATCHED', { id: donorUser.id, role: 'DONOR', name: donorUser.name }, `Ajith R pledged 80 cotton bedsheets & mosquito net sets to Karunai Karangal Foster Sanctuary.`, { itemsCount: 80, donor: donorUser.name, totalValueInr: 50000 });
    ledgerService_1.LedgerService.recordCheckpoint(donationDeliveredId, 'PICKUP_VERIFIED', { id: pickupAgent.id, role: 'PICKUP_AGENT', name: pickupAgent.name }, `Pickup verified and sealed at Anna Nagar West logistics hub by Courier Sakthivel S.`, { agent: pickupAgent.name, pickupPoint: donationDelivered.pickupAddress });
    ledgerService_1.LedgerService.recordCheckpoint(donationDeliveredId, 'IN_TRANSIT_CHECKPOINT', { id: 'system-iot', role: 'SYSTEM', name: 'CareTrace Route Telemetry Engine' }, `In transit corridor verified. Crossing Guindy / Kathipara flyover towards Tambaram corridor.`, { speedKmh: 46, progress: '65%' });
    ledgerService_1.LedgerService.recordCheckpoint(donationDeliveredId, 'DELIVERY_CONFIRMED', { id: institutionDirector.id, role: 'INSTITUTION', name: institutionDirector.name }, `Consignment received and authenticated via delivery QR scan by Akash Kumar (Director, Karunai Karangal). Attached handover photo evidence sealed on-chain.`, {
        signature: donationDelivered.recipientSignature,
        notes: donationDelivered.confirmationNotes,
        hasPhotoProof: true,
        photoAttached: true
    });
    // 5. Pre-seeded In-Progress Donation (CT-2026-9042) Ready for Live Demo Pickup & Delivery!
    const donationActiveId = 'CT-2026-9042';
    const qrPayloadActive = qrService_1.QRService.createPayloadString(donationActiveId, donorUser.id, karunaiKarangal.id);
    const donationActive = {
        id: donationActiveId,
        donorId: donorUser.id,
        donorName: donorUser.name,
        donorEmail: donorUser.email,
        requirementId: req4.id,
        requirementTitle: req4.title,
        institutionId: karunaiKarangal.id,
        institutionName: karunaiKarangal.name,
        type: 'PHYSICAL_GOODS',
        items: [
            { name: 'Stitched School Uniform Pairs & Notebook Bundles', quantity: 30, unit: 'sets', estimatedValueInr: 35000 }
        ],
        status: 'IN_TRANSIT',
        pickupAgentId: pickupAgent.id,
        pickupAgentName: pickupAgent.name,
        pickupAddress: 'T. Nagar Wholesale Hub, Usman Road, T. Nagar, Chennai 600017',
        destinationAddress: `${karunaiKarangal.address}, ${karunaiKarangal.city}, ${karunaiKarangal.state}`,
        pickupCoordinates: { latitude: 13.0418, longitude: 80.2341 }, // T. Nagar
        destinationCoordinates: { latitude: karunaiKarangal.latitude, longitude: karunaiKarangal.longitude }, // Tambaram
        currentCoordinates: { latitude: 12.9840, longitude: 80.1780 }, // Kathipara / Guindy corridor
        qrCodePayload: qrPayloadActive,
        pickupTimestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
    };
    await database_1.db.upsertDonation(donationActive);
    // Mine Blocks for CT-2026-9042
    ledgerService_1.LedgerService.recordCheckpoint(donationActiveId, 'DONATION_MATCHED', { id: donorUser.id, role: 'DONOR', name: donorUser.name }, `Ajith R pledged 30 stitched school uniform & notebook sets to Karunai Karangal Sanctuary.`, { itemsCount: 30, totalValueInr: 35000 });
    ledgerService_1.LedgerService.recordCheckpoint(donationActiveId, 'PICKUP_VERIFIED', { id: pickupAgent.id, role: 'PICKUP_AGENT', name: pickupAgent.name }, `Pickup verified and scanned by Sakthivel S at T. Nagar Wholesale Hub. Consignment en route via GST Road.`, { agent: pickupAgent.name });
    // Set active telemetry
    await database_1.db.upsertTransitTelemetry({
        donationId: donationActiveId,
        latitude: 12.9840,
        longitude: 80.1780,
        currentAddress: 'In Transit: GST Road near Kathipara / Guindy Corridor towards Tambaram',
        speedKmh: 42,
        estimatedArrivalMinutes: 16,
        progressPercentage: 55,
        lastUpdated: new Date().toISOString()
    });
    // 6. Additional Past Donations for Sanjay Verma & Karthik V (Realistic Directory Data)
    const donationSanjayId = 'CT-2026-8712';
    const qrPayloadSanjay = qrService_1.QRService.createPayloadString(donationSanjayId, donorSanjay.id, anbuIllam.id);
    const donationSanjay = {
        id: donationSanjayId,
        donorId: donorSanjay.id,
        donorName: donorSanjay.name,
        donorEmail: donorSanjay.email,
        requirementId: req3.id,
        requirementTitle: req3.title,
        institutionId: anbuIllam.id,
        institutionName: anbuIllam.name,
        type: 'PHYSICAL_GOODS',
        items: [
            { name: 'Pediatric First-Aid & ORS Electrolyte Kits', quantity: 20, unit: 'kits', estimatedValueInr: 16000 }
        ],
        status: 'CONFIRMED',
        pickupAgentId: pickupAgent.id,
        pickupAgentName: pickupAgent.name,
        pickupAddress: 'Kilpauk Medical Wholesale Depot, Chennai 600010',
        destinationAddress: `${anbuIllam.address}, ${anbuIllam.city}, ${anbuIllam.state}`,
        pickupCoordinates: { latitude: 13.0784, longitude: 80.2412 },
        destinationCoordinates: { latitude: anbuIllam.latitude, longitude: anbuIllam.longitude },
        currentCoordinates: { latitude: anbuIllam.latitude, longitude: anbuIllam.longitude },
        qrCodePayload: qrPayloadSanjay,
        pickupTimestamp: '2026-02-08T09:30:00.000Z',
        deliveryTimestamp: '2026-02-08T13:15:00.000Z',
        confirmationNotes: 'Sister V. Shanthi (Director) - First-aid and ORS supplies verified in sterile packaging.',
        recipientSignature: 'DIGITAL_SIG:SISTER_SHANTHI_ANBU_CARE_2026',
        createdAt: '2026-02-07T11:00:00.000Z',
        updatedAt: '2026-02-08T13:15:00.000Z'
    };
    await database_1.db.upsertDonation(donationSanjay);
    ledgerService_1.LedgerService.recordCheckpoint(donationSanjayId, 'DONATION_MATCHED', { id: donorSanjay.id, role: 'DONOR', name: donorSanjay.name }, `Sanjay Verma matched 20 medical kits to Anbu Illam Sanctuary.`, { itemsCount: 20, totalValueInr: 16000 });
    ledgerService_1.LedgerService.recordCheckpoint(donationSanjayId, 'DELIVERY_CONFIRMED', { id: 'user-inst-shanthi', role: 'INSTITUTION', name: 'Sister V. Shanthi (Director)' }, `Delivery verified by Director Sister V. Shanthi at Ambattur facility.`, { signature: donationSanjay.recipientSignature });
    const donationKarthikId = 'CT-2026-8650';
    const qrPayloadKarthik = qrService_1.QRService.createPayloadString(donationKarthikId, donorKarthik.id, anbuIllam.id);
    const donationKarthik = {
        id: donationKarthikId,
        donorId: donorKarthik.id,
        donorName: donorKarthik.name,
        donorEmail: donorKarthik.email,
        requirementId: req1.id,
        requirementTitle: req1.title,
        institutionId: anbuIllam.id,
        institutionName: anbuIllam.name,
        type: 'PHYSICAL_GOODS',
        items: [
            { name: 'Ponni Boiled Rice Bags (25kg Sacks)', quantity: 30, unit: 'bags', estimatedValueInr: 45000 }
        ],
        status: 'CONFIRMED',
        pickupAgentId: pickupAgent.id,
        pickupAgentName: pickupAgent.name,
        pickupAddress: 'Koyambedu Wholesale Market, Chennai 600107',
        destinationAddress: `${anbuIllam.address}, ${anbuIllam.city}, ${anbuIllam.state}`,
        pickupCoordinates: { latitude: 13.0694, longitude: 80.1948 },
        destinationCoordinates: { latitude: anbuIllam.latitude, longitude: anbuIllam.longitude },
        currentCoordinates: { latitude: anbuIllam.latitude, longitude: anbuIllam.longitude },
        qrCodePayload: qrPayloadKarthik,
        pickupTimestamp: '2026-02-04T08:00:00.000Z',
        deliveryTimestamp: '2026-02-04T12:30:00.000Z',
        confirmationNotes: 'Sister V. Shanthi (Director) - 30 sacks of Ponni rice received and stocked in pantry.',
        recipientSignature: 'DIGITAL_SIG:SISTER_SHANTHI_ANBU_CARE_2026',
        createdAt: '2026-02-03T16:00:00.000Z',
        updatedAt: '2026-02-04T12:30:00.000Z'
    };
    await database_1.db.upsertDonation(donationKarthik);
    ledgerService_1.LedgerService.recordCheckpoint(donationKarthikId, 'DONATION_MATCHED', { id: donorKarthik.id, role: 'DONOR', name: donorKarthik.name }, `Karthik V matched 30 rice bags to Anbu Illam kitchen.`, { itemsCount: 30, totalValueInr: 45000 });
    ledgerService_1.LedgerService.recordCheckpoint(donationKarthikId, 'DELIVERY_CONFIRMED', { id: 'user-inst-shanthi', role: 'INSTITUTION', name: 'Sister V. Shanthi (Director)' }, `Rice sacks verified by Director Sister V. Shanthi at Ambattur facility.`, { signature: donationKarthik.recipientSignature });
    // 7. Pre-seeded Verified Monetary Contribution (CT-2026-5607) for Ajith R
    const monetaryDonationId = 'CT-2026-5607';
    const monetaryDonation = {
        id: monetaryDonationId,
        donorId: donorUser.id,
        donorName: donorUser.name,
        donorEmail: donorUser.email,
        requirementId: req4.id,
        requirementTitle: req4.title,
        institutionId: karunaiKarangal.id,
        institutionName: karunaiKarangal.name,
        type: 'FUNDS',
        items: [
            {
                name: 'Direct Child Education & Nutrition Fund (Monetary Contribution)',
                quantity: 1,
                unit: 'grant',
                estimatedValueInr: 100000
            }
        ],
        status: 'CONFIRMED',
        monetaryAmountInr: 100000,
        receiptNumber: 'REC-80G-2026-5607',
        paymentMethod: 'Direct Monetary Contribution',
        upiTransactionId: 'TXN-2026-5607',
        pickupAddress: 'N/A (Direct Monetary Contribution)',
        destinationAddress: `${karunaiKarangal.address}, ${karunaiKarangal.city}, ${karunaiKarangal.state}`,
        pickupCoordinates: { latitude: 13.0827, longitude: 80.2707 },
        destinationCoordinates: { latitude: karunaiKarangal.latitude, longitude: karunaiKarangal.longitude },
        qrCodePayload: 'CARETRACE:MONETARY:CT-2026-9200:TXN-2026-5607',
        createdAt: '2026-02-15T11:30:00.000Z',
        updatedAt: '2026-02-15T11:30:00.000Z'
    };
    await database_1.db.upsertDonation(monetaryDonation);
    ledgerService_1.LedgerService.recordCheckpoint(monetaryDonationId, 'DONATION_MATCHED', { id: donorUser.id, role: 'DONOR', name: donorUser.name }, `Ajith R initiated monetary contribution of ₹1,00,000 for ${req4.title}.`, { amountInr: 100000, institution: karunaiKarangal.name, type: 'FUNDS' });
    ledgerService_1.LedgerService.recordCheckpoint(monetaryDonationId, 'MONETARY_DONATION_CONFIRMED', { id: donorUser.id, role: 'DONOR', name: donorUser.name }, `Direct monetary contribution confirmed: ₹1,00,000 to ${karunaiKarangal.name}. 80G Tax Exemption Receipt REC-80G-2026-5607 generated (Txn Ref: TXN-2026-5607).`, {
        amountInr: 100000,
        donorId: donorUser.id,
        institutionId: karunaiKarangal.id,
        receiptNumber: 'REC-80G-2026-5607',
        transactionRef: 'TXN-2026-5607'
    });
    // Seed demo-safe announcement (platform update, not real disaster appeal)
    const seedAnnouncement = {
        id: 'ann-demo-2026-01',
        title: '[Notice] Platform Update: Direct Monetary Contributions with Section 80G Receipts Now Live',
        message: 'CareTrace donors can now fulfill verified childcare requirements through direct monetary contributions and receive instant cryptographic Section 80G sample tax exemption receipts.',
        urgency: 'GENERAL',
        createdAt: new Date().toISOString(),
        active: true,
        createdBy: 'Sandeep R (Platform Admin)'
    };
    await database_1.db.upsertAnnouncement(seedAnnouncement);
    console.log('✅ Chennai localized database seeded successfully with:');
    console.log(`   - 6 Users: Ajith R (Donor), Akash Kumar (Director), Sakthivel S (Agent), Sandeep R (Admin), Sanjay Verma (Donor), Karthik V (Donor)`);
    console.log(`   - 3 Institutions: Anbu Illam (Ambattur), Karunai Karangal (Tambaram), Nanban Youth Shelter (Poonamallee - Flagged)`);
    console.log(`   - 5 Requirements: Groceries, Bedsheets/Nets, First-Aid, Uniforms, and Flagged 500 Rice Bags Anomaly`);
    console.log(`   - 4 Donations: CT-2026-8801 (Confirmed), CT-2026-9042 (In-Transit), CT-2026-8712 (Confirmed), CT-2026-8650 (Confirmed)`);
    console.log(`   - ${database_1.db.getLedgerBlocks().length} Cryptographically Chained Ledger Blocks`);
}
// Run if called directly
if (require.main === module) {
    runSeed().catch(console.error);
}
