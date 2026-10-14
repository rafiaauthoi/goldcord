import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ReactNode, RefObject } from "react";
import AuthPanel from "../components/AuthPanel";
import type { AuthMode } from "../components/AuthPanel";
import BrandMark from "../components/BrandMark";
import Cord from "../components/Cord";
import ScrapbookBits from "../components/ScrapbookBits";
import ScrapbookPile from "../components/ScrapbookPile";
import StorageNotice from "../components/StorageNotice";
import { AUTH_EMAIL_SENDER } from "../lib/authEmail";

const REPO_URL = "https://github.com/rafiaauthoi/goldcord";

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Is GoldCord run by the Lee Honors College?",
    a: "No. It is an independent project built by a WMU honors student and is not affiliated with or endorsed by Western Michigan University or the Lee Honors College. When in doubt about a rule, ask LHC.",
  },
  {
    q: "How many hours do I need?",
    a: "Twenty each academic year. It drops to ten if you graduate in fall, joined LHC in spring, or study abroad. Set yours on your profile and the cord adjusts.",
  },
  {
    q: "When does the year start over?",
    a: "Hours count from July 1 to June 30, and June 30 is the deadline to submit. GoldCord sorts every session into the right year by its date.",
  },
  {
    q: "Does it submit the form for me?",
    a: "No. You still submit the LHC Community Service Log yourself. GoldCord lays out every field in the same order as the form, with a copy button beside each one.",
  },
  {
    q: "Who can see my hours?",
    a: "Only you. Accounts need a verified @wmich.edu email, and the database rules only let you read and write your own records.",
  },
  {
    q: "Why do my sign-in emails say honors-hours?",
    a: `GoldCord started out as Honors Hours, and Firebase keeps a project's original name forever. Verification and password reset emails come from ${AUTH_EMAIL_SENDER}, and that address is legit. Emails about your account from anywhere else are not from GoldCord.`,
  },
  {
    q: "How does the writing help work?",
    a: "It is optional. Type a few rough notes and GoldCord drafts a short description with Google's Gemini model. Nothing is sent until you ask, and you pick Use this or Keep mine.",
  },
  {
    q: "What does it cost?",
    a: (
      <>
        Nothing. GoldCord is free and open source under the MIT License.{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Read the code on GitHub
        </a>
        .
      </>
    ),
  },
];

