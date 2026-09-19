# CareTrace – Secure & Traceable Donation Logistics & Verification Platform

**CareTrace** bridges the trust and accountability gap in physical donations to child-care institutions, orphanages, and youth shelters. By pairing verified institution requirements with physical chain-of-custody tracking and an append-only cryptographic ledger, CareTrace ensures every donation genuinely reaches verified beneficiaries.

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
│  React 18 + Vite + TS   │             │   React Native + Expo   │ │ TypeScript Definitions  │
│  Tailwind CSS           │             │   Expo SDK 52 + Camera  │ │ SHA-256 Chain Rules     │
│  Role Dashboards (Web)  │             │   Donor & Field Agent   │ │ Scoring & Anomaly Model │
└─────────────────────────┘             └─────────────────────────┘ └─────────────────────────┘
         │                                          │                    ▲
         │ (HTTP REST / Server-Sent Events)         │                    │ (Internal Package)
         └────────────────────────────┬─────────────┘                    │
                                      ▼                                  │
                        ┌───────────────────────────────┐                │
                        │       packages/backend        ├────────────────┘
                        │    Node.js + Express + TS     │
                        │  - PBKDF2 Password Hashing    │
                        │  - HMAC-SHA256 JWT Auth       │
                        │  - Real-time SSE Stream       │
                        │  - Cryptographic Hash Chain   │
                        │  - Transit & Telemetry Engine │
                        │  - JSON File Database Store   │
                        └───────────────────────────────┘
```

### Component Roles

1. **`packages/shared`**:
   - Canonical TypeScript interfaces (`Donation`, `Institution`, `Requirement`, `LedgerBlock`, `User`).
   - Pure cryptographic ledger functions (`mineBlock`, `verifyBlock`, `verifyChain`).
   - Rule-based authenticity and fraud detection scoring engine (`FraudScoringService`).
2. **`packages/backend`**:
   - RESTful API endpoints on port `5000`.
   - Real-time Server-Sent Events (SSE) stream (`/api/events`) broadcasting live state transitions, telemetry updates, and tamper alarms.
   - Salted PBKDF2 password hashing (100,000 iterations) and HMAC-SHA256 JWT authorization tokens.
   - Persistent zero-dependency file-based database (`caretrace.db.json`).
3. **`packages/web`**:
   - Responsive web dashboard on port `5173`.
   - **Public Needs Board**: Unauthenticated guest browsing of verified requirements with keyword, locality, and category filters.
   - **Unified Operations Portal**: Real-time role dashboards for Donors, Institution Directors, Logistics Agents, and Compliance Admins.
   - **Chain-of-Custody Timeline**: Visual custody timeline with block explorer modals.
   - **Interactive Live Transit Map**: SVG route visualization across Chennai with simulated GPS milestones.
4. **`packages/mobile`**:
   - React Native application using Expo SDK 52 on port `8081`.
   - **Donor Home Screen**: Impact statistics, tracked consignments, and visual `ChainOfCustodyTimeline`.
   - **Pickup Agent Screen**: Live courier manifest, native camera QR scanner, and an instant **"Simulate Scan"** testing button.
   - Configurable API host modal for physical device testing via Expo Go on local Wi-Fi.

---

## 🔑 Demo Personas & Credentials

### Pre-Seeded Accounts

| Role | Persona Name | Email | Password | Primary Demo Scope |
|---|---|---|---|---|
| **Admin / Compliance** | Sandeep R | `sandeep@caretrace.org` | `caretrace123` | Institution accreditation, risk logs, courier dispatch |
| **Donor (Primary)** | Ajith R | `ajith@caretrace.org` | `caretrace123` | Pledging donations, tracking active consignments |
| **Institution Director** | Lakshmi Narayanan | `director@karunaikarangal.org` | `caretrace123` | Karunai Karangal Sanctuary; requirement management, delivery handover |
| **Pickup Agent** | Sakthivel S | `agent.sakthivel@caretrace.org` | `caretrace123` | Chennai field courier; QR pickup scan, transport manifest |
| **Donor (Directory)** | Akash Kumar G | `akash@caretrace.org` | `caretrace123` | Historical donor directory & past medical kit donation |
| **Donor (Directory)** | Karthik V | `karthik@caretrace.org` | `caretrace123` | Historical donor directory & past rice grain donation |

> [!NOTE]  
> **1-Click Demo Switcher:**  
> The web navigation bar includes an instant 1-click Role Switcher allowing quick evaluation of all 4 roles without entering passwords. Real email/password login is also accessible via the "Sign In / Register" button.

### Registering New Accounts (Self-Service)
- **New Donors**: Click **"Sign In / Register"** &rarr; select **"Donor Registration"**. Accounts are activated immediately with a signed JWT session.
- **New Institutions**: Click **"Sign In / Register"** &rarr; select **"Institution Registration"**. Enter sanctuary name, registration/license number, and director details. New institutions start in **Unverified** state (HTTP 403 blocks posting requirements) until approved by Admin Sandeep R in the compliance queue.

---

## 🏃 Running CareTrace Locally

### Prerequisites
- Node.js `v18.x` or higher (tested on Node `v20` / `v24`)
- npm `v9.x` or higher

### 1. Installation & Build
From the monorepo root:
```bash
# 1. Install all dependencies across all packages
npm install

