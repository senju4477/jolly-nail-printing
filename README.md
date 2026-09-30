# Jolly Nail Printing

Premium self-service nail art website for Australia, running on **Next.js 16, React 19, TypeScript and Node.js 24**. Venue enquiries use **Hostinger MySQL** through a bounded `mysql2` connection pool.

The existing design, homepage copy, images, fonts, video, gallery filters, dialogs, FAQ and upcoming-location state are preserved. This branch replaces the Cloudflare/Vinext runtime and D1 integration for Hostinger Business Web Hosting.

## Run locally

Use Node 24 (`.nvmrc` is included):

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The homepage works without database credentials. To save enquiries, set the real `DB_*` variables in `.env.local` and apply the schema:

```bash
npm run db:migrate
```

Production commands:

```bash
npm run build
npm start
```

`next start` uses Hostinger's supplied `PORT`, or port 3000 locally. The output directory is `.next`; this is a server application with a POST endpoint, so deploy with Hostinger's **Next.js** preset.

## Hostinger deployment

Full setup: [docs/hostinger.md](docs/hostinger.md).

| Setting | Value |
| --- | --- |
| Application framework | Next.js, with a Node.js server |
| Node version | 24.x |
| Project root | Repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Build output | `.next` |
| Repository branch | `hostinger-node-migration` |

Use either the private GitHub repository or upload a ZIP containing the source files at its root. Configure the database and environment variables in Hostinger, then deploy. Domain connection uses the DNS records Hostinger issues for that deployment.

## Database and existing enquiries

- Schema: `db/migrations/001_venue_enquiries.sql`, compatible with MySQL/InnoDB and `utf8mb4`.
- Server connection and prepared inserts: `db/index.ts`.
- The original eleven enquiry fields are retained, including contact consent and epoch-millisecond timestamps.
- Repeating a submission UUID succeeds without overwriting the original lead.
- Existing D1 records can be transferred using the validated JSON importer: [docs/data-migration.md](docs/data-migration.md).
- Database credentials stay server-side. Keep exports and environment files out of Git.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

The opt-in real-database check requires an **empty disposable MySQL database**:

```bash
RUN_MYSQL_INTEGRATION=1 npm run test:db
```

Pass database variables through the environment for this integration check. It rolls back the test records. Use the verification report in [docs/verification.md](docs/verification.md) for results and deployment checks still requiring Hostinger access.

## Editing

- Homepage: `app/page.tsx`
- Visual styles: `app/globals.css`
- SEO metadata: `app/layout.tsx` and `NEXT_PUBLIC_SITE_URL`
- Confirmed future machines: `lib/locations.ts`
- Enquiry endpoint: `app/api/venue-enquiries/route.ts`
- Validation and response handling: `lib/venue-enquiries.ts`
- Images, fonts and footage: `public/`

Launch locations remain coming soon. Gallery imagery remains design inspiration. Enquiries are stored in MySQL; automatic email notifications have not been added. Existing third-party license notices are retained with their respective UI assets.
