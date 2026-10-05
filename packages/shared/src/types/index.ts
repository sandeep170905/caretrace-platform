/**
 * CareTrace Core TypeScript Interfaces and Types
 */

export type UserRole = 'DONOR' | 'INSTITUTION' | 'PICKUP_AGENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  institutionId?: string; // If user belongs to an institution
  passwordHash?: string;
  createdAt?: string;
  isSynthetic?: boolean;
}

export interface Institution {
  id: string;
  name: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  capacity: number; // Max children accommodated
  currentChildrenCount: number;
  verified: boolean;
  verificationDate?: string;
  trustScore: number; // 0 to 100
  contactEmail: string;
  contactPhone: string;
  description: string;
  website?: string;
  isSynthetic?: boolean;
}

export type RequirementCategory =
  | 'FOOD'
  | 'CLOTHING'
  | 'MEDICINE'
  | 'SUPPLIES'
  | 'EDUCATION';

export type RequirementUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RequirementStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'FULFILLED';

export interface RequirementDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface Requirement {
  id: string;
  institutionId: string;
  institutionName?: string;
  category: RequirementCategory;
  title: string;
  description: string;
  targetQuantity: number;
  unit: string;
  fulfilledQuantity: number;
  urgency: RequirementUrgency;
  status: RequirementStatus;
  authenticityScore: number; // Rule-based score (0 - 100)
  mlRiskScore?: number; // ML logistic regression secondary risk probability (0.00 - 1.00)
  mlRiskTier?: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFlags: RiskFlag[];
  documents: RequirementDocument[];
  createdAt: string;
  updatedAt: string;
  isSynthetic?: boolean;
}

export type DonationType = 'PHYSICAL_GOODS' | 'FUNDS';

export type DonationStatus =
  | 'MATCHED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CONFIRMED'
  | 'FLAGGED';

export type TimelineStage =
  | 'REQUIREMENT_VERIFIED'
  | 'MATCHED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CONFIRMED';

export interface DonationItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedValueInr?: number;
  estimatedValueUsd?: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Donation {
  id: string; // e.g. "CT-2026-9042"
  donorId: string;
  donorName: string;
  donorEmail: string;
  requirementId: string;
  requirementTitle: string;
  institutionId: string;
  institutionName: string;
  type: DonationType;
  items: DonationItem[];
  status: DonationStatus;
  pickupAgentId?: string;
  pickupAgentName?: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  currentCoordinates?: Coordinates;
  qrCodePayload: string; // Cryptographic payload containing donation ID and security token
  pickupTimestamp?: string;
  deliveryTimestamp?: string;
  confirmationNotes?: string;
  recipientSignature?: string;
  proofPhotoUrl?: string;
  ledgerBlockHash?: string;
  monetaryAmountInr?: number;
  receiptNumber?: string;
  paymentMethod?: string;
  upiTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  isSynthetic?: boolean;
}

export type LedgerEventType =
  | 'GENESIS'
  | 'REQUIREMENT_AUTHENTICATED'
  | 'DONATION_MATCHED'
  | 'PICKUP_VERIFIED'
  | 'IN_TRANSIT_CHECKPOINT'
  | 'DELIVERY_CONFIRMED'
  | 'INTEGRITY_AUDIT'
  | 'MONETARY_DONATION_CONFIRMED';

export interface LedgerBlock {
  index: number;
  timestamp: string;
  donationId: string;
  eventType: LedgerEventType;
  actorId: string;
  actorRole: UserRole | 'SYSTEM';
  actorName: string;
  details: string;
  payloadHash: string; // SHA-256 of payload data
  previousHash: string;
  blockHash: string; // SHA-256 of index + timestamp + donationId + eventType + payloadHash + previousHash + nonce
  nonce: number;
  payload?: Record<string, any>;
  isSynthetic?: boolean;
}

export interface LedgerVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  verifiedAt: string;
  corruptedBlockIndex?: number;
  errorDetail?: string;
  chainHeadHash: string;
}

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFlag {
  ruleId: string;
  ruleName: string;
  severity: RiskSeverity;
  message: string;
  triggeredAt: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  isSynthetic?: boolean;
}

export interface TransitTelemetry {
  donationId: string;
  latitude: number;
  longitude: number;
  currentAddress: string;
  speedKmh: number;
  estimatedArrivalMinutes: number;
  progressPercentage: number;
  lastUpdated: string;
  isSynthetic?: boolean;
}

export interface ProofOfDeliveryCertificate {
  donationId: string;
  donorName: string;
  institutionName: string;
  itemSummary: string;
  pickupVerifiedAt: string;
  deliveryConfirmedAt: string;
  pickupAgentName: string;
  recipientRepresentative: string;
  recipientSignature?: string;
  genesisBlockHash: string;
  deliveryBlockHash: string;
  chainLength: number;
  verificationUrl: string;
  proofPhotoUrl?: string;
  hasPhotoProof?: boolean;
}

