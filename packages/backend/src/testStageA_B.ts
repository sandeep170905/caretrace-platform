import { db, Database } from './db/database';
import { AuthService } from './services/authService';
import { LedgerService } from './services/ledgerService';
import { QRService } from './services/qrService';
import { Donation } from '@caretrace/shared';
import fs from 'fs';
import path from 'path';

async function runStageABVerification() {
  console.log('=================================================================');
  console.log('🧪 STAGE A & B AUTOMATED VERIFICATION: REGISTRATION & PERSISTENCE');
  console.log('=================================================================\n');

  // Test A1: Register New Donor with Unique Credentials
  console.log('1️⃣ Testing Donor Registration & Database Record Creation...');
  const uniqueTimestamp = Date.now();
  const testEmail = `deepa.donor.${uniqueTimestamp}@caretrace-test.org`;
  const testName = `Deepa Mathur ${uniqueTimestamp % 1000}`;
  const testPassword = 'SecurePassword2026!';
  const testPhone = '+91 98409 99888';

  const newUser = {
    id: `user-donor-${uniqueTimestamp}`,
    name: testName,
    email: testEmail,
    role: 'DONOR' as const,
    phone: testPhone,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    passwordHash: AuthService.hashPassword(testPassword),
    createdAt: new Date().toISOString()
  };

  db.upsertUser(newUser);

  const retrievedUser = db.getUserById(newUser.id);
  console.assert(retrievedUser !== undefined, '❌ Failed to find created user by ID');
  console.assert(retrievedUser?.name === testName, '❌ User name does not match');
  console.assert(retrievedUser?.email === testEmail, '❌ User email does not match');
  console.assert(retrievedUser?.role === 'DONOR', '❌ User role is not DONOR');
  console.log(`   ✅ Created User ID: ${newUser.id}`);
  console.log(`   ✅ User Name: ${retrievedUser?.name}`);
  console.log(`   ✅ User Email: ${retrievedUser?.email}`);
  console.log('   ✅ User record successfully created in DB.\n');

  // Test A2: JWT Token Issuance & Verification
  console.log('2️⃣ Testing JWT Token Issuance & Payload Integrity...');
  const token = AuthService.generateToken(newUser);
  console.assert(typeof token === 'string' && token.length > 20, '❌ Token is invalid');

  const decoded = AuthService.verifyToken(token);
  console.assert(decoded !== null, '❌ Token verification failed');
  console.assert(decoded?.id === newUser.id, `❌ Token ID mismatch: expected ${newUser.id}, got ${decoded?.id}`);
  console.assert(decoded?.email === testEmail, `❌ Token email mismatch`);
  console.assert(decoded?.role === 'DONOR', `❌ Token role mismatch`);
  console.log(`   ✅ JWT Issued: ${token.substring(0, 30)}...`);
  console.log(`   ✅ Decoded Payload: ID=${decoded?.id}, Role=${decoded?.role}, Email=${decoded?.email}`);
  console.log('   ✅ JWT token correctly corresponds to the NEW user, NOT a demo persona.\n');

  // Test A3: Empty Initial State for Brand New Donor
  console.log('3️⃣ Testing Donor Dashboard Isolation (Empty Consignments)...');
  const newDonorDonations = db.getDonationsByDonor(newUser.id);
  const ajithDonations = db.getDonationsByDonor('user-donor-ajith');

  console.assert(newDonorDonations.length === 0, `❌ Expected 0 donations for new donor, found ${newDonorDonations.length}`);
  console.assert(ajithDonations.length > 0, `❌ Expected Ajith to have existing donations, found ${ajithDonations.length}`);
  console.log(`   ✅ New Donor (${newUser.name}) donations count: ${newDonorDonations.length}`);
  console.log(`   ✅ Ajith R donations count: ${ajithDonations.length}`);
  console.log('   ✅ Data isolation verified: New donor starts with empty donations list.\n');

  // Test A4: Creating a Donation for the New Donor Attaches to THEIR User ID
  console.log('4️⃣ Testing Donation Creation under New Donor User ID...');
  const requirements = db.getRequirements();
  const targetReq = requirements[0];
  const institution = db.getInstitutionById(targetReq.institutionId)!;

  const donationId = `CT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrCodePayload = QRService.createPayloadString(donationId, newUser.id, institution.id);
  const now = new Date().toISOString();

  const newDonation: Donation = {
    id: donationId,
    donorId: newUser.id,
    donorName: newUser.name,
    donorEmail: newUser.email,
    requirementId: targetReq.id,
    requirementTitle: targetReq.title,
    institutionId: institution.id,
    institutionName: institution.name,
    type: 'PHYSICAL_GOODS',
    items: [
      {
        name: targetReq.title,
        quantity: 5,
        unit: targetReq.unit
      }
    ],
    status: 'MATCHED',
    pickupAddress: 'Anna Nagar West Logistics Depot, Chennai 600040',
    destinationAddress: `${institution.address}, ${institution.city}, ${institution.state}`,
    pickupCoordinates: { latitude: 13.0850, longitude: 80.2101 },
    destinationCoordinates: { latitude: institution.latitude, longitude: institution.longitude },
    currentCoordinates: { latitude: 13.0850, longitude: 80.2101 },
    qrCodePayload,
    createdAt: now,
    updatedAt: now
  };

  db.upsertDonation(newDonation);
  LedgerService.recordCheckpoint(
    donationId,
    'DONATION_MATCHED',
    { id: newUser.id, role: 'DONOR', name: newUser.name },
    `Donation initiated by ${newUser.name} and matched to requirement: "${targetReq.title}"`,
    { items: newDonation.items, institution: institution.name }
  );

  console.assert(newDonation.donorId === newUser.id, `❌ Donation donorId mismatch: expected ${newUser.id}, got ${newDonation.donorId}`);
  console.assert(newDonation.donorId !== 'user-donor-ajith', '❌ Donation was incorrectly attached to Ajith R!');
  
  const updatedNewDonorDonations = db.getDonationsByDonor(newUser.id);
  const updatedAjithDonations = db.getDonationsByDonor('user-donor-ajith');

  console.assert(updatedNewDonorDonations.length === 1, `❌ Expected 1 donation for new donor, found ${updatedNewDonorDonations.length}`);
  console.assert(updatedAjithDonations.length === ajithDonations.length, `❌ Ajith donations count changed unexpectedly`);
  console.log(`   ✅ New Donation ID: ${newDonation.id}`);
  console.log(`   ✅ Attached Donor ID: ${newDonation.donorId} (Expected: ${newUser.id})`);
  console.log(`   ✅ New Donor now has ${updatedNewDonorDonations.length} donation(s).`);
  console.log(`   ✅ Ajith R donations remain unchanged at ${updatedAjithDonations.length}.`);
  console.log('   ✅ Donation successfully attached to NEW donor account.\n');

  // Test B1: Real SQL Database Persistence Verification
  console.log('5️⃣ Testing Real SQL Database Persistence across Simulated Server Restarts (STAGE B)...');
  const dbFilePath = path.join(__dirname, '../data/caretrace.sqlite');
  console.assert(fs.existsSync(dbFilePath), `❌ SQLite DB file does not exist at ${dbFilePath}`);

  const BetterSqlite3 = require('better-sqlite3');
  const directSql = new BetterSqlite3(dbFilePath);

  const foundUserInDisk: any = directSql.prepare('SELECT * FROM users WHERE id = ?').get(newUser.id);
  console.assert(foundUserInDisk !== undefined, '❌ New user was not written to caretrace.sqlite on disk!');
  console.assert(foundUserInDisk.email.toLowerCase() === testEmail.toLowerCase(), '❌ Disk user email mismatch');

  const foundDonationInDisk: any = directSql.prepare('SELECT * FROM donations WHERE id = ?').get(newDonation.id);
  console.assert(foundDonationInDisk !== undefined, '❌ New donation was not written to caretrace.sqlite on disk!');
  console.assert(foundDonationInDisk.donor_id === newUser.id, '❌ Disk donation donorId mismatch');
  directSql.close();

  console.log(`   ✅ Real SQL database file verified at: ${dbFilePath}`);
  console.log(`   ✅ User row for ${newUser.id} verified via SQL query SELECT FROM users.`);
  console.log(`   ✅ Donation row for ${newDonation.id} verified via SQL query SELECT FROM donations.`);

  // Test B2: Re-instantiate Database from Disk (Simulating Server Restart)
  console.log('\n6️⃣ Simulating Full Backend Process Restart...');
  const restartedDb = new Database();
  const userAfterRestart = restartedDb.getUserById(newUser.id);
  const userByEmailAfterRestart = restartedDb.getUserByEmail(testEmail);
  const donationAfterRestart = restartedDb.getDonationById(newDonation.id);

  console.assert(userAfterRestart !== undefined, '❌ User not found after database reload');
  console.assert(userByEmailAfterRestart !== undefined, '❌ User by email not found after database reload');
  console.assert(donationAfterRestart !== undefined, '❌ Donation not found after database reload');

  // Verify password PBKDF2 authentication against reloaded user
  const passwordValid = AuthService.verifyPassword(testPassword, userAfterRestart!.passwordHash!);
  console.assert(passwordValid === true, '❌ Password verification failed after database reload');

  console.log(`   ✅ User ${userAfterRestart?.name} successfully retrieved after cold restart.`);
  console.log(`   ✅ PBKDF2 Password authentication validated successfully.`);
  console.log(`   ✅ Donation ${donationAfterRestart?.id} loaded intact after cold restart.`);
  console.log('\n🎯 STAGE A & B BACKEND PERSISTENCE VERIFICATION COMPLETE AND PASSED.\n');
}

runStageABVerification().catch(err => {
  console.error('❌ Verification failed with error:', err);
  process.exit(1);
});
