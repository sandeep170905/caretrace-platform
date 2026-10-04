const pptxgen = require('pptxgenjs');
const path = require('path');

async function buildCleanAcademicReview2Presentation() {
  const pres = new pptxgen();
  // EXACT match to CareTrace_Presentation.pptx (cx: 12192000, cy: 6858000 -> 13.333" x 7.500")
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'CareTrace Team - Batch 03';
  pres.company = 'Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College';
  pres.subject = 'Project Phase-I Review-II';
  pres.title = 'CareTrace - Review II';

  // Academic Color Palette (Matching Review 1 PPT)
  const NAVY = '1F3864';       // Main heading & table header
  const TEXT_DARK = '1A1A1A';  // Primary body text
  const TEXT_MUTED = '595959'; // Secondary / footer text
  const BORDER = 'D6DCE5';     // Table border line
  const ROW_ALT = 'F8F9FA';    // Alternating table row
  const FONT_ACADEMIC = 'Times New Roman';

  // Helper to add consistent academic slide header and footer
  function setupAcademicSlide(slide, titleText, slideNum) {
    slide.background = { color: 'FFFFFF' };

    // Slide Title
    slide.addText(titleText, {
      x: 0.60,
      y: 0.35,
      w: 12.13,
      h: 0.65,
      fontSize: 26,
      bold: true,
      color: NAVY,
      fontFace: FONT_ACADEMIC
    });

    // Elegant academic accent rule under title
    slide.addShape('rect', {
      x: 0.60,
      y: 1.05,
      w: 12.13,
      h: 0.02,
      fill: { color: NAVY },
      line: { color: NAVY, width: 1 }
    });

    // Footer divider line
    slide.addShape('rect', {
      x: 0.60,
      y: 6.85,
      w: 12.13,
      h: 0.015,
      fill: { color: BORDER },
      line: { color: BORDER, width: 0.5 }
    });

    // Left Footer: Project Title
    slide.addText('CareTrace – A Secure and Traceable Donation Logistics & Verification Platform', {
      x: 0.60,
      y: 6.92,
      w: 9.5,
      h: 0.35,
      fontSize: 10,
      color: TEXT_MUTED,
      fontFace: FONT_ACADEMIC
    });

    // Right Footer: Slide Number
    slide.addText(String(slideNum), {
      x: 11.5,
      y: 6.92,
      w: 1.23,
      h: 0.35,
      fontSize: 10,
      bold: true,
      color: NAVY,
      fontFace: FONT_ACADEMIC,
      align: 'right'
    });
  }

  // =============================================================
  // SLIDE 1: Title Slide (Academic Institutional Format)
  // =============================================================
  const slide1 = pres.addSlide();
  slide1.background = { color: 'FFFFFF' };

  // College Name
  slide1.addText('Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College', {
    x: 0.6,
    y: 0.5,
    w: 12.13,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  slide1.addText('An Autonomous Institution • Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai\nAlamathi Road, Avadi, Chennai - 600062', {
    x: 0.6,
    y: 1.05,
    w: 12.13,
    h: 0.45,
    fontSize: 11,
    color: TEXT_MUTED,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  slide1.addShape('rect', {
    x: 1.5,
    y: 1.6,
    w: 10.33,
    h: 0.02,
    fill: { color: NAVY },
    line: { color: NAVY, width: 1 }
  });

  slide1.addText('DEPARTMENT OF COMPUTER SCIENCE AND BUSINESS SYSTEMS\nBACHELOR OF TECHNOLOGY (B.TECH)', {
    x: 0.6,
    y: 1.75,
    w: 12.13,
    h: 0.5,
    fontSize: 13,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  // Project Title Box
  slide1.addText('PROJECT WORK PHASE-I — REVIEW II', {
    x: 0.6,
    y: 2.45,
    w: 12.13,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: '944400',
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  slide1.addText('CareTrace – A Secure and Traceable Donation Logistics & Verification Platform', {
    x: 0.6,
    y: 2.85,
    w: 12.13,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  // Candidate Details Table on Title Slide
  const titleTableData = [
    [
      { text: 'Register No', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'Candidate Name', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'Batch No', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'Supervisor / Project Guide', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: '113123UG09003', options: { align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'AJITH R', options: { bold: true, fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'Batch 03', options: { rowSpan: 4, bold: true, align: 'center', fontSize: 13, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: 'Dr. Indirani M\nAssistant Professor / CSBS', options: { rowSpan: 4, bold: true, align: 'center', fontSize: 12, color: NAVY, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: '113123UG09004', options: { align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'AKASH KUMAR G', options: { bold: true, fontSize: 11, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: '113123UG09045', options: { align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'SAKTHIVEL S', options: { bold: true, fontSize: 11, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: '113123UG09046', options: { align: 'center', fontSize: 11, fontFace: FONT_ACADEMIC } },
      { text: 'SANDEEP R', options: { bold: true, fontSize: 11, fontFace: FONT_ACADEMIC } }
    ]
  ];

  slide1.addTable(titleTableData, {
    x: 1.5,
    y: 3.85,
    w: 10.33,
    colW: [2.3, 3.2, 1.8, 3.03],
    border: { pt: 1, color: BORDER },
    rowH: 0.38
  });

  // Footer live URLs
  slide1.addText('Live Production Deployments: Web App: https://caretrace-web.onrender.com  |  Core API: https://caretrace-platform.onrender.com', {
    x: 0.6,
    y: 6.9,
    w: 12.13,
    h: 0.35,
    fontSize: 10.5,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  // =============================================================
  // SLIDE 2: Project Evaluation Form
  // =============================================================
  const slide2 = pres.addSlide();
  setupAcademicSlide(slide2, 'Project Evaluation Form', 2);

  const evalMetaTable = [
    [
      { text: 'YEAR / SEMESTER', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'IV / VII', options: { bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'DEPARTMENT', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Computer Science and Business Systems (CSBS)', options: { bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: 'COURSE CODE / NAME', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: '231CB77A / PROJECT WORK PHASE-I', options: { bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'REVIEW NUMBER', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'REVIEW - II', options: { bold: true, color: '944400', fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: 'PROJECT TITLE', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'CareTrace – A Secure and Traceable Donation Logistics & Verification Platform', options: { colSpan: 3, bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11.5 } }
    ],
    [
      { text: 'SUPERVISOR', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Dr. Indirani M', options: { bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'BATCH NUMBER', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Batch 03', options: { bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ]
  ];

  slide2.addTable(evalMetaTable, {
    x: 0.60,
    y: 1.25,
    w: 12.13,
    colW: [2.5, 3.5, 2.5, 3.63],
    border: { pt: 1, color: BORDER },
    rowH: 0.36
  });

  slide2.addText('OFFICIAL REVIEW II EVALUATION CRITERIA (PROGRESS & DEVELOPMENT - 35 MARKS)', {
    x: 0.60,
    y: 3.0,
    w: 12.13,
    h: 0.35,
    fontSize: 12.5,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC
  });

  const rubricFullTable = [
    [
      { text: 'Evaluation Component', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Sub-Criteria as per Format', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Max Marks', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'CareTrace Status & Evidence', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: 'Progress According to Plan (10 Marks)', options: { rowSpan: 2, bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '• Adherence to the project timeline', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '5 Marks', options: { align: 'center', bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: 'Strict adherence to W1–W12 schedule; core modules executed on time.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } }
    ],
    [
      { text: '• Completion of key milestones', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '5 Marks', options: { align: 'center', bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: 'Needs Board, Logistics Portal, Cryptographic Ledger, and ML all completed.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } }
    ],
    [
      { text: 'Technical Development (15 Marks)', options: { rowSpan: 3, bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '• Quality of initial prototypes or models', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '5 Marks', options: { align: 'center', bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: 'Full-stack working app (React 18 + Node.js/TS + Knex SQLite/PostgreSQL).', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } }
    ],
    [
      { text: '• Integration of research into development', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '5 Marks', options: { align: 'center', bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: 'Bridges physical custody gaps from 6 literature papers (Kamza 2025 base paper).', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } }
    ],
    [
      { text: '• Problem-solving and innovation', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '5 Marks', options: { align: 'center', bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: 'Dual-scan QR verification, zero-gas SHA-256 block mining, automated fraud scoring.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } }
    ],
    [
      { text: 'Mid-Phase Presentation (10 Marks)', options: { rowSpan: 2, bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '• Clarity & effectiveness of presentation', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '5 Marks', options: { align: 'center', bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: 'Clear walkthrough of Donor, Courier, Shelter Director, and Auditor workflows.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } }
    ],
    [
      { text: '• Ability to address feedback & questions', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '5 Marks', options: { align: 'center', bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10 } },
      { text: '582 blocks verified (isValid: true); 34 automated ML unit tests passing.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } }
    ]
  ];

  slide2.addTable(rubricFullTable, {
    x: 0.60,
    y: 3.4,
    w: 12.13,
    colW: [2.6, 2.9, 1.4, 5.23],
    border: { pt: 1, color: BORDER },
    rowH: 0.38
  });

  // =============================================================
  // SLIDE 3: Candidate Details Table
  // =============================================================
  const slide3 = pres.addSlide();
  setupAcademicSlide(slide3, 'Candidate Details', 3);

  const candTableSlide3 = [
    [
      { text: 'S.No', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: 'VM No', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: 'Batch No', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: 'Register No', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: 'Candidate Name(s)', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: 'Supervisor', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11.5 } }
    ],
    [
      { text: '1', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: '—', options: { align: 'center', fontSize: 11.5, fontFace: FONT_ACADEMIC } },
      { text: 'Batch 03', options: { align: 'center', fontSize: 11.5, bold: true, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: '113123UG09003', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: 'AJITH R', options: { fontSize: 11.5, bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC } },
      { text: 'Dr. Indirani M\nSign: ________________', options: { rowSpan: 4, fontSize: 11.5, bold: true, color: NAVY, fontFace: FONT_ACADEMIC, align: 'center' } }
    ],
    [
      { text: '2', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: '—', options: { align: 'center', fontSize: 11.5, fontFace: FONT_ACADEMIC } },
      { text: 'Batch 03', options: { align: 'center', fontSize: 11.5, bold: true, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: '113123UG09004', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: 'AKASH KUMAR G', options: { fontSize: 11.5, bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: '3', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: '—', options: { align: 'center', fontSize: 11.5, fontFace: FONT_ACADEMIC } },
      { text: 'Batch 03', options: { align: 'center', fontSize: 11.5, bold: true, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: '113123UG09045', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: 'SAKTHIVEL S', options: { fontSize: 11.5, bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: '4', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: '—', options: { align: 'center', fontSize: 11.5, fontFace: FONT_ACADEMIC } },
      { text: 'Batch 03', options: { align: 'center', fontSize: 11.5, bold: true, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: '113123UG09046', options: { align: 'center', fontSize: 11.5, bold: true, fontFace: FONT_ACADEMIC } },
      { text: 'SANDEEP R', options: { fontSize: 11.5, bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC } }
    ]
  ];

  slide3.addTable(candTableSlide3, {
    x: 0.60,
    y: 1.45,
    w: 12.13,
    colW: [0.8, 1.2, 1.4, 2.5, 3.4, 2.83],
    border: { pt: 1, color: BORDER },
    rowH: 0.65
  });

  // Descriptive text below table
  const candNotes = [
    { text: 'Candidate Program & Institution Context:\n', options: { bold: true, color: NAVY, fontSize: 12 } },
    { text: '• Degree / Branch: Bachelor of Technology (B.Tech) in Computer Science and Business Systems (CSBS)\n', options: { color: TEXT_DARK, fontSize: 11 } },
    { text: '• Year / Semester: IV Year / VII Semester | Academic Year: 2026\n', options: { color: TEXT_DARK, fontSize: 11 } },
    { text: '• Collaborative Project Work: All four candidates of Batch 03 worked jointly across all Phase-I project components including requirement engineering, cryptographic ledger implementation, courier routing algorithms, and cloud deployment on Render.', options: { color: TEXT_MUTED, fontSize: 10.5 } }
  ];

  slide3.addText(candNotes, {
    x: 0.60,
    y: 4.6,
    w: 12.13,
    h: 1.9,
    fontFace: FONT_ACADEMIC
  });

  // =============================================================
  // SLIDE 4: Candidate Contribution and Performance Table
  // =============================================================
  const slide4 = pres.addSlide();
  setupAcademicSlide(slide4, 'Candidate Contribution and Performance', 4);

  const contribTableSlide4 = [
    [
      { text: 'Contents / Evaluation Criteria', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: 'Max Marks', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: 'Batch 03 Joint Contribution & Project Evidence', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11.5 } }
    ],
    [
      { text: 'Progress According to Plan (10 Marks)\n• Adherence to project timeline (5M)\n• Completion of key milestones (5M)', options: { bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: '10 M', options: { align: 'center', bold: true, fontSize: 12, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: '• 100% adherence to planned 12-week Phase-I schedule without delays.\n• All scheduled milestones delivered: Needs Board, Courier Dispatch, Cryptographic Ledger, and Machine Learning modules are fully operational.\n• Complete working system deployed live on Render cloud ahead of Review II.', options: { color: TEXT_DARK, fontSize: 10.5, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: 'Technical Development (15 Marks)\n• Quality of initial prototypes/models (5M)\n• Integration of research into development (5M)\n• Problem-solving and innovation (5M)', options: { bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: '15 M', options: { align: 'center', bold: true, fontSize: 12, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: '• Prototype Quality: React 18 frontend + Node/Express backend + SQLite/PG Knex engine.\n• Research Integration: Extended 6 literature papers; resolved the lack of physical tracking in Kamza et al. (Base Paper) and high gas fees in Sameer et al.\n• Innovation: SHA-256 block mining, dual tactile QR code scanning, and 5 pure-TS ML analytics models.', options: { color: TEXT_DARK, fontSize: 10.5, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: 'Mid-Phase Presentation (10 Marks)\n• Clarity & effectiveness of presentation (5M)\n• Ability to address feedback & questions (5M)', options: { bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: '10 M', options: { align: 'center', bold: true, fontSize: 12, color: NAVY, fontFace: FONT_ACADEMIC } },
      { text: '• End-to-end interactive demonstration across Donor, Courier, Shelter, and Public Auditor.\n• Rigorous verification: GET /api/ledger/verify confirms 582 blocks with zero broken links.\n• Test Coverage: 34 out of 34 automated unit test suites passing.', options: { color: TEXT_DARK, fontSize: 10.5, fontFace: FONT_ACADEMIC } }
    ],
    [
      { text: 'TOTAL (PROGRESS AND DEVELOPMENT)', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11.5 } },
      { text: '35 M', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, align: 'center', fontSize: 13, fontFace: FONT_ACADEMIC } },
      { text: 'All criteria satisfied with running code, live cloud URL, and cryptographic proofs.', options: { bold: true, fill: { color: ROW_ALT }, color: TEXT_DARK, fontSize: 10.5, fontFace: FONT_ACADEMIC } }
    ]
  ];

  slide4.addTable(contribTableSlide4, {
    x: 0.60,
    y: 1.35,
    w: 12.13,
    colW: [3.8, 1.3, 7.03],
    border: { pt: 1, color: BORDER },
    rowH: 0.95
  });

  // =============================================================
  // SLIDE 5: Progress According to Plan
  // =============================================================
  const slide5 = pres.addSlide();
  setupAcademicSlide(slide5, 'Progress According to Plan (10 Marks)', 5);

  // Left Section: Timeline
  slide5.addText('Adherence to the Project Timeline (5 Marks)', {
    x: 0.60,
    y: 1.25,
    w: 5.8,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC
  });

  const timelineItems = [
    { text: '• Weeks 1–4: Literature Review & Problem Formulation\n', options: { bold: true, color: NAVY, fontSize: 11 } },
    { text: '  Analyzed 6 base papers on blockchain charity systems (Ethereum, Solana, Polygon, IPFS). Identified critical absence of physical custody tracking.\n\n', options: { color: TEXT_MUTED, fontSize: 10 } },
    { text: '• Weeks 5–7: System Architecture & Database Modeling\n', options: { bold: true, color: NAVY, fontSize: 11 } },
    { text: '  Designed 4-tier architecture (Presentation, Application, Ledger, Data). Modeled Knex SQL migrations supporting SQLite (local) and PostgreSQL (production).\n\n', options: { color: TEXT_MUTED, fontSize: 10 } },
    { text: '• Weeks 8–10: Core Module Implementation & Testing\n', options: { bold: true, color: NAVY, fontSize: 11 } },
    { text: '  Developed Cryptographic Ledger engine, Public Needs Board, Field Courier Portal with tactile QR scanners, and ML Risk Scoring services.\n\n', options: { color: TEXT_MUTED, fontSize: 10 } },
    { text: '• Weeks 11–12: Cloud Deployment & Audit Verification\n', options: { bold: true, color: NAVY, fontSize: 11 } },
    { text: '  Deployed live services to Render. Seeded 582 blocks with 100% cryptographic validity. Conducted 34/34 passing unit tests.', options: { color: TEXT_MUTED, fontSize: 10 } }
  ];

  slide5.addText(timelineItems, {
    x: 0.60,
    y: 1.65,
    w: 5.8,
    h: 5.0,
    fontFace: FONT_ACADEMIC
  });

  // Right Section: Milestones Table
  slide5.addText('Completion of Key Milestones (5 Marks)', {
    x: 6.70,
    y: 1.25,
    w: 6.0,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC
  });

  const milestonesCleanTable = [
    [
      { text: 'Milestone / Deliverable', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Status', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Implemented Execution Output', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: 'M1: Needs Board', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '100%', options: { bold: true, align: 'center', color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '15 Chennai shelters, 60 verified requisitions, Leaflet map.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: 'M2: Donation Flow', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '100%', options: { bold: true, align: 'center', color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'Physical goods and monetary matching, 80G tax receipt generation.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: 'M3: Logistics Portal', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '100%', options: { bold: true, align: 'center', color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'Scrollable manifest, search filters, dual tactile QR scanners, GPS route.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: 'M4: Cryptographic Ledger', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '100%', options: { bold: true, align: 'center', color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'Sequential SHA-256 block mining; 582 blocks audited with isValid: true.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: 'M5: ML Analytics Engine', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '100%', options: { bold: true, align: 'center', color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'Demand forecasting, k-means (k=4), linear regression, IQR anomalies.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: 'M6: Cloud Deployment', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '100%', options: { bold: true, align: 'center', color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'Production live on Render (caretrace-web & caretrace-platform).', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ]
  ];

  slide5.addTable(milestonesCleanTable, {
    x: 6.70,
    y: 1.65,
    w: 6.0,
    colW: [1.8, 0.9, 3.3],
    border: { pt: 1, color: BORDER },
    rowH: 0.65
  });

  // =============================================================
  // SLIDE 6: Technical Development: Implemented Modules
  // =============================================================
  const slide6 = pres.addSlide();
  setupAcademicSlide(slide6, 'Technical Development: Implemented Modules (15 Marks - Part 1)', 6);

  slide6.addText('Core Implemented & Executed Modules in CareTrace', {
    x: 0.60,
    y: 1.25,
    w: 12.13,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC
  });

  const modulesCleanTable = [
    [
      { text: 'Module Name', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Implementation Technology', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Executed Functionality & Engineering Specifications', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: '1. Cryptographic Ledger Engine', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Node.js, TypeScript, Crypto (SHA-256), JSON Ledger', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: '• Mined 582 cryptographic blocks in strict chronological sequence.\n• Seals 14 custody events (REQUIREMENT_PUBLISHED to HANDOVER_CONFIRMED).\n• Runtime audit endpoint GET /api/ledger/verify returns isValid: true.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: '2. Public Needs Board & Verification', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'React 18, Leaflet Map, Tailwind, Knex Layer', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: '• 15 verified Chennai shelters (Tambaram, Ambattur, Adyar, Velachery, Guindy).\n• Essential requisitions: Boiled rice sacks (25kg), monthly groceries, used dresses, first-aid, notebooks.\n• Automated FraudScoringService evaluates requisition volume vs shelter capacity.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: '3. Multi-Party Pledging & Matching', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Express REST API, QR Service, SSE Stream', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: '• Matches physical goods & monetary pledges with 80G tax receipt generation.\n• Automatic lifecycle state progression: MATCHED -> IN_TRANSIT -> CONFIRMED.\n• Real-time notification broadcast via Server-Sent Events (SSE).', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: '4. Field Logistics Courier Portal', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Tactile QR Scanner, Leaflet Telemetry, CSS Scroll', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: '• Fixed-height scrollable manifest with search filter & status tabs (All, Sakthivel, In Transit, Delivered).\n• Pinned side-by-side GPS route map with step simulation.\n• Dual 1-click tactile QR scanning at donor pickup and orphanage handover dock.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ],
    [
      { text: '5. Machine Learning Insights Engine', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Pure TypeScript ML (Zero-cost cloud compute)', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: '• Demand forecasting: Exponential smoothing with 3-month forecast & confidence bands.\n• Donor segmentation: Deterministic k-means (k=4) clustering Champions, Regulars, Occasional, Lapsed.\n• Fulfillment linear regression (MAE error metric) & IQR statistical anomaly detection.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK } }
    ]
  ];

  slide6.addTable(modulesCleanTable, {
    x: 0.60,
    y: 1.65,
    w: 12.13,
    colW: [2.5, 2.7, 6.93],
    border: { pt: 1, color: BORDER },
    rowH: 0.95
  });

  // =============================================================
  // SLIDE 7: Technical Development: Research Integration
  // =============================================================
  const slide7 = pres.addSlide();
  setupAcademicSlide(slide7, 'Technical Development: Research Integration (15 Marks - Part 2)', 7);

  const researchCleanTable = [
    [
      { text: 'Literature Paper Reference', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Identified Research Gap / Literature Limitation', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'CareTrace Implementation & Integration', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: 'Dias Kamza et al. (2025)\nIEEE ICPCT [Base Paper]', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Smart contract charity model; tracks only fiat/cryptocurrency fund transfers; ignores physical goods donations and shipping custody.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: 'Extended smart contract concepts into a 14-checkpoint physical chain of custody with dual QR code validation from pickup to destination.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK, bold: true } }
    ],
    [
      { text: 'Mohamed Sameer S et al. (2025)\nIEEE ICDSBS', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Comparative study only; high Ethereum gas costs ($2.75–$20+) and slow TPS (15–30) render micro-donations unfeasible.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: 'Engineered lightweight cryptographic ledger executing zero gas fees and instant block mining (0.0032s/block).', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK, bold: true } }
    ],
    [
      { text: 'Le Deng et al. (2022)\nAIoTC / CEUR Vol. 3351', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Focuses on CP-ABE privacy encryption but incurs severe computational overhead with expanding user attributes.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: 'Applied role-based JWT authentication with selective public hashing to protect donor privacy without latency.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK, bold: true } }
    ],
    [
      { text: 'Albin T & George (2025)\nZenodo / Amal Jyothi College', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Volunteer tracking model in Django; lacks real-time courier route simulation and physical receipt verification.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: 'Formulated Field Logistics Agent role with live GPS waypoint simulation and digital signature handovers.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK, bold: true } }
    ],
    [
      { text: 'Alassaf & Yusoff (2021)\nIJACSA Vol. 12', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Multi-point fundraising on Ethereum; requires MetaMask wallet extensions, creating severe usability barriers for ordinary users.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: 'Integrated Web 2.5 frictionless UI: intuitive web dashboards accessible without requiring cryptocurrency wallets.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK, bold: true } }
    ],
    [
      { text: 'Pawar et al. (2021)\nIJARCCE Vol. 10', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5, color: NAVY } },
      { text: 'Hybrid client/server model stores all data in central DB with no independent cryptographic audit verification.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_MUTED } },
      { text: 'Engineered dual-layer persistence: relational SQL database for indexing + immutable SHA-256 hash chain for auditability.', options: { fontFace: FONT_ACADEMIC, fontSize: 10, color: TEXT_DARK, bold: true } }
    ]
  ];

  slide7.addTable(researchCleanTable, {
    x: 0.60,
    y: 1.35,
    w: 12.13,
    colW: [2.7, 4.3, 5.13],
    border: { pt: 1, color: BORDER },
    rowH: 0.8
  });

  // =============================================================
  // SLIDE 8: Technical Development: Problem-Solving and Innovation
  // =============================================================
  const slide8 = pres.addSlide();
  setupAcademicSlide(slide8, 'Technical Development: Problem-Solving & Innovation (15 Marks - Part 3)', 8);

  const problemTableData = [
    [
      { text: 'Domain Challenge / Problem', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'CareTrace Technical Innovation', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Validation & Engineering Outcome', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: '1. The "Last-Mile Delivery Black Hole"\nExisting platforms track money leaving donors but have zero visibility into whether physical supplies reach the orphanage.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, bold: true, color: NAVY } },
      { text: 'Dual-End Cryptographic Handover:\n• Donor scans QR code at pickup to verify initial custody transfer to courier.\n• Institution Director provides digital signature at dock to confirm delivery.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_DARK } },
      { text: '100% of delivered donations cryptographically verified and permanently sealed into block metadata with GPS coordinates.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_MUTED, bold: true } }
    ],
    [
      { text: '2. Requisition Fraud & Inflated Needs\nUnverified NGOs posting inflated demands or repeated claims to divert charitable supplies into grey markets.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, bold: true, color: NAVY } },
      { text: 'Automated Fraud Scoring & ML Risk Engine:\n• Heuristic rule-based scorer evaluates home capacity vs request volume.\n• Logistic regression classifies risk tier prior to publishing on public board.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_DARK } },
      { text: 'Suspicious requests are flagged as PENDING or HIGH_RISK; immutable audit trail recorded in risk_audit_logs.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_MUTED, bold: true } }
    ],
    [
      { text: '3. Gas Fees & Usability Barriers\nPublic Ethereum networks charge $2–$20+ gas fees per transaction and require donors and couriers to manage MetaMask crypto wallets.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, bold: true, color: NAVY } },
      { text: 'Zero-Gas SHA-256 Block Mining Engine:\n• Implemented cryptographic hash chaining in pure TypeScript.\n• Runs zero-cost on cloud; web-standard responsive UI for ordinary users.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_DARK } },
      { text: 'Free for non-profits; instantaneous validation (0.0032s/block); verified via GET /api/ledger/verify.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_MUTED, bold: true } }
    ],
    [
      { text: '4. Logistics Portal UI Stagnation\nListing 150+ consignments in field logistics causes pages to stretch endlessly, causing couriers to lose sight of map telemetry.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, bold: true, color: NAVY } },
      { text: 'Scrollable Manifest with Sticky Pinned Map:\n• Fixed 640px height scrollable container with search filter & status tabs.\n• Pinned side-by-side Leaflet GPS transit map with step simulation.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_DARK } },
      { text: 'Couriers easily navigate jobs (All, Sakthivel, In Transit, Delivered) with simultaneous real-time route visibility.', options: { fontFace: FONT_ACADEMIC, fontSize: 10.5, color: TEXT_MUTED, bold: true } }
    ]
  ];

  slide8.addTable(problemTableData, {
    x: 0.60,
    y: 1.35,
    w: 12.13,
    colW: [3.6, 4.4, 4.13],
    border: { pt: 1, color: BORDER },
    rowH: 1.25
  });

  // =============================================================
  // SLIDE 9: Mid-Phase Presentation
  // =============================================================
  const slide9 = pres.addSlide();
  setupAcademicSlide(slide9, 'Mid-Phase Presentation (10 Marks)', 9);

  // Left column: Presentation Clarity & Flow
  slide9.addText('Clarity & Effectiveness of Presentation (5 Marks)', {
    x: 0.60,
    y: 1.25,
    w: 5.8,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC
  });

  const demoScriptBullets = [
    { text: 'Structured Multi-Persona Demonstration:\n', options: { bold: true, color: NAVY, fontSize: 11.5 } },
    { text: '• Donor Portal: Seamless browsing of verified orphanage needs on Public Needs Board; physical item pledging and monetary UPI flow with 80G tax receipt.\n\n', options: { color: TEXT_DARK, fontSize: 10.5 } },
    { text: '• Field Logistics Portal (Courier Sakthivel S): Interactive courier manifest with instant search filter; 1-click tactile QR scanning at donor pickup; GPS transit telemetry.\n\n', options: { color: TEXT_DARK, fontSize: 10.5 } },
    { text: '• Institution Reception: Inspection of arrived consignment at shelter dock; digital signature handover confirmation.\n\n', options: { color: TEXT_DARK, fontSize: 10.5 } },
    { text: '• Public Ledger Explorer: Real-time public audit demonstrating hash-chain verification (GET /api/ledger/verify returns isValid: true across 582 blocks).\n\n', options: { color: TEXT_DARK, fontSize: 10.5 } },
    { text: '• ML Analytics Dashboard: 5 interactive panels showing demand forecasts, donor clusters, delivery time predictions, and IQR anomaly alerts.', options: { color: TEXT_DARK, fontSize: 10.5 } }
  ];

  slide9.addText(demoScriptBullets, {
    x: 0.60,
    y: 1.65,
    w: 5.8,
    h: 5.0,
    fontFace: FONT_ACADEMIC
  });

  // Right column: Quantitative Validation Table
  slide9.addText('Ability to Address Feedback & Verification (5 Marks)', {
    x: 6.70,
    y: 1.25,
    w: 6.0,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC
  });

  const quantitativeTable = [
    [
      { text: 'Empirical Verification Metric', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Observed System Result / Benchmark', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: 'Total Mined Ledger Blocks', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '582 Blocks (Sequentially mined in chronological order)', options: { color: NAVY, bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } }
    ],
    [
      { text: 'Cryptographic Audit Verification', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'isValid: true (Zero broken links or hash tampering)', options: { color: '059669', bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } }
    ],
    [
      { text: 'Automated Test Suites', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '34 Passed / 0 Failed (npm run test:analytics)', options: { color: '059669', bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } }
    ],
    [
      { text: 'Seeded Donors & Institutions', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '40 Realistic Tamil Donors & 15 Chennai Child-Care Homes', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } }
    ],
    [
      { text: 'Historical Consignments', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: '155 Donations spanning 9 months of operational history', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } }
    ],
    [
      { text: 'Production Cloud Deployment', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'Render Live: caretrace-web & caretrace-platform', options: { color: NAVY, bold: true, fontFace: FONT_ACADEMIC, fontSize: 10 } }
    ],
    [
      { text: 'Database Engine Support', options: { bold: true, fontFace: FONT_ACADEMIC, fontSize: 10.5 } },
      { text: 'Dual Knex Layer: SQLite (Local) + PostgreSQL (Production)', options: { fontFace: FONT_ACADEMIC, fontSize: 10 } }
    ]
  ];

  slide9.addTable(quantitativeTable, {
    x: 6.70,
    y: 1.65,
    w: 6.0,
    colW: [2.5, 3.5],
    border: { pt: 1, color: BORDER },
    rowH: 0.58
  });

  // =============================================================
  // SLIDE 10: Signatures
  // =============================================================
  const slide10 = pres.addSlide();
  setupAcademicSlide(slide10, 'Project Review - II Sign-Off', 10);

  const signSummaryTable = [
    [
      { text: 'COURSE CODE / NAME', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: '231CB77A / PROJECT WORK PHASE-I', options: { bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'BATCH NO', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'Batch 03', options: { bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ],
    [
      { text: 'PROJECT TITLE', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'CareTrace – A Secure and Traceable Donation Logistics & Verification Platform', options: { colSpan: 3, bold: true, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11.5 } }
    ],
    [
      { text: 'REVIEW STAGE', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'REVIEW - II (35 Marks Total)', options: { bold: true, color: '944400', fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: 'ACADEMIC YEAR', options: { bold: true, fill: { color: ROW_ALT }, color: NAVY, fontFace: FONT_ACADEMIC, fontSize: 11 } },
      { text: '2025 – 2026 (IV Year / VII Sem)', options: { bold: true, color: TEXT_DARK, fontFace: FONT_ACADEMIC, fontSize: 11 } }
    ]
  ];

  slide10.addTable(signSummaryTable, {
    x: 0.60,
    y: 1.35,
    w: 12.13,
    colW: [2.5, 3.5, 2.5, 3.63],
    border: { pt: 1, color: BORDER },
    rowH: 0.4
  });

  // Signatures Boxes
  slide10.addShape('rect', {
    x: 0.60,
    y: 3.2,
    w: 5.8,
    h: 3.2,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER, width: 1 }
  });
  slide10.addText('SUPERVISOR / PROJECT GUIDE', {
    x: 0.80,
    y: 3.4,
    w: 5.4,
    h: 0.35,
    fontSize: 12.5,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });
  slide10.addText('\nSignature: _____________________________________\n\nName: Dr. Indirani M\n\nDesignation: Assistant Professor / CSBS\n\nDate: ________________________', {
    x: 0.80,
    y: 3.85,
    w: 5.4,
    h: 2.2,
    fontSize: 11.5,
    color: TEXT_DARK,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  slide10.addShape('rect', {
    x: 6.90,
    y: 3.2,
    w: 5.8,
    h: 3.2,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER, width: 1 }
  });
  slide10.addText('PROJECT COORDINATOR / HOD', {
    x: 7.10,
    y: 3.4,
    w: 5.4,
    h: 0.35,
    fontSize: 12.5,
    bold: true,
    color: NAVY,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });
  slide10.addText('\nProject Coordinator: _____________________________\n\nHead of the Department: _________________________\n\nDepartment of CSBS, Vel Tech Multi Tech\n\nDate: ________________________', {
    x: 7.10,
    y: 3.85,
    w: 5.4,
    h: 2.2,
    fontSize: 11.5,
    color: TEXT_DARK,
    fontFace: FONT_ACADEMIC,
    align: 'center'
  });

  const outputPath = path.resolve('G:/main project 26/CareTrace_Phase1_Review2_Official.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log('✅ Academic Review II Presentation successfully built at:', outputPath);
}

buildCleanAcademicReview2Presentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
