import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_sandbox")({
  ssr: false,
  component: () => <Outlet />,
});