const fs = require('fs');
const path = require('path');

function escapePdf(text) {
  return text.replace(/[\\()]/g, (match) => '\\' + match);
}

function createPdf(title, subtitle, contentSections) {
  let streamContent = 'BT\n/F1 18 Tf\n50 740 Td\n(' + escapePdf(title) + ') Tj\nET\n';
  streamContent += 'BT\n/F1 11 Tf\n50 715 Td\n(' + escapePdf(subtitle) + ') Tj\nET\n';

  let y = 670;
  for (const sec of contentSections) {
    streamContent += 'BT\n/F2 12 Tf\n50 ' + y + ' Td\n(' + escapePdf(sec.heading) + ') Tj\nET\n';
    y -= 18;
    for (const line of sec.lines) {
      streamContent += 'BT\n/F1 9 Tf\n60 ' + y + ' Td\n(' + escapePdf(line) + ') Tj\nET\n';
      y -= 14;
    }
    y -= 12;
  }

  streamContent += 'BT\n/F1 8 Tf\n50 40 Td\n(Kavya Shree Institute of Nursing, Punpun Station Road, Patna, Bihar - Academic Session 2026-27) Tj\nET\n';

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

  const streamLen = Buffer.byteLength(streamContent, 'utf8');
  objects.push('6 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + streamContent + '\nendstream\nendobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 0; i < 6; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
  return Buffer.from(pdf, 'utf8');
}

const docDir = path.join(__dirname, '..', 'public', 'assets', 'documents');
fs.mkdirSync(docDir, { recursive: true });

// 1. Prospectus 2026
fs.writeFileSync(path.join(docDir, 'prospectus-2026.pdf'), createPdf(
  'Kavya Shree Institute of Nursing',
  'Institutional Information Handbook & Prospectus - Session 2026-2027',
  [
    { heading: '1. About the Institute', lines: [
      'Kavya Shree Institute of Nursing is dedicated to high-standard nursing education in Patna, Bihar.',
      'The campus is located at Punpun Station Road, opposite Manglam Community Hall, PIN 804453.',
      'Programs offered: B.Sc. Nursing (4 Years), GNM (3 Years), ANM (2 Years), and Post Basic B.Sc. Nursing.'
    ]},
    { heading: '2. Academic Programs & Eligibility', lines: [
      'B.Sc. Nursing: 10+2 with Physics, Chemistry, Biology & English (Min 45% aggregate).',
      'GNM (General Nursing & Midwifery): 10+2 passed with 40% aggregate marks.',
      'ANM (Auxiliary Nursing & Midwifery): 10+2 in Arts/Commerce/Science as per council norms.',
      'Post Basic B.Sc. Nursing: Recognized GNM diploma and state nursing registration.'
    ]},
    { heading: '3. Clinical Facilities & Hospital Affiliations', lines: [
      'State-of-the-art simulation laboratories including Skills Lab, Pre-Clinical Lab, and Nutrition Lab.',
      'Clinical bedside training conducted in affiliated 250+ bed district civil hospitals and CHCs.',
      'Dedicated college transport provided for clinical rotations and field postings.'
    ]},
    { heading: '4. Admissions & Regulatory Transparency', lines: [
      'Applications for session 2026-27 submitted to Indian Nursing Council and Bihar Nursing Council.',
      'Transparent fee structures with full Bihar Student Credit Card (BSCC) facilitation support.',
      'National Anti-Ragging 24x7 Toll-Free Helpline: 1800-180-5522 | Email: helpline@antiragging.in'
    ]}
  ]
));

// 2. Admission Form 2026
fs.writeFileSync(path.join(docDir, 'admission-form-2026.pdf'), createPdf(
  'Kavya Shree Institute of Nursing',
  'Offline Admissions Application Form - Academic Session 2026-2027',
  [
    { heading: 'Candidate Instructions', lines: [
      'Fill this application form in BLOCK CAPITAL LETTERS using black or blue ballpoint pen.',
      'Enclose certified photocopies of 10th and 12th marksheets, SLC/CLC, Caste and Aadhaar cards.',
      'Submit completed form at: Campus Admissions Desk, Punpun Station Road, Patna - 804453.'
    ]},
    { heading: 'Part A: Program Selection', lines: [
      '[  ] B.Sc. Nursing (4 Years)       [  ] GNM - General Nursing & Midwifery (3 Years)',
      '[  ] ANM - Auxiliary Nursing (2 Years)  [  ] Post Basic B.Sc. Nursing (2 Years)'
    ]},
    { heading: 'Part B: Personal & Guardian Details', lines: [
      'Full Name of Applicant: ________________________________________________________________',
      'Date of Birth (DD/MM/YYYY): ____/____/________   Gender: [  ] Female  [  ] Male  [  ] Other',
      'Fathers Name: ____________________________ Mothers Name: ____________________________',
      'Mobile / WhatsApp: _________________________ Email: __________________________________',
      'Permanent Address: ____________________________________________________________________'
    ]},
    { heading: 'Part C: Academic Qualifications', lines: [
      '10th (Matriculation) - Board: ____________ Year: ______ Marks: ______ Percentage: ______%',
      '12th (Intermediate)  - Board: ____________ Year: ______ PCB Aggregate: ______ Percentage: ______%'
    ]}
  ]
));

// 3. Syllabus Outline
fs.writeFileSync(path.join(docDir, 'syllabus-outline.pdf'), createPdf(
  'Kavya Shree Institute of Nursing',
  'Curriculum & Course Outline Summary - Nursing Programs',
  [
    { heading: 'B.Sc. Nursing (4-Year Degree Program)', lines: [
      'Year 1: Anatomy, Physiology, Nutrition, Biochemistry, Nursing Foundations, Psychology, English.',
      'Year 2: Pharmacology, Pathology, Genetics, Medical-Surgical Nursing I, Community Health I, Sociology.',
      'Year 3: Medical-Surgical Nursing II, Child Health (Pediatrics), Mental Health (Psychiatric), Nursing Research.',
      'Year 4: Midwifery & Obstetrical Nursing, Community Health II, Nursing Management, Mandatory Internship.'
    ]},
    { heading: 'GNM - General Nursing & Midwifery (3-Year Diploma)', lines: [
      'Year 1: Bio-Sciences (Anatomy & Physiology), Behavioral Sciences, Nursing Arts & First Aid, Community I.',
      'Year 2: Medical Surgical Nursing I & II, Pharmacology, Psychiatric Nursing, Pediatric Nursing.',
      'Year 3: Midwifery & Gynaecology, Community Health II, Administration & Hospital Clinical Postings.'
    ]},
    { heading: 'ANM - Auxiliary Nursing & Midwifery (2-Year Diploma)', lines: [
      'Year 1: Community Health Nursing, Health Promotion, Primary Healthcare Delivery, Child Health Nursing.',
      'Year 2: Midwifery, Health Center Administration, Primary Health Center (PHC) Clinical Internship.'
    ]}
  ]
));

console.log('Valid PDF documents generated in public/assets/documents/');

