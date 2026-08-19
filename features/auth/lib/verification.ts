import { eq, and } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { requireMailer } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/render";
import { VerifyEmailTemplate } from "@/lib/email/templates/VerifyEmailTemplate";
import { users, verificationTokens } from "../db/schema";

const TOKEN_TTL_HOURS = 24;

/** Creates a verification token for `email` and emails a verify link. Call after registerUser() when emailVerification is on. */
export async function sendVerificationEmail(email: string) {
  const db = requireDb();
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({ identifier: email, token, expires });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const { html, text } = await renderEmail(VerifyEmailTemplate({ verifyUrl }));
  await requireMailer().send({
    to: email,
    subject: "Verify your email address",
    html,
    text,
  });
}

export type VerifyResult = "verified" | "invalid" | "expired";

/** Consumes a (email, token) pair from a /verify-email link and marks the user verified. */
export async function verifyEmailToken(email: string, token: string): Promise<VerifyResult> {
  const db = requireDb();

  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token)))
    .limit(1);

  if (!row) return "invalid";

  // Single-use - delete regardless of outcome so a stale/expired link can't be retried.
  await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token)));

  if (row.expires < new Date()) return "expired";

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));
  return "verified";
}
