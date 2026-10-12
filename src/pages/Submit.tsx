import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../lib/profile";
import type { Profile } from "../lib/profile";
import { hasCompleteContact, listOrganizations } from "../lib/organizations";
import type { Organization } from "../lib/organizations";
import {
  flaggedHours,
  formatHours,
  listSessionsForYear,
  roundHours,
  totalHours,
} from "../lib/sessions";
import type { Session } from "../lib/sessions";
import { listDrafts, saveDraft } from "../lib/drafts";
import type { Draft } from "../lib/drafts";
import { currentAcademicYear, deadlineYear, recentAcademicYears } from "../lib/academicYear";
import { LHC_FORM_URL, countSentences } from "../lib/submission";
import CopyField from "../components/CopyField";
import OrgSubmissionBlock from "../components/OrgSubmissionBlock";

function ManualField({ label, note }: { label: string; note: string }) {
  return (
    <div className="copy-field">
      <div className="copy-field-label">{label}</div>
      <p className="manual-note">{note}</p>
    </div>
  );
}

export default function Submit() {
  const { user } = useAuth();
  const [year, setYear] = useState(currentAcademicYear());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getProfile(user.uid),
      listOrganizations(user.uid),
      listSessionsForYear(user.uid, year),
      listDrafts(user.uid, year),
    ])
      .then(([profileResult, organizationResult, sessionResult, draftResult]) => {
        if (cancelled) return;
        setProfile(profileResult);
        setOrganizations(organizationResult);
        setSessions(sessionResult);
        setDrafts(draftResult);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your submission. Refresh to try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, year]);

  function changeYear(value: string) {
    setYear(value);
    setLoading(true);
    setError("");
  }

  async function handleSaveDraft(orgId: string, draft: Draft) {
    if (!user) return;
    await saveDraft(user.uid, year, orgId, draft);
    setDrafts((current) => ({ ...current, [orgId]: draft }));
  }

  const required = profile?.requirements[year] ?? 20;
  const total = totalHours(sessions);
  const toReview = flaggedHours(sessions);

  const sessionsByOrg = new Map<string, Session[]>();
  for (const session of sessions) {
    const list = sessionsByOrg.get(session.orgId) ?? [];
    list.push(session);
    sessionsByOrg.set(session.orgId, list);
  }
  const submissionOrgs = organizations.filter((organization) => sessionsByOrg.has(organization.id));

  const checks = [
    { label: "Profile filled in", done: Boolean(profile) },
    { label: `${roundHours(total)} of ${required} hours logged`, done: total >= required },
    {
      label: "Contact details for every organization",
      done: submissionOrgs.length > 0 && submissionOrgs.every(hasCompleteContact),
    },
    {
      label: "Impact reflection of 3 or more sentences saved for every organization",
      done:
        submissionOrgs.length > 0 &&
        submissionOrgs.every(
          (organization) => countSentences(drafts[organization.id]?.impact ?? "") >= 3
        ),
    },
  ];
  const ready = checks.every((check) => check.done);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Submit</h1>
          <p className="subtitle">
            Everything the LHC Community Service Log asks for, in the same order. Due June 30,{" "}
            {deadlineYear(year)}.
          </p>
        </div>
        <label className="inline-select">
          Academic year
          <select value={year} onChange={(e) => changeYear(e.target.value)}>
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
          <div className="panel">
            <h2>{ready ? "Ready to submit" : "Before you submit"}</h2>
            <ul className="checklist">
              {checks.map((check) => (
                <li key={check.label} className={check.done ? "done" : ""}>
                  <span className="sr-only">{check.done ? "Done: " : "Not done: "}</span>
                  {check.label}
                </li>
              ))}
            </ul>
            {total < required && (
              <p className="warning-box">
                The LHC rejects logs with fewer than {required} hours, so submit once you reach the
                full amount.
              </p>
            )}
            {toReview > 0 && (
              <p className="warning-box">
                {formatHours(toReview)} marked for review on the Log Hours page. Look them over
                before you submit.
              </p>
            )}
            <a className="button" href={LHC_FORM_URL} target="_blank" rel="noopener noreferrer">
              Open the LHC Community Service Log
            </a>
          </div>

          <div className="panel">
            <h2>Your details</h2>
            <CopyField label="Are you submitting 10 or 20 hours?" value={String(required)} />
            <CopyField
              label="First and Last Name"
              value={profile ? `${profile.firstName} ${profile.lastName}` : ""}
            />
            <CopyField label="Preferred Name" value={profile?.preferredName ?? ""} />
            <ManualField
              label="WIN (Western Identification Number)"
              note="Type your nine-digit WIN directly into the LHC form. This app never stores it."
            />
            <CopyField label="WMU Email" value={user?.email ?? ""} />
            <CopyField
              label="Year and Semester you joined the honors college"
              value={profile?.joinedTerm ?? ""}
            />
            <CopyField label="Which academic year are you applying these hours to?" value={year} />
          </div>

          {submissionOrgs.length === 0 ? (
            <div className="panel">
              <h2>No hours logged for {year}</h2>
              <p>Log sessions first, and each organization you volunteered with will show up here.</p>
              <Link className="button" to="/log">
                Log hours
              </Link>
            </div>
          ) : (
            submissionOrgs.map((organization, index) => (
              <OrgSubmissionBlock
                key={`${year}_${organization.id}`}
                organization={organization}
                sessions={sessionsByOrg.get(organization.id) ?? []}
                position={index + 1}
                count={submissionOrgs.length}
                initialDraft={drafts[organization.id]}
                onSave={(draft) => handleSaveDraft(organization.id, draft)}
              />
            ))
          )}

          <div className="panel">
            <h2>Certification</h2>
            <p>
              The last field asks you to type your full name to certify the log is accurate. Read
              the statement on the form before you sign, since the LHC refers suspected falsified
              hours to the Office of Student Conduct.
            </p>
          </div>
        </>
      )}
    </section>
  );
}