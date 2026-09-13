import { useEffect, useState } from 'react';
import {
  User,
  Institution,
  Requirement,
  Donation,
  LedgerBlock,
  LedgerVerificationResult,
  ProofOfDeliveryCertificate,
  TransitTelemetry,
  RiskFlag
} from '@caretrace/shared';

const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE = envApiUrl
  ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/$/, '')}/api`)
  : '/api';
const TOKEN_STORAGE_KEY = 'caretrace_jwt_token';

/**
 * JWT Token Storage Helpers
 * Stored in localStorage for persistent session preservation across page refreshes during demos,
 * with automatic header attachment on all API calls.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Authenticated Fetch wrapper with automatic Authorization Bearer header
 */
async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data;
}

// ---------------- AUTHENTICATION APIS ----------------

export async function loginUser(email: string, password?: string): Promise<{ success: boolean; token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to login');
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function registerDonor(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ success: boolean; token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register-donor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Donor registration failed');
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function registerInstitution(payload: {
  directorName: string;
  email: string;
  password: string;
  phone?: string;
  institutionName: string;
  registrationNumber: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  capacity?: number;
  currentChildrenCount?: number;
  description?: string;
  website?: string;
}): Promise<{ success: boolean; token: string; user: User; institution: Institution }> {
  const res = await fetch(`${API_BASE}/auth/register-institution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Institution registration failed');
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function getCurrentUser(): Promise<{ success: boolean; user: User; institution?: Institution } | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return await apiFetch('/auth/me');
  } catch {
    clearAuthToken();
    return null;
  }
}

export async function fetchPersonas(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/auth/personas`);
  const data = await res.json();
  return data.personas || [];
}

// ---------------- REQUIREMENTS APIS ----------------

export async function fetchRequirements(params?: {
  category?: string;
  status?: string;
  urgency?: string;
  institutionId?: string;
}): Promise<Requirement[]> {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/requirements${query ? `?${query}` : ''}`);
  const data = await res.json();
  return data.requirements || [];
}

