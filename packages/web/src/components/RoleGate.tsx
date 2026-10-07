import React from 'react';
import { UserRole } from '@caretrace/shared';
import { ShieldAlert, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

interface RoleGateProps {
  currentRole?: UserRole | null;
  allowedRoles?: UserRole[];
  blockedRoles?: UserRole[];
  fallback?: React.ReactNode;
  featureTitle?: string;
  children: React.ReactNode;
}

/**
 * Reusable RoleGate / FeatureGate component.
 * Ensures strict scoping for REVIEWER_DEMO (Base Research Paper compliance).
 * Completely transparent for all other roles (DONOR, INSTITUTION, PICKUP_AGENT, ADMIN).
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  currentRole,
  allowedRoles,
  blockedRoles,
  fallback,
  featureTitle,
  children
}) => {
  const isBlocked = Boolean(
    (currentRole && blockedRoles && blockedRoles.includes(currentRole)) ||
    (allowedRoles && (!currentRole || !allowedRoles.includes(currentRole)))
  );

  if (isBlocked) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-3xl mx-auto my-8 p-6 sm:p-8 bg-surface-card rounded-3xl border border-surface-border shadow-elevated text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shadow-sm">
          <BookOpen className="w-8 h-8 text-teal-700" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Academic Reviewer Demo Mode</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            {featureTitle ? `${featureTitle} Restricted` : 'Feature Outside Base Paper Scope'}
          </h2>
          <p className="text-sm font-sans text-slate-600 max-w-xl mx-auto leading-relaxed">
            In accordance with the Base Research Paper evaluation criteria, advanced components (such as ML Analytics, Live GPS Telemetry, Field Logistics Courier scanning, and Admin Risk Dashboards) are restricted in this demo view.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border text-left max-w-lg mx-auto space-y-2.5">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 block">
            Allow-listed Base Paper Features:
          </span>
          <ul className="text-xs font-sans text-slate-700 space-y-2">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Donor & Sanctuary Registration / Verification</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Requirement Posting with Goal & Deadline</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Physical Goods & Monetary Contribution Pledging</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Transaction Confirmation & Section 80G Receipt</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Donor-facing Donation History</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Basic SHA-256 Ledger Explorer (Block Count & Valid Status)</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export function isReviewerDemoRole(role?: UserRole | null): boolean {
  return role === 'REVIEWER_DEMO';
}
