/**
 * Prompt Battle 2026 Scoring & Penalty Calculator
 * IEEE PES DIU SBC • EEE FEST 2026
 * 
 * Rubric Breakdown (Total: 100 Points):
 * 1. Token Efficiency (15 pts): Decreases proportionally as more tokens are consumed.
 * 2. Time Efficiency (15 pts): Decreases proportionally as more competition time is elapsed.
 * 3. Objective Fulfillment (25 pts): Output prompt alignment with contest challenge.
 * 4. Finish Status (15 pts): Fully (15), Substantial (12), Partial (8), Minimal (4).
 * 5. Presentation Skill (15 pts): Contender explanation and architecture defense.
 * 6. Idea Novelty & Prompt Craft (15 pts): Advanced prompt frameworks & zero-shot craft.
 */

export const DEFAULT_TOKEN_BUDGET = 2000;
export const DEFAULT_BATTLE_DURATION = 1200; // 20 minutes

/**
 * Calculates Token Efficiency Score.
 * More tokens used = lower score (percentage-based penalty).
 */
export function calculateTokenScore(tokensUsed = 0, tokenBudget = DEFAULT_TOKEN_BUDGET, maxPoints = 15) {
  const tokens = Math.max(0, Number(tokensUsed) || 0);
  const budget = Math.max(1, Number(tokenBudget) || DEFAULT_TOKEN_BUDGET);
  const ratio = Math.min(1, tokens / budget);
  const score = Math.max(0, Math.round((1 - ratio) * maxPoints));
  const percentageUsed = Math.min(100, Math.round(ratio * 100));

  return {
    score,
    percentageUsed,
    tokensUsed: tokens,
    tokenBudget: budget,
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
  tokenBudget = DEFAULT_TOKEN_BUDGET,
  finishSeconds = 0,
  totalDurationSec = DEFAULT_BATTLE_DURATION,
  objectiveScore = 0,
  finishStatus = 'Partially Fulfilled',
  presentationScore = 0,
  noveltyScore = 0,
}) {
  const tokenRes = calculateTokenScore(tokensUsed, tokenBudget, 15);
  const timeRes = calculateTimeScore(finishSeconds, totalDurationSec, 15);
  const statusScore = getFinishStatusScore(finishStatus);
  const obj = Math.min(25, Math.max(0, Number(objectiveScore) || 0));
  const pres = Math.min(15, Math.max(0, Number(presentationScore) || 0));
  const nov = Math.min(15, Math.max(0, Number(noveltyScore) || 0));

  const total = tokenRes.score + timeRes.score + obj + statusScore + pres + nov;

  return {
    tokenScore: tokenRes.score,
    tokenPercentageUsed: tokenRes.percentageUsed,
    timeScore: timeRes.score,
    timePercentageUsed: timeRes.percentageTime,
    statusScore,
    objectiveScore: obj,
    presentationScore: pres,
    noveltyScore: nov,
    totalScore: Math.min(100, total),
  };
}
