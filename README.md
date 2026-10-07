# Lab Portal · Cyber Research Lab

This portal showcases work from the SIET Cloud Computing and Cyber Security Research Lab at Sri Shakthi Institute of Engineering and Technology. The Incognitrix logo supplied for this project is stored at `client/public/incognitrix-logo.png`. The institute crest is stored separately at `client/public/siet-crest.jpg`; its source is the [SIET college listing](https://dial4college.com/college/sri-shakthi-institute-of-engineering-technology-siet-coimbatore).

A responsive showcase for a college cybersecurity lab. Visitors can browse projects, CVEs, and achievements without logging in. The built-in custom CMS at `/lab-portal/admin` lets the seeded admin manage these entries. Records are stored in MongoDB and appear on open dashboards after saving.

The dashboard has three sections with search, detail views, member links, and rank badges. Admins have a dedicated **Manage entries** view plus add, edit, and delete forms. The layout adapts from three cards per row on desktop to one on mobile.

## Run everything with Docker

From this directory:

```bash
docker compose up --build
```

Open **http://localhost:5173**. The home page introduces the lab with CVE, Achievement, and Project links at the top. These sections are public and require no sign-in. The login form appears only at `/lab-portal/admin`. Open **http://localhost:5173/lab-portal/admin** to manage content; for the local demo, use `admin@lab.local` / `admin-demo-password`. The frontend, API, and MongoDB run side by side. The API is also available at `http://localhost:4000`.

Startup creates the first admin from configured environment values if no admin exists. No sample content is inserted. Projects, CVEs, and achievements are created through the CMS; deleting entries will not restore them on restart. Existing sample records remain until an admin deletes them.

For any shared or production deployment, set `JWT_SECRET` and `ADMIN_PASSWORD` in a root `.env` file before first startup. Use long unique values. Existing account passwords are not overwritten by later environment changes; update them directly in MongoDB or recreate the local demo volume. Serve the frontend over HTTPS and configure `CLIENT_ORIGIN` and secure cookies for the deployed origin.

## Run without Docker

1. Install Node.js 22+ and MongoDB 7+.
2. Copy `server/.env.example` to `server/.env`, set a long `JWT_SECRET` and the admin password.
3. Run `npm run install:all` from the project root.
4. Run `npm run seed` once, then `npm run dev`.
5. Open `http://localhost:5173`.

## Structure

```text
lab-portal/
├── docker-compose.yml          # client + server + MongoDB
├── client/
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx             # login, dashboard, cards, details, admin forms
│       └── style.css            # responsive dark UI
└── server/
    ├── Dockerfile
    ├── .env.example
    └── src/
        ├── index.js             # JWT cookie auth and protected CRUD API
        ├── models.js            # MongoDB data models
        ├── validation.js        # input and URL validation
        └── seed.js              # first-admin setup only
```

Authentication uses a signed JWT in an HTTP-only cookie, bcrypt password hashes, login rate limiting, and server-side role checks. Content reads and live updates are public. Admin login and every create, update, and delete API require admin access. Existing viewer accounts cannot sign in. External links use `target="_blank"` with `rel="noopener noreferrer"`.

## Database and admin access

MongoDB keeps four collections: `users`, `projects`, `cves`, and `achievements`. Team members and project guides are embedded in each entry; the same person and CVE number can appear in multiple entries. Entries have creation and update timestamps, field validation, optional-field defaults, and indexes for archive ordering and CVE lookup. Projects and CVEs use one full description; the API derives the short card preview.

Admins manage entries through `/lab-portal/admin`. Public visitors can read published entries but cannot create, update, or delete them. MongoDB is on Docker's internal network and has no host port exposed. This local configuration grants the API database access; it does not provide separate MongoDB accounts for human administrators.

Content is stored in the persistent `mongo_data` volume, independently of Git. A deletion through the admin panel updates open pages. A deletion performed directly in MongoDB appears after refreshing the page. Neither action edits the repository or pushes to GitHub. Database backups must be managed separately from source-code commits; do not commit database dumps or credentials.

The admin entry route `/lab-portal/admin` always displays the login form. Successful sign-in opens `/lab-portal/admin/dashboard`; refreshing that dashboard restores a valid session, while an expired session shows login.

## Shared team content

Use one deployed API connected to one shared MongoDB database. Everyone visits the same website; admins publish content through `/lab-portal/admin`. The site already receives live updates from that API, so visitors see saved changes without pulling Git commits.

For a hosted MongoDB database such as Atlas:

1. Create the database deployment and an application database user, and allow network access from your API hosting server.
2. Copy the project-root `.env.example` to `.env` and replace `MONGODB_URI` with the hosted connection string containing the `lab-portal` database name. Set the website origin and your own admin credentials and JWT secret.
3. Deploy the website and API on your hosting server. Docker Compose now reads the shared database connection from `.env`; its local MongoDB service can remain unused when using the hosted connection.
4. Have teammates manage content through the deployed admin page. Local development should use a separate database unless you intentionally want local edits to affect the live website.

See [MongoDB Atlas application connection setup](https://www.mongodb.com/docs/atlas/driver-connection/). The connection string belongs only on the backend. `.env` is ignored by Git. Setting up this configuration does not create a hosted database or publish the website automatically.

## Achievement attachments and custom values

Project guides support an optional qualification. Achievement event names can reuse an existing event name or use Custom; ranks support I, II, III and custom text. Photographs accept PNG, JPEG and WebP. Each member can optionally upload a certificate as a PDF or supported image, up to 5 MB per file. Files are stored in MongoDB GridFS (`attachments.files` and `attachments.chunks`), uploaded only by admins, and readable by visitors through the API. Include these collections in database backups. Removing a file from a form removes its reference; the stored upload is retained.
