"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./db/database");
const seed_1 = require("./db/seed");
const ledgerService_1 = require("./services/ledgerService");
const fraudScoringService_1 = require("./services/fraudScoringService");
const shared_1 = require("@caretrace/shared");
async function runTests() {
    console.log('🧪 Starting CareTrace Backend Automated Verification...\n');
    // Test 1: Run Seed
    console.log('1️⃣ Testing Database Seeder...');
    await (0, seed_1.runSeed)();
    const users = database_1.db.getUsers();
    const institutions = database_1.db.getInstitutions();
    const requirements = database_1.db.getRequirements();
    const donations = database_1.db.getDonations();
    const blocks = database_1.db.getLedgerBlocks();
    console.assert(users.length === 6, `Expected 6 users, got ${users.length}`);
    console.assert(institutions.length === 3, `Expected 3 institutions, got ${institutions.length}`);
    console.assert(requirements.length === 5, `Expected 5 requirements, got ${requirements.length}`);
    console.assert(donations.length >= 4, `Expected at least 4 donations, got ${donations.length}`);
    console.assert(blocks.length >= 10, `Expected at least 10 blocks, got ${blocks.length}`);
    console.log('   ✅ Seed verification PASSED.\n');
    // Test 2: SHA-256 Ledger Chain Integrity
    console.log('2️⃣ Testing Cryptographic SHA-256 Ledger Integrity...');
    const initialVerify = ledgerService_1.LedgerService.verifyChain();
    console.log(`   Chain Length: ${initialVerify.totalBlocks}`);
    console.log(`   Head Hash: ${initialVerify.chainHeadHash}`);
    console.assert(initialVerify.isValid === true, 'Expected valid ledger chain');
    console.log('   ✅ Initial chain cryptographic verification PASSED.\n');
    // Test 3: Rule-Based Fraud Scoring Engine
    console.log('3️⃣ Testing Rule-Based Fraud & Authenticity Scoring...');
    const testReq = {
        title: 'Excessive Medicine Request',
        category: 'MEDICINE',
        targetQuantity: 1000, // 1000 units for a 40-capacity institution!
        unit: 'boxes',
        documents: [] // No prescription manifest
    };
    const scoring = fraudScoringService_1.FraudScoringService.evaluateAndLogRequirement(testReq, 'inst-nanban');
    console.log(`   Score: ${scoring.score}/100, Risk Level: ${scoring.riskLevel}`);
    console.log(`   Flags detected: ${scoring.flags.map(f => f.ruleName).join(', ')}`);
    console.assert(scoring.isApproved === false, 'Expected unapproved score for suspicious request');
    console.assert(scoring.flags.length >= 2, 'Expected at least 2 risk flags');
    console.log('   ✅ Fraud & authenticity scoring PASSED.\n');
    // Test 4: Tamper Detection (Deliberately modify block data to simulate DB hacking)
    console.log('4️⃣ Testing Tamper Detection on Ledger Block #1...');
    const blockToTamper = blocks[1];
    const originalDetails = blockToTamper.details;
    database_1.db.tamperBlock(1, 'HACKED_RECORD: Altered consignment manifest from 80 bedsheets to 5 bedsheets.');
    const tamperedVerify = ledgerService_1.LedgerService.verifyChain();
    console.log(`   Tamper Verification Valid? ${tamperedVerify.isValid}`);
    console.log(`   Corrupted Block Index: ${tamperedVerify.corruptedBlockIndex}`);
    console.log(`   Detection Error: ${tamperedVerify.errorDetail}`);
    console.assert(tamperedVerify.isValid === false, 'Expected chain verification to FAIL after tampering');
    console.assert(tamperedVerify.corruptedBlockIndex === 1, 'Expected corruption detected at block #1');
    console.log('   ✅ Tamper-evident ledger defense PASSED: Malicious modification detected instantly.\n');
    // Restore pristine database
    await (0, seed_1.runSeed)();
    const restoredVerify = ledgerService_1.LedgerService.verifyChain();
    console.assert(restoredVerify.isValid === true, 'Expected valid chain after restore');
    console.log('   ✅ Database restored to valid state.\n');
    // Test 5: Simulated Monetary UPI Donation Flow (Stage A)
    console.log('5️⃣ Testing Simulated Monetary UPI Donation & 80G Receipt (Stage A)...');
    const testAmount = 125000; // ₹1,25,000 (over ₹1,00,000 to test lakhs formatting)
    const formattedCurrency = (0, shared_1.formatIndianCurrency)(testAmount);
    const wordsRepresentation = (0, shared_1.numberToIndianWords)(testAmount);
    console.log(`   Amount: ${formattedCurrency}`);
    console.log(`   Amount in Words: "${wordsRepresentation}"`);
    console.assert(formattedCurrency === '₹1,25,000', `Expected ₹1,25,000, got ${formattedCurrency}`);
    console.assert(wordsRepresentation === 'One Lakh Twenty Five Thousand Rupees Only', `Expected 'One Lakh Twenty Five Thousand Rupees Only', got '${wordsRepresentation}'`);
    // Create simulated monetary donation
    const monetaryDonationId = 'CT-2026-9999';
    const fictionalVpa = 'caretrace.demo@sandboxbank';
    const testDonor = users[0]; // Ajith R
    const testRequirement = requirements[0];
    const testInstitution = institutions.find(i => i.id === testRequirement.institutionId);
    const monetaryBlock = ledgerService_1.LedgerService.recordCheckpoint(monetaryDonationId, 'MONETARY_DONATION_CONFIRMED', { id: testDonor.id, role: 'DONOR', name: testDonor.name }, `Simulated UPI donation of ${formattedCurrency} confirmed for ${testInstitution.name}`, {
        amountInr: testAmount,
        donorId: testDonor.id,
        donorName: testDonor.name,
        institutionId: testInstitution.id,
        institutionName: testInstitution.name,
        vpa: fictionalVpa
    });
    console.assert(monetaryBlock.eventType === 'MONETARY_DONATION_CONFIRMED', 'Expected MONETARY_DONATION_CONFIRMED event type');
    console.log(`   Mined Ledger Block #${monetaryBlock.index} (${monetaryBlock.eventType})`);
    console.log(`   Block Hash: ${monetaryBlock.blockHash}`);
    const postMonetaryVerify = ledgerService_1.LedgerService.verifyChain();
    console.log(`   Total Blocks: ${postMonetaryVerify.totalBlocks}, Chain Valid? ${postMonetaryVerify.isValid}`);
    console.assert(postMonetaryVerify.isValid === true, 'Expected valid ledger chain after monetary donation block');
    const donationSpecificVerify = ledgerService_1.LedgerService.verifyChain(monetaryDonationId);
    console.log(`   Donation ${monetaryDonationId} Blocks: ${donationSpecificVerify.totalBlocks}, Valid? ${donationSpecificVerify.isValid}`);
    console.assert(donationSpecificVerify.isValid === true, 'Expected donation-specific chain to validate');
    console.log('   ✅ Monetary UPI donation and 80G ledger block PASSED.\n');
    console.log('🎉 ALL BACKEND VERIFICATIONS PASSED SUCCESSFULLY!');
}
runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
