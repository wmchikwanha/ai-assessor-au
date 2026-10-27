// The single AI door: { task, payload }. Every model call in the app goes through here.
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import { sandboxDatabase } from "./sandbox-db.server";
import { runTask, GatewayError } from "./gateway.server";

const Input = z.object({
  task: z.enum(["generate_variants", "context_pass", "score_alignment", "generate_certificate"]),
  payload: z.object({
    assessmentId: z.string().uuid(),
    stance: z.enum(["assisted", "limited", "resistant"]).optional(),
    regenerate: z.boolean().optional(),
  }),
});

export const aiGateway = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    try {
      const url = process.env["SUPABASE_URL"];
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) throw new Error("The research sandbox service is unavailable.");
      const result = await runTask(data.task, data.payload, sandboxDatabase(url, key), "Synthetic sandbox academic (simulated)");
      return JSON.parse(JSON.stringify(result)) as { ok?: boolean };
    } catch (e) {
      if (e instanceof GatewayError) {
        setResponseStatus(e.status);
        throw new Error(e.message);
      }
      throw e;
    }
  });
