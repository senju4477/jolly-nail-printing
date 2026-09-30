import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { getPool, closePool, saveVenueEnquiry } from "../db/index.ts";
import { parseD1Export } from "../lib/d1-import.ts";

nextEnv.loadEnvConfig(process.cwd());
let connection;
try {
  const filename = process.argv[2];
  if (!filename) throw new Error("Missing export filename.");
  // Validate every row before opening a transaction. Never print lead contents.
  const enquiries = parseD1Export(JSON.parse(await readFile(filename, "utf8")));
  connection = await getPool().getConnection();
  await connection.beginTransaction();
  for (const enquiry of enquiries) await saveVenueEnquiry(enquiry, connection);
  await connection.commit();
  console.log(`Processed ${enquiries.length} exported enquiries. Existing UUIDs were retained.`);
} catch {
  if (connection) await connection.rollback();
  console.error("Import failed. Check the export file, schema, database variables and connectivity. No partial import was committed.");
  process.exitCode = 1;
} finally {
  connection?.release();
  await closePool();
}
