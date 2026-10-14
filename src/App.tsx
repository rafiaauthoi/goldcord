import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import HomeGate from "./components/HomeGate";
import AppLayout from "./components/AppLayout";
import Landing from "./pages/Landing";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import LogHours from "./pages/LogHours";
import Organizations from "./pages/Organizations";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Scrapbook from "./pages/Scrapbook";
import YearInReview from "./pages/YearInReview";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Landing key="signin" initialMode="signin" /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Landing key="signup" initialMode="signup" /></GuestRoute>} />
      <Route path="/verify" element={<VerifyEmail />} />
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
  );
}