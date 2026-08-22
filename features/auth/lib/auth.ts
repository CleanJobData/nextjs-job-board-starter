import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { users } from "../db/schema";
import * as schema from "@/lib/db/schema";
import authConfig from "@/features.config";

/** Thrown by authorize() when emailVerification is on and the account hasn't verified yet - surfaces as result.code === "email-not-verified" from next-auth/react's signIn(). */
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

/**
 * Auth.js (NextAuth v5) config. No hosted UI - sign-in/sign-up pages under
 * features/auth/routes call signIn("credentials", ...) / the registerUser
 * action directly. Which providers are active is entirely driven by
 * features.config.ts's auth.credentials / auth.oauthProviders - this file
 * just wires up whatever's turned on.
 *
 * OAuth providers use Auth.js v5's env var inference (AUTH_GOOGLE_ID/SECRET,
 * AUTH_LINKEDIN_ID/SECRET) rather than passing clientId/clientSecret here -
 * see features/auth/README.md.
 */
const providers: Provider[] = [];

if (authConfig.auth.credentials) {
  providers.push(
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const db = requireDb();
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (authConfig.auth.emailVerification && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    })
  );
}

if (authConfig.auth.oauthProviders.includes("google")) {
  providers.push(Google({}));
}
if (authConfig.auth.oauthProviders.includes("linkedin")) {
  providers.push(LinkedIn({}));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(requireDb(), schema as any),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  // Auth.js's default cookie names (authjs.*) are shared across every
  // localhost app regardless of port - cookies are scoped by domain, not
  // port, so signing into one local NextAuth app can silently clobber
  // another's session/csrf/callback cookies during local dev. Project-
  // specific names avoid that collision entirely (not just sessionToken -
  // csrf-token and callback-url collisions cause their own subtle bugs,
  // e.g. failed CSRF checks between two apps running at once). Doesn't
  // matter in production (real deployments don't share a hostname with
  // other apps), but costs nothing to keep.
  cookies: {
    sessionToken: { name: "cleanjobdata-job-board.session-token" },
    callbackUrl: { name: "cleanjobdata-job-board.callback-url" },
    csrfToken: { name: "cleanjobdata-job-board.csrf-token" },
  },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
