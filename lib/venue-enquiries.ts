import type { VenueEnquiry } from "../db/schema.ts";

const allowedVenues = new Set(["Shopping centre", "Beauty venue / salon", "Entertainment venue", "Retail landlord", "Hotel / gym", "Other venue"]);
const noCache = { "Cache-Control": "no-store" };

export function createVenueEnquiryHandler(
  saveEnquiry: (enquiry: VenueEnquiry) => Promise<void>,
  configuredOrigin?: string,
) {
 return async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== configuredOrigin) {
    return Response.json({ error: "Please send your enquiry from the Jolly website." }, { status: 403, headers: noCache });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Send the form as JSON." }, { status: 415, headers: noCache });
  }
  const textBody = await request.text();
  if (textBody.length > 12000) return Response.json({ error: "Your message is too long. Please shorten it and try again." }, { status: 413, headers: noCache });
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(textBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed;
  } catch {
    return Response.json({ error: "Please check your enquiry and try again." }, { status: 400, headers: noCache });
  }
  const clean = (key: string) => typeof body[key] === "string" ? (body[key] as string).trim() : "";
  const values = {
    name: clean("name"), organisation: clean("organisation"), email: clean("email").toLowerCase(), phone: clean("phone"),
    venueType: clean("venueType"), city: clean("city"), message: clean("message"), id: clean("submissionId").toLowerCase(),
  };
  if (clean("website")) return Response.json({ error: "Please leave the website field empty and try again." }, { status: 400, headers: noCache });
  if (!values.name || values.name.length > 120 || !values.organisation || values.organisation.length > 180 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254 ||
      !/^[+\d\s().-]{6,35}$/.test(values.phone) || !values.city || values.city.length > 120 ||
      !allowedVenues.has(values.venueType) || values.message.length > 3000 || body.consent !== true ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(values.id)) {
    return Response.json({ error: "Check your name, organisation, email, phone, location, venue type and contact permission, then try again." }, { status: 400, headers: noCache });
  }
  const reference = "JLY-" + values.id.replaceAll("-", "").slice(0, 8).toUpperCase();
  try {
    await saveEnquiry({
      ...values, reference, contactConsent: true, createdAt: Date.now(),
    });
    return Response.json({ reference, saved: true }, { status: 201, headers: noCache });
  } catch {
    // Database errors can contain SQL and contact details. Keep them out of logs.
    console.error("Venue enquiry save failed.");
    return Response.json({ error: "We couldn’t save your enquiry just now. Your details are still in the form. Try again, or email jollynailprinting@gmail.com." }, { status: 503, headers: noCache });
  }
}
}
