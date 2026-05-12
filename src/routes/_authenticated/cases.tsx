import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cases")({
  component: CasesPage,
  head: () => ({ meta: [{ title: "Case library — CaseCoach" }] }),
});

function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase.from("cases").select("*").order("created_at", { ascending: false }).then(({ data }) => setCases(data ?? []));
  }, []);

  const types = Array.from(new Set(cases.map((c) => c.type)));
  const filtered = filter === "all" ? cases : cases.filter((c) => c.type === filter);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-8 py-12">
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif">Case library</h1>
          <p className="text-sm text-muted-foreground mt-1">Curated cases, your uploads, and AI-generated practice.</p>
        </div>
        <Link to="/cases/new"><Button className="bg-ink text-primary-foreground rounded-sm">+ New case</Button></Link>
      </div>

      <div className="flex gap-2 flex-wrap mb-6 text-xs">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 border ${filter === "all" ? "bg-ink text-primary-foreground border-ink" : "border-border bg-surface"}`}>All</button>
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 border ${filter === t ? "bg-ink text-primary-foreground border-ink" : "border-border bg-surface"}`}>{t}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-surface border border-border p-5 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{c.type} • {c.industry}</span>
              <span className="text-xs text-gold uppercase">{c.difficulty}</span>
            </div>
            <h3 className="font-serif text-xl mb-2">{c.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{c.prompt}</p>
            <Link to="/cases/$caseId" params={{ caseId: c.id }} className="mt-4 text-sm font-medium text-ink underline self-start">Start session →</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
