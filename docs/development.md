# Development

This branch uses the standard Next.js App Router and a Node.js runtime. Install with `npm ci`, run `npm run dev`, and build with `npm run build`. See the repository README and `docs/hostinger.md` for deployment settings.

The homepage and public assets are preserved from the finished Jolly design. Local fonts are loaded through CSS, footage loads when its dialog is opened, and reduced-motion styles remain available.

The enquiry handler is separately testable in `lib/venue-enquiries.ts`. Database access is confined to server code in `db/index.ts` and the migration/import scripts. Pool creation is lazy, so rendering the homepage does not require a database connection.

Keep UI changes separate from hosting changes. Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` before deploying. The optional real-MySQL test needs an empty disposable database and must never use the production enquiry database.
