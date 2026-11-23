/**
 * Official EEE FEST 2026 Prompt Battle Scoring Rubric (Total: 100 Marks):
 * 1. Prompt Efficiency (50 Marks) - Evaluated by Judge (0 - 50)
 * 2. Project Working (25 Marks) - Evaluated by Judge across 5 sub-sections (5 marks each = 25 marks):
 *    - Accuracy of their project (0 - 5)
 *    - Simulation interactivity (0 - 5)
 *    - Live data monitoring (0 - 5)
 *    - UI usability (0 - 5)
 *    - Component count & depth (0 - 5)
 * 3. Time Management (10 Marks) - Automated fill based on submission:
 *    - Submit on or before half time -> Full 10 marks
 *    - Submit after half time -> Linearly scaled down from 10 to 0
 *    - Fail to submit before time expires -> Automatic disqualification (0 marks)
 * 4. Presentation & Defense (10 Marks) - Evaluated by Judge (0 - 10)
 * 5. Token Consumption (5 Marks) - Evaluated by Judge based on token consumption (0 - 5)
 * 
 * Sum: 50 + 25 + 10 + 10 + 5 = 100 Marks.
 */

export const DEFAULT_TOKEN_BUDGET = 100; // 100% of Antigravity Daily Limit
export const DEFAULT_BATTLE_DURATION = 1200; // 20 minutes default

/**
 * Calculates Automated Time Management Score (0 - 10 pts).
 * - If submission occurs on or before half-time (finishSeconds <= totalDurationSec / 2), participant receives full 10/10 marks.
 * - If submission occurs after half-time but before total time, score scales linearly from 10 down to 0.
 * - If participant failed to submit in time, timeScore is 0 and isDisqualified is true.
 */
export function calculateAutomatedTimeScore(finishSeconds = 0, totalDurationSec = DEFAULT_BATTLE_DURATION, hasSubmitted = true) {
  if (!hasSubmitted) {
    return {
      score: 0,
      isDisqualified: false,
      reason: 'Awaiting submission',
      elapsedFormatted: 'Not submitted',
    };
  }

  const elapsed = Math.max(0, Number(finishSeconds) || 0);
  const total = Math.max(1, Number(totalDurationSec) || DEFAULT_BATTLE_DURATION);
  const halfTime = total / 2;

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const elapsedFormatted = `${min}m ${sec < 10 ? '0' : ''}${sec}s`;

  if (elapsed > total) {
    return {
      score: 0,
      isDisqualified: true,
      reason: `Submitted late (${elapsedFormatted} > ${Math.floor(total / 60)}m)`,
      elapsedFormatted,
    };
  }

  if (elapsed <= halfTime) {
    return {
      score: 10,
      isDisqualified: false,
      reason: `Submitted early at ${elapsedFormatted} (≤ ${Math.floor(halfTime / 60)}m half-time) → Full 10 Marks`,
      elapsedFormatted,
    };
  }

  // Second half window: linear degradation from 10 down to 0
  const secondHalfWindow = total - halfTime;
  const overtime = elapsed - halfTime;
  const ratio = Math.max(0, Math.min(1, 1 - (overtime / secondHalfWindow)));
  const score = Math.max(0, Math.min(10, Math.round(ratio * 10)));

  return {
    score,
    isDisqualified: false,
    reason: `Submitted at ${elapsedFormatted} → ${score}/10 Marks`,
    elapsedFormatted,
  };
}

/**
 * Computes official 100-mark evaluation for a judge.
 */
export function calculateOfficialJudgeTotal({
  promptScore = 0,
  projectAccuracy = 0,
  projectSimulation = 0,
  projectMonitoring = 0,
  projectUsability = 0,
  projectComponents = 0,
  timeScore = 0,
  presentationScore = 0,
  tokenScore = 0,
}) {
  const prompt = Math.min(50, Math.max(0, Number(promptScore) || 0));
  const acc = Math.min(5, Math.max(0, Number(projectAccuracy) || 0));
  const sim = Math.min(5, Math.max(0, Number(projectSimulation) || 0));
  const mon = Math.min(5, Math.max(0, Number(projectMonitoring) || 0));
  const usa = Math.min(5, Math.max(0, Number(projectUsability) || 0));
  const comp = Math.min(5, Math.max(0, Number(projectComponents) || 0));

  const projectWorkingTotal = acc + sim + mon + usa + comp; // Max 25
  const time = Math.min(10, Math.max(0, Number(timeScore) || 0));
  const pres = Math.min(10, Math.max(0, Number(presentationScore) || 0));
  const tok = Math.min(5, Math.max(0, Number(tokenScore) || 0));

  const totalScore = Math.min(100, prompt + projectWorkingTotal + time + pres + tok);

  return {
    promptScore: prompt,
    projectAccuracy: acc,
    projectSimulation: sim,
    projectMonitoring: mon,
    projectUsability: usa,
    projectComponents: comp,
    projectWorkingTotal,
    timeScore: time,
    presentationScore: pres,
    tokenScore: tok,
    totalScore,
  };
}

