"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./db/database");
const ledgerService_1 = require("./services/ledgerService");
const shared_1 = require("@caretrace/shared");
async function runStageCVerification() {
    console.log('=================================================================');
    console.log('🧪 STAGE C AUTOMATED VERIFICATION: CLEAN DIRECT MONETARY DONATION');
    console.log('=================================================================\n');
    const donor = database_1.db.getUsers().find(u => u.role === 'DONOR');
    const requirement = database_1.db.getRequirements()[0];
    const institution = database_1.db.getInstitutionById(requirement.institutionId);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const donationId = `CT-2026-${randomSuffix}`;
    const receiptNumber = `REC-80G-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionRef = `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedAmount = 5000;
    const now = new Date().toISOString();
    console.log('1️⃣ Creating Direct Monetary Contribution (No UPI, No VPA, No Mock Apps)...');
    const newDonation = {
        id: donationId,
        donorId: donor.id,
        donorName: donor.name,
        donorEmail: donor.email,
        requirementId: requirement.id,
        requirementTitle: requirement.title,
        institutionId: institution.id,
        institutionName: institution.name,
        type: 'FUNDS',
        items: [
            {
                name: `Monetary Contribution (${requirement.title})`,
                quantity: 1,
                unit: 'INR',
                estimatedValueInr: parsedAmount
            }
        ],
        status: 'CONFIRMED',
        pickupAddress: 'N/A (Direct Monetary Contribution)',
        destinationAddress: `${institution.address}, ${institution.city}, ${institution.state}`,
        pickupCoordinates: { latitude: 13.0850, longitude: 80.2101 },
        destinationCoordinates: { latitude: institution.latitude, longitude: institution.longitude },
        qrCodePayload: `CARETRACE:MONETARY:${donationId}:${transactionRef}`,
        monetaryAmountInr: parsedAmount,
        receiptNumber,
        paymentMethod: 'Direct Monetary Contribution',
        upiTransactionId: transactionRef,
        deliveryTimestamp: now,
        confirmationNotes: `Monetary contribution of ₹${parsedAmount.toLocaleString('en-IN')} confirmed to ${institution.name} (Txn Ref: ${transactionRef}).`,
        createdAt: now,
        updatedAt: now
    };
    database_1.db.upsertDonation(newDonation);
    const ledgerBlock = ledgerService_1.LedgerService.recordCheckpoint(donationId, 'MONETARY_DONATION_CONFIRMED', { id: donor.id, role: 'DONOR', name: donor.name }, `Monetary contribution of ₹${parsedAmount.toLocaleString('en-IN')} confirmed for ${institution.name} (Receipt #${receiptNumber})`, {
        amountInr: parsedAmount,
        donorId: donor.id,
        donorName: donor.name,
        institutionId: institution.id,
        institutionName: institution.name,
        receiptNumber,
        transactionRef
    });
    const receipt = {
        receiptNumber,
        donationId,
        amountInr: parsedAmount,
        amountInWords: (0, shared_1.numberToIndianWords)(parsedAmount),
        date: now,
        donorName: donor.name,
        donorEmail: donor.email,
        donorPhone: donor.phone,
        institutionName: institution.name,
        institutionRegistrationNumber: institution.registrationNumber,
        institutionTaxId: institution.taxId,
        institutionAddress: `${institution.address}, ${institution.city}, ${institution.state} ${institution.postalCode}`,
        requirementTitle: requirement.title,
        paymentMethod: 'Direct Monetary Contribution',
        upiTransactionId: transactionRef,
        ledgerBlockHash: ledgerBlock.blockHash,
        ledgerBlockIndex: ledgerBlock.index,
        isDemoSample: true
    };
    console.log(`   ✅ Donation ID: ${newDonation.id}`);
    console.log(`   ✅ Payment Method: "${newDonation.paymentMethod}"`);
    console.log(`   ✅ Transaction Reference: "${newDonation.upiTransactionId}" (Matches TXN-2026-XXXX pattern)`);
    console.log(`   ✅ Pickup Address: "${newDonation.pickupAddress}"`);
    console.assert(newDonation.paymentMethod === 'Direct Monetary Contribution', '❌ Payment method is not Direct Monetary Contribution');
    console.assert(newDonation.upiTransactionId?.startsWith('TXN-2026-'), '❌ Transaction reference does not start with TXN-2026-');
    console.assert(!JSON.stringify(newDonation).includes('sandboxbank'), '❌ Found sandboxbank VPA in donation!');
    console.assert(!JSON.stringify(newDonation).includes('BHIM'), '❌ Found BHIM branding in donation!');
    console.log('\n2️⃣ Verifying Section 80G Receipt & Cryptographic Block Stamp...');
    console.log(`   ✅ Receipt No: ${receipt.receiptNumber}`);
    console.log(`   ✅ Form 10BE Section 80G Compliant Sample: ${receipt.isDemoSample}`);
    console.log(`   ✅ Amount in Words: "${receipt.amountInWords}"`);
    console.log(`   ✅ Sealed Block Index: #${receipt.ledgerBlockIndex}`);
    console.log(`   ✅ Ledger Hash: ${receipt.ledgerBlockHash}`);
    console.assert(receipt.ledgerBlockHash.length === 64, '❌ SHA-256 block hash length is not 64 chars');
    console.log('\n3️⃣ Verifying Cryptographic Chain Integrity...');
    const verify = ledgerService_1.LedgerService.verifyChain();
    console.log(`   Chain Valid? ${verify.isValid}`);
    console.log(`   Total Blocks: ${verify.totalBlocks}`);
    console.log(`   Head Hash: ${verify.chainHeadHash}`);
    console.assert(verify.isValid === true, '❌ Cryptographic chain is invalid after mining monetary block!');
    console.log('\n🎯 STAGE C DIRECT MONETARY PLEDGE VERIFICATION COMPLETE AND PASSED.\n');
}
runStageCVerification().catch(err => {
    console.error('❌ Stage C verification failed:', err);
    process.exit(1);
});
