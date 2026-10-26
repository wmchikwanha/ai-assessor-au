import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES, canReview, useRole, type Role } from "@/lib/role";

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="uppercase tracking-[0.12em]">Acting as</span>
      <select
        aria-label="Acting role"
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="rounded-sm border bg-background px-2 py-1 text-sm text-foreground"
      >
        {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
      </select>
    </label>
  );
}

export function ReviewerGate({ children }: { children: ReactNode }) {
  const { role, setRole } = useRole();
  if (canReview(role)) return <>{children}</>;
  return (
    <div className="mx-auto max-w-xl rounded-md border border-seal/40 bg-paper p-8 text-center">
      <Lock className="mx-auto h-8 w-8 text-seal" aria-hidden />
      <h1 className="mt-4 text-3xl">Reviewers only</h1>
      <p className="mt-2 text-muted-foreground">
        The governance review portal is locked to the Governance reviewer and Administrator roles.
        In this test environment you can switch role yourself to try the review journey.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => setRole("reviewer")}>Act as Governance reviewer</Button>
        <Button asChild variant="outline"><Link to="/dashboard">Back to workbench</Link></Button>
      </div>
    </div>
  );
}

export const DECISION_LABEL: Record<string, string> = { approved: "Approved", returned: "Returned for revision" };
