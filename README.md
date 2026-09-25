# CareTrace – Secure & Traceable Childcare Donation Logistics Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-teal.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green.svg)](https://leafletjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Render-336791.svg)](https://render.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_Dev-003B57.svg)](https://www.sqlite.org/)

**CareTrace** is an end-to-end, tamper-evident donation logistics and custody verification platform designed to bridge the trust deficit in philanthropic giving to accredited childcare institutions, orphanages, and juvenile shelters across Chennai, Tamil Nadu.

By pairing verified institutional requirements with physical QR-anchored custody tracking, real-time Chennai corridor telemetry, and an append-only SHA-256 cryptographic ledger, CareTrace guarantees verifiable non-repudiation: donors receive definitive, mathematically provable evidence that their physical consignments reach verified children in care.

---

## 🌐 Live Production Deployments

| Component | Live Production URL | Description |
|---|---|---|
| **Web Application** | [https://caretrace-web.onrender.com](https://caretrace-web.onrender.com) | Responsive React 18 UI with glassmorphic design system |
| **Backend REST API** | [https://caretrace-platform.onrender.com](https://caretrace-platform.onrender.com) | Node.js Express API with PostgreSQL Knex connection pool |
| **System Healthcheck** | [https://caretrace-platform.onrender.com/api/health](https://caretrace-platform.onrender.com/api/health) | Reports live DB engine, memory usage, uptime, and status |
| **Public Ledger Verification**| [https://caretrace-platform.onrender.com/api/ledger/verify](https://caretrace-platform.onrender.com/api/ledger/verify) | Validates full SHA-256 chain integrity in sub-milliseconds |

> [!NOTE]  
> **Render Free-Tier Wake-Up Time:**  
> Free-tier instances sleep after 15 minutes of inactivity. The initial cold request may take ~45–50 seconds to spin up. Once active, all database queries, interactive map routing, and real-time Server-Sent Events (SSE) stream respond instantaneously.

---

## 🏗 Architecture Overview

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    CareTrace Monorepo                  │
                               └────────────────────────────────────────────────────────┘
                                         │                                  │
            ┌────────────────────────────┴─────────────┐                    │
            ▼                                          ▼                    ▼
   ┌─────────────────────────┐             ┌─────────────────────────┐ ┌─────────────────────────┐
   │     packages/web        │             │     packages/mobile     │ │     packages/shared     │
   │  React 18 + Vite + TS   │             │   React Native + Expo   │ │ Canonical TypeScript    │
   │  Plus Jakarta & Outfit  │             │   Expo SDK 52 + Camera  │ │ Cryptographic Functions │
   │  Tailwind + Glassmorphic│             │   Donor & Field Agent   │ │ Anomaly & Scorer Models │
   │  Interactive Leaflet Map│             │   Simulated QR Testing  │ │ Indian Currency Format  │
   └─────────────────────────┘             └─────────────────────────┘ └─────────────────────────┘
            │                                          │                    ▲
            │ (HTTP REST / Server-Sent Events)         │                    │ (Internal Monorepo Dep)
            └────────────────────────────┬─────────────┘                    │
                                         ▼                                  │
                           ┌───────────────────────────────┐                │
                           │       packages/backend        ├────────────────┘
                           │    Node.js + Express + TS     │
                           │  - PBKDF2 Password Hashing    │
                           │  - HMAC-SHA256 JWT Auth       │
                           │  - Real-Time SSE Stream       │
                           │  - Cryptographic Hash Chain   │
                           │  - Chennai Waypoint Engine    │
                           │  - Dual-Engine Knex SQL DB    │
                           └──────────────┬────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
     ┌───────────────────────────┐                 ┌───────────────────────────┐
     │      Application Data     │                 │   Cryptographic Ledger    │
     │     (Mutable SQL Store)   │                 │   (Immutable Hash-Chain)  │
     │  SQLite / Render Postgres │                 │   caretrace.ledger.json   │
     └───────────────────────────┘                 └───────────────────────────┘
```

---

## 🗄️ Two-Part Data Architecture: SQL Database vs. Cryptographic Hash-Chain

CareTrace makes an architectural distinction between standard application data and custody audit history:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                CareTrace Dual-Tier Storage                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
              │                                                          │
              ▼                                                          ▼
┌───────────────────────────────────────────┐        ┌───────────────────────────────────────────┐
│  Tier 1: Relational SQL Application DB    │        │ Tier 2: Cryptographic Hash-Chain Ledger   │
│  (ACID Relational Data Engine via Knex)   │        │ (Tamper-Evident Append-Only State Engine) │
├───────────────────────────────────────────┤        ├───────────────────────────────────────────┤
│ • User Accounts & Roles (Donor, NGO, etc.)│        │ • Checkpoint Block Sequence (Index 0..N)  │
│ • Childcare Sanctuaries & Accreditation   │        │ • Deterministic Block SHA-256 Hashes      │
│ • Requisitions, Categories & Quantities   │        │ • Strict Parent Hash Pointer Linking      │
│ • Consignment Records & Waybill Addresses │        │ • Payload Merkle Hashing & Nonces         │
│ • Broadcast Announcements & Admin Flags   │        │ • Mathematical Non-Repudiation            │
│ • Real-time Courier Waypoint Telemetry    │        │ • Intentionally NOT an Editable Table     │
│                                           │        │                                           │
│ Engines Supported:                        │        │ Backing Store:                            │
│ - Local Dev / Testing: SQLite file        │        │ - JSON block record store on disk         │
│ - Production (Render): PostgreSQL         │        │ - Audited via /api/ledger/verify          │
└───────────────────────────────────────────┘        └───────────────────────────────────────────┘
```

### 1. Relational SQL Application Database (Mutable)
- **Purpose**: Manages entities that require relational queries, foreign-key relationships, updates, and indexing.
- **Dialect-Agnostic Knex Layer**:
  - **Local Development & CI Testing**: Embedded **SQLite** (`packages/backend/data/caretrace.sqlite`) via `better-sqlite3`. Zero configuration, 100% offline, surviving process restarts.
  - **Cloud Production (Render)**: Automatically switches to **PostgreSQL** when `DATABASE_URL` is set in the environment.
- **Database Tables**: `users`, `institutions`, `requirements`, `donations`, `announcements`, `risk_audit_logs`, `transit_telemetry`.
- **Verified Persistence**: All write paths (`POST /api/auth/register-donor`, `POST /api/auth/register-institution`, `POST /api/requirements`, `POST /api/donations`, `POST /api/pickups/scan`, `POST /api/deliveries/scan`) strictly `await` physical SQL transactions before returning HTTP responses.

> [!WARNING]
> **Render Free PostgreSQL 30-Day Expiration Policy:**  
> Render's free managed PostgreSQL database instances automatically expire **30 days after creation**.  
> **Recreation Instructions:**
> 1. Log into your [Render Dashboard](https://dashboard.render.com).
> 2. Create a new **PostgreSQL** instance named `caretrace-db`.
> 3. Copy its **Internal Database URL**.
> 4. Go to the `caretrace-platform` Web Service &rarr; **Environment** &rarr; update `DATABASE_URL`.
> 5. Trigger a Manual Deploy. CareTrace will automatically run schema synchronization and seed the pristine baseline dataset on boot.

### 2. Cryptographic Hash-Chain Ledger (Immutable)
- **Purpose**: Provides verifiable, tamper-evident non-repudiation for donation creation, courier pickup, and sanctuary handover.
- **Why It Is NOT a Standard SQL Table**: Regular SQL tables permit `UPDATE` and `DELETE` queries. For a chain of custody, enabling database administrators to edit past handover timestamps or signatures would invalidate the entire premise of zero-trust verification.
- **Cryptographic Invariants**:
  - Every block embeds the exact SHA-256 hash of the previous block (`previousHash`), a payload Merkle hash, actor digital attribution, and a block index.
  - If any historical record is maliciously modified directly on disk, the SHA-256 chain links break, and `/api/ledger/verify` detects tampering in sub-milliseconds.

---

## 🎯 Scoping: Physical Logistics vs. Monetary Contributions

CareTrace's novel engineering contribution is solving **physical donation logistics** — eliminating the diversion, spoilage, or fictitious requisitions of tangible physical goods (groceries, medicines, school uniforms, bedding) delivered to children's shelters.

| Feature Area | Phase 1 (Current Review Scope) | Phase 2 (Production Roadmap) |
|---|---|---|
| **Physical Consignments** | Full end-to-end QR custody lifecycle, real Chennai street coordinates, courier manifest verification, photographic handover proofs. | IoT weight-sensor packaging, BLE beacon dock handovers. |
| **Monetary Allocations** | **Simulated Direct Allocation**: Demonstrates instant ledger minting (`MONETARY_DONATION_CONFIRMED`) and automated Section 80G Form 10BE sample receipt generation with official demo disclosures. | Payment gateway integration (Razorpay / Cashfree) with escrow-to-vendor payouts, restricting disbursement until physical vendor invoice verification. |

---

## 🔑 Demo Personas & Credentials

All seeded accounts are pre-configured with the evaluation password: **`caretrace123`**

| Role | Persona Name | Email | Password | Primary Scope in Walkthrough |
|---|---|---|---|---|
| **Admin / Compliance** | Sandeep R | `sandeep@caretrace.org` | `caretrace123` | Sanctuary accreditation, fraud anomaly logs, courier dispatch, tamper defense |
| **Donor (Primary)** | Ajith R | `ajith@caretrace.org` | `caretrace123` | Pledges physical consignments, live Chennai transit tracking, Section 80G tax receipts |
| **Institution Director** | Akash Kumar | `director@karunaikarangal.org` | `caretrace123` | Karunai Karangal Sanctuary (Tambaram); posts needs, inspects deliveries, signs handovers |
| **Field Courier Agent** | Sakthivel S | `agent.sakthivel@caretrace.org` | `caretrace123` | Zone 4 Logistics; depot pickup scanning, transit advancement, dock delivery |
| **Donor (Secondary)** | Sanjay Verma | `sanjay@caretrace.org` | `caretrace123` | Directory donor; past First-Aid kits consignment |
| **Donor (Tertiary)** | Karthik V | `karthik@caretrace.org` | `caretrace123` | Directory donor; past Rice grains consignment |

---

## 🎬 Review-2 Comprehensive Presentation Script (10–15 Minutes)

Follow this structured step-by-step walkthrough to demonstrate every architectural pillar of CareTrace to evaluators:

### Act 1: The Problem Statement & Public Needs Board (2 mins)
1. **Open the live application**: Navigate to [https://caretrace-web.onrender.com](https://caretrace-web.onrender.com).
2. **Highlight Zero-Login Public Access**:
   - Point out that donors and evaluators can inspect verified institutional needs without creating an account.
   - Filter by **FOOD**, **MEDICINE**, or **EDUCATION** and search for *"Tambaram"* or *"Ambattur"*.
   - Point out the **"Accredited Child Sanctuary"** trust badges displaying government license registration numbers (`TN-CH-NGO-2016-8812`).
3. **Show Institutional Governance**:
   - Point out that unverified or rogue institutions cannot publish needs publicly until cleared by Compliance Admin.

### Act 2: Dynamic Institution Registration & Compliance Gate (2.5 mins)
1. In the top navbar, click **"Sign In / Register"** &rarr; select **"Institution Registration"**.
2. Register a new sanctuary:
   - Director Name: `Dr. Kavitha Raman`
   - Sanctuary Name: `Annai Teresa Anbu Illam`
   - License Number: `TN-CH-NGO-2026-9014`
   - Capacity: `60`, Children: `52`, Locality: `Avadi, Chennai`
3. **Notice Instant Auto-Login**: The app automatically issues a signed JWT, preserves the session, and lands in the Institution Portal.
4. **Show the Accreditation Gate**:
   - An amber compliance banner appears: *"Accreditation Pending Admin Verification"*.
   - The button to post requisitions is safely locked with an explanation.
5. **Admin Approval**:
   - In the top navbar, use the 1-click switcher to switch to **Sandeep R (Admin)**.
   - Go to **"Verification Queue"** &rarr; locate *Annai Teresa Anbu Illam* &rarr; click **"Verify Institution"**.
   - A real-time SSE push notification toasts across the screen confirming accreditation.
   - Switch back to Director Kavitha: requisition posting is unlocked immediately!

### Act 3: Donor Pledge, Consignment Genesis, & Direct Monetary Allocation (2.5 mins)
1. Switch to **Ajith R (Donor)** via the top role switcher.
2. Under **"Fulfill Needs & Donate"**, select *"First-Aid Medical Kits & Antiseptics"* for *Karunai Karangal*.
3. Click **"Pledge Donation"**: enter quantity `20` boxes and confirm.
   - A new consignment `CT-2026-XXXX` is minted.
   - Genesis Block #0 is anchored to the cryptographic ledger.
4. **Demonstrate Monetary Contribution & Section 80G Receipt**:
   - Click **"Pledge Monetary"** on any requirement.
   - Notice the prominent **Phase 1 Scoping Institutional Disclosure Pill**:
     *"Phase 1: Simulated UPI Settlement & Immediate Ledger Verification • Phase 2 (Production Roadmap): Razorpay/Cashfree Payment Gateway Integration with Escrow-to-Vendor Payouts"*.
   - Select ₹2,500 and confirm.
   - Notice the generated **Section 80G Form 10BE Sample Receipt** with official demo watermark, institutional registration numbers, and ledger hash anchor.

### Act 4: Logistics Dispatch, Leaflet.js Interactive Chennai Map, & Courier Custody (3 mins)
1. Switch to **Sandeep R (Admin)** &rarr; click **"Courier Dispatch"** &rarr; assign courier **Sakthivel S** to the new consignment.
2. Switch to **Sakthivel S (Field Agent)**:
   - View the active Courier Manifest.
   - Click **"Verify Pickup"** &rarr; point the camera or click the 1-click test button.
   - The consignment transitions to `IN_TRANSIT` and mints block `PICKUP_VERIFIED`.
3. **Interactive OpenStreetMap Telemetry**:
   - Look at the **Interactive Chennai Transit Corridor**:
   - Real **Leaflet.js + OpenStreetMap tiles** (CartoDB Voyager) render the route between Anna Nagar/T. Nagar and Tambaram.
   - Click **"Advance Transit (+20%)"**: observe the courier van icon moving in real-time along real Chennai roadways with speed, ETA, and sector telemetry.
   - Notice the telemetry disclosure caption clarifying deterministic route simulation for Phase 1.

### Act 5: Inspected Sanctuary Handover & Proof of Delivery Certificate (2.5 mins)
1. Switch role to **Akash Kumar (Institution Director)**.
2. Go to **"Incoming Deliveries"** &rarr; find the arrived consignment.
3. Click **"Confirm Receipt"**:
   - The director inspects the goods and attaches photographic handover proof.
   - Submits digital handover signature: `DIGITAL_SIG:AKASH_KUMAR_KARUNAI_TAMBARAM_2026`.
4. Open the generated **Proof of Delivery Certificate**:
   - Show the official digital handover credential badge.
   - Show the attached inspection photo anchored on-chain.
   - Show the Genesis-to-Delivery block hashes.

### Act 6: Zero-Trust Tamper Defense & Public Verification (2.5 mins)
1. Switch to **Sandeep R (Admin)** &rarr; go to **"Ledger Explorer"**.
2. Click **"Simulate Malicious Block Alteration"** on Block #1:
   - Instantly, a real-time red security alert banner broadcasts across the platform via SSE.
   - The chain head hash fails parity check.
   - The block explorer flags the exact corrupted block index and byte discrepancy.
3. Click **"Reset Seed Database"** to restore cryptographic chain integrity.
4. Open the **"Verify a Donation"** tab in the top navbar:
   - Enter donation ID `CT-2026-8801`.
   - The public ledger validator independently verifies the 4-block custody chain (Genesis &rarr; Pickup &rarr; Transit &rarr; Delivery) and outputs:  
     `✅ CRYPTOGRAPHIC INTEGRITY VERIFIED (isValid: true)`.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js `v20.x` or higher
- npm `v9.x` or higher

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/sandeep170905/caretrace-platform.git
cd caretrace-platform
npm install

# 2. Build monorepo packages
npm run build:shared
npm run build:backend
npm run build:web

# 3. Start Backend server (Port 5000)
cd packages/backend
node dist/server.js

# 4. In a second terminal, start Web client (Port 5173)
cd packages/web
npx vite --port 5173

# 5. (Optional) Run automated verification suite
cd packages/backend
node dist/testLedger.js
node dist/testFullPersistence.js
```

---

## 📄 License & Academic Attribution
Developed as an advanced engineering project for verifiable physical donation logistics and non-repudiation.  
© 2026 CareTrace Platform contributors. Open-source under the MIT License.
