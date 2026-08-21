(function () {
  "use strict";

  const data = window.NEXUS_DATA;

  if (!data || !Array.isArray(data.genres) || !Array.isArray(data.games)) {
    return;
  }

  const byId = (id) => document.getElementById(id);
  const genreBySlug = new Map(data.genres.map((genre) => [genre.slug, genre]));

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (typeof text === "string") {
      element.textContent = text;
    }

    return element;
  }

  function genreName(slug) {
    return genreBySlug.get(slug)?.name || slug;
  }

  function setText(id, value) {
    const element = byId(id);

    if (element) {
      element.textContent = String(value);
    }
  }

  function replaceListItems(id, values, className) {
    const list = byId(id);

    if (!list) {
      return;
    }

    const items = values.map((value) => makeElement("li", className, value));
    list.replaceChildren(...items);
  }

  function initializeYear() {
    setText("currentYear", new Date().getFullYear());
  }

  function initializeMenu() {
    const menuButton = byId("menuButton");
    const primaryNav = byId("primaryNav");

    if (!menuButton || !primaryNav) {
      return;
    }

    const setMenuOpen = (isOpen) => {
      menuButton.setAttribute("aria-expanded", String(isOpen));
      primaryNav.classList.toggle("is-open", isOpen);
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    primaryNav.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        menuButton.focus();
      }
    });
  }

  function initializeDialog() {
    const dialog = byId("gameDialog");

    if (!(dialog instanceof HTMLDialogElement)) {
      return;
    }

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }

  function openGameDialog(game) {
    const dialog = byId("gameDialog");

    if (!(dialog instanceof HTMLDialogElement)) {
      return;
    }

    setText("dialogTitle", game.title);
    setText("dialogGenre", genreName(game.genre));
    setText("dialogDescription", game.description);
    setText("dialogIcon", game.icon);
    replaceListItems(
      "dialogMeta",
      [`Demo score ${game.rating.toFixed(1)} / 10`, `Demo year ${game.year}`, game.badge],
      "meta-item"
    );
    replaceListItems("dialogPlatforms", game.platforms, "platform-tag");

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function createGameCard(game) {
    const card = makeElement("article", "game-card");
    const art = makeElement("div", "game-art");
    const icon = makeElement("span", "game-icon", game.icon);
    const body = makeElement("div", "game-body");
    const category = makeElement("p", "game-genre", genreName(game.genre));
    const title = makeElement("h3", "game-title", game.title);
    const description = makeElement("p", "game-description", game.description);
    const meta = makeElement("div", "game-meta");
    const rating = makeElement("span", "rating", `Demo score ${game.rating.toFixed(1)} / 10`);
    const badge = makeElement("span", "badge", game.badge);
    const actions = makeElement("div", "card-actions");
    const detailsButton = makeElement("button", "details-button", "Details");

    icon.setAttribute("aria-hidden", "true");
    rating.setAttribute("aria-label", `Demo score ${game.rating.toFixed(1)} out of 10`);
    detailsButton.type = "button";
    detailsButton.setAttribute("aria-label", `View details for ${game.title}`);
    detailsButton.dataset.gameId = game.id;
    detailsButton.addEventListener("click", () => openGameDialog(game));

    art.append(icon);
    meta.append(rating, badge);
    actions.append(detailsButton);
    body.append(category, title, description, meta, actions);
    card.append(art, body);

    return card;
  }

  function renderGameCollection(container, games) {
    if (!container) {
      return;
    }

    if (games.length === 0) {
      const emptyState = makeElement("div", "empty-state");
      emptyState.append(
        makeElement("h3", "empty-title", "No demo games found"),
        makeElement("p", "empty-description", "Try a different search or genre filter.")
      );
      container.replaceChildren(emptyState);
      return;
    }

    container.replaceChildren(...games.map(createGameCard));
  }

  function createCategoryLink(genre) {
    const count = data.games.filter((game) => game.genre === genre.slug).length;
    const gameLabel = count === 1 ? "game" : "games";
    const link = makeElement("a", "genre-link");
    const icon = makeElement("span", "genre-icon", genre.icon);
    const name = makeElement("span", "genre-name", genre.name);
    const total = makeElement("span", "genre-count", `${count} ${gameLabel}`);

    link.href = `genre.html?genre=${encodeURIComponent(genre.slug)}`;
    link.setAttribute("aria-label", `Browse ${genre.name}: ${count} demo ${gameLabel}`);
    icon.setAttribute("aria-hidden", "true");
    link.append(icon, name, total);

    return link;
  }

  function renderCategories() {
    const container = byId("categoriesGrid");

    if (container) {
      container.replaceChildren(...data.genres.map(createCategoryLink));
    }
  }

  function renderFeatured() {
    const featured = data.games.find((game) => game.featured) || data.games[0];

    if (!featured) {
      return;
    }

    setText("featuredTitle", featured.title);
    setText("featuredGenre", genreName(featured.genre));
    setText("featuredDescription", featured.description);
    replaceListItems(
      "featuredMeta",
      [
        `Demo score ${featured.rating.toFixed(1)} / 10`,
        `Demo year ${featured.year}`,
        featured.platforms.join(", ")
      ],
      "meta-item"
    );

    const openButton = byId("featuredOpen");
    if (openButton) {
      openButton.setAttribute("aria-label", `View details for ${featured.title}`);
      openButton.addEventListener("click", () => openGameDialog(featured));
    }
  }

  function initializeLanding() {
    setText("gameCount", data.games.length);
    setText("genreCount", data.genres.length);
  }

  function initializeCatalogue() {
    const catalogueSearchForm = byId("catalogueSearchForm");
    const searchInput = byId("catalogueSearchInput");
    const clearSearch = byId("clearCatalogueSearch");
    const filterBar = byId("filterBar");
    const gamesGrid = byId("gamesGrid");
    const resultsStatus = byId("resultsStatus");
    const catalogueSearchStatus = byId("catalogueSearchStatus");
    const exploreSection = byId("explore");
    let activeGenre = "all";
    let query = new URLSearchParams(window.location.search).get("q") || "";

    setText("gameCount", data.games.length);
    setText("genreCount", data.genres.length);
    renderCategories();
    renderFeatured();

    if (searchInput) {
      searchInput.value = query;
    }

    const syncQueryUrl = () => {
      if (!window.history || typeof window.history.replaceState !== "function") {
        return;
      }

      try {
        const nextUrl = new URL(window.location.href);
        const normalizedQuery = query.trim();

        if (normalizedQuery) {
          nextUrl.searchParams.set("q", normalizedQuery);
        } else {
          nextUrl.searchParams.delete("q");
        }

        window.history.replaceState(null, "", nextUrl.href);
      } catch (_error) {
        // Some browsers restrict history updates for directly opened local files.
      }
    };

    const updateResults = () => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchingGames = data.games.filter((game) => {
        const matchesGenre = activeGenre === "all" || game.genre === activeGenre;
        const searchableText = [
          game.title,
          game.description,
          genreName(game.genre),
          ...game.platforms
        ].join(" ").toLowerCase();
        const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

        return matchesGenre && matchesQuery;
      });

      renderGameCollection(gamesGrid, matchingGames);

      if (resultsStatus) {
        const gameLabel = matchingGames.length === 1 ? "game" : "games";
        resultsStatus.textContent = `Showing ${matchingGames.length} demo ${gameLabel}.`;
        if (catalogueSearchStatus) {
          catalogueSearchStatus.textContent = query.trim()
            ? `${matchingGames.length} matching demo ${gameLabel}. Results are listed in Explore.`
            : `${matchingGames.length} demo ${gameLabel} available in the current filter.`;
        }
      }

      if (clearSearch) {
        clearSearch.hidden = query.length === 0;
      }
    };

    if (filterBar) {
      const filterOptions = [
        { slug: "all", name: "All games" },
        ...data.genres.map((genre) => ({ slug: genre.slug, name: genre.name }))
      ];
      const buttons = filterOptions.map((option) => {
        const button = makeElement("button", "filter-button", option.name);
        button.type = "button";
        button.dataset.genre = option.slug;
        button.setAttribute("aria-pressed", String(option.slug === activeGenre));
        button.addEventListener("click", () => {
          activeGenre = option.slug;
          filterBar.querySelectorAll("button[data-genre]").forEach((filterButton) => {
            filterButton.setAttribute(
              "aria-pressed",
              String(filterButton.getAttribute("data-genre") === activeGenre)
            );
          });
          updateResults();
        });
        return button;
      });

      filterBar.replaceChildren(...buttons);
    }

    searchInput?.addEventListener("input", () => {
      query = searchInput.value;
      syncQueryUrl();
      updateResults();
    });

    catalogueSearchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      query = searchInput?.value || "";
      syncQueryUrl();
      updateResults();

      const prefersReducedMotion = typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (exploreSection && typeof exploreSection.scrollIntoView === "function") {
        exploreSection.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }

      resultsStatus?.focus({ preventScroll: true });
    });

    clearSearch?.addEventListener("click", () => {
      query = "";
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      syncQueryUrl();
      updateResults();
    });

    updateResults();
  }

  function renderGenreNotFound(requestedGenre) {
    document.title = "Genre Not Found | NEXUS Demo";
    setText("genreIcon", "?");
    setText("genreTitle", "Genre not found");
    setText(
      "genreDescription",
      requestedGenre
        ? `The local demo catalogue does not include "${requestedGenre}".`
        : "Choose one of the genres from the catalogue page."
    );
    setText("genreResults", "No demo games to show.");

    const grid = byId("genreGamesGrid");
    if (grid) {
      const state = makeElement("div", "empty-state");
      const title = makeElement("h3", "empty-title", "That genre is unavailable");
      const description = makeElement(
        "p",
        "empty-description",
        "This static demo only includes the twelve genres listed on the catalogue page."
      );
      const homeLink = makeElement("a", "home-link", "Return to the catalogue");
      homeLink.href = "catalogue.html";
      state.append(title, description, homeLink);
      grid.replaceChildren(state);
    }
  }

  function initializeGenre() {
    const parameters = new URLSearchParams(window.location.search);
    const requestedGenre = (parameters.get("genre") || "").trim().toLowerCase();
    const genre = genreBySlug.get(requestedGenre);

    if (!genre) {
      renderGenreNotFound(requestedGenre);
      return;
    }

    const games = data.games.filter((game) => game.genre === genre.slug);
    setText("genreIcon", genre.icon);
    setText("genreTitle", genre.name);
    setText("genreDescription", genre.description);
    setText(
      "genreResults",
      `${games.length} fictional demo ${games.length === 1 ? "game" : "games"} in this genre.`
    );
    document.title = `${genre.name} Games | NEXUS Demo`;
    renderGameCollection(byId("genreGamesGrid"), games);
  }

  function initialize() {
    initializeYear();
    initializeMenu();
    initializeDialog();

    if (document.body.dataset.page === "landing") {
      initializeLanding();
    } else if (document.body.dataset.page === "catalogue") {
      initializeCatalogue();
    } else if (document.body.dataset.page === "genre") {
      initializeGenre();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
}());
