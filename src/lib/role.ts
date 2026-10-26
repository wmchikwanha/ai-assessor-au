import { useEffect, useState } from "react";

// Test-environment role selection: anyone can act as any role so the
// full journey can be exercised end to end. This is a UI lock, not security.
export type Role = "coordinator" | "reviewer" | "admin";
export const ROLES: { key: Role; label: string }[] = [
  { key: "coordinator", label: "Unit coordinator" },
  { key: "reviewer", label: "Governance reviewer" },
  { key: "admin", label: "Administrator" },
];
const KEY = "assayer-role";
const NAME_KEY = "assayer-reviewer-name";
const EVT = "assayer-role-change";

export function canReview(role: Role) {
  return role === "reviewer" || role === "admin";
}

export function useRole() {
  const [role, setRoleState] = useState<Role>("coordinator");
  const [name, setNameState] = useState("");
  useEffect(() => {
    const read = () => {
      const r = localStorage.getItem(KEY) as Role | null;
      setRoleState(r && ROLES.some((x) => x.key === r) ? r : "coordinator");
      setNameState(localStorage.getItem(NAME_KEY) ?? "");
    };
    read();
    window.addEventListener(EVT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return {
    role,
    name,
    setRole: (r: Role) => {
      localStorage.setItem(KEY, r);
      window.dispatchEvent(new Event(EVT));
    },
    setName: (n: string) => {
      localStorage.setItem(NAME_KEY, n);
      window.dispatchEvent(new Event(EVT));
    },
  };
}
