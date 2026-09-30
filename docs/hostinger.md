# Deploy on Hostinger Business Web Hosting

This project runs as a standard Next.js Node.js application. Hostinger's current documentation lists Business Web Hosting, Next.js server applications and Node 24 as supported.

## 1. Configure the app

In Hostinger, choose **Websites → Add Website → Deploy Web App**. Select **Import Git Repository** or **Upload your website files**.

For GitHub, select `senju4477/jolly-nail-printing` and the `hostinger-node-migration` branch. The repository is private, so Hostinger needs permission to access it. Keep the repository private.

For file upload, use a source ZIP with `package.json` at the ZIP root. Include `package-lock.json`, `app/`, `components/`, `db/`, `lib/`, `public/`, `vendor/`, configuration files and documentation. Exclude `node_modules`, `.next`, credentials and database exports.

Use the detected **Next.js** framework with Node **24.x**. Confirm these settings wherever Hostinger exposes them:

| Setting | Value |
| --- | --- |
| Root directory | Repository / ZIP root |
| Dependency installation | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Output directory | `.next` |

The Next.js preset manages the server entry point. A custom Express server is unnecessary. Hostinger assigns the listening port.

## 2. Create and prepare MySQL

Open **Websites → Dashboard → Databases → Management**. Create a MySQL database and database user, then copy the full database name, username, password and host from the connection details. Hostinger's documented host is usually `localhost`; use the actual value shown for your database.

Open that database in phpMyAdmin and run `db/migrations/001_venue_enquiries.sql` using the SQL tab or import it as a SQL file. It creates the table if absent and does not delete existing records. Do not paste the retired SQLite/D1 migration into MySQL.

Alternatively, from an authorised development environment that can reach this database, configure the variables and run `npm run db:migrate`. The application does not create tables or change the database during every build.

## 3. Set environment variables

Add the following in Hostinger's app environment-variable settings:

| Variable | Value / purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The public origin, such as `https://centredbycare.com.au` |
| `DB_HOST` | Hostinger's database host |
| `DB_PORT` | Usually `3306` |
| `DB_USER` | Full database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Full database name |
| `DB_CONNECTION_LIMIT` | `5` unless adjusted for the account's database limits |
| `DB_SSL` | `false` for the documented internal connection; `true` only if the endpoint supports trusted TLS |

Set the public URL before building and keep it identical at runtime. Use the Hostinger preview origin while testing a temporary deployment; change it to the final domain and rebuild when connecting the domain. Do not prefix database variables with `NEXT_PUBLIC_` or commit real environment files.

The public URL controls canonical/Open Graph links and permits same-origin form submissions when Hostinger forwards requests to an internal server address. The app does not trust arbitrary forwarded-host headers.

## 4. Deploy and check

Deploy the application and check Hostinger's build log. Test navigation, design filters, both dialogs, FAQ controls and mobile layout on the preview URL.

Submit one labelled deployment-test enquiry and verify it appears in `venue_enquiries` in phpMyAdmin with a `JLY-...` reference, consent and timestamp. Retry with the same submission UUID to confirm there is one record. Treat this as an explicit deployment check; the migration implementation has not sent test enquiries to your production database.

If the form returns its storage-unavailable message, check the environment variables, table migration, database-user permissions and connection details. The form retains the typed details after failure. Restart after changing database credentials; rebuild when changing the public URL.

## 5. Connect the domain

Use the **custom-domain connection settings for this Hostinger Node.js app** and apply the exact DNS records Hostinger provides. Earlier DNS records prepared for the Sites-hosted version belong to that provider and should not be used for this Hostinger deployment. Preserve existing email DNS records.

Hostinger currently requires a Node.js app to be added as a new website. If the domain is already assigned to another website, review Hostinger's domain-migration process and preserve a backup before replacing that website. Domain reassignment and removal of an existing website are separate deployment actions; this code migration does not perform them.

After the domain resolves with HTTPS, set `NEXT_PUBLIC_SITE_URL=https://centredbycare.com.au`, rebuild, and test an enquiry from that domain.

## References

- [Hostinger Node.js deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger MySQL connection](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Next.js Node.js deployment](https://nextjs.org/docs/app/getting-started/deploying)

Checked 30 September 2026. Hostinger's setup controls may change; retain its detected Next.js preset if its labels differ from this guide.
