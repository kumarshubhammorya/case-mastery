import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign up — CaseCoach" }, { name: "description", content: "Create your CaseCoach account." }] }),
});

function SignupPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) { nav({ to: "/dashboard" }); }
    else toast.success("Check your email to confirm your account.");
  };

  const onGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if ((r as any).error) toast.error(typeof (r as any).error === "string" ? (r as any).error : ((r as any).error as Error).message ?? "Sign-up failed");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface px-6 py-4">
        <Link to="/" className="text-xl font-serif font-semibold">Case<span className="text-accent italic">Coach</span></Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface border border-border p-8 md:p-10">
          <h1 className="text-3xl font-serif mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-8">Start practicing in under a minute.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label htmlFor="name">Name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" /></div>
            <Button type="submit" disabled={loading} className="w-full bg-ink text-primary-foreground hover:bg-ink/90 rounded-sm h-11">{loading ? "Creating..." : "Create account"}</Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-border" />OR<div className="flex-1 h-px bg-border" /></div>
          <Button variant="outline" onClick={onGoogle} className="w-full h-11 rounded-sm">Continue with Google</Button>
          <p className="text-sm text-center text-muted-foreground mt-6">Already have one? <Link to="/login" className="underline text-ink">Log in</Link></p>
        </div>
      </main>
    </div>
  );
}
