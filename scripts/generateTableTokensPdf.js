import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_ROSTER } from '../src/data/initialParticipants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, '../Table_Tokens_All_64_Desks.pdf');
const publicOutputPath = path.resolve(__dirname, '../public/Table_Tokens_All_64_Desks.pdf');

const pesLogoPath = path.resolve(__dirname, '../public/assets/pes-table-logo.png');
const eeeFestLogoPath = path.resolve(__dirname, '../public/assets/eee-fest-logo.png');

const hasPesLogo = fs.existsSync(pesLogoPath);
const hasEeeFestLogo = fs.existsSync(eeeFestLogoPath);

console.log('📄 Generating Official 64 Table Tokens PDF (4 Tokens per A4 Page)...');
console.log(`📦 Output Path: ${outputPath}`);
console.log(`👥 Total Participants to Generate: ${INITIAL_ROSTER.length}`);
console.log(`🖼️ PES Logo Found: ${hasPesLogo}`);
console.log(`🖼️ EEE FEST Logo Found: ${hasEeeFestLogo}`);

// A4 dimensions in PDF points (72 points per inch)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const HALF_W = PAGE_WIDTH / 2;  // 297.64
const HALF_H = PAGE_HEIGHT / 2; // 420.945

// Initialize PDF Document
const doc = new PDFDocument({
  size: 'A4',
  margin: 0,
  autoFirstPage: false,
  info: {
    Title: 'IEEE PES DIU SBC - EEE FEST 2026 Prompt Battle Table Tokens',
    Author: 'IEEE PES DIU Student Branch Chapter',
    Subject: 'Desk & Table Tokens for 64 Participants (Sponsored by IEEE PES DIU SBC)',
    Keywords: 'IEEE PES DIU SBC, EEE FEST 2026, Prompt Battle 2026, Table Tokens, Desks',
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Quadrants definition (x, y, w, h)
const QUADRANTS = [
  { x: 0, y: 0, w: HALF_W, h: HALF_H },              // Top-Left
  { x: HALF_W, y: 0, w: HALF_W, h: HALF_H },         // Top-Right
  { x: 0, y: HALF_H, w: HALF_W, h: HALF_H },         // Bottom-Left
  { x: HALF_W, y: HALF_H, w: HALF_W, h: HALF_H }      // Bottom-Right
];

// Helper to draw dashed cut guidelines across the sheet
function drawCutGuidelines(doc) {
  doc.save();
  doc.strokeColor('#94a3b8')
     .lineWidth(0.75)
     .dash(4, { space: 3 });

  // Vertical center cut line
  doc.moveTo(HALF_W, 0).lineTo(HALF_W, PAGE_HEIGHT).stroke();

  // Horizontal center cut line
  doc.moveTo(0, HALF_H).lineTo(PAGE_WIDTH, HALF_H).stroke();

  doc.undash();

  // Scissors indicators
  doc.fontSize(8).fillColor('#64748b').font('Helvetica');
  doc.text('✂ CUT HERE', HALF_W - 25, 6, { width: 50, align: 'center' });
  doc.text('✂ CUT HERE', HALF_W - 25, PAGE_HEIGHT - 14, { width: 50, align: 'center' });
  doc.text('✂ CUT HERE', 6, HALF_H - 4, { width: 60, align: 'left' });
  doc.text('✂ CUT HERE', PAGE_WIDTH - 66, HALF_H - 4, { width: 60, align: 'right' });

  doc.restore();
}

// Function to render one table token inside a quadrant
function renderTableToken(doc, participant, quad, index) {
  const pad = 12; // margin inside quadrant
  const cardX = quad.x + pad;
  const cardY = quad.y + pad;
  const cardW = quad.w - (pad * 2); // 273.64 pt
  const cardH = quad.h - (pad * 2); // 396.95 pt

  const deskNum = participant.deskNumber || `Desk ${(index + 1).toString().padStart(2, '0')}`;
  const tableNumStr = deskNum.toUpperCase().replace('DESK', 'TABLE');

  doc.save();

  // 1. Outer Card Background & Border
  doc.roundedRect(cardX, cardY, cardW, cardH, 8)
     .fillAndStroke('#ffffff', '#0f172a');
  doc.lineWidth(1.5).stroke('#0f172a');

  // Double thin inner border
  doc.roundedRect(cardX + 3, cardY + 3, cardW - 6, cardH - 6, 6)
     .lineWidth(0.5)
     .stroke('#cbd5e1');

  // 2. Official Header (Pure White Background - No Colored Bar)
  const headerH = 50;

  // Thin clean dividing line between header and content
  doc.moveTo(cardX + 4, cardY + headerH + 4)
     .lineTo(cardX + cardW - 4, cardY + headerH + 4)
     .lineWidth(0.5)
     .stroke('#e2e8f0');

  // Draw PES Circular Logo on Left of Header
  if (hasPesLogo) {
    try {
      doc.image(pesLogoPath, cardX + 8, cardY + 7, {
        fit: [42, 42],
        align: 'center',
        valign: 'center'
      });
    } catch (e) {
      console.warn('Could not render PES logo:', e.message);
    }
  }

  // Draw EEE FEST Logo on Right of Header
  if (hasEeeFestLogo) {
    try {
      doc.image(eeeFestLogoPath, cardX + cardW - 74, cardY + 11, {
        fit: [66, 32],
        align: 'center',
        valign: 'center'
      });
    } catch (e) {
      console.warn('Could not render EEE Fest logo:', e.message);
    }
  }

  // Header IEEE PES branding text (Center - high contrast dark colors on white)
  const centerTextX = cardX + 52;
  const centerTextW = cardW - 130;

  doc.fillColor('#15803d')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text('IEEE PES DIU SBC', centerTextX, cardY + 9, {
       width: centerTextW,
       align: 'center'
     });

  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('PROMPT BATTLE', centerTextX, cardY + 21, {
       width: centerTextW,
       align: 'center'
     });

  doc.fillColor('#0284c7')
     .font('Helvetica-Bold')
     .fontSize(8)
     .text('EEE FEST 2026', centerTextX, cardY + 36, {
       width: centerTextW,
       align: 'center'
     });

  // 3. Prominent Table Number Station Box
  const tableBoxY = cardY + 60;
  const tableBoxH = 68;

  doc.roundedRect(cardX + 12, tableBoxY, cardW - 24, tableBoxH, 6)
     .fillAndStroke('#f8fafc', '#0284c7');
  doc.lineWidth(1.2).stroke('#0284c7');

  doc.fillColor('#0369a1')
     .font('Helvetica-Bold')
     .fontSize(7)
     .text('ASSIGNED WORKSTATION', cardX + 16, tableBoxY + 8, {
       width: cardW - 32,
       align: 'center'
     });

  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(28)
     .text(tableNumStr, cardX + 16, tableBoxY + 18, {
       width: cardW - 32,
       align: 'center'
     });

  doc.fillColor('#d97706')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text(`[ STATION TOKEN: ${participant.couponCode || 'PBC'} ]`, cardX + 16, tableBoxY + 51, {
       width: cardW - 32,
       align: 'center'
     });

  // 4. Contender Profile Details Area
  const infoY = tableBoxY + tableBoxH + 12;

  // Name Box
  doc.fillColor('#64748b')
     .font('Helvetica-Bold')
     .fontSize(7)
     .text('CONTENDER NAME', cardX + 14, infoY);

  const cleanName = (participant.name || 'Contender').toUpperCase();
  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(cleanName.length > 22 ? 11.5 : 13.5)
     .text(cleanName, cardX + 14, infoY + 10, {
       width: cardW - 28,
       ellipsis: true
     });

  // Divider line
  doc.moveTo(cardX + 14, infoY + 28)
     .lineTo(cardX + cardW - 14, infoY + 28)
     .lineWidth(0.5)
     .stroke('#e2e8f0');

  // Student ID & Semester Row
  const row2Y = infoY + 34;

  // Student ID Box (Left)
  doc.fillColor('#64748b')
     .font('Helvetica-Bold')
     .fontSize(7)
     .text('STUDENT ID', cardX + 14, row2Y);

  doc.fillColor('#0284c7')
     .font('Courier-Bold')
     .fontSize(12)
     .text(participant.studentId || participant.participantId || 'N/A', cardX + 14, row2Y + 9);

  // Semester / Category (Right)
  doc.fillColor('#64748b')
     .font('Helvetica-Bold')
     .fontSize(7)
     .text('SEMESTER', cardX + (cardW / 2) + 10, row2Y);

  doc.fillColor('#334155')
     .font('Helvetica-Bold')
     .fontSize(10)
     .text(participant.semester || 'DIU Contender', cardX + (cardW / 2) + 10, row2Y + 10);

  // Divider line
  doc.moveTo(cardX + 14, row2Y + 26)
     .lineTo(cardX + cardW - 14, row2Y + 26)
     .lineWidth(0.5)
     .stroke('#e2e8f0');

  // Login Credentials Box
  const credsY = row2Y + 32;
  doc.roundedRect(cardX + 14, credsY, cardW - 28, 44, 4)
     .fillAndStroke('#eff6ff', '#bfdbfe');
  doc.lineWidth(0.75).stroke('#bfdbfe');

  doc.fillColor('#1e40af')
     .font('Helvetica-Bold')
     .fontSize(7)
     .text('PORTAL LOGIN CREDENTIALS', cardX + 18, credsY + 5);

  doc.fillColor('#475569')
     .font('Helvetica')
     .fontSize(7)
     .text(`Email: ${participant.studentMail || participant.email || 'diu.edu.bd'}`, cardX + 18, credsY + 16, {
       width: cardW - 36,
       ellipsis: true
     });

  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(8)
     .text('Password (Coupon): ', cardX + 18, credsY + 28, { continued: true })
     .fillColor('#b45309')
     .font('Courier-Bold')
     .fontSize(9.5)
     .text(participant.couponCode || 'PBC000');

  // 5. SPONSORED BY IEEE PES DIU SBC (Track Removed as requested)
  const sponsorY = credsY + 50;
  doc.roundedRect(cardX + 14, sponsorY, cardW - 28, 22, 4)
     .fillAndStroke('#f0fdf4', '#86efac');
  doc.lineWidth(0.8).stroke('#86efac');

  // Small PES logo beside text in sponsor pill if available
  if (hasPesLogo) {
    try {
      doc.image(pesLogoPath, cardX + 20, sponsorY + 3.5, {
        fit: [15, 15]
      });
    } catch (e) {}
  }

  doc.fillColor('#15803d')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text('SPONSORED BY IEEE PES DIU SBC', cardX + 14, sponsorY + 6.5, {
       width: cardW - 28,
       align: 'center'
     });

  // 6. Footer / Instructions Box
  const footerY = cardY + cardH - 38;
  doc.rect(cardX + 4, footerY, cardW - 8, 34)
     .fill('#f8fafc');

  doc.moveTo(cardX + 4, footerY)
     .lineTo(cardX + cardW - 4, footerY)
     .lineWidth(0.5)
     .stroke('#e2e8f0');

  doc.fillColor('#64748b')
     .font('Helvetica')
     .fontSize(6.5)
     .text('⚠ Place this token upright on your table. Do not displace or swap desks.', cardX + 10, footerY + 5, {
       width: cardW - 20,
       align: 'center'
     });

  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(6.8)
     .text('Daffodil International University • Faculty of Engineering', cardX + 10, footerY + 14, {
       width: cardW - 20,
       align: 'center'
     });

  doc.fillColor('#15803d')
     .font('Helvetica-Bold')
     .fontSize(6.5)
     .text('Powered by PES Web Development team • IEEE PES DIU SBC', cardX + 10, footerY + 23, {
       width: cardW - 20,
       align: 'center'
     });

  doc.restore();
}

// Generate the 16 pages (4 tokens per page = 64 tokens)
const totalParticipants = INITIAL_ROSTER.length;
const totalPages = Math.ceil(totalParticipants / 4);

console.log(`📑 Total Pages to Render: ${totalPages} pages (4 tokens per page)`);

for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
  doc.addPage();

  // Draw cutting guidelines for this page
  drawCutGuidelines(doc);

  // Render up to 4 tokens on this page
  for (let quadIdx = 0; quadIdx < 4; quadIdx++) {
    const participantIdx = (pageIdx * 4) + quadIdx;
    if (participantIdx < totalParticipants) {
      const participant = INITIAL_ROSTER[participantIdx];
      renderTableToken(doc, participant, QUADRANTS[quadIdx], participantIdx);
    }
  }

  // Page footer note
  doc.save();
  doc.fontSize(6.5)
     .fillColor('#94a3b8')
     .font('Helvetica')
     .text(`Page ${pageIdx + 1} of ${totalPages} • Sponsored by IEEE PES DIU SBC • EEE FEST 2026 Table Tokens (Desks ${(pageIdx * 4 + 1).toString().padStart(2, '0')} - ${Math.min((pageIdx + 1) * 4, totalParticipants).toString().padStart(2, '0')})`, 
       0, PAGE_HEIGHT - 10, { width: PAGE_WIDTH, align: 'center' });
  doc.restore();
}

doc.end();

writeStream.on('finish', () => {
  // Also copy to public directory for direct download in browser
  try {
    fs.copyFileSync(outputPath, publicOutputPath);
    console.log(`📋 Copied to public folder: ${publicOutputPath}`);
  } catch (err) {
    console.warn('Could not copy to public folder:', err.message);
  }

  const stats = fs.statSync(outputPath);
  console.log(`\n🎉 SUCCESS! Table Tokens PDF updated successfully.`);
  console.log(`📄 File: ${outputPath}`);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`🏷️ Total Tokens: ${totalParticipants} (Desks 01 to 64)`);
  console.log(`📑 Total A4 Pages: ${totalPages} (4 tokens per page with dashed cut guidelines)`);
  console.log(`✨ Logos & "Sponsored by IEEE PES DIU SBC" added; Track removed.`);
});