function useReveal(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    root.classList.add("lp-motion");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

function SessionCardTop() {
  return (
    <div className="ui-card-top">
      <span className="ui-org">Men of Letters Bunker</span>
      <span className="ui-meta num">Sep 14 · 4.5 hrs</span>
    </div>
  );
}

export default function Landing({ initialMode = "signup" }: { initialMode?: AuthMode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [focusRequest, setFocusRequest] = useState(0);

  useReveal(rootRef);

  useEffect(() => {
    if (focusRequest === 0) return;
    const start = document.getElementById("start");
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    start?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
    document.getElementById("auth-email")?.focus({ preventScroll: true });
  }, [focusRequest]);

  function openAccount(next: AuthMode) {
    setMode(next);
    setFocusRequest((count) => count + 1);
  }

  return (
    <div className="lp" ref={rootRef}>
      <header className="lp-bar">
        <a href="#top" className="brand lp-brand" aria-label="GoldCord home">
          <BrandMark size={30} />
          GoldCord
        </a>
        <nav className="lp-links" aria-label="Page">
          <a href="#how">How it works</a>
          <a href="#faq">FAQs</a>
          <button type="button" className="small" onClick={() => openAccount("signin")}>
            Sign in
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-hero-copy">
            <h1 id="hero-title" className="lp-display">
              Every hour, counted.
            </h1>
            <p className="lp-lede">
              GoldCord tracks your Lee Honors community service toward the yearly 20 hours, then
              lays it all out for the LHC Community Service Log.
            </p>
            <AuthPanel mode={mode} onModeChange={setMode} />
          </div>

          <div className="lp-stage" role="group" aria-label="Try it with sample sessions">
            <ScrapbookBits />
            <div className="lp-stage-inner">
              <ScrapbookPile onStartReal={() => openAccount("signup")} />
            </div>
          </div>
        </section>

        <section className="lp-how" id="how" aria-labelledby="how-title">
          <div className="lp-field lp-field-1">
            <div className="lp-field-head" data-reveal>
              <h2 id="how-title" className="lp-clause lp-clause-strong">
                From shift to form
              </h2>
            </div>
            <div className="ui-card" data-ui data-reveal role="img" aria-label="A new session card with rough notes">
              <SessionCardTop />
              <p className="ui-label">Notes</p>
              <p className="ui-notes">sorted the archive, labeled boxes, logged the cursed stuff</p>
            </div>
            <p className="lp-clause" data-reveal>
              First, log the shift while you remember it.
            </p>
          </div>

          <div className="lp-field lp-field-2">
            <div className="ui-card" data-ui data-reveal role="img" aria-label="The same session counted toward 12.5 of 20 hours">
              <SessionCardTop />
              <p className="ui-progress num">
                <strong>12.5</strong> of 20 hours
              </p>
              <div aria-hidden="true">
                <Cord value={12.5} max={20} label="Example progress" />
              </div>
              <p className="ui-totals">
                <span>Men of Letters Bunker</span>
                <span className="num">9.5 hrs</span>
              </p>
              <p className="ui-totals">
                <span>Hogsmeade</span>
                <span className="num">3 hrs</span>
              </p>
            </div>
            <p className="lp-clause" data-reveal>
              Then it counts toward your cord.
            </p>
          </div>

          <div className="lp-field lp-field-3">
            <div className="ui-card" data-ui data-reveal role="img" aria-label="A polished description with Use this and Keep mine buttons">
              <SessionCardTop />
              <p className="ui-label">Suggested description</p>
              <p className="ui-polished">
                Sorted and labeled archive boxes, then logged each item in a shared inventory.
              </p>
              <div className="ui-actions" aria-hidden="true">
                <span className="ui-btn">Use this</span>
                <span className="ui-btn ui-btn-quiet">Keep mine</span>
              </div>
            </div>
            <p className="lp-clause" data-reveal>
              Polish the words, if you want help.
            </p>
          </div>

          <div className="lp-field lp-field-4">
            <div className="ui-card" data-ui data-reveal role="img" aria-label="Form fields with copy buttons, one already copied">
              <div className="ui-row">
                <span>
                  <span className="ui-label">Organization</span>
                  Men of Letters Bunker
                </span>
                <span className="ui-btn ui-btn-quiet">Copy</span>
              </div>
              <div className="ui-row">
                <span>
                  <span className="ui-label">Total hours</span>
                  <span className="num">4.5</span>
                </span>
                <span className="ui-btn ui-btn-done">Copied</span>
              </div>
              <div className="ui-row">
                <span>
                  <span className="ui-label">Description</span>
                  Sorted and labeled archive boxes...
                </span>
                <span className="ui-btn ui-btn-quiet">Copy</span>
              </div>
            </div>
            <p className="lp-clause" data-reveal>
              Last, copy each field into the LHC form.
            </p>
          </div>
        </section>

        <section className="lp-what" aria-labelledby="what-title">
          <h2 id="what-title" className="sr-only">
            What it does
          </h2>
          <p className="lp-statement" data-reveal>
            Log a shift{" "}
            <span className="slot slot-chip" aria-hidden="true">
              4.5 hrs
            </span>
            , watch your cord{" "}
            <span className="slot slot-braid" aria-hidden="true" />
            {" "}fill, then copy every field{" "}
            <span className="slot slot-copy" aria-hidden="true">
              Copy
            </span>
            {" "}straight into the LHC form.
          </p>
          <div className="lp-what-side" data-reveal>
            <p>
              Free for every Lee Honors student with a @wmich.edu email. Your hours stay private to
              your account.
            </p>
            <button type="button" onClick={() => openAccount("signup")}>
              Create your account
            </button>
          </div>
        </section>

        <div className="lp-braid" aria-hidden="true" />

        <section className="lp-faq" id="faq" aria-labelledby="faq-title">
          <h2 id="faq-title" className="lp-section-title" data-reveal>
            FAQs
          </h2>
          <div className="lp-faq-list">
            {FAQS.map((item, index) => (
              <details key={item.q} name="faq" className="lp-tile" data-reveal open={index === 0}>
                <summary>
                  <span>{item.q}</span>
                  <span className="lp-plus" aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-mark" data-reveal>
          <svg className="lp-mark-knot" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <circle cx="16" cy="11" r="7.5" fill="none" stroke="var(--gold)" strokeWidth="3.5" />
            <rect x="12.5" y="17" width="7" height="4" rx="1.5" fill="var(--gold-shade)" />
            <path
              d="M13.5 21 L12 30 M16 21 L16 30.5 M18.5 21 L20 30"
              stroke="var(--gold)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="lp-mark-word">GoldCord</p>
        </div>

        <div className="lp-footer-grid">
          <nav aria-label="Use GoldCord" className="lp-footer-col">
            <button type="button" className="link" onClick={() => openAccount("signup")}>
              Create account
            </button>
            <button type="button" className="link" onClick={() => openAccount("signin")}>
              Sign in
            </button>
            <a href="#how">How it works</a>
            <a href="#faq">FAQs</a>
          </nav>
          <nav aria-label="Project" className="lp-footer-col">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
            <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
              MIT License
            </a>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/security">Security</Link>
          </nav>
          <div className="lp-footer-about">
            <p>Built by Rafia Authoi, an honors student at Western Michigan University.</p>
            <p>
              An independent student project. Not affiliated with or endorsed by Western Michigan
              University or the Lee Honors College.
            </p>
          </div>
        </div>

        <div className="lp-footer-last">
          <p>© 2026 Rafia Authoi</p>
          <a href="#top" className="lp-top">
            Back to top
          </a>
        </div>
      </footer>
      <StorageNotice />
    </div>
  );
}