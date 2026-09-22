"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = exports.GENESIS_PREV_HASH = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../db/database");
exports.GENESIS_PREV_HASH = '0'.repeat(64);
class LedgerService {
    /**
     * Deterministic SHA-256 hash of any JavaScript object or string
     */
    static sha256(data) {
        const serialized = typeof data === 'string'
            ? data
            : JSON.stringify(data, Object.keys(data || {}).sort());
        return crypto_1.default.createHash('sha256').update(serialized).digest('hex');
    }
    /**
     * Computes the block hash for a given block header
     */
    static computeBlockHash(index, timestamp, donationId, eventType, actorId, details, payloadHash, previousHash, nonce) {
        const raw = `${index}:${timestamp}:${donationId}:${eventType}:${actorId}:${details}:${payloadHash}:${previousHash}:${nonce}`;
        return crypto_1.default.createHash('sha256').update(raw).digest('hex');
    }
    /**
     * Records a new immutable checkpoint block into the chain
     */
    static recordCheckpoint(donationId, eventType, actor, details, payload = {}) {
        const blocks = database_1.db.getLedgerBlocks();
        const index = blocks.length;
        const timestamp = new Date().toISOString();
        const previousHash = index === 0 ? exports.GENESIS_PREV_HASH : blocks[blocks.length - 1].blockHash;
        const payloadHash = this.sha256(payload);
        const nonce = 0; // Deterministic nonce
        const blockHash = this.computeBlockHash(index, timestamp, donationId, eventType, actor.id, details, payloadHash, previousHash, nonce);
        const block = {
            index,
            timestamp,
            donationId,
            eventType,
            actorId: actor.id,
            actorRole: actor.role,
            actorName: actor.name,
            details,
            payloadHash,
            previousHash,
            blockHash,
            nonce,
            payload
        };
        database_1.db.addLedgerBlock(block);
        // Update donation's latest ledger block hash
        const donation = database_1.db.getDonationById(donationId);
        if (donation) {
            donation.ledgerBlockHash = blockHash;
            database_1.db.upsertDonation(donation);
        }
        return block;
    }
    /**
     * Cryptographically verifies the entire ledger chain or a specific donation's chain
     */
    static verifyChain(donationId) {
        const allBlocks = database_1.db.getLedgerBlocks();
        const now = new Date().toISOString();
        if (allBlocks.length === 0) {
            return {
                isValid: true,
                totalBlocks: 0,
                verifiedAt: now,
                chainHeadHash: exports.GENESIS_PREV_HASH
            };
        }
        // Verify global chain from genesis to head
        for (let i = 0; i < allBlocks.length; i++) {
            const block = allBlocks[i];
            // 1. Verify previous hash pointer
            if (i === 0) {
                if (block.previousHash !== exports.GENESIS_PREV_HASH) {
                    return {
                        isValid: false,
                        totalBlocks: allBlocks.length,
                        verifiedAt: now,
                        corruptedBlockIndex: block.index,
                        errorDetail: `Genesis block previousHash invalid. Expected ${exports.GENESIS_PREV_HASH}, found ${block.previousHash}`,
                        chainHeadHash: block.blockHash
                    };
                }
            }
            else {
                const prevBlock = allBlocks[i - 1];
                if (block.previousHash !== prevBlock.blockHash) {
                    return {
                        isValid: false,
                        totalBlocks: allBlocks.length,
                        verifiedAt: now,
                        corruptedBlockIndex: block.index,
                        errorDetail: `Chain break at block #${block.index}. previousHash (${block.previousHash.slice(0, 12)}...) does not match block #${prevBlock.index} hash (${prevBlock.blockHash.slice(0, 12)}...)`,
                        chainHeadHash: block.blockHash
                    };
                }
            }
            // 2. Recompute current block hash from contents
            const expectedHash = this.computeBlockHash(block.index, block.timestamp, block.donationId, block.eventType, block.actorId, block.details, block.payloadHash, block.previousHash, block.nonce);
            if (block.blockHash !== expectedHash) {
                return {
                    isValid: false,
                    totalBlocks: allBlocks.length,
                    verifiedAt: now,
                    corruptedBlockIndex: block.index,
                    errorDetail: `Tampering detected in block #${block.index}! Stored hash (${block.blockHash.slice(0, 12)}...) != computed hash (${expectedHash.slice(0, 12)}...). Data content has been altered.`,
                    chainHeadHash: block.blockHash
                };
            }
        }
        const targetBlocks = donationId
            ? allBlocks.filter(b => b.donationId === donationId)
            : allBlocks;
        const headBlock = targetBlocks.length > 0
            ? targetBlocks[targetBlocks.length - 1]
            : allBlocks[allBlocks.length - 1];
        return {
            isValid: true,
            totalBlocks: targetBlocks.length,
            verifiedAt: now,
            chainHeadHash: headBlock ? headBlock.blockHash : exports.GENESIS_PREV_HASH
        };
    }
    /**
     * Generates a verifiable Proof-of-Delivery certificate for a completed donation
     */
    static generateCertificate(donationId) {
        const donation = database_1.db.getDonationById(donationId);
        if (!donation)
            return null;
        const donationBlocks = database_1.db.getLedgerBlocksForDonation(donationId);
        if (donationBlocks.length === 0)
            return null;
        const genesisBlock = donationBlocks[0];
        const deliveryBlock = donationBlocks.find(b => b.eventType === 'DELIVERY_CONFIRMED') || donationBlocks[donationBlocks.length - 1];
        const itemSummary = donation.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ');
        return {
            donationId: donation.id,
            donorName: donation.donorName,
            institutionName: donation.institutionName,
            itemSummary,
            pickupVerifiedAt: donation.pickupTimestamp || genesisBlock.timestamp,
            deliveryConfirmedAt: donation.deliveryTimestamp || deliveryBlock.timestamp,
            pickupAgentName: donation.pickupAgentName || 'CareTrace Logistics Team',
            recipientRepresentative: donation.confirmationNotes?.split(' - ')[0] || 'Institution Director',
            recipientSignature: donation.recipientSignature,
            genesisBlockHash: genesisBlock.blockHash,
            deliveryBlockHash: deliveryBlock.blockHash,
            chainLength: donationBlocks.length,
            verificationUrl: `https://caretrace.org/verify/${donation.id}`,
            proofPhotoUrl: donation.proofPhotoUrl,
            hasPhotoProof: Boolean(donation.proofPhotoUrl)
        };
    }
}
exports.LedgerService = LedgerService;
