/**
 * Parses and normalizes contender records from a JSON file or string.
 * Supports array of objects or wrapped object (e.g. { participants: [...] })
 * with flexible field name variations.
 * 
 * @param {string | object} input - JSON string or parsed object
 * @returns {Array<{participantId: string, name: string, teamName: string, deskNumber: string}>}
 */
export function parseContenderJSON(input) {
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (err) {
      throw new Error('Invalid JSON syntax. Please check the JSON format: ' + err.message);
    }
  }

  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    // Check common wrapper keys
    const possibleKeys = ['participants', 'contenders', 'students', 'users', 'roster', 'data', 'items'];
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        list = data[key];
        break;
      }
    }
    // If not found, use Object.values if values look like objects
    if (list.length === 0) {
      const vals = Object.values(data);
      if (vals.length > 0 && typeof vals[0] === 'object') {
        list = vals;
      }
    }
  }

  if (!list || list.length === 0) {
    return [];
  }

  const normalized = [];

  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;

    let idVal = '';
    let nameVal = '';
    let emailVal = '';
    let passcodeVal = '';
    let teamVal = '';
    let deskVal = '';

    const keys = Object.keys(item);
    for (const key of keys) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_\-#]/g, '');
      const val = String(item[key] || '').trim();

      if (!idVal && (cleanKey === 'id' || cleanKey.includes('participantid') || cleanKey.includes('userid') || cleanKey.includes('roll') || cleanKey.includes('contenderid'))) {
        idVal = val;
      } else if (!emailVal && (cleanKey.includes('email') || cleanKey.includes('mail'))) {
        emailVal = val;
      } else if (!passcodeVal && (cleanKey.includes('passcode') || cleanKey.includes('password') || cleanKey.includes('pass') || cleanKey.includes('secret') || cleanKey.includes('code'))) {
        passcodeVal = val;
      } else if (!nameVal && (cleanKey.includes('name') || cleanKey.includes('student'))) {
        nameVal = val;
      } else if (!teamVal && (cleanKey.includes('team') || cleanKey.includes('group') || cleanKey.includes('dept') || cleanKey.includes('club'))) {
        teamVal = val;
      } else if (!deskVal && (cleanKey.includes('desk') || cleanKey.includes('seat') || cleanKey.includes('station') || cleanKey.includes('table'))) {
        deskVal = val;
      }
    }

    // Direct fallbacks
    if (!idVal && item.id) idVal = String(item.id).trim();
    if (!idVal && item.participantId) idVal = String(item.participantId).trim();
    if (!nameVal && item.name) nameVal = String(item.name).trim();
    if (!emailVal && (item.email || item.mail)) emailVal = String(item.email || item.mail).trim();
    if (!passcodeVal && (item.passcode || item.password || item.pass)) passcodeVal = String(item.passcode || item.password || item.pass).trim();

    // Auto-generate ID if name exists but ID missing
    if (!idVal && nameVal) {
      idVal = `PB-${100 + index + 1}`;
    }

    // Auto-generate passcode if missing
    if (!passcodeVal) {
      passcodeVal = `PB${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if ((idVal || nameVal || emailVal)) {
      normalized.push({
        participantId: (idVal || `PB-${100 + index + 1}`).toUpperCase(),
        name: nameVal || `Contender ${idVal}`,
        email: (emailVal || `${(idVal || 'user').toLowerCase()}@diu.edu.bd`).toLowerCase(),
        passcode: passcodeVal,
        teamName: teamVal || 'IEEE PES SBC Contender',
        deskNumber: deskVal || `Desk ${index + 1}`,
      });
    }
  });

  return normalized;
}

/**
 * Downloads a sample JSON template for participants.
 */
export function downloadSampleContenderJSON() {
  const sample = [
    {
      "participantId": "PB-101",
      "name": "Tanvir Hossain",
      "email": "tanvir.prompt@diu.edu.bd",
      "passcode": "PASS-9821",
      "teamName": "DIU Pioneers",
      "deskNumber": "Desk 01"
    },
    {
      "participantId": "PB-102",
      "name": "Anik Sarker",
      "email": "anik.prompt@diu.edu.bd",
      "passcode": "PASS-4412",
      "teamName": "PES Titans",
      "deskNumber": "Desk 02"
    },
    {
      "participantId": "PB-103",
      "name": "Sumaiya Akter",
      "email": "sumaiya.prompt@diu.edu.bd",
      "passcode": "PASS-7733",
      "teamName": "Cyber Sparks",
      "deskNumber": "Desk 03"
    },
    {
      "participantId": "PB-104",
      "name": "Rakib Hasan",
      "email": "rakib.prompt@diu.edu.bd",
      "passcode": "PASS-2190",
      "teamName": "Neural Circuit",
      "deskNumber": "Desk 04"
    },
    {
      "participantId": "PB-105",
      "name": "Farhan Kabir",
      "email": "farhan.prompt@diu.edu.bd",
      "passcode": "PASS-6351",
      "teamName": "Vector Core",
      "deskNumber": "Desk 05"
    }
  ];

  const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prompt_battle_participants.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
