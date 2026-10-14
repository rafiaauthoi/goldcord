import { Link } from "react-router-dom";

const REPO_URL = "https://github.com/rafiaauthoi/goldcord";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Legal and project" className="site-footer-links">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/security">Security</Link>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </nav>
      <p>
        An independent student project. Not affiliated with or endorsed by Western Michigan University
        or the Lee Honors College.
      </p>
      <p>© 2026 Rafia Authoi</p>
    </footer>
  );
}