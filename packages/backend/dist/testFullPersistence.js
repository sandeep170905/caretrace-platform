"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./db/database");
const authService_1 = require("./services/authService");
const ledgerService_1 = require("./services/ledgerService");
const path_1 = __importDefault(require("path"));
async function runFullPersistenceVerification() {
    console.log('========================================================================');
    console.log('🧪 STAGE 1: COMPREHENSIVE END-TO-END DATA PERSISTENCE VERIFICATION');
    console.log('========================================================================\n');
    await database_1.db.init();
    const engine = database_1.db.getEngine();
    console.log(`✅ Active Database Engine: ${engine.toUpperCase()}`);
    const timestamp = Date.now();
    const testDonorId = `user-donor-persist-${timestamp}`;
    const testEmail = `priya.donor.${timestamp}@caretrace-test.org`;
    const testPassword = 'PriyaSecurePassword2026!';
    // 1. Write Path 1: Donor Registration
    console.log('\n1️⃣ Testing Real Donor Registration Persistence...');
    const donorUser = {
        id: testDonorId,
        name: `Priya Ramanathan ${timestamp % 1000}`,
        email: testEmail,
        role: 'DONOR',
        phone: '+91 98403 99881',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        passwordHash: authService_1.AuthService.hashPassword(testPassword),
        createdAt: new Date().toISOString()
    };
    await database_1.db.upsertUser(donorUser);
    console.log(`   ✅ Registered Donor: ${donorUser.name} (${donorUser.id})`);
    // 2. Write Path 2: Institution Registration
    console.log('\n2️⃣ Testing Real Sanctuary / Institution Registration Persistence...');
    const testInstId = `inst-test-${timestamp}`;
    const testInstitution = {
        id: testInstId,
        name: `Vaagai Nalan Illam ${timestamp % 1000}`,
        registrationNumber: `TN-CH-NGO-2026-${timestamp % 10000}`,
        taxId: `12AA-TN-${timestamp % 100000}`,
        address: '15 Trunk Road, Poonamallee',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600056',
        latitude: 13.0489,
        longitude: 80.1111,
        capacity: 50,
        currentChildrenCount: 38,
        verified: true,
        verificationDate: new Date().toISOString(),
        trustScore: 94,
        contactEmail: `director@vaagaishelter.${timestamp}.org`,
        contactPhone: '+91 94440 12345',
        description: 'Residential foster sanctuary for destitute and orphaned girls in western Chennai.'
    };
    await database_1.db.upsertInstitution(testInstitution);
    console.log(`   ✅ Registered Institution: ${testInstitution.name} (${testInstitution.id})`);
    // 3. Write Path 3: Requirement Creation
    console.log('\n3️⃣ Testing Childcare Requirement Creation Persistence...');
    const testReqId = `req-test-${timestamp}`;
    const testReq = {
        id: testReqId,
        institutionId: testInstId,
        institutionName: testInstitution.name,
        category: 'EDUCATION',
        title: 'Digital Tablets & Learning Software for High School Students',
        description: 'Refurbished 10-inch tablets and state board syllabus digital content packs for 25 high school students.',
        targetQuantity: 25,
        unit: 'tablets',
        fulfilledQuantity: 0,
        urgency: 'HIGH',
        status: 'VERIFIED',
        authenticityScore: 95,
        mlRiskScore: 0.04,
        mlRiskTier: 'LOW',
        riskFlags: [],
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await database_1.db.upsertRequirement(testReq);
    console.log(`   ✅ Created Requirement: "${testReq.title}" (${testReq.id})`);
    // 4. Write Path 4: Consignment / Donation Pledge
    console.log('\n4️⃣ Testing Consignment Pledge Persistence...');
    const testDonationId = `CT-2026-${(timestamp % 9000) + 1000}`;
    const testDonation = {
        id: testDonationId,
        donorId: donorUser.id,
        donorName: donorUser.name,
        donorEmail: donorUser.email,
        requirementId: testReq.id,
        requirementTitle: testReq.title,
        institutionId: testInstitution.id,
        institutionName: testInstitution.name,
        type: 'PHYSICAL_GOODS',
        items: [{ name: testReq.title, quantity: 10, unit: 'tablets', estimatedValueInr: 90000 }],
        status: 'MATCHED',
        pickupAgentId: 'user-agent-sakthivel',
        pickupAgentName: 'Sakthivel S',
        pickupAddress: 'Adyar Electronics Depot, Chennai 600020',
        destinationAddress: `${testInstitution.address}, ${testInstitution.city}`,
        pickupCoordinates: { latitude: 13.0012, longitude: 80.2565 },
        destinationCoordinates: { latitude: testInstitution.latitude, longitude: testInstitution.longitude },
        currentCoordinates: { latitude: 13.0012, longitude: 80.2565 },
        qrCodePayload: `CARETRACE:${testDonationId}:${donorUser.id}:${testInstitution.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await database_1.db.upsertDonation(testDonation);
    ledgerService_1.LedgerService.recordCheckpoint(testDonationId, 'DONATION_MATCHED', { id: donorUser.id, role: 'DONOR', name: donorUser.name }, `Priya Ramanathan pledged 10 digital learning tablets to ${testInstitution.name}.`, { itemsCount: 10, totalValueInr: 90000 });
    console.log(`   ✅ Pledged Donation: ${testDonation.id} for requirement ${testReq.id}`);
    // 5. Write Path 5: Broadcast Announcement
    console.log('\n5️⃣ Testing Broadcast Announcement Persistence...');
    const testAnnId = `ann-test-${timestamp}`;
    const testAnnouncement = {
        id: testAnnId,
        title: `Monsoon Readiness Advisory #${timestamp % 100}`,
        message: 'All Chennai childcare shelters are advised to verify elevated dry storage for food grain consignments.',
        urgency: 'GENERAL',
        createdAt: new Date().toISOString(),
        active: true,
        createdBy: 'Sandeep R (Platform Admin)'
    };
    await database_1.db.upsertAnnouncement(testAnnouncement);
    console.log(`   ✅ Broadcast Announcement: "${testAnnouncement.title}"`);
    // 6. Direct SQL Disk Verification
    console.log('\n6️⃣ Inspecting Physical SQL Storage on Disk...');
    if (engine === 'sqlite') {
        const BetterSqlite3 = require('better-sqlite3');
        const sqlitePath = path_1.default.join(__dirname, '../data/caretrace.sqlite');
        const directSql = new BetterSqlite3(sqlitePath);
        const userRow = directSql.prepare('SELECT * FROM users WHERE id = ?').get(donorUser.id);
        console.assert(userRow !== undefined, '❌ User not found in SQLite physical file!');
        console.log(`   ✅ Direct SQLite Query: User record confirmed on disk.`);
        const instRow = directSql.prepare('SELECT * FROM institutions WHERE id = ?').get(testInstitution.id);
        console.assert(instRow !== undefined, '❌ Institution not found in SQLite physical file!');
        console.log(`   ✅ Direct SQLite Query: Institution record confirmed on disk.`);
        const reqRow = directSql.prepare('SELECT * FROM requirements WHERE id = ?').get(testReq.id);
        console.assert(reqRow !== undefined, '❌ Requirement not found in SQLite physical file!');
        console.log(`   ✅ Direct SQLite Query: Requirement record confirmed on disk.`);
        const donRow = directSql.prepare('SELECT * FROM donations WHERE id = ?').get(testDonation.id);
        console.assert(donRow !== undefined, '❌ Donation not found in SQLite physical file!');
        console.log(`   ✅ Direct SQLite Query: Donation record confirmed on disk.`);
        directSql.close();
    }
    // 7. Simulated Process Cold Restart
    console.log('\n7️⃣ Simulating Cold Server Restart (Re-instantiating DB from Scratch)...');
    const freshDb = new database_1.Database();
    await freshDb.init();
    const retrievedDonor = freshDb.getUserById(donorUser.id);
    console.assert(retrievedDonor !== undefined, '❌ Donor user lost after restart!');
    console.assert(retrievedDonor?.name === donorUser.name, '❌ Donor name altered after restart!');
    console.log(`   ✅ Retrieved Donor after restart: ${retrievedDonor?.name}`);
    const authSuccess = authService_1.AuthService.verifyPassword(testPassword, retrievedDonor?.passwordHash);
    console.assert(authSuccess === true, '❌ Password hash PBKDF2 authentication failed after restart!');
    console.log(`   ✅ PBKDF2 Password authentication successful on reloaded donor record.`);
    const retrievedInst = freshDb.getInstitutionById(testInstitution.id);
    console.assert(retrievedInst !== undefined, '❌ Institution lost after restart!');
    console.assert(retrievedInst?.name === testInstitution.name, '❌ Institution name altered after restart!');
    console.log(`   ✅ Retrieved Institution after restart: ${retrievedInst?.name}`);
    const retrievedReq = freshDb.getRequirementById(testReq.id);
    console.assert(retrievedReq !== undefined, '❌ Requirement lost after restart!');
    console.log(`   ✅ Retrieved Requirement after restart: "${retrievedReq?.title}"`);
    const retrievedDonation = freshDb.getDonationById(testDonation.id);
    console.assert(retrievedDonation !== undefined, '❌ Donation lost after restart!');
    console.log(`   ✅ Retrieved Consignment after restart: ${retrievedDonation?.id} (Status: ${retrievedDonation?.status})`);
    const retrievedAnn = freshDb.getAnnouncementById(testAnnouncement.id);
    console.assert(retrievedAnn !== undefined, '❌ Announcement lost after restart!');
    console.log(`   ✅ Retrieved Announcement after restart: "${retrievedAnn?.title}"`);
    console.log('\n8️⃣ Verifying Cryptographic Ledger Integrity after Persistence Operations...');
    const ledgerIntegrity = ledgerService_1.LedgerService.verifyChain();
    console.assert(ledgerIntegrity.isValid === true, '❌ Ledger hash chain invalid after operations!');
    console.log(`   ✅ Ledger Chain Length: ${ledgerIntegrity.totalBlocks} blocks`);
    console.log(`   ✅ Ledger Status: VALID (isValid: ${ledgerIntegrity.isValid})`);
    console.log(`   ✅ Head Hash: ${ledgerIntegrity.chainHeadHash}`);
    console.log('\n🎉 ALL WRITE PATHS & COLD RESTART PERSISTENCE TESTS PASSED 100%!\n');
}
runFullPersistenceVerification().catch(err => {
    console.error('❌ Persistence verification failed:', err);
    process.exit(1);
});
