import { useEffect, useRef } from "react";
import { formatHours } from "../lib/sessions";
import type { Session } from "../lib/sessions";
import { shortDate } from "../lib/review";

export type CrumpledNoteContent = {
  title: string;
  kicker: string;
  sessions: Session[];
};

type CrumpledNoteProps = {
  note: CrumpledNoteContent | null;
  onClose: () => void;
};

export default function CrumpledNote({ note, onClose }: CrumpledNoteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (note && !dialog.open) dialog.showModal();
    if (!note && dialog.open) dialog.close();
  }, [note]);

  return (
    <dialog
      ref={dialogRef}
      className="crumple"
      aria-labelledby="crumple-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {note && (
        <article className="crumple-paper">
          <div className="crumple-inner">
            <header className="crumple-head">
              <p className="crumple-kicker">{note.kicker}</p>
              <h2 id="crumple-title">{note.title}</h2>
            </header>
            <ul className="crumple-list">
              {note.sessions.map((session) => (
                <li key={session.id}>
                  <p className="crumple-meta">
                    {shortDate(session.date)} · {formatHours(session.hours)}
                  </p>
                  <p className="crumple-text">{session.activity || "No notes for this shift."}</p>
                </li>
              ))}
            </ul>
            <button type="button" className="secondary small" onClick={onClose}>
              Close
            </button>
          </div>
        </article>
      )}
    </dialog>
  );
}