import { currentAcademicYear, deadlineYear, todayString } from "./academicYear";
import { totalHours } from "./sessions";
import type { Session } from "./sessions";

export const ORG_COLORS = [
  "var(--danger)",
  "var(--ink)",
  "var(--success)",
  "var(--gold-text)",
  "var(--ink-hover)",
  "var(--ink-soft)",
];

export function unlockDate(academicYear: string) {
  return `${deadlineYear(academicYear)}-05-01`;
}

export function unlockDateLabel(academicYear: string) {
  return `May 1, ${deadlineYear(academicYear)}`;
}

export function reviewUnlocked(academicYear: string, completed: number, required: number) {
  if (completed >= required) return true;
  if (academicYear !== currentAcademicYear()) return true;
  return todayString() >= unlockDate(academicYear);
}

export function monthName(monthKey: string, style: "long" | "short" = "long") {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 15).toLocaleDateString("en-US", { month: style });
}

export function busiestMonth(sessions: Session[]) {
  const byMonth = new Map<string, number>();
  for (const session of sessions) {
    const key = session.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + session.hours);
  }
  let best: { key: string; hours: number } | null = null;
  for (const [key, hours] of byMonth) {
    if (!best || hours > best.hours) best = { key, hours };
  }
  return best;
}

export function favoriteMoments(sessions: Session[], limit = 3) {
  const withNotes = sessions.filter((session) => session.activity.trim().length > 0);
  const starred = withNotes
    .filter((session) => session.favorite)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (starred.length > 0) return { picked: starred.slice(0, 6), starred: true };
  const longest = [...withNotes]
    .sort((a, b) => b.activity.length - a.activity.length)
    .slice(0, limit)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { picked: longest, starred: false };
}

export function sessionsByOrganization(sessions: Session[]) {
  const groups = new Map<string, Session[]>();
  for (const session of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    groups.set(session.orgId, [...(groups.get(session.orgId) ?? []), session]);
  }
  return [...groups.entries()]
    .map(([orgId, items]) => ({ orgId, sessions: items, hours: totalHours(items) }))
    .sort((a, b) => b.hours - a.hours);
}

export function shortDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}