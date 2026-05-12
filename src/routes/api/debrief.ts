import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/debrief")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const { case: caseData, framework, workspace, messages } = await request.json() as any;

        const gateway = createLovableAiGatewayProvider(key);
        const { text } = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          prompt: `You are an MBB-caliber case interview evaluator. Score and debrief a student's attempt at this case.

CASE: ${caseData.title}
PROMPT: ${caseData.prompt}
FRAMEWORK USED: ${framework.name}

STUDENT'S WORKSPACE NOTES:
${JSON.stringify(workspace, null, 2)}

CHAT TRANSCRIPT WITH COACH:
${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

Return STRICT JSON only (no markdown):
{
  "score": <integer 0-100>,
  "feedback": "Markdown debrief covering: **Structure** (MECE, framework fit), **Hypothesis quality**, **Quantitative rigor**, **Communication**, and **3 concrete improvements**. Be specific and rigorous."
}`,
        });

        const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
        try { return Response.json(JSON.parse(clean)); }
        catch { return Response.json({ score: 0, feedback: text }); }
      },
    },
  },
});
