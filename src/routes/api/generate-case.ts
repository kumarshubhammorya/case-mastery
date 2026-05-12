import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/generate-case")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const { type, industry, difficulty } = await request.json() as any;

        const gateway = createLovableAiGatewayProvider(key);
        const { text } = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          prompt: `Generate a realistic MBA-style ${type} case study in the ${industry} industry at ${difficulty} difficulty.

Return STRICT JSON only (no markdown, no fences):
{
  "title": "short evocative title with company name",
  "prompt": "3-5 paragraph case prompt with realistic numbers, a clear client situation, the question being asked, and 1-2 paragraphs of relevant context/data"
}`,
        });

        // Strip code fences if present
        const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
        try {
          const parsed = JSON.parse(clean);
          return Response.json(parsed);
        } catch {
          return new Response("AI returned invalid JSON", { status: 502 });
        }
      },
    },
  },
});
