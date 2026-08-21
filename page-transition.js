(function () {
  "use strict";

  const root = document.documentElement;
  const storageKey = "nexus-page-curtain";
  const coverDuration = 700;
  const revealDuration = 700;
  const markerLifetime = 10_000;
  let navigationPending = false;
  let activeNavigation = null;

  function motionIsDisabled() {
    if (typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || window.matchMedia("(forced-colors: active)").matches;
  }

  function transitionKey(url) {
    return `${url.origin}${url.pathname}${url.search}${url.hash}`;
  }

  function pageFile(url) {
    const finalSegment = url.pathname.split("/").filter(Boolean).pop();
    return (finalSegment || "index.html").toLowerCase();
  }

  function pageRank(url) {
    const ranks = {
      "index.html": 0,
      "catalogue.html": 1,
      "genre.html": 2
    };

    return ranks[pageFile(url)] ?? 1;
  }

  function cleanLabel(value, fallback) {
    const label = String(value || "")
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .slice(0, 32);

    return label || fallback;
  }

  function pageLabel(url) {
    const file = pageFile(url);
    let label = "PAGE";

    if (file === "index.html") {
      label = "HOME";
    } else if (file === "catalogue.html") {
      const sectionLabels = {
        "#story": "STORY",
        "#genres": "GENRES",
        "#explore": "ALL GAMES"
      };
      label = sectionLabels[url.hash.toLowerCase()] || "CATALOGUE";
    } else if (file === "genre.html") {
      const genre = new URLSearchParams(url.search).get("genre");
      label = cleanLabel(genre, "GENRE");
    }

    return `NEXUS / ${label.toUpperCase()}`;
  }

  function transitionDirection(currentUrl, destinationUrl) {
    return pageRank(destinationUrl) < pageRank(currentUrl) ? "backward" : "forward";
  }

  function setCurtainState(state, direction, label) {
    root.dataset.pageTransition = state;
    root.dataset.pageTransitionDirection = direction;
    root.dataset.pageTransitionLabel = label;
  }

  function clearCurtainState() {
    delete root.dataset.pageTransition;
    delete root.dataset.pageTransitionDirection;
    delete root.dataset.pageTransitionLabel;
  }

  function readEntryMarker() {
    try {
      const storedMarker = window.sessionStorage.getItem(storageKey);
      window.sessionStorage.removeItem(storageKey);

      if (!storedMarker) {
        return null;
      }

      const marker = JSON.parse(storedMarker);
      const markerAge = Date.now() - Number(marker.createdAt);

      if (
        typeof marker.target !== "string"
        || typeof marker.direction !== "string"
        || typeof marker.label !== "string"
        || !Number.isFinite(markerAge)
        || markerAge < 0
        || markerAge > markerLifetime
      ) {
        return null;
      }

      return marker;
    } catch (_error) {
      return null;
    }
  }

  function storeEntryMarker(destinationUrl, direction, label) {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        target: transitionKey(destinationUrl),
        direction,
        label,
        createdAt: Date.now()
      }));
    } catch (_error) {
      // The outgoing cover still works when storage is unavailable.
    }
  }

  function clearEntryMarker() {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch (_error) {
      // Storage can be unavailable for local files in hardened browsers.
    }
  }

  const entryUrl = new URL(window.location.href);
  const entryMarker = readEntryMarker();

  if (
    !motionIsDisabled()
    && entryMarker
    && entryMarker.target === transitionKey(entryUrl)
  ) {
    setCurtainState("covered", entryMarker.direction, entryMarker.label);
  }

  function afterPaint(callback) {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
      return;
    }

    window.setTimeout(callback, 0);
  }

  function revealEntryCurtain() {
    if (root.dataset.pageTransition !== "covered") {
      return;
    }

    afterPaint(() => {
      root.dataset.pageTransition = "revealing";
      window.setTimeout(clearCurtainState, revealDuration + 100);
    });
  }

  function cancelPendingNavigation() {
    if (activeNavigation) {
      activeNavigation.cancelled = true;
      root.removeEventListener("animationend", activeNavigation.handleAnimationEnd);

      if (typeof window.clearTimeout === "function") {
        window.clearTimeout(activeNavigation.timeoutId);
      }

      activeNavigation = null;
    }

    navigationPending = false;
    clearEntryMarker();
    clearCurtainState();
  }

  function destinationForClick(event) {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || !(event.target instanceof Element)
    ) {
      return null;
    }

    const link = event.target.closest("a[href]");

    if (!link || link.hasAttribute("download")) {
      return null;
    }

    const target = (link.getAttribute("target") || "").toLowerCase();
    const rel = (link.getAttribute("rel") || "").toLowerCase().split(/\s+/);

    if ((target && target !== "_self") || rel.includes("external")) {
      return null;
    }

    let destinationUrl;
    let currentUrl;

    try {
      destinationUrl = new URL(link.href, window.location.href);
      currentUrl = new URL(window.location.href);
    } catch (_error) {
      return null;
    }

    if (
      !["http:", "https:", "file:"].includes(destinationUrl.protocol)
      || destinationUrl.origin !== currentUrl.origin
      || (
        destinationUrl.pathname === currentUrl.pathname
        && destinationUrl.search === currentUrl.search
      )
    ) {
      return null;
    }

    return destinationUrl;
  }

  document.addEventListener("click", (event) => {
    const destinationUrl = destinationForClick(event);

    if (!destinationUrl || motionIsDisabled()) {
      return;
    }

    event.preventDefault();

    if (navigationPending) {
      return;
    }

    navigationPending = true;

    const direction = transitionDirection(new URL(window.location.href), destinationUrl);
    const label = pageLabel(destinationUrl);
    const navigation = {
      cancelled: false,
      started: false,
      timeoutId: 0,
      handleAnimationEnd: null
    };

    const navigate = () => {
      if (navigation.cancelled || navigation.started) {
        return;
      }

      navigation.started = true;
      root.removeEventListener("animationend", navigation.handleAnimationEnd);

      if (typeof window.clearTimeout === "function") {
        window.clearTimeout(navigation.timeoutId);
      }

      activeNavigation = null;
      window.location.assign(destinationUrl.href);
    };

    const handleAnimationEnd = (animationEvent) => {
      if (animationEvent.animationName !== "nexus-curtain-cover-forward"
        && animationEvent.animationName !== "nexus-curtain-cover-backward") {
        return;
      }

      navigate();
    };

    navigation.handleAnimationEnd = handleAnimationEnd;
    activeNavigation = navigation;
    storeEntryMarker(destinationUrl, direction, label);
    setCurtainState("covering", direction, label);
    root.addEventListener("animationend", handleAnimationEnd);
    navigation.timeoutId = window.setTimeout(navigate, coverDuration + 150);
  });

  window.addEventListener("pagehide", () => {
    if (activeNavigation && !activeNavigation.started) {
      cancelPendingNavigation();
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      cancelPendingNavigation();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", revealEntryCurtain, { once: true });
  } else {
    revealEntryCurtain();
  }
}());
