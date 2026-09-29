import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteFooter, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Assayer" },
      { name: "description", content: "Sign in to the Assayer assessment governance workbench." },
      { property: "og:title", content: "Sign in — Assayer" },
      { property: "og:description", content: "Access your assessment redesigns and Assay Certificates." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your inbox to confirm your email address.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r bg-primary p-12 text-primary-foreground lg:flex">
          <div className="[&_span]:text-primary-foreground"><Wordmark /></div>
          <blockquote className="font-display text-3xl leading-snug">
            "Assessment must equip students to engage ethically and critically with generative AI."
            <footer className="mt-4 font-sans text-sm opacity-70">— TEQSA, Assessment reform for the age of artificial intelligence (2023)</footer>
          </blockquote>
          <p className="text-xs opacity-60">For unit coordinators, teaching academics, sessional tutors and learning designers.</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <form onSubmit={submit} className="w-full max-w-sm space-y-5">
            <div className="lg:hidden"><Wordmark /></div>
            <div>
              <h1 className="text-3xl">{mode === "in" ? "Sign in" : "Create your account"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Use your institutional email address.</p>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "New to Assayer? Create an account" : "Already registered? Sign in"}
            </button>
          </form>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
