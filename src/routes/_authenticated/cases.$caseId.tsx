import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cases/$caseId")({
  component: CaseDetail,
});

function CaseDetail() {
  const { caseId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [c, setC] = useState<any>(null);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [fw, setFw] = useState<string>("");

  useEffect(() => {
    supabase.from("cases").select("*").eq("id", caseId).maybeSingle().then(({ data }) => setC(data));
    supabase.from("frameworks").select("id,name").then(({ data }) => { setFrameworks(data ?? []); if (data?.[0]) setFw(data[0].id); });
  }, [caseId]);

  const [starting, setStarting] = useState(false);
  const start = async () => {
    if (starting) return;
    if (!user) { toast.error("Please sign in to start a session."); return; }
    if (!fw) { toast.error("Pick a framework first."); return; }
    setStarting(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ user_id: user.id, case_id: caseId, framework_id: fw, workspace_state: {} })
      .select()
      .single();
    if (error || !data) {
      console.error("[start session]", error);
      toast.error(error?.message ?? "Failed to start session");
      setStarting(false);
      return;
    }
    nav({ to: "/sessions/$sessionId", params: { sessionId: data.id } });
  };

  if (!c) return <main className="flex-1 p-12 text-muted-foreground">Loading…</main>;
  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-8 py-12">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{c.type} • {c.industry} • {c.difficulty}</p>
      <h1 className="text-4xl font-serif mb-6">{c.title}</h1>
      <p className="text-base leading-relaxed text-foreground/90 mb-8 whitespace-pre-line">{c.prompt}</p>
      <div className="bg-surface border border-border p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Pick framework</div>
        <div className="flex gap-2 flex-wrap mb-4">
          {frameworks.map((f) => (
            <button key={f.id} onClick={() => setFw(f.id)} className={`px-3 py-1.5 text-sm border ${fw === f.id ? "bg-ink text-primary-foreground border-ink" : "border-border bg-background"}`}>{f.name}</button>
          ))}
        </div>
        <Button onClick={start} className="bg-accent text-accent-foreground rounded-sm">Start session →</Button>
      </div>
    </main>
  );
}
