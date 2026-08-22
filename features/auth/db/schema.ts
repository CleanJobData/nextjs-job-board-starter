import { pgTable, text, timestamp, primaryKey, integer, index } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/**
 * Schema shape required by @auth/drizzle-adapter for a credentials +
 * (future) OAuth setup. `passwordHash` is our own addition for the
 * credentials provider - Auth.js core doesn't manage passwords itself.
 *
 * All timestamps use `withTimezone: true` (timestamptz) - see
 * features/job-sync/db/schema.ts's doc comment for why "timestamp without
 * time zone" is a real correctness risk, not a style choice.
 */
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date", withTimezone: true }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  // Defaults to "user" - there's no UI to promote anyone yet (that's the
  // phase 3 admin dashboard); scripts/promote-admin.ts is the dev-only
  // bootstrap for the first admin until then. requireAdmin() in
  // features/authGuard.ts is the only thing that reads this today.
  role: text("role").$type<"user" | "admin">().notNull().default("user"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
    // Postgres doesn't auto-index FK columns - the adapter looks up accounts by userId
    // (e.g. "list this user's linked providers"), so this would otherwise be a table scan.
    index("accountsUserIdIdx").on(account.userId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (session) => [
    // Same reasoning as accountsUserIdIdx - the adapter deletes/looks up sessions by userId on sign-out.
    index("sessionsUserIdIdx").on(session.userId),
  ]
);

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);
