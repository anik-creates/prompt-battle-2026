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
    let studentMailVal = '';
    let personalMailVal = '';
    let passcodeVal = '';
    let couponVal = '';
    let semesterVal = '';
    let phoneVal = '';
    let teamVal = '';
    let deskVal = '';

    const keys = Object.keys(item);
    for (const key of keys) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_\-#:]/g, '');
      const val = String(item[key] || '').trim();

      if (!idVal && (cleanKey === 'id' || cleanKey.includes('studentid') || cleanKey.includes('participantid') || cleanKey.includes('userid') || cleanKey.includes('roll') || cleanKey.includes('contenderid'))) {
        idVal = val;
      } else if (!nameVal && (cleanKey.includes('fullname') || cleanKey.includes('name') || cleanKey.includes('student'))) {
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

    // Direct fallbacks
    if (!idVal && item.id) idVal = String(item.id).trim();
    if (!idVal && item.studentId) idVal = String(item.studentId).trim();
    if (!idVal && item.participantId) idVal = String(item.participantId).trim();
    if (!nameVal && item.name) nameVal = String(item.name).trim();
    if (!studentMailVal && item.studentMail) studentMailVal = String(item.studentMail).trim();
    if (!personalMailVal && item.personalMail) personalMailVal = String(item.personalMail).trim();
    if (!emailVal && (item.email || item.mail)) emailVal = String(item.email || item.mail).trim();
    if (!couponVal && item.couponCode) couponVal = String(item.couponCode).trim();
    if (!passcodeVal && (item.passcode || item.password || item.pass)) passcodeVal = String(item.passcode || item.password || item.pass).trim();
    if (!semesterVal && item.semester) semesterVal = String(item.semester).trim();
    if (!phoneVal && item.phone) phoneVal = String(item.phone).trim();
    if (!deskVal && item.deskNumber) deskVal = String(item.deskNumber).trim();

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
        teamName: teamVal || item.teamName || 'Solo Contender',
        deskNumber: deskVal || `Desk ${deskNumStr}`,
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
