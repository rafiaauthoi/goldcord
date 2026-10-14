import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { academicYearRange } from "./academicYear";
import type { FlagKey } from "./eligibility";

export type SessionInput = {
  orgId: string;
  date: string;
  hours: number;
  activity: string;
  flags: FlagKey[];
};

export type Session = SessionInput & {
  id: string;
  favorite?: boolean;
};

export type OrganizationTotal = {
  orgId: string;
  total: number;
  flagged: number;
};

function sessionsRef(uid: string) {
  return collection(db, "users", uid, "sessions");
}

export function sortSessions(sessions: Session[]) {
  return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
}

export async function listSessionsForYear(uid: string, academicYear: string): Promise<Session[]> {
  const { from, to } = academicYearRange(academicYear);
  const snapshot = await getDocs(
    query(sessionsRef(uid), where("date", ">=", from), where("date", "<=", to))
  );
  const sessions = snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      orgId: data.orgId ?? "",
      date: data.date ?? "",
      hours: Number(data.hours ?? 0),
      activity: data.activity ?? "",
      flags: (data.flags ?? []) as FlagKey[],
      favorite: data.favorite === true,
    };
  });
  return sortSessions(sessions);
}

export async function createSession(uid: string, input: SessionInput) {
  const reference = await addDoc(sessionsRef(uid), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateSession(uid: string, id: string, input: SessionInput) {
  await updateDoc(doc(db, "users", uid, "sessions", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function setSessionFavorite(uid: string, id: string, favorite: boolean) {
  await updateDoc(doc(db, "users", uid, "sessions", id), {
    favorite,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSession(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "sessions", id));
}

export async function organizationHasSessions(uid: string, orgId: string) {
  const snapshot = await getDocs(
    query(sessionsRef(uid), where("orgId", "==", orgId), limit(1))
  );
  return !snapshot.empty;
}

export function totalHours(sessions: Session[]) {
  return sessions.reduce((sum, session) => sum + session.hours, 0);
}

export function flaggedHours(sessions: Session[]) {
  return sessions
    .filter((session) => session.flags.length > 0)
    .reduce((sum, session) => sum + session.hours, 0);
}

export function totalsByOrganization(sessions: Session[]): OrganizationTotal[] {
  const totals = new Map<string, OrganizationTotal>();
  for (const session of sessions) {
    const current = totals.get(session.orgId) ?? { orgId: session.orgId, total: 0, flagged: 0 };
    current.total += session.hours;
    if (session.flags.length > 0) {
      current.flagged += session.hours;
    }
    totals.set(session.orgId, current);
  }
  return [...totals.values()].sort((a, b) => b.total - a.total);
}

export function roundHours(hours: number) {
  return Math.round(hours * 100) / 100;
}

export function formatHours(hours: number) {
  const rounded = roundHours(hours);
  return `${rounded} ${rounded === 1 ? "hr" : "hrs"}`;
}