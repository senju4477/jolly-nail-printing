import type { VenueEnquiry } from "../db/schema.ts";

export function parseD1Export(input: unknown): VenueEnquiry[] {
  let rows = input;
  // Accept the output of one Wrangler SELECT --json command as well as a row array.
  if (Array.isArray(input) && input.length === 1 && input[0] && typeof input[0] === "object" && "results" in input[0]) {
    if (input[0].success !== true) throw new Error("The D1 export did not succeed.");
    rows = input[0].results;
  }
  if (!Array.isArray(rows)) throw new Error("Expected a JSON array of exported enquiry rows.");
  return rows.map((row, index) => {
    const invalid = () => new Error(`Invalid exported enquiry at row ${index + 1}.`);
    if (!row || typeof row !== "object" || Array.isArray(row)) throw invalid();
    const string = (key: string, maximum: number, required = true) => {
      const value = row[key];
      if (typeof value !== "string" || value.length > maximum || (required && !value)) throw invalid();
      return value;
    };
    const id = string("id", 36).toLowerCase();
    const reference = string("reference", 12);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) ||
        reference !== "JLY-" + id.replaceAll("-", "").slice(0, 8).toUpperCase() ||
        ![0, 1].includes(row.contact_consent) ||
        !Number.isSafeInteger(row.created_at) || row.created_at < 0) throw invalid();
    return {
      id, reference,
      name: string("name", 120), organisation: string("organisation", 180),
      email: string("email", 254), phone: string("phone", 35),
      venueType: string("venue_type", 64), city: string("city", 120),
      message: string("message", 3000, false),
      contactConsent: row.contact_consent === 1, createdAt: row.created_at,
    };
  });
}
