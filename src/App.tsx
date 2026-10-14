import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import HomeGate from "./components/HomeGate";
import AppLayout from "./components/AppLayout";
import Landing from "./pages/Landing";

const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LogHours = lazy(() => import("./pages/LogHours"));
const Organizations = lazy(() => import("./pages/Organizations"));
const Submit = lazy(() => import("./pages/Submit"));
const Profile = lazy(() => import("./pages/Profile"));
const Scrapbook = lazy(() => import("./pages/Scrapbook"));
const YearInReview = lazy(() => import("./pages/YearInReview"));
const PrivacyPage = lazy(() => import("./pages/Legal").then((module) => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/Legal").then((module) => ({ default: module.TermsPage })));
const SecurityPage = lazy(() => import("./pages/Legal").then((module) => ({ default: module.SecurityPage })));

export default function App() {
  return (
    <Suspense fallback={<div className="center">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<GuestRoute><Landing key="signin" initialMode="signin" /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Landing key="signup" initialMode="signup" /></GuestRoute>} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/" element={<HomeGate />}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/log" element={<LogHours />} />
          <Route path="/scrapbook" element={<Scrapbook />} />
          <Route path="/scrapbook/review" element={<YearInReview />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}