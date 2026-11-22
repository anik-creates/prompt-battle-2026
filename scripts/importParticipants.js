import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows = [];
  for (let line of lines) {
    const row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

const csvPath = 'C:\\Users\\Tanvir\\Downloads\\Untitled spreadsheet - Sheet1 (5).csv';
const csvText = fs.readFileSync(csvPath, 'utf8');
const rows = parseCSV(csvText);

console.log('Headers:', rows[0]);
console.log('Data row count:', rows.length - 1);

const participants = [];

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (row.length < 7) continue;

  const [name, studentId, studentMail, personalMail, semester, phone, couponCode] = row;
  const deskNum = String(i).padStart(2, '0');

  participants.push({
    participantId: studentId.trim(),
    studentId: studentId.trim(),
    name: name.trim(),
    studentMail: studentMail.trim(),
    personalMail: personalMail.trim(),
    email: (studentMail.trim() || personalMail.trim()).toLowerCase(),
    semester: semester.trim(),
    phone: phone.trim(),
    couponCode: couponCode.trim(),
    passcode: couponCode.trim(),
    deskNumber: `Desk ${deskNum}`,
    teamName: 'Solo Contender',
    registeredAt: new Date().toISOString()
  });
}

console.log(`Successfully generated ${participants.length} participants.`);
console.log('First participant:', participants[0]);
console.log('Last participant:', participants[participants.length - 1]);

const outDir = path.resolve('src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const jsContent = `// Auto-generated from official participant roster (${participants.length} participants)
export const INITIAL_ROSTER = ${JSON.stringify(participants, null, 2)};
`;

fs.writeFileSync(path.join(outDir, 'initialParticipants.js'), jsContent, 'utf8');
console.log('Saved to src/data/initialParticipants.js');
