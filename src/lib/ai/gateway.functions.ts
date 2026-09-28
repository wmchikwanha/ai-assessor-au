// The single AI door: { task, payload }. Every model call in the app goes through here.
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const email = (context.claims as { email?: string })?.email ?? context.userId;
      const result = await runTask(data.task, data.payload, context.supabase, email);
      return JSON.parse(JSON.stringify(result)) as { ok?: boolean };
    } catch (e) {
      if (e instanceof GatewayError) {
        setResponseStatus(e.status);
        throw new Error(e.message);
      }
      throw e;
    }
  });
