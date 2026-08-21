const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.resolve(__dirname, "..", "page-transition.js"),
  "utf8"
);

class FakeElement {
  constructor(href = "") {
    this.href = href;
    this.attributes = new Map();
  }

  closest(selector) {
    return selector === "a[href]" ? this : null;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  setAttribute(name, value = "") {
    this.attributes.set(name, String(value));
  }
}

class FakeRoot extends FakeElement {
  constructor() {
    super();
    this.dataset = {};
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(type, listeners.filter((candidate) => candidate !== listener));
  }

  dispatch(type, event = {}) {
    for (const listener of [...(this.listeners.get(type) || [])]) {
      listener(event);
    }
  }
}

function createEnvironment({
  href = "https://nexus.test/index.html",
  reducedMotion = false,
  forcedColors = false,
  marker = null
} = {}) {
  const root = new FakeRoot();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const frames = [];
  const timers = [];
  const assigned = [];
  const storage = new Map();

  if (marker) {
    storage.set("nexus-page-curtain", JSON.stringify(marker));
  }

  const document = {
    documentElement: root,
    readyState: "loading",
    addEventListener(type, listener) {
      const listeners = documentListeners.get(type) || [];
      listeners.push(listener);
      documentListeners.set(type, listeners);
    }
  };

  const location = {
    href,
    assign(nextHref) {
      assigned.push(nextHref);
    }
  };

  const window = {
    location,
    sessionStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      }
    },
    matchMedia(query) {
      return {
        matches: query.includes("prefers-reduced-motion")
          ? reducedMotion
          : query.includes("forced-colors") && forcedColors
      };
    },
    requestAnimationFrame(callback) {
      frames.push(callback);
    },
    setTimeout(callback, delay) {
      const timer = { callback, delay, cancelled: false, id: timers.length + 1 };
      timers.push(timer);
      return timer.id;
    },
    clearTimeout(timerId) {
      const timer = timers.find(({ id }) => id === timerId);
      if (timer) {
        timer.cancelled = true;
      }
    },
    addEventListener(type, listener) {
      const listeners = windowListeners.get(type) || [];
      listeners.push(listener);
      windowListeners.set(type, listeners);
    }
  };

  vm.runInNewContext(source, {
    window,
    document,
    Element: FakeElement,
    URL,
    URLSearchParams,
    console
  }, { filename: "page-transition.js" });

  return {
    root,
    window,
    storage,
    frames,
    timers,
    assigned,
    dispatchDocument(type, event) {
      for (const listener of documentListeners.get(type) || []) {
        listener(event);
      }
    },
    dispatchWindow(type, event) {
      for (const listener of windowListeners.get(type) || []) {
        listener(event);
      }
    },
    flushFrames() {
      while (frames.length) {
        frames.shift()();
      }
    },
    flushTimers() {
      for (const timer of timers.splice(0)) {
        if (!timer.cancelled) {
          timer.callback();
        }
      }
    }
  };
}

function clickEvent(target, overrides = {}) {
  const event = {
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target,
    preventDefault() {
      this.defaultPrevented = true;
    },
    ...overrides
  };

  return event;
}

test("cross-page links cover, preserve the destination, and reveal on arrival", () => {
  const outgoing = createEnvironment();
  const link = new FakeElement("https://nexus.test/catalogue.html#genres");
  const event = clickEvent(link);

  outgoing.dispatchDocument("click", event);

  assert.equal(event.defaultPrevented, true);
  assert.equal(outgoing.root.dataset.pageTransition, "covering");
  assert.equal(outgoing.root.dataset.pageTransitionDirection, "forward");
  assert.equal(outgoing.root.dataset.pageTransitionLabel, "NEXUS / GENRES");

  const marker = JSON.parse(outgoing.storage.get("nexus-page-curtain"));
  assert.equal(marker.target, "https://nexus.test/catalogue.html#genres");

  outgoing.root.dispatch("animationend", {
    animationName: "nexus-curtain-cover-forward"
  });
  assert.deepEqual(outgoing.assigned, ["https://nexus.test/catalogue.html#genres"]);

  const incoming = createEnvironment({
    href: "https://nexus.test/catalogue.html#genres",
    marker
  });
  assert.equal(incoming.root.dataset.pageTransition, "covered");

  incoming.dispatchDocument("DOMContentLoaded");
  incoming.flushFrames();
  assert.equal(incoming.root.dataset.pageTransition, "revealing");

  incoming.timers.find(({ delay }) => delay === 800).callback();
  assert.equal(incoming.root.dataset.pageTransition, undefined);
});

