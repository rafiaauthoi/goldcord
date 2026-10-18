import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../lib/profile";
import type { Profile } from "../lib/profile";
import { listOrganizations } from "../lib/organizations";
import type { Organization } from "../lib/organizations";
import { formatHours, listSessionsForYear, roundHours, totalHours } from "../lib/sessions";
import type { Session } from "../lib/sessions";
import { currentAcademicYear } from "../lib/academicYear";
import {
  ORG_COLORS,
  busiestMonth,
  favoriteMoments,
  monthName,
  reviewUnlocked,
  sessionsByOrganization,
  shortDate,
  unlockDateLabel,
} from "../lib/review";
import Cord from "../components/Cord";
import CrumpledNote from "../components/CrumpledNote";
import type { CrumpledNoteContent } from "../components/CrumpledNote";

const PROMPTS = [
  "Which shift stuck with you, and why?",
  "What did you learn about your community this year?",
  "What would you do differently next year?",
];

const MOMENT_PREVIEW_LENGTH = 140;

function shiftCount(count: number) {
  return `${count} ${count === 1 ? "shift" : "shifts"}`;
}

export default function YearInReview() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requested = searchParams.get("year");
  const year = requested && /^\d{4}-\d{4}$/.test(requested) ? requested : currentAcademicYear();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<CrumpledNoteContent | null>(null);
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
        if (!cancelled) setError("Could not load your year in review. Refresh to try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, year]);

  if (loading) return <p className="muted">Loading...</p>;

  const required = profile?.requirements[year] ?? 20;
  const completed = totalHours(sessions);
  const met = completed >= required;
  const unlocked = reviewUnlocked(year, completed, required);
  const orgIndex = new Map(organizations.map((organization, index) => [organization.id, index]));
  const orgName = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const groups = sessionsByOrganization(sessions);
  const busiest = busiestMonth(sessions);
  const moments = favoriteMoments(sessions);
  const backLink = (
    <Link to="/scrapbook" className="review-back">
      Back to your scrapbook
    </Link>
  );

  if (error) {
    return (
      <section className="page review">
        {backLink}
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!unlocked) {
    return (
      <section className="page review">
        {backLink}
        <div className="review-locked">
          <h1>Your year in review is still coming together</h1>
          <p>
            It opens when you reach {required} hours or on {unlockDateLabel(year)}, whichever comes
            first. Keep logging and it will be waiting for you.
          </p>
          <Cord value={completed} max={required} label={`Service hours for ${year}`} />
          <p className="review-locked-count">
            <strong className="num">{roundHours(completed)}</strong> of {required} hours so far
          </p>
        </div>
      </section>
    );
  }

  if (sessions.length === 0) {
    return (
      <section className="page review">
        {backLink}
        <div className="review-locked">
          <h1>Nothing to look back on yet</h1>
          <p>No sessions were logged for {year}.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page review">
      {backLink}
      <h1>Your {year}, in review</h1>
      <p className="subtitle">
        {met
          ? `${formatHours(completed)}, ${groups.length} ${groups.length === 1 ? "place" : "places"}, one finished cord.`
          : `${formatHours(completed)} across ${groups.length} ${groups.length === 1 ? "place" : "places"} so far.`}
      </p>

      <dl className="review-stats">
        <div>
          <dt>hours given</dt>
          <dd className="num">{roundHours(completed)}</dd>
        </div>
        <div>
          <dt>shifts logged</dt>
          <dd className="num">{sessions.length}</dd>
        </div>
        <div>
          <dt>{groups.length === 1 ? "organization" : "organizations"}</dt>
          <dd className="num">{groups.length}</dd>
        </div>
        {busiest && (
          <div>
            <dt>busiest month, {formatHours(busiest.hours)}</dt>
            <dd>{monthName(busiest.key, "short")}</dd>
          </div>
        )}
      </dl>

      <div className="review-cord">
        <Cord value={completed} max={required} label={`Service hours for ${year}`} />
      </div>

      <h2 className="review-section">Where your hours went</h2>
      <ul className="review-envelopes">
        {groups.map((group) => {
          const name = orgName.get(group.orgId) ?? "Organization removed";
          const color = ORG_COLORS[(orgIndex.get(group.orgId) ?? 0) % ORG_COLORS.length];
          const isOpen = open === group.orgId;
          const shown = group.sessions.slice(-5);
          return (
            <li key={group.orgId}>
              <button
                type="button"
                className={`review-envelope${isOpen ? " is-open" : ""}`}
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : group.orgId)}
              >
                <span className="review-fan" aria-hidden="true">
                  {shown.map((session, index) => (
                    <span
                      key={session.id}
                      className="review-fan-card"
                      style={{ "--i": index - (shown.length - 1) / 2 } as CSSProperties}
                    >
                      <span className="review-fan-photo" style={{ background: color }}>
                        {shortDate(session.date)}
                      </span>
                      <span className="review-fan-text">{session.activity || "No notes"}</span>
                      <span className="review-fan-hours">{formatHours(session.hours)}</span>
                    </span>
                  ))}
                </span>
                <span className="review-pocket">
                  <span className="review-pocket-name">{name}</span>
                  <span>
                    {formatHours(group.hours)} · {shiftCount(group.sessions.length)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="review-more"
                aria-label={`Show more from ${name}`}
                onClick={() =>
                  setNote({
                    title: name,
                    kicker: `${formatHours(group.hours)} · ${shiftCount(group.sessions.length)}`,
                    sessions: group.sessions,
                  })
                }
              >
                Show more
              </button>
              <ul className="sr-only">
                {group.sessions.map((session) => (
                  <li key={session.id}>
                    {shortDate(session.date)}, {formatHours(session.hours)}, {session.activity}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      {moments.picked.length > 0 && (
        <>
          <h2 className="review-section">{moments.starred ? "Your favorite moments" : "A few moments from your year"}</h2>
          {!moments.starred && (
            <p className="review-hint">Star cards in your scrapbook to choose the moments shown here.</p>
          )}
          <ul className="review-moments">
            {moments.picked.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className="review-moment"
                  onClick={() =>
                    setNote({
                      title: orgName.get(session.orgId) ?? "Organization removed",
                      kicker: `${shortDate(session.date)} · ${formatHours(session.hours)}`,
                      sessions: [session],
                    })
                  }
                >
                  <span className="review-moment-text">{session.activity}</span>
                  <span className="review-moment-meta">
                    {orgName.get(session.orgId) ?? "Organization removed"} · {shortDate(session.date)}
                  </span>
                  {session.activity.length > MOMENT_PREVIEW_LENGTH && (
                    <span className="review-moment-more">Show more</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="review-reflect">
        <h2 className="review-section">Before you fill out the LHC form</h2>
        <p>A few prompts to help with the impact question:</p>
        <ul>
          {PROMPTS.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
        <Link className="button" to="/submit">
          Get ready to submit
        </Link>
      </div>

      <CrumpledNote note={note} onClose={() => setNote(null)} />
    </section>
  );
}