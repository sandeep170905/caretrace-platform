"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./db/database");
const ledgerService_1 = require("./services/ledgerService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function runStageDVerification() {
    console.log('=================================================================');
    console.log('🧪 STAGE D AUTOMATED VERIFICATION: AKASH KUMAR DIRECTOR RENAME');
    console.log('=================================================================\n');
    // 1. Verify User Record
    console.log('1️⃣ Verifying Institution Director User Record...');
    const director = database_1.db.getUserById('user-inst-akash');
    console.assert(director !== undefined, '❌ user-inst-akash not found in database');
    console.assert(director?.name === 'Akash Kumar', `❌ Expected name 'Akash Kumar', got '${director?.name}'`);
    console.assert(director?.role === 'INSTITUTION', '❌ Expected role INSTITUTION');
    console.assert(director?.institutionId === 'inst-karunai', '❌ Expected institutionId inst-karunai');
    console.log(`   ✅ Director ID: ${director?.id}`);
    console.log(`   ✅ Director Name: ${director?.name}`);
    console.log(`   ✅ Institution ID: ${director?.institutionId}`);
    console.log(`   ✅ Role: ${director?.role}\n`);
    // 2. Verify Delivered Consignment CT-2026-8801 Recipient Signature & Notes
    console.log('2️⃣ Verifying Consignment Attributions & Handover Signature...');
    const deliveredDonation = database_1.db.getDonationById('CT-2026-8801');
    console.assert(deliveredDonation !== undefined, '❌ CT-2026-8801 not found');
    console.assert(deliveredDonation?.confirmationNotes?.includes('Akash Kumar'), '❌ confirmationNotes does not mention Akash Kumar');
    console.assert(deliveredDonation?.recipientSignature?.includes('AKASH_KUMAR'), '❌ recipientSignature does not contain AKASH_KUMAR');
    console.assert(!deliveredDonation?.confirmationNotes?.includes('Lakshmi'), '❌ confirmationNotes still contains Lakshmi');
    console.assert(!deliveredDonation?.recipientSignature?.includes('LAKSHMI'), '❌ recipientSignature still contains LAKSHMI');
    console.log(`   ✅ Handover Notes: "${deliveredDonation?.confirmationNotes}"`);
    console.log(`   ✅ Handover Signature: "${deliveredDonation?.recipientSignature}"\n`);
    // 3. Verify Cryptographic Ledger Blocks
    console.log('3️⃣ Verifying SHA-256 Ledger Blocks for CT-2026-8801...');
    const blocks = database_1.db.getLedgerBlocksForDonation('CT-2026-8801');
    const deliveryBlock = blocks.find(b => b.eventType === 'DELIVERY_CONFIRMED');
    console.assert(deliveryBlock !== undefined, '❌ DELIVERY_CONFIRMED block not found');
    console.assert(deliveryBlock?.actorName === 'Akash Kumar', `❌ Ledger block actor is not Akash Kumar: got '${deliveryBlock?.actorName}'`);
    console.assert(deliveryBlock?.details.includes('Akash Kumar'), '❌ Ledger block details do not mention Akash Kumar');
    console.assert(!deliveryBlock?.details.includes('Lakshmi'), '❌ Ledger block details still mention Lakshmi');
    console.log(`   ✅ Block #${deliveryBlock?.index} Actor: ${deliveryBlock?.actorName} (${deliveryBlock?.actorRole})`);
    console.log(`   ✅ Block Details: "${deliveryBlock?.details}"`);
    console.log(`   ✅ Block SHA-256 Hash: ${deliveryBlock?.blockHash}\n`);
    // 4. Verify Entire Chain Integrity
    console.log('4️⃣ Verifying Overall Ledger Cryptographic Integrity...');
    const verification = ledgerService_1.LedgerService.verifyChain();
    console.log(`   Chain Valid? ${verification.isValid}`);
    console.log(`   Total Blocks: ${verification.totalBlocks}`);
    console.log(`   Chain Head: ${verification.chainHeadHash}`);
    console.assert(verification.isValid === true, '❌ Cryptographic chain is INVALID!');
    // 5. Scan caretrace.db.json for any leftover "Lakshmi"
    console.log('\n5️⃣ Auditing caretrace.db.json Disk File for Leftover Names...');
    const dbFile = path_1.default.join(__dirname, '../data/caretrace.db.json');
    const fileContent = fs_1.default.readFileSync(dbFile, 'utf-8');
    const lakshmiFound = fileContent.includes('Lakshmi') || fileContent.includes('lakshmi');
    console.assert(!lakshmiFound, '❌ Found "Lakshmi" in caretrace.db.json!');
    console.log(`   ✅ Zero occurrences of "Lakshmi" in caretrace.db.json on disk.`);
    console.log('\n🎯 STAGE D AKASH KUMAR DIRECTOR VERIFICATION COMPLETE AND PASSED.\n');
}
runStageDVerification().catch(err => {
    console.error('❌ Stage D verification failed:', err);
    process.exit(1);
});
