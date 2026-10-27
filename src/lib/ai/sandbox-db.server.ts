import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Public synthetic sandbox only: never bypass row-level policies with an admin client.
export function sandboxDatabase(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        if (key.startsWith("sb_")) headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      },
    },
  });
}