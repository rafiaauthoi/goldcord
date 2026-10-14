import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import BrandMark from "./BrandMark";
import SiteFooter from "./SiteFooter";
import StorageNotice from "./StorageNotice";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand" aria-label="GoldCord home">
          <BrandMark />
          GoldCord
        </Link>
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/log">Log hours</NavLink>
          <NavLink to="/scrapbook">Scrapbook</NavLink>
          <NavLink to="/organizations">Organizations</NavLink>
          <NavLink to="/submit">Submit</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <button type="button" className="secondary small" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </header>
      <main className="app-main">
        <Suspense fallback={<p className="muted">Loading...</p>}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
      <StorageNotice />
    </div>
  );
}