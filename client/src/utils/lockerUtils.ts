// lockerUtils.ts
/**
 * Helper to format ISO timestamps into “Xm ago” or “Xh ago”
 */
export function formatLastActivity(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMinutes = Math.floor((now.getTime() - activityTime.getTime()) / 60000);

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    return `${Math.floor(diffMinutes / 60)}h ago`;
  }
}
