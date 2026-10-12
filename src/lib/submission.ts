import type { Organization } from "./organizations";
import type { Session } from "./sessions";
import { roundHours, totalHours } from "./sessions";
import { formatDate } from "./academicYear";

export const LHC_FORM_URL = "https://wmich.edu/honors/lhc-service-log";

export function countSentences(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/(?<=[.!?])\s+/).filter((part) => /[a-zA-Z]/.test(part)).length;
}

function asSentence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const capitalized = trimmed[0].toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function hoursPhrase(hours: number) {
  const rounded = roundHours(hours);
  return `${rounded} ${rounded === 1 ? "hour" : "hours"}`;
}

export function draftDescription(organization: Organization, sessions: Session[]) {
  if (sessions.length === 0) return "";
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const span =
    first.date === last.date
      ? `on ${formatDate(first.date)}`
      : `between ${formatDate(first.date)} and ${formatDate(last.date)}`;
  const count = ordered.length;
  const intro = `I volunteered ${hoursPhrase(totalHours(ordered))} with ${organization.name} across ${count} ${count === 1 ? "session" : "sessions"} ${span}.`;
  const activities = [...new Set(ordered.map((session) => asSentence(session.activity)).filter(Boolean))];
  return [intro, ...activities].join(" ");
}

export function contactBlock(organization: Organization) {
  return [organization.contactName, organization.mailingAddress, organization.contactInfo]
    .filter(Boolean)
    .join("\n");
}