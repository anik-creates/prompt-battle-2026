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
          // Normalize object keys to lowercase without spaces/underscores
          const keys = Object.keys(row);
          let idVal = '';
          let nameVal = '';
          let teamVal = '';
          let deskVal = '';

          for (const key of keys) {
            const cleanKey = key.trim().toLowerCase().replace(/[\s_\-#]/g, '');
            const val = String(row[key] || '').trim();

            if (!idVal && (cleanKey.includes('id') || cleanKey.includes('participant') || cleanKey.includes('roll') || cleanKey.includes('contender'))) {
              idVal = val;
            } else if (!nameVal && (cleanKey.includes('name') || cleanKey.includes('participant') || cleanKey.includes('student'))) {
              nameVal = val;
            } else if (!teamVal && (cleanKey.includes('team') || cleanKey.includes('group') || cleanKey.includes('dept') || cleanKey.includes('club'))) {
              teamVal = val;
            } else if (!deskVal && (cleanKey.includes('desk') || cleanKey.includes('seat') || cleanKey.includes('station') || cleanKey.includes('table'))) {
              deskVal = val;
            }
          }

          // Fallbacks if columns weren't matched by name
          if (!idVal && keys[0]) idVal = String(row[keys[0]] || '').trim();
          if (!nameVal && keys[1]) nameVal = String(row[keys[1]] || '').trim();
          if (!teamVal && keys[2]) teamVal = String(row[keys[2]] || '').trim();

          // Auto-generate ID if missing
          if (!idVal && nameVal) {
            idVal = `PB-${100 + index + 1}`;
          }

          if (idVal || nameVal) {
            normalized.push({
              participantId: idVal.toUpperCase(),
              name: nameVal || `Contender ${idVal}`,
              teamName: teamVal || 'IEEE PES SBC Contender',
              deskNumber: deskVal || `Desk ${index + 1}`
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
      'Team Name': 'DIU Pioneers',
      'Desk Number': 'Desk 01'
    },
    {
      'Participant ID': 'PB-102',
      'Name': 'Anik Sarker',
      'Team Name': 'PES Titans',
      'Desk Number': 'Desk 02'
    },
    {
      'Participant ID': 'PB-103',
      'Name': 'Sumaiya Akter',
      'Team Name': 'Cyber Sparks',
      'Desk Number': 'Desk 03'
    },
    {
      'Participant ID': 'PB-104',
      'Name': 'Rakib Hasan',
      'Team Name': 'Neural Circuit',
      'Desk Number': 'Desk 04'
    },
    {
      'Participant ID': 'PB-105',
      'Name': 'Farhan Kabir',
      'Team Name': 'Vector Core',
      'Desk Number': 'Desk 05'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contenders');

  XLSX.writeFile(workbook, 'Prompt_Battle_2026_Contenders_Template.xlsx');
}
