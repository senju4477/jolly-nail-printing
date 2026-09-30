import { saveVenueEnquiry } from "@/db";
import { getSiteUrl } from "@/lib/site-url";
import { createVenueEnquiryHandler } from "@/lib/venue-enquiries";

export const runtime = "nodejs";

export const POST = createVenueEnquiryHandler(saveVenueEnquiry, getSiteUrl().origin);
