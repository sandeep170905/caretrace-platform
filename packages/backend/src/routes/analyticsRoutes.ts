import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { authenticateToken } from '../services/authService';

export const analyticsRouter = Router();

// Middleware: Require Admin or Institution role
function requireAnalyticsAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTITUTION')) {
    return res.status(403).json({
      success: false,
      error: 'Access restricted to administrators and registered institutions'
    });
  }
  next();
}

// Middleware: Require Admin role only (for sensitive donor ML insights & platform anomalies)
function requireAdminOnly(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
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
function resolveInstitutionScope(req: Request): string | undefined {
  const user = (req as any).user;
  if (user?.role === 'INSTITUTION') {
    return user.institutionId || (req.query.institutionId as string) || undefined;
  }
  return (req.query.institutionId as string) || undefined;
}

// -------------------------------------------------------------
// Public Endpoints (No Auth Required)
// -------------------------------------------------------------

/**
 * GET /api/analytics/summary
 * Public aggregate summary: headline metrics, locality distribution, category breakdown.
 * Strips all personal donor identities and individual risk flags.
 */
analyticsRouter.get('/summary', (req: Request, res: Response) => {
  try {
    const headline = AnalyticsService.getHeadlineStats();
    const localityDistribution = AnalyticsService.getLocalityDistribution();
    const demandForecast = AnalyticsService.getDemandForecast();

    // High-level category breakdown from historical demand
    const categoryTotals: Record<string, number> = {};
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
  } catch (err: any) {
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
analyticsRouter.get('/insights', authenticateToken, requireAnalyticsAccess, (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionScope(req);
    const insights = AnalyticsService.getComprehensiveInsights(institutionId);
    res.json({
      success: true,
      insights
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to compute comprehensive insights' });
  }
});

/**
 * GET /api/analytics/headline
 * Key platform KPIs (total donations, active donors, fulfillment rate, delivery hours, etc.)
 */
analyticsRouter.get('/headline', authenticateToken, requireAnalyticsAccess, (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionScope(req);
    const stats = AnalyticsService.getHeadlineStats(institutionId);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to compute headline stats' });
  }
});

/**
 * GET /api/analytics/demand-forecast
 * Double Exponential Smoothing (Holt's model) demand projections
 */
analyticsRouter.get('/demand-forecast', authenticateToken, requireAnalyticsAccess, (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionScope(req);
    const forecast = AnalyticsService.getDemandForecast(institutionId);
    res.json({ success: true, forecast });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to compute demand forecast' });
  }
});

/**
 * GET /api/analytics/donor-segments
 * K-Means clustering (k=4) of donor behavior (Recency, Frequency, Value, Diversity)
 */
analyticsRouter.get('/donor-segments', authenticateToken, requireAdminOnly, (req: Request, res: Response) => {
  try {
    const segmentation = AnalyticsService.getDonorSegmentation();
    res.json({ success: true, segmentation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to compute donor segments' });
  }
});

/**
 * GET /api/analytics/retention-risk
 * Calibrated logistic regression donor retention risk scoring with explainability
 */
analyticsRouter.get('/retention-risk', authenticateToken, requireAdminOnly, (req: Request, res: Response) => {
  try {
    const retentionRisk = AnalyticsService.getDonorRetentionRisk();
    res.json({ success: true, retentionRisk });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to compute donor retention risk' });
  }
});

/**
 * GET /api/analytics/fulfillment-prediction
 * Multivariable regression for requirement fulfillment duration with MAE validation
 */
analyticsRouter.get('/fulfillment-prediction', authenticateToken, requireAnalyticsAccess, (req: Request, res: Response) => {
  try {
    const prediction = AnalyticsService.getFulfillmentTimePrediction();
    res.json({ success: true, prediction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to compute fulfillment predictions' });
  }
});

/**
 * GET /api/analytics/anomalies
 * Statistical anomaly detection (Z-score volume spikes, IQR quantity outliers, risk logs)
 */
analyticsRouter.get('/anomalies', authenticateToken, requireAdminOnly, (req: Request, res: Response) => {
  try {
    const anomalies = AnalyticsService.getAnomalyDetection();
    res.json({ success: true, anomalies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to detect anomalies' });
  }
});

/**
 * GET /api/analytics/locality-distribution
 * Chennai geographic distribution of institutions, donation volume, and open needs
 */
analyticsRouter.get('/locality-distribution', authenticateToken, requireAnalyticsAccess, (req: Request, res: Response) => {
  try {
    const distribution = AnalyticsService.getLocalityDistribution();
    res.json({ success: true, distribution });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to compute locality distribution' });
  }
});
