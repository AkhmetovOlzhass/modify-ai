export function extractRequestedCount(moodText) {
  const match = moodText.match(/(\d{1,3})\s*пес(ен|ни|ня|ню)/i);
  const count = match ? parseInt(match[1], 10) : null;
  return Math.min(count || 15, 100); // fallback to 15, cap at 100
}