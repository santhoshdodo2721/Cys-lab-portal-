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

The seed runs automatically on API startup. It creates the admin only if the admin role does not exist, and inserts sample records only into empty collections. Sample CVE numbers and external profile/repository URLs are illustrative demo content, not claims of published vulnerabilities or real people.

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
        └── seed.js              # demo users and sample records
```

Authentication uses a signed JWT in an HTTP-only cookie, bcrypt password hashes, login rate limiting, and server-side role checks. Content reads and live updates are public. Admin login and every create, update, and delete API require admin access. Existing viewer accounts cannot sign in. External links use `target="_blank"` with `rel="noopener noreferrer"`.
