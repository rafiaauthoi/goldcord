import { useState } from "react";
import { polishText } from "../lib/ai";
import type { PolishContext, PolishKind } from "../lib/ai";

type AiPolishProps = {
  kind: PolishKind;
  source: string;
  context: PolishContext;
  onUse: (text: string) => void;
};

export default function AiPolish({ kind, source, context, onUse }: AiPolishProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  async function handlePolish() {
    setError("");
    const wordCount = source.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 4) {
      setError("Write a few words or bullet points first, then polish.");
      return;
    }
    setLoading(true);
    try {
      setSuggestion(await polishText(kind, source, context));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not polish right now. Try again in a minute."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleUse() {
    onUse(suggestion);
    setSuggestion("");
  }

  return (
    <div className="ai-polish">
      <div className="ai-polish-row">
        <button type="button" className="secondary small" onClick={handlePolish} disabled={loading}>
          {loading ? "Polishing..." : suggestion ? "Try again" : "Polish with AI"}
        </button>
        <span className="hint">
          Sends this box to Google Gemini. Leave out names and private details of the people you
          served.
        </span>
      </div>
      {error && <p className="error">{error}</p>}
      {suggestion && (
        <div
          className="ai-suggestion"
          role="region"
          aria-label={kind === "impact" ? "Suggested impact reflection" : "Suggested description"}
        >
          <p className="ai-suggestion-label">
            Suggestion. Make sure every detail is true before you use it.
          </p>
          <p className="ai-suggestion-text">{suggestion}</p>
          <div className="button-row">
            <button type="button" className="small" onClick={handleUse}>
              Use this
            </button>
            <button type="button" className="secondary small" onClick={() => setSuggestion("")}>
              Keep mine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}