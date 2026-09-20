"use strict";
/**
 * CareTrace Rule-Based Scoring & Fraud Detection Engine Rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementScorer = void 0;
class RequirementScorer {
    /**
     * Evaluates an institution's posted requirement against risk heuristics
     */
    static evaluateRequirement(req, institution, recentRequirementsCount = 0) {
        let score = 100;
        const flags = [];
        const breakdown = [];
        const now = new Date().toISOString();
        // 1. Institution Verification Status Check
        if (!institution.verified) {
            const deduction = 40;
            score -= deduction;
            flags.push({
                ruleId: 'RULE-INST-UNVERIFIED',
                ruleName: 'Unverified Institution',
                severity: 'HIGH',
                message: `Institution "${institution.name}" has not completed mandatory legal identity verification.`,
                triggeredAt: now,
            });
            breakdown.push({
                ruleId: 'RULE-INST-UNVERIFIED',
                ruleName: 'Unverified Institution',
                deduction,
                explanation: 'Deducted 40 pts: Operating under provisional status without verified NGO registration.',
            });
        }
        // 2. Capacity-to-Demand Ratio Check
        // E.g., if institution has 40 children, requesting 600 coats or 1000 blankets triggers a capacity mismatch
        const targetQty = req.targetQuantity || 0;
        const capacity = institution.capacity || institution.currentChildrenCount || 30;
        const itemPerChildRatio = targetQty / capacity;
        if ((req.category === 'CLOTHING' || req.category === 'FOOD') && itemPerChildRatio > 4) {
            const deduction = 25;
            score -= deduction;
            const categoryLabel = req.category === 'FOOD' ? 'Food & Groceries' : 'Clothing & Bedding';
            flags.push({
                ruleId: req.category === 'FOOD' ? 'RULE-CAPACITY-EXCESS-FOOD' : 'RULE-CAPACITY-EXCESS-CLOTHING',
                ruleName: `Capacity Over-Claim (${categoryLabel})`,
                severity: 'MEDIUM',
                message: `Requested ${targetQty} units for ${capacity} registered children (${itemPerChildRatio.toFixed(1)} per child), exceeding 4x quota.`,
                triggeredAt: now,
            });
            breakdown.push({
                ruleId: req.category === 'FOOD' ? 'RULE-CAPACITY-EXCESS-FOOD' : 'RULE-CAPACITY-EXCESS-CLOTHING',
                ruleName: 'Capacity Over-Claim',
                deduction,
                explanation: `Deducted 25 pts: Demand ratio (${itemPerChildRatio.toFixed(1)}/child) exceeds normal threshold.`,
            });
        }
        else if (req.category === 'MEDICINE' && itemPerChildRatio > 10) {
            const deduction = 30;
            score -= deduction;
            flags.push({
                ruleId: 'RULE-CAPACITY-EXCESS-MEDICINE',
                ruleName: 'High Volume Medicine Requisition',
                severity: 'HIGH',
                message: `Medication request volume (${targetQty} units) exceeds monthly institutional allocation.`,
                triggeredAt: now,
            });
            breakdown.push({
                ruleId: 'RULE-CAPACITY-EXCESS-MEDICINE',
                ruleName: 'Medication Bulk Alert',
                deduction,
                explanation: 'Deducted 30 pts: Bulk pharmaceutical requisition requires medical director endorsement.',
            });
        }
        // 3. Medicine Documentation Compliance
        if (req.category === 'MEDICINE') {
            const hasDocs = req.documents && req.documents.length > 0;
            if (!hasDocs) {
                const deduction = 25;
                score -= deduction;
                flags.push({
                    ruleId: 'RULE-MEDICINE-NO-DOCS',
                    ruleName: 'Missing Prescription / Health Authorization',
                    severity: 'HIGH',
                    message: 'Medical requirement posted without accompanying pediatrician/clinic authorization manifest.',
                    triggeredAt: now,
                });
                breakdown.push({
                    ruleId: 'RULE-MEDICINE-NO-DOCS',
                    ruleName: 'Missing Medical Documentation',
                    deduction,
                    explanation: 'Deducted 25 pts: Prescription/regulatory documentation not attached.',
                });
            }
        }
        // 4. Posting Velocity / Surge Check
        if (recentRequirementsCount >= 3) {
            const deduction = 15;
            score -= deduction;
            flags.push({
                ruleId: 'RULE-VELOCITY-SURGE',
                ruleName: 'Posting Velocity Spike',
                severity: 'MEDIUM',
                message: `Institution created ${recentRequirementsCount} active requirements within 72 hours.`,
                triggeredAt: now,
            });
            breakdown.push({
                ruleId: 'RULE-VELOCITY-SURGE',
                ruleName: 'Velocity Spike',
                deduction,
                explanation: 'Deducted 15 pts: Rapid requirement creations flag possible duplicate or account compromise.',
            });
        }
        // 5. Institution Historical Trust Rating
        if (institution.trustScore < 60) {
            const deduction = 20;
            score -= deduction;
            flags.push({
                ruleId: 'RULE-LOW-TRUST-SCORE',
                ruleName: 'Historical Low Trust Rating',
                severity: 'MEDIUM',
                message: `Institution historical reliability rating is below baseline (${institution.trustScore}%).`,
                triggeredAt: now,
            });
            breakdown.push({
                ruleId: 'RULE-LOW-TRUST-SCORE',
                ruleName: 'Low Trust Score',
                deduction,
                explanation: `Deducted 20 pts: Trust score (${institution.trustScore}%) below minimum safety rating.`,
            });
        }
        // Clamp score between 0 and 100
        const finalScore = Math.max(0, Math.min(100, score));
        let riskLevel = 'LOW';
        if (finalScore < 40)
            riskLevel = 'CRITICAL';
        else if (finalScore < 60)
            riskLevel = 'HIGH';
        else if (finalScore < 75)
            riskLevel = 'MEDIUM';
        return {
            score: finalScore,
            isApproved: finalScore >= 70,
            riskLevel,
            flags,
            breakdown,
        };
    }
    /**
     * Evaluates pickup and delivery scans for physical anomalies
     */
    static evaluateDeliveryAnomalies(pickupTime, deliveryTime, distanceKm) {
        const flags = [];
        const pTime = new Date(pickupTime).getTime();
        const dTime = new Date(deliveryTime).getTime();
        const elapsedMinutes = (dTime - pTime) / (1000 * 60);
        // If transit time is less than 2 minutes for distances > 1 km
        if (distanceKm > 1 && elapsedMinutes < 2) {
            flags.push({
                ruleId: 'RULE-IMPOSSIBLE-TRANSIT-TIME',
                ruleName: 'Impossible Transit Velocity',
                severity: 'HIGH',
                message: `Delivery scan registered ${elapsedMinutes.toFixed(1)} mins after pickup for a ${distanceKm.toFixed(1)} km transit route.`,
                triggeredAt: new Date().toISOString(),
            });
        }
        return flags;
    }
}
exports.RequirementScorer = RequirementScorer;
//# sourceMappingURL=scoringRules.js.map