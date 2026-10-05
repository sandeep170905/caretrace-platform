# Isolated Reviewer Demo Mode Documentation

This document explains the isolated, unlisted **Reviewer Demo Mode** implemented in CareTrace for base academic research paper evaluation.

---

## 1. Architectural Isolation & Design

Unlike previous iterations that shared layout chrome with the multi-persona platform, this mode is **fully separated**:
- **Zero Public Visibility**: There is no button, tab, link, persona card, or reference to this mode in the main CareTrace application.
- **Dedicated Standalone Shell**: Uses its own independent layout (`BasePaperReviewPortal.tsx`) with its own header, navigation, and footer.
- **No Shared Persona Controls**: Contains zero persona switchers, zero platform broadcast/notice banners, and no links back to the main portal.
- **Account Identity**: The signed-in user is displayed purely as **Sandeep** (no role label like "Reviewer" or "Academic" is displayed).
- **Scope Alignment**: Only the features specified by the base research paper are available and fully functional.

---

## 2. Dedicated Unlisted Entry Point & Credentials

Access is restricted to a direct, unguessable URL:

| Parameter | Value |
| :--- | :--- |
| **Hidden Entry URL** | `http://localhost:5173/academic-review-2026` (or `http://localhost:5173/sandeep-access`) |
| **Signed-In Display Name** | **Sandeep** |
| **Login Email** | `reviewer@demo.local` |
| **Password** | `caretrace123` |
| **Interface Format** | Standalone login page (plain email + password form, no signup, no persona picker) |

---

## 3. Fully Functional Base Paper Feature Set

Once authenticated as **Sandeep**, the isolated shell provides full end-to-end functionality across three dedicated views:

### A. Campaigns & Needs (`REQUIREMENTS`)
- **Requirements Listing**: Displays active verified childcare needs with Category, Urgency, Authenticity Score, Target Goal, and **Fulfillment Deadline Date**.
- **Post Childcare Need**: Institutional modal allowing creation of needs with title, description, category, quantity goal, unit, urgency, and **deadline date** (`input type="date"`). Submits directly to the backend.
- **Physical Goods Pledging**: Interactive pledge modal specifying quantity and pickup hub address $\rightarrow$ mints genesis cryptographic ledger block and generates Section 80G sample receipt.
- **Direct Monetary Contributions (₹)**: Contribution modal supporting round rupee amounts (₹500, ₹1000, ₹2500, ₹5000, etc.) $\rightarrow$ instant Section 80G tax receipt with ledger verification QR code.

### B. Contributions & 80G Receipts (`HISTORY`)
- Displays Sandeep's verified contribution records.
- **Walkable Chain-of-Custody Timeline**: Inspects the 4-stage custody trail from matching to final handover.
- **Section 80G Tax Exemption Receipt**: Viewable modal with cryptographic signature and verification QR.
- **Direct Ledger Verification Button**: One-click jump to inspect the donation's block on the public ledger.

### C. Cryptographic Ledger Verification (`LEDGER`)
- Standalone read-only SHA-256 block explorer:
  - Cryptographic integrity pass/fail verification banner (`Status: VALID`).
  - Total block count and chain head hash.
  - Interactive block-by-block inspection (block index, timestamp, signatory actor, SHA-256 hash, previous-hash link, and payload hash).

---

## 4. Backend Gateway Protection

The backend enforces this restriction in `reviewerRoleGate` middleware ([`packages/backend/src/middleware/roleGate.ts`](file:///g:/main%20project%2026/packages/backend/src/middleware/roleGate.ts)):
- Even if direct API calls or deep links are attempted with Sandeep's `REVIEWER_DEMO` JWT token, endpoints for ML analytics (`/api/analytics`), courier dispatch (`/api/pickup`, `/api/delivery`, `/api/transit`), and admin dashboards (`/api/admin`) are intercepted and rejected with `403 Forbidden` (`FEATURE_RESTRICTED_REVIEWER_DEMO`).

---

## 5. Main Portal Cleanliness Check

- Main navbar (`Navbar.tsx`): Has **no** "Reviewer Portal" tab (shows standard "Operations Portal").
- Public persona switcher: `/personas` endpoint returns only standard demo accounts (`Ajith R`, `Akash Kumar`, `Sakthivel S`, `Sandeep R`).
- Portal landing cards: Has **no** reviewer or academic persona cards.

---

## 6. One-Step Rollback Instructions

All code for this feature resides exclusively on the isolated branch:
```bash
git checkout feature/reviewer-demo-mode
```

To permanently roll back and leave zero footprint on your production codebase:
```bash
git checkout main
git branch -D feature/reviewer-demo-mode
```
No files from this branch are merged into `main`.
