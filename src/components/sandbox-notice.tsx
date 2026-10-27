export function SandboxNotice() {
  return (
    <aside aria-label="Research sandbox notice" className="border-y border-gold/40 bg-gold/10">
      <div className="mx-auto max-w-6xl px-6 py-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Open research sandbox · No sign-up or verification.</strong>{" "}
        Use synthetic information only. Assessments and review notes are saved and shared with all visitors.
        Roles are simulated; no real name or institutional email is needed.
      </div>
    </aside>
  );
}