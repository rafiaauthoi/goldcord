import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "./AppLayout";
import Landing from "../pages/Landing";

export default function HomeGate() {
  const { user, emailVerified, loading } = useAuth();

  if (loading) return <div className="center">Loading...</div>;
  if (!user) return <Landing />;
  if (!emailVerified) return <Navigate to="/verify" replace />;
  return <AppLayout />;
}