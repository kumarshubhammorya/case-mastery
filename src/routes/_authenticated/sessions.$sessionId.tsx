import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/sessions/$sessionId")({
  component: Workspace,
  head: () => ({ meta: [{ title: "Case workspace — CaseCoach" }] }),
});

type FwNode = { id: string; label: string; children?: FwNode[] };

function FrameworkNode({ node, state, setState, depth = 0 }: { node: FwNode; state: Record<string, string>; setState: (s: Record<string, string>) => void; depth?: number }) {
  return (
    <div className={`mb-3 ${depth > 0 ? "ml-5 border-l border-border pl-4" : ""}`}>
      <div className="flex flex-col bg-surface border border-border p-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{node.label}</div>
        <textarea
          className="w-full text-sm bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/60"
          rows={2}
          value={state[node.id] ?? ""}
          placeholder="Your thinking..."
          onChange={(e) => setState({ ...state, [node.id]: e.target.value })}
        />
      </div>
      {node.children?.map((c) => <FrameworkNode key={c.id} node={c} state={state} setState={setState} depth={depth + 1} />)}
    </div>
  );
}

function Workspace() {
  const { sessionId } = Route.useParams();
  const { session: auth } = useAuth();
  const [sess, setSess] = useState<any>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [framework, setFramework] = useState<any>(null);
  const [state, setState] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [debriefing, setDebriefing] = useState(false);
  const saveTimer = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("sessions").select("*, cases(*), frameworks(*)").eq("id", sessionId).maybeSingle();
      if (!s) return;
      setSess(s); setCaseData(s.cases); setFramework(s.frameworks);
      setState((s.workspace_state as any)?.nodes ?? {});
      const { data: ms } = await supabase.from("messages").select("role,content").eq("session_id", sessionId).order("created_at");
      setMessages((ms ?? []) as any);
    })();
  }, [sessionId]);

  // Autosave workspace
  useEffect(() => {
    if (!sess) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase.from("sessions").update({ workspace_state: { nodes: state } }).eq("id", sessionId);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [state, sess, sessionId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages, streaming]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg = { role: "user" as const, content: text };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setStreaming(true);
    await supabase.from("messages").insert({ session_id: sessionId, role: "user", content: text });

    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.access_token ?? ""}` },
        body: JSON.stringify({
          messages: next,
          case: { title: caseData.title, prompt: caseData.prompt, type: caseData.type },
          framework: { name: framework.name, structure: framework.structure },
          workspace: state,
        }),
      });
      if (!r.ok || !r.body) throw new Error(await r.text());
      const reader = r.body.getReader(); const dec = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = { role: "assistant", content: acc }; return copy; });
      }
      await supabase.from("messages").insert({ session_id: sessionId, role: "assistant", content: acc });
    } catch (e: any) {
      toast.error(e.message ?? "Coach failed");
    } finally { setStreaming(false); }
  };

  const finish = async () => {
    setDebriefing(true);
    try {
      const r = await fetch("/api/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.access_token ?? ""}` },
        body: JSON.stringify({ case: caseData, framework, workspace: state, messages }),
      });
      if (!r.ok) throw new Error(await r.text());
      const debrief = await r.json();
      await supabase.from("sessions").update({ status: "completed", debrief, completed_at: new Date().toISOString() }).eq("id", sessionId);
      setSess({ ...sess, status: "completed", debrief });
      toast.success("Session debriefed");
    } catch (e: any) { toast.error(e.message ?? "Debrief failed"); }
    finally { setDebriefing(false); }
  };

  if (!sess || !caseData || !framework) return <main className="flex-1 p-12 text-muted-foreground">Loading…</main>;

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border bg-surface px-6 py-3 flex justify-between items-center">
        <div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">← Dashboard</Link>
          <div className="font-serif text-lg">{caseData.title}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{framework.name}</span>
          {sess.status === "completed" ? (
            <span className="text-xs uppercase tracking-widest text-gold font-semibold">Completed{sess.debrief?.score ? ` · ${sess.debrief.score}/100` : ""}</span>
          ) : (
            <Button size="sm" disabled={debriefing} onClick={finish} className="bg-accent text-accent-foreground rounded-sm">{debriefing ? "Debriefing..." : "Finish & debrief"}</Button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Brief */}
        <aside className="md:col-span-3 border-r border-border bg-surface flex flex-col min-h-0">
          <div className="p-4 border-b border-border text-xs font-semibold uppercase tracking-widest text-muted-foreground">Case brief</div>
          <div className="p-5 overflow-y-auto text-sm">
            <p className="whitespace-pre-line leading-relaxed text-foreground/90">{caseData.prompt}</p>
          </div>
        </aside>

        {/* Framework workspace */}
        <section className="md:col-span-6 bg-background flex flex-col min-h-0">
          <div className="p-4 border-b border-border text-xs font-semibold uppercase tracking-widest text-muted-foreground">Framework workspace</div>
          <div className="p-6 overflow-y-auto">
            {(framework.structure as FwNode[]).map((n) => <FrameworkNode key={n.id} node={n} state={state} setState={setState} />)}
          </div>
        </section>

        {/* Coach */}
        <aside className="md:col-span-3 border-l border-border bg-surface flex flex-col min-h-0">
          <div className="p-4 border-b border-border text-xs font-semibold uppercase tracking-widest text-accent flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" /> Socratic coach
          </div>
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
            {messages.length === 0 && <p className="text-muted-foreground italic">The coach will guide you with questions, not answers. Start by sharing your initial structure.</p>}
            {sess.status === "completed" && sess.debrief && (
              <div className="bg-ink text-primary-foreground p-3 rounded-sm mb-3">
                <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Debrief · {sess.debrief.score}/100</div>
                <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{sess.debrief.feedback}</ReactMarkdown></div>
              </div>
            )}
            {messages.map((m, i) => (
              m.role === "assistant" ? (
                <div key={i} className="bg-muted/40 border border-border p-3 rounded-sm">
                  <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                </div>
              ) : (
                <div key={i} className="ml-6 border-l-2 border-ink pl-3 text-foreground/90">{m.content}</div>
              )
            ))}
            {streaming && messages[messages.length - 1]?.role !== "assistant" && <div className="text-xs text-muted-foreground italic">Coach is thinking…</div>}
          </div>
          {sess.status !== "completed" && (
            <div className="p-3 border-t border-border space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {["Give me a hint", "Check my structure", "What am I missing?"].map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} disabled={streaming} className="text-[10px] px-2 py-1 border border-border bg-background hover:bg-muted">{q}</button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Reply to coach..." disabled={streaming} className="flex-1 text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring" />
                <Button type="submit" size="sm" disabled={streaming || !input.trim()} className="bg-ink text-primary-foreground rounded-sm">Send</Button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
