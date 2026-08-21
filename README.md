# NEXUS Game Explorer

NEXUS is a fully local static demo for browsing a fictional game catalogue. It
does not use a live API, user accounts, analytics, or a backend.

## Run it

Open `index.html` in a modern browser. A local web server is optional; all
catalogue data and the hero image are stored in this repository.

## Project structure

- `index.html` - dedicated Lightfall landing page and catalogue entry points
- `catalogue.html` - story, search, filters, featured title, and genre links
- `genre.html` - reusable genre view driven by the `genre` query parameter
- `styles.css` - shared responsive and accessible styling
- `lightfall.js` - local WebGL landing-page background with reduced-motion support
- `games-data.js` - fictional catalogue and genre definitions
- `site.js` - shared rendering and interaction logic
- `assets/nexus-hero.jpg` - local hero artwork
- `THIRD_PARTY_NOTICES.md` - source and license notice for the background effect
- `tests/static-demo.test.js` - dependency-free catalogue and integration checks

Run `npm.cmd test` in Windows PowerShell, or `npm test` in other shells, to
execute the regression checks. No package installation is required because the
suite uses Node.js built-ins only.

## Future development

Keep `games-data.js` as the data boundary. A future live-data version can
replace that source with a backend or edge endpoint while leaving the page and
card rendering structure intact. Before adding a third-party API, add explicit
loading and error states, keep credentials off the client, validate remote
content, and add the provider's required attribution.
