import { Platform } from 'react-native';
import { Donation, LedgerBlock, LedgerVerificationResult } from '@caretrace/shared';

export const CLOUD_API_BASE = 'https://caretrace-backend-fluw.onrender.com/api';
export const LOCAL_DEV_API_BASE = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api' 
  : 'http://localhost:5000/api';

// Default to local in dev, Render cloud in release/prod
let currentApiBase = __DEV__ ? LOCAL_DEV_API_BASE : CLOUD_API_BASE;

export function getApiBase(): string {
  return currentApiBase;
}

export function setApiBase(newUrl: string): void {
  // Normalize URL
  let clean = newUrl.trim();
  if (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  if (!clean.endsWith('/api')) {
    clean += '/api';
  }
  currentApiBase = clean;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${currentApiBase}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody.error) errorMsg = errBody.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function fetchDonations(params?: {
  donorId?: string;
  institutionId?: string;
  agentId?: string;
  status?: string;
}): Promise<Donation[]> {
  const query = new URLSearchParams();
  if (params?.donorId) query.append('donorId', params.donorId);
  if (params?.institutionId) query.append('institutionId', params.institutionId);
  if (params?.agentId) query.append('agentId', params.agentId);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  const res = await request<{ success: boolean; donations: Donation[] }>(
    `/donations${qs ? `?${qs}` : ''}`
  );
  return res.donations || [];
}

export async function fetchDonationDetail(id: string): Promise<{
  donation: Donation;
  blocks: LedgerBlock[];
  qrDataUrl?: string;
  telemetry?: any;
}> {
  const res = await request<{
    success: boolean;
    donation: Donation;
    blocks: LedgerBlock[];
    qrDataUrl?: string;
    telemetry?: any;
  }>(`/donations/${id}`);

  return {
    donation: res.donation,
    blocks: res.blocks || [],
    qrDataUrl: res.qrDataUrl,
    telemetry: res.telemetry
  };
}

export async function fetchLedgerVerification(donationId: string): Promise<LedgerVerificationResult> {
  const res = await request<{ success: boolean; result: LedgerVerificationResult }>(
    `/ledger/verify/${donationId}`
  );
  return res.result;
}

export async function scanPickup(qrPayload: string, agentId: string, notes?: string): Promise<{
  success: boolean;
  donation: Donation;
  ledgerBlock: LedgerBlock;
}> {
  return request<{
    success: boolean;
    donation: Donation;
    ledgerBlock: LedgerBlock;
  }>('/pickup/scan', {
    method: 'POST',
    body: JSON.stringify({ qrPayload, agentId, notes })
  });
}

export async function scanDelivery(payload: {
  qrPayload: string;
  recipientName: string;
  signature?: string;
  notes?: string;
  actorId?: string;
}): Promise<{
  success: boolean;
  donation: Donation;
  certificate?: any;
  ledgerBlock: LedgerBlock;
}> {
  return request<{
    success: boolean;
    donation: Donation;
    certificate?: any;
    ledgerBlock: LedgerBlock;
  }>('/delivery/scan', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchAdminPendingAssignments(): Promise<Donation[]> {
  const res = await request<{ success: boolean; donations: Donation[] }>(
    '/admin/pending-courier-assignments'
  );
  return res.donations || [];
}

