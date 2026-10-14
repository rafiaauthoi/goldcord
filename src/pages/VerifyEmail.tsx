import { useState } from "react";
import { Navigate } from "react-router-dom";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { authErrorMessage } from "../lib/authErrors";
import { AUTH_EMAIL_SENDER } from "../lib/authEmail";

export default function VerifyEmail() {
  const { user, emailVerified, loading, refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (emailVerified) return <Navigate to="/" replace />;

  async function handleCheck() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const verified = await refreshUser();
      if (!verified) {
        setNotice("Not verified yet. Click the link in the email, then try again.");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    const current = auth.currentUser;
    if (!current) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await sendEmailVerification(current);
      setNotice(`Verification email sent from ${AUTH_EMAIL_SENDER}. Check your inbox and junk folder.`);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <div className="card">
        <h1>Verify your email</h1>
        <p className="subtitle">
          We sent a link to <strong>{user.email}</strong>. Click it, then come back here.
        </p>
        <p className="sender-note">
          It comes from <strong>{AUTH_EMAIL_SENDER}</strong>. honors-hours was GoldCord's original name, so
          that address is legit. Check your junk folder if you do not see it.
        </p>
        <div className="stack">
          <button type="button" onClick={handleCheck} disabled={busy}>
            I have verified my email
          </button>
          <button type="button" className="secondary" onClick={handleResend} disabled={busy}>
            Resend email
          </button>
          {notice && <p className="notice">{notice}</p>}
          {error && <p className="error">{error}</p>}
        </div>
        <p className="footer-text">
          <button type="button" className="link" onClick={() => signOut(auth)}>
            Use a different account
          </button>
        </p>
      </div>
    </div>
  );
}