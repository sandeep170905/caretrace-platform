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
  riskFlags: RiskFlag[];
  documents: RequirementDocument[];
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export type LedgerEventType =
  | 'GENESIS'
  | 'REQUIREMENT_AUTHENTICATED'
  | 'DONATION_MATCHED'
  | 'PICKUP_VERIFIED'
  | 'IN_TRANSIT_CHECKPOINT'
  | 'DELIVERY_CONFIRMED'
  | 'INTEGRITY_AUDIT';

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
  genesisBlockHash: string;
  deliveryBlockHash: string;
  chainLength: number;
  verificationUrl: string;
}

