"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitRouter = void 0;
const express_1 = require("express");
const database_1 = require("../db/database");
const transitService_1 = require("../services/transitService");
const notificationService_1 = require("../services/notificationService");
exports.transitRouter = (0, express_1.Router)();
// Get telemetry for donation
exports.transitRouter.get('/:donationId', (req, res) => {
    const donation = database_1.db.getDonationById(req.params.donationId);
    if (!donation) {
        return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    const telemetry = transitService_1.TransitService.getOrInitTelemetry(donation.id);
    const waypoints = transitService_1.TransitService.generateWaypoints(donation.pickupCoordinates, donation.destinationCoordinates, 15);
    res.json({
        success: true,
        telemetry,
        waypoints,
        pickup: donation.pickupCoordinates,
        destination: donation.destinationCoordinates
    });
});
// Advance simulated transit position
exports.transitRouter.post('/:donationId/step', (req, res) => {
    const { increment } = req.body;
    const donation = database_1.db.getDonationById(req.params.donationId);
    if (!donation) {
        return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    const updatedTelemetry = transitService_1.TransitService.advanceSimulation(donation.id, increment ? Number(increment) : 20);
    notificationService_1.NotificationService.broadcast('TRANSIT_UPDATE', {
        donationId: donation.id,
        telemetry: updatedTelemetry
    });
    res.json({ success: true, telemetry: updatedTelemetry });
});