# 2. Build shared types and logic
npm run build:shared

# 3. Build backend
npm run build:backend

# 4. Build web application
npm run build:web
```

### 2. Start Backend REST API
```bash
cd packages/backend
node dist/server.js
# Runs on http://localhost:5000
```
*Optional environment variables:*  
- `PORT`: Server port (default `5000`).  
- `JWT_SECRET`: Secret key for HMAC-SHA256 tokens (defaults to local dev key).

### 3. Start Web Dashboard
```bash
cd packages/web
npx vite --port 5173
# Opens on http://localhost:5173
```

### 4. Start Mobile App (React Native / Expo)
```bash
cd packages/mobile
npx expo start --web --port 8081
# Metro bundler runs on http://localhost:8081
```

#### Mobile Preview Options:
1. **Web Browser (Fastest Preview)**: Press `w` in the Expo terminal or visit `http://localhost:8081`.
2. **Physical Device (Expo Go)**:
   - Download the free **Expo Go** app from Google Play or Apple App Store.
   - Connect your phone to the same Wi-Fi network as your computer.
   - In terminal, start with `npx expo start` and scan the displayed QR code with your phone.
   - In the mobile app header, tap **⚙ API** and set the endpoint to your machine's LAN IP: `http://<YOUR_LOCAL_IP>:5000/api`.
3. **Android Emulator / iOS Simulator**:
   - Press `a` for Android Emulator (preconfigured to `http://10.0.2.2:5000/api`).
   - Press `i` for iOS Simulator (configured to `http://localhost:5000/api`).

---

## 🌐 Live Cloud Deployment (Render)

### Backend API (Render Web Service)
- **Live Backend URL**: `https://caretrace-backend-fluw.onrender.com`
- **Root Healthcheck**: `GET /` &rarr; returns `{ "status": "ok", "service": "CareTrace API", "version": "1.0.0" }`
- **Ledger Verification**: `GET /api/ledger/verify` &rarr; returns `{ "isValid": true, "totalBlocks": 12, ... }`
- **SSE Stream**: `GET /api/events` &rarr; real-time event notifications

> [!NOTE]
> **Render Free-Tier Spin-Up Time:**  
> Render puts free-tier web services into sleep mode after 15 minutes of inactivity. When accessed for the first time, the service may take approximately **~50 seconds to cold-start**. Once awake, all subsequent requests and real-time SSE event streams respond instantly.

### Web Frontend (Render Static Site)
- **Live Frontend URL**: `https://caretrace-web.onrender.com` *(or your assigned Render static site URL)*
- **Build Settings**:
  - **Type**: Static Site
  - **Root Directory**: *(leave blank / empty)*
  - **Build Command**: `npm install && npm run build:shared && npm run build:web`
  - **Publish Directory**: `packages/web/dist`
  - **Environment Variables**: `VITE_API_BASE_URL=https://caretrace-backend-fluw.onrender.com/api`
  - **Redirects / Rewrites**: Type: `Rewrite`, Source: `/*`, Destination: `/index.html`

---

## 🎬 Project Review Presentation Demo Script

Follow this 5-minute walkthrough scenario during project evaluation:

### Step 1: Public Needs Board (No Login Required)
1. Open `http://localhost:5173`.
2. In the top navigation bar, ensure **"Public Needs Board"** is selected.
3. Observe open requirements from verified Chennai sanctuaries (e.g. *Karunai Karangal Foster Sanctuary* in Tambaram, *Anbu Illam* in Ambattur).
4. Use the category filter (click **FOOD**, **MEDICINE**, or **EDUCATION**) and search bar to see instant client-side filtering.
5. Notice the **"Verified by CareTrace Admin"** badges displaying official government NGO registration numbers.

