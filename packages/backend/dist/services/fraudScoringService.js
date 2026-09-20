"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudScoringService = void 0;
const shared_1 = require("@caretrace/shared");
const database_1 = require("../db/database");
class FraudScoringService {
    /**
     * Evaluates a requirement and updates risk audit logs
     */
    static evaluateAndLogRequirement(req, institutionId) {
        const institution = database_1.db.getInstitutionById(institutionId);
        if (!institution) {
            throw new Error(`Institution ${institutionId} not found`);
        }
        const recentReqs = database_1.db.getRequirements().filter(r => r.institutionId === institutionId);
        const result = shared_1.RequirementScorer.evaluateRequirement(req, institution, recentReqs.length);
        // Save risk flags into audit table if any severe flags exist
        for (const flag of result.flags) {
            database_1.db.addRiskAuditLog(flag);
        }
        return result;
    }
    /**
     * Flags delivery discrepancies
     */
    static checkDeliveryAnomaly(donationId, pickupTime, deliveryTime, distanceKm) {
        const flags = shared_1.RequirementScorer.evaluateDeliveryAnomalies(pickupTime, deliveryTime, distanceKm);
        for (const flag of flags) {
            database_1.db.addRiskAuditLog({
                ...flag,
                message: `[Donation ${donationId}] ${flag.message}`
            });
        }
        return flags;
    }
}
exports.FraudScoringService = FraudScoringService;
