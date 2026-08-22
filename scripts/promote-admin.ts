/**
 * Dev-only bootstrap for the first admin user. There's no UI to promote
 * anyone to "admin" yet (features/auth/db/schema.ts's users.role) - that's
 * the phase 3 admin dashboard's job - so until then this is the only way
 * to get an admin account for local dev/testing of anything gated by
 * features/authGuard.ts's requireAdmin().
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts you@example.com
 */
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { users } from "@/features/auth/db/schema";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  const db = requireDb();
  const [updated] = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!updated) {
    console.error(`No user found with email "${email}". Sign up first, then re-run this script.`);
    process.exit(1);
  }

  console.log(`Promoted ${updated.email} (${updated.id}) to role="${updated.role}".`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
