import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/cases/new")({
  component: NewCase,
  head: () => ({ meta: [{ title: "Start a new case — CaseCoach" }] }),
});

function NewCase() {
  const nav = useNavigate();
  const { user, session } = useAuth();
  const [library, setLibrary] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [chosenFramework, setChosenFramework] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Upload form
  const [upTitle, setUpTitle] = useState("");
  const [upPrompt, setUpPrompt] = useState("");
  const [upType, setUpType] = useState("Profitability");

  // Generate form
  const [genType, setGenType] = useState("Profitability");
  const [genIndustry, setGenIndustry] = useState("Technology");
  const [genDifficulty, setGenDifficulty] = useState("medium");

  useEffect(() => {
    supabase.from("cases").select("id,title,type,industry,difficulty").eq("source", "library").then(({ data }) => setLibrary(data ?? []));
    supabase.from("frameworks").select("id,name,slug").then(({ data }) => {
      setFrameworks(data ?? []);
      if (data?.[0]) setChosenFramework(data[0].id);
    });
  }, []);

  const startSession = async (caseId: string) => {
    if (!chosenFramework) return toast.error("Pick a framework first");
    setBusy(true);
    const { data, error } = await supabase.from("sessions").insert({
      user_id: user!.id, case_id: caseId, framework_id: chosenFramework, workspace_state: {},
    }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    nav({ to: "/sessions/$sessionId", params: { sessionId: data.id } });
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from("cases").insert({
      title: upTitle, prompt: upPrompt, type: upType, source: "user", owner_id: user!.id,
    }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    startSession(data.id);
  };

  const submitGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/generate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ type: genType, industry: genIndustry, difficulty: genDifficulty }),
      });
      if (!r.ok) throw new Error(await r.text());
      const c = await r.json();
      const ins = await supabase.from("cases").insert({
        title: c.title, prompt: c.prompt, type: genType, industry: genIndustry, difficulty: genDifficulty, source: "ai", owner_id: user!.id,
      }).select().single();
      if (ins.error) throw ins.error;
      startSession(ins.data.id);
    } catch (e: any) { toast.error(e.message ?? "Failed to generate"); setBusy(false); }
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-8 py-12">
      <h1 className="text-3xl font-serif mb-2">Start a new case</h1>
      <p className="text-sm text-muted-foreground mb-8">Choose your case source, pick a framework, and the AI coach will join you in the workspace.</p>

      <div className="bg-surface border border-border p-5 mb-6">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Framework</Label>
        <Select value={chosenFramework} onValueChange={setChosenFramework}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>{frameworks.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="library">
        <TabsList className="mb-6">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="upload">Upload / Paste</TabsTrigger>
          <TabsTrigger value="generate">AI generate</TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <div className="grid md:grid-cols-2 gap-3">
            {library.map((c) => (
              <button key={c.id} disabled={busy} onClick={() => startSession(c.id)} className="text-left bg-surface border border-border p-4 hover:border-accent/40 transition-colors">
                <div className="text-xs font-mono uppercase text-muted-foreground mb-1">{c.type} • {c.industry} • {c.difficulty}</div>
                <div className="font-medium">{c.title}</div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <form onSubmit={submitUpload} className="bg-surface border border-border p-6 space-y-4 max-w-2xl">
            <div><Label>Title</Label><Input required value={upTitle} onChange={(e) => setUpTitle(e.target.value)} className="mt-1" /></div>
            <div><Label>Case prompt</Label><Textarea required rows={8} value={upPrompt} onChange={(e) => setUpPrompt(e.target.value)} className="mt-1" placeholder="Paste the case prompt and any data here..." /></div>
            <div>
              <Label>Type</Label>
              <Select value={upType} onValueChange={setUpType}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["Profitability","Market Entry","M&A","Pricing","Market Sizing","Strategy"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button disabled={busy} type="submit" className="bg-ink text-primary-foreground rounded-sm">{busy ? "Starting..." : "Start session"}</Button>
          </form>
        </TabsContent>

        <TabsContent value="generate">
          <form onSubmit={submitGenerate} className="bg-surface border border-border p-6 space-y-4 max-w-2xl">
            <div className="grid md:grid-cols-3 gap-3">
              <div><Label>Type</Label><Select value={genType} onValueChange={setGenType}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["Profitability","Market Entry","M&A","Pricing","Market Sizing"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Industry</Label><Input value={genIndustry} onChange={(e) => setGenIndustry(e.target.value)} className="mt-1" /></div>
              <div><Label>Difficulty</Label><Select value={genDifficulty} onValueChange={setGenDifficulty}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["easy","medium","hard"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button disabled={busy} type="submit" className="bg-ink text-primary-foreground rounded-sm">{busy ? "Generating..." : "Generate & start"}</Button>
          </form>
        </TabsContent>
      </Tabs>
    </main>
  );
}
