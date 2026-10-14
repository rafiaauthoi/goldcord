import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useAuth } from "../context/AuthContext";
import { deleteAccountAndData } from "../lib/account";
import PasswordInput from "./PasswordInput";

const CONFIRM_WORD = "DELETE";

function deleteErrorMessage(err: unknown) {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      return "That password is not right. Nothing was deleted.";
    }
    if (err.code === "auth/too-many-requests") {
      return "Too many attempts. Wait a few minutes and try again. Nothing was deleted.";
    }
    if (err.code === "auth/network-request-failed") {
      return "Could not reach the server. Check your connection and try again.";
    }
  }
  return "Something went wrong partway through. Sign in again and retry, and anything left will be removed.";
}

export default function DeleteAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError("");
    if (confirmText !== CONFIRM_WORD) {
      setError(`Type ${CONFIRM_WORD} in capital letters to confirm.`);
      return;
    }
    setDeleting(true);
    try {
      await deleteAccountAndData(user, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(deleteErrorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <section className="panel danger-zone" aria-labelledby="delete-title">
      <h2 id="delete-title">Delete your account</h2>
      <p>
        This permanently removes your profile, organizations, sessions, drafts, stars, and your sign-in.
        It cannot be undone. Copy anything you still need for the LHC form first.
      </p>
      {!open ? (
        <button type="button" className="danger" onClick={() => setOpen(true)}>
          Delete my account and data
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Type {CONFIRM_WORD} to confirm
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <label>
            Your password
            <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="button-row">
            <button type="submit" className="danger" disabled={deleting}>
              {deleting ? "Deleting..." : "Permanently delete"}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={deleting}
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setPassword("");
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}