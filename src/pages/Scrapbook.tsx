import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../lib/profile";
import type { Profile } from "../lib/profile";
import { listOrganizations } from "../lib/organizations";
import type { Organization } from "../lib/organizations";
import { formatHours, listSessionsForYear, roundHours, setSessionFavorite, totalHours } from "../lib/sessions";
import type { Session } from "../lib/sessions";
import {
  currentAcademicYear,
  daysUntilDeadline,
  deadlineYear,
  recentAcademicYears,
} from "../lib/academicYear";
import { ORG_COLORS, reviewUnlocked, shortDate, unlockDateLabel } from "../lib/review";
import Cord from "../components/Cord";
import LetterNote from "../components/LetterNote";

const READ_MORE_LENGTH = 90;

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

export default function Scrapbook() {
  const { user } = useAuth();
  const [year, setYear] = useState(currentAcademicYear());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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

  async function toggleFavorite(session: Session) {
    if (!user) return;
    const next = !session.favorite;
    setError("");
    setSessions((current) => current.map((item) => (item.id === session.id ? { ...item, favorite: next } : item)));
    try {
      await setSessionFavorite(user.uid, session.id, next);
    } catch {
      setSessions((current) =>
        current.map((item) => (item.id === session.id ? { ...item, favorite: !next } : item)),
      );
      setError("Could not save that star. Try again.");
    }
  }

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
  const unlocked = reviewUnlocked(year, completed, required);
  const openSession = sessions.find((session) => session.id === openId) ?? null;

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

          {sessions.length > 0 &&
            (unlocked ? (
              <Link className="scrapbook-review is-open" to={`/scrapbook/review?year=${year}`}>
                <span className="scrapbook-review-title">Your year in review is ready</span>
                <span>See where your hours went, your favorite moments, and prompts for the LHC form.</span>
              </Link>
            ) : (
              <div className="scrapbook-review">
                <span className="scrapbook-review-title">Year in review</span>
                <span>
                  Opens at {required} hours or on {unlockDateLabel(year)}. Star your favorite cards along the
                  way and they will show up there.
                </span>
              </div>
            ))}

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
                          <button
                            type="button"
                            className="scrap-card"
                            aria-haspopup="dialog"
                            aria-label={`${name}, ${shortDate(session.date)}, ${formatHours(session.hours)}. Open the full note.`}
                            onClick={() => setOpenId(session.id)}
                          >
                            <span className="scrap-tape" aria-hidden="true" />
                            <span className="scrap-photo" style={{ background: ORG_COLORS[index % ORG_COLORS.length] }}>
                              {name}
                            </span>
                            <span className="scrap-date">{shortDate(session.date)}</span>
                            <span className="scrap-activity">{session.activity || "No notes yet"}</span>
                            {session.activity.length > READ_MORE_LENGTH && (
                              <span className="scrap-more" aria-hidden="true">
                                Read more
                              </span>
                            )}
                            <span className="scrap-hours num">{formatHours(session.hours)}</span>
                            {session.flags.length > 0 && <span className="scrap-flag">Check before submitting</span>}
                          </button>
                          <button
                            type="button"
                            className={`scrap-star${session.favorite ? " is-on" : ""}`}
                            aria-pressed={Boolean(session.favorite)}
                            aria-label={`Favorite moment: ${name}, ${shortDate(session.date)}`}
                            onClick={() => toggleFavorite(session)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
                            </svg>
                          </button>
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

      <LetterNote
        session={openSession}
        organizationName={openSession ? orgName.get(openSession.orgId) ?? "Organization removed" : ""}
        color={openSession ? ORG_COLORS[(orgIndex.get(openSession.orgId) ?? 0) % ORG_COLORS.length] : "var(--ink)"}
        year={year}
        onClose={() => setOpenId(null)}
      />
    </section>
  );
}