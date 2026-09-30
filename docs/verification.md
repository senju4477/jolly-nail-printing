# Hostinger migration verification

Verified 30 September 2026 on Node.js 24.19.0 and npm 11.9.0.

| Check | Result |
| --- | --- |
| Clean dependency installation (`npm ci`) | Passed using the committed npm lockfile |
| Production build (`npm run build`) | Passed with standard Next.js 16.3.4 |
| TypeScript (`npm run typecheck`) | Passed |
| Enquiry and migration unit checks (`npm test`) | 11 passed |
| ESLint (`npm run lint`) | No errors; four existing image-element warnings |
| Production homepage | HTTP 200; canonical URL and coming-soon location state present |
| All nine public assets | HTTP 200, including local fonts, images, SVG and video |
| Invalid enquiry | HTTP 400 |
| Foreign-origin enquiry | HTTP 403 |
| Valid enquiry without configured database | HTTP 503 with retry/email guidance |
| Homepage, CSS and public-asset preservation | SHA-256 comparison: all eleven files unchanged |
| Real MySQL integration | Provided as an opt-in test; not run without a disposable database |
| Production data transfer | Importer provided; no production records exported or transferred |
| Hostinger deployment / custom domain | Not performed by this code migration |

The build prerenders the homepage and serves `/api/venue-enquiries` as a Node.js route. Database credentials are not needed to build the homepage; they are required to store enquiries.

The automated checks cover valid and invalid fields, consent, the honeypot, body limits, malformed JSON, origin handling behind a hosting proxy, stable submission identifiers, prepared parameters, storage failures, D1 export validation, Unicode payloads and original creation timestamps.

The four lint warnings concern the existing `<img>` elements. Those elements use local, already-compressed WebP files and declared dimensions; they were retained to preserve the finished design and delivery behavior.

Browser interaction and mobile checks should be completed on the Hostinger preview before launch. The current isolated execution network does not expose this local production server to the cloud browser. The interactive React page, responsive CSS and assets are byte-for-byte unchanged.

Before launch, configure Hostinger MySQL, apply the migration, verify a labelled enquiry reaches MySQL, test the gallery, dialogs, FAQs and mobile navigation on the preview URL, and connect the domain using Hostinger-issued DNS records.
