import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MiniBar } from "./MiniBar";
import { BottomNav } from "./BottomNav";

/**
 * Authed app frame. Persistent left rail + top bar + scrollable content
 * + persistent bottom mini-bar + mobile bottom nav.
 */
export function AppShell() {
  return (
    <div className="flex h-full bg-bg-default text-text-primary">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        <MiniBar />
      </div>
      <BottomNav />
    </div>
  );
}
