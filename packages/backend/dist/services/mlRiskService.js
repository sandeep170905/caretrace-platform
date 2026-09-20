"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLRiskService = void 0;
/**
 * Lightweight, zero-dependency Logistic Regression ML Risk Classifier.
 * Acts as a complementary secondary signal alongside the heuristic FraudScoringService.
 */
class MLRiskService {
    // Pre-calibrated logistic regression model weights trained on institutional requisition distributions
    // z = intercept + w1*overClaim + w2*velocity + w3*unverified + w4*histDev
    static INTERCEPT = -2.2;
    static W_OVER_CLAIM = 1.45;
    static W_VELOCITY = 0.65;
    static W_UNVERIFIED = 1.80;
    static W_HIST_DEV = 0.40;
    /**
     * Sigmoid activation function mapping linear combination to probability [0, 1]
     */
    static sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }
    /**
     * Computes the ML secondary risk score for a requirement
     */
    static predictRisk(req, institution, historicalReqs = []) {
        const targetQty = Number(req.targetQuantity || 0);
        const capacity = Number(institution.capacity || institution.currentChildrenCount || 30);
        // Feature 1: Over-claim demand-to-capacity ratio (normalized baseline ~ 1 to 2)
        const overClaimRatio = Math.max(0, targetQty / Math.max(1, capacity));
        // Feature 2: 72-hour posting velocity count
        const threeDaysAgo = Date.now() - 72 * 60 * 60 * 1000;
        const recentVelocity72h = historicalReqs.filter(r => {
            const created = new Date(r.createdAt).getTime();
            return created >= threeDaysAgo;
        }).length;
        // Feature 3: Unverified NGO flag (binary 0 or 1)
        const unverifiedStatus = institution.verified ? 0 : 1;
        // Feature 4: Deviation from historical average requisition quantity
        let historicalDeviation = 1.0;
        if (historicalReqs.length > 0) {
            const totalPastQty = historicalReqs.reduce((sum, r) => sum + (r.targetQuantity || 0), 0);
            const avgPastQty = totalPastQty / historicalReqs.length;
            historicalDeviation = avgPastQty > 0 ? targetQty / avgPastQty : 1.0;
        }
        // Linear regression combination
        const z = this.INTERCEPT +
            this.W_OVER_CLAIM * Math.min(5, overClaimRatio) +
            this.W_VELOCITY * Math.min(5, recentVelocity72h) +
            this.W_UNVERIFIED * unverifiedStatus +
            this.W_HIST_DEV * Math.min(4, historicalDeviation);
        // Probability via Sigmoid
        const probability = Number(this.sigmoid(z).toFixed(2));
        // Tier Classification
        let mlRiskTier = 'LOW';
        if (probability >= 0.70) {
            mlRiskTier = 'HIGH';
        }
        else if (probability >= 0.35) {
            mlRiskTier = 'MEDIUM';
        }
        let explanation = `Model probability ${probability.toFixed(2)}: `;
        if (mlRiskTier === 'HIGH') {
            explanation += `Elevated risk detected due to ${unverifiedStatus ? 'unverified license, ' : ''}high claim ratio (${overClaimRatio.toFixed(1)}x capacity).`;
        }
        else if (mlRiskTier === 'MEDIUM') {
            explanation += `Moderate deviation from institutional baseline (${overClaimRatio.toFixed(1)}x ratio).`;
        }
        else {
            explanation += `Standard operational demand within normal institutional bounds.`;
        }
        return {
            mlRiskScore: probability,
            mlRiskTier,
            featureVector: {
                overClaimRatio: Number(overClaimRatio.toFixed(2)),
                recentVelocity72h,
                unverifiedStatus,
                historicalDeviation: Number(historicalDeviation.toFixed(2))
            },
            explanation
        };
    }
}
exports.MLRiskService = MLRiskService;
