import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — CaseCoach" }] }),
});

function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        supabase.from("sessions").select("id, status, started_at, completed_at, cases(title, type)").order("started_at", { ascending: false }).limit(8),
        supabase.from("profiles").select("name").eq("id", user!.id).maybeSingle(),
      ]);
      setSessions(s.data ?? []);
      setProfile(p.data);
    })();
  }, [user]);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-8 py-12">
      <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif">Welcome{profile?.name ? `, ${profile.name}` : ""}.</h1>
          <p className="text-sm text-muted-foreground mt-1">{sessions.length} session{sessions.length === 1 ? "" : "s"} so far. Ready for the next one?</p>
        </div>
        <Link to="/cases/new"><Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm h-11 px-6 uppercase text-xs tracking-widest">+ Start new case</Button></Link>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Recent sessions</h2>
          <div className="space-y-3">
            {sessions.length === 0 && (
              <div className="border border-dashed border-border p-10 text-center text-muted-foreground bg-surface">
                No sessions yet. <Link to="/cases/new" className="underline text-ink">Start your first case →</Link>
              </div>
            )}
            {sessions.map((s) => (
              <Link key={s.id} to="/sessions/$sessionId" params={{ sessionId: s.id }} className="block bg-surface border border-border p-4 hover:border-accent/40 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{s.cases?.title ?? "Untitled case"}</div>
                    <div className="text-xs text-muted-foreground italic mt-1">{s.cases?.type} • {new Date(s.started_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-xs uppercase tracking-wider font-semibold ${s.status === "completed" ? "text-gold" : "text-muted-foreground"}`}>{s.status === "completed" ? "Completed" : "Resume"}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <aside className="bg-ink text-primary-foreground p-6">
          <div className="text-xs uppercase tracking-widest opacity-50 mb-4">Quick start</div>
          <div className="space-y-3 text-sm">
            <Link to="/cases" className="block hover:underline">Browse case library →</Link>
            <Link to="/cases/new" className="block hover:underline">Generate a new case →</Link>
            <Link to="/sessions" className="block hover:underline">View all sessions →</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
