# Reviewer Demo Mode Documentation

This document explains the isolated **Reviewer Demo Mode** implemented in CareTrace. This mode is 100% additive, strictly reversible, and restricts the platform presentation to match the base research paper's feature set while keeping all advanced features intact on other personas.

---

## 1. Overview & Research Alignment

The base academic research paper specifies a core physical & monetary donation traceability platform:
1. **Institution Onboarding & Needs Posting**: Title, description, category, target quantity/goal, and fulfillment deadline.
2. **Donor Registration & Pledging Flow**: Physical goods pledges and direct monetary contributions.
3. **Transaction Confirmation & Verification**: Instant cryptographic confirmation and Section 80G sample tax exemption receipt.
4. **Donor Donation History**: Complete ledger of past physical and monetary contributions.
5. **Basic Cryptographic Ledger View**: Block-by-block immutable SHA-256 hash chain with validity verification (`isValid: true/false`), block count, and tamper detection.

Advanced modules developed beyond the base paper (Double Exponential Smoothing ML forecasting, K-Means donor clustering, Courier Logistics Dispatch, live simulated GPS telemetry, and Admin fraud scoring dashboards) are **gated and inaccessible** when logged in under this mode.

---

## 2. Reviewer Demo Credentials

A dedicated demo account is pre-seeded for one-click evaluation:

| Parameter | Value |
| :--- | :--- |
| **Role Name** | `REVIEWER_DEMO` |
| **Email** | `reviewer@demo.local` |
| **Password** | `caretrace123` |
| **Display Name** | Academic Reviewer |
| **Fast Access** | 1-Tap persona button available on the Portal landing screen |

---

## 3. Allow-Listed Pages & Endpoints

When authenticated as `REVIEWER_DEMO`:

### Allowed Frontend Views
- **Public Requirement Board** (`/`):
  - View verified requirements showing Title, Description, Quantity Goal, and **Target Date / Deadline**.
  - Pledge physical goods or contribute monetary funds.
  - Complete pledge confirmation modals and view Section 80G verification receipts.
- **Reviewer Portal / Donor Dashboard** (`/portal`):
  - View donor profile and total contribution metrics.
  - Complete donation history (physical and monetary).
  - Walkable Chain-of-Custody timeline and Section 80G tax receipt viewer.
- **Public Ledger Explorer** (`/verify`):
  - SHA-256 block-by-block tamper-evident verification.
  - Verification pass/fail status banner and total block count.

### Blocked Features (Gated for `REVIEWER_DEMO`)
- **ML Analytics Engine**: Demand forecasting, K-means clusters, retention risk scores, fulfillment predictions (`/api/analytics`).
- **Courier Logistics Portal**: Courier dispatch manifests, GPS simulated routes, transit checkpoints (`/api/pickup`, `/api/delivery`, `/api/transit`).
- **Administrative Risk & Scoring Dashboard**: Fraud anomaly inspection, admin system overrides (`/api/admin`).
- **Live Transit GPS Telemetry**: Real-time simulated map routes on the donor dashboard are hidden.

### Backend API Route Enforcement
The backend enforces this restriction in `reviewerRoleGate` middleware (`packages/backend/src/middleware/roleGate.ts`), mounted across `/api`:
- Any request made with a `REVIEWER_DEMO` JWT token attempting to reach `/api/analytics`, `/api/pickup`, `/api/delivery`, `/api/transit`, or `/api/admin` is intercepted and immediately rejected with `403 Forbidden` (`REVIEWER_DEMO_RESTRICTED`).

---

## 4. Reversibility & Rollback Instructions

This implementation was developed on the dedicated branch:
```bash
git checkout feature/reviewer-demo-mode
```

### Complete One-Step Rollback (Without Merging)
Because this work is on an isolated branch, you can revert the entire change without altering `main`:
```bash
git checkout main
git branch -D feature/reviewer-demo-mode
```

### Additive Files Introduced
If you wish to remove reviewer demo mode while staying on the branch:
1. Delete the new migration: `packages/backend/src/db/migrations/20261005_add_deadline_to_requirements.ts`
2. Delete the gate middleware: `packages/backend/src/middleware/roleGate.ts`
3. Delete the frontend gate: `packages/web/src/components/RoleGate.tsx`
4. Delete this documentation file: `docs/REVIEWER_DEMO_MODE.md`
5. Remove `'REVIEWER_DEMO'` from `UserRole` in `packages/shared/src/types/index.ts` and recompile.