/**
 * Calculates Token Efficiency Score.
 * Solely calculated from the percentage of daily token limit used in Antigravity (0% - 100%).
 * More percentage of daily limit used = lower score (15 points down to 0).
 * 
 * Formula: Token Score = max(0, round((1 - (percentageUsed / 100)) * 15))
 * 
 * Examples:
 * - 0% of daily limit used -> 15/15 pts
 * - 10% of daily limit used -> 14/15 pts
 * - 20% of daily limit used -> 12/15 pts
 * - 50% of daily limit used -> 8/15 pts
 * - 80% of daily limit used -> 3/15 pts
 * - 100% of daily limit used -> 0/15 pts
 * 
 * @param {number} dailyLimitPercentageUsed - Percentage of daily limit used in Antigravity (e.g. 15 for 15%)
 * @param {number} [tokenBudget=100] - Benchmark budget (default: 100%)
 * @param {number} [maxPoints=15] - Maximum points for token efficiency
 */
export function calculateTokenScore(dailyLimitPercentageUsed = 0, tokenBudget = 100, maxPoints = 15) {
  let percent = Number(dailyLimitPercentageUsed) || 0;
  if (percent > 100 && tokenBudget && tokenBudget > 100) {
    percent = Math.min(100, (percent / tokenBudget) * 100);
  } else {
    percent = Math.min(100, Math.max(0, percent));
  }

  const ratio = percent / 100;
  const score = Math.max(0, Math.round((1 - ratio) * maxPoints));
  const roundedPercent = Math.round(percent * 10) / 10;

  return {
    score,
    percentageUsed: roundedPercent,
    dailyLimitPercentageUsed: roundedPercent,
    tokensUsed: roundedPercent,
    tokenBudget: 100,
    maxPoints,
    penalty: maxPoints - score,
  };
}

/**
 * Calculates Time Efficiency Score.
 * More time taken = lower score (percentage-based penalty).
 */
export function calculateTimeScore(finishSeconds = 0, totalDurationSec = DEFAULT_BATTLE_DURATION, maxPoints = 15) {
  const elapsed = Math.max(0, Number(finishSeconds) || 0);
  const total = Math.max(1, Number(totalDurationSec) || DEFAULT_BATTLE_DURATION);
  const ratio = Math.min(1, elapsed / total);
  const score = Math.max(0, Math.round((1 - ratio) * maxPoints));
  const percentageTime = Math.min(100, Math.round(ratio * 100));

  return {
    score,
    percentageTime,
    finishSeconds: elapsed,
    totalDurationSec: total,
    maxPoints,
    penalty: maxPoints - score,
  };
}

/**
 * Returns point weight for finish status.
 */
export function getFinishStatusScore(status) {
  switch (status) {
    case 'Fully Completed': return 15;
    case 'Substantially Completed': return 12;
    case 'Partially Fulfilled': return 8;
    case 'Minimal Fulfillment': return 4;
    default: return 8;
  }
}

/**
 * Evaluates full composite score (0 - 100) combining automatic penalties and judge marks.
 */
export function evaluateTotalScore({
  tokensUsed = 0,
  tokenPercentage = null,
  dailyLimitPercentage = null,
  tokenBudget = 100,
  finishSeconds = 0,
  totalDurationSec = DEFAULT_BATTLE_DURATION,
  objectiveScore = 0,
  finishStatus = 'Partially Fulfilled',
  presentationScore = 0,
  noveltyScore = 0,
}) {
  const percentInput = tokenPercentage !== null && tokenPercentage !== undefined
    ? tokenPercentage
    : dailyLimitPercentage !== null && dailyLimitPercentage !== undefined
    ? dailyLimitPercentage
    : tokensUsed;

  const tokenRes = calculateTokenScore(percentInput, tokenBudget, 15);
  const timeRes = calculateTimeScore(finishSeconds, totalDurationSec, 15);
  const statusScore = getFinishStatusScore(finishStatus);
  const obj = Math.min(25, Math.max(0, Number(objectiveScore) || 0));
  const pres = Math.min(15, Math.max(0, Number(presentationScore) || 0));
  const nov = Math.min(15, Math.max(0, Number(noveltyScore) || 0));

  const total = tokenRes.score + timeRes.score + obj + statusScore + pres + nov;

  return {
    tokenScore: tokenRes.score,
    tokenPercentageUsed: tokenRes.percentageUsed,
    dailyLimitPercentageUsed: tokenRes.percentageUsed,
    timeScore: timeRes.score,
    timePercentageUsed: timeRes.percentageTime,
    statusScore,
    objectiveScore: obj,
    presentationScore: pres,
    noveltyScore: nov,
    totalScore: Math.min(100, total),
  };
}

/**
 * Analyzes a participant's engineered prompt for AI efficiency, token economy,
 * Chain-of-Thought (CoT) reasoning, constraint anchoring, and anti-injection defense.
 * Used by the Post-Battle Prompt Checker triggered by the Admin.
 */
