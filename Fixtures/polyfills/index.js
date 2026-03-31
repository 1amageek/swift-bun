// Web API polyfills for JavaScriptCore (evaluateScript context).
//
// JSCore provides only ECMAScript language features (Promise, Symbol, etc.)
// but no Web APIs. This bundle provides the Web APIs that cli.js and other
// Bun-built bundles expect to exist.
//
// Bundled with esbuild and loaded by BunProcess before ESMResolver.

// --- Web Streams API ---
require("web-streams-polyfill/polyfill");

// --- Event / EventTarget / CustomEvent ---
if (typeof globalThis.Event === "undefined") {
  function Event(type, options) {
    options = options || {};
    this.type = type;
    this.bubbles = !!options.bubbles;
    this.cancelable = !!options.cancelable;
    this.composed = !!options.composed;
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
    this.eventPhase = 0;
    this.timeStamp = Date.now();
    this.isTrusted = false;
  }
  Event.prototype.preventDefault = function () {
    if (this.cancelable) this.defaultPrevented = true;
  };
  Event.prototype.stopPropagation = function () {};
  Event.prototype.stopImmediatePropagation = function () {};
  Event.NONE = 0;
  Event.CAPTURING_PHASE = 1;
  Event.AT_TARGET = 2;
  Event.BUBBLING_PHASE = 3;
  globalThis.Event = Event;
}

if (typeof globalThis.EventTarget === "undefined") {
  function EventTarget() {
    this._listeners = {};
  }
  EventTarget.prototype.addEventListener = function (type, fn, options) {
    if (!fn) return;
    if (!this._listeners[type]) this._listeners[type] = [];
    var once = options && (options.once || options === true);
    var entry = { fn: fn, once: once };
    this._listeners[type].push(entry);
  };
  EventTarget.prototype.removeEventListener = function (type, fn) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter(function (e) {
      return e.fn !== fn;
    });
  };
  EventTarget.prototype.dispatchEvent = function (event) {
    event.target = this;
    event.currentTarget = this;
    var entries = (this._listeners[event.type] || []).slice();
    var toRemove = [];
    for (var i = 0; i < entries.length; i++) {
      entries[i].fn.call(this, event);
      if (entries[i].once) toRemove.push(entries[i]);
    }
    for (var j = 0; j < toRemove.length; j++) {
      this.removeEventListener(event.type, toRemove[j].fn);
    }
    return !event.defaultPrevented;
  };
  globalThis.EventTarget = EventTarget;
}

if (typeof globalThis.CustomEvent === "undefined") {
  function CustomEvent(type, options) {
    Event.call(this, type, options);
    this.detail = (options && options.detail) !== undefined ? options.detail : null;
  }
  CustomEvent.prototype = Object.create(Event.prototype);
  CustomEvent.prototype.constructor = CustomEvent;
  globalThis.CustomEvent = CustomEvent;
}

// --- structuredClone ---
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = function (obj) {
    if (obj === undefined) return undefined;
    return JSON.parse(JSON.stringify(obj));
  };
}

// --- navigator ---
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = {
    userAgent: "swift-bun",
    platform: "darwin",
    language: "en",
    languages: ["en"],
  };
}
