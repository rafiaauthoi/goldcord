import { useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "goldcord-storage-notice";

function alreadyDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "seen";
  } catch {
    return false;
  }
}

export default function StorageNotice() {
  const [visible, setVisible] = useState(() => !alreadyDismissed());

  if (!visible) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "seen");
    } catch {
      setVisible(false);
      return;
    }
    setVisible(false);
  }

  return (
    <aside className="storage-notice" aria-label="Browser storage notice">
      <p>
        GoldCord only uses essential browser storage: to keep you signed in and to block bots. No ads, no
        analytics, no tracking. <Link to="/privacy#storage">See what is stored</Link>.
      </p>
      <button type="button" className="small" onClick={dismiss}>
        Got it
      </button>
    </aside>
  );
}