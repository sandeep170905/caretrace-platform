"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analyticsService_1 = require("./services/analyticsService");
const database_1 = require("./db/database");
/**
 * Unit & Integration Test Suite for CareTrace Pure-TypeScript Analytics & ML Engine
 */
async function runAnalyticsTests() {
    console.log('🧪 Starting CareTrace Analytics & ML Unit Tests...\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, testName, detail) {
        if (condition) {
            console.log(`  ✅ PASS: ${testName}`);
            passed++;
        }
        else {
            console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
            failed++;
        }
    }
    // -------------------------------------------------------------
    // Test 1: Demand Forecasting (Holt's Exponential Smoothing)
    // -------------------------------------------------------------
    console.log('--- Test Suite 1: Demand Forecasting (Double Exponential Smoothing) ---');
    {
        // Test 1.1: Empty series handled gracefully
        const emptyResult = analyticsService_1.AnalyticsService.forecastSeries([], 3);
        assert(emptyResult.forecast.length === 3 &&
            emptyResult.forecast.every(v => v === 0) &&
            !isNaN(emptyResult.forecast[0]), 'Empty series returns zeroes without NaN');
        // Test 1.2: Constant series maintains level
        const constResult = analyticsService_1.AnalyticsService.forecastSeries([10, 10, 10, 10, 10], 3);
        assert(Math.abs(constResult.forecast[0] - 10) < 0.5 &&
            Math.abs(constResult.forecast[2] - 10) < 0.5, 'Constant series retains level (~10)');
        // Test 1.3: Upward trending series projects continued growth
        const trendResult = analyticsService_1.AnalyticsService.forecastSeries([10, 20, 30, 40, 50], 3);
        assert(trendResult.forecast[0] > 50 &&
            trendResult.forecast[1] > trendResult.forecast[0] &&
            trendResult.forecast[2] > trendResult.forecast[1], 'Linear trend series forecasts continued positive slope (> 50)');
        // Test 1.4: Confidence bounds (upper > forecast > lower)
        assert(trendResult.upper[0] > trendResult.forecast[0] &&
            trendResult.lower[0] < trendResult.forecast[0] &&
            trendResult.lower[0] >= 0, 'Confidence bounds satisfy lower < forecast < upper and lower >= 0');
    }
    // -------------------------------------------------------------
    // Test 2: Statistical Anomaly Detection (Z-Score & IQR)
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 2: Statistical Anomaly Detection ---');
    {
        // Initialize DB to test against live/synthetic dataset
        await database_1.db.init();
        const anomalies = analyticsService_1.AnalyticsService.getAnomalyDetection();
        assert(typeof anomalies.anomaliesCount === 'number', 'Anomalies count is a valid number');
        assert(Array.isArray(anomalies.anomalies), 'Anomalies list is an array');
        assert(anomalies.anomalies.every(a => ['VOLUME_SPIKE', 'INSTITUTION_CONCENTRATION', 'QUANTITY_OUTLIER', 'VELOCITY_ALERT'].includes(a.type)), 'All detected anomalies have valid type categories');
        assert(anomalies.anomalies.every(a => !isNaN(a.score) && !isNaN(a.threshold)), 'All anomaly scores and thresholds are non-NaN finite numbers');
    }
    // -------------------------------------------------------------
    // Test 3: K-Means Donor Segmentation (k=4)
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 3: K-Means Donor Segmentation (k=4) ---');
    {
        const segmentation = analyticsService_1.AnalyticsService.getDonorSegmentation();
        assert(segmentation.k === 4, 'k parameter is 4');
        assert(segmentation.segments.length === 4, 'Returns exactly 4 distinct donor segments');
        const segmentNames = segmentation.segments.map(s => s.name);
        assert(segmentNames.includes('Champions') &&
            segmentNames.includes('Regulars') &&
            segmentNames.includes('Occasional') &&
            segmentNames.includes('Lapsed'), 'Segment names correctly mapped to Champions, Regulars, Occasional, Lapsed');
        // Sum of segment percentages should approximate 100%
        const totalPercentage = segmentation.segments.reduce((sum, s) => sum + s.percentage, 0);
        assert(Math.abs(totalPercentage - 100) < 1.0, `Segment percentages sum to ~100% (got ${totalPercentage}%)`);
        // Centroids must all have non-NaN values
        const validCentroids = segmentation.segments.every(s => !isNaN(s.centroid.frequency) &&
            !isNaN(s.centroid.recencyDays) &&
            !isNaN(s.centroid.avgQuantity) &&
            !isNaN(s.centroid.categoryDiversity));
        assert(validCentroids, 'All segment centroid features are non-NaN');
    }
    // -------------------------------------------------------------
    // Test 4: Donor Retention Risk (Calibrated Logistic Model)
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 4: Donor Retention Risk (Logistic Model) ---');
    {
        const retention = analyticsService_1.AnalyticsService.getDonorRetentionRisk();
        assert(Array.isArray(retention.atRiskDonors), 'atRiskDonors is an array');
        if (retention.atRiskDonors.length > 0) {
            const allProbabilitiesValid = retention.atRiskDonors.every(d => d.churnProbability >= 0 && d.churnProbability <= 1 && !isNaN(d.churnProbability));
            assert(allProbabilitiesValid, 'All donor churn probabilities are within [0.0, 1.0]');
            const allLevelsValid = retention.atRiskDonors.every(d => ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(d.riskLevel));
            assert(allLevelsValid, 'All risk levels are mapped to standard enum values');
            const allHaveFactors = retention.atRiskDonors.every(d => Array.isArray(d.contributingFactors) && d.contributingFactors.length > 0);
            assert(allHaveFactors, 'All at-risk donors have explainable contributing factor strings');
        }
    }
    // -------------------------------------------------------------
    // Test 5: Fulfillment Prediction & MAE Validation
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 5: Fulfillment Time Prediction & MAE ---');
    {
        const fulfillment = analyticsService_1.AnalyticsService.getFulfillmentTimePrediction();
        assert(typeof fulfillment.maeDays === 'number' && !isNaN(fulfillment.maeDays), 'MAE days is a valid number');
        assert(fulfillment.maeDays >= 0, `MAE is non-negative (${fulfillment.maeDays} days)`);
        assert(Array.isArray(fulfillment.activePredictions), 'Active predictions is an array');
        if (fulfillment.activePredictions.length > 0) {
            const allPredictionsValid = fulfillment.activePredictions.every(p => p.predictedDaysToFulfil > 0 && !isNaN(p.predictedDaysToFulfil) && Boolean(p.predictedDate));
            assert(allPredictionsValid, 'All active requirement predictions have valid positive days and dates');
        }
    }
    // -------------------------------------------------------------
    // Test 6: Chennai Locality Distribution & Headline KPIs
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 6: Locality Distribution & Headline KPIs ---');
    {
        const headline = analyticsService_1.AnalyticsService.getHeadlineStats();
        assert(headline.totalDonations > 0, `Total donations counted correctly (${headline.totalDonations})`);
        assert(headline.fulfillmentRate >= 0 && headline.fulfillmentRate <= 100, `Fulfillment rate is valid percentage (${headline.fulfillmentRate}%)`);
        assert(headline.totalEstimatedValueInr > 0, `Total estimated value calculated (> 0 INR: ₹${headline.totalEstimatedValueInr.toLocaleString()})`);
        const localities = analyticsService_1.AnalyticsService.getLocalityDistribution();
        assert(Array.isArray(localities) && localities.length > 0, `Returns Chennai localities (count: ${localities.length})`);
        const validCoords = localities.every(l => l.latitude >= 12.0 && l.latitude <= 14.0 && l.longitude >= 79.0 && l.longitude <= 81.0);
        assert(validCoords, 'All locality coordinates are within greater Chennai bounding box');
    }
    // -------------------------------------------------------------
    // Test 7: Comprehensive Insights Aggregation
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 7: Full Comprehensive Insights Suite ---');
    {
        const full = analyticsService_1.AnalyticsService.getComprehensiveInsights();
        assert(Boolean(full.headline), 'Includes headline stats');
        assert(Boolean(full.demandForecast), 'Includes demand forecast');
        assert(Boolean(full.donorSegmentation), 'Includes donor segmentation');
        assert(Boolean(full.retentionRisk), 'Includes retention risk');
        assert(Boolean(full.fulfillmentPrediction), 'Includes fulfillment prediction');
        assert(Boolean(full.anomalyDetection), 'Includes anomaly detection');
        assert(Boolean(full.localityDistribution), 'Includes locality distribution');
        assert(Boolean(full.metadata.disclaimer), 'Includes model disclaimer and metadata');
    }
    console.log(`\n==================================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`==================================================\n`);
    if (failed > 0) {
        process.exit(1);
    }
}
runAnalyticsTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
