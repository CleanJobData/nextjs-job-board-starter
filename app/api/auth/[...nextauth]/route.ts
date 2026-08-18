import type { NextRequest } from "next/server";
import config from "@/features.config";

/**
 * Lazily imports features/auth/lib/auth.ts only when the auth feature is
 * enabled and a request actually comes in - that module calls requireDb()
 * at module scope (NextAuth's DrizzleAdapter needs a live db instance), so
 * importing it eagerly here would break `next build` whenever auth is
 * disabled and DATABASE_URL isn't set, defeating "disabled features stay
 * inert" for anyone who hasn't enabled auth yet.
 */
async function handle(method: "GET" | "POST", req: NextRequest) {
  if (!config.auth.enabled) {
    return new Response("Not Found", { status: 404 });
  }
  const { handlers } = await import("@/features/auth/lib/auth");
  return handlers[method](req);
}

export async function GET(req: NextRequest) {
  return handle("GET", req);
}

export async function POST(req: NextRequest) {
  return handle("POST", req);
}
