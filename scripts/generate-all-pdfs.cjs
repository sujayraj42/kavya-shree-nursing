const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// ==========================================
// PALETTE & GEOMETRY CONSTANTS
// ==========================================
const NAVY = rgb(15 / 255, 41 / 255, 66 / 255);         // #0f2942
const NAVY_DARK = rgb(10 / 255, 25 / 255, 42 / 255);    // #0a192a
const AMBER = rgb(235 / 255, 150 / 255, 36 / 255);      // #eb9624
const AMBER_LIGHT = rgb(254 / 255, 243 / 255, 199 / 255);// #fef3c7
const SLATE = rgb(51 / 255, 65 / 255, 85 / 255);        // #334155
const SLATE_LIGHT = rgb(241 / 255, 245 / 255, 249 / 255);// #f1f5f9
const BG_STONE = rgb(248 / 255, 250 / 255, 252 / 255);   // #f8fafc
const BORDER_COLOR = rgb(203 / 255, 213 / 255, 225 / 255);// #cbd5e1
const BORDER_LIGHT = rgb(226 / 255, 232 / 255, 240 / 255);// #e2e8f0
const TEXT_DARK = rgb(15 / 255, 23 / 255, 42 / 255);    // #0f172a
const TEXT_MUTED = rgb(71 / 255, 85 / 255, 105 / 255);  // #475569
const WHITE = rgb(1, 1, 1);
const RED = rgb(220 / 255, 38 / 255, 38 / 255);         // #dc2626
const RED_BG = rgb(254 / 255, 242 / 255, 242 / 255);     // #fef2f2
const GREEN = rgb(22 / 255, 163 / 255, 74 / 255);       // #16a34a
const GREEN_BG = rgb(240 / 255, 253 / 255, 244 / 255);   // #f0fdf4

const PAGE_WIDTH = 595.28;  // A4 Width
const PAGE_HEIGHT = 841.89; // A4 Height
const MARGIN_X = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 523.28 pt

// ==========================================
// CORE DRAWING & TEXT UTILITIES
// ==========================================

function sanitizeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n]/g, ' ')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, '*');
}

function wrapText(text, maxWidth, font, fontSize) {
  if (!text) return [''];
  const sanitized = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, '*');
  const paragraphs = sanitized.split('\n');
  const allLines = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      allLines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;
      const candidate = currentLine ? currentLine + ' ' + word : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) allLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) allLines.push(currentLine);
  }

  return allLines.length ? allLines : [''];
}

function drawPageHeader(page, { docTitle, sectionTitle, pageNum, totalPages, font, fontBold, logoImg }) {
  // Top Amber accent bar
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 4,
    width: PAGE_WIDTH,
    height: 4,
    color: AMBER
  });

  // Header background bar
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 38,
    width: PAGE_WIDTH,
    height: 34,
    color: BG_STONE
  });

  // Small Logo
  if (logoImg) {
    const imgAspect = logoImg.width / logoImg.height;
    const h = 24;
    const w = h * imgAspect;
    page.drawImage(logoImg, {
      x: MARGIN_X,
      y: PAGE_HEIGHT - 33,
      width: w,
      height: h
    });
  }

  // Institute Name
  page.drawText('KAVYA SHREE INSTITUTE OF NURSING', {
    x: MARGIN_X + 32,
    y: PAGE_HEIGHT - 21,
    size: 9.5,
    font: fontBold,
    color: NAVY
  });

  page.drawText('Punpun, Patna, Bihar | Session 2026-27', {
    x: MARGIN_X + 32,
    y: PAGE_HEIGHT - 31,
    size: 7.5,
    font: font,
    color: TEXT_MUTED
  });

  // Document Title / Section Title on Right
  if (sectionTitle) {
    const secWidth = fontBold.widthOfTextAtSize(sectionTitle, 8.5);
    page.drawText(sectionTitle, {
      x: PAGE_WIDTH - MARGIN_X - secWidth,
      y: PAGE_HEIGHT - 21,
      size: 8.5,
      font: fontBold,
      color: AMBER
    });
  }

  if (docTitle) {
    const docWidth = font.widthOfTextAtSize(docTitle, 7.5);
    page.drawText(docTitle, {
      x: PAGE_WIDTH - MARGIN_X - docWidth,
      y: PAGE_HEIGHT - 31,
      size: 7.5,
      font: font,
      color: TEXT_MUTED
    });
  }

  // Divider Line
  page.drawLine({
    start: { x: MARGIN_X, y: PAGE_HEIGHT - 38 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: PAGE_HEIGHT - 38 },
    thickness: 0.75,
    color: BORDER_COLOR
  });
}

function drawPageFooter(page, { pageNum, totalPages, font, fontBold }) {
  const footerY = 28;

  // Divider line
  page.drawLine({
    start: { x: MARGIN_X, y: footerY + 12 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: footerY + 12 },
    thickness: 0.75,
    color: BORDER_COLOR
  });

  // Left: Institutional Contact
  page.drawText('Punpun Station Road, Patna - 804453 | admissions@kavyashreenursing.edu.in | +91 96616 66485', {
    x: MARGIN_X,
    y: footerY,
    size: 7,
    font: font,
    color: TEXT_MUTED
  });

  // Right: Page Number
  const pageStr = `Page ${pageNum} of ${totalPages}`;
  const pWidth = fontBold.widthOfTextAtSize(pageStr, 7.5);
  page.drawText(pageStr, {
    x: PAGE_WIDTH - MARGIN_X - pWidth,
    y: footerY,
    size: 7.5,
    font: fontBold,
    color: NAVY
  });
}

function drawSectionHeading(page, y, title, subtitle, fontBold, font) {
  // Pill banner
  const bannerHeight = subtitle ? 30 : 20;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - bannerHeight,
    width: CONTENT_WIDTH,
    height: bannerHeight,
    color: NAVY
  });

  // Amber left strip
  page.drawRectangle({
    x: MARGIN_X,
    y: y - bannerHeight,
    width: 4,
    height: bannerHeight,
    color: AMBER
  });

  page.drawText(title, {
    x: MARGIN_X + 12,
    y: y - 13,
    size: 10,
    font: fontBold,
    color: WHITE
  });

  if (subtitle) {
    page.drawText(subtitle, {
      x: MARGIN_X + 12,
      y: y - 24,
      size: 7.5,
      font: font,
      color: AMBER_LIGHT
    });
  }

  return y - bannerHeight - 10;
}

function drawCallout(page, { x, y, width, title, textLines, font, fontBold, bgColor = BG_STONE, borderColor = AMBER, borderWidth = 3, textColor = TEXT_DARK }) {
  const pad = 8;
  const lineHeight = 11;
  const contentHeight = (title ? 14 : 0) + textLines.length * lineHeight + pad * 2;

  // Background
  page.drawRectangle({
    x,
    y: y - contentHeight,
    width,
    height: contentHeight,
    color: bgColor,
    borderColor: BORDER_LIGHT,
    borderWidth: 0.5
  });

  // Accent line on left
  page.drawRectangle({
    x,
    y: y - contentHeight,
    width: borderWidth,
    height: contentHeight,
    color: borderColor
  });

  let curY = y - pad - 9;
  if (title) {
    page.drawText(title, {
      x: x + pad + borderWidth + 4,
      y: curY,
      size: 8.5,
      font: fontBold,
      color: borderColor === AMBER ? NAVY : borderColor
    });
    curY -= 13;
  }

  for (const line of textLines) {
    page.drawText(line, {
      x: x + pad + borderWidth + 4,
      y: curY,
      size: 7.5,
      font: font,
      color: textColor
    });
    curY -= lineHeight;
  }

  return y - contentHeight;
}

function drawTable(page, {
  x,
  y,
  colWidths,
  headers,
  rows,
  font,
  fontBold,
  headerBg = NAVY,
  alternateBg = SLATE_LIGHT,
  borderColor = BORDER_COLOR,
  fontSize = 7.5,
  lineHeight = 10,
  padding = 4
}) {
  let curY = y;
  const totalW = colWidths.reduce((a, b) => a + b, 0);

  // Header row
  const headerLinesList = headers.map((h, i) => wrapText(h, colWidths[i] - padding * 2, fontBold, fontSize));
  const maxHeaderLines = Math.max(...headerLinesList.map(l => l.length));
  const headerHeight = maxHeaderLines * lineHeight + padding * 2;

  page.drawRectangle({
    x,
    y: curY - headerHeight,
    width: totalW,
    height: headerHeight,
    color: headerBg
  });

  let curX = x;
  for (let c = 0; c < headers.length; c++) {
    const lines = headerLinesList[c];
    for (let l = 0; l < lines.length; l++) {
      page.drawText(lines[l], {
        x: curX + padding,
        y: curY - padding - (l + 1) * lineHeight + 2,
        size: fontSize,
        font: fontBold,
        color: WHITE
      });
    }
    curX += colWidths[c];
  }
  curY -= headerHeight;

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowLinesList = row.map((cell, c) => wrapText(cell, colWidths[c] - padding * 2, font, fontSize));
    const maxRowLines = Math.max(...rowLinesList.map(l => l.length), 1);
    const rowHeight = maxRowLines * lineHeight + padding * 2;

    const rowBg = (r % 2 === 1 && alternateBg) ? alternateBg : WHITE;

    page.drawRectangle({
      x,
      y: curY - rowHeight,
      width: totalW,
      height: rowHeight,
      color: rowBg
    });

    // Row Outer Border
    page.drawRectangle({
      x,
      y: curY - rowHeight,
      width: totalW,
      height: rowHeight,
      borderColor,
      borderWidth: 0.5
    });

    curX = x;
    for (let c = 0; c < row.length; c++) {
      if (c > 0) {
        page.drawLine({
          start: { x: curX, y: curY },
          end: { x: curX, y: curY - rowHeight },
          thickness: 0.5,
          color: borderColor
        });
      }
      const lines = rowLinesList[c];
      for (let l = 0; l < lines.length; l++) {
        page.drawText(lines[l], {
          x: curX + padding,
          y: curY - padding - (l + 1) * lineHeight + 2,
          size: fontSize,
          font,
          color: TEXT_DARK
        });
      }
      curX += colWidths[c];
    }
    curY -= rowHeight;
  }

  return curY;
}

// ==========================================
// DOCUMENT 1: PROSPECTUS 2026-2027 (6 PAGES)
// ==========================================

