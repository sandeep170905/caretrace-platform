/**
 * CareTrace Rule-Based Scoring & Fraud Detection Engine Rules
 */
import { Institution, Requirement, RiskFlag, RiskSeverity } from '../types';
export interface ScoringResult {
    score: number;
    isApproved: boolean;
    riskLevel: RiskSeverity;
    flags: RiskFlag[];
    breakdown: {
        ruleId: string;
        ruleName: string;
        deduction: number;
        explanation: string;
    }[];
}
export declare class RequirementScorer {
    /**
     * Evaluates an institution's posted requirement against risk heuristics
     */
    static evaluateRequirement(req: Partial<Requirement>, institution: Institution, recentRequirementsCount?: number): ScoringResult;
    /**
     * Evaluates pickup and delivery scans for physical anomalies
     */
    static evaluateDeliveryAnomalies(pickupTime: string, deliveryTime: string, distanceKm: number): RiskFlag[];
}
//# sourceMappingURL=scoringRules.d.ts.map