test("backward links mirror the curtain and label the incoming page", () => {
  const environment = createEnvironment({
    href: "https://nexus.test/genre.html?genre=action"
  });
  const link = new FakeElement("https://nexus.test/catalogue.html#story");
  const event = clickEvent(link);

  environment.dispatchDocument("click", event);

  assert.equal(event.defaultPrevented, true);
  assert.equal(environment.root.dataset.pageTransitionDirection, "backward");
  assert.equal(environment.root.dataset.pageTransitionLabel, "NEXUS / STORY");
});

test("same-document fragments remain native after the URL changes in place", () => {
  const environment = createEnvironment({
    href: "https://nexus.test/catalogue.html"
  });
  environment.window.location.href = "https://nexus.test/catalogue.html?q=void";

  const link = new FakeElement("https://nexus.test/catalogue.html?q=void#explore");
  const event = clickEvent(link);
  environment.dispatchDocument("click", event);

  assert.equal(event.defaultPrevented, false);
  assert.equal(environment.root.dataset.pageTransition, undefined);
  assert.deepEqual(environment.assigned, []);
});

test("modified, external, download, and new-tab links are not intercepted", () => {
  const cases = [
    { overrides: { ctrlKey: true } },
    { overrides: { button: 1 } },
    { href: "https://example.com/catalogue.html" },
    { attribute: ["download", ""] },
    { attribute: ["target", "_blank"] },
    { attribute: ["rel", "external"] }
  ];

  for (const testCase of cases) {
    const environment = createEnvironment();
    const link = new FakeElement(testCase.href || "https://nexus.test/catalogue.html");

    if (testCase.attribute) {
      link.setAttribute(...testCase.attribute);
    }

    const event = clickEvent(link, testCase.overrides);
    environment.dispatchDocument("click", event);

    assert.equal(event.defaultPrevented, false);
    assert.equal(environment.root.dataset.pageTransition, undefined);
  }
});

test("a click already handled by page code never starts the curtain", () => {
  const environment = createEnvironment();
  const link = new FakeElement("https://nexus.test/catalogue.html");
  const event = clickEvent(link, { defaultPrevented: true });

  environment.dispatchDocument("click", event);

  assert.equal(environment.root.dataset.pageTransition, undefined);
  assert.equal(environment.storage.has("nexus-page-curtain"), false);
  assert.deepEqual(environment.assigned, []);
});

test("reduced motion and forced colors leave navigation to the browser", () => {
  for (const preference of [
    { reducedMotion: true },
    { forcedColors: true }
  ]) {
    const environment = createEnvironment(preference);
    const link = new FakeElement("https://nexus.test/catalogue.html");
    const event = clickEvent(link);

    environment.dispatchDocument("click", event);

    assert.equal(event.defaultPrevented, false);
    assert.equal(environment.root.dataset.pageTransition, undefined);
    assert.deepEqual(environment.assigned, []);
  }
});

test("BFCache restoration clears a curtain left by the outgoing page", () => {
  const environment = createEnvironment();
  const event = clickEvent(new FakeElement("https://nexus.test/catalogue.html"));

  environment.dispatchDocument("click", event);
  assert.equal(environment.root.dataset.pageTransition, "covering");

  environment.dispatchWindow("pagehide", { persisted: true });
  environment.dispatchWindow("pageshow", { persisted: true });
  assert.equal(environment.root.dataset.pageTransition, undefined);
  assert.equal(environment.storage.has("nexus-page-curtain"), false);

  environment.root.dispatch("animationend", {
    animationName: "nexus-curtain-cover-forward"
  });
  environment.flushTimers();
  assert.deepEqual(environment.assigned, []);

  const freshEvent = clickEvent(new FakeElement("https://nexus.test/catalogue.html"));
  environment.dispatchDocument("click", freshEvent);
  assert.equal(freshEvent.defaultPrevented, true);
  assert.equal(environment.root.dataset.pageTransition, "covering");
});
