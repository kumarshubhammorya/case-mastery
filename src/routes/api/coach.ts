import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const body = await request.json() as any;
        const { messages, case: caseData, framework, workspace } = body;

        const system = `You are a Socratic case-interview coach for MBA students. Your job is to help the student solve a business case by asking probing questions, NOT by giving answers.

CURRENT CASE: ${caseData.title}
TYPE: ${caseData.type}
PROMPT: ${caseData.prompt}

FRAMEWORK IN USE: ${framework.name}
STUDENT'S CURRENT WORKSPACE NOTES (per framework node):
${JSON.stringify(workspace, null, 2)}

Coaching rules:
- Ask one or two sharp Socratic questions at a time. Probe assumptions and logic gaps.
- Push for MECE structure, hypothesis-driven thinking, and quantitative rigor.
- If asked for a hint, give a small nudge (a question or a direction) — never the full answer.
- If asked to check structure, point out gaps and ask the student to fix them.
- Keep responses concise (2–5 sentences). Use markdown for clarity.
- Be encouraging but rigorous, like a top MBB interviewer.`;

        const uiMessages: UIMessage[] = [
          { id: "sys", role: "system", parts: [{ type: "text", text: system }] } as any,
          ...messages.map((m: any, i: number) => ({ id: String(i), role: m.role, parts: [{ type: "text", text: m.content }] })),
        ];

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const result = streamText({ model, messages: await convertToModelMessages(uiMessages) });
        return result.toTextStreamResponse();
      },
    },
  },
});
