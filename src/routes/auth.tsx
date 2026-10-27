import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Enter the research sandbox — Assayer" },
      { name: "description", content: "Open synthetic academic evaluation without sign-up or verification." },
      { property: "og:title", content: "Enter the research sandbox — Assayer" },
      { property: "og:description", content: "Test Assayer without an account." },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/dashboard", replace: true }); },
});
