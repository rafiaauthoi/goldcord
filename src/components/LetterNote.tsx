import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { formatHours } from "../lib/sessions";
import type { Session } from "../lib/sessions";

type LetterNoteProps = {
  session: Session | null;
  organizationName: string;
  color: string;
  year: string;
  onClose: () => void;
};

function longDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function LetterNote({ session, organizationName, color, year, onClose }: LetterNoteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (session && !dialog.open) dialog.showModal();
    if (!session && dialog.open) dialog.close();
  }, [session]);

  return (
    <dialog
      ref={dialogRef}
      className="letter"
      aria-labelledby="letter-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {session && (
        <div className="letter-envelope" style={{ "--envelope": color } as CSSProperties}>
          <span className="letter-flap" aria-hidden="true" />
          <article className="letter-paper">
            <header className="letter-head">
              <p className="letter-date">{longDate(session.date)}</p>
              <h2 id="letter-title">{organizationName}</h2>
              <p className="letter-hours num">{formatHours(session.hours)}</p>
            </header>
            <p className="letter-body">{session.activity || "No notes for this shift yet."}</p>
            {session.flags.length > 0 && (
              <p className="letter-flag">Marked to check before submitting</p>
            )}
            <div className="letter-actions">
              <Link className="button small" to={`/log?edit=${session.id}&year=${year}`}>
                Edit this shift
              </Link>
              <button type="button" className="secondary small" onClick={onClose}>
                Close
              </button>
            </div>
          </article>
        </div>
      )}
    </dialog>
  );
}