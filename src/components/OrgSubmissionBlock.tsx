import { useState } from "react";
import { Link } from "react-router-dom";
import CopyField, { CopyButton } from "./CopyField";
import AiPolish from "./AiPolish";
import { hasCompleteContact } from "../lib/organizations";
import type { Organization } from "../lib/organizations";
import { roundHours, totalHours } from "../lib/sessions";
import type { Session } from "../lib/sessions";
import type { Draft } from "../lib/drafts";
import type { PolishContext } from "../lib/ai";
import { contactBlock, countSentences, draftDescription } from "../lib/submission";

type OrgSubmissionBlockProps = {
  organization: Organization;
  sessions: Session[];
  position: number;
  count: number;
  initialDraft: Draft | undefined;
  onSave: (draft: Draft) => Promise<void>;
};

export default function OrgSubmissionBlock({
  organization,
  sessions,
  position,
  count,
  initialDraft,
  onSave,
}: OrgSubmissionBlockProps) {
  const [description, setDescription] = useState(
    () => initialDraft?.description || draftDescription(organization, sessions)
  );
  const [impact, setImpact] = useState(initialDraft?.impact ?? "");
  const [saved, setSaved] = useState<Draft | null>(initialDraft ?? null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  const hours = roundHours(totalHours(sessions));
  const sentences = countSentences(impact);
  const dirty = !saved || saved.description !== description || saved.impact !== impact;
  const contactComplete = hasCompleteContact(organization);
  const isLast = position === count;
  const polishContext: PolishContext = {
    organizationName: organization.name,
    hours,
    sessionCount: sessions.length,
  };

  let sentenceMessage = `${sentences} ${sentences === 1 ? "sentence" : "sentences"}`;
  if (sentences < 3) {
    sentenceMessage += `, ${3 - sentences} more needed`;
  } else if (sentences > 5) {
    sentenceMessage += ", more than the suggested 5";
  }

  async function handleSave() {
    const draft: Draft = { description: description.trim(), impact: impact.trim() };
    setStatus("saving");
    try {
      await onSave(draft);
      setSaved(draft);
      setDescription(draft.description);
      setImpact(draft.impact);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <article className="panel submit-org">
      <div className="submit-org-header">
        <h2>
          Organization {position} of {count}
        </h2>
        {!contactComplete && <span className="badge warning">Contact info needed</span>}
      </div>

      <CopyField label="Organization Name" value={organization.name} />
      <CopyField label="Number of Hours Completed" value={String(hours)} />
      <CopyField
        label="Contact Information for Organization"
        value={contactBlock(organization)}
        multiline
      />
      {!contactComplete && (
        <p className="warning-box">
          The LHC asks for the contact's first and last name, the organization's mailing address,
          and an email or phone number. <Link to="/organizations">Add them on Organizations.</Link>
        </p>
      )}

      <label>
        Description of Work
        <span className="hint">
          Drafted from your session notes. Edit it, or jot a few bullet points and polish them.
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={3000}
        />
      </label>
      <div className="field-actions">
        <CopyButton label="Description of Work" value={description} />
      </div>
      <AiPolish
        kind="description"
        source={description}
        context={polishContext}
        onUse={setDescription}
      />

      <label>
        Impact
        <span className="hint">
          At least a paragraph of 3 to 5 sentences on how this work affected you. Rough notes are
          fine if you polish them.
        </span>
        <textarea
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          rows={5}
          maxLength={3000}
          placeholder="What did you see or learn? What surprised you? How does it connect to what you care about?"
        />
      </label>
      <div className="field-actions">
        <span className={`sentence-count${sentences >= 3 ? " ok" : ""}`}>{sentenceMessage}</span>
        <CopyButton label="Impact" value={impact} />
      </div>
      <AiPolish kind="impact" source={impact} context={polishContext} onUse={setImpact} />

      <div className="button-row">
        <button type="button" onClick={handleSave} disabled={status === "saving" || !dirty}>
          {status === "saving" ? "Saving..." : dirty ? "Save draft" : "Draft saved"}
        </button>
      </div>
      {status === "error" && (
        <p className="error">Could not save the draft. Check your connection and try again.</p>
      )}

      <p className="muted">
        "Do you have work for additional organizations to enter?" Answer{" "}
        <strong>{isLast ? "No" : "Yes"}</strong>
        {isLast ? "." : " and continue with the next organization."}
      </p>
    </article>
  );
}