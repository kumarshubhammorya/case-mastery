import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/sessions")({
  component: SessionsList,
  head: () => ({ meta: [{ title: "Sessions — CaseCoach" }] }),
});

function SessionsList() {
  const [sessions, setSessions] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("sessions").select("id, status, started_at, completed_at, debrief, cases(title,type)").order("started_at", { ascending: false }).then(({ data }) => setSessions(data ?? []));
  }, []);
  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-8 py-12">
      <h1 className="text-3xl font-serif mb-6">All sessions</h1>
      <div className="space-y-3">
        {sessions.map((s) => (
          <Link key={s.id} to="/sessions/$sessionId" params={{ sessionId: s.id }} className="block bg-surface border border-border p-4 hover:border-accent/40">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{s.cases?.title}</div>
                <div className="text-xs text-muted-foreground italic">{s.cases?.type} • {new Date(s.started_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs uppercase tracking-wider font-semibold ${s.status === "completed" ? "text-gold" : "text-muted-foreground"}`}>{s.status}</div>
                {s.debrief?.score && <div className="text-xl font-serif">{s.debrief.score}/100</div>}
              </div>
            </div>
          </Link>
        ))}
        {sessions.length === 0 && <div className="text-muted-foreground">No sessions yet.</div>}
      </div>
    </main>
  );
}
