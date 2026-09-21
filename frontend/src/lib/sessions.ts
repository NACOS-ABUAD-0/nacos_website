/** "26/27" -> "2026/27" */
export function formatSession(session: string): string {
  const [start, end] = session.split("/");
  return `20${start}/${end}`;
}

/** Sort "YY/YY" sessions newest first. */
export function sortSessionsDesc(sessions: string[]): string[] {
  return [...sessions].sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
}

/** True for a well-formed session with consecutive years, e.g. "26/27". */
export function isValidSession(value: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(value);
  return !!m && (parseInt(m[1], 10) + 1) % 100 === parseInt(m[2], 10);
}
