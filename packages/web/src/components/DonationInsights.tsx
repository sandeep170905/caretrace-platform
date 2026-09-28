import React, { useState, useEffect, useMemo } from 'react';
import {
  ComprehensiveInsights,
  Institution,
  RequirementCategory,
  DonorSegment,
  AtRiskDonor,
  FulfillmentPredictionItem,
  AnomalyItem,
  LocalityDistributionItem,
  MonthlyDataPoint
} from '@caretrace/shared';
import {
  fetchAnalyticsInsights,
  fetchInstitutions
} from '../api/client';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  ShieldAlert,
  MapPin,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Info
} from 'lucide-react';

interface DonationInsightsProps {
  institutionId?: string;
  isSuperAdmin?: boolean;
}

export const DonationInsights: React.FC<DonationInsightsProps> = ({
  institutionId: initialInstitutionId,
  isSuperAdmin = true
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string | undefined>(initialInstitutionId);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [insights, setInsights] = useState<ComprehensiveInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<RequirementCategory | 'ALL'>('ALL');
  const [activeDonorSegmentFilter, setActiveDonorSegmentFilter] = useState<string>('ALL');
  const [donorSearchTerm, setDonorSearchTerm] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<MonthlyDataPoint | null>(null);

  // Load Institutions for the filter dropdown
  useEffect(() => {
    if (isSuperAdmin) {
      fetchInstitutions().then(insts => setInstitutions(insts)).catch(console.error);
    }
  }, [isSuperAdmin]);

  // Load Insights Data
  const loadInsights = async (instId?: string, isRefresh: boolean = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchAnalyticsInsights(instId);
      setInsights(data);
    } catch (err: any) {
      console.error('Failed to load donation insights:', err);
      setError(err.message || 'Failed to compute predictive analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInsights(selectedInstId);
  }, [selectedInstId]);

  // Determine series for the Demand Forecast Chart
  const forecastSeries = useMemo(() => {
    if (!insights?.demandForecast) return { historical: [], forecast: [] };
    if (selectedCategory === 'ALL') {
      return insights.demandForecast.overall;
    }
    const catData = insights.demandForecast.byCategory[selectedCategory];
    return catData || { historical: [], forecast: [] };
  }, [insights, selectedCategory]);

  // Filtered Donors for the Segmentation explorer
  const filteredDonors = useMemo(() => {
    if (!insights?.donorSegmentation?.donorAssignments) return [];
    return insights.donorSegmentation.donorAssignments.filter(donor => {
      const matchesSegment = activeDonorSegmentFilter === 'ALL' || donor.segmentId === activeDonorSegmentFilter;
      const matchesSearch = donor.donorName.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
                            donor.email.toLowerCase().includes(donorSearchTerm.toLowerCase());
      return matchesSegment && matchesSearch;
    });
  }, [insights, activeDonorSegmentFilter, donorSearchTerm]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold tracking-wide text-slate-200">Executing CareTrace TS-ML Engine...</p>
          <p className="text-xs text-slate-400 mt-1">Fitting Holt&apos;s models, converging K-Means centroids, and calculating loss</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-3 text-rose-400 mb-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="font-semibold text-base">Analytics Engine Computation Notice</h3>
        </div>
        <p className="text-xs text-slate-300 mb-4">{error || 'Unable to retrieve analytics at this moment.'}</p>
        <button
          onClick={() => loadInsights(selectedInstId)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-sm text-xs font-semibold inline-flex items-center space-x-2 border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Execution</span>
        </button>
      </div>
    );
  }

  const {
    headline,
    demandForecast,
    donorSegmentation,
    retentionRisk,
    fulfillmentPrediction,
    anomalyDetection,
    localityDistribution,
    metadata
  } = insights;

  // Chart coordinate calculations
  const combinedPoints: MonthlyDataPoint[] = [...forecastSeries.historical, ...forecastSeries.forecast];
  const maxVolume = Math.max(
    ...combinedPoints.map(p => Math.max(p.volume, p.forecastUpper || 0, 1)),
    10
  );
  const chartHeight = 220;
  const chartWidth = 760;
  const paddingX = 40;
  const paddingY = 24;

  const getX = (index: number) => {
    if (combinedPoints.length <= 1) return paddingX;
    return paddingX + (index / (combinedPoints.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const usableH = chartHeight - paddingY * 2;
    return chartHeight - paddingY - (val / maxVolume) * usableH;
  };

  // Build SVG path for Historical
  const historicalPath = forecastSeries.historical.length > 0
    ? forecastSeries.historical.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.volume)}`).join(' ')
    : '';

  // Build SVG path for Forecast
  const forecastPath = forecastSeries.forecast.length > 0 && forecastSeries.historical.length > 0
    ? `M ${getX(forecastSeries.historical.length - 1)} ${getY(forecastSeries.historical[forecastSeries.historical.length - 1].volume)} ` +
      forecastSeries.forecast.map((p, idx) => `L ${getX(forecastSeries.historical.length + idx)} ${getY(p.volume)}`).join(' ')
    : '';

  // Build Confidence Interval Area Path
  let confidenceAreaPath = '';
  if (forecastSeries.forecast.length > 0 && forecastSeries.historical.length > 0) {
    const histLastIdx = forecastSeries.historical.length - 1;
    const histLastVol = forecastSeries.historical[histLastIdx].volume;
    const upperPoints: string[] = [`M ${getX(histLastIdx)} ${getY(histLastVol)}`];
    forecastSeries.forecast.forEach((p, idx) => {
      upperPoints.push(`L ${getX(forecastSeries.historical.length + idx)} ${getY(p.forecastUpper || p.volume)}`);
    });

    const lowerPoints: string[] = [];
    for (let idx = forecastSeries.forecast.length - 1; idx >= 0; idx--) {
      const p = forecastSeries.forecast[idx];
      lowerPoints.push(`L ${getX(forecastSeries.historical.length + idx)} ${getY(p.forecastLower || 0)}`);
    }
    lowerPoints.push(`L ${getX(histLastIdx)} ${getY(histLastVol)}`);
    confidenceAreaPath = `${upperPoints.join(' ')} ${lowerPoints.join(' ')} Z`;
  }

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-sm bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>CARETRACE TS-ML ENGINE ACTIVE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Predictive Donation Insights</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Deterministic statistical models running client/server pure TypeScript: Holt linear exponential smoothing, 
              quantized K-Means ($k=4$), calibrated churn risk, and MAE-validated fulfillment projection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Institution Scope Filter (Admins) */}
            {isSuperAdmin && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Scope:</span>
                <select
                  value={selectedInstId || ''}
                  onChange={(e) => setSelectedInstId(e.target.value || undefined)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-sm px-3 py-1.5 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Platform Wide (All 15 Sanctuaries)</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => loadInsights(selectedInstId, true)}
              disabled={refreshing}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-sm text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Models</span>
            </button>
          </div>
        </div>

        {/* Algorithm Metadata & Sample Size Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
          <div className="flex items-center space-x-4">
            <span>Donations Mined: <strong className="text-slate-200">{metadata.datasetSize.donations}</strong></span>
            <span>Needs Tracked: <strong className="text-slate-200">{metadata.datasetSize.requirements}</strong></span>
            <span>Donors Segmented: <strong className="text-slate-200">{metadata.datasetSize.donors}</strong></span>
            <span>Accredited Hubs: <strong className="text-slate-200">{metadata.datasetSize.institutions}</strong></span>
          </div>
          <div className="text-slate-400">
            Last Fitted: {new Date(metadata.generatedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* SECTION 1: Headline Executive KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Consignments</span>
            <BarChart3 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{headline.totalDonations}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {headline.fulfilledRequirements} requirements fulfilled
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active Donors</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{headline.activeDonors}</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Active in last 90 days
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Fulfillment Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700">{headline.fulfillmentRate}%</p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Pledged vs Verified Delivery
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Mean Transit Time</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{headline.avgDeliveryTimeHours}h</p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Courier pickup to sanctuary
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Cumulative Valuation</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-900">
            ₹{headline.totalEstimatedValueInr.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Supplies & Direct Support
          </span>
        </div>
      </div>

      {/* SECTION 2: Demand Forecasting (Holt's Double Exponential Smoothing) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-mono mb-1">
              <TrendingUp className="w-3 h-3 text-teal-600" />
              <span>MODEL 1: HOLT&apos;S LINEAR TREND MODEL (&alpha;=0.4, &beta;=0.3)</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Supply-Demand Projection & Forecast Envelope</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks 9 months historical donation patterns and projects the next 3 months with 90% confidence boundaries.
            </p>
          </div>

          {/* Category Selector Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'FOOD', 'MEDICINE', 'EDUCATION', 'CLOTHING', 'SUPPLIES'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Supplies' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Forecast Chart Container */}
        <div className="relative bg-slate-950 rounded-2xl p-4 text-white overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-2 font-mono">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-teal-400 inline-block rounded-sm" />
                <span className="text-slate-300">Historical Volume</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-teal-400 border-b border-dashed inline-block" />
                <span className="text-teal-300">Projected Demand</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-2 bg-teal-500/20 border border-teal-500/40 inline-block rounded-sm" />
                <span className="text-slate-400">90% Confidence Interval</span>
              </span>
            </div>
            {hoveredPoint && (
              <div className="text-teal-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded-sm border border-slate-700">
                {hoveredPoint.label}: <strong>{hoveredPoint.volume} units</strong> 
                {hoveredPoint.isForecast && ` (CI: ${hoveredPoint.forecastLower} - ${hoveredPoint.forecastUpper})`}
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[640px]"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="forecastEnvelopeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                const val = Math.round(ratio * maxVolume);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="rgba(255, 255, 255, 0.35)"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Confidence Interval Area */}
              {confidenceAreaPath && (
                <path
                  d={confidenceAreaPath}
                  fill="url(#forecastEnvelopeGrad)"
                  stroke="rgba(13, 148, 136, 0.4)"
                  strokeDasharray="2 2"
                />
              )}

              {/* Historical Path */}
              {historicalPath && (
                <path
                  d={historicalPath}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Forecast Path */}
              {forecastPath && (
                <path
                  d={forecastPath}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />
              )}

              {/* Historical Data Points */}
              {forecastSeries.historical.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(p.volume);
                return (
                  <g
                    key={`hist-${idx}`}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle cx={cx} cy={cy} r="4" fill="#0d9488" stroke="#0f172a" strokeWidth="2" />
                    <text
                      x={cx}
                      y={chartHeight - 8}
                      fill="rgba(255, 255, 255, 0.5)"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {p.label.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Forecast Data Points */}
              {forecastSeries.forecast.map((p, idx) => {
                const cx = getX(forecastSeries.historical.length + idx);
                const cy = getY(p.volume);
                return (
                  <g
                    key={`fore-${idx}`}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle cx={cx} cy={cy} r="4.5" fill="#2dd4bf" stroke="#0f172a" strokeWidth="2" />
                    <text
                      x={cx}
                      y={chartHeight - 8}
                      fill="#2dd4bf"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {p.label.split(' ')[0]}*
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Forecast Period: Oct 2026 – Dec 2026</span>
            <span>{demandForecast.methodology}</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: K-Means Donor Segmentation (k=4) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-mono mb-1">
              <Users className="w-3 h-3 text-blue-600" />
              <span>MODEL 2: DETERMINISTIC K-MEANS CLUSTERING (k=4)</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Donor Behavioral Segmentation & Centroid Profiling</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quantized RFM-D clustering (Recency, Frequency, Average Quantity, Category Diversity) across {donorSegmentation.sampleSize} donors.
            </p>
          </div>

          {/* Segment Filter Selection */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500">Filter:</span>
            <button
              onClick={() => setActiveDonorSegmentFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                activeDonorSegmentFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Donors ({donorSegmentation.sampleSize})
            </button>
            {donorSegmentation.segments.map(seg => (
              <button
                key={seg.id}
                onClick={() => setActiveDonorSegmentFilter(seg.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                  activeDonorSegmentFilter === seg.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {seg.name} ({seg.size})
              </button>
            ))}
          </div>
        </div>

        {/* Proportional Segment Bar */}
        <div className="space-y-1.5">
          <div className="h-4 rounded-sm overflow-hidden flex bg-slate-100 border border-slate-200">
            {donorSegmentation.segments.map(seg => (
              <div
                key={seg.id}
                style={{ width: `${seg.percentage}%`, backgroundColor: seg.color }}
                title={`${seg.name}: ${seg.size} donors (${seg.percentage}%)`}
                className="h-full transition-all cursor-pointer hover:opacity-90"
                onClick={() => setActiveDonorSegmentFilter(seg.id)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
            {donorSegmentation.segments.map(seg => (
              <span key={seg.id} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: seg.color }} />
                <span>{seg.name}: <strong>{seg.size} ({seg.percentage}%)</strong></span>
              </span>
            ))}
          </div>
        </div>

        {/* 4 Segment Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {donorSegmentation.segments.map(seg => (
            <div
              key={seg.id}
              className={`border rounded-2xl p-4 transition-all ${
                activeDonorSegmentFilter === seg.id
                  ? 'ring-2 ring-slate-900 border-transparent bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                  <h4 className="font-bold text-sm text-slate-900">{seg.name}</h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                  {seg.size} donors
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mb-3 min-h-[32px] leading-tight">
                {seg.description}
              </p>

              {/* Centroid Metrics */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Frequency:</span>
                  <span className="font-bold text-slate-900">{seg.centroid.frequency} consignments</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Recency:</span>
                  <span className="font-bold text-slate-900">{seg.centroid.recencyDays}d ago</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Avg Volume:</span>
                  <span className="font-bold text-slate-900">{seg.centroid.avgQuantity} units</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Category Diversity:</span>
                  <span className="font-bold text-slate-900">{seg.centroid.categoryDiversity} / 5</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtered Donors Table Preview */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assigned Donors Explorer ({filteredDonors.length} matching)
            </span>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search donor name or email..."
                value={donorSearchTerm}
                onChange={(e) => setDonorSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-sm focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Donor Name</th>
                    <th className="py-2.5 px-3">Segment</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Recency</th>
                    <th className="py-2.5 px-3">Avg Quantity</th>
                    <th className="py-2.5 px-3">Category Diversity</th>
                    <th className="py-2.5 px-3 text-right">Value (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonors.slice(0, 15).map(d => (
                    <tr key={d.donorId} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-900 block">{d.donorName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{d.email}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {d.segmentName}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">{d.metrics.frequency}x</td>
                      <td className="py-2 px-3 font-mono">{d.metrics.recencyDays}d ago</td>
                      <td className="py-2 px-3 font-mono">{d.metrics.avgQuantity} units</td>
                      <td className="py-2 px-3 font-mono">{d.metrics.categoryDiversity} / 5</td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-slate-900">
                        ₹{d.metrics.totalValueInr.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {filteredDonors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                        No donors matched the current segment or search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Donor Retention Risk & Churn Model */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-mono mb-1">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>MODEL 3: CALIBRATED LOGISTIC REGRESSION CHURN RISK</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Donor Retention Risk & Early Churn Warning</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculates donor churn probability ($0.00 - 1.00$) with human-explainable behavioral risk factors.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-sm bg-rose-100 text-rose-800 font-bold">
              Critical: {retentionRisk.overallRiskSummary.criticalCount}
            </span>
            <span className="px-2.5 py-1 rounded-sm bg-amber-100 text-amber-800 font-bold">
              High: {retentionRisk.overallRiskSummary.highCount}
            </span>
            <span className="px-2.5 py-1 rounded-sm bg-blue-100 text-blue-800 font-bold">
              Medium: {retentionRisk.overallRiskSummary.mediumCount}
            </span>
            <span className="px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-800 font-bold">
              Low: {retentionRisk.overallRiskSummary.lowCount}
            </span>
          </div>
        </div>

        {/* Explainability Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {retentionRisk.atRiskDonors.slice(0, 6).map(donor => {
            const riskColor = donor.riskLevel === 'CRITICAL'
              ? 'border-rose-300 bg-rose-50/40 text-rose-950'
              : donor.riskLevel === 'HIGH'
              ? 'border-amber-300 bg-amber-50/40 text-amber-950'
              : 'border-slate-200 bg-white text-slate-900';

            const badgeColor = donor.riskLevel === 'CRITICAL'
              ? 'bg-rose-600 text-white'
              : donor.riskLevel === 'HIGH'
              ? 'bg-amber-600 text-white'
              : 'bg-blue-600 text-white';

            return (
              <div key={donor.donorId} className={`border rounded-2xl p-4 shadow-sm space-y-3 ${riskColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{donor.donorName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block">{donor.email}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${badgeColor}`}>
                    {donor.riskLevel} ({Math.round(donor.churnProbability * 100)}%)
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-600">
                    <span>Recency:</span>
                    <strong>{donor.recencyDays} days inactive</strong>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-600">
                    <span>Pledged Count:</span>
                    <strong>{donor.donationCount} consignment(s)</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Contributing Factors:
                  </span>
                  {donor.contributingFactors.map((factor, fIdx) => (
                    <div key={fIdx} className="flex items-start space-x-1.5 text-[11px] text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5 & 6: Fulfillment Time Prediction & Anomaly Detection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 5: Fulfillment Time Prediction */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-mono mb-1">
                <Clock className="w-3 h-3 text-purple-600" />
                <span>MODEL 4: MULTIVARIABLE FULFILLMENT REGRESSION</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Need Fulfillment Duration Forecast</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono block">Model Precision</span>
              <span className="px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                MAE: {fulfillmentPrediction.maeDays}d
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Predicts days required to reach 100% pledge fulfillment based on urgency multiplier and category demand velocity.
          </p>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Requirement Title</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Est. Days</th>
                    <th className="py-2 px-3 text-right">Target Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {fulfillmentPrediction.activePredictions.slice(0, 6).map(pred => (
                    <tr key={pred.requirementId} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans font-medium text-slate-900 max-w-[160px] truncate" title={pred.title}>
                        {pred.title}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-slate-100 text-slate-700">
                          {pred.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-purple-900">
                        {pred.predictedDaysToFulfil}d
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {pred.predictedDate}
                      </td>
                    </tr>
                  ))}
                  {fulfillmentPrediction.activePredictions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-slate-400">
                        All open requirements have been fully fulfilled!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 6: Statistical Anomaly Detection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>MODEL 5: Z-SCORE &amp; IQR STATISTICAL ANOMALIES</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Automated Influx & Outlier Detection</h3>
            </div>
            <span className="px-2 py-0.5 rounded-sm bg-amber-100 text-amber-900 text-xs font-bold font-mono">
              {anomalyDetection.anomaliesCount} Flagged
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Monitors Z-Score rate-of-donation spikes (Z &ge; 2.8) and consignment quantities exceeding 2.5x IQR.
          </p>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {anomalyDetection.anomalies.map(anom => {
              const badgeStyle = anom.severity === 'CRITICAL'
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-amber-100 text-amber-800 border-amber-200';

              return (
                <div key={anom.id} className="p-3 border border-slate-200 rounded-2xl bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{anom.title}</span>
                    <span className={`px-2 py-0.2 rounded-sm text-[10px] font-bold border ${badgeStyle}`}>
                      {anom.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {anom.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <span>Score: {anom.score} (Threshold: {anom.threshold})</span>
                    <span>{new Date(anom.detectedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            {anomalyDetection.anomalies.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No statistical volume or consignment quantity anomalies detected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 7: Chennai Geographic Locality Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-mono mb-1">
              <MapPin className="w-3 h-3 text-teal-600" />
              <span>GEOGRAPHIC CLUSTER BREAKDOWN</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Chennai Urban Sanctuary Density & Need Volume</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution of verified child sanctuaries, historical consignments, and unmet needs across Chennai localities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {localityDistribution.map((loc, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-xs text-slate-900 truncate" title={loc.locality}>
                  {loc.locality}
                </h4>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-teal-100 text-teal-800">
                  {loc.totalDonations} gifts
                </span>
              </div>
              <div className="space-y-0.5 font-mono text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>Sanctuaries:</span>
                  <span className="font-bold text-slate-700">{loc.sanctuariesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Open Needs:</span>
                  <span className="font-bold text-amber-700">{loc.openRequirements}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                  <span>Valuation:</span>
                  <span>₹{loc.totalValueInr.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