async function generateProspectus(outputDir, logoBytes) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  let logoImg = null;
  if (logoBytes) {
    try {
      logoImg = await doc.embedPng(logoBytes);
    } catch (e) {
      console.warn('Could not embed logo image in prospectus:', e.message);
    }
  }

  const TOTAL_PAGES = 6;

  // ----------------------------------------------------
  // PAGE 1: COVER PAGE
  // ----------------------------------------------------
  const p1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Deep Navy background for top hero
  p1.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 310,
    width: PAGE_WIDTH,
    height: 310,
    color: NAVY
  });

  // Top Amber bar
  p1.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 8,
    width: PAGE_WIDTH,
    height: 8,
    color: AMBER
  });

  // Secondary Amber divider
  p1.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 314,
    width: PAGE_WIDTH,
    height: 4,
    color: AMBER
  });

  // Centered Logo
  let coverLogoY = PAGE_HEIGHT - 120;
  if (logoImg) {
    const lH = 75;
    const lW = lH * (logoImg.width / logoImg.height);
    p1.drawImage(logoImg, {
      x: (PAGE_WIDTH - lW) / 2,
      y: coverLogoY,
      width: lW,
      height: lH
    });
  }

  // Institute Name
  const t1 = 'KAVYA SHREE INSTITUTE OF NURSING';
  const t1W = fontBold.widthOfTextAtSize(t1, 20);
  p1.drawText(t1, {
    x: (PAGE_WIDTH - t1W) / 2,
    y: PAGE_HEIGHT - 150,
    size: 20,
    font: fontBold,
    color: WHITE
  });

  // Campus location
  const loc = 'Punpun Station Road, Opp. Manglam Community Hall, Punpun, Patna, Bihar - 804453';
  const locW = font.widthOfTextAtSize(loc, 9);
  p1.drawText(loc, {
    x: (PAGE_WIDTH - locW) / 2,
    y: PAGE_HEIGHT - 168,
    size: 9,
    font,
    color: AMBER_LIGHT
  });

  // Gold Badge Session
  const sessionBoxW = 260;
  const sessionBoxH = 28;
  const sessionBoxX = (PAGE_WIDTH - sessionBoxW) / 2;
  const sessionBoxY = PAGE_HEIGHT - 215;

  p1.drawRectangle({
    x: sessionBoxX,
    y: sessionBoxY,
    width: sessionBoxW,
    height: sessionBoxH,
    color: AMBER
  });

  const sessText = 'OFFICIAL PROSPECTUS & ACADEMIC HANDBOOK';
  const sessW = fontBold.widthOfTextAtSize(sessText, 9.5);
  p1.drawText(sessText, {
    x: (PAGE_WIDTH - sessW) / 2,
    y: sessionBoxY + 16,
    size: 9.5,
    font: fontBold,
    color: NAVY_DARK
  });

  const sessYear = 'ACADEMIC SESSION 2026 - 2027';
  const sessYW = fontBold.widthOfTextAtSize(sessYear, 8.5);
  p1.drawText(sessYear, {
    x: (PAGE_WIDTH - sessYW) / 2,
    y: sessionBoxY + 5,
    size: 8.5,
    font: fontBold,
    color: NAVY_DARK
  });

  // Subtitle
  const sub = 'Excellence in Nursing Science | Compassion in Clinical Care | Ethical Leadership';
  const subW = fontOblique.widthOfTextAtSize(sub, 9);
  p1.drawText(sub, {
    x: (PAGE_WIDTH - subW) / 2,
    y: PAGE_HEIGHT - 260,
    size: 9,
    font: fontOblique,
    color: WHITE
  });

  // Programs Bar Badge in Navy Box
  const prgBarText = 'B.Sc. NURSING (4 YRS) | GNM (3 YRS) | ANM (2 YRS) | POST BASIC B.Sc. (2 YRS) | M.Sc. NURSING (2 YRS)';
  const prgBarW = fontBold.widthOfTextAtSize(prgBarText, 7.5);
  p1.drawText(prgBarText, {
    x: (PAGE_WIDTH - prgBarW) / 2,
    y: PAGE_HEIGHT - 285,
    size: 7.5,
    font: fontBold,
    color: AMBER
  });

  // Lower Section (White / Stone background)
  let cy = PAGE_HEIGHT - 340;

  // Institutional Mission Card
  cy = drawCallout(p1, {
    x: MARGIN_X,
    y: cy,
    width: CONTENT_WIDTH,
    title: 'INSTITUTIONAL CREDO & HEALTHCARE MISSION',
    textLines: [
      'Kavya Shree Institute of Nursing is founded with the resolute vision to transform nursing and allied healthcare education in',
      'Bihar and Eastern India. We combine diagnostic rigor, high-fidelity clinical simulation, and deep bedside empathy to nurture',
      'clinically adept, compassionate, and globally competent nursing leaders committed to rural and urban health transformation.',
      'Our pedagogic framework seamlessly integrates university academic curricula with continuous in-hospital clinical immersion.'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: NAVY,
    borderWidth: 4
  });

  cy -= 16;

  // Regulatory Alignment & Statutory Disclosures Card
  cy = drawCallout(p1, {
    x: MARGIN_X,
    y: cy,
    width: CONTENT_WIDTH,
    title: 'STATUTORY REGULATORY FRAMEWORK & COUNCIL ALIGNMENT',
    textLines: [
      '- Curricula strictly conform to the statutory syllabus guidelines of the Indian Nursing Council (INC, New Delhi).',
      '- Governed under the institutional and examination standards of the Bihar Nursing Registration Council (BNRC, Patna).',
      '- Academic affiliation alignment with Aryabhatta Knowledge University (AKU) / Bihar University of Health Sciences (BUHS).',
      '- Applications for Session 2026-2027 formally submitted. Transparent administrative notices available at campus office.'
    ],
    font,
    fontBold,
    bgColor: SLATE_LIGHT,
    borderColor: AMBER,
    borderWidth: 4
  });

  cy -= 16;

  // 4 Key Highlights Boxes (2x2 Grid)
  const gridW = (CONTENT_WIDTH - 12) / 2;
  const gridH = 65;

  // Box 1: Hospital Training
  p1.drawRectangle({
    x: MARGIN_X,
    y: cy - gridH,
    width: gridW,
    height: gridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p1.drawRectangle({
    x: MARGIN_X,
    y: cy - 4,
    width: gridW,
    height: 4,
    color: NAVY
  });
  p1.drawText('250+ Bed Multi-Specialty Hospital Tie-up', {
    x: MARGIN_X + 8,
    y: cy - 18,
    size: 8.5,
    font: fontBold,
    color: NAVY
  });
  p1.drawText('Intensive bedside rotations in Medicine, Surgery, ICU,', {
    x: MARGIN_X + 8,
    y: cy - 31,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('Obstetrics, Neonatal Care & District Civil Hospital wards.', {
    x: MARGIN_X + 8,
    y: cy - 42,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('Supervised by senior clinical mentors and consultants.', {
    x: MARGIN_X + 8,
    y: cy - 53,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });

  // Box 2: Modern Labs
  p1.drawRectangle({
    x: MARGIN_X + gridW + 12,
    y: cy - gridH,
    width: gridW,
    height: gridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p1.drawRectangle({
    x: MARGIN_X + gridW + 12,
    y: cy - 4,
    width: gridW,
    height: 4,
    color: AMBER
  });
  p1.drawText('Simulation & Clinical Skills Laboratories', {
    x: MARGIN_X + gridW + 20,
    y: cy - 18,
    size: 8.5,
    font: fontBold,
    color: NAVY
  });
  p1.drawText('High-fidelity adult, pediatric and maternal simulators,', {
    x: MARGIN_X + gridW + 20,
    y: cy - 31,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('CPR mannequins, vein access arms, and ICU setup.', {
    x: MARGIN_X + gridW + 20,
    y: cy - 42,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('Pre-clinical science, nutrition & microbiology labs.', {
    x: MARGIN_X + gridW + 20,
    y: cy - 53,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });

  cy -= gridH + 10;

  // Box 3: BSCC Loan
  p1.drawRectangle({
    x: MARGIN_X,
    y: cy - gridH,
    width: gridW,
    height: gridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p1.drawRectangle({
    x: MARGIN_X,
    y: cy - 4,
    width: gridW,
    height: 4,
    color: GREEN
  });
  p1.drawText('Bihar Student Credit Card (BSCC) Support', {
    x: MARGIN_X + 8,
    y: cy - 18,
    size: 8.5,
    font: fontBold,
    color: GREEN
  });
  p1.drawText('Complete DRCC documentation & bonafide assistance.', {
    x: MARGIN_X + 8,
    y: cy - 31,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('Up to Rs. 4,00,000 education loan at subsidized rates.', {
    x: MARGIN_X + 8,
    y: cy - 42,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('Special 1% interest rate for female candidates.', {
    x: MARGIN_X + 8,
    y: cy - 53,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });

  // Box 4: Hostels & Bus
  p1.drawRectangle({
    x: MARGIN_X + gridW + 12,
    y: cy - gridH,
    width: gridW,
    height: gridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p1.drawRectangle({
    x: MARGIN_X + gridW + 12,
    y: cy - 4,
    width: gridW,
    height: 4,
    color: RED
  });
  p1.drawText('Secure Hostels & College Transport Fleet', {
    x: MARGIN_X + gridW + 20,
    y: cy - 18,
    size: 8.5,
    font: fontBold,
    color: NAVY
  });
  p1.drawText('Dedicated female & male hostels with 24x7 security,', {
    x: MARGIN_X + gridW + 20,
    y: cy - 31,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('hygienic mess, solar power, and resident wardens.', {
    x: MARGIN_X + gridW + 20,
    y: cy - 42,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('Fleet of buses serving Patna, Danapur & Punpun route.', {
    x: MARGIN_X + gridW + 20,
    y: cy - 53,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });

  cy -= gridH + 16;

  // Bottom Notice & Contact Strip
  p1.drawRectangle({
    x: MARGIN_X,
    y: 35,
    width: CONTENT_WIDTH,
    height: 38,
    color: NAVY
  });

  p1.drawText('ADMISSIONS DESK 2026: +91 96616 66485 / +91 62878 79239 | Email: admissions@kavyashreenursing.edu.in', {
    x: MARGIN_X + 10,
    y: 56,
    size: 7.5,
    font: fontBold,
    color: WHITE
  });
  p1.drawText('National Anti-Ragging Helpline (24x7 Toll-Free): 1800-180-5522 | Portal: https://kavyashreenursing.edu.in', {
    x: MARGIN_X + 10,
    y: 44,
    size: 7,
    font,
    color: AMBER_LIGHT
  });

  // ----------------------------------------------------
  // PAGE 2: LEADERSHIP MESSAGES & TABLE OF CONTENTS
  // ----------------------------------------------------
  const p2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p2, {
    docTitle: 'Institutional Prospectus 2026-27',
    sectionTitle: 'Leadership & Vision',
    pageNum: 2,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p2, { pageNum: 2, totalPages: TOTAL_PAGES, font, fontBold });

  let p2y = PAGE_HEIGHT - 55;

  // Table of Contents Box
  p2y = drawSectionHeading(p2, p2y, 'TABLE OF CONTENTS', 'Quick Reference Guide to Prospectus Sections', fontBold, font);

  const tocItems = [
    ['1. Institutional Profile, Leadership Messages & Educational Vision', 'Page 2'],
    ['2. Academic Infrastructure, Simulation Labs & Hospital Affiliations', 'Page 3'],
    ['3. Academic Programs Portfolio, Statutory Eligibility & Seat Matrix', 'Page 4'],
    ['4. Career Pathways, Global Horizons & Employment Framework', 'Page 4'],
    ['5. Fee Architecture, BSCC Loan Facility & Statutory Refund Policy', 'Page 5'],
    ['6. Campus Code of Conduct, Anti-Ragging Framework & Admissions Desk', 'Page 6']
  ];

  for (const item of tocItems) {
    p2.drawText(item[0], {
      x: MARGIN_X + 10,
      y: p2y,
      size: 8,
      font: fontBold,
      color: NAVY
    });
    p2.drawLine({
      start: { x: MARGIN_X + 340, y: p2y + 2 },
      end: { x: MARGIN_X + 460, y: p2y + 2 },
      thickness: 0.5,
      color: BORDER_COLOR
    });
    p2.drawText(item[1], {
      x: MARGIN_X + 475,
      y: p2y,
      size: 8,
      font: fontBold,
      color: AMBER
    });
    p2y -= 15;
  }

  p2y -= 10;

  // Chairman's Address
  p2y = drawSectionHeading(p2, p2y, "CHAIRMAN & MANAGING DIRECTOR'S MESSAGE", 'Empowering Healthcare Across Bihar & Eastern India', fontBold, font);

  p2y = drawCallout(p2, {
    x: MARGIN_X,
    y: p2y,
    width: CONTENT_WIDTH,
    title: '"Fostering Dignified Healthcare Leaders of Uncompromising Skill and Empathy"',
    textLines: [
      '"Nursing is universally revered as the noble backbone of all medical healing. In an era of accelerating clinical innovation',
      'and expanding primary healthcare needs, Bihar requires highly trained, compassionate nursing professionals who can step into',
      'critical care wards, emergency rooms, community dispensaries, and international hospitals with effortless confidence.',
      '',
      'Kavya Shree Institute of Nursing was conceived to bridge this vital regional gap. Our campus provides infrastructure on par',
      'with premier medical colleges--featuring modern simulation labs, digital classrooms, comprehensive library holdings, and direct',
      'bedside affiliations with 250+ bed clinical hospitals. We invite dedicated students to join our vibrant academic community and',
      'embark upon a transformative journey toward a rewarding, respected lifetime career in healthcare."',
      '',
      '-- Sri Shashi Kant Sharma, Chairman & Managing Director, Kavya Shree Institute of Nursing'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: NAVY,
    borderWidth: 4
  });

  p2y -= 15;

  // Principal's Academic Message
  p2y = drawSectionHeading(p2, p2y, "PRINCIPAL'S ACADEMIC ADDRESS", 'Clinical Rigor, Pedagogic Discipline and Bedside Ethics', fontBold, font);

  p2y = drawCallout(p2, {
    x: MARGIN_X,
    y: p2y,
    width: CONTENT_WIDTH,
    title: '"Translating Theoretical Rigor into Life-Saving Bedside Competence"',
    textLines: [
      '"At Kavya Shree Institute of Nursing, we believe that competent nursing combines scientific precision with sincere bedside',
      'compassion. Our faculty comprises seasoned nurse educators and clinical specialists who guide each student through structured',
      'curricula governed by the Indian Nursing Council and Bihar Nursing Registration Council.',
      '',
      'From Day One in our simulation laboratories, students master infection control, medication administration, resuscitation, and',
      'patient dignity before rotating through our affiliated multi-specialty clinical hospital wards. We maintain an uncompromising',
      'discipline regarding 80% classroom attendance, 100% clinical rotation completion, and zero tolerance for ragging. Welcome to',
      'an inspiring environment where your commitment to healing blossoms into world-class clinical competence."',
      '',
      '-- Prof. (Dr.) Sunita Kumari, M.Sc. Nursing, Ph.D., Principal & Academic Dean'
    ],
    font,
    fontBold,
    bgColor: SLATE_LIGHT,
    borderColor: AMBER,
    borderWidth: 4
  });

  p2y -= 15;

  // Four Core Pillars
  p2y = drawSectionHeading(p2, p2y, 'THE FOUR INSTITUTIONAL PILLARS', 'Our Core Operational Foundations', fontBold, font);

  const pillarW = (CONTENT_WIDTH - 15) / 4;
  const pillarH = 72;
  const pillars = [
    { title: '1. Diagnostic Rigor', lines: ['Mastery of anatomy,', 'pharmacology, and', 'evidence-based care.'] },
    { title: '2. Clinical Empathy', lines: ['Dignity in patient', 'communication & bedside', 'compassionate service.'] },
    { title: '3. Simulation Tech', lines: ['High-fidelity mannequins,', 'CPR, ICU, and maternal', 'clinical simulation.'] },
    { title: '4. Rural Outreach', lines: ['Active involvement in', 'public health, CHCs,', 'and preventive camps.'] }
  ];

  for (let i = 0; i < 4; i++) {
    const px = MARGIN_X + i * (pillarW + 5);
    p2.drawRectangle({
      x: px,
      y: p2y - pillarH,
      width: pillarW,
      height: pillarH,
      color: WHITE,
      borderColor: BORDER_COLOR,
      borderWidth: 0.5
    });
    p2.drawRectangle({
      x: px,
      y: p2y - 3,
      width: pillarW,
      height: 3,
      color: i % 2 === 0 ? NAVY : AMBER
    });
    p2.drawText(pillars[i].title, {
      x: px + 6,
      y: p2y - 15,
      size: 8,
      font: fontBold,
      color: NAVY
    });
    for (let l = 0; l < pillars[i].lines.length; l++) {
      p2.drawText(pillars[i].lines[l], {
        x: px + 6,
        y: p2y - 27 - l * 11,
        size: 7,
        font,
        color: TEXT_MUTED
      });
    }
  }

  // ----------------------------------------------------
  // PAGE 3: INFRASTRUCTURE & CLINICAL AFFILIATIONS
  // ----------------------------------------------------
  const p3 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p3, {
    docTitle: 'Institutional Prospectus 2026-27',
    sectionTitle: 'Infrastructure & Affiliations',
    pageNum: 3,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p3, { pageNum: 3, totalPages: TOTAL_PAGES, font, fontBold });

  let p3y = PAGE_HEIGHT - 55;

  p3y = drawSectionHeading(p3, p3y, 'CAMPUS INFRASTRUCTURE & SPECIALIZED LABORATORIES', 'State-of-the-Art Training Facilities Built to INC Norms', fontBold, font);

  const labs = [
    {
      name: 'Nursing Skills & Simulation Laboratory',
      desc: 'Equipped with full-body adult, pediatric, and birthing mannequins for hands-on practice. Students practice IV cannulation, catheterization, NG tube insertion, wound debridement, CPR, and automated external defibrillator (AED) operation in a safe, mentored simulation environment before hospital wards.'
    },
    {
      name: 'Pre-Clinical Science & Anatomy Museum',
      desc: 'Houses real human osteology sets, articulated skeletons, 3D anatomical torsos, organ cross-sections, and high-resolution histology microscopes. Enables students to grasp visceral anatomy and systemic physiology with crystal-clear visual clarity.'
    },
    {
      name: 'Maternal & Child Health (MCH) / Obstetrics Lab',
      desc: 'Features advanced birthing simulators, neonatal warmers, phototherapy incubators, infant weighing scales, fetal Doppler monitors, and delivery kits. Students master antenatal assessment, labor conduction, post-partum hemorrhage management, and APGAR scoring.'
    },
    {
      name: 'Community Health Nursing & Nutrition Lab',
      desc: 'Equipped with community outreach kits, bag-technique kits, family folder systems, and dietetics stations. Students learn caloric balancing, diabetic diet formulation, pediatric weaning recipes, and home-visit epidemiological protocols for rural public healthcare.'
    },
    {
      name: 'Central Health Sciences Library & Digital Hub',
      desc: 'Over 8,000 nursing and medical textbooks, subscriptions to leading national and international nursing journals, WHO technical reports, and a high-speed e-library terminal bank accessing digital repositories, Medline, and clinical databases.'
    },
    {
      name: 'Smart Lecture Theaters & Audio-Visual Hall',
      desc: 'Acoustically treated, tiered lecture theaters equipped with high-definition digital projectors, interactive smart screens, collar microphones, and high-speed Wi-Fi connectivity for multimedia medical case presentations and university webinars.'
    }
  ];

  for (const lab of labs) {
    p3.drawRectangle({
      x: MARGIN_X,
      y: p3y - 42,
      width: CONTENT_WIDTH,
      height: 42,
      color: WHITE,
      borderColor: BORDER_LIGHT,
      borderWidth: 0.5
    });
    p3.drawRectangle({
      x: MARGIN_X,
      y: p3y - 42,
      width: 3,
      height: 42,
      color: AMBER
    });
    p3.drawText(lab.name, {
      x: MARGIN_X + 10,
      y: p3y - 12,
      size: 8.5,
      font: fontBold,
      color: NAVY
    });
    const descLines = wrapText(lab.desc, CONTENT_WIDTH - 20, font, 7.2);
    for (let l = 0; l < descLines.length; l++) {
      p3.drawText(descLines[l], {
        x: MARGIN_X + 10,
        y: p3y - 23 - l * 9,
        size: 7.2,
        font,
        color: TEXT_MUTED
      });
    }
    p3y -= 48;
  }

  p3y -= 6;

  // Clinical Hospital Tie-up Banner
  p3y = drawSectionHeading(p3, p3y, 'CLINICAL HOSPITAL TIE-UPS & BEDSIDE INTERNSHIPS', '250+ Bed Multi-Specialty Clinical Immersion', fontBold, font);

  p3y = drawCallout(p3, {
    x: MARGIN_X,
    y: p3y,
    width: CONTENT_WIDTH,
    title: 'Supervised Clinical Hospital Rotations (Civil Hospitals & Community Health Centers)',
    textLines: [
      'Nursing theory is hollow without extensive bedside patient exposure. Kavya Shree Institute has formalized institutional tie-ups',
      'with an affiliated 250+ bed District Civil Hospital, regional sub-divisional medical centers, and Community Health Centers (CHCs).',
      '',
      '- Clinical Rotations: General Medicine, General Surgery, Orthopedics, Pediatrics & Neonatology, Obstetrics & Labor Room,',
      '  Intensive Care Units (ICU / ICCU / HDU), Emergency & Casualty, Operation Theatre (OT), Psychiatry, and Dermatology.',
      '- Community Field Postings: Mandatory rural and urban health center attachments for immunization drives, antenatal clinics,',
      '  tuberculosis control, pulse-polio campaigns, school health screenings, and family welfare counseling.',
      '- Mentorship Ratio: Strict clinical instructor-to-student supervision ratio of 1:10 ensures every student masters clinical procedures.'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: NAVY,
    borderWidth: 4
  });

  p3y -= 14;

  // Residential Hostels & Bus Transportation
  p3y = drawSectionHeading(p3, p3y, 'STUDENT RESIDENTIAL LIFE & CAMPUS COMMUTE', 'Secure Living Environment and Dedicated Transport Fleet', fontBold, font);

  const resCards = [
    {
      title: 'Hostel Accommodation (Boys & Girls)',
      bullets: [
        'Separate multi-story hostels with round-the-clock security and CCTV monitoring.',
        'Furnished rooms with bed, study desk, ergonomic chair, and private cupboard.',
        'Hygienic student dining hall serving nutritious balanced vegetarian & non-veg meals.',
        'Solar water heating, 24x7 power backup, and pure RO drinking water plants.'
      ]
    },
    {
      title: 'Dedicated College Bus Fleet',
      bullets: [
        'Fleet of GPS-enabled institutional buses connecting campus to major hubs.',
        'Direct connectivity to Patna Junction, Kankarbagh, Danapur, and Masaurhi.',
        'Scheduled daily transit for clinical rotations to affiliated civil hospitals and CHCs.',
        'Accompanied by staff supervisors and emergency first-aid kits on all routes.'
      ]
    }
  ];

  const cardW = (CONTENT_WIDTH - 12) / 2;
  const cardH = 75;

  for (let i = 0; i < 2; i++) {
    const cx = MARGIN_X + i * (cardW + 12);
    p3.drawRectangle({
      x: cx,
      y: p3y - cardH,
      width: cardW,
      height: cardH,
      color: WHITE,
      borderColor: BORDER_COLOR,
      borderWidth: 0.5
    });
    p3.drawRectangle({
      x: cx,
      y: p3y - 3,
      width: cardW,
      height: 3,
      color: i === 0 ? NAVY : AMBER
    });
    p3.drawText(resCards[i].title, {
      x: cx + 8,
      y: p3y - 14,
      size: 8,
      font: fontBold,
      color: NAVY
    });
    for (let b = 0; b < resCards[i].bullets.length; b++) {
      p3.drawText('* ' + resCards[i].bullets[b], {
        x: cx + 8,
        y: p3y - 25 - b * 11,
        size: 6.8,
        font,
        color: TEXT_MUTED
      });
    }
  }

  // ----------------------------------------------------
  // PAGE 4: ACADEMIC PROGRAMS & SEAT MATRIX
  // ----------------------------------------------------
  const p4 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p4, {
    docTitle: 'Institutional Prospectus 2026-27',
    sectionTitle: 'Academic Programs & Eligibility',
    pageNum: 4,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p4, { pageNum: 4, totalPages: TOTAL_PAGES, font, fontBold });

  let p4y = PAGE_HEIGHT - 55;

  p4y = drawSectionHeading(p4, p4y, 'ACADEMIC NURSING PROGRAMS & STATUTORY SEAT MATRIX', 'Comprehensive Professional Healthcare Disciplines for Session 2026-27', fontBold, font);

  const programsTable = {
    headers: ['Program & Level', 'Duration', 'Intake', 'Statutory Eligibility Criteria', 'Key Career Horizons'],
    colWidths: [100, 48, 40, 185, 150],
    rows: [
      [
        'Auxiliary Nursing & Midwifery (ANM)\n[Diploma]',
        '2 Years\n(Full-Time)',
        '60\nSeats',
        '10+2 passed in Arts / Science / Commerce from a recognized board (CBSE/ICSE/BSEB) with minimum 40% marks. Minimum age 17 yrs as on 31st Dec 2026.',
        'Primary Health Centers (PHCs), Sub-Centres, Child Health Programs, ASHA Team Lead, Rural Wellness Clinics.'
      ],
      [
        'General Nursing & Midwifery (GNM)\n[Diploma]',
        '3 Years\n(Full-Time)',
        '60\nSeats',
        '10+2 passed with English and minimum 40% aggregate marks. Science stream (Physics, Chemistry, Biology) preferred. Registered ANM candidates eligible.',
        'Staff Nurse in Super-Specialty Hospitals, ICU/OT Nurse, Trauma & Emergency Specialist, State Health Society.'
      ],
      [
        'Bachelor of Science in Nursing (B.Sc.)\n[UG Degree]',
        '4 Years\n(8 Sems)',
        '60\nSeats',
        '10+2 passed with Physics, Chemistry, Biology (PCB) & English core with minimum 45% aggregate marks (40% for SC/ST/OBC candidates). Minimum age 17 years.',
        'Nursing Officer (AIIMS/ESIC/Govt Hospitals), Clinical Nurse Specialist, Nurse Educator, Military Nursing (MNS), NCLEX Abroad.'
      ],
      [
        'Post Basic B.Sc. Nursing (P.B.B.Sc.)\n[Bridge Degree]',
        '2 Years\n(Full-Time)',
        '30\nSeats',
        'Passed Higher Secondary (10+2) and completed recognized GNM course. Must hold active RN/RM registration with State Nursing Council.',
        'Nursing Superintendent, Assistant Director of Nursing, Ward In-charge, Clinical Instructor, Collegiate Faculty.'
      ],
      [
        'Master of Science in Nursing (M.Sc.)\n[Postgraduate]',
        '2 Years\n(4 Sems)',
        '25\nSeats',
        'B.Sc. Nursing / Post Basic B.Sc. with minimum 55% aggregate marks + minimum 1 year clinical work experience. State Council Registration mandatory.',
        'Assistant Professor, Chief Nursing Officer (CNO), Clinical Researcher, Healthcare Administrator, International Specialist.'
      ]
    ]
  };

  p4y = drawTable(p4, {
    x: MARGIN_X,
    y: p4y,
    colWidths: programsTable.colWidths,
    headers: programsTable.headers,
    rows: programsTable.rows,
    font,
    fontBold,
    headerBg: NAVY,
    alternateBg: SLATE_LIGHT,
    fontSize: 7.2,
    lineHeight: 9.5,
    padding: 3.5
  });

  p4y -= 14;

  // Career Horizons & Global Avenues
  p4y = drawSectionHeading(p4, p4y, 'CAREER PATHWAYS, EMPLOYMENT HORIZONS & GLOBAL LICENSURE', 'Boundless Professional Opportunities for Certified Nursing Graduates', fontBold, font);

  const careerCols = [
    {
      title: 'Public Sector & Central Govt.',
      points: [
        'All India Institutes of Medical Sciences (AIIMS NORCET exams).',
        'Employees State Insurance Corporation (ESIC) hospitals nationwide.',
        'Military Nursing Services (MNS) commissioned officer rankings.',
        'Railway Recruitment Board (RRB) Hospital Nursing Superintendent.',
        'Bihar State Health Society (SHSB) Community Health Officers (CHO).'
      ]
    },
    {
      title: 'Corporate Super-Specialties',
      points: [
        'Premier private hospital chains (Apollo, Fortis, Max, Medanta).',
        'Intensive Care (ICU/CCU), Neonatal ICU (NICU), and Emergency trauma.',
        'Cardiac catheterization labs and organ transplant recovery units.',
        'Infection control officer and hospital quality accreditation (NABH).',
        'Clinical research associates in pharmaceutical clinical trials.'
      ]
    },
    {
      title: 'Global Healthcare Horizons',
      points: [
        'United States & Canada: NCLEX-RN fast-track licensure preparation.',
        'United Kingdom: NHS Nursing registration via NMC CBT & OSCE.',
        'Gulf Cooperation Council (GCC): DHA (Dubai), MOH, HAAD, Prometric.',
        'Australia & New Zealand: AHPRA outcome-based assessment (OBA).',
        'High global demand, tax-free packages, and permanent residency paths.'
      ]
    }
  ];

  const colW = (CONTENT_WIDTH - 16) / 3;
  const colH = 100;

  for (let i = 0; i < 3; i++) {
    const cx = MARGIN_X + i * (colW + 8);
    p4.drawRectangle({
      x: cx,
      y: p4y - colH,
      width: colW,
      height: colH,
      color: WHITE,
      borderColor: BORDER_COLOR,
      borderWidth: 0.5
    });
    p4.drawRectangle({
      x: cx,
      y: p4y - 3,
      width: colW,
      height: 3,
      color: i === 0 ? NAVY : (i === 1 ? AMBER : GREEN)
    });
    p4.drawText(careerCols[i].title, {
      x: cx + 6,
      y: p4y - 14,
      size: 7.8,
      font: fontBold,
      color: NAVY
    });
    for (let p = 0; p < careerCols[i].points.length; p++) {
      const wrappedPt = wrapText('* ' + careerCols[i].points[p], colW - 12, font, 6.8);
      for (let l = 0; l < wrappedPt.length; l++) {
        p4.drawText(wrappedPt[l], {
          x: cx + 6,
          y: p4y - 25 - p * 14 - l * 8,
          size: 6.8,
          font,
          color: TEXT_MUTED
        });
      }
    }
  }

  p4y -= colH + 12;

  // Regulatory Seat Matrix Note
  drawCallout(p4, {
    x: MARGIN_X,
    y: p4y,
    width: CONTENT_WIDTH,
    title: 'STATUTORY SEAT MATRIX & RESERVATION POLICY',
    textLines: [
      '- Seat allotments conform strictly to Bihar Government statutory reservation matrices (SC, ST, OBC, EBC, EWS, PwD, and General).',
      '- Minimum age requirement: Candidate must have attained 17 years of age on or before 31st December of the admission year.',
      '- Medical Fitness: Every admitted student must submit an authorized medical fitness certificate from a registered medical practitioner.'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: NAVY,
    borderWidth: 3
  });

  // ----------------------------------------------------
  // PAGE 5: FEE STRUCTURE, BSCC & REFUND POLICY
  // ----------------------------------------------------
  const p5 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p5, {
    docTitle: 'Institutional Prospectus 2026-27',
    sectionTitle: 'Fee Guidelines & Refunds',
    pageNum: 5,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p5, { pageNum: 5, totalPages: TOTAL_PAGES, font, fontBold });

  let p5y = PAGE_HEIGHT - 55;

  p5y = drawSectionHeading(p5, p5y, 'FEE STRUCTURE TRANSPARENCY & BSCC LOAN FACILITATION', 'Committed to Fair, Affordable and Uncompromising Financial Integrity', fontBold, font);

  p5y = drawCallout(p5, {
    x: MARGIN_X,
    y: p5y,
    width: CONTENT_WIDTH,
    title: 'Principles of Financial Transparency & Non-Exploitation',
    textLines: [
      'Kavya Shree Institute strictly upholds the guidelines of statutory regulatory bodies prohibiting arbitrary fee levies or capitation.',
      '- Tuition fees are scheduled on an annual / semester basis and notified transparently at the time of counseling and enrollment.',
      '- Fees cover classroom instruction, simulation laboratory consumables, clinical hospital posting charges, and health library access.',
      '- Caution deposits are 100% refundable upon course completion and submission of an official departmental No-Dues clearance.',
      '- All fee remittances must be executed strictly via official banking channels (Bank DD / NEFT / RTGS / Institutional Portal).'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: NAVY,
    borderWidth: 3.5
  });

  p5y -= 14;

  // Bihar Student Credit Card (BSCC) Section
  p5y = drawSectionHeading(p5, p5y, 'BIHAR STUDENT CREDIT CARD (BSCC) SCHEME DESK', 'Government Education Loan Assistance up to Rs. 4,00,000/-', fontBold, font);

  const bsccPoints = [
    ['Nodal BSCC Cell:', 'An institutional facilitation desk operates on campus to assist students with DRCC paperwork, bonafide certificates, and fee schedule verification.'],
    ['Loan Quantum:', 'Eligible Bihar domicile candidates can secure up to Rs. 4,00,000/- to finance tuition fees, books, laptops, and hostel accommodation.'],
    ['Subsidized Interest:', 'Special concessional simple interest of 1% for female, transgender, and differently-abled candidates (4% for male candidates).'],
    ['Repayment Moratorium:', 'Repayment commences only 1 year after course completion or 6 months after securing employment, whichever is earlier.'],
    ['Direct Bank Transfer:', 'Loan installments are disbursed directly by the Bihar State Educational Finance Corporation (BSEFC) to the college account.']
  ];

  for (const b of bsccPoints) {
    p5.drawText(b[0], {
      x: MARGIN_X + 8,
      y: p5y,
      size: 7.8,
      font: fontBold,
      color: GREEN
    });
    p5.drawText(b[1], {
      x: MARGIN_X + 115,
      y: p5y,
      size: 7.5,
      font,
      color: TEXT_DARK
    });
    p5y -= 13;
  }

  p5y -= 10;

  // Statutory Refund Schedule
  p5y = drawSectionHeading(p5, p5y, 'STATUTORY FEE REFUND SCHEDULE (INC & UGC NORMS)', 'Guaranteed Rights and Timelines for Seat Withdrawal and Remittance', fontBold, font);

  const refundTable = {
    headers: ['Notice of Seat Withdrawal Received by Registrar Office', 'Refund Percentage', 'Retention / Administrative Deductions'],
    colWidths: [225, 115, 183],
    rows: [
      [
        '15 days or more before the formally notified last date of admission',
        '100% of Tuition Fees',
        'Nominal processing charge not exceeding Rs. 1,000/- only'
      ],
      [
        'Less than 15 days before the formally notified last date of admission',
        '90% of Tuition Fees',
        '10% administrative processing fee deducted'
      ],
      [
        'Less than 15 days after the formally notified last date of admission',
        '80% of Tuition Fees',
        '20% institutional infrastructure fee deducted'
      ],
      [
        'Between 16 and 30 days after the formally notified last date of admission',
        '50% of Tuition Fees',
        '50% academic fee retained'
      ],
      [
        'More than 30 days after the formally notified last date of admission',
        '0% (Nil Refund of Tuition)',
        'Caution money refunded in full upon No-Dues clearance'
      ]
    ]
  };

  p5y = drawTable(p5, {
    x: MARGIN_X,
    y: p5y,
    colWidths: refundTable.colWidths,
    headers: refundTable.headers,
    rows: refundTable.rows,
    font,
    fontBold,
    headerBg: NAVY,
    alternateBg: SLATE_LIGHT,
    fontSize: 7.2,
    lineHeight: 9.5,
    padding: 3.5
  });

  p5y -= 14;

  // Refund Terms Callout
  drawCallout(p5, {
    x: MARGIN_X,
    y: p5y,
    width: CONTENT_WIDTH,
    title: 'MANDATORY PROCEDURE FOR FEE REFUND DISBURSEMENT',
    textLines: [
      '1. Formal Application: Withdrawal request must be submitted in writing, signed by both the student and parent/guardian.',
      '2. Departmental Clearances: Submission of No-Dues certificates from Library, Skills Lab, Hostel Warden, and Accounts section.',
      '3. Electronic Disbursement: Approved refunds are credited directly to the verified bank account of the candidate/parent via NEFT/RTGS',
      '   within 15 to 30 working days from complete clearance receipt. No cash refunds are permitted under institutional policy.',
      '4. BSCC Candidates: In case of BSCC funding, returnable fees are remitted directly back to BSEFC / lender bank as per Govt directives.'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: AMBER,
    borderWidth: 3.5
  });

  // ----------------------------------------------------
  // PAGE 6: CODE OF CONDUCT, ANTI-RAGGING & CONTACTS
  // ----------------------------------------------------
  const p6 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p6, {
    docTitle: 'Institutional Prospectus 2026-27',
    sectionTitle: 'Governance & Disclosures',
    pageNum: 6,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p6, { pageNum: 6, totalPages: TOTAL_PAGES, font, fontBold });

  let p6y = PAGE_HEIGHT - 55;

  p6y = drawSectionHeading(p6, p6y, 'CAMPUS CODE OF CONDUCT & PROFESSIONAL DISCIPLINE', 'Ethics, Attendance Mandates and Clinical Decorum', fontBold, font);

  const conductRules = [
    ['Mandatory Attendance:', 'As per INC & University regulations, 80% classroom attendance and 100% hospital clinical rotation attendance is strictly mandatory to appear in annual/semester examinations.'],
    ['Clinical Uniform Code:', 'Students must appear in pristine, prescribed institutional uniform with photo ID badge, stethoscopes, and grooming standards during all clinical postings and labs.'],
    ['Hospital Ethics & Confidentiality:', 'Strict adherence to patient confidentiality and professional medical ethics. Unauthorized photography or disclosure of clinical records is a punishable offense.'],
    ['Substance Abuse Ban:', 'The entire campus, hostels, and clinical premises are strictly alcohol, tobacco, and substance-free zones. Any violation entails immediate expulsion.']
  ];

  for (const c of conductRules) {
    p6.drawText(c[0], {
      x: MARGIN_X + 8,
      y: p6y,
      size: 7.8,
      font: fontBold,
      color: NAVY
    });
    p6.drawText(c[1], {
      x: MARGIN_X + 130,
      y: p6y,
      size: 7.3,
      font,
      color: TEXT_DARK
    });
    p6y -= 15;
  }

  p6y -= 10;

  // Zero-Tolerance Anti-Ragging Policy
  p6y = drawSectionHeading(p6, p6y, 'ZERO TOLERANCE ANTI-RAGGING POLICY (SUPREME COURT DIRECTIVE)', 'Strict Criminal Liability Pursuant to Hon\'ble Supreme Court & UGC Guidelines', fontBold, font);

  // Big Red Alert Box
  p6.drawRectangle({
    x: MARGIN_X,
    y: p6y - 50,
    width: CONTENT_WIDTH,
    height: 50,
    color: RED_BG,
    borderColor: RED,
    borderWidth: 1.5
  });

  p6.drawText('NATIONAL ANTI-RAGGING 24x7 TOLL-FREE HELPLINE: 1800-180-5522', {
    x: MARGIN_X + 12,
    y: p6y - 18,
    size: 9.5,
    font: fontBold,
    color: RED
  });
  p6.drawText('Email: helpline@antiragging.in | Web Portal: www.antiragging.in | Campus Police Liaison: Punpun P.S.', {
    x: MARGIN_X + 12,
    y: p6y - 32,
    size: 7.8,
    font,
    color: TEXT_DARK
  });
  p6.drawText('Ragging in any form is a non-bailable criminal offense resulting in immediate expulsion, cancellation of admission & police FIR.', {
    x: MARGIN_X + 12,
    y: p6y - 44,
    size: 7,
    font: fontBold,
    color: RED
  });

  p6y -= 62;

  // Anti-Ragging Committee details
  p6y = drawCallout(p6, {
    x: MARGIN_X,
    y: p6y,
    width: CONTENT_WIDTH,
    title: 'Institutional Anti-Ragging Committee (ARC) & Flying Squad (ARS)',
    textLines: [
      '- Committee Composition: Headed by Principal, senior nursing faculty, legal advisor, local police inspector, and student/parent nominees.',
      '- Flying Squad Patrols: Surprise day and night inspections across campus common areas, college buses, and off-campus student hostels.',
      '- Mandatory Affidavits: Every admitted candidate and their parents must execute statutory anti-ragging undertakings during admission.',
      '- Punitive Measures: Rustication, suspension, withholding of degrees, debarment from clinical training, and criminal prosecution.'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: RED,
    borderWidth: 3.5
  });

  p6y -= 14;

  // Campus Admissions Desk & Final Inquiries
  p6y = drawSectionHeading(p6, p6y, 'ADMISSIONS INFORMATION DESK & CONTACT DIRECTORY', 'Visit Our Campus or Connect with Admissions Counselors', fontBold, font);

  const contactGridW = (CONTENT_WIDTH - 12) / 2;
  const contactGridH = 80;

  // Box 1: Campus Address & Hours
  p6.drawRectangle({
    x: MARGIN_X,
    y: p6y - contactGridH,
    width: contactGridW,
    height: contactGridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p6.drawRectangle({
    x: MARGIN_X,
    y: p6y - 3,
    width: contactGridW,
    height: 3,
    color: NAVY
  });
  p6.drawText('Campus Location & Visiting Hours', {
    x: MARGIN_X + 8,
    y: p6y - 14,
    size: 8,
    font: fontBold,
    color: NAVY
  });
  p6.drawText('Kavya Shree Institute of Nursing', {
    x: MARGIN_X + 8,
    y: p6y - 26,
    size: 7.5,
    font: fontBold,
    color: TEXT_DARK
  });
  p6.drawText('Punpun Station Road, Opp. Manglam Community Hall,', {
    x: MARGIN_X + 8,
    y: p6y - 37,
    size: 7.2,
    font,
    color: TEXT_MUTED
  });
  p6.drawText('Punpun, Patna District, Bihar - PIN 804453', {
    x: MARGIN_X + 8,
    y: p6y - 48,
    size: 7.2,
    font,
    color: TEXT_MUTED
  });
  p6.drawText('Counseling Hours: Mon - Sat: 9:00 AM - 5:00 PM IST', {
    x: MARGIN_X + 8,
    y: p6y - 62,
    size: 7.2,
    font: fontBold,
    color: AMBER
  });

  // Box 2: Phone & Email
  p6.drawRectangle({
    x: MARGIN_X + contactGridW + 12,
    y: p6y - contactGridH,
    width: contactGridW,
    height: contactGridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p6.drawRectangle({
    x: MARGIN_X + contactGridW + 12,
    y: p6y - 3,
    width: contactGridW,
    height: 3,
    color: AMBER
  });
  p6.drawText('Telecommunications & Electronic Enquiries', {
    x: MARGIN_X + contactGridW + 20,
    y: p6y - 14,
    size: 8,
    font: fontBold,
    color: NAVY
  });
  p6.drawText('Admissions Helplines:', {
    x: MARGIN_X + contactGridW + 20,
    y: p6y - 26,
    size: 7.2,
    font: fontBold,
    color: TEXT_DARK
  });
  p6.drawText('+91 96616 66485 / +91 62878 79239', {
    x: MARGIN_X + contactGridW + 20,
    y: p6y - 37,
    size: 7.5,
    font: fontBold,
    color: GREEN
  });
  p6.drawText('Official Email: admissions@kavyashreenursing.edu.in', {
    x: MARGIN_X + contactGridW + 20,
    y: p6y - 49,
    size: 7.2,
    font,
    color: TEXT_MUTED
  });
  p6.drawText('Website: https://kavyashreenursing.edu.in', {
    x: MARGIN_X + contactGridW + 20,
    y: p6y - 62,
    size: 7.2,
    font: fontBold,
    color: NAVY
  });

  p6y -= contactGridH + 12;

  // Closing Sign-off Stamp
  p6.drawRectangle({
    x: MARGIN_X,
    y: p6y - 45,
    width: CONTENT_WIDTH,
    height: 45,
    color: BG_STONE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });

  p6.drawText('Issued under the authority of the Governing Council & Academic Board of Kavya Shree Institute of Nursing.', {
    x: MARGIN_X + 12,
    y: p6y - 15,
    size: 7.5,
    font: fontBold,
    color: NAVY
  });
  p6.drawText('All admissions for Session 2026-27 remain subject to statutory council notifications, eligibility verification, and seat availability.', {
    x: MARGIN_X + 12,
    y: p6y - 27,
    size: 7,
    font,
    color: TEXT_MUTED
  });
  p6.drawText('For online applications, syllabus downloads and institutional notifications, visit: https://kavyashreenursing.edu.in', {
    x: MARGIN_X + 12,
    y: p6y - 38,
    size: 7,
    font: fontBold,
    color: AMBER
  });

  // Save Prospectus
  const pdfBytes = await doc.save();
  const filePath = path.join(outputDir, 'prospectus-2026.pdf');
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`[1/3] Successfully generated: ${filePath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

// ==========================================
// DOCUMENT 2: ADMISSION FORM 2026-2027 (3 PAGES)
// ==========================================

async function generateAdmissionForm(outputDir, logoBytes) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let logoImg = null;
  if (logoBytes) {
    try {
      logoImg = await doc.embedPng(logoBytes);
    } catch (e) {
      console.warn('Could not embed logo image in admission form:', e.message);
    }
  }

  const TOTAL_PAGES = 3;

  // ----------------------------------------------------
  // PAGE 1: HEADER, PHOTO BOX, PART A, PART B, PART C
  // ----------------------------------------------------
  const p1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Amber top strip
  p1.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 4,
    width: PAGE_WIDTH,
    height: 4,
    color: AMBER
  });

  // Formal Institute Header Banner
  let hy = PAGE_HEIGHT - 12;

  // Embed Logo on top left
  if (logoImg) {
    const lH = 46;
    const lW = lH * (logoImg.width / logoImg.height);
    p1.drawImage(logoImg, {
      x: MARGIN_X,
      y: hy - lH,
      width: lW,
      height: lH
    });
  }

  // Header Text
  p1.drawText('KAVYA SHREE INSTITUTE OF NURSING', {
    x: MARGIN_X + 60,
    y: hy - 14,
    size: 13,
    font: fontBold,
    color: NAVY
  });

  p1.drawText('Punpun Station Road, Opp. Manglam Community Hall, Punpun, Patna, Bihar - 804453', {
    x: MARGIN_X + 60,
    y: hy - 26,
    size: 7.8,
    font,
    color: TEXT_MUTED
  });

  p1.drawText('Admissions Desk: +91 96616 66485 / +91 62878 79239 | Email: admissions@kavyashreenursing.edu.in', {
    x: MARGIN_X + 60,
    y: hy - 37,
    size: 7.2,
    font,
    color: TEXT_MUTED
  });

  // Photo Paste Box on Top Right
  const photoW = 85;
  const photoH = 105;
  const photoX = PAGE_WIDTH - MARGIN_X - photoW;
  const photoY = PAGE_HEIGHT - 12 - photoH;

  p1.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoW,
    height: photoH,
    color: BG_STONE,
    borderColor: BORDER_COLOR,
    borderWidth: 1
  });

  p1.drawText('AFFIX RECENT', {
    x: photoX + 12,
    y: photoY + 68,
    size: 6.8,
    font: fontBold,
    color: TEXT_MUTED
  });
  p1.drawText('COLOR PASSPORT', {
    x: photoX + 8,
    y: photoY + 56,
    size: 6.8,
    font: fontBold,
    color: TEXT_MUTED
  });
  p1.drawText('PHOTOGRAPH', {
    x: photoX + 13,
    y: photoY + 44,
    size: 6.8,
    font: fontBold,
    color: TEXT_MUTED
  });
  p1.drawText('(Self-Attested Across)', {
    x: photoX + 6,
    y: photoY + 28,
    size: 6,
    font,
    color: TEXT_MUTED
  });
  p1.drawText('Size: 3.5cm x 4.5cm', {
    x: photoX + 10,
    y: photoY + 16,
    size: 6,
    font,
    color: TEXT_MUTED
  });

  // Title Box
  const titleBoxY = hy - 48;
  const titleBoxW = CONTENT_WIDTH - photoW - 12;

  p1.drawRectangle({
    x: MARGIN_X,
    y: titleBoxY - 26,
    width: titleBoxW,
    height: 26,
    color: NAVY
  });

  const fTitle = 'APPLICATION FORM FOR ADMISSION (SESSION 2026-2027)';
  p1.drawText(fTitle, {
    x: MARGIN_X + 10,
    y: titleBoxY - 17,
    size: 8.8,
    font: fontBold,
    color: WHITE
  });

  // Reference Number & Date Row
  const metaY = titleBoxY - 50;
  p1.drawText('Application Ref. No.:', {
    x: MARGIN_X,
    y: metaY,
    size: 8,
    font: fontBold,
    color: TEXT_DARK
  });

  p1.drawRectangle({
    x: MARGIN_X + 90,
    y: metaY - 3,
    width: 140,
    height: 15,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p1.drawText('KSIN / 2026 / ____________', {
    x: MARGIN_X + 94,
    y: metaY + 1,
    size: 7.5,
    font,
    color: TEXT_MUTED
  });

  p1.drawText('Date of Submission: ____ / ____ / 2026', {
    x: MARGIN_X + 245,
    y: metaY,
    size: 8,
    font: fontBold,
    color: TEXT_DARK
  });

  // Instruction Box
  let p1y = photoY - 8;
  p1.drawRectangle({
    x: MARGIN_X,
    y: p1y - 18,
    width: CONTENT_WIDTH,
    height: 18,
    color: SLATE_LIGHT,
    borderColor: BORDER_LIGHT,
    borderWidth: 0.5
  });

  p1.drawText('INSTRUCTIONS: Fill in BLOCK CAPITAL LETTERS using Blue or Black ballpoint pen. Leave one box blank between words. Strike through non-applicable items.', {
    x: MARGIN_X + 6,
    y: p1y - 12,
    size: 6.6,
    font: fontBold,
    color: NAVY
  });

  p1y -= 26;

  // ----------------------------------------------------
  // PART A: PROGRAM APPLIED FOR
  // ----------------------------------------------------
  p1y = drawSectionHeading(p1, p1y, 'PART A: PROGRAM APPLIED FOR (Select Exactly One)', null, fontBold, font);

  const programsCheck = [
    '[  ] B.Sc. Nursing (4 Years Undergraduate Degree)',
    '[  ] GNM - General Nursing & Midwifery (3 Years Diploma)',
    '[  ] ANM - Auxiliary Nursing & Midwifery (2 Years Diploma)',
    '[  ] Post Basic B.Sc. Nursing (2 Years Degree for GNM Nurses)',
    '[  ] M.Sc. Nursing (2 Years Postgraduate Specialization)'
  ];

  for (let i = 0; i < programsCheck.length; i++) {
    const colIdx = i % 2;
    const rowIdx = Math.floor(i / 2);
    const colX = MARGIN_X + 10 + colIdx * 255;
    const itemY = p1y - rowIdx * 14;
    p1.drawText(programsCheck[i], {
      x: colX,
      y: itemY,
      size: 7.4,
      font: fontBold,
      color: NAVY
    });
  }
  p1y -= Math.ceil(programsCheck.length / 2) * 14 + 6;

  // Quota / Category Row
  p1.drawText('Admission Quota / Category:   [  ] General     [  ] OBC / BC     [  ] EBC     [  ] SC     [  ] ST     [  ] EWS (Economically Weaker)     [  ] PwD', {
    x: MARGIN_X + 10,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });

  p1y -= 14;

  // ----------------------------------------------------
  // PART B: CANDIDATE PERSONAL PROFILE
  // ----------------------------------------------------
  p1y = drawSectionHeading(p1, p1y, 'PART B: CANDIDATE PERSONAL PROFILE', null, fontBold, font);

  // Full Name in Block Letters (Box grid)
  p1.drawText('1. Candidate Full Name (IN BLOCK LETTERS AS PER MATRICULATION CERTIFICATE):', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.4,
    font: fontBold,
    color: TEXT_DARK
  });
  p1y -= 16;

  const boxSize = 13.5;
  const boxCount = 30;
  for (let b = 0; b < boxCount; b++) {
    p1.drawRectangle({
      x: MARGIN_X + 6 + b * (boxSize + 3),
      y: p1y,
      width: boxSize,
      height: boxSize,
      color: WHITE,
      borderColor: BORDER_COLOR,
      borderWidth: 0.5
    });
  }
  p1y -= 14;

  // DOB, Gender, Blood Group
  p1.drawText('2. Date of Birth (DD/MM/YYYY): [   ] [   ] / [   ] [   ] / [   ] [   ] [   ] [   ]   Age as on 31 Dec 2026: _____ Yrs _____ Mos', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText('3. Gender:  [  ] Female    [  ] Male    [  ] Other     |   Blood Group: [          ]   |   Marital Status:  [  ] Unmarried    [  ] Married', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText('4. Aadhaar Card Number: [   ] [   ] [   ] [   ] - [   ] [   ] [   ] [   ] - [   ] [   ] [   ] [   ]     (Enclose Self-Attested Photocopy)', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText('5. Nationality: [  ] Indian    [  ] Other: ___________   |   Religion: ___________________   |   Mother Tongue: ___________________', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText('6. Domicile State: [  ] Bihar    [  ] Other: ___________   |   Specially Abled / PwD:  [  ] Yes    [  ] No  (If Yes, specify %: _____%)', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 16;

  // ----------------------------------------------------
  // PART C: PARENTS & GUARDIAN PARTICULARS
  // ----------------------------------------------------
  p1y = drawSectionHeading(p1, p1y, 'PART C: PARENTS & GUARDIAN PARTICULARS', null, fontBold, font);

  p1.drawText("1. Father's Full Name: _____________________________________________________   Occupation: _______________________________", {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText("2. Mother's Full Name: _____________________________________________________   Occupation: _______________________________", {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText("3. Guardian's Name (if applicable): __________________________________________   Relationship: ____________________________", {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText("4. Family Annual Income (from all sources): Rs. ______________________________   BPL Card Holder:  [  ] Yes    [  ] No", {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText('5. Permanent Address: At/Vill: _________________________________________  Post Office: ____________________________________', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 12;

  p1.drawText('   Police Station: _________________________  District: _________________________  State: _________________  PIN: [      ]', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText('6. Mailing / Correspondence Address:  [  ] Same as Permanent Address, or:', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 12;

  p1.drawText('   Address: __________________________________________________________________  District: ______________  PIN: [      ]', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 13;

  p1.drawText('7. Contact Verification: Candidate Mobile: [                ]   WhatsApp: [                ]   Email: _______________________', {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });
  p1y -= 12;

  p1.drawText("   Parent/Guardian Mobile: [                ]   Alternate Emergency Contact: [                ]", {
    x: MARGIN_X + 6,
    y: p1y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });

  drawPageFooter(p1, { pageNum: 1, totalPages: TOTAL_PAGES, font, fontBold });

  // ----------------------------------------------------
  // PAGE 2: EDUCATIONAL CREDENTIALS, OPT-IN & CHECKLIST
  // ----------------------------------------------------
  const p2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p2, {
    docTitle: 'Offline Admissions Application Form 2026-27',
    sectionTitle: 'Academic Records & Checklist',
    pageNum: 2,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p2, { pageNum: 2, totalPages: TOTAL_PAGES, font, fontBold });

  let p2y = PAGE_HEIGHT - 55;

  // PART D: EDUCATIONAL QUALIFICATIONS
  p2y = drawSectionHeading(p2, p2y, 'PART D: ACADEMIC CREDENTIALS & PREVIOUS EDUCATIONAL RECORDS', null, fontBold, font);

  const eduTable = {
    headers: ['Examination Passed', 'Board / Council / University', 'School / College Name', 'Year of Passing', 'Roll Number', 'Max Marks', 'Marks Obt.', '% Marks'],
    colWidths: [85, 95, 125, 42, 55, 38, 42, 41],
    rows: [
      ['10th / Matriculation', '', '', '', '', '', '', ''],
      ['12th / Intermediate (10+2)', '', '', '', '', '', '', ''],
      ['GNM Diploma (if Post Basic)', '', '', '', '', '', '', ''],
      ['B.Sc. / P.B.B.Sc. (if M.Sc.)', '', '', '', '', '', '', '']
    ]
  };

  p2y = drawTable(p2, {
    x: MARGIN_X,
    y: p2y,
    colWidths: eduTable.colWidths,
    headers: eduTable.headers,
    rows: eduTable.rows,
    font,
    fontBold,
    headerBg: NAVY,
    alternateBg: WHITE,
    fontSize: 7,
    lineHeight: 11,
    padding: 3
  });

  p2y -= 10;

  // Intermediate Marks Breakdown
  p2.drawRectangle({
    x: MARGIN_X,
    y: p2y - 36,
    width: CONTENT_WIDTH,
    height: 36,
    color: SLATE_LIGHT,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });

  p2.drawText('Class 12th (Intermediate) Subject-Wise Marks Breakdown (For B.Sc. & GNM Applicants):', {
    x: MARGIN_X + 8,
    y: p2y - 12,
    size: 7.2,
    font: fontBold,
    color: NAVY
  });

  p2.drawText('Physics: Max [     ] Obt [     ]   |   Chemistry: Max [     ] Obt [     ]   |   Biology: Max [     ] Obt [     ]   |   English: Max [     ] Obt [     ]', {
    x: MARGIN_X + 8,
    y: p2y - 23,
    size: 7,
    font,
    color: TEXT_DARK
  });

  p2.drawText('PCB Aggregate Total: Max [       ] Obt [       ]  =  [       ]%   |   Overall 10+2 Aggregate Percentage: [       ]%', {
    x: MARGIN_X + 8,
    y: p2y - 33,
    size: 7,
    font: fontBold,
    color: TEXT_DARK
  });

  p2y -= 44;

  // Prior Nursing Registration Box (for Post Basic & M.Sc.)
  p2.drawRectangle({
    x: MARGIN_X,
    y: p2y - 28,
    width: CONTENT_WIDTH,
    height: 28,
    color: BG_STONE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });

  p2.drawText('For Post Basic B.Sc. & M.Sc. Applicants Only (Nursing Council Registration Details):', {
    x: MARGIN_X + 8,
    y: p2y - 10,
    size: 7.2,
    font: fontBold,
    color: NAVY
  });

  p2.drawText('RN/RM Registration No.: __________________________  State Nursing Council: __________________________  Registration Date: ____/____/________', {
    x: MARGIN_X + 8,
    y: p2y - 22,
    size: 7,
    font,
    color: TEXT_DARK
  });

  p2y -= 36;

  // PART E: CAMPUS FACILITIES & BSCC OPT-IN
  p2y = drawSectionHeading(p2, p2y, 'PART E: CAMPUS HOSTEL, TRANSPORTATION & BSCC OPT-IN', null, fontBold, font);

  const optIns = [
    '1. Hostel Accommodation Required:  [  ] Yes    [  ] No      (Preference:  [  ] Single Room   [  ] Double Sharing   [  ] Triple Sharing)',
    '2. Dietary Preference in Mess:      [  ] Pure Vegetarian     [  ] Non-Vegetarian',
    '3. College Bus Transport Required:  [  ] Yes    [  ] No      (Proposed Boarding Stop / Station: ________________________________)',
    '4. Bihar Student Credit Card (BSCC) Education Loan Assistance Required:  [  ] Yes    [  ] No'
  ];

  for (const opt of optIns) {
    p2.drawText(opt, {
      x: MARGIN_X + 6,
      y: p2y,
      size: 7.3,
      font,
      color: TEXT_DARK
    });
    p2y -= 13;
  }

  p2y -= 6;

  // PART F: DOCUMENT ENCLOSURE CHECKLIST
  p2y = drawSectionHeading(p2, p2y, 'PART F: MANDATORY DOCUMENT SCRUTINY CHECKLIST', 'Tick the documents enclosed (Self-attested photocopies unless original indicated)', fontBold, font);

  const checklistTable = {
    headers: ['Sl.', 'Document Description', 'Enclosed (Candidate)', 'Verified (Office)'],
    colWidths: [25, 368, 65, 65],
    rows: [
      ['1.', 'Self-attested photocopy of Matriculation (10th) Admit Card, Marksheet & Certificate (Age Proof)', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['2.', 'Self-attested photocopy of Intermediate (10+2) Marksheet & Provisional/Original Certificate', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['3.', 'Original College Leaving Certificate (CLC) / School Leaving Certificate (SLC) / Transfer Certificate', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['4.', 'Original Migration Certificate issued by the previous Board / University', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['5.', 'Character Certificate from the Head of the Institution last attended', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['6.', 'Caste / Category Certificate issued by Competent Authority (SDO / CO) for SC / ST / OBC / EBC candidates', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['7.', 'Income & Asset Certificate for Economically Weaker Section (EWS) candidates (if applicable)', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['8.', 'Residential / Domicile Certificate of Bihar (Mandatory for BSCC scheme & reservation)', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['9.', 'Self-attested copy of Aadhaar Card of Candidate and Father / Mother / Guardian', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['10.', 'Six (6) recent passport-sized color photographs in formal attire (Name and DOB on reverse)', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['11.', 'Medical Fitness Certificate signed by a Registered Government Medical Practitioner (MBBS/MD)', '[  ] Yes   [  ] No', '[  ] Verified'],
      ['12.', 'State Nursing Council RN/RM Registration Certificate (For Post Basic B.Sc. & M.Sc. applicants only)', '[  ] Yes   [  ] N/A', '[  ] Verified']
    ]
  };

  p2y = drawTable(p2, {
    x: MARGIN_X,
    y: p2y,
    colWidths: checklistTable.colWidths,
    headers: checklistTable.headers,
    rows: checklistTable.rows,
    font,
    fontBold,
    headerBg: NAVY,
    alternateBg: SLATE_LIGHT,
    fontSize: 6.8,
    lineHeight: 8.5,
    padding: 2.5
  });

  // ----------------------------------------------------
  // PAGE 3: UNDERTAKINGS, SIGNATURES & OFFICE ENDORSEMENT
  // ----------------------------------------------------
  const p3 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p3, {
    docTitle: 'Offline Admissions Application Form 2026-27',
    sectionTitle: 'Declarations & Office Endorsement',
    pageNum: 3,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p3, { pageNum: 3, totalPages: TOTAL_PAGES, font, fontBold });

  let p3y = PAGE_HEIGHT - 55;

  p3y = drawSectionHeading(p3, p3y, 'PART G: SOLEMN UNDERTAKINGS & DECLARATIONS BY CANDIDATE', null, fontBold, font);

  const undertakings = [
    '1. Declaration of Truthfulness: I hereby solemnly affirm that all information, personal particulars, academic records, and document copies submitted in this application are completely genuine, correct, and authentic. I acknowledge that if any statement, marksheet, or certificate is found to be false, fabricated, or misrepresented at any time during admission or subsequent academic years, my admission shall stand summarily canceled without notice, all deposited fees shall be forfeited, and I shall be subject to legal prosecution under law.',
    '2. Statutory Anti-Ragging Undertaking: I have read and fully understood the statutory Anti-Ragging regulations enacted by the Hon\'ble Supreme Court of India, UGC, and Indian Nursing Council. I hereby solemnly pledge that I will never participate in, abet, or propagate ragging in any form within campus premises, hostels, clinical posting hospitals, or college transport fleet. If found guilty of ragging, I accept immediate expulsion, rustication, and filing of a First Information Report (FIR) with the local police station.',
    '3. Mandatory Attendance & Clinical Rotations: I understand that as per INC and University norms, maintaining a minimum of 80% attendance in theory lectures and 100% attendance in hospital bedside clinical rotations, internships, and laboratory practicals is strictly mandatory to be eligible for annual / semester university examinations.',
    '4. Fee Payment & Refund Schedule Compliance: I agree to remit all prescribed tuition, clinical, examination, and hostel fees strictly within scheduled deadlines. I accept the institutional statutory refund schedule and understand that withdrawal requests submitted beyond 30 days of the notified admission closing date entail forfeiture of tuition fees.',
    '5. Code of Discipline & Conduct: I pledge to maintain strict discipline, decorum, and professional nursing ethics at all times. I agree to abide by uniform standards, campus regulations, hostel curfew timings, and patient confidentiality mandates.'
  ];

  for (const u of undertakings) {
    const lines = wrapText(u, CONTENT_WIDTH - 12, font, 7);
    for (const l of lines) {
      p3.drawText(l, {
        x: MARGIN_X + 6,
        y: p3y,
        size: 7,
        font,
        color: TEXT_DARK
      });
      p3y -= 8.8;
    }
    p3y -= 3;
  }

  p3y -= 6;

  // Candidate Signature Box Strip
  const sigBoxW = (CONTENT_WIDTH - 16) / 3;
  const sigBoxH = 50;

  // Box 1: Thumb Impression
  p3.drawRectangle({
    x: MARGIN_X,
    y: p3y - sigBoxH,
    width: sigBoxW,
    height: sigBoxH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p3.drawText("Candidate's Left Thumb Impression", {
    x: MARGIN_X + 8,
    y: p3y - sigBoxH + 6,
    size: 6.5,
    font,
    color: TEXT_MUTED
  });

  // Box 2: Candidate Signature (English)
  p3.drawRectangle({
    x: MARGIN_X + sigBoxW + 8,
    y: p3y - sigBoxH,
    width: sigBoxW,
    height: sigBoxH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p3.drawText("Full Signature of Candidate (English)", {
    x: MARGIN_X + sigBoxW + 14,
    y: p3y - sigBoxH + 6,
    size: 6.5,
    font,
    color: TEXT_MUTED
  });

  // Box 3: Candidate Signature (Hindi)
  p3.drawRectangle({
    x: MARGIN_X + (sigBoxW + 8) * 2,
    y: p3y - sigBoxH,
    width: sigBoxW,
    height: sigBoxH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p3.drawText("Full Signature of Candidate (Hindi)", {
    x: MARGIN_X + (sigBoxW + 8) * 2 + 16,
    y: p3y - sigBoxH + 6,
    size: 6.5,
    font,
    color: TEXT_MUTED
  });

  p3y -= sigBoxH + 8;
  p3.drawText('Date: _____ / _____ / 2026                 Place / City: _________________________________', {
    x: MARGIN_X + 6,
    y: p3y,
    size: 7.2,
    font,
    color: TEXT_DARK
  });

  p3y -= 14;

  // Parent / Guardian Undertaking & Signature
  p3y = drawSectionHeading(p3, p3y, "PARENT'S / GUARDIAN'S SOLEMN ENDORSEMENT", null, fontBold, font);

  const pUndertaking = "I have read and carefully examined all declarations, undertakings, and fee terms agreed to by my son / daughter / ward. I solemnly guarantee that he/she will maintain exemplary conduct, adhere strictly to all anti-ragging mandates, and attend all scheduled classes and hospital postings. I unconditionally undertake financial responsibility for timely remittance of all institutional tuition, clinical, and hostel fees as scheduled by the college.";
  const pLines = wrapText(pUndertaking, CONTENT_WIDTH - 12, font, 7);
  for (const l of pLines) {
    p3.drawText(l, {
      x: MARGIN_X + 6,
      y: p3y,
      size: 7,
      font,
      color: TEXT_DARK
    });
    p3y -= 8.8;
  }

  p3y -= 6;

  // Parent Signature Strip
  p3.drawRectangle({
    x: MARGIN_X,
    y: p3y - 36,
    width: CONTENT_WIDTH,
    height: 36,
    color: BG_STONE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });

  p3.drawText("Father's / Mother's / Guardian's Signature: _________________________________    Date: ____/____/2026", {
    x: MARGIN_X + 10,
    y: p3y - 15,
    size: 7.2,
    font: fontBold,
    color: NAVY
  });

  p3.drawText("Contact Mobile: [                                    ]     Aadhaar No.: [                                    ]", {
    x: MARGIN_X + 10,
    y: p3y - 28,
    size: 7,
    font,
    color: TEXT_MUTED
  });

  p3y -= 44;

  // ----------------------------------------------------
  // PART H: OFFICE VERIFICATION & COMMITTEE ENDORSEMENT
  // ----------------------------------------------------
  p3y = drawSectionHeading(p3, p3y, 'PART H: OFFICE VERIFICATION & ADMISSIONS COMMITTEE ENDORSEMENT', '(For Official Use Only - Scrutiny, Allotment & Accounts Slip)', fontBold, font);

  p3.drawRectangle({
    x: MARGIN_X,
    y: p3y - 120,
    width: CONTENT_WIDTH,
    height: 120,
    color: WHITE,
    borderColor: NAVY,
    borderWidth: 1
  });

  let oy = p3y - 14;

  p3.drawText('1. Document Scrutiny Status:   [  ] ELIGIBLE & APPROVED      [  ] PROVISIONALLY ELIGIBLE      [  ] REJECTED', {
    x: MARGIN_X + 8,
    y: oy,
    size: 7.5,
    font: fontBold,
    color: NAVY
  });
  oy -= 12;

  p3.drawText('   Deficiency / Remarks (if Provisional): ____________________________________________________________________', {
    x: MARGIN_X + 8,
    y: oy,
    size: 7,
    font,
    color: TEXT_MUTED
  });
  oy -= 13;

  p3.drawText('2. Academic Program Allotted: __________________________________   Quota:  [  ] Merit   [  ] Res   [  ] Mgmt', {
    x: MARGIN_X + 8,
    y: oy,
    size: 7.2,
    font: fontBold,
    color: TEXT_DARK
  });
  oy -= 13;

  p3.drawText('3. Roll / Registration Number Allocated: ________________________   Admission Date: _____ / _____ / 2026', {
    x: MARGIN_X + 8,
    y: oy,
    size: 7.2,
    font: fontBold,
    color: TEXT_DARK
  });
  oy -= 13;

  p3.drawText('4. Accounts Clearance: Fee Receipt No.: ________________________   Amount Remitted: Rs. ______________________', {
    x: MARGIN_X + 8,
    y: oy,
    size: 7.2,
    font: fontBold,
    color: GREEN
  });
  oy -= 26;

  // Four signature seals at bottom
  const offW = (CONTENT_WIDTH - 24) / 4;
  const offSigs = ['Scrutiny Officer', 'Accounts Officer', 'Convener, Admissions', 'Principal / Director'];

  for (let s = 0; s < 4; s++) {
    const sx = MARGIN_X + 6 + s * (offW + 4);
    p3.drawLine({
      start: { x: sx, y: oy + 10 },
      end: { x: sx + offW - 8, y: oy + 10 },
      thickness: 0.5,
      color: BORDER_COLOR
    });
    p3.drawText(offSigs[s], {
      x: sx + 6,
      y: oy,
      size: 6.8,
      font: fontBold,
      color: NAVY
    });
    p3.drawText('(Signature & Seal)', {
      x: sx + 10,
      y: oy - 9,
      size: 5.8,
      font,
      color: TEXT_MUTED
    });
  }

  // Save Admission Form
  const pdfBytes = await doc.save();
  const filePath = path.join(outputDir, 'admission-form-2026.pdf');
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`[2/3] Successfully generated: ${filePath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

// ==========================================
// DOCUMENT 3: SYLLABUS OUTLINE (5 PAGES)
// ==========================================

async function generateSyllabusOutline(outputDir, logoBytes) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  let logoImg = null;
  if (logoBytes) {
    try {
      logoImg = await doc.embedPng(logoBytes);
    } catch (e) {
      console.warn('Could not embed logo image in syllabus outline:', e.message);
    }
  }

  const TOTAL_PAGES = 5;

  // ----------------------------------------------------
  // PAGE 1: STATUTORY STANDARDS & CREDIT OVERVIEW
  // ----------------------------------------------------
  const p1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p1, {
    docTitle: 'Curricula & Clinical Rotation Framework',
    sectionTitle: 'Academic Regulations & Overview',
    pageNum: 1,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p1, { pageNum: 1, totalPages: TOTAL_PAGES, font, fontBold });

  let p1y = PAGE_HEIGHT - 55;

  p1y = drawSectionHeading(p1, p1y, 'COMPREHENSIVE NURSING CURRICULA & CLINICAL ROTATION FRAMEWORK', 'Session 2026-2027 | In Compliance with Indian Nursing Council (INC) & BNRC Regulations', fontBold, font);

  p1y = drawCallout(p1, {
    x: MARGIN_X,
    y: p1y,
    width: CONTENT_WIDTH,
    title: 'STATUTORY CURRICULAR ALIGNMENT & ACCREDITATION STANDARDS',
    textLines: [
      'The curricula at Kavya Shree Institute of Nursing strictly adhere to the Competency-Based Educational Directives prescribed by:',
      '1. Indian Nursing Council (INC, New Delhi) - National Regulatory Framework and Revised Regulations.',
      '2. Bihar Nursing Registration Council (BNRC, Patna) - State Examination and Registration Protocols.',
      '3. Aryabhatta Knowledge University (AKU) / Bihar University of Health Sciences (BUHS) - Degree & Examination Framework.',
      'Our programs follow Outcome-Based Education (OBE) principles, blending didactic classroom teaching, high-fidelity laboratory',
      'clinical simulation, supervised hospital bedside patient postings, and rural/urban community healthcare internships.'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: NAVY,
    borderWidth: 4
  });

  p1y -= 14;

  // Core Competencies Matrix (6 Pillars)
  p1y = drawSectionHeading(p1, p1y, 'CORE NURSING COMPETENCIES & GRADUATE ATTRIBUTES', 'Key Professional Skills Cultivated Across All Programs', fontBold, font);

  const compList = [
    { title: '1. Diagnostic & Clinical Care', text: 'Health assessment, vital signs monitoring, aseptic procedural skills, and individualized nursing care plans (NCP).' },
    { title: '2. Pharmacology & Patient Safety', text: 'Safe medication administration, calculation of dosages, pharmacovigilance, and infection control compliance.' },
    { title: '3. Maternal & Child Health', text: 'Antenatal checkups, conduction of normal deliveries, neonatal resuscitation, immunization, and APGAR scoring.' },
    { title: '4. Critical & Emergency Nursing', text: 'Basic & Advanced Life Support (BLS/ACLS), ventilator management, trauma triage, and ICU patient monitoring.' },
    { title: '5. Community Health & Epidemiology', text: 'Primary healthcare delivery, rural outreach, maternal-infant welfare, national health programs, and disease surveillance.' },
    { title: '6. Ethics, Leadership & Research', text: 'Patient advocacy, legal healthcare frameworks, continuous internal audit, nursing research, and healthcare management.' }
  ];

  const cGridW = (CONTENT_WIDTH - 12) / 2;
  const cGridH = 50;

  for (let i = 0; i < 6; i++) {
    const colIdx = i % 2;
    const rowIdx = Math.floor(i / 2);
    const cx = MARGIN_X + colIdx * (cGridW + 12);
    const cy = p1y - rowIdx * (cGridH + 8);

    p1.drawRectangle({
      x: cx,
      y: cy - cGridH,
      width: cGridW,
      height: cGridH,
      color: WHITE,
      borderColor: BORDER_LIGHT,
      borderWidth: 0.5
    });
    p1.drawRectangle({
      x: cx,
      y: cy - cGridH,
      width: 3,
      height: cGridH,
      color: i % 2 === 0 ? NAVY : AMBER
    });

    p1.drawText(compList[i].title, {
      x: cx + 8,
      y: cy - 13,
      size: 7.8,
      font: fontBold,
      color: NAVY
    });

    const wLines = wrapText(compList[i].text, cGridW - 16, font, 6.8);
    for (let l = 0; l < wLines.length; l++) {
      p1.drawText(wLines[l], {
        x: cx + 8,
        y: cy - 24 - l * 9,
        size: 6.8,
        font,
        color: TEXT_MUTED
      });
    }
  }

  p1y -= 3 * (cGridH + 8) + 8;

  // Program Hours Summary Table
  p1y = drawSectionHeading(p1, p1y, 'TOTAL CURRICULAR HOURS & CREDIT DISTRIBUTION SUMMARY', 'Statutory Instructional Hour Norms Across the Five Programs', fontBold, font);

  const hoursTable = {
    headers: ['Academic Program', 'Duration', 'Theory Hours', 'Lab / Skill Simulation', 'Clinical Hospital Hours', 'Total Hours'],
    colWidths: [135, 75, 75, 85, 90, 63],
    rows: [
      ['Auxiliary Nursing & Midwifery (ANM)', '2 Years (4 Terms)', '640 Hours', '320 Hours', '1,760 Hours', '2,720 Hrs'],
      ['General Nursing & Midwifery (GNM)', '3 Years (Annual)', '1,280 Hours', '640 Hours', '2,960 Hours', '4,880 Hrs'],
      ['B.Sc. Nursing (Undergraduate Degree)', '4 Years (8 Sems)', '1,680 Hours', '720 Hours', '3,840 Hours', '6,240 Hrs'],
      ['Post Basic B.Sc. Nursing (Bridge Degree)', '2 Years (Annual)', '880 Hours', '240 Hours', '1,600 Hours', '2,720 Hrs'],
      ['M.Sc. Nursing (Postgraduate Degree)', '2 Years (4 Sems)', '900 Hours', '300 Hours', '2,000 Hours', '3,200 Hrs']
    ]
  };

  p1y = drawTable(p1, {
    x: MARGIN_X,
    y: p1y,
    colWidths: hoursTable.colWidths,
    headers: hoursTable.headers,
    rows: hoursTable.rows,
    font,
    fontBold,
    headerBg: NAVY,
    alternateBg: SLATE_LIGHT,
    fontSize: 7.2,
    lineHeight: 9.5,
    padding: 3.5
  });

  // ----------------------------------------------------
  // PAGE 2: B.SC. NURSING CURRICULUM (4 YEARS)
  // ----------------------------------------------------
  const p2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p2, {
    docTitle: 'Curricula & Clinical Rotation Framework',
    sectionTitle: 'B.Sc. Nursing (4-Year Degree)',
    pageNum: 2,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p2, { pageNum: 2, totalPages: TOTAL_PAGES, font, fontBold });

  let p2y = PAGE_HEIGHT - 55;

  p2y = drawSectionHeading(p2, p2y, 'BACHELOR OF SCIENCE IN NURSING (B.Sc.) - 4-YEAR CURRICULUM', 'Comprehensive Undergraduate Degree Integrating Biomedicine, Advanced Clinicals & Leadership', fontBold, font);

  const bscYears = [
    {
      year: 'YEAR 1 (Semesters I & II): Foundations & Biomedical Sciences',
      theory: 'Theory: 570 Hours | Skills Lab: 200 Hours | Clinical Posting: 400 Hours',
      subjects: [
        'Applied Anatomy & Applied Physiology: Visceral organ systems, musculoskeletal, cardiovascular, and nervous pathways (120 hrs).',
        'Applied Biochemistry & Applied Nutrition and Dietetics: Caloric metabolism, macronutrients, and therapeutic diets (120 hrs).',
        'Nursing Foundations I & II: Comprehensive fundamental care, infection control, first aid, BLS CPR, and patient safety (240 hrs).',
        'Applied Psychology & Interpersonal Communication: Behavioral dynamics, patient coping mechanisms, and counseling ethics (90 hrs).',
        'Health Assessment & Physical Examination: Systematic head-to-toe examination techniques and diagnostic vital monitoring (100 hrs).'
      ]
    },
    {
      year: 'YEAR 2 (Semesters III & IV): Core Clinical Nursing & Pharmacology',
      theory: 'Theory: 580 Hours | Skills Lab: 180 Hours | Clinical Posting: 640 Hours',
      subjects: [
        'Applied Pharmacology I & II: Pharmacodynamics, drug calculations, safe medication administration, and toxicological risks (150 hrs).',
        'Adult Health Nursing I (Medical-Surgical Nursing I): Pathophysiology and nursing management of systemic disorders (210 hrs).',
        'Applied Pathology & Genetics: Molecular disease origins, clinical lab values interpretation, and congenital disorders (100 hrs).',
        'Community Health Nursing I & Environmental Sciences: Epidemiology, sanitation, water safety, and rural field surveys (160 hrs).',
        'Infection Control & Biomedical Waste Management: Sterilization, disinfection protocols, and hospital waste segregation (60 hrs).'
      ]
    },
    {
      year: 'YEAR 3 (Semesters V & VI): Specialty Care, Pediatrics & Research',
      theory: 'Theory: 450 Hours | Skills Lab: 160 Hours | Clinical Posting: 940 Hours',
      subjects: [
        'Adult Health Nursing II (Medical-Surgical II): Critical care, emergency, trauma, oncology, and perioperative nursing (150 hrs).',
        'Child Health Nursing (Pediatric Nursing): Neonatal resuscitation, pediatric disorders, growth monitoring, and IMNCI (180 hrs).',
        'Mental Health Nursing (Psychiatric Nursing): Psychopathology, therapeutic communication, electroconvulsive therapy care (160 hrs).',
        'Nursing Management & Professional Trends: Leadership principles, ward organization, quality assurance, and legal ethics (80 hrs).',
        'Nursing Research & Biostatistics: Research methodology, sampling techniques, data analysis, and student project study (105 hrs).'
      ]
    },
    {
      year: 'YEAR 4 (Semesters VII & VIII): Midwifery & Mandatory Clinical Internship',
      theory: 'Theory: 210 Hours | Skills Lab: 80 Hours | Full-Time Hospital Internship: 1,152 Hours',
      subjects: [
        'Midwifery & Obstetrical Nursing: Normal antenatal care, conduction of labor, obstetric emergencies, neonatal care (280 hrs).',
        'Community Health Nursing II: Health administration, primary health center management, and national health programs (170 hrs).',
        'Integrated Clinical Internship (Mandatory 24 Weeks / 48 hrs per week):',
        '  - Medical & Surgical Super-Specialties & Trauma Casualty: 6 Weeks | Intensive Care Units (ICU / ICCU): 4 Weeks',
        '  - Obstetrics & Gynecological Labor Room / Antenatal / Postnatal Wards: 6 Weeks | NICU / Pediatric Wards: 4 Weeks',
        '  - Primary Health Centers (PHC) & Community Health Centers (CHC): 4 Weeks (Intensive rural outreach)'
      ]
    }
  ];

  for (const by of bscYears) {
    p2.drawRectangle({
      x: MARGIN_X,
      y: p2y - 18,
      width: CONTENT_WIDTH,
      height: 18,
      color: NAVY
    });
    p2.drawText(by.year, {
      x: MARGIN_X + 8,
      y: p2y - 12,
      size: 7.8,
      font: fontBold,
      color: WHITE
    });
    p2.drawText(by.theory, {
      x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(by.theory, 6.8) - 8,
      y: p2y - 12,
      size: 6.8,
      font: fontBold,
      color: AMBER
    });

    p2y -= 24;

    for (const sub of by.subjects) {
      const wLines = wrapText('* ' + sub, CONTENT_WIDTH - 16, font, 7);
      for (const l of wLines) {
        p2.drawText(l, {
          x: MARGIN_X + 8,
          y: p2y,
          size: 7,
          font,
          color: TEXT_DARK
        });
        p2y -= 9.2;
      }
    }
    p2y -= 6;
  }

  // ----------------------------------------------------
  // PAGE 3: GNM & ANM DIPLOMA CURRICULA
  // ----------------------------------------------------
  const p3 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p3, {
    docTitle: 'Curricula & Clinical Rotation Framework',
    sectionTitle: 'GNM & ANM Curricula',
    pageNum: 3,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p3, { pageNum: 3, totalPages: TOTAL_PAGES, font, fontBold });

  let p3y = PAGE_HEIGHT - 55;

  p3y = drawSectionHeading(p3, p3y, 'GENERAL NURSING & MIDWIFERY (GNM) - 3-YEAR DIPLOMA', 'Comprehensive Bedside Clinical Discipline and Hospital Patient Management', fontBold, font);

  const gnmYears = [
    {
      title: 'FIRST YEAR: Foundational Biological & Behavioral Sciences',
      hours: 'Theory: 560 Hours | Lab / Clinical: 880 Hours',
      points: [
        'Bio-Sciences: Anatomy & Physiology (90 hrs), Microbiology (30 hrs) - Systemic structure, microbiological culturing, and disinfection.',
        'Behavioral Sciences: Psychology (60 hrs), Sociology (30 hrs) - Human behavior, stress dynamics, and community cultural patterns.',
        'Nursing Foundations: Fundamentals of Nursing, First Aid, Personal Hygiene, Patient Safety, Environmental Sanitation (290 hrs).',
        'Community Health Nursing I & Nutrition: Food groups, nutritional deficiencies, and primary healthcare delivery (150 hrs).'
      ]
    },
    {
      title: 'SECOND YEAR: Adult Medical-Surgical Nursing, Psychiatry & Child Health',
      hours: 'Theory: 480 Hours | Clinical Posting: 960 Hours',
      points: [
        'Medical-Surgical Nursing I (including Pharmacology): Cardiovascular, respiratory, gastrointestinal, and renal care (200 hrs).',
        'Medical-Surgical Nursing II: Specialties in ENT, Ophthalmology, Dermatology, Orthopedic, Oncology, and Burn Care (140 hrs).',
        'Mental Health Nursing: Psychiatric nursing interventions, psychopharmacology, and therapeutic community methods (70 hrs).',
        'Child Health (Pediatric) Nursing: Assessment of sick children, high-risk newborn care, and pediatric medicine (70 hrs).'
      ]
    },
    {
      title: 'THIRD YEAR: Midwifery, Gynaecological Nursing & 6-Month Internship',
      hours: 'Theory: 240 Hours | Clinical Bedside Internship: 1,120 Hours',
      points: [
        'Midwifery & Gynaecological Nursing: Maternal health assessment, normal and abnormal labor, post-natal management (140 hrs).',
        'Community Health Nursing II & Health Administration: Rural health infrastructure, epidemiology, and record keeping (100 hrs).',
        'Mandatory 6-Month Clinical Internship: Full-time hospital shift rotations in ICU, Operation Theatre, Labor Room, and Casualty.'
      ]
    }
  ];

  for (const gy of gnmYears) {
    p3.drawRectangle({
      x: MARGIN_X,
      y: p3y - 17,
      width: CONTENT_WIDTH,
      height: 17,
      color: NAVY
    });
    p3.drawText(gy.title, {
      x: MARGIN_X + 8,
      y: p3y - 12,
      size: 7.5,
      font: fontBold,
      color: WHITE
    });
    p3.drawText(gy.hours, {
      x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(gy.hours, 6.8) - 8,
      y: p3y - 12,
      size: 6.8,
      font: fontBold,
      color: AMBER
    });

    p3y -= 23;

    for (const pt of gy.points) {
      const wLines = wrapText('* ' + pt, CONTENT_WIDTH - 16, font, 7);
      for (const l of wLines) {
        p3.drawText(l, {
          x: MARGIN_X + 8,
          y: p3y,
          size: 7,
          font,
          color: TEXT_DARK
        });
        p3y -= 9.2;
      }
    }
    p3y -= 4;
  }

  p3y -= 6;

  // ANM SECTION
  p3y = drawSectionHeading(p3, p3y, 'AUXILIARY NURSING & MIDWIFERY (ANM) - 2-YEAR DIPLOMA', 'Maternal & Infant Health, Immunization and Primary Healthcare Delivery', fontBold, font);

  const anmYears = [
    {
      title: 'FIRST YEAR: Community Health Nursing, Primary Care & Health Promotion',
      hours: 'Theory: 400 Hours | Practical / Field: 800 Hours',
      points: [
        'Community Health Nursing: Primary health center concept, organization of health team, environmental sanitation (120 hrs).',
        'Health Promotion: Nutrition, mental health, hygiene, and environmental factors affecting rural health (120 hrs).',
        'Primary Health Care Nursing: Infection prevention, wound dressing, treatment of minor ailments, and cold-chain upkeep (100 hrs).',
        'Child Health Nursing: Care of newborns, management of diarrhea and pneumonia, and universal immunization schedule (60 hrs).'
      ]
    },
    {
      title: 'SECOND YEAR: Midwifery, Health Center Management & PHC Internship',
      hours: 'Theory: 240 Hours | Field Practical & Internship: 960 Hours',
      points: [
        'Midwifery: Antenatal assessment, conduct of normal deliveries, episiotomy, newborn care, and danger signs identification (160 hrs).',
        'Health Center Management: Maintenance of sub-center records, medicine inventory, maternal deaths audits, and reporting (80 hrs).',
        'Mandatory 6-Month Sub-Centre / PHC Practical Internship: Hands-on grassroots immunization, family planning, and home visits.'
      ]
    }
  ];

  for (const ay of anmYears) {
    p3.drawRectangle({
      x: MARGIN_X,
      y: p3y - 17,
      width: CONTENT_WIDTH,
      height: 17,
      color: SLATE
    });
    p3.drawText(ay.title, {
      x: MARGIN_X + 8,
      y: p3y - 12,
      size: 7.5,
      font: fontBold,
      color: WHITE
    });
    p3.drawText(ay.hours, {
      x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(ay.hours, 6.8) - 8,
      y: p3y - 12,
      size: 6.8,
      font: fontBold,
      color: AMBER_LIGHT
    });

    p3y -= 23;

    for (const pt of ay.points) {
      const wLines = wrapText('* ' + pt, CONTENT_WIDTH - 16, font, 7);
      for (const l of wLines) {
        p3.drawText(l, {
          x: MARGIN_X + 8,
          y: p3y,
          size: 7,
          font,
          color: TEXT_DARK
        });
        p3y -= 9.2;
      }
    }
    p3y -= 4;
  }

  // ----------------------------------------------------
  // PAGE 4: POST BASIC B.SC. & M.SC. NURSING
  // ----------------------------------------------------
  const p4 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p4, {
    docTitle: 'Curricula & Clinical Rotation Framework',
    sectionTitle: 'Post Basic B.Sc. & M.Sc. Nursing',
    pageNum: 4,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p4, { pageNum: 4, totalPages: TOTAL_PAGES, font, fontBold });

  let p4y = PAGE_HEIGHT - 55;

  p4y = drawSectionHeading(p4, p4y, 'POST BASIC B.Sc. NURSING (2-YEAR BRIDGE DEGREE)', 'Academic Escalation Framework for Registered GNM Nurses', fontBold, font);

  const pbYears = [
    {
      year: 'YEAR 1 (Bridging & Foundational Specialties):',
      details: 'Theory: 480 Hours | Clinical: 800 Hours | Total: 1,280 Hours',
      subs: [
        'Nursing Foundation Review (45 hrs) | Nutrition & Dietetics (30 hrs theory + 15 hrs lab).',
        'Biochemistry & Biophysics (60 hrs) | Psychology (60 hrs theory + 15 hrs practical).',
        'Maternal Nursing (60 hrs theory + 240 hrs clinical) | Child Health Nursing (60 hrs theory + 240 hrs clinical).',
        'Microbiology (60 hrs theory + 30 hrs practical) | Medical & Surgical Nursing (90 hrs theory + 270 hrs clinical).'
      ]
    },
    {
      year: 'YEAR 2 (Administration, Community & Nursing Education):',
      details: 'Theory: 400 Hours | Clinical: 800 Hours | Total: 1,200 Hours',
      subs: [
        'Sociology (60 hrs) | Community Health Nursing (60 hrs theory + 240 hrs clinical).',
        'Mental Health Nursing (60 hrs theory + 240 hrs clinical).',
        'Introduction to Nursing Education (60 hrs theory + 75 hrs teaching practice).',
        'Introduction to Nursing Administration (60 hrs theory + 180 hrs hospital admin practice).',
        'Introduction to Nursing Research & Project (45 hrs theory + 120 hrs field research).'
      ]
    }
  ];

  for (const pby of pbYears) {
    p4.drawText(pby.year, {
      x: MARGIN_X + 6,
      y: p4y,
      size: 7.8,
      font: fontBold,
      color: NAVY
    });
    p4.drawText(pby.details, {
      x: MARGIN_X + 220,
      y: p4y,
      size: 7,
      font: fontBold,
      color: AMBER
    });
    p4y -= 13;
    for (const s of pby.subs) {
      p4.drawText('* ' + s, {
        x: MARGIN_X + 12,
        y: p4y,
        size: 7,
        font,
        color: TEXT_DARK
      });
      p4y -= 10;
    }
    p4y -= 4;
  }

  p4y -= 6;

  // M.SC. NURSING SECTION
  p4y = drawSectionHeading(p4, p4y, 'MASTER OF SCIENCE IN NURSING (M.Sc.) - 2-YEAR POSTGRADUATE', 'Clinical Specialization, Evidence-Based Research & Collegiate Faculty Development', fontBold, font);

  const mscStructure = [
    {
      title: 'FIRST YEAR: Core Advanced Nursing Sciences, Education & Research',
      hours: 'Theory: 450 Hours | Clinical Practice: 950 Hours | Total: 1,400 Hours',
      points: [
        'Advanced Nursing Practice: Pathophysiology, clinical health assessment, pharmacology, emergency triage, genetics (150 hrs).',
        'Nursing Education: Curriculum development, instructional technology, test construction, and simulation pedagogy (150 hrs).',
        'Nursing Research & Advanced Statistics: Research design, qualitative/quantitative methodology, SPSS data analysis (150 hrs).',
        'Clinical Specialty - Part I: In-depth clinical immersion in chosen specialty domain (Theory: 150 hrs, Clinical: 650 hrs).'
      ]
    },
    {
      title: 'SECOND YEAR: Advanced Clinical Specialization, Healthcare Management & Thesis',
      hours: 'Theory: 300 Hours | Clinical Practice: 1,100 Hours | Total: 1,400 Hours',
      points: [
        'Nursing Management & Leadership: Hospital administration, staffing ratios, budget planning, accreditation protocols (150 hrs).',
        'Clinical Specialty - Part II: Advanced bedside management, procedural expertise, clinical mentorship (150 hrs + 950 hrs clinical).',
        'Master Dissertation & Thesis: Independent university-supervised empirical research study with oral viva voce defense.'
      ]
    }
  ];

  for (const ms of mscStructure) {
    p4.drawRectangle({
      x: MARGIN_X,
      y: p4y - 17,
      width: CONTENT_WIDTH,
      height: 17,
      color: NAVY
    });
    p4.drawText(ms.title, {
      x: MARGIN_X + 8,
      y: p4y - 12,
      size: 7.5,
      font: fontBold,
      color: WHITE
    });
    p4.drawText(ms.hours, {
      x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(ms.hours, 6.8) - 8,
      y: p4y - 12,
      size: 6.8,
      font: fontBold,
      color: AMBER
    });

    p4y -= 23;

    for (const pt of ms.points) {
      const wLines = wrapText('* ' + pt, CONTENT_WIDTH - 16, font, 7);
      for (const l of wLines) {
        p4.drawText(l, {
          x: MARGIN_X + 8,
          y: p4y,
          size: 7,
          font,
          color: TEXT_DARK
        });
        p4y -= 9.2;
      }
    }
    p4y -= 4;
  }

  p4y -= 6;

  // 5 Clinical Specializations in M.Sc.
  p4y = drawSectionHeading(p4, p4y, 'OFFERED M.Sc. CLINICAL SPECIALIZATIONS', 'Select One for Intensive 2-Year Advanced Practice', fontBold, font);

  const mscSpecs = [
    ['1. Medical-Surgical Nursing:', 'Critical care, cardiology, nephrology, oncology, neurosciences, and trauma emergency nursing.'],
    ['2. Obstetrics & Gynaecology:', 'High-risk pregnancy, fetal monitoring, advanced operative obstetrics, and infertility nursing.'],
    ['3. Child Health (Pediatrics):', 'Neonatal Intensive Care (NICU), pediatric cardiology, genetic disorders, and developmental health.'],
    ['4. Community Health Nursing:', 'Health planning, public epidemiology, disaster management, and rural healthcare delivery systems.'],
    ['5. Mental Health (Psychiatry):', 'Psychotherapeutic interventions, de-addiction therapy, psychiatric crisis management, and forensic care.']
  ];

  for (const sp of mscSpecs) {
    p4.drawText(sp[0], {
      x: MARGIN_X + 8,
      y: p4y,
      size: 7.2,
      font: fontBold,
      color: NAVY
    });
    p4.drawText(sp[1], {
      x: MARGIN_X + 135,
      y: p4y,
      size: 7,
      font,
      color: TEXT_MUTED
    });
    p4y -= 12;
  }

  // ----------------------------------------------------
  // PAGE 5: CLINICAL ROTATION & EVALUATION SCHEME
  // ----------------------------------------------------
  const p5 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(p5, {
    docTitle: 'Curricula & Clinical Rotation Framework',
    sectionTitle: 'Clinical Rotations & Evaluation',
    pageNum: 5,
    totalPages: TOTAL_PAGES,
    font,
    fontBold,
    logoImg
  });
  drawPageFooter(p5, { pageNum: 5, totalPages: TOTAL_PAGES, font, fontBold });

  let p5y = PAGE_HEIGHT - 55;

  p5y = drawSectionHeading(p5, p5y, 'CLINICAL ROTATION BLUEPRINT & HOSPITAL POSTINGS MATRIX', 'Hands-on Bedside Patient Exposure Across 250+ Bed Civil Hospitals & CHCs', fontBold, font);

  const rotTable = {
    headers: ['Clinical Department / Ward', 'Key Procedural Competencies Mastered', 'Supervision & Documentation', 'Min. Clinical Hours'],
    colWidths: [120, 205, 125, 73],
    rows: [
      [
        'General Medical & Surgical Wards',
        'Bedside patient monitoring, vital signs, pre/post-operative care, wound dressings, IV infusions, NG feeding, catheter care.',
        'Clinical Instructor (1:10) & Daily Logbook Entry',
        '840 Hours (B.Sc.)\n640 Hours (GNM)'
      ],
      [
        'Intensive Care Units\n(ICU, ICCU, HDU, Trauma)',
        'Arterial Blood Gas (ABG) sampling, ventilator circuit maintenance, central line dressing, defibrillator setup, crash cart management.',
        'Critical Care Specialist & Continuous Assessment',
        '360 Hours (B.Sc.)\n240 Hours (GNM)'
      ],
      [
        'Labor Room, Antenatal & Postnatal Wards',
        'Antenatal palpation, CTG monitoring, conducting normal deliveries, episiotomy repair, active management of 3rd stage labor, neonatal care.',
        'Senior Midwifery Tutor & Logbook of 20+ Deliveries',
        '480 Hours (B.Sc.)\n360 Hours (GNM)'
      ],
      [
        'Pediatric Wards &\nNeonatal ICU (NICU)',
        'Incubator management, phototherapy, pediatric cannulation, calculating micro-dosages, developmental milestone assessment, resuscitation.',
        'Pediatric Nursing Mentor & Clinical Case Presentation',
        '320 Hours (B.Sc.)\n200 Hours (GNM)'
      ],
      [
        'Community Health Centers (CHC / PHC / Sub-Centres)',
        'Grassroots immunization, pulse-polio drives, maternal-child health clinics, family planning, water safety testing, school health screenings.',
        'Field Medical Officer & Public Health Coordinator',
        '360 Hours (B.Sc.)\n240 Hours (GNM)'
      ],
      [
        'Operation Theatre (OT) & CSSD Sterilization',
        'Aseptic scrubbing and gowning, instrument tray preparation, assisting surgical teams, handling anesthesia equipment, autoclave sterilization.',
        'OT Nursing Incharge & Log of Assisted Surgeries',
        '240 Hours (B.Sc.)\n160 Hours (GNM)'
      ]
    ]
  };

  p5y = drawTable(p5, {
    x: MARGIN_X,
    y: p5y,
    colWidths: rotTable.colWidths,
    headers: rotTable.headers,
    rows: rotTable.rows,
    font,
    fontBold,
    headerBg: NAVY,
    alternateBg: SLATE_LIGHT,
    fontSize: 6.8,
    lineHeight: 8.8,
    padding: 3
  });

  p5y -= 12;

  // Evaluation Scheme
  p5y = drawSectionHeading(p5, p5y, 'COMPREHENSIVE EVALUATION & EXAMINATION MATRIX', 'Continuous Internal Assessment (CIA) & University Examination Norms', fontBold, font);

  const evalGridW = (CONTENT_WIDTH - 12) / 2;
  const evalGridH = 85;

  // Internal Assessment Box
  p5.drawRectangle({
    x: MARGIN_X,
    y: p5y - evalGridH,
    width: evalGridW,
    height: evalGridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p5.drawRectangle({
    x: MARGIN_X,
    y: p5y - 3,
    width: evalGridW,
    height: 3,
    color: NAVY
  });
  p5.drawText('Continuous Internal Assessment (CIA) - 25%', {
    x: MARGIN_X + 8,
    y: p5y - 14,
    size: 7.8,
    font: fontBold,
    color: NAVY
  });
  const ciaPoints = [
    '* Periodic unit theory examinations and term tests (10%).',
    '* Clinical procedural assessment via OSCE / OSPE (5%).',
    '* Clinical case studies, nursing care plans (NCP) and logbooks (5%).',
    '* Class attendance regularity, seminar presentations, discipline (5%).',
    '* Minimum 50% marks in CIA required to appear in University Exams.'
  ];
  for (let c = 0; c < ciaPoints.length; c++) {
    p5.drawText(ciaPoints[c], {
      x: MARGIN_X + 8,
      y: p5y - 26 - c * 11,
      size: 6.8,
      font,
      color: TEXT_MUTED
    });
  }

  // University Exam Box
  p5.drawRectangle({
    x: MARGIN_X + evalGridW + 12,
    y: p5y - evalGridH,
    width: evalGridW,
    height: evalGridH,
    color: WHITE,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5
  });
  p5.drawRectangle({
    x: MARGIN_X + evalGridW + 12,
    y: p5y - 3,
    width: evalGridW,
    height: 3,
    color: AMBER
  });
  p5.drawText('University Annual / Semester Examination - 75%', {
    x: MARGIN_X + evalGridW + 20,
    y: p5y - 14,
    size: 7.8,
    font: fontBold,
    color: NAVY
  });
  const uExamPoints = [
    '* Written university theory papers evaluated by external university examiners.',
    '* Clinical bedside examination on real hospital patients (Bedside OSCE).',
    '* Oral viva voce examination evaluated jointly by internal & external experts.',
    '* Scrutiny of endorsed logbooks, clinical procedure records, and case files.',
    '* Strict passing threshold: Minimum 50% in theory and 50% in practical separately.'
  ];
  for (let u = 0; u < uExamPoints.length; u++) {
    p5.drawText(uExamPoints[u], {
      x: MARGIN_X + evalGridW + 20,
      y: p5y - 26 - u * 11,
      size: 6.8,
      font,
      color: TEXT_MUTED
    });
  }

  p5y -= evalGridH + 12;

  // Recommended Textbooks & Reference Literature
  p5y = drawSectionHeading(p5, p5y, 'RECOMMENDED REFERENCE TEXTBOOKS & SCIENTIFIC LITERATURE', 'Standard Curricular Literature Prescribed by INC and Faculty', fontBold, font);

  const books = [
    ['Medical-Surgical Nursing:', "Brunner & Suddarth's Textbook of Medical-Surgical Nursing (Lippincott Williams & Wilkins)"],
    ['Fundamentals of Nursing:', "Potter & Perry's Fundamentals of Nursing (Elsevier Health Sciences)"],
    ['Obstetrics & Midwifery:', "D.C. Dutta's Textbook of Obstetrics & Midwifery (Jaypee Brothers Medical Publishers)"],
    ['Child Health Nursing:', "Wong's Essentials of Pediatric Nursing (Elsevier Mosby)"],
    ['Community Health:', "Park's Textbook of Preventive and Social Medicine (M/s Banarsidas Bhanot Publishers)"],
    ['Pharmacology & Pathology:', "K.D. Tripathi's Essentials of Medical Pharmacology & Harsh Mohan's Pathology (Jaypee)"]
  ];

  for (const b of books) {
    p5.drawText(b[0], {
      x: MARGIN_X + 8,
      y: p5y,
      size: 7.2,
      font: fontBold,
      color: NAVY
    });
    p5.drawText(b[1], {
      x: MARGIN_X + 125,
      y: p5y,
      size: 6.8,
      font,
      color: TEXT_DARK
    });
    p5y -= 11.5;
  }

  p5y -= 6;

  // Bottom Regulatory Framework Note
  drawCallout(p5, {
    x: MARGIN_X,
    y: p5y,
    width: CONTENT_WIDTH,
    title: 'STATUTORY CURRICULAR REGULATION DIRECTIVE',
    textLines: [
      '- All syllabi, curricular outlines, credit values, clinical postings, and examination schemes are subject to statutory notifications',
      '  promulgated by the Indian Nursing Council (INC, New Delhi) and the Bihar Nursing Registration Council (BNRC, Patna).',
      '- Academic sessions adhere strictly to official university academic calendars. For queries, contact: academic@kavyashreenursing.edu.in'
    ],
    font,
    fontBold,
    bgColor: BG_STONE,
    borderColor: NAVY,
    borderWidth: 3
  });

  // Save Syllabus Outline
  const pdfBytes = await doc.save();
  const filePath = path.join(outputDir, 'syllabus-outline.pdf');
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`[3/3] Successfully generated: ${filePath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

// ==========================================
// MASTER RUNNER FUNCTION
// ==========================================

async function generateAllPdfs() {
  console.log('========================================================');
  console.log('KAVYA SHREE INSTITUTE OF NURSING - PDF GENERATION ENGINE');
  console.log('Academic Session 2026-2027 | High-Precision Institutional PDFs');
  console.log('========================================================\n');

  const outputDir = path.join(__dirname, '..', 'public', 'assets', 'documents');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created document output directory: ${outputDir}`);
  }

  // Load logo bytes if available
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  let logoBytes = null;
  if (fs.existsSync(logoPath)) {
    logoBytes = fs.readFileSync(logoPath);
    console.log(`Loaded institutional crest logo from: ${logoPath} (${logoBytes.length} bytes)`);
  } else {
    console.warn(`Logo not found at ${logoPath}, will proceed without logo image`);
  }

  try {
    // 1. Prospectus 2026 (6 Pages)
    await generateProspectus(outputDir, logoBytes);

    // 2. Admission Form 2026 (3 Pages)
    await generateAdmissionForm(outputDir, logoBytes);

    // 3. Syllabus Outline (5 Pages)
    await generateSyllabusOutline(outputDir, logoBytes);

    console.log('\nAll 3 publication-quality PDF documents generated successfully!');
    console.log('Documents ready in public/assets/documents/ :');
    console.log('  1. prospectus-2026.pdf     (6 pages)');
    console.log('  2. admission-form-2026.pdf (3 pages)');
    console.log('  3. syllabus-outline.pdf    (5 pages)');
    console.log('========================================================');
  } catch (err) {
    console.error('Fatal error during PDF generation:', err);
    process.exit(1);
  }
}

generateAllPdfs();
