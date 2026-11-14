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

export const DEFAULT_TOKEN_BUDGET = 100; // 100% of Antigravity Daily Limit
export const DEFAULT_BATTLE_DURATION = 1200; // 20 minutes

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
