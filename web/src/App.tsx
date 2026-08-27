import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Scanner from "@/pages/Scanner";
import Solver from "@/pages/Solver";
import Guide from "@/pages/Guide";
import ProMode from "@/pages/ProMode";
import Themes from "@/pages/Themes";
import SettingsPage from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      {/* Pre-auth */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Authed app frame */}
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="scan" element={<Scanner />} />
        <Route path="solver" element={<Solver />} />
        <Route path="guide" element={<Guide />} />
        <Route path="pro" element={<ProMode />} />
        <Route path="themes" element={<Themes />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
