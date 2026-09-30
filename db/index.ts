import { createPool, type Pool, type PoolConnection, type PoolOptions } from "mysql2/promise";
import type { VenueEnquiry } from "./schema.ts";

export function getMysqlConfig(environment: Record<string, string | undefined> = process.env): PoolOptions {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
  const missing = required.filter((name) => !environment[name]);
  if (missing.length) throw new Error(`Missing database configuration: ${missing.join(", ")}.`);
  const integer = (name: string, fallback: number, maximum: number) => {
    const raw = environment[name] ?? String(fallback);
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isInteger(value) || value < 1 || value > maximum) {
      throw new Error(`Invalid database configuration: ${name}.`);
    }
    return value;
  };
  const ssl = environment.DB_SSL ?? "false";
  if (ssl !== "true" && ssl !== "false") throw new Error("DB_SSL must be true or false.");
  return {
    host: environment.DB_HOST,
    port: integer("DB_PORT", 3306, 65535),
    user: environment.DB_USER,
    password: environment.DB_PASSWORD,
    database: environment.DB_NAME,
    charset: "utf8mb4",
    timezone: "Z",
    connectionLimit: integer("DB_CONNECTION_LIMIT", 5, 20),
    waitForConnections: true,
    queueLimit: 50,
    connectTimeout: 10000,
    enableKeepAlive: true,
    multipleStatements: false,
    ...(ssl === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

const poolState = globalThis as typeof globalThis & { jollyMysqlPool?: Pool };

// Lazy creation lets the homepage build and render without database credentials.
// Retain one bounded pool per Node process, including development reloads.
export function getPool(): Pool {
  if (typeof window !== "undefined") throw new Error("Database access is server-only.");
  poolState.jollyMysqlPool ??= createPool(getMysqlConfig());
  return poolState.jollyMysqlPool;
}

export async function closePool() {
  const pool = poolState.jollyMysqlPool;
  delete poolState.jollyMysqlPool;
  if (pool) await pool.end();
}

export async function saveVenueEnquiry(
  enquiry: VenueEnquiry,
  database: Pick<Pool | PoolConnection, "execute"> = getPool(),
): Promise<void> {
  // A retry of the same UUID succeeds without overwriting the original lead.
  // Do not use INSERT IGNORE: it can conceal unrelated storage errors.
  await database.execute(
    `INSERT INTO venue_enquiries
      (id, reference, name, organisation, email, phone, venue_type, city, message, contact_consent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = id`,
    [enquiry.id, enquiry.reference, enquiry.name, enquiry.organisation,
      enquiry.email, enquiry.phone, enquiry.venueType, enquiry.city,
      enquiry.message, enquiry.contactConsent ? 1 : 0, enquiry.createdAt],
  );
}
