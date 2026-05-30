import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pos-app-shell">
      <Sidebar />
      <div className="pos-app-shell__main">{children}</div>
    </div>
  );
}
