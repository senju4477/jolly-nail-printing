import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const venueEnquiries = sqliteTable("venue_enquiries", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull(),
  name: text("name").notNull(),
  organisation: text("organisation").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  venueType: text("venue_type").notNull(),
  city: text("city").notNull(),
  message: text("message").notNull(),
  contactConsent: integer("contact_consent", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at").notNull(),
});
