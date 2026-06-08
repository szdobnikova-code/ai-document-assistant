export function relativeTimeFromNow(date: Date | string | number): string {
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return '';

  const diffMs = Date.now() - then;
  const seconds = Math.max(0, Math.round(diffMs / 1000));

  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
