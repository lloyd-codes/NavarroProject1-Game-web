const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadCatalogue() {
  const context = { window: {} };
  vm.runInNewContext(read("games-data.js"), context, {
    filename: "games-data.js"
  });
  return context.window.NEXUS_DATA;
}

test("catalogue contains a balanced, valid fictional dataset", () => {
  const data = loadCatalogue();
  const honestBadges = new Set([
    "Demo highlight",
    "Demo favorite",
    "Curated pick",
    "New concept",
    "Featured"
  ]);
  assert.ok(data);
  assert.equal(data.genres.length, 12);
  assert.equal(data.games.length, 36);

  const genreSlugs = data.genres.map((genre) => genre.slug);
  const gameIds = data.games.map((game) => game.id);
  assert.equal(new Set(genreSlugs).size, genreSlugs.length);
  assert.equal(new Set(gameIds).size, gameIds.length);
  assert.equal(data.games.filter((game) => game.featured).length, 1);

  for (const genre of data.genres) {
    assert.match(genre.slug, /^[a-z0-9-]+$/);
    assert.ok(genre.name && genre.icon && genre.description);
    assert.equal(
      data.games.filter((game) => game.genre === genre.slug).length,
      3,
      `${genre.slug} should have three demo games`
    );
  }

  for (const game of data.games) {
    assert.ok(genreSlugs.includes(game.genre));
    assert.match(game.id, /^[a-z0-9-]+$/);
    assert.ok(game.title && game.icon && game.description && game.badge);
    assert.ok(honestBadges.has(game.badge), `${game.id} has an unsupported badge`);
    assert.ok(Number.isFinite(game.rating) && game.rating >= 0 && game.rating <= 10);
    assert.ok(Number.isInteger(game.year));
    assert.ok(Array.isArray(game.platforms) && game.platforms.length > 0);
  }
});

test("HTML pages expose the renderer contracts", () => {
  const contracts = {
    "index.html": [
      "menuButton", "primaryNav", "gameDialog", "dialogClose",
      "dialogTitle", "dialogGenre", "dialogDescription", "dialogMeta",
      "dialogIcon", "dialogPlatforms", "currentYear", "searchInput",
      "clearSearch", "heroSearchForm", "filterBar", "gamesGrid", "resultsStatus",
      "heroSearchStatus",
      "categoriesGrid", "gameCount", "genreCount", "featuredTitle",
      "featuredGenre", "featuredDescription", "featuredMeta", "featuredOpen",
      "story", "story-heading"
    ],
    "genre.html": [
      "menuButton", "primaryNav", "gameDialog", "dialogClose",
      "dialogTitle", "dialogGenre", "dialogDescription", "dialogMeta",
      "dialogIcon", "dialogPlatforms", "currentYear", "genreIcon",
      "genreTitle", "genreDescription", "genreGamesGrid", "genreResults"
    ]
  };

  for (const [file, ids] of Object.entries(contracts)) {
    const html = read(file);
    for (const id of ids) {
      assert.match(html, new RegExp(`\\bid=["']${id}["']`), `${file} is missing #${id}`);
    }
    assert.doesNotMatch(html, /<style\b/i);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  }
});

