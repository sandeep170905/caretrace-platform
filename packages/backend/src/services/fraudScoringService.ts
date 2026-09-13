import { Requirement, RiskFlag } from '@caretrace/shared';
import { RequirementScorer, ScoringResult } from '@caretrace/shared';
import { db } from '../db/database';

export class FraudScoringService {
  /**
   * Evaluates a requirement and updates risk audit logs
   */
  public static evaluateAndLogRequirement(
    req: Partial<Requirement>,
    institutionId: string
  ): ScoringResult {
    const institution = db.getInstitutionById(institutionId);
    if (!institution) {
      throw new Error(`Institution ${institutionId} not found`);
    }

    const recentReqs = db.getRequirements().filter(r => r.institutionId === institutionId);
    const result = RequirementScorer.evaluateRequirement(req, institution, recentReqs.length);

    // Save risk flags into audit table if any severe flags exist
    for (const flag of result.flags) {
      db.addRiskAuditLog(flag);
    }

    return result;
  }

  /**
   * Flags delivery discrepancies
   */
  public static checkDeliveryAnomaly(
    donationId: string,
    pickupTime: string,
    deliveryTime: string,
    distanceKm: number
  ): RiskFlag[] {
    const flags = RequirementScorer.evaluateDeliveryAnomalies(pickupTime, deliveryTime, distanceKm);
    for (const flag of flags) {
      db.addRiskAuditLog({
        ...flag,
        message: `[Donation ${donationId}] ${flag.message}`
      });
    }
    return flags;
  }
}

