import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listOrganizations } from "../lib/organizations";
import type { Organization } from "../lib/organizations";
import {
  createSession,
  deleteSession,
  formatHours,
  listSessionsForYear,
  sortSessions,
  updateSession,
} from "../lib/sessions";
import type { Session, SessionInput } from "../lib/sessions";
import { ELIGIBILITY_FLAGS, flagLabel } from "../lib/eligibility";
import type { FlagKey } from "../lib/eligibility";
import {
  academicYearOf,
  currentAcademicYear,
  formatDate,
  recentAcademicYears,
  todayString,
} from "../lib/academicYear";
import OrgTotals from "../components/OrgTotals";

type FormState = {
  orgId: string;
  date: string;
  hours: string;
  activity: string;
  flags: FlagKey[];
};

function emptyForm(): FormState {
  return { orgId: "", date: todayString(), hours: "", activity: "", flags: [] };
}

export default function LogHours() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [year, setYear] = useState(() => {
    const requested = searchParams.get("year");
    return requested && /^\d{4}-\d{4}$/.test(requested) ? requested : currentAcademicYear();
  });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    listOrganizations(user.uid)
      .then(setOrganizations)
      .catch(() => setError("Could not load your organizations. Refresh to try again."))
      .finally(() => setLoadingOrgs(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listSessionsForYear(user.uid, year)
      .then((result) => {
        if (!cancelled) setSessions(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your sessions. Refresh to try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, year]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || loadingSessions) return;
    const target = sessions.find((session) => session.id === editId);
    if (target) startEdit(target);
    setSearchParams({}, { replace: true });
  }, [searchParams, sessions, loadingSessions]);

  const orgNames = new Map(organizations.map((organization) => [organization.id, organization.name]));

  function update(key: "orgId" | "date" | "hours" | "activity", value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  function toggleFlag(key: FlagKey) {
    setForm((current) => ({
      ...current,
      flags: current.flags.includes(key)
        ? current.flags.filter((flag) => flag !== key)
        : [...current.flags, key],
    }));
    setNotice("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setEligibilityOpen(false);
  }

  function changeYear(value: string) {
    setYear(value);
    setLoadingSessions(true);
  }

  function startEdit(session: Session) {
    setEditingId(session.id);
    setForm({
      orgId: session.orgId,
      date: session.date,
      hours: String(session.hours),
      activity: session.activity,
      flags: session.flags,
    });
    setEligibilityOpen(session.flags.length > 0);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError("");
    setNotice("");

    const hours = Number(form.hours);
    const activity = form.activity.trim();

    if (!form.orgId) {
      setError("Pick an organization.");
      return;
    }
    if (!form.date || form.date > todayString()) {
      setError("Pick a date that is today or earlier.");
      return;
    }
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24 || Math.round(hours * 4) !== hours * 4) {
      setError("Enter hours between 0.25 and 24, in quarter-hour steps like 1.5 or 2.75.");
      return;
    }
    if (!activity) {
      setError("Describe what you did.");
      return;
    }

    const input: SessionInput = {
      orgId: form.orgId,
      date: form.date,
      hours,
      activity,
      flags: form.flags,
    };
    const sessionYear = academicYearOf(form.date);
    const inShownYear = sessionYear === year;
    const message = !inShownYear
      ? `Saved under ${sessionYear}. Switch the academic year below to see it.`
      : editingId
        ? "Session updated."
        : "Session saved.";

    setSaving(true);
    try {
      if (editingId) {
        await updateSession(user.uid, editingId, input);
        const id = editingId;
        setSessions((current) => {
          const others = current.filter((session) => session.id !== id);
          return inShownYear ? sortSessions([...others, { ...input, id }]) : others;
        });
      } else {
        const id = await createSession(user.uid, input);
        if (inShownYear) {
          setSessions((current) => sortSessions([...current, { ...input, id }]));
        }
      }
      setNotice(message);
      resetForm();
    } catch {
      setError("Could not save the session. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(session: Session) {
    if (!user) return;
    const name = orgNames.get(session.orgId) ?? "this organization";
    const confirmed = window.confirm(
      `Delete ${formatHours(session.hours)} at ${name} on ${formatDate(session.date)}?`
    );
    if (!confirmed) return;
    setError("");
    setNotice("");
    try {
      await deleteSession(user.uid, session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      if (editingId === session.id) resetForm();
      setNotice("Session deleted.");
    } catch {
      setError("Could not delete the session. Try again.");
    }
  }

  if (loadingOrgs) return <p className="muted">Loading...</p>;

  if (organizations.length === 0) {
    return (
      <section className="page">
        <h1>Log hours</h1>
        <div className="panel">
          <h2>Add an organization first</h2>
          <p>
            Each session is logged against an organization, so your hours add up the way the LHC
            form asks for them.
          </p>
          <Link className="button" to="/organizations">
            Add an organization
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <h1>Log hours</h1>
      <p className="subtitle">
        Record each volunteer session as you go. Hours count toward the academic year their date
        falls in.
      </p>

      <form className="panel" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit session" : "New session"}</h2>
        <label>
          Organization
          <select value={form.orgId} onChange={(e) => update("orgId", e.target.value)} required>
            <option value="">Choose an organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <label>
            Date
            <input
              type="date"
              value={form.date}
              max={todayString()}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </label>
          <label>
            Hours
            <input
              type="number"
              inputMode="decimal"
              min="0.25"
              max="24"
              step="0.25"
              placeholder="2.5"
              value={form.hours}
              onChange={(e) => update("hours", e.target.value)}
              required
            />
          </label>
        </div>
        <label>
          What you did
          <span className="hint">A few words now make the LHC description easy to write later</span>
          <textarea
            value={form.activity}
            onChange={(e) => update("activity", e.target.value)}
            maxLength={500}
            rows={3}
            required
          />
        </label>

        <div className="disclosure">
          <button
            type="button"
            className="disclosure-toggle"
            aria-expanded={eligibilityOpen}
            aria-controls="eligibility-check"
            onClick={() => setEligibilityOpen((current) => !current)}
          >
            <span>
              Eligibility check (optional)
              {form.flags.length > 0 && (
                <span className="disclosure-count">{form.flags.length} noted</span>
              )}
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {eligibilityOpen && (
            <fieldset id="eligibility-check">
              <legend className="sr-only">Eligibility check</legend>
              <p className="hint fieldset-hint">
                The LHC may question hours that match these. Noting them here does not change your
                total.
              </p>
              {ELIGIBILITY_FLAGS.map((flag) => (
                <label key={flag.key} className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.flags.includes(flag.key)}
                    onChange={() => toggleFlag(flag.key)}
                  />
                  <span>{flag.label}</span>
                </label>
              ))}
            </fieldset>
          )}
        </div>

        {form.flags.length > 0 && (
          <p className="warning-box" role="status">
            These hours still count. Keep details handy in case an advisor asks about them.
          </p>
        )}
        {error && <p className="error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}
        <div className="button-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Save session"}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="section-header">
        <h2 className="section-title">Sessions</h2>
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

      {loadingSessions ? (
        <p className="muted">Loading...</p>
      ) : sessions.length === 0 ? (
        <p className="muted">No sessions logged for {year}.</p>
      ) : (
        <>
          <div className="panel">
            <h2>Totals by organization</h2>
            <OrgTotals sessions={sessions} organizations={organizations} />
          </div>
          <ul className="session-list">
            {sessions.map((session) => {
              const name = orgNames.get(session.orgId) ?? "Deleted organization";
              const flagged = session.flags.length > 0;
              return (
                <li key={session.id} className={`session-card${flagged ? " flagged" : ""}`}>
                  <div className="session-main">
                    <div>
                      <h3>{name}</h3>
                      <p className="muted session-meta">
                        <span>{formatDate(session.date)}</span>
                        <span>{formatHours(session.hours)}</span>
                      </p>
                    </div>
                    {flagged && <span className="badge warning">Review</span>}
                  </div>
                  <p className="session-activity">{session.activity}</p>
                  {flagged && (
                    <ul className="flag-list">
                      {session.flags.map((flag) => (
                        <li key={flag}>{flagLabel(flag)}</li>
                      ))}
                    </ul>
                  )}
                  <div className="button-row">
                    <button
                      type="button"
                      className="secondary small"
                      onClick={() => startEdit(session)}
                      aria-label={`Edit session at ${name} on ${formatDate(session.date)}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger small"
                      onClick={() => handleDelete(session)}
                      aria-label={`Delete session at ${name} on ${formatDate(session.date)}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}