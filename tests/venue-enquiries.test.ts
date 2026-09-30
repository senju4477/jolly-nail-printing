import { test } from "node:test";
import assert from "node:assert/strict";
import { createVenueEnquiryHandler } from "../lib/venue-enquiries.ts";
import type { VenueEnquiry } from "../db/schema.ts";

const valid = {
  name: " Test Venue Contact ", organisation: " Test Centre ",
  email: "TEST@example.com", phone: "+61 400 000 000", venueType: "Shopping centre",
  city: "Sydney", message: "Please send hosting information.", website: "",
  consent: true, submissionId: "e64c653f-2945-4bca-8f90-aa3559867c00",
};
function request(body: unknown = valid, origin = "https://centredbycare.com.au") {
  return new Request("https://centredbycare.com.au/api/venue-enquiries", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

test("saves a valid enquiry with the existing response and all eleven fields", async () => {
  const saved: VenueEnquiry[] = [];
  const handler = createVenueEnquiryHandler(async (row) => { saved.push(row); });
  const response = await handler(request());
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { reference: "JLY-E64C653F", saved: true });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].name, "Test Venue Contact");
  assert.equal(saved[0].organisation, "Test Centre");
  assert.equal(saved[0].email, "test@example.com");
  assert.equal(saved[0].contactConsent, true);
  assert.equal(saved[0].message, valid.message);
  assert.ok(Math.abs(Date.now() - saved[0].createdAt) < 2000);
});

test("rejects invalid fields, missing permission and honeypot submissions before storage", async () => {
  let saves = 0;
  const handler = createVenueEnquiryHandler(async () => { saves++; });
  for (const patch of [
    { name: "" }, { name: "x".repeat(121) }, { organisation: "" },
    { email: "invalid" }, { phone: "letters" }, { city: "" },
    { venueType: "Unlisted type" }, { message: "x".repeat(3001) },
    { consent: false }, { consent: "true" }, { submissionId: "not-a-uuid" },
    { website: "spam.example" },
  ]) assert.equal((await handler(request({ ...valid, ...patch }))).status, 400);
  assert.equal(saves, 0);
});

test("rejects cross-origin requests and does not trust forwarded host headers", async () => {
  let saves = 0;
  const handler = createVenueEnquiryHandler(async () => { saves++; }, "https://centredbycare.com.au");
  const foreign = request(valid, "https://elsewhere.example");
  foreign.headers.set("x-forwarded-host", "elsewhere.example");
  assert.equal((await handler(foreign)).status, 403);
  assert.equal(saves, 0);
});

test("accepts the configured public origin behind an internal hosting proxy", async () => {
  const handler = createVenueEnquiryHandler(async () => {}, "https://centredbycare.com.au");
  const proxied = new Request("http://127.0.0.1:3000/api/venue-enquiries", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://centredbycare.com.au" },
    body: JSON.stringify(valid),
  });
  assert.equal((await handler(proxied)).status, 201);
});

test("rejects malformed JSON, non-object JSON, wrong media types and oversized bodies", async () => {
  const handler = createVenueEnquiryHandler(async () => { assert.fail("must not store"); });
  for (const body of ["{", "null", "[]"]) {
    assert.equal((await handler(new Request("https://centredbycare.com.au/api/venue-enquiries", {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
    }))).status, 400);
  }
  assert.equal((await handler(new Request("https://centredbycare.com.au/api/venue-enquiries", {
    method: "POST", headers: { "Content-Type": "text/plain" }, body: "hello",
  }))).status, 415);
  assert.equal((await handler(request({ ...valid, message: "x".repeat(12001) }))).status, 413);
});

test("normalises UUID case so retries keep the same identifier and reference", async () => {
  const saved: VenueEnquiry[] = [];
  const handler = createVenueEnquiryHandler(async (row) => { saved.push(row); });
  const first = await handler(request());
  const second = await handler(request({ ...valid, submissionId: valid.submissionId.toUpperCase() }));
  assert.deepEqual(await first.json(), await second.json());
  assert.equal(saved[0].id, saved[1].id);
});

test("returns a helpful retry response on database failure without exposing details", async (context) => {
  context.mock.method(console, "error", () => {});
  const handler = createVenueEnquiryHandler(async () => { throw new Error("SQL includes private credentials"); });
  const response = await handler(request());
  assert.equal(response.status, 503);
  const result = await response.json();
  assert.match(result.error, /details are still in the form/);
  assert.match(result.error, /jollynailprinting@gmail.com/);
  assert.doesNotMatch(result.error, /credentials|SQL/);
});
