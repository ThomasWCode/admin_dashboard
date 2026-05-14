# Ruffl Admin Dashboard — Setup Guide

## Overview

The Ruffl Admin Dashboard is a client-side React SPA for managing the
dispute resolution process. It is deployed to GitHub Pages and
communicates directly with the Ruffl Flask backend API.

**URL:** `admin.ruffl.thomaswhite.me` (GitHub Pages subdomain)

## Prerequisites

- The Ruffl backend must already be deployed and running (see `v2/SETUP.md`)
- An admin user must exist in the database (see one-time setup OT-2 in `v2/SETUP.md`)
- `RUFFL_ADMIN_EMAIL` must be set in Railway environment variables
- A GitHub repository with GitHub Pages enabled

## Local Development

```bash
cd admin_dashboard
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. On first load you will
be prompted to enter:
- **API URL** — your Railway backend URL (e.g. `https://ruffl-backend-production.up.railway.app`)
- **Email** — admin user email
- **Password** — admin user password

The API URL is saved in localStorage so you only need to enter it once.

## Deployment to GitHub Pages

### Initial Setup

1.  Push the `admin_dashboard/` directory to your GitHub repository

2.  Go to **Repository Settings → Pages**
    - Source: **GitHub Actions**
    - (No branch selection needed — the workflow handles it)

3.  Go to **Repository Settings → Environments → github-pages**
    - No additional secrets required (the dashboard is fully client-side)

4.  The GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers
    automatically on every push to `main`. It:
    - Installs dependencies
    - Runs `npm run build`
    - Deploys the `dist/` folder to GitHub Pages

### Custom Domain (admin.ruffl.thomaswhite.me)

1.  In your DNS provider, create a CNAME record:
    - **Name:** `admin`
    - **Value:** `<your-github-username>.github.io`
    - **TTL:** 300

2.  In **Repository Settings → Pages → Custom domain**, enter:
    `admin.ruffl.thomaswhite.me`

3.  Wait for DNS propagation (5–30 minutes). GitHub will automatically
    provision an HTTPS certificate.

### Manual Deploy (alternative to GitHub Actions)

```bash
cd admin_dashboard
npm install
npm run build
npx gh-pages -d dist
```

This pushes the `dist/` folder to the `gh-pages` branch.

## Usage

### Logging In

1.  Navigate to `https://admin.ruffl.thomaswhite.me`
2.  Enter your Railway backend API URL
3.  Enter admin email and password
4.  Only users with `role = 'admin'` in the database can log in

### Dispute List

- Shows all disputes with status badges (Open, Under Review, Resolved, Closed)
- Filter by status using the dropdown
- Stats cards show counts for each status
- Click any dispute row to view its detail

### Dispute Detail

Four tabs:

**Evidence**
- View all evidence submitted by both parties
- Images are shown as thumbnails (click to open full-size)
- Documents show as downloadable file chips
- Mediators can see all evidence but cannot submit evidence
  (only the disputing parties submit evidence via the mobile app)

**Messages**
- Real-time chat between both parties and the mediator
- Messages from the mediator are highlighted in teal
- Type a message and press Enter or click Send
- Messages are sent to both parties via push notification

**Commission**
- Full transaction details: parties, financial summary, milestone progress
- Financial breakdown: total value, deposit, material costs, estimated profit
- Milestone list with status indicators
- Materials log with costs

**Resolution** (only visible when dispute is resolved)
- Shows the resolution type and mediator's message
- Both parties receive email and push notification when resolved

### Adjudication Workflow

1.  **Assign to Me** — Click on an Open dispute to change status to
    "Under Review". Both parties are notified.

2.  **Adjudicate** — Click the green "Adjudicate" button to open the
    resolution form:
    - Select a resolution type:
      - **Maker Favoured** — dispute resolved in maker's favour
      - **Commissioner Favoured** — dispute resolved in commissioner's favour
      - **Split Decision** — compromise resolution
      - **Commission Cancelled** — commission is cancelled
      - **No Resolution** — insufficient evidence to decide
    - Write a detailed resolution message explaining the decision
    - Click "Submit Resolution"

3.  **Close** — After resolution, click "Close Dispute" to archive it.
    Status changes to "Closed".

## Environment Variables

The dashboard is fully client-side and does not use build-time
environment variables. The API URL is configured at runtime via the
login form and stored in localStorage.

## Troubleshooting

**Problem:** "Admin only" error when accessing API endpoints
**Fix:** Ensure the user has `role = 'admin'` in the database:
```sql
UPDATE users SET role='admin' WHERE email='your-admin-email@example.com';
```

**Problem:** CORS errors when accessing the backend
**Fix:** The Flask backend has `CORS(app, origins="*")` which allows
all origins. If you've changed this, ensure `admin.ruffl.thomaswhite.me`
is in the allowed origins.

**Problem:** Login succeeds but dispute list is empty
**Fix:** The admin user must have `role = 'admin'` to see all disputes.
Regular users only see their own disputes.

**Problem:** GitHub Pages shows 404 on refresh
**Fix:** The `public/404.html` file handles SPA routing by redirecting
to `index.html`. Ensure it's included in the build output.

**Problem:** "Network request failed" in the dashboard
**Fix:** Check that the API URL is correct and the Railway backend is
running. Test with: `curl https://YOUR-URL.railway.app/health`
