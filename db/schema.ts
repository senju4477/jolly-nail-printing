// MySQL table definition lives in db/migrations/001_venue_enquiries.sql.
// createdAt retains the original D1 epoch-millisecond value.
export type VenueEnquiry = {
  id: string;
  reference: string;
  name: string;
  organisation: string;
  email: string;
  phone: string;
  venueType: string;
  city: string;
  message: string;
  contactConsent: boolean;
  createdAt: number;
};
