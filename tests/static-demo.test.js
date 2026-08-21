const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function compactText(fragment) {
  return fragment
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function elementContents(html, id) {
  const match = html.match(
    new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i")
  );
  assert.ok(match, `Missing element contents for #${id}`);
  return match[2];
}

function loadCatalogue() {
  const context = { window: {} };
  vm.runInNewContext(read("games-data.js"), context, {
    filename: "games-data.js"
  });
  return context.window.NEXUS_DATA;
}

class StubElement {
  constructor(tagName = "div", id = "") {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = "";
    this.textContent = "";
    this.value = "";
    this.hidden = false;
    this.href = "";
    this.type = "";
    this.dataset = {};
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = {
      toggle: () => {},
      add: () => {},
      remove: () => {}
    };
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = children;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) {
      listener(event);
    }
  }

  querySelectorAll(selector) {
    if (selector === "button[data-genre]") {
      return this.children.filter((child) => child.tagName === "BUTTON" && child.dataset.genre);
    }
    return [];
  }

  focus(options) {
    this.focused = true;
    this.focusOptions = options;
  }

  scrollIntoView(options) {
    this.scrollOptions = options;
  }

  closest() {
    return null;
  }
}

class StubDialogElement extends StubElement {
  constructor(id = "") {
    super("dialog", id);
    this.open = false;
  }

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }
}

