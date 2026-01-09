import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell relative min-h-screen text-slate-100">
      <div className="auth-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">{children}</div>
    </div>
  );
}
