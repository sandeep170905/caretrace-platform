"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const analyticsService_1 = require("../services/analyticsService");
const authService_1 = require("../services/authService");
exports.analyticsRouter = (0, express_1.Router)();
// Middleware: Require Admin or Institution role
function requireAnalyticsAccess(req, res, next) {
    const user = req.user;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTITUTION')) {
        return res.status(403).json({
            success: false,
            error: 'Access restricted to administrators and registered institutions'
        });
    }
    next();
}
// Middleware: Require Admin role only (for sensitive donor ML insights & platform anomalies)
function requireAdminOnly(req, res, next) {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Access restricted to platform administrators'
        });
    }
    next();
}
/**
 * Helper to resolve institution scope based on user role and query
 */
function resolveInstitutionScope(req) {
    const user = req.user;
    if (user?.role === 'INSTITUTION') {
        return user.institutionId || req.query.institutionId || undefined;
    }
    return req.query.institutionId || undefined;
}
// -------------------------------------------------------------
// Public Endpoints (No Auth Required)
// -------------------------------------------------------------
/**
 * GET /api/analytics/summary
 * Public aggregate summary: headline metrics, locality distribution, category breakdown.
 * Strips all personal donor identities and individual risk flags.
 */
exports.analyticsRouter.get('/summary', (req, res) => {
    try {
        const headline = analyticsService_1.AnalyticsService.getHeadlineStats();
        const localityDistribution = analyticsService_1.AnalyticsService.getLocalityDistribution();
        const demandForecast = analyticsService_1.AnalyticsService.getDemandForecast();
        // High-level category breakdown from historical demand
        const categoryTotals = {};
        for (const [cat, data] of Object.entries(demandForecast.byCategory)) {
            categoryTotals[cat] = data.historical.reduce((sum, pt) => sum + pt.volume, 0);
        }
        res.json({
            success: true,
            headline,
            localityDistribution,
            categoryDistribution: categoryTotals,
            generatedAt: new Date().toISOString()
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute public summary' });
    }
});
// -------------------------------------------------------------
// Authenticated Endpoints (Admin & Institution Scoped)
// -------------------------------------------------------------
/**
 * GET /api/analytics/insights
 * Full comprehensive ML and statistical analytics suite
 */
exports.analyticsRouter.get('/insights', authService_1.authenticateToken, requireAnalyticsAccess, (req, res) => {
    try {
        const institutionId = resolveInstitutionScope(req);
        const insights = analyticsService_1.AnalyticsService.getComprehensiveInsights(institutionId);
        res.json({
            success: true,
            insights
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute comprehensive insights' });
    }
});
/**
 * GET /api/analytics/headline
 * Key platform KPIs (total donations, active donors, fulfillment rate, delivery hours, etc.)
 */
exports.analyticsRouter.get('/headline', authService_1.authenticateToken, requireAnalyticsAccess, (req, res) => {
    try {
        const institutionId = resolveInstitutionScope(req);
        const stats = analyticsService_1.AnalyticsService.getHeadlineStats(institutionId);
        res.json({ success: true, stats });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute headline stats' });
    }
});
/**
 * GET /api/analytics/demand-forecast
 * Double Exponential Smoothing (Holt's model) demand projections
 */
exports.analyticsRouter.get('/demand-forecast', authService_1.authenticateToken, requireAnalyticsAccess, (req, res) => {
    try {
        const institutionId = resolveInstitutionScope(req);
        const forecast = analyticsService_1.AnalyticsService.getDemandForecast(institutionId);
        res.json({ success: true, forecast });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute demand forecast' });
    }
});
/**
 * GET /api/analytics/donor-segments
 * K-Means clustering (k=4) of donor behavior (Recency, Frequency, Value, Diversity)
 */
exports.analyticsRouter.get('/donor-segments', authService_1.authenticateToken, requireAdminOnly, (req, res) => {
    try {
        const segmentation = analyticsService_1.AnalyticsService.getDonorSegmentation();
        res.json({ success: true, segmentation });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute donor segments' });
    }
});
/**
 * GET /api/analytics/retention-risk
 * Calibrated logistic regression donor retention risk scoring with explainability
 */
exports.analyticsRouter.get('/retention-risk', authService_1.authenticateToken, requireAdminOnly, (req, res) => {
    try {
        const retentionRisk = analyticsService_1.AnalyticsService.getDonorRetentionRisk();
        res.json({ success: true, retentionRisk });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute donor retention risk' });
    }
});
/**
 * GET /api/analytics/fulfillment-prediction
 * Multivariable regression for requirement fulfillment duration with MAE validation
 */
exports.analyticsRouter.get('/fulfillment-prediction', authService_1.authenticateToken, requireAnalyticsAccess, (req, res) => {
    try {
        const prediction = analyticsService_1.AnalyticsService.getFulfillmentTimePrediction();
        res.json({ success: true, prediction });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute fulfillment predictions' });
    }
});
/**
 * GET /api/analytics/anomalies
 * Statistical anomaly detection (Z-score volume spikes, IQR quantity outliers, risk logs)
 */
exports.analyticsRouter.get('/anomalies', authService_1.authenticateToken, requireAdminOnly, (req, res) => {
    try {
        const anomalies = analyticsService_1.AnalyticsService.getAnomalyDetection();
        res.json({ success: true, anomalies });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to detect anomalies' });
    }
});
/**
 * GET /api/analytics/locality-distribution
 * Chennai geographic distribution of institutions, donation volume, and open needs
 */
exports.analyticsRouter.get('/locality-distribution', authService_1.authenticateToken, requireAnalyticsAccess, (req, res) => {
    try {
        const distribution = analyticsService_1.AnalyticsService.getLocalityDistribution();
        res.json({ success: true, distribution });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to compute locality distribution' });
    }
});
