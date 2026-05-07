/**
 * Server Tools - Call any Server SDK function from your Convex app.
 *
 * Available tools include:
 * - quick_ai_search: AI-powered web search with summarized results
 * - text2im: Generate images from text prompts
 * - file_to_markdown: Convert PDF/DOCX/XLSX files to markdown
 * - And all MCP integration tools configured for your user
 *
 * To add a new tool, first test it to see the response shape.
 */
import { v } from "convex/values";
import { action } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

const VIKTOR_API_URL = process.env.VIKTOR_SPACES_API_URL!;
const PROJECT_NAME = process.env.VIKTOR_SPACES_PROJECT_NAME!;
const PROJECT_SECRET = process.env.VIKTOR_SPACES_PROJECT_SECRET!;

async function callTool<T>(role: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${VIKTOR_API_URL}/api/viktor-spaces/tools/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: PROJECT_NAME,
      project_secret: PROJECT_SECRET,
      role,
      arguments: args,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error ?? "Tool call failed");
  }
  return json.result as T;
}

export const quickAiSearch = action({
  args: { query: v.string() },
  returns: v.string(),
  handler: async (_ctx, { query }) => {
    const result = await callTool<{ search_response: string }>("quick_ai_search", {
      search_question: query,
    });
    return result.search_response;
  },
});

export const askEveAI = action({
  args: {
    question: v.string(),
    context: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (_ctx, { question, context }) => {
    const systemPrompt = `You are AURA, an expert AI assistant for EVE Online embedded in the EVE Universe Tracker dashboard. You have deep knowledge of:
- Ship fitting and combat mechanics (tank types, weapon systems, cap stability)
- Market trading strategies (station trading, margin trading, hauling, arbitrage)
- Mining and industry (ore values, reprocessing, manufacturing, PI)
- PvE content (missions, abyssals, incursions, ratting, exploration)
- PvP mechanics (FW plexing, fleet comps, solo PvP, gate camps)
- Alpha vs Omega differences and the most efficient ways to farm ISK for PLEX
- Nullsec sovereignty, wormhole space, and faction warfare
- Navigation safety (ganking avoidance, safe hauling, route planning)

Guidelines:
- Be concise but thorough. Use EVE terminology naturally.
- When giving ISK/hr estimates, specify skill level assumptions.
- For ship fits, specify if Alpha-compatible.
- If asked about market prices or live data, note that the tracker dashboard already shows real-time data.
- Format responses with clear structure. Use bullet points and bold for key info.
- Always prioritize practical, actionable advice.`;

    const fullQuestion = context
      ? `Context from the tracker dashboard:\n${context}\n\nUser question: ${question}`
      : question;

    const result = await callTool<{ search_response: string }>("quick_ai_search", {
      search_question: `${systemPrompt}\n\nAnswer this EVE Online question: ${fullQuestion}`,
    });
    return result.search_response;
  },
});

export const generateImage = action({
  args: {
    prompt: v.string(),
    aspectRatio: v.optional(
      v.union(
        v.literal("1:1"),
        v.literal("16:9"),
        v.literal("9:16"),
        v.literal("4:3"),
        v.literal("3:2"),
      ),
    ),
  },
  returns: v.string(),
  handler: async (_ctx, { prompt, aspectRatio }) => {
    const result = await callTool<{ response_text: string }>("text2im", {
      prompt,
      aspect_ratio: aspectRatio ?? "1:1",
    });
    return result.response_text;
  },
});
