import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../lib/profile";
import type { Profile } from "../lib/profile";
import { listOrganizations } from "../lib/organizations";
import type { Organization } from "../lib/organizations";
import { formatHours, listSessionsForYear, roundHours, totalHours } from "../lib/sessions";
import type { Session } from "../lib/sessions";
import {
  currentAcademicYear,
  daysUntilDeadline,
  deadlineYear,
  recentAcademicYears,
} from "../lib/academicYear";
import Cord from "../components/Cord";

const ORG_COLORS = [
  "var(--danger)",
  "var(--ink)",
  "var(--success)",
  "var(--gold-text)",
  "var(--ink-hover)",
  "var(--ink-soft)",
];

type MonthGroup = {
  key: string;
  label: string;
  hours: number;
  sessions: Session[];
};

function tilt(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return (hash % 9) - 4;
}

function groupByMonth(sessions: Session[]): MonthGroup[] {
  const groups = new Map<string, Session[]>();
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  for (const session of ordered) {
    const key = session.date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), session]);
  }
  return [...groups.entries()].map(([key, items]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      key,
      label: new Date(year, month - 1, 15).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      hours: totalHours(items),
      sessions: items,
    };
  });
}

function shortDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Scrapbook() {
  const { user } = useAuth();
  const [year, setYear] = useState(currentAcademicYear());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getProfile(user.uid), listOrganizations(user.uid), listSessionsForYear(user.uid, year)])
      .then(([profileResult, organizationResult, sessionResult]) => {
        if (cancelled) return;
        setProfile(profileResult);
        setOrganizations(organizationResult);
        setSessions(sessionResult);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your scrapbook. Refresh to try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, year]);

  function changeYear(value: string) {
    setLoading(true);
    setError("");
    setYear(value);
  }

  const required = profile?.requirements[year] ?? 20;
  const completed = totalHours(sessions);
  const remaining = Math.max(0, required - completed);
  const met = completed >= required;
  const months = groupByMonth(sessions);
  const orgIndex = new Map(organizations.map((organization, index) => [organization.id, index]));
  const orgName = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const orgCount = new Set(sessions.map((session) => session.orgId)).size;
  const isCurrent = year === currentAcademicYear();
  const daysLeft = daysUntilDeadline(year);

  return (
    <section className="page scrapbook">
      <div className="scrapbook-head">
        <div>
          <h1>Your scrapbook</h1>
          <p className="subtitle">Every shift you log, kept month by month.</p>
        </div>
        <label className="scrapbook-year">
          Academic year
          <select value={year} onChange={(event) => changeYear(event.target.value)}>
            {recentAcademicYears(4).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        <>
          <div className="scrapbook-summary">
            <p className="scrapbook-stats">
              <strong className="num">{roundHours(completed)}</strong> of {required} hours
              <span>
                {sessions.length} {sessions.length === 1 ? "session" : "sessions"} · {orgCount}{" "}
                {orgCount === 1 ? "organization" : "organizations"}
              </span>
            </p>
            <Cord value={completed} max={required} label={`Service hours for ${year}`} />
            <p className="scrapbook-line">
              {met
                ? "Your cord is complete for this year."
                : isCurrent && daysLeft >= 0
                  ? `${formatHours(remaining)} to go. June 30, ${deadlineYear(year)} is the deadline.`
                  : `${formatHours(remaining)} short of ${required} for this year.`}
            </p>
          </div>

          {months.length === 0 ? (
            <div className="scrapbook-empty">
              <p className="scrapbook-empty-title">Nothing pinned yet.</p>
              <p>Log your first shift and it will show up here as a card.</p>
              <Link className="button" to="/log">
                Log hours
              </Link>
            </div>
          ) : (
            <div className="scrapbook-months">
              {months.map((month) => (
                <article className="scrapbook-month" key={month.key} aria-labelledby={`month-${month.key}`}>
                  <h2 id={`month-${month.key}`}>
                    {month.label}
                    <span className="num">{formatHours(month.hours)}</span>
                  </h2>
                  <ul className="scrapbook-cards">
                    {month.sessions.map((session) => {
                      const index = orgIndex.get(session.orgId) ?? 0;
                      const name = orgName.get(session.orgId) ?? "Organization removed";
                      return (
                        <li key={session.id} style={{ rotate: `${tilt(session.id)}deg` }}>
                          <Link
                            className="scrap-card"
                            to={`/log?edit=${session.id}&year=${year}`}
                            aria-label={`${name}, ${shortDate(session.date)}, ${formatHours(session.hours)}. Open to edit.`}
                          >
                            <span className="scrap-tape" aria-hidden="true" />
                            <span className="scrap-photo" style={{ background: ORG_COLORS[index % ORG_COLORS.length] }}>
                              {name}
                            </span>
                            <span className="scrap-date">{shortDate(session.date)}</span>
                            <span className="scrap-activity">{session.activity || "No notes yet"}</span>
                            <span className="scrap-hours num">{formatHours(session.hours)}</span>
                            {session.flags.length > 0 && <span className="scrap-flag">Check before submitting</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}