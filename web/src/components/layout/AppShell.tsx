import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

/**
 * Authed app frame. Persistent left rail + top bar + scrollable content + mobile bottom nav.
 */
export function AppShell() {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent text-text-primary md:h-full md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto pb-28 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
