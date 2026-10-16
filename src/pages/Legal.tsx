import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import SiteFooter from "../components/SiteFooter";
import { AUTH_EMAIL_SENDER } from "../lib/authEmail";

const UPDATED = "October 16, 2026";
const REPO_URL = "https://github.com/rafiaauthoi/goldcord";
const REPORT_URL = `${REPO_URL}/security/advisories/new`;

function LegalShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = `${title} | GoldCord`;
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    return () => {
      document.title = "GoldCord";
    };
  }, [title, hash]);

  return (
    <div className="legal">
      <header className="legal-bar">
        <Link to="/" className="brand legal-brand" aria-label="GoldCord home">
          <BrandMark size={28} />
          GoldCord
        </Link>
        <nav className="legal-nav" aria-label="Legal pages">
          <NavLink to="/privacy">Privacy</NavLink>
          <NavLink to="/terms">Terms</NavLink>
          <NavLink to="/security">Security</NavLink>
        </nav>
      </header>
      <main className="legal-main">
        <article className="legal-article">
          <h1>{title}</h1>
          <p className="legal-updated">Last updated {UPDATED}</p>
          <p className="legal-intro">{intro}</p>
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy"
      intro="GoldCord stores only what it needs to track your service hours and fill in the LHC Community Service Log. It does not sell, share, or advertise with your data."
    >
      <h2>What GoldCord stores</h2>
      <div className="legal-table" role="region" aria-label="Data GoldCord stores" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Why</th>
              <th scope="col">Where</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>WMU email and password</td>
              <td>Signing in. Passwords are hashed by Firebase and never visible to the app or its developer.</td>
              <td>Firebase Authentication</td>
            </tr>
            <tr>
              <td>Name, preferred name, joined term, yearly requirement</td>
              <td>The top of the LHC form and your hour goal</td>
              <td>Cloud Firestore</td>
            </tr>
            <tr>
              <td>Organizations and their contact details</td>
              <td>The organization section of the LHC form</td>
              <td>Cloud Firestore</td>
            </tr>
            <tr>
              <td>Sessions: date, hours, notes, eligibility notes, stars</td>
              <td>Your progress, scrapbook, and year in review</td>
              <td>Cloud Firestore</td>
            </tr>
            <tr>
              <td>Description and reflection drafts</td>
              <td>Saving your work between visits</td>
              <td>Cloud Firestore</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Organization contact details are information about other people. Only enter what the LHC form
        asks for.
      </p>

      <h2>What GoldCord does not collect</h2>
      <ul>
        <li>Your WIN or any other WMU ID number</li>
        <li>Your location</li>
        <li>Analytics, advertising identifiers, or behavioral tracking</li>
      </ul>

      <h2>Who processes your data</h2>
      <ul>
        <li>
          <strong>Google Firebase</strong> (Authentication, Firestore, App Check) stores your account and
          app data.
        </li>
        <li>
          <strong>Google reCAPTCHA</strong>, through Firebase App Check, receives browser and device
          signals to tell people apart from bots.
        </li>
        <li>
          <strong>Google Gemini</strong>, through Firebase AI Logic, receives only the text you choose
          to polish, plus the organization name (and, for descriptions, your hours and session count).
          Nothing is sent
          until you click the polish button. On free tiers, Google may use that text to improve its
          products, so leave out names or private details of the people you served.
        </li>
        <li>
          <strong>Vercel</strong> hosts the site and keeps standard request logs, such as IP address and
          browser type.
        </li>
      </ul>

      <h2 id="storage">Cookies and browser storage</h2>
      <ul>
        <li>GoldCord does not set advertising or analytics cookies.</li>
        <li>Firebase keeps you signed in using your browser's IndexedDB storage.</li>
        <li>
          Google reCAPTCHA may set cookies and read browser signals for bot protection, under{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Google's Privacy Policy
          </a>
          .
        </li>
        <li>
          GoldCord saves one small local setting so the storage notice stays closed after you dismiss
          it.
        </li>
      </ul>
      <p>
        All of this is essential to signing in and keeping the service safe, so there is nothing to
        opt out of. If analytics are ever added, you will be asked first.
      </p>

      <h2>Who can see your data</h2>
      <p>
        Only you. Database rules block every other account from reading or changing your records. The
        developer has administrative access to the Firebase project, as with any hosted app, and does
        not view, sell, or share student data.
      </p>

      <h2>Deleting your data</h2>
      <p>
        You can delete your account at any time from{" "}
        <Link to="/profile">Profile, under Delete your account</Link>. That permanently removes your
        profile, organizations, sessions, drafts, stars, and sign-in. Request logs held by Vercel and
        Google expire on their own schedules.
      </p>

      <h2>Questions</h2>
      <p>
        Open an issue on{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        . For anything sensitive, use the private report described on the{" "}
        <Link to="/security">Security page</Link>.
      </p>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell
      title="Terms of use"
      intro="GoldCord is a free, open-source tool made by a WMU honors student. By using it, you agree to the following."
    >
      <h2>An unofficial tool</h2>
      <p>
        GoldCord is not a service of Western Michigan University or the Lee Honors College, and it is not
        affiliated with or endorsed by either. It does not submit anything on your behalf. You still
        fill out and submit the LHC Community Service Log yourself.
      </p>

      <h2>The LHC decides what counts</h2>
      <p>
        Logging hours here does not mean they will be approved. Eligibility notes, totals, and readiness
        checks are guides, not rulings. Ask an LHC advisor if you are unsure whether service counts.
      </p>

      <h2>You are responsible for accuracy</h2>
      <p>
        You certify your own hours on the official form. Only log service you actually completed, and
        check every detail before you submit.
      </p>

      <h2>Review AI suggestions</h2>
      <p>
        The optional writing help can be wrong. Read every suggestion before using it, especially in
        your reflection, and keep only what is true to your experience.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Use your own @wmich.edu account only.</li>
        <li>Do not try to access other people's data or bypass security controls.</li>
        <li>Do not overload the service or use it to store unrelated content.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        GoldCord is provided as is, without guarantees of availability or accuracy. Keep your own record
        of anything important. The source code is available under the{" "}
        <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
          MIT License
        </a>
        .
      </p>

      <h2>Changes</h2>
      <p>
        These terms and the app may change. The date at the top of this page shows the latest version,
        and every change is visible in the project history on GitHub.
      </p>
    </LegalShell>
  );
}

export function SecurityPage() {
  return (
    <LegalShell
      title="Security"
      intro="GoldCord has no custom server. Every protection below is enforced by Google's infrastructure, so it holds even if someone talks to the database directly with the public app config."
    >
      <h2>Accounts</h2>
      <ul>
        <li>Only verified @wmich.edu email addresses can read or write data.</li>
        <li>
          Passwords must meet a strength policy, are hashed by Firebase Authentication, and are never
          visible to the app.
        </li>
        <li>Sign-in errors do not reveal whether an email has an account.</li>
        <li>Deleting your account asks for your password again before anything is removed.</li>
        <li>
          Verification and password reset emails only come from <strong>{AUTH_EMAIL_SENDER}</strong>,
          named after GoldCord's original project name, and their links go to honors-hours.firebaseapp.com.
          Ignore emails about your GoldCord account from any other address.
        </li>
      </ul>

      <h2>Your records</h2>
      <ul>
        <li>Firestore security rules let each account read and write only its own records.</li>
        <li>
          The rules check every write: allowed fields only, required fields present, sizes capped,
          dates and hours in valid ranges, timestamps set by the server, and sessions tied to an
          organization you own.
        </li>
      </ul>

      <h2>Bots and abuse</h2>
      <ul>
        <li>Firebase App Check with reCAPTCHA confirms requests come from the real GoldCord site.</li>
        <li>
          The database and the AI writing helper both reject any request that does not pass App Check, so
          scripts cannot reach your data even with a valid account.
        </li>
      </ul>

      <h2>The site itself</h2>
      <ul>
        <li>
          A strict Content Security Policy only allows scripts from GoldCord and Google reCAPTCHA, which
          blocks injected scripts from running.
        </li>
        <li>The site cannot be framed by other sites, which prevents clickjacking.</li>
        <li>Browsers are told to always use HTTPS.</li>
        <li>Camera, microphone, location, and payment features are switched off.</li>
      </ul>

      <h2>The AI writing helper</h2>
      <ul>
        <li>Your notes are wrapped and labeled as data, and the model is told to ignore instructions inside them.</li>
        <li>Input length is capped, and requests time out instead of hanging.</li>
        <li>Nothing the model writes is saved until you choose Use this.</li>
      </ul>

      <h2>The code</h2>
      <ul>
        <li>The full source is public on GitHub.</li>
        <li>CodeQL scans every push, and Dependabot watches dependencies for known vulnerabilities.</li>
        <li>Secret scanning and push protection block committed credentials.</li>
        <li>Fonts are self-hosted, so no third-party font requests reveal your visits.</li>
      </ul>

      <h2>Report a vulnerability</h2>
      <p>
        Please do not open a public issue. Use{" "}
        <a href={REPORT_URL} target="_blank" rel="noreferrer">
          GitHub's private vulnerability report
        </a>{" "}
        instead. Include what you found and how to reproduce it. Please only test against your own
        account, and do not access or change anyone else's data.
      </p>
    </LegalShell>
  );
}