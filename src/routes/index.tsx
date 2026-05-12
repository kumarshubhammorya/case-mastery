import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CaseCoach — Master MBA case interviews, quantifiably faster" },
      { name: "description", content: "An AI-powered workspace for MBA candidates. Practice profitability trees, market entries, and M&A frameworks with a real-time Socratic coach." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-28 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-6">For MBA candidates</p>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif leading-[1.05] mb-6 tracking-tight">
          Master the case interview,<br />
          <span className="italic text-accent underline decoration-1 underline-offset-[12px]">quantifiably faster.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          The AI workspace built specifically for MBA candidates. Practice profitability trees, market entries, and M&A frameworks with a real-time Socratic coach that pushes your thinking — not your patience.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/signup">
            <Button size="lg" className="bg-ink text-primary-foreground hover:bg-ink/90 rounded-sm px-7 h-12">
              Try a free practice case
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="rounded-sm px-7 h-12 border-ink text-ink">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      <section id="how" className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Interactive frameworks", d: "Dynamic nodes for profitability trees, Porter's 5 Forces, market entry, and M&A. No more scribbling on paper." },
              { n: "02", t: "Socratic AI coach", d: "Not just answers — questions. The coach finds your logical gaps and prompts you to drill deeper, like a real interviewer." },
              { n: "03", t: "Library, upload, or generate", d: "Browse curated cases, upload your school's casebook, or generate a fresh case by industry and difficulty." },
            ].map((f) => (
              <div key={f.n} className="p-8 bg-background border border-border">
                <div className="size-10 bg-muted rounded flex items-center justify-center mb-5 text-accent font-semibold">{f.n}</div>
                <h3 className="font-serif text-xl mb-2">{f.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="frameworks" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Built on the canon</p>
              <h2 className="text-4xl font-serif mb-4 leading-tight">Every framework you'll need on interview day.</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pre-built, interactive templates for the frameworks MBB consultants actually use. Pick one to start a case, fill in the nodes, and let the coach test the structure of your thinking.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                ["Profitability Tree", "Decompose profit into MECE revenue and cost drivers."],
                ["Porter's 5 Forces", "Assess industry attractiveness and competitive dynamics."],
                ["Market Entry", "Evaluate market, capabilities, entry mode, and risks."],
                ["4 Ps (Marketing Mix)", "Product, price, place, promotion."],
                ["M&A Evaluation", "Target, synergies, integration risk, valuation."],
              ].map(([t, d]) => (
                <li key={t} className="flex justify-between items-start gap-6 border-b border-border pb-3">
                  <div>
                    <div className="font-medium">{t}</div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground mt-1">Interactive</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-ink text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-serif italic mb-4">Stop guessing. Start drilling.</h2>
          <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">Free to start. No credit card required.</p>
          <Link to="/signup">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm px-8 h-12">
              Create your account
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-ink text-primary-foreground/50 py-10 px-6 md:px-8 border-t border-primary-foreground/10">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-6 justify-between items-center">
          <div className="text-sm font-serif italic">CaseCoach — built for ambitious MBA candidates.</div>
          <div className="text-xs uppercase tracking-widest">© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
