import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { getPool, closePool } from "../db/index.ts";

nextEnv.loadEnvConfig(process.cwd());

try {
  const sql = await readFile(new URL("../db/migrations/001_venue_enquiries.sql", import.meta.url), "utf8");
  await getPool().query(sql);
  console.log("Venue enquiry table is ready.");
} catch {
  console.error("Migration failed. Check the database variables, permissions and connectivity.");
  process.exitCode = 1;
} finally {
  await closePool();
}
