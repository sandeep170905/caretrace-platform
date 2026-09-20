"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerRouter = void 0;
const express_1 = require("express");
const database_1 = require("../db/database");
const ledgerService_1 = require("../services/ledgerService");
const notificationService_1 = require("../services/notificationService");
exports.ledgerRouter = (0, express_1.Router)();
// Get all ledger blocks
exports.ledgerRouter.get('/', (req, res) => {
    const blocks = database_1.db.getLedgerBlocks();
    res.json({ success: true, count: blocks.length, blocks });
});
// Get blocks for a specific donation
exports.ledgerRouter.get('/donation/:donationId', (req, res) => {
    const blocks = database_1.db.getLedgerBlocksForDonation(req.params.donationId);
    res.json({ success: true, count: blocks.length, blocks });
});
// Cryptographically verify entire ledger integrity
exports.ledgerRouter.get('/verify', (req, res) => {
    const result = ledgerService_1.LedgerService.verifyChain();
    res.json({ success: true, result });
});
// Cryptographically verify chain for specific donation
exports.ledgerRouter.get('/verify/:donationId', (req, res) => {
    const result = ledgerService_1.LedgerService.verifyChain(req.params.donationId);
    res.json({ success: true, result });
});
// Demo tool: Tamper with a block to demonstrate detection
exports.ledgerRouter.post('/simulate-tamper', (req, res) => {
    const { blockIndex, alteredDetails } = req.body;
    const idx = Number(blockIndex);
    const tampered = database_1.db.tamperBlock(idx, alteredDetails || 'MALICIOUS_ALTERATION: Attempted to modify confirmed delivered item count from 50 to 5.');
    if (!tampered) {
        return res.status(404).json({ success: false, error: 'Block not found at index ' + idx });
    }
    // Run verification immediately to show failure
    const verificationAfterTamper = ledgerService_1.LedgerService.verifyChain();
    notificationService_1.NotificationService.broadcast('LEDGER_TAMPER_ALERT', {
        tamperedBlockIndex: idx,
        verification: verificationAfterTamper
    });
    res.json({
        success: true,
        message: `Block #${idx} artificially tampered with for demonstration.`,
        verification: verificationAfterTamper
    });
});