function runSite(page, { search = "", elementIds = [] } = {}) {
  const elements = Object.fromEntries(
    elementIds.map((id) => [id, new StubElement("div", id)])
  );
  const requestedIds = [];
  const location = {
    href: `https://nexus.test/${page === "landing" ? "index" : page}.html${search}`,
    pathname: `/${page === "landing" ? "index" : page}.html`,
    search,
    hash: ""
  };
  const window = {
    NEXUS_DATA: loadCatalogue(),
    location,
    matchMedia: () => ({ matches: false })
  };
  window.history = {
    replaceState(_state, _title, nextHref) {
      const nextUrl = new URL(nextHref, location.href);
      location.href = nextUrl.href;
      location.pathname = nextUrl.pathname;
      location.search = nextUrl.search;
      location.hash = nextUrl.hash;
    }
  };

  const document = {
    body: { dataset: { page } },
    readyState: "complete",
    title: "NEXUS test",
    getElementById(id) {
      requestedIds.push(id);
      return elements[id] || null;
    },
    createElement(tagName) {
      return new StubElement(tagName);
    },
    addEventListener() {}
  };
  window.document = document;

  vm.runInNewContext(read("site.js"), {
    window,
    document,
    Element: StubElement,
    HTMLDialogElement: StubDialogElement,
    URL,
    URLSearchParams,
    console
  }, { filename: "site.js" });

  return { elements, requestedIds, window };
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

test("runtime dispatch keeps the landing isolated and catalogue search shareable", () => {
  const landing = runSite("landing", {
    elementIds: ["gameCount", "genreCount"]
  });
  assert.equal(landing.elements.gameCount.textContent, "36");
  assert.equal(landing.elements.genreCount.textContent, "12");
  assert.ok(!landing.requestedIds.includes("gamesGrid"));
  assert.ok(!landing.requestedIds.includes("categoriesGrid"));

  const catalogue = runSite("catalogue", {
    search: "?q=Shadow%20Protocol",
    elementIds: [
      "gameCount", "genreCount", "catalogueSearchForm", "catalogueSearchInput",
      "clearCatalogueSearch", "catalogueSearchStatus", "filterBar", "gamesGrid",
      "resultsStatus", "categoriesGrid", "featuredTitle", "featuredGenre",
      "featuredDescription", "featuredMeta", "featuredOpen", "explore"
    ]
  });

  assert.equal(catalogue.elements.catalogueSearchInput.value, "Shadow Protocol");
  assert.equal(catalogue.elements.resultsStatus.textContent, "Showing 1 demo game.");
  assert.equal(catalogue.elements.gamesGrid.children.length, 1);
  assert.equal(catalogue.elements.categoriesGrid.children.length, 12);
  assert.ok(
    catalogue.elements.categoriesGrid.children.every((link) => link.href.startsWith("genre.html?genre="))
  );

  catalogue.elements.clearCatalogueSearch.dispatch("click");
  assert.equal(catalogue.window.location.search, "");
  assert.equal(catalogue.elements.gamesGrid.children.length, 36);
  assert.equal(catalogue.elements.catalogueSearchInput.focused, true);

  catalogue.elements.catalogueSearchInput.value = "Iron Citadel";
  catalogue.elements.catalogueSearchInput.dispatch("input");
  assert.equal(new URL(catalogue.window.location.href).searchParams.get("q"), "Iron Citadel");
  assert.equal(catalogue.elements.gamesGrid.children.length, 1);

  let prevented = false;
  catalogue.elements.catalogueSearchForm.dispatch("submit", {
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(prevented, true);
  assert.equal(catalogue.elements.resultsStatus.focused, true);
  assert.equal(catalogue.elements.resultsStatus.focusOptions.preventScroll, true);
  assert.equal(catalogue.elements.explore.scrollOptions.block, "start");
});

test("invalid genres return to the catalogue with a subordinate heading", () => {
  const genre = runSite("genre", {
    search: "?genre=missing",
    elementIds: [
      "genreIcon", "genreTitle", "genreDescription", "genreResults", "genreGamesGrid"
    ]
  });
  const emptyState = genre.elements.genreGamesGrid.children[0];
  assert.equal(emptyState.children[0].tagName, "H3");
  assert.equal(emptyState.children[2].href, "catalogue.html");
});

test("HTML pages expose the renderer contracts", () => {
  const contracts = {
    "index.html": [
      "menuButton", "primaryNav", "currentYear", "hero-title", "lightfall",
      "gameCount", "genreCount", "enterCatalogue"
    ],
    "catalogue.html": [
      "menuButton", "primaryNav", "gameDialog", "dialogClose",
      "dialogTitle", "dialogGenre", "dialogDescription", "dialogMeta",
      "dialogIcon", "dialogPlatforms", "currentYear", "catalogueSearchInput",
      "clearCatalogueSearch", "catalogueSearchForm", "catalogueSearchStatus",
      "filterBar", "gamesGrid", "resultsStatus", "categoriesGrid", "gameCount",
      "genreCount", "featuredTitle", "featuredGenre", "featuredDescription",
      "featuredMeta", "featuredOpen", "catalogue-title", "story", "story-heading",
      "explore"
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
    const expectedPage = file === "index.html"
      ? "landing"
      : file === "catalogue.html" ? "catalogue" : "genre";
    assert.match(html, new RegExp(`<body\\b[^>]*\\bdata-page=["']${expectedPage}["']`, "i"));
    for (const id of ids) {
      assert.match(html, new RegExp(`\\bid=["']${id}["']`), `${file} is missing #${id}`);
    }
    assert.equal(
      compactText(elementContents(html, "primaryNav")),
      "Story Genres All games",
      `${file} should use the shared navigation concept`
    );
    assert.doesNotMatch(html, /\bclass=["'][^"']*\bsite-status(?:__indicator)?\b/i);
    assert.doesNotMatch(html, /<style\b/i);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${file} should contain one h1`);
  }
});

test("landing page exposes the immersive local-demo composition", () => {
  const html = read("index.html");

  assert.match(html, /<header\b[^>]*\bclass=["'][^"']*\bsite-header--overlay\b/i);
  assert.match(html, /<a\b[^>]*href=["']catalogue\.html#story["'][^>]*>\s*Story\s*<\/a>/i);
  assert.match(html, /<a\b[^>]*href=["']catalogue\.html#genres["'][^>]*>\s*Genres\s*<\/a>/i);
  assert.match(html, /<a\b[^>]*href=["']catalogue\.html#explore["'][^>]*>\s*All games\s*<\/a>/i);
  assert.doesNotMatch(html, /\bclass=["'][^"']*\bsite-status(?:__indicator)?\b/i);

  assert.equal(compactText(elementContents(html, "hero-title")), "NEXUS Game Explorer");
  assert.match(
    elementContents(html, "hero-title"),
    /<span\b[^>]*\bclass=["'][^"']*\bhero__title-emphasis\b[^"']*["'][^>]*>\s*Game Explorer\s*<\/span>/i
  );
  assert.match(html, /\bclass=["'][^"']*\bhero-proof\b[^"']*["']/i);
  assert.match(html, /<script\b[^>]*\bsrc=["']lightfall\.js["'][^>]*>/i);
  assert.match(html, /\bid=["']lightfall["'][^>]*\baria-hidden=["']true["']/i);
  assert.match(html, /id=["']gameCount["'][\s\S]*?fictional games\s*\/[\s\S]*?id=["']genreCount["'][\s\S]*?genres\s*\/\s*locally stored/i);
  assert.match(html, /<a\b[^>]*\bid=["']enterCatalogue["'][^>]*\bhref=["']catalogue\.html["']/i);
  assert.doesNotMatch(html, /\bid=["'](?:story|featured|genres|explore|gameDialog|filterBar|gamesGrid)["']/i);
});

test("catalogue page owns the story, discovery, and search experience", () => {
  const html = read("catalogue.html");

  assert.doesNotMatch(html, /\bsite-header--overlay\b/i);
  assert.doesNotMatch(html, /lightfall\.js|\bid=["']headerLightfall["']/i);
  assert.equal(compactText(elementContents(html, "story-heading")), "Choose with curiosity, not hype.");
  assert.equal((html.match(/\bclass=["']principle["']/g) || []).length, 3);
  assert.match(html, /<h3\b[^>]*>Fiction first<\/h3>/i);
  assert.match(html, /<h3\b[^>]*>Editorial signals<\/h3>/i);
  assert.match(html, /<h3\b[^>]*>Local by default<\/h3>/i);
  assert.match(html, /not real reviews, rankings, or recommendations/i);
  assert.match(html, /no sign-in, analytics, tracking, or network request/i);

  assert.match(html, /<form\b[^>]*\bid=["']catalogueSearchForm["'][^>]*>/i);
  assert.match(html, /<button\b[^>]*\btype=["']submit["'][^>]*>\s*Search games\s*<\/button>/i);
  assert.match(html, /\bid=["']catalogueSearchStatus["'][^>]*\brole=["']status["']/i);

  const resultsTag = html.match(/<[^>]+\bid=["']resultsStatus["'][^>]*>/i)?.[0] || "";
  assert.match(resultsTag, /\btabindex=["']-1["']/i);
  assert.doesNotMatch(resultsTag, /\brole=|\baria-live=|\baria-atomic=/i);
});

test("runtime files are local and avoid the removed API path", () => {
  const runtimeFiles = [
    "index.html",
    "catalogue.html",
    "genre.html",
    "styles.css",
    "page-transition.js",
    "lightfall.js",
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
  assert.match(siteScript, /function initializeLanding\(\)/);
  assert.match(siteScript, /function initializeCatalogue\(\)/);
  assert.match(siteScript, /document\.body\.dataset\.page === "landing"/);
  assert.match(siteScript, /document\.body\.dataset\.page === "catalogue"/);
  assert.match(siteScript, /byId\("catalogueSearchForm"\)/);
  assert.match(siteScript, /byId\("catalogueSearchInput"\)/);
  assert.match(siteScript, /new URLSearchParams\(window\.location\.search\)\.get\("q"\)/);
  assert.match(siteScript, /homeLink\.href = "catalogue\.html"/);
  assert.match(siteScript, /addEventListener\("submit"/);
  assert.match(siteScript, /event\.preventDefault\(\)/);
  assert.match(siteScript, /scrollIntoView\(/);
  assert.match(siteScript, /prefers-reduced-motion:\s*reduce/);
  assert.match(siteScript, /behavior:\s*prefersReducedMotion\s*\?\s*"auto"\s*:\s*"smooth"/);
  assert.match(siteScript, /resultsStatus\?\.focus\(\{\s*preventScroll:\s*true\s*\}\)/);

  const transitionScript = read("page-transition.js");
  assert.match(transitionScript, /sessionStorage\.setItem\(/);
  assert.match(transitionScript, /addEventListener\("click"/);
  assert.match(transitionScript, /window\.location\.assign\(/);
  assert.match(transitionScript, /prefers-reduced-motion:\s*reduce/);
  assert.match(transitionScript, /forced-colors:\s*active/);
  assert.match(transitionScript, /destinationUrl\.origin !== currentUrl\.origin/);
  assert.match(transitionScript, /destinationUrl\.pathname === currentUrl\.pathname/);
  assert.match(transitionScript, /event\.metaKey[\s\S]*event\.ctrlKey[\s\S]*event\.shiftKey/);
  assert.doesNotMatch(transitionScript, /\.innerHTML\b|\bfetch\s*\(/);

  const lightfallScript = read("lightfall.js");
  assert.match(lightfallScript, /querySelectorAll\(["']\[data-lightfall\]["']\)/);
  assert.match(lightfallScript, /closest\(["']\[data-lightfall-surface\]["']\)/);
  assert.match(lightfallScript, /getContext\("webgl"/);
  assert.match(lightfallScript, /prefers-reduced-motion:\s*reduce/);
  assert.match(lightfallScript, /forced-colors:\s*active/);
  assert.match(lightfallScript, /ResizeObserver/);
  assert.match(lightfallScript, /IntersectionObserver/);
  assert.match(lightfallScript, /maxPixelCount/);
  assert.doesNotMatch(lightfallScript, /Math\.max\(\s*0\.5,\s*Math\.min/);
});

test("every local page reference and cross-page fragment resolves", () => {
  for (const file of ["index.html", "catalogue.html", "genre.html"]) {
    const html = read(file);
    const references = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)]
      .map((match) => match[1]);

    for (const reference of references) {
      const hashIndex = reference.indexOf("#");
      const pathAndQuery = hashIndex >= 0 ? reference.slice(0, hashIndex) : reference;
      const fragment = hashIndex >= 0 ? reference.slice(hashIndex + 1) : "";
      const localPath = pathAndQuery.split("?", 1)[0] || file;
      const absolutePath = path.join(root, localPath);
      assert.ok(fs.existsSync(absolutePath), `${file} references missing ${localPath}`);

      if (fragment && /\.html$/i.test(localPath)) {
        const escapedFragment = decodeURIComponent(fragment)
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.match(
          read(localPath),
          new RegExp(`\\bid=["']${escapedFragment}["']`, "i"),
          `${file} references missing #${fragment} in ${localPath}`
        );
      }
    }

    assert.match(html, /<script\b[^>]*src=["']page-transition\.js["'][^>]*><\/script>/i);
  }

  const landingHtml = read("index.html");
  const catalogueHtml = read("catalogue.html");
  const genreHtml = read("genre.html");
  assert.match(landingHtml, /<script\b[^>]*src=["']lightfall\.js["']/i);
  assert.doesNotMatch(catalogueHtml, /<script\b[^>]*src=["']lightfall\.js["']/i);
  assert.doesNotMatch(genreHtml, /<script\b[^>]*src=["']lightfall\.js["']/i);
  assert.doesNotMatch(genreHtml, /index\.html#(?:genres|explore)/i);

  const heroPath = path.join(root, "assets", "nexus-hero.jpg");
  assert.ok(fs.existsSync(heroPath));
  assert.ok(fs.statSync(heroPath).size > 100_000, "hero artwork should not be an empty placeholder");
});

test("critical interactive selectors are styled", () => {
  const css = read("styles.css");
  const selectors = [
    "site-header__inner", "site-header--overlay", "menu-button", "primary-nav",
    "hero__inner", "hero--immersive", "hero-proof",
    "lightfall-container", "lightfall-canvas", "has-lightfall",
    "hero__title-emphasis", "hero-actions", "hero-cta", "catalogue-search",
    "catalogue-search__submit", "catalogue-search-status", "catalogue-hero",
    "catalogue-hero__inner", "catalogue-page-search",
    "landing-story", "landing-story__inner", "landing-story__title",
    "landing-story__principles", "principle", "featured-game", "genre-link", "game-card",
    "game-art", "game-body", "details-button", "genre-hero__inner",
    "game-dialog__surface", "is-open"
  ];

  for (const selector of selectors) {
    assert.match(css, new RegExp(`\\.${selector}(?![a-zA-Z0-9_-])`), `Missing .${selector}`);
  }
  assert.match(css, /html\[data-page-transition=["']covering["']\][\s\S]*::before/);
  assert.match(css, /html\[data-page-transition=["']revealing["']\][\s\S]*::before/);
  assert.match(css, /@keyframes\s+nexus-curtain-cover-forward/);
  assert.match(css, /@keyframes\s+nexus-curtain-reveal-backward/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
