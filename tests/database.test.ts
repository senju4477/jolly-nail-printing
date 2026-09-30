import { test } from "node:test";
import assert from "node:assert/strict";
import type { Pool } from "mysql2/promise";
import { getMysqlConfig, saveVenueEnquiry } from "../db/index.ts";
import { parseD1Export } from "../lib/d1-import.ts";
import { getSiteUrl } from "../lib/site-url.ts";

const row = {
  id: "e64c653f-2945-4bca-8f90-aa3559867c00", reference: "JLY-E64C653F",
  name: "Test Contact", organisation: "Test Venue", email: "test@example.com",
  phone: "+61 400 000 000", venue_type: "Shopping centre", city: "Sydney",
  message: "A quote ' and an emoji 💅", contact_consent: 1, created_at: 1790770000123,
};

test("database configuration requires credentials and bounds the connection pool", () => {
  assert.throws(() => getMysqlConfig({}), /Missing database configuration/);
  const environment = { DB_HOST: "localhost", DB_USER: "test", DB_PASSWORD: "private", DB_NAME: "test_db" };
  const config = getMysqlConfig(environment);
  assert.equal(config.connectionLimit, 5);
  assert.equal(config.port, 3306);
  assert.equal(config.multipleStatements, false);
  assert.equal(config.charset, "utf8mb4");
  assert.throws(() => getMysqlConfig({ ...environment, DB_PORT: "invalid" }), /DB_PORT/);
  assert.throws(() => getMysqlConfig({ ...environment, DB_CONNECTION_LIMIT: "100" }), /DB_CONNECTION_LIMIT/);
  assert.throws(() => getMysqlConfig({ ...environment, DB_SSL: "insecure" }), /DB_SSL/);
  assert.deepEqual(getMysqlConfig({ ...environment, DB_SSL: "true" }).ssl, { rejectUnauthorized: true });
});

test("MySQL storage sends contact details as parameters and propagates failures", async () => {
  let sql = "";
  let values: unknown[] = [];
  const database = { execute: async (statement: string, parameters: unknown[]) => {
    sql = statement; values = parameters; return [{}, []];
  } } as unknown as Pick<Pool, "execute">;
  await saveVenueEnquiry(parseD1Export([row])[0], database);
  assert.equal((sql.match(/\?/g) || []).length, 11);
  assert.doesNotMatch(sql, /Test Contact|emoji/);
  assert.equal(values[8], row.message);
  assert.equal(values[10], row.created_at);
  assert.match(sql, /ON DUPLICATE KEY UPDATE id = id/);
  const failing = { execute: async () => { throw new Error("storage unavailable"); } } as unknown as Pick<Pool, "execute">;
  await assert.rejects(() => saveVenueEnquiry(parseD1Export([row])[0], failing), /storage unavailable/);
});

test("D1 import preserves all fields, consent, references and timestamps", () => {
  const direct = parseD1Export([row]);
  const wrapped = parseD1Export([{ success: true, results: [row] }]);
  assert.deepEqual(direct, wrapped);
  assert.equal(direct[0].createdAt, row.created_at);
  assert.equal(direct[0].message, row.message);
  assert.equal(direct[0].contactConsent, true);
  assert.deepEqual(parseD1Export([{ success: true, results: [] }]), []);
  assert.throws(() => parseD1Export([{ success: false, results: [row] }]), /did not succeed/);
  assert.throws(() => parseD1Export([{ ...row, reference: "JLY-INCORRECT" }]), /Invalid exported enquiry/);
  assert.throws(() => parseD1Export([{ ...row, contact_consent: "1" }]), /Invalid exported enquiry/);
  assert.throws(() => parseD1Export([row, null]), /row 2/);
});

test("site metadata accepts HTTP(S) origins and rejects credentials or paths", () => {
  assert.equal(getSiteUrl("https://centredbycare.com.au").origin, "https://centredbycare.com.au");
  assert.equal(getSiteUrl("http://localhost:3000").origin, "http://localhost:3000");
  for (const url of ["ftp://example.com", "https://user:secret@example.com", "https://example.com/path"]) {
    assert.throws(() => getSiteUrl(url));
  }
});