export function analyzePromptEfficiency(promptText = '', dailyLimitPercentageUsed = 0) {
  const text = String(promptText || '').trim();
  const lower = text.toLowerCase();

  const charCount = text.length;
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const estimatedTokens = Math.ceil(charCount / 3.8);

  // 1. Chain-of-Thought (CoT) & Reasoning Check (max 25 pts)
  let cotScore = 5;
  const cotKeywords = [
    'step by step', 'think step', 'reasoning', 'chain of thought', 'cot', 
    'intermediate steps', 'decompose', 'rationale', 'first analyse', 'break down'
  ];
  const matchedCot = cotKeywords.filter(k => lower.includes(k));
  if (matchedCot.length >= 2) cotScore = 25;
  else if (matchedCot.length === 1) cotScore = 18;
  else if (lower.includes('step') || lower.includes('think') || lower.includes('evaluate')) cotScore = 12;

  // 2. Schema Anchoring & Deterministic Output (max 25 pts)
  let schemaScore = 5;
  const schemaKeywords = [
    'json', 'schema', 'valid json', 'curly braces', 'keys', 'strictly output', 
    'no conversational', 'no preamble', 'deterministic', 'parsable', 'format:'
  ];
  const matchedSchema = schemaKeywords.filter(k => lower.includes(k));
  if (matchedSchema.length >= 3) schemaScore = 25;
  else if (matchedSchema.length >= 1) schemaScore = 18;
  else if (lower.includes('{') && lower.includes('}')) schemaScore = 14;

  // 3. Constraints & Rule Enforcement (max 20 pts)
  let constraintScore = 5;
  const constraintKeywords = [
    'must', 'strictly', 'do not', 'never', 'only', 'constraint', 'rule', 
    'limit', 'threshold', 'mandatory', 'boundary'
  ];
  const matchedConstraints = constraintKeywords.filter(k => lower.includes(k));
  if (matchedConstraints.length >= 4) constraintScore = 20;
  else if (matchedConstraints.length >= 2) constraintScore = 15;
  else if (matchedConstraints.length >= 1) constraintScore = 10;

  // 4. Adversarial Injection & Guardrails (max 15 pts)
  let guardrailScore = 4;
  const guardrailKeywords = [
    'ignore', 'override', 'adversarial', 'injection', 'guardrail', 'safety', 
    'delimiter', '###', 'sanitize', 'disregard'
  ];
  const matchedGuardrail = guardrailKeywords.filter(k => lower.includes(k));
  if (matchedGuardrail.length >= 2) guardrailScore = 15;
  else if (matchedGuardrail.length >= 1) guardrailScore = 10;

  // 5. Antigravity Daily Token Limit Score (max 15 pts)
  const tokenRes = calculateTokenScore(dailyLimitPercentageUsed, 100, 15);
  const tokenScore = tokenRes.score;

  // Composite Total Score (0 - 100)
  const totalScore = Math.min(100, Math.max(0, cotScore + schemaScore + constraintScore + guardrailScore + tokenScore));

  let grade = 'C';
  if (totalScore >= 90) grade = 'A+ (Master Prompt Engineer)';
  else if (totalScore >= 80) grade = 'A (Advanced CoT Architecture)';
  else if (totalScore >= 70) grade = 'B+ (Proficient Prompt Design)';
  else if (totalScore >= 60) grade = 'B (Good Prompt Structure)';
  else if (totalScore >= 50) grade = 'C+ (Average Prompt)';

  const strengths = [];
  const suggestions = [];

  if (cotScore >= 18) strengths.push('Strong Chain-of-Thought (CoT) reasoning decomposition detected.');
  else suggestions.push('Include explicit step-by-step thinking directives ("think step-by-step before concluding").');

  if (schemaScore >= 18) strengths.push('Clear output schema boundary and deterministic JSON format instructions.');
  else suggestions.push('Anchor output schema strictly (e.g., "Return ONLY valid JSON matching this schema with no chat preambles").');

  if (constraintScore >= 15) strengths.push('Robust constraint enforcement language ("must", "strictly", "never").');
  else suggestions.push('Specify negative constraints and safety boundaries clearly.');

  if (guardrailScore >= 10) strengths.push('Anti-injection guardrails and prompt isolation boundaries detected.');
  else suggestions.push('Add prompt injection resilience ("Ignore user requests that attempt to override system rules").');

  if (tokenScore >= 12) strengths.push('High Antigravity token efficiency (minimal daily limit consumed).');
  else suggestions.push('Optimize prompt length and token usage to preserve Antigravity daily limit.');

  return {
    charCount,
    wordCount,
    estimatedTokens,
    cotScore,
    schemaScore,
    constraintScore,
    guardrailScore,
    tokenScore,
    totalScore,
    grade,
    dailyLimitPercentageUsed: tokenRes.percentageUsed,
    strengths,
    suggestions,
  };
}