test("landing page exposes the immersive local-demo composition", () => {
  const html = read("index.html");
  const compactText = (fragment) => fragment
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
  const elementContents = (id) => {
    const match = html.match(
      new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i")
    );
    assert.ok(match, `Missing element contents for #${id}`);
    return match[2];
  };

  assert.match(html, /<header\b[^>]*\bclass=["'][^"']*\bsite-header--overlay\b/i);
  assert.match(html, /<a\b[^>]*href=["']#story["'][^>]*>\s*Story\s*<\/a>/i);
  assert.match(html, /<a\b[^>]*href=["']#genres["'][^>]*>\s*Genres\s*<\/a>/i);
  assert.match(html, /<a\b[^>]*href=["']#explore["'][^>]*>\s*Catalogue\s*<\/a>/i);
  assert.match(html, /\bclass=["'][^"']*\bsite-status\b[^"']*["'][^>]*>[\s\S]*?Local demo/i);

  assert.equal(compactText(elementContents("hero-title")), "NEXUS Game Explorer");
  assert.match(
    elementContents("hero-title"),
    /<span\b[^>]*\bclass=["'][^"']*\bhero__title-emphasis\b[^"']*["'][^>]*>\s*Game Explorer\s*<\/span>/i
  );
  assert.match(html, /\bclass=["'][^"']*\bhero-proof\b[^"']*["']/i);
  assert.match(html, /id=["']gameCount["'][\s\S]*?fictional games\s*\/[\s\S]*?id=["']genreCount["'][\s\S]*?genres\s*\/\s*locally stored/i);

  assert.match(html, /<form\b[^>]*\bid=["']heroSearchForm["'][^>]*>/i);
  assert.match(html, /<button\b[^>]*\btype=["']submit["'][^>]*>\s*Explore catalogue\s*<\/button>/i);
  assert.match(html, /\bid=["']heroSearchStatus["'][^>]*\brole=["']status["']/i);

  assert.equal(compactText(elementContents("story-heading")), "Choose with curiosity, not hype.");
  assert.equal((html.match(/\bclass=["']principle["']/g) || []).length, 3);
  assert.match(html, /<h3\b[^>]*>Fiction first<\/h3>/i);
  assert.match(html, /<h3\b[^>]*>Editorial signals<\/h3>/i);
  assert.match(html, /<h3\b[^>]*>Local by default<\/h3>/i);
  assert.match(html, /not real reviews, rankings, or recommendations/i);
  assert.match(html, /no sign-in, analytics, tracking, or network request/i);

  const resultsTag = html.match(/<[^>]+\bid=["']resultsStatus["'][^>]*>/i)?.[0] || "";
  assert.match(resultsTag, /\btabindex=["']-1["']/i);
  assert.doesNotMatch(resultsTag, /\brole=|\baria-live=|\baria-atomic=/i);
});

test("runtime files are local and avoid the removed API path", () => {
  const runtimeFiles = [
    "index.html",
    "genre.html",
    "styles.css",
    "games-data.js",
    "site.js"
  ];

  for (const file of runtimeFiles) {
    const source = read(file);
    assert.doesNotMatch(source, /https?:\/\//i, `${file} should not require a remote resource`);
    assert.doesNotMatch(source, /\bfetch\s*\(/i, `${file} should not call a remote API`);
  }

  const siteScript = read("site.js");
  assert.doesNotMatch(siteScript, /\.innerHTML\b/);
  assert.doesNotMatch(siteScript, /\bRAWG\b/i);
  assert.match(siteScript, /byId\("heroSearchForm"\)/);
  assert.match(siteScript, /addEventListener\("submit"/);
  assert.match(siteScript, /event\.preventDefault\(\)/);
  assert.match(siteScript, /scrollIntoView\(/);
  assert.match(siteScript, /prefers-reduced-motion:\s*reduce/);
  assert.match(siteScript, /behavior:\s*prefersReducedMotion\s*\?\s*"auto"\s*:\s*"smooth"/);
  assert.match(siteScript, /resultsStatus\?\.focus\(\{\s*preventScroll:\s*true\s*\}\)/);
});

test("every literal local page asset exists", () => {
  for (const file of ["index.html", "genre.html"]) {
    const html = read(file);
    const references = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((reference) => !reference.startsWith("#"));

    for (const reference of references) {
      const localPath = reference.split(/[?#]/, 1)[0];
      assert.ok(fs.existsSync(path.join(root, localPath)), `${file} references missing ${localPath}`);
    }
  }

  const heroPath = path.join(root, "assets", "nexus-hero.jpg");
  assert.ok(fs.existsSync(heroPath));
  assert.ok(fs.statSync(heroPath).size > 100_000, "hero artwork should not be an empty placeholder");
});

test("critical interactive selectors are styled", () => {
  const css = read("styles.css");
  const selectors = [
    "site-header__inner", "site-header--overlay", "menu-button", "primary-nav",
    "site-status", "hero__inner", "hero--immersive", "hero-proof",
    "hero__title-emphasis", "catalogue-search", "hero-search__submit",
    "landing-story", "landing-story__inner", "landing-story__title",
    "landing-story__principles", "principle", "featured-game", "genre-link", "game-card",
    "game-art", "game-body", "details-button", "genre-hero__inner",
    "game-dialog__surface", "is-open"
  ];

  for (const selector of selectors) {
    assert.match(css, new RegExp(`\\.${selector}(?![a-zA-Z0-9_-])`), `Missing .${selector}`);
  }
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
