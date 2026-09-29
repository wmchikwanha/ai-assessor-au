import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function AssayStamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden>
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.5 2" />
      <path d="M13 26 L20 12 L27 26 M16 21 H24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function Wordmark({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-primary">
      <AssayStamp className="text-gold" />
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Assayer</span>
    </Link>
  );
}

const STEPS = ["Capture", "Privacy gate", "Assay", "Results", "Certificate"];

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs font-medium uppercase tracking-[0.12em]">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[11px]",
              i < current && "border-primary bg-primary text-primary-foreground",
              i === current && "border-gold bg-gold text-gold-foreground",
              i > current && "border-border text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
          <span className={cn("mr-3", i === current ? "text-foreground" : "text-muted-foreground")}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t no-print">
      <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">Developed by Walter C. Copyright 2026.</div>
    </footer>
  );
}

export function AppShell({ children, step }: { children: ReactNode; step?: number }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="no-print border-b bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Wordmark to="/dashboard" />
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Dashboard
            </Link>
            <Link to="/assessments/new" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              New assay
            </Link>
            <Link to="/guide" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Guide
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </nav>
        </div>
        {step !== undefined && (
          <div className="mx-auto max-w-6xl px-6 pb-3">
            <Stepper current={step} />
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-foreground/80">{children}</p>;
}
