import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MiniBar } from "./MiniBar";

/**
 * Authed app frame (Section 6). Persistent left rail + top bar + scrollable content
 * + persistent bottom mini-bar. All four share the single bg/default token — only
 * cards/buttons/inputs get elevated surfaces (Section 2 single-background rule).
 */
export function AppShell() {
  return (
    <div className="flex h-full bg-bg-default text-text-primary">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <MiniBar />
      </div>
    </div>
  );
}
