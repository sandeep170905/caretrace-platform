import { Coordinates, TransitTelemetry } from '@caretrace/shared';
import { db } from '../db/database';

export class TransitService {
  /**
   * Generates interpolated waypoints between two geographic coordinates with natural road curve simulation
   */
  public static generateWaypoints(start: Coordinates, end: Coordinates, count: number = 10): Coordinates[] {
    const waypoints: Coordinates[] = [];
    const latDelta = end.latitude - start.latitude;
    const lngDelta = end.longitude - start.longitude;

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      // Add subtle curve offset (sine wave perpendicular to vector)
      const curveFactor = Math.sin(t * Math.PI) * 0.003;
      const lat = start.latitude + latDelta * t + curveFactor;
      const lng = start.longitude + lngDelta * t - curveFactor * 0.8;
      waypoints.push({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
    }

    return waypoints;
  }

  /**
   * Calculates approximate distance between two points in km (Haversine formula)
   */
  public static calculateDistanceKm(c1: Coordinates, c2: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
    const dLng = ((c2.longitude - c1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.latitude * Math.PI) / 180) *
        Math.cos((c2.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Updates or initializes simulated telemetry for a donation
   */
  public static getOrInitTelemetry(donationId: string): TransitTelemetry {
    const existing = db.getTransitTelemetry(donationId);
    if (existing) return existing;

    const donation = db.getDonationById(donationId);
    if (!donation) {
      throw new Error(`Donation ${donationId} not found`);
    }

    const totalDistance = this.calculateDistanceKm(
      donation.pickupCoordinates,
      donation.destinationCoordinates
    );

    const initialTelemetry: TransitTelemetry = {
      donationId,
      latitude: donation.pickupCoordinates.latitude,
      longitude: donation.pickupCoordinates.longitude,
      currentAddress: `En route from ${donation.pickupAddress.split(',')[0]}`,
      speedKmh: 42,
      estimatedArrivalMinutes: Math.max(5, Math.round((totalDistance / 40) * 60)),
      progressPercentage: 10,
      lastUpdated: new Date().toISOString()
    };

    db.upsertTransitTelemetry(initialTelemetry);
    return initialTelemetry;
  }

  /**
   * Advances the simulation progress by an increment
   */
  public static advanceSimulation(donationId: string, incrementPercent: number = 20): TransitTelemetry {
    const donation = db.getDonationById(donationId);
    if (!donation) throw new Error(`Donation ${donationId} not found`);

    const current = this.getOrInitTelemetry(donationId);
    const newProgress = Math.min(100, Math.max(0, current.progressPercentage + incrementPercent));

    // Interpolate coordinates
    const waypoints = this.generateWaypoints(
      donation.pickupCoordinates,
      donation.destinationCoordinates,
      20
    );

    const targetIdx = Math.min(
      waypoints.length - 1,
      Math.round((newProgress / 100) * (waypoints.length - 1))
    );
    const currentCoord = waypoints[targetIdx];

    const totalDistance = this.calculateDistanceKm(
      donation.pickupCoordinates,
      donation.destinationCoordinates
    );
    const remainingKm = totalDistance * (1 - newProgress / 100);
    const etaMins = Math.max(1, Math.round((remainingKm / 40) * 60));

    let addressDesc = `Transit Route 7 (Km ${(totalDistance * (newProgress / 100)).toFixed(1)} of ${totalDistance} km)`;
    if (newProgress >= 100) {
      addressDesc = `Arrived at destination: ${donation.destinationAddress}`;
    } else if (newProgress <= 10) {
      addressDesc = `Departing origin: ${donation.pickupAddress}`;
    }

    const updated: TransitTelemetry = {
      donationId,
      latitude: currentCoord.latitude,
      longitude: currentCoord.longitude,
      currentAddress: addressDesc,
      speedKmh: newProgress >= 100 ? 0 : Math.floor(35 + Math.random() * 20),
      estimatedArrivalMinutes: newProgress >= 100 ? 0 : etaMins,
      progressPercentage: newProgress,
      lastUpdated: new Date().toISOString()
    };

    db.upsertTransitTelemetry(updated);

    // Also update donation currentCoordinates
    donation.currentCoordinates = {
      latitude: currentCoord.latitude,
      longitude: currentCoord.longitude
    };
    db.upsertDonation(donation);

    return updated;
  }
}

