# Transfer existing D1 enquiries to MySQL

The MySQL schema retains the original enquiry IDs, references, contact details, venue information, messages, consent and epoch-millisecond creation times. Existing enquiries are not included in the source repository.

## Export from the original database

Keep a backup of the original D1 database. In the original application's authorised Cloudflare environment, export the `venue_enquiries` rows as JSON. The importer accepts either a plain array of row objects or one successful Wrangler SELECT result wrapper.

For an account with authorised Wrangler access, run against the **actual original D1 database name**:

```bash
npx wrangler d1 execute YOUR_ORIGINAL_D1_DATABASE_NAME --remote --command="SELECT id, reference, name, organisation, email, phone, venue_type, city, message, contact_consent, created_at FROM venue_enquiries ORDER BY created_at" --json > /private/path/d1-enquiries.json
```

The original hosted app may require its own authorised database export workflow instead. Do not guess the database name or create a new empty database as a substitute.

The JSON rows must use the original snake_case column names. `contact_consent` is numeric `0` or `1`; `created_at` is the original integer epoch-millisecond value. No conversion to seconds or a local-time string is needed.

## Import into Hostinger MySQL

1. Apply `db/migrations/001_venue_enquiries.sql` to the destination database.
2. Set the destination `DB_*` variables in an authorised environment that can connect to Hostinger MySQL.
3. Run:

```bash
npm run db:import -- /private/path/d1-enquiries.json
```

The script validates all rows before writing. It imports within one transaction using prepared parameters. A failure rolls back the imported rows; retrying retains existing UUIDs and does not overwrite the original records. The command reports the number of rows processed without printing personal details.

Keep JSON exports outside the repository (the local `imports/` and `backups/` directories are ignored). Delete temporary copies according to your normal data-handling process after verifying the migration.

## Verify before cutover

Compare row counts and sample IDs, references, messages, consent and creation timestamps between the source and destination. The displayed `JLY-...` reference is preserved, but the UUID is the database's unique key.

If the old website is still accepting enquiries during migration, repeat the export and import immediately before moving traffic. UUID-based retries avoid duplicate leads. Keep the source backup until the new website and database have been verified.

No production enquiries have been exported or imported as part of the code migration.
