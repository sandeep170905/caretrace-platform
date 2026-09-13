import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { TransitService } from '../services/transitService';
import { NotificationService } from '../services/notificationService';

export const transitRouter = Router();

// Get telemetry for donation
transitRouter.get('/:donationId', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.donationId);
  if (!donation) {
    return res.status(404).json({ success: false, error: 'Donation not found' });
  }

  const telemetry = TransitService.getOrInitTelemetry(donation.id);
  const waypoints = TransitService.generateWaypoints(
    donation.pickupCoordinates,
    donation.destinationCoordinates,
    15
  );

  res.json({
    success: true,
    telemetry,
    waypoints,
    pickup: donation.pickupCoordinates,
    destination: donation.destinationCoordinates
  });
});

// Advance simulated transit position
transitRouter.post('/:donationId/step', (req: Request, res: Response) => {
  const { increment } = req.body;
  const donation = db.getDonationById(req.params.donationId);
  if (!donation) {
    return res.status(404).json({ success: false, error: 'Donation not found' });
  }

  const updatedTelemetry = TransitService.advanceSimulation(
    donation.id,
    increment ? Number(increment) : 20
  );

  NotificationService.broadcast('TRANSIT_UPDATE', {
    donationId: donation.id,
    telemetry: updatedTelemetry
  });

  res.json({ success: true, telemetry: updatedTelemetry });
});

