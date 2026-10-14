import type { KeyboardEvent } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export type AuthMode = "signup" | "signin";

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: "signup", label: "Create account" },
  { mode: "signin", label: "Sign in" },
];

type AuthPanelProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
};

export default function AuthPanel({ mode, onModeChange }: AuthPanelProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = mode === "signup" ? "signin" : "signup";
    onModeChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div className="auth-panel" id="start">
      <div className="auth-tabs" role="tablist" aria-label="Your account" onKeyDown={handleKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            id={`tab-${tab.mode}`}
            type="button"
            role="tab"
            aria-selected={mode === tab.mode}
            aria-controls="auth-pane"
            tabIndex={mode === tab.mode ? 0 : -1}
            className={mode === tab.mode ? "is-active" : ""}
            onClick={() => onModeChange(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id="auth-pane" role="tabpanel" aria-labelledby={`tab-${mode}`} className="auth-pane">
        {mode === "signup" ? <SignupForm /> : <LoginForm />}
      </div>
    </div>
  );
}