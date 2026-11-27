# Aashray Admin

A private-by-design staff dashboard for a small animal-welfare NGO. Staff sign in to manage animal listings, review adoption and volunteer applications, and publish rescue stories.

This is a student project built on my own initiative as a volunteer. It is a work in progress: the dashboard is built against an agreed API contract using synthetic mock data, and the Spring Boot backend is the next phase.

## Status

| Area | State |
|---|---|
| Login, route guard, role-aware UI | Done (mock API) |
| Animals list: filters, search, paging, status change, delete | Done (mock API) |
| Add and edit animal form, image upload | Next |
| Adoption applications | Planned |
| Volunteer applications | Planned |
| Rescue stories | Planned |
| Manager accounts (admin only) | Planned |
| Spring Boot backend | Planned |

## How it fits together

- **Public site:** static Astro site with no login. Applicants submit forms from there.
- **This dashboard:** React + Vite, plain CSS. Staff only.
- **Backend (planned):** Spring Boot REST API with PostgreSQL, and Cloudinary for images.
- Both frontends talk to the same API with different permissions.

Every API call lives in one file, `src/api.js`. It currently returns mock data in the shapes defined by the API contract. When the backend exists, only that file changes.

## Roles

| Role | Can do |
|---|---|
| ADMIN | Everything, including managing manager accounts |
| MANAGER | View, create, update and delete animals, stories and applications; change application status. Cannot manage accounts |

The dashboard hides controls the signed-in role cannot use. The backend is the real enforcement and must check roles on every request. Deleting asks for confirmation first.

## Privacy

- Applications collect the minimum: name, phone and a short message. No addresses and no ID numbers.
- All data in this repository is synthetic. No real applicant, animal or staff data is stored here.
- The session token is kept in `sessionStorage` and cleared when the tab closes.
- The app sets `noindex` and ships a `robots.txt` that disallows crawling. There are no third-party scripts or analytics.

## Tech

- React and Vite
- `react-router-dom` for routing
- Plain CSS with design tokens shared with the public site
- Fonts self-hosted through `@fontsource` (Instrument Serif, Hanken Grotesk, Playfair Display)

## Run locally

```bash
npm install
npm run dev
```

Then open the address Vite prints, usually `http://localhost:5173`.

Mock sign-ins (password `demo1234` for both):

- `admin@example.org` (ADMIN)
- `manager@example.org` (MANAGER)

Mock data lives in memory, so edits reset when the page is refreshed. Sign-in survives a refresh until the tab is closed.

Other scripts:

```bash
npm run build
npm run lint
```

## Project structure

```
index.html
public/
  robots.txt
src/
  main.jsx            entry, providers, fonts
  App.jsx             routes
  auth.jsx            auth context, session handling
  api.js              every API call (mock for now)
  styles/
    global.css        tokens, base styles, layout
  components/
    AppLayout.jsx     header, navigation, mobile menu
    RequireAuth.jsx   route guard
  pages/
    Login.jsx
    Animals.jsx
```

## Design principles

- Mobile first, because staff may use phones at the shelter.
- Restrained and flat: white space, thin dividers, solid grey panels. No gradients, shadows or emoji.
- Semantic HTML, one `h1` per page, tap targets at least 44px tall.

## API contract

The dashboard is built against a v1 REST contract (auth, animals, adoption and volunteer applications, stories, accounts) with JWT bearer authentication, paged list responses and a uniform error shape. The backend repository will carry the full contract once it exists.