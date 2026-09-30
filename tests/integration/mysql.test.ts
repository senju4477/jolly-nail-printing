import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import { getMysqlConfig, saveVenueEnquiry } from "../../db/index.ts";
import type { VenueEnquiry } from "../../db/schema.ts";

test("real MySQL preserves Unicode and makes concurrent retries idempotent", {
  skip: process.env.RUN_MYSQL_INTEGRATION !== "1" ? "Set RUN_MYSQL_INTEGRATION=1 with an empty disposable MySQL database." : false,
}, async () => {
  // This test owns its disposable schema. It deliberately refuses a populated table.
  const connection = await createConnection(getMysqlConfig());
  try {
    const migration = await readFile(new URL("../../db/migrations/001_venue_enquiries.sql", import.meta.url), "utf8");
    await connection.query(migration);
    const [existing] = await connection.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM venue_enquiries");
    assert.equal(Number(existing[0].count), 0, "Use an empty disposable database, never production.");
    await connection.beginTransaction();
    const id = randomUUID();
    const enquiry: VenueEnquiry = {
      id, reference: "JLY-" + id.slice(0, 8).toUpperCase(), name: "Local test 💅",
      organisation: "Disposable test venue", email: "test@example.com", phone: "+61 400 000 000",
      venueType: "Shopping centre", city: "Sydney", message: "Unicode, apostrophes ' and SQL text; stay data.",
      contactConsent: true, createdAt: Date.now(),
    };
    await Promise.all([saveVenueEnquiry(enquiry, connection), saveVenueEnquiry({ ...enquiry, message: "retry" }, connection)]);
    const [saved] = await connection.execute<RowDataPacket[]>("SELECT * FROM venue_enquiries WHERE id = ?", [id]);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].message, enquiry.message);
    assert.equal(saved[0].name, enquiry.name);
    assert.equal(saved[0].reference, enquiry.reference);
    assert.equal(Number(saved[0].created_at), enquiry.createdAt);
  } finally {
    await connection.rollback();
    await connection.end();
  }
});
