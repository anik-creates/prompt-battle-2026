import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_ROSTER } from '../src/data/initialParticipants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service Account Key Path
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Service account file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://promptbattle-25930-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const rtdb = getDatabase(app);

async function seedFirebase() {
  console.log('🚀 Connecting to Firebase Realtime Database via Admin SDK...');
  console.log(`📦 Project: ${serviceAccount.project_id}`);
  console.log(`🔑 Client Email: ${serviceAccount.client_email}`);

  // 1. Prepare Admin & Judge Credentials
  const adminData = {
    email: 'pes.ieee@diu.edu.bd',
    password: 'PesDiuSbc2026',
    role: 'Super Administrator',
    organization: 'IEEE PES DIU SBC',
    event: 'EEE FEST 2026 Prompt Battle',
    updatedAt: Date.now()
  };

  const defaultJudges = [
    {
      id: 'judge-1',
      name: 'Dr. Srimanti Roy Choudhury',
      email: 'srimanti.eee@diu.edu.bd',
      password: 'Prompt_Battle_SRC_2026',
      judgeNumber: 1,
      registeredAt: Date.now()
    },
    {
      id: 'judge-2',
      name: 'Md. Wahiduzzaman',
      email: 'wahiduzzaman.eee@diu.edu.bd',
      password: 'Prompt_Battle_MW_2026',
      judgeNumber: 2,
      registeredAt: Date.now()
    },
    {
      id: 'judge-3',
      name: 'Anik Biswas',
      email: 'anik.eee@diu.edu.bd',
      password: 'Prompt_Battle_AB_2026',
      judgeNumber: 3,
      registeredAt: Date.now()
    },
    {
      id: 'judge-4',
      name: 'Sayeed Hossain Sayor',
      email: 'sayor.eee@diu.edu.bd',
      password: 'Prompt_Battle_SHS_2026',
      judgeNumber: 4,
      registeredAt: Date.now()
    }
  ];

  // 2. Prepare Problem Statement
  const problemStatement = {
    id: 'problem-pb-2026',
    title: 'Autonomous Smart Grid Load Forecasting & Dispatch Optimizer',
    track: 'Production Prompt Engineering & Chain-of-Thought (CoT)',
    status: 'hidden',
    releasedAt: null,
    scenario: `You are the lead AI Prompt Engineer for an intelligent Smart Microgrid operated under IEEE Power & Energy Society (PES) guidelines for EEE FEST 2026.

Your challenge is to architect a production-ready System Prompt and structured Chain-of-Thought (CoT) reasoning pipeline in Google Antigravity. The AI system ingests real-time intermittent solar, wind generation telemetry, fluctuating industrial/domestic load curves, and battery storage levels. 

The model must synthesize a 24-hour predictive dispatch plan that eliminates blackouts, respects voltage stability margins, and outputs strict, machine-readable JSON without explanatory chat filler or conversational preambles.`,
    objective: `Develop a comprehensive system prompt and instruction framework that forces the AI model to:
1. Deconstruct multi-variable dispatch constraints step-by-step using explicit Chain-of-Thought (CoT).
2. Calculate exact megawatt (MW) allocation commands across Solar PV, Wind Turbines, Battery Storage, and Grid Reserves.
3. Strictly validate output structure against the required JSON schema.
4. Maximize token efficiency under Google Antigravity daily limit quotas (scored out of 15 pts).`,
    constraints: [
      'Zero Output Hallucination: The model must return ONLY valid, parsable JSON matching the required schema.',
      'Token Budget Efficiency: Optimize prompt brevity to conserve daily Antigravity limit (15 pts).',
      'Adversarial Injection Defense: Prompt must resist conflicting user inputs attempting to bypass grid safety thresholds.',
      'Deterministic Output: Pin system persona and formatting anchors to eliminate variance across consecutive runs.',
      'Self-Correction Guardrails: Include explicit failure-handling protocols if input data has missing sensory telemetry.'
    ]
  };

  // 3. Assemble Full Battle State
  const fullBattleState = {
    activeArena: 'battle',
    timer: {
      duration: 1200,
      remaining: 1200,
      status: 'idle',
      startedAt: null,
      endsAt: null
    },
    published: false,
    participants: [],
    joinedParticipants: {},
    registeredContenders: INITIAL_ROSTER,
    judges: defaultJudges,
    admin: adminData,
    tokenBudget: 350,
    problemStatement: problemStatement,
    poll: {
      id: 'poll-1',
      question: 'Which AI Model Architecture excels the most at complex logical prompt decomposition?',
      type: 'mcq',
      status: 'active',
      published: false,
      displayMode: 'percentage',
      options: [
        { id: 'opt-1', text: 'Mixture of Experts (MoE) with CoT', isCorrect: true, votes: 0 },
        { id: 'opt-2', text: 'Dense Monolithic 7B Parameter Model', isCorrect: false, votes: 0 },
        { id: 'opt-3', text: 'Unquantized Recurrent Baseline', isCorrect: false, votes: 0 },
        { id: 'opt-4', text: 'Standard Zero-Shot Feedforward', isCorrect: false, votes: 0 }
      ],
      votes: {}
    },
    verificationPrompt: {
      id: 'judge-audit-prompt-2026',
      title: 'Judge AI Audit & Token Consumption Inspection Directive',
      directive: `[SYSTEM AUDIT & EVALUATION DIRECTIVE — IEEE PES DIU SBC ADJUDICATION]
Analyze the entire conversation session above and provide a strict, transparent evaluation summary for the adjudication panel:
1. Token & Context Accounting: Detail the approximate prompt tokens, completion tokens, and total context usage consumed during this task.
2. Reasoning Decomposition: Summarize the key Chain-of-Thought (CoT) reasoning steps and architecture decisions generated.
3. Constraint & Schema Validation: Confirm whether all mandatory constraints (zero hallucination, valid JSON output, schema keys) were strictly fulfilled.
4. Model Efficiency: Rate the prompt frugality and economy score (out of 100).
Output this summary concisely in clean markdown with a structured audit table.`,
      unlockedParticipants: {},
      globalUnlocked: false,
      status: 'ready',
      lastUpdated: Date.now()
    },
    lastUpdated: Date.now()
  };

  console.log(`👥 Seeding ${INITIAL_ROSTER.length} registered participants...`);
  console.log(`⚖️ Seeding ${defaultJudges.length} judges (including pes.ieee@diu.edu.bd)...`);
  console.log(`🛡️ Seeding admin credentials (${adminData.email})...`);

  // 4. Write to Realtime Database Path: prompt_battles/eee_fest_2026
  const battleRef = rtdb.ref('prompt_battles/eee_fest_2026');
  await battleRef.set(fullBattleState);
  console.log('✅ Successfully stored full state at prompt_battles/eee_fest_2026');

  // 5. Also write to dedicated credentials index for easy admin access
  const credsRef = rtdb.ref('credentials');
  await credsRef.set({
    admin: adminData,
    judges: defaultJudges,
    participantsCount: INITIAL_ROSTER.length,
    updatedAt: Date.now()
  });
  console.log('✅ Successfully stored dedicated credentials index at /credentials');

  console.log('\n🎉 ALL DATA (PARTICIPANTS, JUDGES, ADMIN) STORED IN FIREBASE SUCCESSFULLY!');
  process.exit(0);
}

seedFirebase().catch((err) => {
  console.error('❌ Error seeding Firebase:', err);
  process.exit(1);
});
