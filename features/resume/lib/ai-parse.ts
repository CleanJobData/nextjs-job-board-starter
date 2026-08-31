import Anthropic from "@anthropic-ai/sdk";
import type { ResumeContent } from "../db/schema";
import { emptyResumeContent } from "./parse";

/**
 * LLM-assisted extraction - the seam parseResumeText()'s doc comment
 * pointed at. Gated on TWO things, both required: features.config.ts's
 * resume.aiParsing AND a real ANTHROPIC_API_KEY - enabling the flag with
 * no key configured falls back to the heuristic parser rather than
 * throwing, since a template consumer flipping a config bit shouldn't
 * break uploads for everyone until they also set up billing.
 *
 * Anthropic specifically, not made provider-configurable: this is a
 * template built and maintained in this ecosystem, so it's the sensible
 * single default rather than an abstraction over multiple providers with
 * no second implementation to justify it. A deployment wanting a
 * different provider swaps this one file.
 */
export function isAiParsingAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You extract structured data from resume text. Respond with ONLY a JSON object matching this exact shape, no markdown fences, no commentary:
{
  "contact": { "name": string|null, "email": string|null, "phone": string|null, "location": string|null, "links": string[] },
  "summary": string|null,
  "skills": string[],
  "experience": [{ "company": string|null, "title": string|null, "dates": string|null, "description": string|null }],
  "education": [{ "school": string|null, "degree": string|null, "dates": string|null }],
  "projects": [{ "name": string|null, "description": string|null }],
  "additionalSections": [{ "heading": string, "content": string }]
}
"additionalSections" is for anything that doesn't fit the fields above - certifications, awards, languages, volunteering, and similar - one entry per heading found in the resume.
Use null for genuinely missing fields - never invent information that isn't in the text. Keep descriptions concise, in the resume's own words.`;

/**
 * Returns null (never throws) on any failure - missing key, API error,
 * malformed response - so callers can fall back to the heuristic parser
 * unconditionally rather than needing their own try/catch around this.
 */
export async function parseResumeWithAi(text: string): Promise<ResumeContent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text.slice(0, 12_000) }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;

    const parsed = JSON.parse(block.text);
    return {
      contact: {
        name: parsed.contact?.name ?? null,
        email: parsed.contact?.email ?? null,
        phone: parsed.contact?.phone ?? null,
        location: parsed.contact?.location ?? null,
        links: Array.isArray(parsed.contact?.links) ? parsed.contact.links : [],
      },
      summary: parsed.summary ?? null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      additionalSections: Array.isArray(parsed.additionalSections) ? parsed.additionalSections : [],
    };
  } catch {
    // Malformed JSON, API/network error, rate limit - all resolve to "no
    // AI result", never a thrown error the caller has to specifically
    // handle. The heuristic parser is always a safe fallback.
    return null;
  }
}

export { emptyResumeContent };
