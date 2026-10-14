import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../lib/firebase";
import { authErrorMessage } from "../lib/authErrors";
import { AUTH_EMAIL_SENDER } from "../lib/authEmail";
import PasswordInput from "./PasswordInput";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      navigate(credential.user.emailVerified ? "/" : "/verify", { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setError("");
    setNotice("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Enter your WMU email above first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err) {
      if (err instanceof FirebaseError && err.code !== "auth/user-not-found") {
        setError(authErrorMessage(err));
        return;
      }
    }
    setNotice(`If an account exists for that email, a reset link is on its way from ${AUTH_EMAIL_SENDER}.`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        WMU email
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="you@wmich.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Password
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
      </label>
      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>
      <button type="button" className="link" onClick={handleReset}>
        Forgot password?
      </button>
    </form>
  );
}