# Isolated Existing System Demo Mode Documentation (IEEE Base Paper)

This document explains the isolated, unlisted **Existing System Demo Dashboard** implemented in CareTrace for Review II college evaluation based on the IEEE base research paper.

---

## 1. Context & Academic Rationale

- **Paper Reference**: *Design and Development of Charity System Model based on Blockchain Technology* by Dias Kamza, Rustam Abdrakhmanov, et al. (IEEE ICPCT 2025).
- **Review II Objective**: The college evaluation panel ("mam") requires a live demonstration of the **Existing System (Base Paper)** in isolation to assess its capabilities and limitations prior to evaluating the proposed CareTrace system.
- **Architectural Isolation**:
  - The CareTrace codebase has full production features implemented (physical goods logistics, courier transit telemetry, ML demand forecasting, fraud risk scoring).
  - To fulfill the reviewer's requirement **without deleting, reverting, or contaminating** the main project, an unlisted, isolated dashboard (`ExistingSystemDashboard.tsx`) has been integrated.
  - When logged into this mode or navigating to the unlisted path, **ONLY the IEEE base paper model is displayed**.
  - Clicking **"Sign Out"** terminates the session, redirects to `/`, and instantly reveals the complete, intact CareTrace platform.

---

## 2. Dedicated Unlisted Entry Points & Credentials

You can enter the Existing System demo in either of two seamless ways:

### Option A: Standard Login Modal (Included in Main Page)
1. Open the CareTrace app (`http://localhost:5173` or live domain).
2. Click **"Sign In"** in the top navigation bar.
3. Enter the unique reviewer credentials:
   - **Email**: `reviewer.basepaper@gmail.com` (or `reviewer@demo.local`)
   - **Password**: `existing123` (or `caretrace123`)
   *(A 1-click helper button `"📜 Review II: Fill Base Paper Account"` is also available at the bottom of the sign-in modal).*
4. Click **Sign In**. The app immediately transitions into the standalone **Existing System Dashboard**.

### Option B: Direct Unlisted URL
Directly visit any of the following URLs in your browser:
- `http://localhost:5173/existing`
- `http://localhost:5173/base-paper`
- `http://localhost:5173/academic-review-2026`

---

## 3. Implemented Base Paper Features (A to Z)

The dashboard faithfully replicates the architecture and workflow detailed in the IEEE ICPCT 2025 paper:

### A. Web 3.0 Ethereum & MetaMask Integration (Figures 7 & 8)
- Displays active MetaMask connection banner:
  - **Connected Account**: `0xFe17329E4DaB3c6A...721d9`
  - **Network**: `Ethereum Sepolia Testnet`
  - **Balance**: `0.8669 SepoliaETH`
- Interactive **"Donate SepoliaETH"** button on each campaign:
  - Opens simulated **MetaMask Notification Popup** with Gas Fee estimation, Max Priority Fee, Total ETH calculation.
  - Clicking **"Confirm"** triggers Sepolia block mining with loading spinner $\rightarrow$ generates transaction hash and updates campaign raised balance in real-time.

### B. Campaigns & Fundraising Home Page (Figure 4)
- Features the base paper's official motto: *"If you are wide, you will not be less"*.
- Displays verified Ethereum charity campaigns with:
  - Smart Contract Address (`0x...`)
  - IPFS Content Identifier (CID `Qm...`)
  - Target vs. Raised SepoliaETH progress bar
  - Backer count and deadline countdown in days
  - Milestone Escrow Release status

### C. Create Smart Contract Campaign (Figure 5)
- Dedicated form allowing organizers to deploy a new campaign contract:
  - Campaign Title, Beneficiary Name, Category
  - Target Funding Goal (in Sepolia ETH)
  - Campaign Duration / Deadline (in days)
  - IPFS Hash for decentralized media/documentation storage
- Submitting the form simulates Ethereum smart contract deployment, generates a contract address, and adds the campaign to the live registry.

### D. Smart Contract Transaction Explorer
- Read-only table of confirmed on-chain transactions:
  - Transaction Hash (`0x...`)
  - Block Number & Timestamp
  - Origin (`From`) and Contract (`To`) addresses
  - Transferred ETH value & Gas fees paid
  - Execution Status (`SUCCESS`)

### E. Comparative Analysis Matrix (Table 1)
- Side-by-side comparison between the Base Paper System (Dias Kamza et al., 2025) and Proposed CareTrace (2026):
  - **Asset Modality**: Cryptocurrency Only vs. Physical Goods & Fiat (₹)
  - **Supply Chain**: None vs. Multi-Stage Courier Chain-of-Custody
  - **Delivery Verification**: None vs. Cryptographic Geo-Fenced QR Proof-of-Delivery
  - **Fraud Defense**: Self-governed vs. Multi-Agent ML Fraud & Authenticity Scoring
  - **Tax Compliance**: None vs. Section 80G Compliant Digital Receipts
  - **Network Overhead**: High Gas Fees vs. Scalable Dual-Ledger Architecture

---

## 4. Zero Disturbance & Safe Return Guarantee

- When in Existing System mode, no CareTrace logos, ML charts, or Indian orphanage listings are shown.
- Clicking the **"Sign Out"** or **"Exit to CareTrace"** button:
  1. Wipes the reviewer session token from client storage.
  2. Resets the application state to unauthenticated guest mode.
  3. Re-routes the browser URL to `/`.
  4. Restores the full, complete CareTrace production application immediately.
