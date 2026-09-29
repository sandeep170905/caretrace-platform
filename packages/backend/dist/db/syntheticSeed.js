"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSynthetic = seedSynthetic;
const database_1 = require("./database");
const ledgerService_1 = require("../services/ledgerService");
const qrService_1 = require("../services/qrService");
const authService_1 = require("../services/authService");
const shared_1 = require("@caretrace/shared");
const mlRiskService_1 = require("../services/mlRiskService");
/**
 * Seeded Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% deterministic, reproducible synthetic datasets.
 */
class SeededRNG {
    s;
    constructor(seed = 20260928) {
        this.s = seed;
    }
    next() {
        let t = (this.s += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    randInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
    shuffle(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
}
const rng = new SeededRNG(20260928);
// -------------------------------------------------------------
// 1. TAMIL NAMES & PERSONAS (~40 Donors, mix of men and women)
// -------------------------------------------------------------
const TAMIL_DONOR_NAMES = [
    // Men (20)
    'Arun Kumar',
    'Meenakshi Sundaram',
    'Senthil Murugan',
    'Vignesh Babu',
    'Karthikeyan P',
    'Bharathi Selvam',
    'Saravanan Natarajan',
    'Anbuchelvan K',
    'Ilango Krishnan',
    'Vetrivel Pandian',
    'Muthukumar S',
    'Balaji Srinivasan',
    'Thangavel Murugesan',
    'Manikandan R',
    'Sridhar Radhakrishnan',
    'Dinakaran V',
    'Prabhakaran M',
    'Rajesh Kannan',
    'Gokulnath B',
    'Vijay Anand',
    // Women (20)
    'Kavitha Rajan',
    'Priya Dharshini',
    'Lakshmi Priya',
    'Deepa Venkatesh',
    'Bhuvaneshwari K',
    'Soundarya Ramasamy',
    'Revathi Subramanian',
    'Malathi Gopal',
    'Uma Maheshwari',
    'Vidhya Chandran',
    'Subhashini M',
    'Nithya Kalyani',
    'Gayathri Devi',
    'Shalini Sundar',
    'Abirami Natarajan',
    'Radhika Swaminathan',
    'Hemamalini S',
    'Jayashree R',
    'Suganya T',
    'Archana Ravichandran'
];
const INSTITUTION_BLUEPRINTS = [
    {
        id: 'syn-inst-amudham',
        name: "Amudham Children's Illam",
        locality: 'Tambaram',
        address: '14 Gandhi Road, West Tambaram',
        postalCode: '600045',
        lat: 12.9249,
        lng: 80.1000,
        capacity: 65,
        currentChildren: 58,
        verified: true,
        directorName: 'Dr. Senthil Nathan',
        phone: '+91 44 2226 0101'
    },
    {
        id: 'syn-inst-thendral',
        name: 'Thendral Sanctuary & Home',
        locality: 'Ambattur',
        address: '88 CTH Road, Ambattur OT',
        postalCode: '600053',
        lat: 13.0983,
        lng: 80.1620,
        capacity: 50,
        currentChildren: 46,
        verified: true,
        directorName: 'Sister V. Revathi',
        phone: '+91 44 2658 0202'
    },
    {
        id: 'syn-inst-nambikkai',
        name: 'Nambikkai Youth Shelter',
        locality: 'Adyar',
        address: '23 Lattice Bridge Road, Adyar',
        postalCode: '600020',
        lat: 13.0012,
        lng: 80.2565,
        capacity: 40,
        currentChildren: 35,
        verified: true,
        directorName: 'K. Ramanathan',
        phone: '+91 44 2441 0303'
    },
    {
        id: 'syn-inst-malar',
        name: "Malar Children's Foundation",
        locality: 'Velachery',
        address: '5 Bypass Road, Velachery',
        postalCode: '600042',
        lat: 12.9759,
        lng: 80.2212,
        capacity: 55,
        currentChildren: 50,
        verified: true,
        directorName: 'Dr. V. Malathi',
        phone: '+91 44 2243 0404'
    },
    {
        id: 'syn-inst-oli',
        name: 'Oli Illam Foster Care',
        locality: 'T. Nagar',
        address: '47 South Usman Road, T. Nagar',
        postalCode: '600017',
        lat: 13.0418,
        lng: 80.2341,
        capacity: 45,
        currentChildren: 42,
        verified: true,
        directorName: 'S. Ganesan',
        phone: '+91 44 2434 0505'
    },
    {
        id: 'syn-inst-kavalar',
        name: 'Kavalar Juvenile Home',
        locality: 'Anna Nagar',
        address: '12 2nd Avenue, Anna Nagar West',
        postalCode: '600040',
        lat: 13.0850,
        lng: 80.2101,
        capacity: 70,
        currentChildren: 64,
        verified: true,
        directorName: 'T. Baskaran',
        phone: '+91 44 2621 0606'
    },
    {
        id: 'syn-inst-vaigai',
        name: "Vaigai Children's Refuge",
        locality: 'Porur',
        address: '3 Kundrathur Main Road, Porur',
        postalCode: '600116',
        lat: 13.0359,
        lng: 80.1567,
        capacity: 40,
        currentChildren: 37,
        verified: true,
        directorName: 'M. Senthamarai',
        phone: '+91 44 2482 0707'
    },
    {
        id: 'syn-inst-sudamathi',
        name: 'Sudamathi Anbu Home',
        locality: 'Perambur',
        address: '19 Paper Mills Road, Perambur',
        postalCode: '600011',
        lat: 13.1075,
        lng: 80.2435,
        capacity: 60,
        currentChildren: 52,
        verified: true,
        directorName: 'P. Chandrasekar',
        phone: '+91 44 2551 0808'
    },
    {
        id: 'syn-inst-thamirabarani',
        name: 'Thamirabarani Care Sanctuary',
        locality: 'Sholinganallur',
        address: '8 Rajiv Gandhi Salai (OMR), Sholinganallur',
        postalCode: '600119',
        lat: 12.9010,
        lng: 80.2279,
        capacity: 45,
        currentChildren: 40,
        verified: true,
        directorName: 'Dr. A. Meenalochani',
        phone: '+91 44 2450 0909'
    },
    {
        id: 'syn-inst-senthamizh',
        name: "Senthamizh Children's Home",
        locality: 'Guindy',
        address: '34 GST Road, Guindy',
        postalCode: '600032',
        lat: 13.0067,
        lng: 80.2025,
        capacity: 50,
        currentChildren: 44,
        verified: true,
        directorName: 'K. Rajendran',
        phone: '+91 44 2235 1010'
    },
    {
        id: 'syn-inst-magizhchi',
        name: 'Magizhchi Youth Home',
        locality: 'Avadi',
        address: '11 HVF Road, Avadi',
        postalCode: '600054',
        lat: 13.1147,
        lng: 80.0982,
        capacity: 35,
        currentChildren: 28,
        verified: false, // Pending verification
        directorName: 'V. Elangovan',
        phone: '+91 44 2638 1111'
    },
    {
        id: 'syn-inst-poonjolai',
        name: 'Poonjolai Foster Shelter',
        locality: 'Pallavaram',
        address: '27 Station Road, Pallavaram',
        postalCode: '600043',
        lat: 12.9675,
        lng: 80.1491,
        capacity: 30,
        currentChildren: 22,
        verified: false, // Pending verification
        directorName: 'S. Ponmudi',
        phone: '+91 44 2264 1212'
    }
];
// -------------------------------------------------------------
// 3. PICKUP AGENTS (5 Zonal Chennai Logistics Field Agents)
// -------------------------------------------------------------
const PICKUP_AGENT_BLUEPRINTS = [
    { id: 'syn-agent-selva', name: 'Selvakumar K', zone: 'North Zone (Ambattur, Perambur, Avadi)' },
    { id: 'syn-agent-murugan', name: 'Murugavel T', zone: 'Central Zone (T. Nagar, Anna Nagar, Kodambakkam)' },
    { id: 'syn-agent-dhana', name: 'Dhanasekaran P', zone: 'South Zone (Adyar, Velachery, Guindy)' },
    { id: 'syn-agent-kannan', name: 'Kannan M', zone: 'Southwest Zone (Tambaram, Pallavaram, Porur)' },
    { id: 'syn-agent-aravind', name: 'Aravindhan S', zone: 'IT Corridor Zone (Sholinganallur, OMR)' }
];
// Authentic Indian/Chennai Orphanage Needs Catalog (Groceries, First-Aid, Used/New Dresses, Stationery, Toiletries)
const ITEM_TEMPLATES = [
    // EDUCATION (Peaks in May-June for school reopening)
    { category: 'EDUCATION', title: 'Classmate Long Ruled Notebooks (192 pgs - Pack of 12)', unit: 'packs', baseQty: [35, 90], unitValInr: 360, seasonMonths: [4, 5, 6] },
    { category: 'EDUCATION', title: 'Classmate Four-Line & Square Ruled Primary Notebooks', unit: 'packs', baseQty: [30, 70], unitValInr: 300, seasonMonths: [4, 5, 6] },
    { category: 'EDUCATION', title: 'Camlin Mathematical Geometry Boxes & Exam Writing Pads', unit: 'kits', baseQty: [25, 60], unitValInr: 220, seasonMonths: [4, 5, 6] },
    { category: 'EDUCATION', title: 'Apsara Pencil Bundles, Erasers & Camlin Blue Ball Pens', unit: 'boxes', baseQty: [30, 80], unitValInr: 240, seasonMonths: [4, 5, 6, 7] },
    { category: 'EDUCATION', title: 'Durable School Backpacks & Stainless Steel Water Bottles', unit: 'sets', baseQty: [20, 50], unitValInr: 580, seasonMonths: [4, 5, 6] },
    { category: 'EDUCATION', title: 'Tamil & English Illustrated Moral Story Books & Workbooks', unit: 'bundles', baseQty: [15, 40], unitValInr: 350, seasonMonths: [0, 4, 5, 8] },
    // CLOTHING & WEAR (Gently used daily wear, school uniforms, linen)
    { category: 'CLOTHING', title: 'Gently Used Daily Wear Dresses & Frocks (Girls 4-14 yrs)', unit: 'bundles', baseQty: [25, 65], unitValInr: 350, seasonMonths: [1, 3, 5, 7] },
    { category: 'CLOTHING', title: 'Gently Used Cotton T-Shirts & Bermuda Shorts (Boys 4-14 yrs)', unit: 'bundles', baseQty: [25, 65], unitValInr: 350, seasonMonths: [1, 3, 5, 7] },
    { category: 'CLOTHING', title: 'Stitched School Uniform Sets (Navy Blue & White)', unit: 'pairs', baseQty: [30, 80], unitValInr: 520, seasonMonths: [4, 5, 6] },
    { category: 'CLOTHING', title: 'Pure Cotton Bedsheets & Pillow Covers (Hostel Cots)', unit: 'sets', baseQty: [20, 60], unitValInr: 320, seasonMonths: [9, 10, 11, 0] },
    { category: 'CLOTHING', title: 'Cotton Bath Towels (Thorthu / Gamcha) 10-Packs', unit: 'packs', baseQty: [20, 50], unitValInr: 420, seasonMonths: [3, 4, 8, 9] },
    { category: 'CLOTHING', title: 'Paragon / Relaxo Rubber Slippers & Chappals', unit: 'pairs', baseQty: [30, 75], unitValInr: 160, seasonMonths: [4, 5, 6, 7] },
    { category: 'CLOTHING', title: 'Warm Cotton Blankets & Quilted Shawls (Winter/Monsoon)', unit: 'pieces', baseQty: [25, 60], unitValInr: 420, seasonMonths: [9, 10, 11, 0] },
    // FOOD & GROCERIES (Chennai/Tamil Nadu Orphanage & Illam daily provisions)
    { category: 'FOOD', title: 'Ponni Boiled Rice Sacks (25kg Bags)', unit: 'bags', baseQty: [20, 50], unitValInr: 1350, seasonMonths: [0, 9, 10, 11] },
    { category: 'FOOD', title: 'Toor Dal & Sunflower Cooking Oil (15L Tins)', unit: 'combos', baseQty: [15, 35], unitValInr: 2100, seasonMonths: [0, 8, 9, 10] },
    { category: 'FOOD', title: 'Chakki Fresh Atta & Semiya / Rava Vermicelli', unit: 'bundles', baseQty: [20, 45], unitValInr: 650, seasonMonths: [0, 2, 6, 8] },
    { category: 'FOOD', title: 'Aachi / Sakthi Sambar Masala & Turmeric Packs', unit: 'packs', baseQty: [25, 60], unitValInr: 450, seasonMonths: [0, 1, 6, 10] },
    { category: 'FOOD', title: 'Aavin Milk Powder & Parle-G / Marie Biscuit Cartons', unit: 'cartons', baseQty: [30, 80], unitValInr: 580, seasonMonths: [1, 4, 7, 10] },
    { category: 'FOOD', title: 'Sundal Kala Chana, Green Moong & Groundnut Packs', unit: 'packs', baseQty: [20, 50], unitValInr: 520, seasonMonths: [2, 5, 8, 11] },
    { category: 'FOOD', title: 'Pongal Festival Grocery Kit (Raw Rice, Jaggery, Ghee & Cashews)', unit: 'kits', baseQty: [25, 60], unitValInr: 950, seasonMonths: [0, 11] },
    // MEDICINE & FIRST-AID (Dispensary essentials for children's homes)
    { category: 'MEDICINE', title: 'Dispensary First-Aid Kit (Dettol 500ml, Cotton Rolls & Band-Aids)', unit: 'kits', baseQty: [15, 40], unitValInr: 480, seasonMonths: [5, 6, 8, 9, 10] },
    { category: 'MEDICINE', title: 'Dolo-650 Tablets & Paracetamol Pediatric Fever Syrups', unit: 'boxes', baseQty: [25, 60], unitValInr: 320, seasonMonths: [6, 8, 9, 10, 11] },
    { category: 'MEDICINE', title: 'Electral ORS Sachets & Zinc Drops (Monsoon Care)', unit: 'packs', baseQty: [30, 75], unitValInr: 350, seasonMonths: [1, 3, 6, 9] },
    { category: 'MEDICINE', title: 'GoodKnight Liquid Vaporizers & Mosquito Coil Packs', unit: 'packs', baseQty: [20, 50], unitValInr: 280, seasonMonths: [8, 9, 10, 11, 0] },
    { category: 'MEDICINE', title: 'Moov / Volini Pain Relief Balm & Crepe Bandage Rolls', unit: 'packs', baseQty: [15, 40], unitValInr: 320, seasonMonths: [5, 7, 9, 11] },
    // SUPPLIES & HYGIENE (Monthly sanitary & toiletries)
    { category: 'SUPPLIES', title: 'Medimix / Lifebuoy Bath Soap Family Packs (Pack of 12)', unit: 'packs', baseQty: [25, 60], unitValInr: 320, seasonMonths: [2, 5, 8, 11] },
    { category: 'SUPPLIES', title: 'Surf Excel / Rin Washing Powder & Detergent Bars', unit: 'combos', baseQty: [20, 50], unitValInr: 440, seasonMonths: [1, 4, 7, 10] },
    { category: 'SUPPLIES', title: 'Parachute 100% Pure Coconut Hair Oil (500ml Bottles)', unit: 'bottles', baseQty: [20, 50], unitValInr: 190, seasonMonths: [0, 3, 6, 9] },
    { category: 'SUPPLIES', title: 'Colgate Strong Toothpaste & Toothbrush Family Combos', unit: 'combos', baseQty: [25, 60], unitValInr: 250, seasonMonths: [2, 5, 8, 11] },
    { category: 'SUPPLIES', title: 'Whisper / Stayfree Sanitary Napkin Multi-Packs', unit: 'packs', baseQty: [35, 80], unitValInr: 220, seasonMonths: [0, 3, 6, 9] }
];
async function seedSynthetic() {
    console.log('⚡ Starting CareTrace Synthetic Dataset Generation (Idempotent)...');
    await database_1.db.init();
    // 1. Wipe previous synthetic records first for strict idempotence
    await database_1.db.clearSyntheticData();
    const demoPasswordHash = authService_1.AuthService.hashPassword('caretrace123');
    // -------------------------------------------------------------
    // STEP 1: Insert Donors (~40)
    // -------------------------------------------------------------
    const donors = [];
    for (let i = 0; i < TAMIL_DONOR_NAMES.length; i++) {
        const name = TAMIL_DONOR_NAMES[i];
        const slug = name.toLowerCase().replace(/[^a-z]/g, '.');
        const id = `syn-donor-${String(i + 1).padStart(2, '0')}`;
        const donor = {
            id,
            name,
            email: `${slug}@synthetic.caretrace.test`,
            role: 'DONOR',
            phone: `+91 9${rng.randInt(700000000, 999999999)}`,
            avatar: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=150&auto=format&fit=crop&q=80`,
            passwordHash: demoPasswordHash,
            createdAt: new Date(Date.now() - (280 - i * 5) * 86400000).toISOString(),
            isSynthetic: true
        };
        donors.push(donor);
        await database_1.db.upsertUser(donor);
    }
    console.log(`✅ Seeded ${donors.length} synthetic Tamil donors.`);
    // -------------------------------------------------------------
    // STEP 2: Insert Institutions & Directors (~12)
    // -------------------------------------------------------------
    const institutions = [];
    const directors = [];
    for (let i = 0; i < INSTITUTION_BLUEPRINTS.length; i++) {
        const bp = INSTITUTION_BLUEPRINTS[i];
        const inst = {
            id: bp.id,
            name: bp.name,
            registrationNumber: `SYN-TN-CH-2026-${String(i + 1).padStart(4, '0')}`,
            taxId: `SYN-12AA-TN-${String(9000 + i)}`,
            address: bp.address,
            city: 'Chennai',
            state: 'Tamil Nadu',
            postalCode: bp.postalCode,
            latitude: bp.lat,
            longitude: bp.lng,
            capacity: bp.capacity,
            currentChildrenCount: bp.currentChildren,
            verified: bp.verified,
            verificationDate: bp.verified ? '2024-03-15T09:00:00.000Z' : undefined,
            trustScore: bp.verified ? rng.randInt(82, 98) : rng.randInt(35, 55),
            contactEmail: `contact.${bp.id.replace('syn-inst-', '')}@synthetic.caretrace.test`,
            contactPhone: bp.phone,
            description: `Fictional child-care sanctuary situated in ${bp.locality}, Chennai, caring for ${bp.currentChildren} resident children.`,
            website: `https://${bp.id.replace('syn-inst-', '')}.synthetic.caretrace.test`,
            isSynthetic: true
        };
        institutions.push(inst);
        await database_1.db.upsertInstitution(inst);
        // Director User Account
        const dirSlug = bp.directorName.toLowerCase().replace(/[^a-z]/g, '.');
        const dirUser = {
            id: `syn-dir-${String(i + 1).padStart(2, '0')}`,
            name: bp.directorName,
            email: `${dirSlug}@synthetic.caretrace.test`,
            role: 'INSTITUTION',
            phone: bp.phone,
            institutionId: bp.id,
            avatar: `https://images.unsplash.com/photo-${1530000000000 + i * 50000}?w=150&auto=format&fit=crop&q=80`,
            passwordHash: demoPasswordHash,
            createdAt: '2024-01-10T08:00:00.000Z',
            isSynthetic: true
        };
        directors.push(dirUser);
        await database_1.db.upsertUser(dirUser);
    }
    console.log(`✅ Seeded ${institutions.length} synthetic institutions & ${directors.length} director accounts.`);
    // -------------------------------------------------------------
    // STEP 3: Insert Pickup Agents (5)
    // -------------------------------------------------------------
    const agents = [];
    for (let i = 0; i < PICKUP_AGENT_BLUEPRINTS.length; i++) {
        const bp = PICKUP_AGENT_BLUEPRINTS[i];
        const slug = bp.name.toLowerCase().replace(/[^a-z]/g, '.');
        const agent = {
            id: bp.id,
            name: bp.name,
            email: `${slug}@synthetic.caretrace.test`,
            role: 'PICKUP_AGENT',
            phone: `+91 9444${String(rng.randInt(100000, 999999))}`,
            avatar: `https://images.unsplash.com/photo-${1520000000000 + i * 40000}?w=150&auto=format&fit=crop&q=80`,
            passwordHash: demoPasswordHash,
            createdAt: '2024-02-01T08:00:00.000Z',
            isSynthetic: true
        };
        agents.push(agent);
        await database_1.db.upsertUser(agent);
    }
    console.log(`✅ Seeded ${agents.length} synthetic pickup agents.`);
    // -------------------------------------------------------------
    // STEP 4: Generate Requirements (~60) with Real Seasonality
    // -------------------------------------------------------------
    const requirements = [];
    let reqCounter = 1;
    // 9-month timeframe spanning ~270 days ago (mid-May 2025) to ~5 days ago (Feb 2026)
    const nowMs = Date.now();
    const DAY_MS = 86400000;
    for (const inst of institutions) {
        // Generate 4 to 6 requirements per institution
        const reqCountForInst = inst.verified ? rng.randInt(4, 6) : rng.randInt(2, 4);
        for (let r = 0; r < reqCountForInst; r++) {
            const template = rng.pick(ITEM_TEMPLATES);
            const targetQuantity = rng.randInt(template.baseQty[0], template.baseQty[1]);
            // Pick a creation timestamp that respects seasonality preference if possible
            let daysAgo = rng.randInt(10, 270);
            const approxDate = new Date(nowMs - daysAgo * DAY_MS);
            const month = approxDate.getMonth();
            if (!template.seasonMonths.includes(month) && rng.next() > 0.35) {
                // Bias towards seasonal month
                const targetMonth = rng.pick(template.seasonMonths);
                const monthDiff = (month - targetMonth + 12) % 12;
                daysAgo = Math.min(270, Math.max(5, daysAgo + monthDiff * 30));
            }
            const createdAt = new Date(nowMs - daysAgo * DAY_MS).toISOString();
            const reqId = `SYN-REQ-${String(reqCounter++).padStart(4, '0')}`;
            // Urgency distribution
            let urgency = 'MEDIUM';
            const uRoll = rng.next();
            if (uRoll < 0.25)
                urgency = 'CRITICAL';
            else if (uRoll < 0.55)
                urgency = 'HIGH';
            else if (uRoll < 0.85)
                urgency = 'MEDIUM';
            else
                urgency = 'LOW';
            // Partial requirement model for fraud & ML evaluation
            const partialReq = {
                id: reqId,
                institutionId: inst.id,
                category: template.category,
                title: template.title,
                description: `Essential requisition of ${targetQuantity} ${template.unit} of ${template.title} for resident children at ${inst.name}, ${inst.address}. Verified by the home management committee.`,
                targetQuantity,
                unit: template.unit,
                urgency,
                createdAt
            };
            // Heuristic Fraud Scoring
            const scoringResult = shared_1.RequirementScorer.evaluateRequirement(partialReq, inst, r);
            // ML Logistic Regression Scoring
            const mlResult = mlRiskService_1.MLRiskService.predictRisk(partialReq, inst, requirements);
            // Status determination
            let status = 'VERIFIED';
            if (!inst.verified) {
                status = rng.next() > 0.4 ? 'PENDING' : 'VERIFIED';
            }
            const req = {
                id: reqId,
                institutionId: inst.id,
                institutionName: inst.name,
                category: template.category,
                title: template.title,
                description: partialReq.description,
                targetQuantity,
                unit: template.unit,
                fulfilledQuantity: 0, // will be updated when donations match
                urgency,
                status,
                authenticityScore: scoringResult.score,
                mlRiskScore: mlResult.mlRiskScore,
                mlRiskTier: mlResult.mlRiskTier,
                riskFlags: scoringResult.flags,
                documents: [
                    {
                        id: `doc-${reqId}-1`,
                        name: 'Institution_Requisition_Order.pdf',
                        url: `https://docs.caretrace.test/${reqId}/requisition.pdf`,
                        type: 'PDF',
                        uploadedAt: createdAt
                    }
                ],
                createdAt,
                updatedAt: createdAt,
                isSynthetic: true
            };
            // Record any generated risk flags to risk_audit_logs
            for (const flag of scoringResult.flags) {
                await database_1.db.addRiskAuditLog({
                    ...flag,
                    isSynthetic: true
                });
            }
            requirements.push(req);
            await database_1.db.upsertRequirement(req);
        }
    }
    console.log(`✅ Seeded ${requirements.length} synthetic requirements with genuine fraud & ML risk scoring.`);
    // -------------------------------------------------------------
    // STEP 5: Generate Donations (~150) with Varied Donor Behaviors
    // -------------------------------------------------------------
    // Assign donor behavioral profiles to enable rich k-means segmentation in Prompt 2:
    // - Top 3: Champions (12–18 donations across categories)
    // - Next 10: Regulars (5–8 donations)
    // - Next 15: Occasional (2–3 donations)
    // - Remaining 12: Lapsed / One-time (1 donation 6–9 months ago)
    const donorPlan = [];
    for (let i = 0; i < donors.length; i++) {
        if (i < 3) {
            donorPlan.push({ donor: donors[i], targetCount: rng.randInt(12, 18) });
        }
        else if (i < 13) {
            donorPlan.push({ donor: donors[i], targetCount: rng.randInt(5, 8) });
        }
        else if (i < 28) {
            donorPlan.push({ donor: donors[i], targetCount: rng.randInt(2, 3) });
        }
        else {
            donorPlan.push({ donor: donors[i], targetCount: 1, isLapsed: true });
        }
    }
    const donations = [];
    let donationCounter = 1;
    const queuedCheckpoints = [];
    const CHENNAI_RESIDENTIAL_AREAS = [
        'Anna Nagar West, 4th Main Road',
        'T. Nagar, Near Panagal Park',
        'Mylapore, Near Kapaleeshwarar Temple',
        'Adyar, Gandhi Nagar 2nd Crescent',
        'Besant Nagar, 4th Avenue',
        'Velachery, Dhandeeswaram Nagar',
        'Kilpauk, Garden Road',
        'Nungambakkam, Sterling Road',
        'Alwarpet, TTK Road',
        'Thiruvanmiyur, Valmiki Nagar',
        'Kodambakkam, Station Road',
        'Perambur, Paper Mills Road',
        'Porur, Mount-Poonamallee High Road',
        'Tambaram East, Selaiyur',
        'Pallavaram, Zamin Royapet',
        'Ambattur OT, CTH Road',
        'Sholinganallur, OMR'
    ];
    // Include demo field courier Sakthivel S so his manifest has rich active consignments
    const candidateAgents = [
        { id: 'user-agent-sakthivel', name: 'Sakthivel S' },
        ...agents.map(a => ({ id: a.id, name: a.name }))
    ];
    for (const plan of donorPlan) {
        const { donor, targetCount, isLapsed } = plan;
        for (let c = 0; c < targetCount; c++) {
            // Pick a requirement that was created before the donation
            const eligibleReqs = requirements.filter(r => r.status !== 'REJECTED');
            const req = rng.pick(eligibleReqs);
            const reqCreatedAtMs = new Date(req.createdAt).getTime();
            // Determine donation timestamp
            let donCreatedAtMs;
            if (isLapsed) {
                // Lapsed donors donated 180 to 260 days ago
                donCreatedAtMs = Math.max(reqCreatedAtMs + 86400000, nowMs - rng.randInt(180, 260) * DAY_MS);
            }
            else {
                // Active / recent donors spread across req lifetime
                const minTime = reqCreatedAtMs + 3600000;
                donCreatedAtMs = Math.min(nowMs - 3600000, minTime + rng.next() * (nowMs - minTime));
            }
            const donCreatedAt = new Date(donCreatedAtMs).toISOString();
            const donationId = `SYN-CT-2026-${String(donationCounter++).padStart(4, '0')}`;
            const isMonetary = rng.next() < 0.08; // ~8% monetary contributions
            const agent = rng.pick(candidateAgents);
            // Lifecycle status: most older donations are CONFIRMED, recent may be IN_TRANSIT, PICKUP_SCHEDULED, MATCHED
            const ageHours = (nowMs - donCreatedAtMs) / 3600000;
            let status = 'CONFIRMED';
            if (isMonetary) {
                status = 'CONFIRMED';
            }
            else if (ageHours < 24) {
                const sRoll = rng.next();
                if (sRoll < 0.25)
                    status = 'MATCHED';
                else if (sRoll < 0.55)
                    status = 'PICKUP_SCHEDULED';
                else
                    status = 'IN_TRANSIT';
            }
            else if (ageHours < 72) {
                status = rng.next() < 0.4 ? 'IN_TRANSIT' : 'CONFIRMED';
            }
            // Quantity & value
            const pledgedQty = isMonetary ? 1 : Math.min(req.targetQuantity, rng.randInt(5, 25));
            req.fulfilledQuantity = Math.min(req.targetQuantity, req.fulfilledQuantity + pledgedQty);
            if (req.fulfilledQuantity >= req.targetQuantity) {
                req.status = 'FULFILLED';
            }
            const estimatedValueInr = isMonetary
                ? rng.pick([5000, 10000, 15000, 25000, 50000, 75000])
                : pledgedQty * rng.randInt(150, 600);
            const items = [
                {
                    name: req.title,
                    quantity: pledgedQty,
                    unit: isMonetary ? 'INR' : req.unit,
                    estimatedValueInr
                }
            ];
            // Timestamps for lifecycle events
            const pickupMs = donCreatedAtMs + rng.randInt(6, 24) * 3600000;
            const deliveryMs = pickupMs + rng.randInt(12, 48) * 3600000;
            const pickupTimestamp = ['PICKED_UP', 'IN_TRANSIT', 'CONFIRMED'].includes(status)
                ? new Date(pickupMs).toISOString()
                : undefined;
            const deliveryTimestamp = status === 'CONFIRMED'
                ? new Date(deliveryMs).toISOString()
                : undefined;
            const inst = institutions.find(i => i.id === req.institutionId);
            const don = {
                id: donationId,
                donorId: donor.id,
                donorName: donor.name,
                donorEmail: donor.email,
                requirementId: req.id,
                requirementTitle: req.title,
                institutionId: inst.id,
                institutionName: inst.name,
                type: isMonetary ? 'FUNDS' : 'PHYSICAL_GOODS',
                items,
                status,
                pickupAgentId: isMonetary ? undefined : agent.id,
                pickupAgentName: isMonetary ? undefined : agent.name,
                pickupAddress: `Flat ${rng.randInt(1, 12)}B, ${donor.name} Res., ${rng.pick(CHENNAI_RESIDENTIAL_AREAS)}, Chennai`,
                destinationAddress: `${inst.address}, ${inst.city}, ${inst.state}`,
                pickupCoordinates: { latitude: inst.latitude + (rng.next() - 0.5) * 0.05, longitude: inst.longitude + (rng.next() - 0.5) * 0.05 },
                destinationCoordinates: { latitude: inst.latitude, longitude: inst.longitude },
                currentCoordinates: status === 'IN_TRANSIT'
                    ? { latitude: inst.latitude + 0.015, longitude: inst.longitude + 0.012 }
                    : { latitude: inst.latitude, longitude: inst.longitude },
                qrCodePayload: qrService_1.QRService.createPayloadString(donationId, donor.id, inst.id),
                pickupTimestamp,
                deliveryTimestamp,
                confirmationNotes: status === 'CONFIRMED'
                    ? `Consignment inspected and received in good condition at ${inst.name}. Stocked in child-care store room.`
                    : undefined,
                recipientSignature: status === 'CONFIRMED'
                    ? `DIGITAL_SIG:${inst.id.toUpperCase()}:${donationId}`
                    : undefined,
                proofPhotoUrl: status === 'CONFIRMED' && rng.next() > 0.3
                    ? 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80'
                    : undefined,
                monetaryAmountInr: isMonetary ? estimatedValueInr : undefined,
                receiptNumber: isMonetary ? `SYN-80G-2026-${String(rng.randInt(10000, 99999))}` : undefined,
                paymentMethod: isMonetary ? 'UPI' : undefined,
                upiTransactionId: isMonetary ? `SYN-UPI-${rng.randInt(10000000, 99999999)}@okaxis` : undefined,
                createdAt: donCreatedAt,
                updatedAt: deliveryTimestamp || pickupTimestamp || donCreatedAt,
                isSynthetic: true
            };
            donations.push(don);
            await database_1.db.upsertDonation(don);
            // Telemetry for active in-transit consignment
            if (status === 'IN_TRANSIT') {
                await database_1.db.upsertTransitTelemetry({
                    donationId,
                    latitude: inst.latitude + 0.015,
                    longitude: inst.longitude + 0.012,
                    currentAddress: `In Transit near ${inst.address}, dispatched by ${agent.name}`,
                    speedKmh: rng.randInt(30, 48),
                    estimatedArrivalMinutes: rng.randInt(12, 35),
                    progressPercentage: rng.randInt(40, 75),
                    lastUpdated: new Date().toISOString(),
                    isSynthetic: true
                });
            }
            // ---------------------------------------------------------
            // Queue Ledger Checkpoints for this donation
            // ---------------------------------------------------------
            if (isMonetary) {
                queuedCheckpoints.push({
                    donationId,
                    eventType: 'DONATION_MATCHED',
                    actor: { id: donor.id, role: 'DONOR', name: donor.name },
                    details: `${donor.name} initiated cryptographic contribution of ₹${estimatedValueInr.toLocaleString('en-IN')} to ${inst.name}.`,
                    payload: { monetaryAmountInr: estimatedValueInr },
                    timestamp: donCreatedAt
                });
                queuedCheckpoints.push({
                    donationId,
                    eventType: 'MONETARY_DONATION_CONFIRMED',
                    actor: { id: 'SYSTEM', role: 'SYSTEM', name: 'Compliance Engine' },
                    details: `Direct contribution of ₹${estimatedValueInr.toLocaleString('en-IN')} settled & 80G tax receipt anchored on ledger.`,
                    payload: { receiptNumber: don.receiptNumber, upiTransactionId: don.upiTransactionId },
                    timestamp: new Date(donCreatedAtMs + 180000).toISOString()
                });
            }
            else {
                // 1. DONATION_MATCHED (always)
                queuedCheckpoints.push({
                    donationId,
                    eventType: 'DONATION_MATCHED',
                    actor: { id: donor.id, role: 'DONOR', name: donor.name },
                    details: `${donor.name} matched pledge of ${pledgedQty} ${req.unit} ${req.title} to ${inst.name}.`,
                    payload: { itemsCount: pledgedQty, estimatedValueInr },
                    timestamp: donCreatedAt
                });
                // 2. PICKUP_VERIFIED
                if (pickupTimestamp) {
                    queuedCheckpoints.push({
                        donationId,
                        eventType: 'PICKUP_VERIFIED',
                        actor: { id: agent.id, role: 'PICKUP_AGENT', name: agent.name },
                        details: `Courier ${agent.name} verified and scanned consignment QR at origin depot.`,
                        payload: { agentId: agent.id, pickupAddress: don.pickupAddress },
                        timestamp: pickupTimestamp
                    });
                }
                // 3. IN_TRANSIT_CHECKPOINT
                if (status === 'IN_TRANSIT' || status === 'CONFIRMED') {
                    const transitTimeMs = pickupMs + 3600000 * 2;
                    queuedCheckpoints.push({
                        donationId,
                        eventType: 'IN_TRANSIT_CHECKPOINT',
                        actor: { id: agent.id, role: 'PICKUP_AGENT', name: agent.name },
                        details: `Consignment in courier transit along Chennai logistics corridor.`,
                        payload: { corridor: 'GST-OMR-Chennai-Central' },
                        timestamp: new Date(transitTimeMs).toISOString()
                    });
                }
                // 4. DELIVERY_CONFIRMED
                if (deliveryTimestamp) {
                    queuedCheckpoints.push({
                        donationId,
                        eventType: 'DELIVERY_CONFIRMED',
                        actor: { id: inst.id, role: 'INSTITUTION', name: inst.name },
                        details: `Consignment securely delivered and signed by representative at ${inst.name}.`,
                        payload: { signature: don.recipientSignature, hasPhotoProof: Boolean(don.proofPhotoUrl) },
                        timestamp: deliveryTimestamp
                    });
                }
            }
        }
    }
    // Update fulfilled counts on requirements in DB
    for (const r of requirements) {
        await database_1.db.upsertRequirement(r);
    }
    console.log(`✅ Seeded ${donations.length} synthetic donations across all lifecycle stages.`);
    // -------------------------------------------------------------
    // STEP 6: Chronological Ledger Block Mining
    // -------------------------------------------------------------
    console.log(`⛏️ Mining ${queuedCheckpoints.length} ledger blocks in chronological order...`);
    // Sort checkpoints strictly by timestamp ascending
    queuedCheckpoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (const cp of queuedCheckpoints) {
        ledgerService_1.LedgerService.recordCheckpoint(cp.donationId, cp.eventType, cp.actor, cp.details, cp.payload, cp.timestamp, true // isSynthetic = true
        );
    }
    console.log(`⛓️ Successfully mined ${queuedCheckpoints.length} cryptographic blocks.`);
    // -------------------------------------------------------------
    // STEP 7: Cryptographic Verification
    // -------------------------------------------------------------
    const verification = ledgerService_1.LedgerService.verifyChain();
    console.log('\n🔐 LEDGER VERIFICATION RESULT:');
    console.log(JSON.stringify(verification, null, 2));
    if (!verification.isValid) {
        throw new Error(`Synthetic dataset broke cryptographic ledger integrity! Corrupted block: #${verification.corruptedBlockIndex}`);
    }
    // Final Counts
    const counts = await database_1.db.getTableCounts();
    console.log('\n📊 FINAL RECORD COUNTS:');
    console.table(counts);
}
// -------------------------------------------------------------
// CLI Execution Handler
// -------------------------------------------------------------
async function main() {
    const args = process.argv.slice(2);
    const isClearOnly = args.includes('--clear');
    try {
        if (isClearOnly) {
            console.log('🧹 Clearing synthetic data from CareTrace database...');
            await database_1.db.init();
            const res = await database_1.db.clearSyntheticData();
            console.log('✅ Synthetic data successfully wiped. Remaining record counts:');
            console.table(res.counts);
            const verify = ledgerService_1.LedgerService.verifyChain();
            console.log('🔐 Ledger verification after clear: isValid =', verify.isValid, `(${verify.totalBlocks} blocks)`);
            process.exit(0);
        }
        await seedSynthetic();
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error during synthetic data operation:', err);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
