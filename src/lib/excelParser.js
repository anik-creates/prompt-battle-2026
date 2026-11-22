import * as XLSX from 'xlsx';

/**
 * Normalizes an uploaded Excel or CSV file to extract contender records.
 * Supports flexible column naming (e.g. "Participant ID", "ID", "Name", "Team", etc.)
 * @param {File} file 
 * @returns {Promise<Array<{participantId: string, name: string, teamName: string, deskNumber: string}>>}
 */
export async function parseContenderFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Read first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of objects
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          resolve([]);
          return;
        }

        const normalized = [];

        rawRows.forEach((row, index) => {
          // Normalize object keys to lowercase without spaces/underscores/colons
          const keys = Object.keys(row);
          let idVal = '';
          let nameVal = '';
          let emailVal = '';
          let studentMailVal = '';
          let personalMailVal = '';
          let passcodeVal = '';
          let couponVal = '';
          let semesterVal = '';
          let phoneVal = '';
          let teamVal = '';
          let deskVal = '';

          for (const key of keys) {
            const cleanKey = key.trim().toLowerCase().replace(/[\s_\-#:]/g, '');
            const val = String(row[key] || '').trim();

            if (!idVal && (cleanKey === 'id' || cleanKey.includes('studentid') || cleanKey.includes('participantid') || cleanKey.includes('roll') || cleanKey.includes('contenderid'))) {
              idVal = val;
            } else if (!nameVal && (cleanKey.includes('fullname') || cleanKey.includes('enteryourfullname') || cleanKey.includes('name') || cleanKey.includes('student'))) {
              nameVal = val;
            } else if (!studentMailVal && (cleanKey.includes('studentmail') || cleanKey.includes('diuemail') || cleanKey.includes('diumail'))) {
              studentMailVal = val;
            } else if (!personalMailVal && (cleanKey.includes('personalmail') || cleanKey.includes('gmail') || cleanKey.includes('personalemail'))) {
              personalMailVal = val;
            } else if (!emailVal && (cleanKey.includes('email') || cleanKey.includes('mail'))) {
              emailVal = val;
            } else if (!couponVal && (cleanKey.includes('coupon') || cleanKey.includes('voucher') || cleanKey.includes('cupo'))) {
              couponVal = val;
            } else if (!passcodeVal && (cleanKey.includes('passcode') || cleanKey.includes('password') || cleanKey.includes('pass') || cleanKey.includes('secret') || cleanKey.includes('code'))) {
              passcodeVal = val;
            } else if (!semesterVal && (cleanKey.includes('semester') || cleanKey.includes('currentsemester'))) {
              semesterVal = val;
            } else if (!phoneVal && (cleanKey.includes('phone') || cleanKey.includes('contact') || cleanKey.includes('mobile') || cleanKey.includes('number'))) {
              phoneVal = val;
            } else if (!teamVal && (cleanKey.includes('team') || cleanKey.includes('group') || cleanKey.includes('dept') || cleanKey.includes('club'))) {
              teamVal = val;
            } else if (!deskVal && (cleanKey.includes('desk') || cleanKey.includes('seat') || cleanKey.includes('station') || cleanKey.includes('table'))) {
              deskVal = val;
            }
          }

          // Fallbacks
          if (!studentMailVal && emailVal && emailVal.includes('@diu.edu.bd')) {
            studentMailVal = emailVal;
          }
          if (!personalMailVal && emailVal && !emailVal.includes('@diu.edu.bd')) {
            personalMailVal = emailVal;
          }
          const primaryMail = studentMailVal || emailVal || personalMailVal;
          const finalCoupon = couponVal || passcodeVal;

          const deskNumStr = String(index + 1).padStart(2, '0');

          if (idVal || nameVal || primaryMail || finalCoupon) {
            normalized.push({
              participantId: (idVal || `PB-${100 + index + 1}`).trim(),
              studentId: (idVal || `PB-${100 + index + 1}`).trim(),
              name: nameVal || `Contender ${idVal || index + 1}`,
              studentMail: studentMailVal || '',
              personalMail: personalMailVal || '',
              email: (primaryMail || `${(idVal || 'user').toLowerCase()}@diu.edu.bd`).toLowerCase(),
              semester: semesterVal || '',
              phone: phoneVal || '',
              couponCode: (finalCoupon || `PBC${String(index + 1).padStart(3, '0')}`).trim(),
              passcode: (finalCoupon || `PBC${String(index + 1).padStart(3, '0')}`).trim(),
              teamName: teamVal || 'Solo Contender',
              deskNumber: deskVal || `Desk ${deskNumStr}`
            });
          }
        });

        resolve(normalized);
      } catch (err) {
        console.error('Failed to parse Excel/CSV:', err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a sample Excel (.xlsx) file with pre-filled headers and examples.
 */
export function downloadContenderTemplate() {
  const sampleData = [
    {
      'Participant ID': 'PB-101',
      'Name': 'Tanvir Hossain',
      'Email': 'tanvir.prompt@diu.edu.bd',
      'Passcode': 'PASS-9821',
      'Team Name': 'DIU Pioneers',
      'Desk Number': 'Desk 01'
    },
    {
      'Participant ID': 'PB-102',
      'Name': 'Anik Sarker',
      'Email': 'anik.prompt@diu.edu.bd',
      'Passcode': 'PASS-4412',
      'Team Name': 'PES Titans',
      'Desk Number': 'Desk 02'
    },
    {
      'Participant ID': 'PB-103',
      'Name': 'Sumaiya Akter',
      'Email': 'sumaiya.prompt@diu.edu.bd',
      'Passcode': 'PASS-7733',
      'Team Name': 'Cyber Sparks',
      'Desk Number': 'Desk 03'
    },
    {
      'Participant ID': 'PB-104',
      'Name': 'Rakib Hasan',
      'Email': 'rakib.prompt@diu.edu.bd',
      'Passcode': 'PASS-2190',
      'Team Name': 'Neural Circuit',
      'Desk Number': 'Desk 04'
    },
    {
      'Participant ID': 'PB-105',
      'Name': 'Farhan Kabir',
      'Email': 'farhan.prompt@diu.edu.bd',
      'Passcode': 'PASS-6351',
      'Team Name': 'Vector Core',
      'Desk Number': 'Desk 05'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contenders');

  XLSX.writeFile(workbook, 'Prompt_Battle_2026_Contenders_Template.xlsx');
}