export interface TaxExemptionReceipt {
  receiptNumber: string;
  donationId: string;
  amountInr: number;
  amountInWords: string;
  date: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  institutionName: string;
  institutionRegistrationNumber: string;
  institutionTaxId: string;
  institutionAddress: string;
  requirementTitle: string;
  paymentMethod: string;
  upiTransactionId: string;
  ledgerBlockHash: string;
  ledgerBlockIndex: number;
  isDemoSample: true;
  verificationUrl?: string;
  qrDataUrl?: string;
}

export type AnnouncementUrgency = 'GENERAL' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  urgency: AnnouncementUrgency;
  createdAt: string;
  expiresAt?: string;
  active: boolean;
  createdBy?: string;
}

// ---------------- ANALYTICS & ML INSIGHTS TYPES ----------------

export interface HeadlineStats {
  totalDonations: number;
  activeDonors: number;
  fulfillmentRate: number;
  avgDeliveryTimeHours: number;
  totalEstimatedValueInr: number;
  totalRequirements: number;
  fulfilledRequirements: number;
  openRequirements: number;
}

export interface MonthlyDataPoint {
  month: string;
  label: string;
  volume: number;
  monetaryValueInr: number;
  isForecast?: boolean;
  forecastLower?: number;
  forecastUpper?: number;
}

export interface DemandForecastResult {
  overall: {
    historical: MonthlyDataPoint[];
    forecast: MonthlyDataPoint[];
  };
  byCategory: Record<RequirementCategory, {
    historical: MonthlyDataPoint[];
    forecast: MonthlyDataPoint[];
  }>;
  methodology: string;
}

export interface DonorSegmentCentroid {
  frequency: number;
  recencyDays: number;
  avgQuantity: number;
  categoryDiversity: number;
}

export interface DonorSegment {
  id: string;
  name: string;
  size: number;
  percentage: number;
  description: string;
  centroid: DonorSegmentCentroid;
  color: string;
}

export interface DonorAssignment {
  donorId: string;
  donorName: string;
  email: string;
  segmentId: string;
  segmentName: string;
  metrics: {
    frequency: number;
    recencyDays: number;
    avgQuantity: number;
    categoryDiversity: number;
    totalValueInr: number;
  };
}

export interface DonorSegmentationResult {
  k: number;
  segments: DonorSegment[];
  donorAssignments: DonorAssignment[];
  sampleSize: number;
}

export interface AtRiskDonor {
  donorId: string;
  donorName: string;
  email: string;
  churnProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recencyDays: number;
  donationCount: number;
  contributingFactors: string[];
}

export interface RetentionRiskResult {
  atRiskDonors: AtRiskDonor[];
  overallRiskSummary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  methodology: string;
}

export interface FulfillmentPredictionItem {
  requirementId: string;
  title: string;
  category: RequirementCategory;
  urgency: string;
  targetQuantity: number;
  institutionName: string;
  locality: string;
  predictedDaysToFulfil: number;
  predictedDate: string;
}

export interface FulfillmentPredictionResult {
  maeDays: number;
  avgActualDays: number;
  avgPredictedDays: number;
  sampleSize: number;
  activePredictions: FulfillmentPredictionItem[];
  modelWeights: {
    baseDays: number;
    urgencyMultipliers: Record<string, number>;
    categoryFactors: Record<string, number>;
  };
}

export interface AnomalyItem {
  id: string;
  type: 'VOLUME_SPIKE' | 'INSTITUTION_CONCENTRATION' | 'QUANTITY_OUTLIER' | 'VELOCITY_ALERT';
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  entityId: string;
  entityType: 'DONOR' | 'INSTITUTION' | 'DONATION' | 'REQUIREMENT';
  score: number;
  threshold: number;
  detectedAt: string;
  linkedRiskLogId?: string;
}

export interface AnomalyDetectionResult {
  anomaliesCount: number;
  anomalies: AnomalyItem[];
  summary: {
    volumeSpikes: number;
    concentrationRisks: number;
    quantityOutliers: number;
  };
}

export interface LocalityDistributionItem {
  locality: string;
  latitude: number;
  longitude: number;
  totalDonations: number;
  totalValueInr: number;
  sanctuariesCount: number;
  openRequirements: number;
}

export interface ComprehensiveInsights {
  headline: HeadlineStats;
  demandForecast: DemandForecastResult;
  donorSegmentation: DonorSegmentationResult;
  retentionRisk: RetentionRiskResult;
  fulfillmentPrediction: FulfillmentPredictionResult;
  anomalyDetection: AnomalyDetectionResult;
  localityDistribution: LocalityDistributionItem[];
  metadata: {
    generatedAt: string;
    datasetSize: {
      donations: number;
      requirements: number;
      donors: number;
      institutions: number;
    };
    disclaimer: string;
  };
}

export interface AnalyticsSummaryResult {
  headline: HeadlineStats;
  localityDistribution: LocalityDistributionItem[];
  categoryDistribution: Record<string, number>;
  generatedAt: string;
}

