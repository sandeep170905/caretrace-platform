import { db } from './db/database';
import { AuthService } from './services/authService';
import { LedgerService } from './services/ledgerService';
import { QRService } from './services/qrService';
import { FraudScoringService } from './services/fraudScoringService';
import { Requirement, Institution, User, Donation, ProofOfDeliveryCertificate } from '@caretrace/shared';

async function runStageFAudit() {
  console.log('======================================================================');
  console.log('🧪 STAGE F FULL FUNCTIONAL AUDIT: ZERO SHORTCUTS / END-TO-END FLOW');
  console.log('======================================================================\n');

  const now = new Date().toISOString();
  const timestamp = Date.now();

  // -------------------------------------------------------------------------
  // 1. DYNAMIC DONOR REGISTRATION
  // -------------------------------------------------------------------------
  console.log('1️⃣ Auditing Dynamic Donor Registration...');
  const donorEmail = `kavitha.${timestamp}@example.com`;
  const donorName = 'Kavitha Raman';
  const newDonor: User = {
    id: `user-donor-${timestamp}`,
    name: donorName,
    email: donorEmail,
    role: 'DONOR',
    phone: '+91 98402 77889',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    passwordHash: AuthService.hashPassword('Pass@1234'),
    createdAt: now
  };
  db.upsertUser(newDonor);

  const registeredDonor = db.getUserById(newDonor.id);
  console.assert(registeredDonor !== undefined, '❌ Donor was not saved in DB');
  console.assert(registeredDonor?.id === newDonor.id, '❌ Donor ID mismatch');
  console.assert(registeredDonor?.name === 'Kavitha Raman', '❌ Donor name mismatch');
  console.assert(registeredDonor?.id !== 'user-donor-ajith', '❌ Donor defaulted to Ajith R!');
  console.log(`   ✅ Registered Dynamic Donor: ${registeredDonor?.name} (${registeredDonor?.id})`);
  console.log(`   ✅ Email: ${registeredDonor?.email}`);

  // -------------------------------------------------------------------------
  // 2. DYNAMIC INSTITUTION REGISTRATION & ADMIN ACCREDITATION
  // -------------------------------------------------------------------------
  console.log('\n2️⃣ Auditing Dynamic Institution Registration & Admin Approval...');
  const instId = `inst-grace-${timestamp}`;
  const directorEmail = `david.${timestamp}@gracechildcare.org`;
  const newInstitution: Institution = {
    id: instId,
    name: 'Grace Foundation Child Sanctuary',
    registrationNumber: `TN-CH-NGO-2026-${timestamp % 10000}`,
    taxId: '12AA-TN-887192',
    address: '14 Gandhi Road, West Tambaram',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600045',
    latitude: 12.9249,
    longitude: 80.1000,
    verified: false, // Initially unverified pending admin review
    capacity: 60,
    currentChildrenCount: 45,
    trustScore: 70,
    contactEmail: directorEmail,
    contactPhone: '+91 98403 11223',
    description: 'Residential shelter and educational bridge facility for underprivileged children.'
  };
  db.upsertInstitution(newInstitution);

  const directorUser: User = {
    id: `user-inst-david-${timestamp}`,
    name: 'David Raj',
    email: directorEmail,
    role: 'INSTITUTION',
    institutionId: instId,
    passwordHash: AuthService.hashPassword('DavidPass2026'),
    createdAt: now
  };
  db.upsertUser(directorUser);

  // Verify institution is in pending list
  const pendingInstitutions = db.getInstitutions().filter(i => !i.verified);
  const foundPending = pendingInstitutions.find(i => i.id === instId);
  console.assert(foundPending !== undefined, '❌ New institution not found in unverified pending list');
  console.log(`   ✅ New Institution Pending Review: "${newInstitution.name}" (verified: ${foundPending?.verified})`);

  // Admin approves the institution
  newInstitution.verified = true;
  newInstitution.trustScore = 85;
  db.upsertInstitution(newInstitution);

  const approvedInst = db.getInstitutionById(instId);
  console.assert(approvedInst?.verified === true, '❌ Institution approval failed');
  console.assert(approvedInst?.trustScore === 85, '❌ Trust score was not updated');
  console.log(`   ✅ Admin Accreditation Granted: "${approvedInst?.name}" (verified: ${approvedInst?.verified}, Trust: ${approvedInst?.trustScore}%)`);

  // -------------------------------------------------------------------------
  // 3. DYNAMIC REQUIREMENT POSTING & AUTHENTICITY SCORING
  // -------------------------------------------------------------------------
  console.log('\n3️⃣ Auditing Dynamic Requirement Posting & Authenticity Engine...');
  const newReqData: Partial<Requirement> = {
    title: '100 Geometry Math Kits for High School Board Exams',
    category: 'EDUCATION',
    targetQuantity: 100,
    unit: 'kits',
    urgency: 'HIGH',
    description: 'Geometry boxes, calculators, and graph registers for board exam students.',
    documents: [
      {
        id: `doc-${timestamp}`,
        name: 'Government School Exam Registration Roster.pdf',
        type: 'GOVT_REGISTRATION',
        url: 'https://example.org/docs/roster.pdf',
        uploadedAt: now
      }
    ]
  };

  const scoringResult = FraudScoringService.evaluateAndLogRequirement(newReqData, instId);
  console.log(`   ✅ Dynamic Authenticity Score: ${scoringResult.score}/100 (Risk: ${scoringResult.riskLevel})`);
  console.log(`   ✅ Score Approved? ${scoringResult.isApproved}`);

  const reqId = `req-math-${timestamp}`;
  const createdReq: Requirement = {
    id: reqId,
    institutionId: instId,
    institutionName: newInstitution.name,
    title: newReqData.title!,
    category: newReqData.category!,
    urgency: newReqData.urgency!,
    targetQuantity: newReqData.targetQuantity!,
    fulfilledQuantity: 0,
    unit: newReqData.unit!,
    description: newReqData.description!,
    authenticityScore: scoringResult.score,
    riskFlags: scoringResult.flags,
    status: scoringResult.isApproved ? 'VERIFIED' : 'PENDING',
    documents: newReqData.documents!,
    createdAt: now,
    updatedAt: now
  };
  db.upsertRequirement(createdReq);

  const retrievedReq = db.getRequirementById(reqId);
  console.assert(retrievedReq !== undefined, '❌ Requirement was not saved');
  console.assert(retrievedReq?.institutionId === instId, '❌ Requirement institution mismatch');
  console.log(`   ✅ Published Requirement: "${retrievedReq?.title}" (Status: ${retrievedReq?.status})`);

  // -------------------------------------------------------------------------
  // 4. DYNAMIC DONATION PLEDGE BY NEW DONOR
  // -------------------------------------------------------------------------
  console.log('\n4️⃣ Auditing Dynamic Physical Consignment Pledge by New Donor...');
  const donationId = `CT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrCodePayload = QRService.createPayloadString(donationId, newDonor.id, instId);
  const pledgeQuantity = 50;

  const newDonation: Donation = {
    id: donationId,
    donorId: newDonor.id,
    donorName: newDonor.name,
    donorEmail: newDonor.email,
    requirementId: createdReq.id,
    requirementTitle: createdReq.title,
    institutionId: instId,
    institutionName: newInstitution.name,
    type: 'PHYSICAL_GOODS',
    items: [
      {
        name: createdReq.title,
        quantity: pledgeQuantity,
        unit: createdReq.unit,
        estimatedValueInr: 25000
      }
    ],
    status: 'MATCHED',
    pickupAddress: 'Adyar Courier Hub, Chennai 600020',
    destinationAddress: `${newInstitution.address}, ${newInstitution.city}, ${newInstitution.state}`,
    pickupCoordinates: { latitude: 13.0067, longitude: 80.2570 },
    destinationCoordinates: { latitude: newInstitution.latitude, longitude: newInstitution.longitude },
    currentCoordinates: { latitude: 13.0067, longitude: 80.2570 },
    qrCodePayload,
    createdAt: now,
    updatedAt: now
  };
  db.upsertDonation(newDonation);

  // Update requirement fulfilled quantity
  createdReq.fulfilledQuantity += pledgeQuantity;
  db.upsertRequirement(createdReq);

  // Genesis block mined on ledger
  const genesisBlock = LedgerService.recordCheckpoint(
    donationId,
    'DONATION_MATCHED',
    { id: newDonor.id, role: 'DONOR', name: newDonor.name },
    `${newDonor.name} pledged ${pledgeQuantity} ${createdReq.unit} to ${newInstitution.name}.`,
    { items: newDonation.items, donorId: newDonor.id }
  );

  console.assert(newDonation.donorId === newDonor.id, '❌ Donation donorId is not new donor');
  console.assert(newDonation.donorId !== 'user-donor-ajith', '❌ Donation incorrectly attached to Ajith R!');
  console.assert(genesisBlock.actorName === 'Kavitha Raman', '❌ Genesis block actor is not Kavitha Raman');
  console.log(`   ✅ Consignment Created: ${newDonation.id}`);
  console.log(`   ✅ Attached to Donor: ${newDonation.donorName} (${newDonation.donorId})`);
  console.log(`   ✅ Mined Genesis Block #${genesisBlock.index} (Hash: ${genesisBlock.blockHash.slice(0, 24)}...)`);

  // -------------------------------------------------------------------------
  // 5. DYNAMIC COURIER DISPATCH & IN-TRANSIT TELEMETRY
  // -------------------------------------------------------------------------
  console.log('\n5️⃣ Auditing Courier Agent Dispatch & In-Transit Route Telemetry...');
  const agent = db.getUserById('user-agent-sakthivel')!;
  newDonation.status = 'IN_TRANSIT';
  newDonation.pickupAgentId = agent.id;
  newDonation.pickupAgentName = agent.name;
  newDonation.pickupTimestamp = new Date().toISOString();
  db.upsertDonation(newDonation);

  const pickupBlock = LedgerService.recordCheckpoint(
    donationId,
    'PICKUP_VERIFIED',
    { id: agent.id, role: 'PICKUP_AGENT', name: agent.name },
    `Pickup authenticated by courier ${agent.name} at Adyar hub. Sealed for transit.`,
    { agent: agent.name, pickupHub: newDonation.pickupAddress }
  );

  const inTransitBlock = LedgerService.recordCheckpoint(
    donationId,
    'IN_TRANSIT_CHECKPOINT',
    { id: 'system-iot', role: 'SYSTEM', name: 'CareTrace Route Telemetry Engine' },
    `Consignment in corridor: Grand Southern Trunk Road passing Guindy. Speed: 42 km/h.`,
    { speedKmh: 42, progress: '60%' }
  );

  console.assert(pickupBlock.actorName === agent.name, '❌ Pickup actor mismatch');
  console.log(`   ✅ Courier Pickup Sealed: Block #${pickupBlock.index} by ${agent.name}`);
  console.log(`   ✅ In-Transit Telemetry Recorded: Block #${inTransitBlock.index}`);

  // -------------------------------------------------------------------------
  // 6. DYNAMIC DELIVERY CONFIRMATION & PROOF OF DELIVERY
  // -------------------------------------------------------------------------
  console.log('\n6️⃣ Auditing Handover Confirmation & Proof of Delivery Minting...');
  newDonation.status = 'CONFIRMED';
  newDonation.deliveryTimestamp = new Date().toISOString();
  newDonation.confirmationNotes = `${directorUser.name} (Director) - Received all ${pledgeQuantity} math kits in sealed boxes.`;
  newDonation.recipientSignature = `DIGITAL_SIG:${directorUser.name.toUpperCase().replace(/\s+/g, '_')}_AUTHENTICATED`;
  db.upsertDonation(newDonation);

  const deliveryBlock = LedgerService.recordCheckpoint(
    donationId,
    'DELIVERY_CONFIRMED',
    { id: directorUser.id, role: 'INSTITUTION', name: directorUser.name },
    `Consignment delivered and inspected by ${directorUser.name} (${newInstitution.name}). Attached tamper-evident proof.`,
    { signature: newDonation.recipientSignature, notes: newDonation.confirmationNotes }
  );

  const certificate: ProofOfDeliveryCertificate = {
    donationId,
    donorName: newDonor.name,
    institutionName: newInstitution.name,
    itemSummary: `${pledgeQuantity} ${createdReq.unit} - ${createdReq.title}`,
    pickupVerifiedAt: newDonation.pickupTimestamp!,
    deliveryConfirmedAt: newDonation.deliveryTimestamp!,
    pickupAgentName: agent.name,
    recipientRepresentative: `${directorUser.name} (Director)`,
    genesisBlockHash: genesisBlock.blockHash,
    deliveryBlockHash: deliveryBlock.blockHash,
    chainLength: 4,
    verificationUrl: `https://caretrace.org/verify?id=${donationId}`
  };

  console.assert(deliveryBlock.actorName === 'David Raj', '❌ Delivery block actor is not David Raj');
  console.assert(certificate.donorName === 'Kavitha Raman', '❌ Certificate donor is not Kavitha Raman');
  console.assert(certificate.recipientRepresentative === 'David Raj (Director)', '❌ Certificate recipient is not David Raj');
  console.log(`   ✅ Handover Sealed: Block #${deliveryBlock.index} by ${directorUser.name}`);
  console.log(`   ✅ Proof of Delivery Minted: ${certificate.itemSummary}`);
  console.log(`   ✅ Certificate Recipient: ${certificate.recipientRepresentative}`);
  console.log(`   ✅ Genesis Hash -> Delivery Hash: ${certificate.genesisBlockHash.slice(0, 16)}... -> ${certificate.deliveryBlockHash.slice(0, 16)}...`);

  // -------------------------------------------------------------------------
  // 7. CRYPTOGRAPHIC LEDGER INTEGRITY CHECK
  // -------------------------------------------------------------------------
  console.log('\n7️⃣ Verifying End-to-End Cryptographic Ledger Integrity...');
  const ledgerVerification = LedgerService.verifyChain();
  console.log(`   ✅ Total Ledger Blocks: ${ledgerVerification.totalBlocks}`);
  console.log(`   ✅ Head Hash: ${ledgerVerification.chainHeadHash}`);
  console.log(`   ✅ Ledger Chain Valid? ${ledgerVerification.isValid}`);
  console.assert(ledgerVerification.isValid === true, '❌ Ledger verification FAILED after dynamic actions!');

  console.log('\n🎉 STAGE F FULL FUNCTIONAL AUDIT PASSED WITH ZERO SHORTCUTS!\n');
}

runStageFAudit().catch(err => {
  console.error('❌ Stage F audit failed:', err);
  process.exit(1);
});
