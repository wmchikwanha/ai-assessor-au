import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const assessmentQuery = (id: string) =>
  queryOptions({
    queryKey: ["assessment", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assessments").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

export const assessmentsListQuery = queryOptions({
  queryKey: ["assessments"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("assessments")
      .select("id,title,unit_code,unit_title,status,selected_stance,certificate_hash,updated_at,privacy_cleared,scores")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export function nextStepFor(a: { id: string; status: string; privacy_cleared: boolean }) {
  if (!a.privacy_cleared) return { to: "/assessments/$id/anonymise" as const, label: "Privacy gate" };
  if (a.status === "certified") return { to: "/assessments/$id/certificate" as const, label: "View certificate" };
  if (a.status === "scored") return { to: "/assessments/$id/results" as const, label: "Review results" };
  return { to: "/assessments/$id/processing" as const, label: "Run assay" };
}
