// Wraps `drizzle-kit migrate` so devcontainer postCreateCommand doesn't fail
// on repos where no DB-backed feature is enabled yet (no DATABASE_URL set).
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("db:migrate skipped - DATABASE_URL is not set (no DB-backed feature enabled yet).");
  process.exit(0);
}

const result = spawnSync("npx", ["drizzle-kit", "migrate"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
