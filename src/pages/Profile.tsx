import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { emptyProfile, getProfile, saveProfile } from "../lib/profile";
import type { Profile as ProfileData, Requirement } from "../lib/profile";
import { currentAcademicYear } from "../lib/academicYear";
import DeleteAccount from "../components/DeleteAccount";

const SEMESTERS = ["Fall", "Spring"];

function joinedYearOptions() {
  const thisYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => String(thisYear - index));
}

export default function Profile() {
  const { user } = useAuth();
  const academicYear = currentAcademicYear();
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [semester, setSemester] = useState("Fall");
  const [joinedYear, setJoinedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    getProfile(user.uid)
      .then((profile) => {
        if (!profile) return;
        setForm(profile);
        const [savedSemester, savedYear] = profile.joinedTerm.split(" ");
        if (savedSemester && savedYear) {
          setSemester(savedSemester);
          setJoinedYear(savedYear);
        }
      })
      .catch(() => setError("Could not load your profile. Refresh to try again."))
      .finally(() => setLoading(false));
  }, [user]);

  const requirement: Requirement = form.requirements[academicYear] ?? 20;

  function update(key: "firstName" | "lastName" | "preferredName", value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  function setRequirement(value: Requirement) {
    setForm((current) => ({
      ...current,
      requirements: { ...current.requirements, [academicYear]: value },
    }));
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError("");
    setNotice("");

    const cleaned: ProfileData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      preferredName: form.preferredName.trim(),
      joinedTerm: `${semester} ${joinedYear}`,
      requirements: { ...form.requirements, [academicYear]: requirement },
    };

    if (!cleaned.firstName || !cleaned.lastName || !cleaned.preferredName) {
      setError("Fill in your first, last, and preferred name.");
      return;
    }

    setSaving(true);
    try {
      await saveProfile(user.uid, cleaned);
      setForm(cleaned);
      setNotice("Profile saved.");
    } catch {
      setError("Could not save your profile. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <section className="page">
      <h1>Profile</h1>
      <p className="subtitle">These details fill in the top of the LHC Community Service Log.</p>
      <form className="panel" onSubmit={handleSubmit}>
        <p className="muted">WMU email: {user?.email}</p>
        <div className="field-row">
          <label>
            First name
            <input
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              maxLength={60}
              autoComplete="given-name"
              required
            />
          </label>
          <label>
            Last name
            <input
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              maxLength={60}
              autoComplete="family-name"
              required
            />
          </label>
        </div>
        <label>
          Preferred name
          <span className="hint">The name you go by</span>
          <input
            value={form.preferredName}
            onChange={(e) => update("preferredName", e.target.value)}
            maxLength={60}
            autoComplete="nickname"
            required
          />
        </label>
        <div className="field-row">
          <label>
            Semester you joined the LHC
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {SEMESTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Year
            <select value={joinedYear} onChange={(e) => setJoinedYear(e.target.value)}>
              {joinedYearOptions().map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend>Requirement for {academicYear}</legend>
          <label className="radio">
            <input
              type="radio"
              name="requirement"
              checked={requirement === 20}
              onChange={() => setRequirement(20)}
            />
            <span>
              <strong>20 hours</strong> for a full academic year
            </span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="requirement"
              checked={requirement === 10}
              onChange={() => setRequirement(10)}
            />
            <span>
              <strong>10 hours</strong> if you graduate in fall, joined the LHC in spring, or study
              abroad for a fall or spring semester
            </span>
          </label>
        </fieldset>
        <p className="privacy-note">
          Your WIN is never stored in this app. You will type it directly into the LHC form when you
          submit.
        </p>
        {error && <p className="error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
      <DeleteAccount />
    </section>
  );
}