export async function postRequirement(payload: Partial<Requirement>): Promise<{ success: boolean; requirement: Requirement; scoring: any }> {
  return apiFetch('/requirements', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateRequirement(id: string, payload: Partial<Requirement>): Promise<{ success: boolean; requirement: Requirement }> {
  return apiFetch(`/requirements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function closeRequirement(id: string): Promise<{ success: boolean; requirement: Requirement }> {
  return apiFetch(`/requirements/${id}/close`, {
    method: 'PATCH'
  });
}

// ---------------- INSTITUTIONS APIS ----------------

export async function fetchInstitutions(): Promise<Institution[]> {
  const res = await fetch(`${API_BASE}/institutions`);
  const data = await res.json();
  return data.institutions || [];
}

export async function verifyInstitution(id: string): Promise<Institution> {
  return (await apiFetch(`/institutions/${id}/verify`, { method: 'PATCH' })).institution;
}

// ---------------- DONATIONS APIS ----------------

export async function fetchDonations(params?: { donorId?: string; institutionId?: string; agentId?: string; status?: string }): Promise<Donation[]> {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/donations${query ? `?${query}` : ''}`);
  const data = await res.json();
  return data.donations || [];
}

export async function fetchDonationDetail(id: string): Promise<{
  donation: Donation;
  blocks: LedgerBlock[];
  qrDataUrl: string;
  telemetry?: TransitTelemetry;
}> {
  return apiFetch(`/donations/${id}`);
}

export async function createDonation(payload: any): Promise<{ success: boolean; donation: Donation; ledgerBlock: LedgerBlock; qrDataUrl: string }> {
  return apiFetch('/donations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function scanPickup(qrPayload: string, agentId: string, notes?: string): Promise<any> {
  return apiFetch('/pickup/scan', {
    method: 'POST',
    body: JSON.stringify({ qrPayload, agentId, notes })
  });
}

export async function scanDelivery(payload: {
  qrPayload: string;
  recipientName: string;
  signature?: string;
  notes?: string;
  photoUrl?: string;
  actorId?: string;
}): Promise<any> {
  return apiFetch('/delivery/scan', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchProofCertificate(donationId: string): Promise<ProofOfDeliveryCertificate | null> {
  try {
    const data = await apiFetch(`/delivery/certificate/${donationId}`);
    return data.certificate || null;
  } catch {
    return null;
  }
}

export async function fetchTransitTelemetry(donationId: string): Promise<any> {
  return apiFetch(`/transit/${donationId}`);
}

export async function stepTransitSimulation(donationId: string, increment: number = 20): Promise<any> {
  return apiFetch(`/transit/${donationId}/step`, {
    method: 'POST',
    body: JSON.stringify({ increment })
  });
}

// ---------------- LEDGER APIS ----------------

export async function fetchLedgerBlocks(donationId?: string): Promise<LedgerBlock[]> {
  const url = donationId ? `/ledger/donation/${donationId}` : `/ledger`;
  const data = await apiFetch(url);
  return data.blocks || [];
}

export async function verifyLedgerLive(donationId?: string): Promise<LedgerVerificationResult> {
  const url = donationId ? `/ledger/verify/${donationId}` : `/ledger/verify`;
  const data = await apiFetch(url);
  return data.result;
}

export async function simulateTamper(blockIndex: number, alteredDetails?: string): Promise<any> {
  return apiFetch('/ledger/simulate-tamper', {
    method: 'POST',
    body: JSON.stringify({ blockIndex, alteredDetails })
  });
}

// ---------------- ADMIN & COURIER DISPATCH APIS ----------------

export async function fetchAdminStats(): Promise<any> {
  return apiFetch('/admin/stats');
}

export async function fetchRiskLogs(): Promise<RiskFlag[]> {
  const data = await apiFetch('/admin/risk-logs');
  return data.logs || [];
}

export async function resolveRiskLog(ruleId: string, adminName: string): Promise<any> {
  return apiFetch('/admin/risk-logs/resolve', {
    method: 'POST',
    body: JSON.stringify({ ruleId, adminName })
  });
}

export async function fetchPendingCourierAssignments(): Promise<Donation[]> {
  const data = await apiFetch('/admin/pending-courier-assignments');
  return data.donations || [];
}

export async function assignCourier(donationId: string, agentId: string): Promise<any> {
  return apiFetch('/admin/assign-courier', {
    method: 'POST',
    body: JSON.stringify({ donationId, agentId })
  });
}

export async function autoAssignAllCouriers(): Promise<any> {
  return apiFetch('/admin/auto-assign-all', {
    method: 'POST'
  });
}

export async function resetDatabase(): Promise<any> {
  const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
  return res.json();
}

// ---------------- REAL-TIME SSE STREAM ----------------

export function useRealTimeEvents(onEvent?: (event: { type: string; data: any }) => void) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any; timestamp: number } | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE}/events`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    const handleMessage = (type: string, e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        const ev = { type, data: parsed, timestamp: Date.now() };
        setLastEvent(ev);
        if (onEvent) onEvent(ev);
      } catch (err) {
        // ignore parse error
      }
    };

    eventSource.addEventListener('DONATION_CREATED', (e) => handleMessage('DONATION_CREATED', e));
    eventSource.addEventListener('DONATION_STATUS_UPDATED', (e) => handleMessage('DONATION_STATUS_UPDATED', e));
    eventSource.addEventListener('DONATION_DELIVERED', (e) => handleMessage('DONATION_DELIVERED', e));
    eventSource.addEventListener('TRANSIT_UPDATE', (e) => handleMessage('TRANSIT_UPDATE', e));
    eventSource.addEventListener('LEDGER_TAMPER_ALERT', (e) => handleMessage('LEDGER_TAMPER_ALERT', e));
    eventSource.addEventListener('REQUIREMENT_CREATED', (e) => handleMessage('REQUIREMENT_CREATED', e));
    eventSource.addEventListener('REQUIREMENT_UPDATED', (e) => handleMessage('REQUIREMENT_UPDATED', e));
    eventSource.addEventListener('REQUIREMENT_STATUS_UPDATED', (e) => handleMessage('REQUIREMENT_STATUS_UPDATED', e));
    eventSource.addEventListener('INSTITUTION_REGISTERED', (e) => handleMessage('INSTITUTION_REGISTERED', e));
    eventSource.addEventListener('INSTITUTION_VERIFIED', (e) => handleMessage('INSTITUTION_VERIFIED', e));
    eventSource.addEventListener('DATABASE_RESEEDED', (e) => handleMessage('DATABASE_RESEEDED', e));

    return () => {
      eventSource.close();
    };
  }, []);

  return { connected, lastEvent };
}
