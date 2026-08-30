import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /**
       * Read from the JWT, not queried fresh from the DB per request - fine
       * for cosmetic nav display (e.g. showing an "Admin" link), but NEVER
       * use this for actual access control: a role promotion/demotion only
       * lands here on the user's next sign-in. features/authGuard.ts's
       * requireAdmin() deliberately queries users.role fresh from the DB on
       * every call for exactly this reason - that's the real authorization
       * boundary, this is just what the header renders.
       */
      role: "user" | "admin";
    } & DefaultSession["user"];
  }
}
