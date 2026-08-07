export function getDailyTrialInfo(toolId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `cypher_trial_${toolId}_${today}`;
  const count = parseInt(localStorage.getItem(key) || '0', 10);
  const max = 3;
  const remaining = Math.max(0, max - count);
  return {
    count,
    max,
    remaining,
    isBlocked: count >= max
  };
}

export function recordTrialUsage(toolId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `cypher_trial_${toolId}_${today}`;
  const { count } = getDailyTrialInfo(toolId);
  localStorage.setItem(key, (count + 1).toString());
  return getDailyTrialInfo(toolId);
}