### Step 2: Legal Institution Verification Gate
1. Click **"Sign In / Register"** &rarr; select **"Institution Registration"**.
2. Register a new shelter: *"Asha Nivas Children Home"*, License `TN-CH-2026-9921`, Director *Dr. Meenakshi Sundaram*.
3. Switch into the new Director account: observe the amber warning banner:  
   *"Institution Account Pending Legal Verification: Posting requirements is locked until Admin verifies accreditation."*
4. Use the top role switcher to switch to **Sandeep R (Admin)**.
5. In Admin Dashboard, under **Pending Accreditation Queue**, click **"Verify Institution"** for Asha Nivas.
6. Switch back to Director Meenakshi: posting is now unlocked! Post a new requirement: *"STEM Robotics Kits"* (Qty: 20). It immediately appears on the Public Board.

### Step 3: Pledging & Courier Dispatch
1. Switch role to **Ajith R (Donor)**.
2. Click **"Pledge Donation"** on the STEM Robotics Kits requirement.
3. Enter pickup address in Adyar, Chennai. Consignment `CT-2026-XXXX` is created with status `MATCHED`.
4. Switch to **Sandeep R (Admin)** &rarr; navigate to **"Courier Dispatch & Logistics"** tab.
5. Find the new consignment and assign courier **Sakthivel S**. Status advances to `PICKUP_SCHEDULED`.

### Step 4: Field Courier Pickup (Mobile App or Web)
1. Open the mobile app at `http://localhost:8081` (or Web Operations Portal as **Sakthivel S**).
2. View the active courier manifest: find the assigned consignment.
3. Click **"Confirm Pickup (Scan QR)"** or use the **"⚡ Simulate QR Scan"** button.
4. Status transitions to `IN_TRANSIT`. Ledger block `PICKUP_VERIFIED` is mined with Sakthivel's signature.

### Step 5: Live Transit Telemetry
1. Switch to Donor **Ajith R** in the Web Portal &rarr; open the in-transit donation.
2. View the **Live Transit Map**: watch the delivery vehicle proceed along the GST Road corridor with real-time ETA and speed telemetry.

### Step 6: Sanctuary Handover & Cryptographic Proof
1. Switch role to **Lakshmi Narayanan (Institution Director)**.
2. In the Incoming Deliveries section, click **"Confirm Delivery Handover"**.
3. Enter recipient name and signature.
4. Status updates to `CONFIRMED`.
5. View the newly generated **Proof of Delivery Certificate** sealed with the final cryptographic SHA-256 ledger hash.

### Step 7: Zero-Trust Tamper Detection Demo
1. In the Web Portal, switch to **Sandeep R (Admin)**.
2. Under the Ledger Audit section, click **"Simulate Malicious Block Alteration"** on Block #1.
3. Instantly observe:
   - Real-time red security banner triggered via SSE stream.
   - The chain head hash recalculates and fails parity check.
   - Block explorer highlights the corrupted block index and exact byte discrepancy.
4. Click **"Reset Seed Database"** to restore cryptographic chain integrity.

---

## ⚖️ Known Limitations & Prototype Simplifications

To clearly explain the design boundaries of this prototype build during questions:

1. **SHA-256 Hash Chain vs. Public Blockchain**:
   - *Current Implementation*: A local, append-only cryptographic hash chain where each block contains `blockHash = SHA-256(index + timestamp + donationId + eventType + payloadHash + previousHash + nonce)`.
   - *Production Transition*: For enterprise deployment, this lightweight zero-overhead chain can anchor periodically to a public or consortium ledger (e.g. Polygon, Hyperledger Fabric, or Ethereum L2) via Merkle root anchoring without incurring high per-transaction gas fees.
2. **Simulated GPS / Transit Position**:
   - *Current Implementation*: Transit telemetry and map positions are simulated via route interpolation between pickup and destination coordinates.
   - *Production Transition*: In production, the mobile field app will stream actual background geolocation via standard device GPS location listeners (`expo-location` or background geolocation services).
3. **Frontend JWT Storage (`localStorage`)**:
   - *Current Implementation*: Stored in browser `localStorage` to facilitate multi-role demonstration, rapid persona switching, and session persistence across page refreshes.
   - *Production Transition*: Production web deployments will transition to `SameSite=Strict HttpOnly` secure cookies to prevent client-side XSS token exfiltration.
4. **Shared Demo Password (`caretrace123`)**:
   - *Current Implementation*: All 6 seeded demo accounts share the password `caretrace123` for evaluator convenience.
   - *Production Transition*: Production environments require individual account invitation links, Argon2id hashing, mandatory password complexity, and Multi-Factor Authentication (MFA/TOTP).
