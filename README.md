# Sunnyvale Pickleball Weather Page

Minimal GitHub Pages site for Slack link unfurls.

The site publishes one main URL plus day-specific URLs, and a scheduled GitHub Action rewrites all pages shortly before your Slack workflow posts links.

## Files

- `index.html`: main static page containing Open Graph tags and visible fallback text.
- `tuesday/index.html`: Tuesday-specific URL path for Slack unfurls.
- `thursday/index.html`: Thursday-specific URL path for Slack unfurls.
- `scripts/update-page.mjs`: Node script that fetches Open-Meteo and rewrites all pages.
- `.github/workflows/update-weather.yml`: scheduled workflow that runs the updater and commits changes.

## Enable GitHub Pages

1. Push this repository to GitHub.
2. In your repo, open **Settings > Pages**.
3. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or your default branch), folder `/ (root)`
4. Save.
5. GitHub will publish your site at your Pages URL.

## Required one-time edit

Replace `https://JimLiu0.github.io/sunnyvale-pickleball-weather/` in both:

- `index.html`
- `.github/workflows/update-weather.yml` (`PAGE_URL` env var)

Use your real fixed Pages URL (for example, `https://username.github.io/repo-name/`).

## Schedule behavior

The workflow runs on Tuesday and Thursday at `22:40 UTC`, which is `3:40 PM` in America/Los_Angeles during daylight saving time (UTC-7), a few minutes before 3:45 PM.

- Adjust cron in `.github/workflows/update-weather.yml` if your Slack posting time changes.
- If you want exact local-time alignment year-round, update cron when DST offset changes.

## Local test

Run from repo root:

```bash
node scripts/update-page.mjs
```

That command rewrites `index.html`, `tuesday/index.html`, and `thursday/index.html` with:

- `og:title` = `Sunnyvale Pickleball`
- `og:description` = `Weather today: {temp}F {condition}`
- `og:type` = `website`
- `og:url` = your fixed URL

## Slack posting URLs

Use separate fixed URLs in Slack to reduce unfurl cache collisions:

- Tuesday message URL: `https://JimLiu0.github.io/sunnyvale-pickleball-weather/tuesday/`
- Thursday message URL: `https://JimLiu0.github.io/sunnyvale-pickleball-weather/thursday/`

Both are updated by the same scheduled workflow.

If weather fetch fails, it uses:

`Weather today: --F Weather unavailable`

## Secrets

No secrets are required. This uses the public Open-Meteo API and does not require an API key.
