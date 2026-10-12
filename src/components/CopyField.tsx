import { useState } from "react";

type CopyButtonProps = {
  label: string;
  value: string;
};

export function CopyButton({ label, value }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <>
      <button
        type="button"
        className="secondary small"
        onClick={handleCopy}
        disabled={!value.trim()}
        aria-label={`Copy ${label}`}
      >
        {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">
        {status === "copied" ? `${label} copied` : ""}
      </span>
    </>
  );
}

type CopyFieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
};

export default function CopyField({ label, value, multiline = false }: CopyFieldProps) {
  return (
    <div className="copy-field">
      <div className="copy-field-label">{label}</div>
      <div className="copy-field-row">
        <div className={`copy-field-value${multiline ? " multiline" : ""}`}>
          {value || <span className="muted">Missing</span>}
        </div>
        <CopyButton label={label} value={value} />
      </div>
    </div>
  );
}