import { NavLink, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">Honors Hours</span>
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/log">Log Hours</NavLink>
          <NavLink to="/organizations">Organizations</NavLink>
          <NavLink to="/submit">Submit</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <button type="button" className="secondary small" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}