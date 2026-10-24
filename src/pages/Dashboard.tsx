import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../lib/profile";
import type { Profile } from "../lib/profile";
import { listOrganizations } from "../lib/organizations";
import type { Organization } from "../lib/organizations";
import {
  flaggedHours,
  formatHours,
  listSessionsForYear,
  roundHours,
  totalHours,
} from "../lib/sessions";
import type { Session } from "../lib/sessions";
import { currentAcademicYear, daysUntilDeadline, deadlineYear } from "../lib/academicYear";
import OrgTotals from "../components/OrgTotals";
import Cord from "../components/Cord";
import BonusHours from "../components/BonusHours";

export default function Dashboard() {
  const { user } = useAuth();
  const academicYear = currentAcademicYear();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getProfile(user.uid),
      listOrganizations(user.uid),
      listSessionsForYear(user.uid, academicYear),
    ])
      .then(([profileResult, organizationResult, sessionResult]) => {
        setProfile(profileResult);
        setOrganizations(organizationResult);
        setSessions(sessionResult);
      })
      .catch(() => setError("Could not load your dashboard. Refresh to try again."))
      .finally(() => setLoading(false));
  }, [user, academicYear]);

  if (loading) return <p className="muted">Loading...</p>;

  const required = profile?.requirements[academicYear] ?? 20;
  const completed = totalHours(sessions);
  const toReview = flaggedHours(sessions);
  const met = completed >= required;
  const remaining = Math.max(0, required - completed);
  const daysLeft = daysUntilDeadline(academicYear);
  const deadline = `June 30, ${deadlineYear(academicYear)}`;
  const steps = [
    {
      title: "Fill in your profile",
      detail: "Your name and requirement fill in the top of the LHC form.",
      action: "Set up profile",
      to: "/profile",
      done: profile !== null,
    },
    {
      title: "Add an organization",
      detail: "Save each place you volunteer, with its contact details.",
      action: "Add organization",
      to: "/organizations",
      done: organizations.length > 0,
    },
    {
      title: "Log your first shift",
      detail: "Record the date, hours, and a few notes while you remember them.",
      action: "Log hours",
      to: "/log",
      done: sessions.length > 0,
    },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const setupDone = doneCount === steps.length;
  const nextStep = steps.find((step) => !step.done);

  return (
    <section className="page">
      <h1>{profile ? `Hi, ${profile.preferredName}` : "Welcome"}</h1>
      <p className="subtitle">Academic year {academicYear}, July 1 to June 30</p>
      {error && <p className="error">{error}</p>}

      {!error && !setupDone && (
        <section className="panel setup" aria-labelledby="setup-title">
          <div className="setup-head">
            <h2 id="setup-title">Get started</h2>
            <span className="setup-count">
              {doneCount} of {steps.length} done
            </span>
          </div>
          <p className="setup-intro">Three quick steps and your cord starts filling up.</p>
          <ol className="setup-list">
            {steps.map((step) => {
              const isNext = step === nextStep;
              return (
                <li key={step.to} className={`setup-step${step.done ? " is-done" : ""}${isNext ? " is-next" : ""}`}>
                  <span className="setup-mark" aria-hidden="true" />
                  <span className="setup-text">
                    <span className="setup-title">
                      {step.title}
                      <span className="sr-only">{step.done ? ", done" : ", not done yet"}</span>
                    </span>
                    <span className="setup-detail">{step.detail}</span>
                  </span>
                  {!step.done && (
                    <Link className={isNext ? "button small" : "button secondary small"} to={step.to}>
                      {step.action}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="dashboard-hero">
        <div className="progress-header">
          <h2>{met ? "Your cord is complete" : "Your cord so far"}</h2>
          <span className="progress-count">
            <strong>{roundHours(completed)}</strong> of {required} hours
          </span>
        </div>
        <Cord value={completed} max={required} label="Service hours completed" />
                  <BonusHours completed={completed} required={required} />
        <p className="progress-line">
          {met
            ? `Requirement met. Submit your LHC service log before ${deadline}.`
            : `${formatHours(remaining)} to go. ${daysLeft} ${daysLeft === 1 ? "day" : "days"} until ${deadline}.`}
        </p>
        {toReview > 0 && (
          <p className="warning-box">
            {formatHours(toReview)} marked for review. They count toward your total, but look them
            over before you submit.
          </p>
        )}
        <Link className="button" to={met ? "/submit" : "/log"}>
          {met ? "Get ready to submit" : "Log hours"}
        </Link>
      </div>

      <div className="panel">
        <h2>By organization</h2>
        <OrgTotals sessions={sessions} organizations={organizations} />
      </div>
    </section>
  );
}