import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { LedgerService } from '../services/ledgerService';
import { NotificationService } from '../services/notificationService';

export const ledgerRouter = Router();

// Get all ledger blocks
ledgerRouter.get('/', (req: Request, res: Response) => {
  const blocks = db.getLedgerBlocks();
  res.json({ success: true, count: blocks.length, blocks });
});

// Get blocks for a specific donation
ledgerRouter.get('/donation/:donationId', (req: Request, res: Response) => {
  const blocks = db.getLedgerBlocksForDonation(req.params.donationId);
  res.json({ success: true, count: blocks.length, blocks });
});

// Cryptographically verify entire ledger integrity
ledgerRouter.get('/verify', (req: Request, res: Response) => {
  const result = LedgerService.verifyChain();
  res.json({ success: true, result });
});

// Cryptographically verify chain for specific donation
ledgerRouter.get('/verify/:donationId', (req: Request, res: Response) => {
  const result = LedgerService.verifyChain(req.params.donationId);
  res.json({ success: true, result });
});

// Demo tool: Tamper with a block to demonstrate detection
ledgerRouter.post('/simulate-tamper', (req: Request, res: Response) => {
  const { blockIndex, alteredDetails } = req.body;
  const idx = Number(blockIndex);

  const tampered = db.tamperBlock(
    idx,
    alteredDetails || 'MALICIOUS_ALTERATION: Attempted to modify confirmed delivered item count from 50 to 5.'
  );

  if (!tampered) {
    return res.status(404).json({ success: false, error: 'Block not found at index ' + idx });
  }

  // Run verification immediately to show failure
  const verificationAfterTamper = LedgerService.verifyChain();

  NotificationService.broadcast('LEDGER_TAMPER_ALERT', {
    tamperedBlockIndex: idx,
    verification: verificationAfterTamper
  });

  res.json({
    success: true,
    message: `Block #${idx} artificially tampered with for demonstration.`,
    verification: verificationAfterTamper
  });
});

