var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/web-streams-polyfill/dist/polyfill.js
var require_polyfill = __commonJS({
  "node_modules/web-streams-polyfill/dist/polyfill.js"() {
    !(function() {
      "use strict";
      function e() {
      }
      function t(e2) {
        return "object" == typeof e2 && null !== e2 || "function" == typeof e2;
      }
      const r = e;
      function o(e2, t2) {
        try {
          Object.defineProperty(e2, "name", { value: t2, configurable: true });
        } catch (e3) {
        }
      }
      const n = Promise, a = Promise.resolve.bind(n), i = Promise.prototype.then, l = Promise.reject.bind(n), s = a;
      function u(e2) {
        return new n(e2);
      }
      function c(e2) {
        return u((t2) => t2(e2));
      }
      function d(e2) {
        return l(e2);
      }
      function f(e2, t2, r2) {
        return i.call(e2, t2, r2);
      }
      function b(e2, t2, o2) {
        f(f(e2, t2, o2), void 0, r);
      }
      function h(e2, t2) {
        b(e2, t2);
      }
      function m(e2, t2) {
        b(e2, void 0, t2);
      }
      function _(e2, t2, r2) {
        return f(e2, t2, r2);
      }
      function p(e2) {
        f(e2, void 0, r);
      }
      let y = (e2) => {
        if ("function" == typeof queueMicrotask) y = queueMicrotask;
        else {
          const e3 = c(void 0);
          y = (t2) => f(e3, t2);
        }
        return y(e2);
      };
      function S(e2, t2, r2) {
        if ("function" != typeof e2) throw new TypeError("Argument is not a function");
        return Function.prototype.apply.call(e2, t2, r2);
      }
      function g(e2, t2, r2) {
        try {
          return c(S(e2, t2, r2));
        } catch (e3) {
          return d(e3);
        }
      }
      class v {
        constructor() {
          this._cursor = 0, this._size = 0, this._front = { _elements: [], _next: void 0 }, this._back = this._front, this._cursor = 0, this._size = 0;
        }
        get length() {
          return this._size;
        }
        push(e2) {
          const t2 = this._back;
          let r2 = t2;
          16383 === t2._elements.length && (r2 = { _elements: [], _next: void 0 }), t2._elements.push(e2), r2 !== t2 && (this._back = r2, t2._next = r2), ++this._size;
        }
        shift() {
          const e2 = this._front;
          let t2 = e2;
          const r2 = this._cursor;
          let o2 = r2 + 1;
          const n2 = e2._elements, a2 = n2[r2];
          return 16384 === o2 && (t2 = e2._next, o2 = 0), --this._size, this._cursor = o2, e2 !== t2 && (this._front = t2), n2[r2] = void 0, a2;
        }
        forEach(e2) {
          let t2 = this._cursor, r2 = this._front, o2 = r2._elements;
          for (; !(t2 === o2.length && void 0 === r2._next || t2 === o2.length && (r2 = r2._next, o2 = r2._elements, t2 = 0, 0 === o2.length)); ) e2(o2[t2]), ++t2;
        }
        peek() {
          const e2 = this._front, t2 = this._cursor;
          return e2._elements[t2];
        }
      }
      const w = /* @__PURE__ */ Symbol("[[AbortSteps]]"), R = /* @__PURE__ */ Symbol("[[ErrorSteps]]"), T = /* @__PURE__ */ Symbol("[[CancelSteps]]"), C = /* @__PURE__ */ Symbol("[[PullSteps]]"), P = /* @__PURE__ */ Symbol("[[ReleaseSteps]]");
      function q(e2, t2) {
        e2._ownerReadableStream = t2, t2._reader = e2, "readable" === t2._state ? B(e2) : "closed" === t2._state ? (function(e3) {
          B(e3), A(e3);
        })(e2) : j(e2, t2._storedError);
      }
      function E(e2, t2) {
        return Or(e2._ownerReadableStream, t2);
      }
      function W(e2) {
        const t2 = e2._ownerReadableStream;
        "readable" === t2._state ? k(e2, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : (function(e3, t3) {
          j(e3, t3);
        })(e2, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), t2._readableStreamController[P](), t2._reader = void 0, e2._ownerReadableStream = void 0;
      }
      function O(e2) {
        return new TypeError("Cannot " + e2 + " a stream using a released reader");
      }
      function B(e2) {
        e2._closedPromise = u((t2, r2) => {
          e2._closedPromise_resolve = t2, e2._closedPromise_reject = r2;
        });
      }
      function j(e2, t2) {
        B(e2), k(e2, t2);
      }
      function k(e2, t2) {
        void 0 !== e2._closedPromise_reject && (p(e2._closedPromise), e2._closedPromise_reject(t2), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0);
      }
      function A(e2) {
        void 0 !== e2._closedPromise_resolve && (e2._closedPromise_resolve(void 0), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0);
      }
      const z = Number.isFinite || function(e2) {
        return "number" == typeof e2 && isFinite(e2);
      }, D = Math.trunc || function(e2) {
        return e2 < 0 ? Math.ceil(e2) : Math.floor(e2);
      };
      function L(e2, t2) {
        if (void 0 !== e2 && ("object" != typeof (r2 = e2) && "function" != typeof r2)) throw new TypeError(`${t2} is not an object.`);
        var r2;
      }
      function F(e2, t2) {
        if ("function" != typeof e2) throw new TypeError(`${t2} is not a function.`);
      }
      function I(e2, t2) {
        if (!/* @__PURE__ */ (function(e3) {
          return "object" == typeof e3 && null !== e3 || "function" == typeof e3;
        })(e2)) throw new TypeError(`${t2} is not an object.`);
      }
      function $(e2, t2, r2) {
        if (void 0 === e2) throw new TypeError(`Parameter ${t2} is required in '${r2}'.`);
      }
      function M(e2, t2, r2) {
        if (void 0 === e2) throw new TypeError(`${t2} is required in '${r2}'.`);
      }
      function Y(e2) {
        return Number(e2);
      }
      function Q(e2) {
        return 0 === e2 ? 0 : e2;
      }
      function x(e2, t2) {
        const r2 = Number.MAX_SAFE_INTEGER;
        let o2 = Number(e2);
        if (o2 = Q(o2), !z(o2)) throw new TypeError(`${t2} is not a finite number`);
        if (o2 = (function(e3) {
          return Q(D(e3));
        })(o2), o2 < 0 || o2 > r2) throw new TypeError(`${t2} is outside the accepted range of 0 to ${r2}, inclusive`);
        return z(o2) && 0 !== o2 ? o2 : 0;
      }
      function N(e2, t2) {
        if (!Er(e2)) throw new TypeError(`${t2} is not a ReadableStream.`);
      }
      function H(e2) {
        return new ReadableStreamDefaultReader(e2);
      }
      function V(e2, t2) {
        e2._reader._readRequests.push(t2);
      }
      function U(e2, t2, r2) {
        const o2 = e2._reader._readRequests.shift();
        r2 ? o2._closeSteps() : o2._chunkSteps(t2);
      }
      function G(e2) {
        return e2._reader._readRequests.length;
      }
      function X(e2) {
        const t2 = e2._reader;
        return void 0 !== t2 && !!J(t2);
      }
      class ReadableStreamDefaultReader {
        constructor(e2) {
          if ($(e2, 1, "ReadableStreamDefaultReader"), N(e2, "First parameter"), Wr(e2)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          q(this, e2), this._readRequests = new v();
        }
        get closed() {
          return J(this) ? this._closedPromise : d(ee("closed"));
        }
        cancel(e2 = void 0) {
          return J(this) ? void 0 === this._ownerReadableStream ? d(O("cancel")) : E(this, e2) : d(ee("cancel"));
        }
        read() {
          if (!J(this)) return d(ee("read"));
          if (void 0 === this._ownerReadableStream) return d(O("read from"));
          let e2, t2;
          const r2 = u((r3, o2) => {
            e2 = r3, t2 = o2;
          });
          return K(this, { _chunkSteps: (t3) => e2({ value: t3, done: false }), _closeSteps: () => e2({ value: void 0, done: true }), _errorSteps: (e3) => t2(e3) }), r2;
        }
        releaseLock() {
          if (!J(this)) throw ee("releaseLock");
          void 0 !== this._ownerReadableStream && (function(e2) {
            W(e2);
            const t2 = new TypeError("Reader was released");
            Z(e2, t2);
          })(this);
        }
      }
      function J(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_readRequests") && e2 instanceof ReadableStreamDefaultReader);
      }
      function K(e2, t2) {
        const r2 = e2._ownerReadableStream;
        r2._disturbed = true, "closed" === r2._state ? t2._closeSteps() : "errored" === r2._state ? t2._errorSteps(r2._storedError) : r2._readableStreamController[C](t2);
      }
      function Z(e2, t2) {
        const r2 = e2._readRequests;
        e2._readRequests = new v(), r2.forEach((e3) => {
          e3._errorSteps(t2);
        });
      }
      function ee(e2) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${e2} can only be used on a ReadableStreamDefaultReader`);
      }
      var te, re, oe;
      function ne(e2) {
        return e2.slice();
      }
      function ae(e2, t2, r2, o2, n2) {
        new Uint8Array(e2).set(new Uint8Array(r2, o2, n2), t2);
      }
      Object.defineProperties(ReadableStreamDefaultReader.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), o(ReadableStreamDefaultReader.prototype.cancel, "cancel"), o(ReadableStreamDefaultReader.prototype.read, "read"), o(ReadableStreamDefaultReader.prototype.releaseLock, "releaseLock"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(ReadableStreamDefaultReader.prototype, Symbol.toStringTag, { value: "ReadableStreamDefaultReader", configurable: true });
      let ie = (e2) => (ie = "function" == typeof e2.transfer ? (e3) => e3.transfer() : "function" == typeof structuredClone ? (e3) => structuredClone(e3, { transfer: [e3] }) : (e3) => e3, ie(e2)), le = (e2) => (le = "boolean" == typeof e2.detached ? (e3) => e3.detached : (e3) => 0 === e3.byteLength, le(e2));
      function se(e2, t2, r2) {
        if (e2.slice) return e2.slice(t2, r2);
        const o2 = r2 - t2, n2 = new ArrayBuffer(o2);
        return ae(n2, 0, e2, t2, o2), n2;
      }
      function ue(e2, t2) {
        const r2 = e2[t2];
        if (null != r2) {
          if ("function" != typeof r2) throw new TypeError(`${String(t2)} is not a function`);
          return r2;
        }
      }
      function ce(e2) {
        try {
          const t2 = e2.done, r2 = e2.value;
          return f(s(r2), (e3) => ({ done: t2, value: e3 }));
        } catch (e3) {
          return d(e3);
        }
      }
      const de = null !== (oe = null !== (te = Symbol.asyncIterator) && void 0 !== te ? te : null === (re = Symbol.for) || void 0 === re ? void 0 : re.call(Symbol, "Symbol.asyncIterator")) && void 0 !== oe ? oe : "@@asyncIterator";
      function fe(e2, r2 = "sync", o2) {
        if (void 0 === o2) if ("async" === r2) {
          if (void 0 === (o2 = ue(e2, de))) {
            return (function(e3) {
              const r3 = { next() {
                let t2;
                try {
                  t2 = be(e3);
                } catch (e4) {
                  return d(e4);
                }
                return ce(t2);
              }, return(r4) {
                let o3;
                try {
                  const t2 = ue(e3.iterator, "return");
                  if (void 0 === t2) return c({ done: true, value: r4 });
                  o3 = S(t2, e3.iterator, [r4]);
                } catch (e4) {
                  return d(e4);
                }
                return t(o3) ? ce(o3) : d(new TypeError("The iterator.return() method must return an object"));
              } };
              return { iterator: r3, nextMethod: r3.next, done: false };
            })(fe(e2, "sync", ue(e2, Symbol.iterator)));
          }
        } else o2 = ue(e2, Symbol.iterator);
        if (void 0 === o2) throw new TypeError("The object is not iterable");
        const n2 = S(o2, e2, []);
        if (!t(n2)) throw new TypeError("The iterator method must return an object");
        return { iterator: n2, nextMethod: n2.next, done: false };
      }
      function be(e2) {
        const r2 = S(e2.nextMethod, e2.iterator, []);
        if (!t(r2)) throw new TypeError("The iterator.next() method must return an object");
        return r2;
      }
      class he {
        constructor(e2, t2) {
          this._ongoingPromise = void 0, this._isFinished = false, this._reader = e2, this._preventCancel = t2;
        }
        next() {
          const e2 = () => this._nextSteps();
          return this._ongoingPromise = this._ongoingPromise ? _(this._ongoingPromise, e2, e2) : e2(), this._ongoingPromise;
        }
        return(e2) {
          const t2 = () => this._returnSteps(e2);
          return this._ongoingPromise = this._ongoingPromise ? _(this._ongoingPromise, t2, t2) : t2(), this._ongoingPromise;
        }
        _nextSteps() {
          if (this._isFinished) return Promise.resolve({ value: void 0, done: true });
          const e2 = this._reader;
          let t2, r2;
          const o2 = u((e3, o3) => {
            t2 = e3, r2 = o3;
          });
          return K(e2, { _chunkSteps: (e3) => {
            this._ongoingPromise = void 0, y(() => t2({ value: e3, done: false }));
          }, _closeSteps: () => {
            this._ongoingPromise = void 0, this._isFinished = true, W(e2), t2({ value: void 0, done: true });
          }, _errorSteps: (t3) => {
            this._ongoingPromise = void 0, this._isFinished = true, W(e2), r2(t3);
          } }), o2;
        }
        _returnSteps(e2) {
          if (this._isFinished) return Promise.resolve({ value: e2, done: true });
          this._isFinished = true;
          const t2 = this._reader;
          if (!this._preventCancel) {
            const r2 = E(t2, e2);
            return W(t2), _(r2, () => ({ value: e2, done: true }));
          }
          return W(t2), c({ value: e2, done: true });
        }
      }
      const me = { next() {
        return _e(this) ? this._asyncIteratorImpl.next() : d(pe("next"));
      }, return(e2) {
        return _e(this) ? this._asyncIteratorImpl.return(e2) : d(pe("return"));
      }, [de]() {
        return this;
      } };
      function _e(e2) {
        if (!t(e2)) return false;
        if (!Object.prototype.hasOwnProperty.call(e2, "_asyncIteratorImpl")) return false;
        try {
          return e2._asyncIteratorImpl instanceof he;
        } catch (e3) {
          return false;
        }
      }
      function pe(e2) {
        return new TypeError(`ReadableStreamAsyncIterator.${e2} can only be used on a ReadableSteamAsyncIterator`);
      }
      Object.defineProperty(me, de, { enumerable: false });
      const ye = Number.isNaN || function(e2) {
        return e2 != e2;
      };
      function Se(e2) {
        const t2 = se(e2.buffer, e2.byteOffset, e2.byteOffset + e2.byteLength);
        return new Uint8Array(t2);
      }
      function ge(e2) {
        const t2 = e2._queue.shift();
        return e2._queueTotalSize -= t2.size, e2._queueTotalSize < 0 && (e2._queueTotalSize = 0), t2.value;
      }
      function ve(e2, t2, r2) {
        if ("number" != typeof (o2 = r2) || ye(o2) || o2 < 0 || r2 === 1 / 0) throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        var o2;
        e2._queue.push({ value: t2, size: r2 }), e2._queueTotalSize += r2;
      }
      function we(e2) {
        e2._queue = new v(), e2._queueTotalSize = 0;
      }
      function Re(e2) {
        return e2 === DataView;
      }
      class ReadableStreamBYOBRequest {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get view() {
          if (!Ce(this)) throw Ke("view");
          return this._view;
        }
        respond(e2) {
          if (!Ce(this)) throw Ke("respond");
          if ($(e2, 1, "respond"), e2 = x(e2, "First parameter"), void 0 === this._associatedReadableByteStreamController) throw new TypeError("This BYOB request has been invalidated");
          if (le(this._view.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be used as a response");
          Ge(this._associatedReadableByteStreamController, e2);
        }
        respondWithNewView(e2) {
          if (!Ce(this)) throw Ke("respondWithNewView");
          if ($(e2, 1, "respondWithNewView"), !ArrayBuffer.isView(e2)) throw new TypeError("You can only respond with array buffer views");
          if (void 0 === this._associatedReadableByteStreamController) throw new TypeError("This BYOB request has been invalidated");
          if (le(e2.buffer)) throw new TypeError("The given view's buffer has been detached and so cannot be used as a response");
          Xe(this._associatedReadableByteStreamController, e2);
        }
      }
      Object.defineProperties(ReadableStreamBYOBRequest.prototype, { respond: { enumerable: true }, respondWithNewView: { enumerable: true }, view: { enumerable: true } }), o(ReadableStreamBYOBRequest.prototype.respond, "respond"), o(ReadableStreamBYOBRequest.prototype.respondWithNewView, "respondWithNewView"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(ReadableStreamBYOBRequest.prototype, Symbol.toStringTag, { value: "ReadableStreamBYOBRequest", configurable: true });
      class ReadableByteStreamController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get byobRequest() {
          if (!Te(this)) throw Ze("byobRequest");
          return Ve(this);
        }
        get desiredSize() {
          if (!Te(this)) throw Ze("desiredSize");
          return Ue(this);
        }
        close() {
          if (!Te(this)) throw Ze("close");
          if (this._closeRequested) throw new TypeError("The stream has already been closed; do not close it again!");
          const e2 = this._controlledReadableByteStream._state;
          if ("readable" !== e2) throw new TypeError(`The stream (in ${e2} state) is not in the readable state and cannot be closed`);
          Qe(this);
        }
        enqueue(e2) {
          if (!Te(this)) throw Ze("enqueue");
          if ($(e2, 1, "enqueue"), !ArrayBuffer.isView(e2)) throw new TypeError("chunk must be an array buffer view");
          if (0 === e2.byteLength) throw new TypeError("chunk must have non-zero byteLength");
          if (0 === e2.buffer.byteLength) throw new TypeError("chunk's buffer must have non-zero byteLength");
          if (this._closeRequested) throw new TypeError("stream is closed or draining");
          const t2 = this._controlledReadableByteStream._state;
          if ("readable" !== t2) throw new TypeError(`The stream (in ${t2} state) is not in the readable state and cannot be enqueued to`);
          xe(this, e2);
        }
        error(e2 = void 0) {
          if (!Te(this)) throw Ze("error");
          Ne(this, e2);
        }
        [T](e2) {
          qe(this), we(this);
          const t2 = this._cancelAlgorithm(e2);
          return Ye(this), t2;
        }
        [C](e2) {
          const t2 = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) return void He(this, e2);
          const r2 = this._autoAllocateChunkSize;
          if (void 0 !== r2) {
            let t3;
            try {
              t3 = new ArrayBuffer(r2);
            } catch (t4) {
              return void e2._errorSteps(t4);
            }
            const o2 = { buffer: t3, bufferByteLength: r2, byteOffset: 0, byteLength: r2, bytesFilled: 0, minimumFill: 1, elementSize: 1, viewConstructor: Uint8Array, readerType: "default" };
            this._pendingPullIntos.push(o2);
          }
          V(t2, e2), Pe(this);
        }
        [P]() {
          if (this._pendingPullIntos.length > 0) {
            const e2 = this._pendingPullIntos.peek();
            e2.readerType = "none", this._pendingPullIntos = new v(), this._pendingPullIntos.push(e2);
          }
        }
      }
      function Te(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledReadableByteStream") && e2 instanceof ReadableByteStreamController);
      }
      function Ce(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_associatedReadableByteStreamController") && e2 instanceof ReadableStreamBYOBRequest);
      }
      function Pe(e2) {
        const t2 = (function(e3) {
          const t3 = e3._controlledReadableByteStream;
          if ("readable" !== t3._state) return false;
          if (e3._closeRequested) return false;
          if (!e3._started) return false;
          if (X(t3) && G(t3) > 0) return true;
          if (nt(t3) && ot(t3) > 0) return true;
          const r2 = Ue(e3);
          if (r2 > 0) return true;
          return false;
        })(e2);
        if (!t2) return;
        if (e2._pulling) return void (e2._pullAgain = true);
        e2._pulling = true;
        b(e2._pullAlgorithm(), () => (e2._pulling = false, e2._pullAgain && (e2._pullAgain = false, Pe(e2)), null), (t3) => (Ne(e2, t3), null));
      }
      function qe(e2) {
        Le(e2), e2._pendingPullIntos = new v();
      }
      function Ee(e2, t2) {
        let r2 = false;
        "closed" === e2._state && (r2 = true);
        const o2 = Oe(t2);
        "default" === t2.readerType ? U(e2, o2, r2) : (function(e3, t3, r3) {
          const o3 = e3._reader, n2 = o3._readIntoRequests.shift();
          r3 ? n2._closeSteps(t3) : n2._chunkSteps(t3);
        })(e2, o2, r2);
      }
      function We(e2, t2) {
        for (let r2 = 0; r2 < t2.length; ++r2) Ee(e2, t2[r2]);
      }
      function Oe(e2) {
        const t2 = e2.bytesFilled, r2 = e2.elementSize;
        return new e2.viewConstructor(e2.buffer, e2.byteOffset, t2 / r2);
      }
      function Be(e2, t2, r2, o2) {
        e2._queue.push({ buffer: t2, byteOffset: r2, byteLength: o2 }), e2._queueTotalSize += o2;
      }
      function je(e2, t2, r2, o2) {
        let n2;
        try {
          n2 = se(t2, r2, r2 + o2);
        } catch (t3) {
          throw Ne(e2, t3), t3;
        }
        Be(e2, n2, 0, o2);
      }
      function ke(e2, t2) {
        t2.bytesFilled > 0 && je(e2, t2.buffer, t2.byteOffset, t2.bytesFilled), Me(e2);
      }
      function Ae(e2, t2) {
        const r2 = Math.min(e2._queueTotalSize, t2.byteLength - t2.bytesFilled), o2 = t2.bytesFilled + r2;
        let n2 = r2, a2 = false;
        const i2 = o2 - o2 % t2.elementSize;
        i2 >= t2.minimumFill && (n2 = i2 - t2.bytesFilled, a2 = true);
        const l2 = e2._queue;
        for (; n2 > 0; ) {
          const r3 = l2.peek(), o3 = Math.min(n2, r3.byteLength), a3 = t2.byteOffset + t2.bytesFilled;
          ae(t2.buffer, a3, r3.buffer, r3.byteOffset, o3), r3.byteLength === o3 ? l2.shift() : (r3.byteOffset += o3, r3.byteLength -= o3), e2._queueTotalSize -= o3, ze(e2, o3, t2), n2 -= o3;
        }
        return a2;
      }
      function ze(e2, t2, r2) {
        r2.bytesFilled += t2;
      }
      function De(e2) {
        0 === e2._queueTotalSize && e2._closeRequested ? (Ye(e2), Br(e2._controlledReadableByteStream)) : Pe(e2);
      }
      function Le(e2) {
        null !== e2._byobRequest && (e2._byobRequest._associatedReadableByteStreamController = void 0, e2._byobRequest._view = null, e2._byobRequest = null);
      }
      function Fe(e2) {
        const t2 = [];
        for (; e2._pendingPullIntos.length > 0 && 0 !== e2._queueTotalSize; ) {
          const r2 = e2._pendingPullIntos.peek();
          Ae(e2, r2) && (Me(e2), t2.push(r2));
        }
        return t2;
      }
      function Ie(e2, t2, r2, o2) {
        const n2 = e2._controlledReadableByteStream, a2 = t2.constructor, i2 = (function(e3) {
          return Re(e3) ? 1 : e3.BYTES_PER_ELEMENT;
        })(a2), { byteOffset: l2, byteLength: s2 } = t2, u2 = r2 * i2;
        let c2;
        try {
          c2 = ie(t2.buffer);
        } catch (e3) {
          return void o2._errorSteps(e3);
        }
        const d2 = { buffer: c2, bufferByteLength: c2.byteLength, byteOffset: l2, byteLength: s2, bytesFilled: 0, minimumFill: u2, elementSize: i2, viewConstructor: a2, readerType: "byob" };
        if (e2._pendingPullIntos.length > 0) return e2._pendingPullIntos.push(d2), void rt(n2, o2);
        if ("closed" === n2._state) {
          const e3 = new a2(d2.buffer, d2.byteOffset, 0);
          return void o2._closeSteps(e3);
        }
        if (e2._queueTotalSize > 0) {
          if (Ae(e2, d2)) {
            const t3 = Oe(d2);
            return De(e2), void o2._chunkSteps(t3);
          }
          if (e2._closeRequested) {
            const t3 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            return Ne(e2, t3), void o2._errorSteps(t3);
          }
        }
        e2._pendingPullIntos.push(d2), rt(n2, o2), Pe(e2);
      }
      function $e(e2, t2) {
        const r2 = e2._pendingPullIntos.peek();
        Le(e2);
        "closed" === e2._controlledReadableByteStream._state ? (function(e3, t3) {
          "none" === t3.readerType && Me(e3);
          const r3 = e3._controlledReadableByteStream;
          if (nt(r3)) {
            const t4 = [];
            for (; t4.length < ot(r3); ) t4.push(Me(e3));
            We(r3, t4);
          }
        })(e2, r2) : (function(e3, t3, r3) {
          if (ze(0, t3, r3), "none" === r3.readerType) {
            ke(e3, r3);
            const t4 = Fe(e3);
            return void We(e3._controlledReadableByteStream, t4);
          }
          if (r3.bytesFilled < r3.minimumFill) return;
          Me(e3);
          const o2 = r3.bytesFilled % r3.elementSize;
          if (o2 > 0) {
            const t4 = r3.byteOffset + r3.bytesFilled;
            je(e3, r3.buffer, t4 - o2, o2);
          }
          r3.bytesFilled -= o2;
          const n2 = Fe(e3);
          Ee(e3._controlledReadableByteStream, r3), We(e3._controlledReadableByteStream, n2);
        })(e2, t2, r2), Pe(e2);
      }
      function Me(e2) {
        return e2._pendingPullIntos.shift();
      }
      function Ye(e2) {
        e2._pullAlgorithm = void 0, e2._cancelAlgorithm = void 0;
      }
      function Qe(e2) {
        const t2 = e2._controlledReadableByteStream;
        if (!e2._closeRequested && "readable" === t2._state) if (e2._queueTotalSize > 0) e2._closeRequested = true;
        else {
          if (e2._pendingPullIntos.length > 0) {
            const t3 = e2._pendingPullIntos.peek();
            if (t3.bytesFilled % t3.elementSize !== 0) {
              const t4 = new TypeError("Insufficient bytes to fill elements in the given buffer");
              throw Ne(e2, t4), t4;
            }
          }
          Ye(e2), Br(t2);
        }
      }
      function xe(e2, t2) {
        const r2 = e2._controlledReadableByteStream;
        if (e2._closeRequested || "readable" !== r2._state) return;
        const { buffer: o2, byteOffset: n2, byteLength: a2 } = t2;
        if (le(o2)) throw new TypeError("chunk's buffer is detached and so cannot be enqueued");
        const i2 = ie(o2);
        if (e2._pendingPullIntos.length > 0) {
          const t3 = e2._pendingPullIntos.peek();
          if (le(t3.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk");
          Le(e2), t3.buffer = ie(t3.buffer), "none" === t3.readerType && ke(e2, t3);
        }
        if (X(r2)) if ((function(e3) {
          const t3 = e3._controlledReadableByteStream._reader;
          for (; t3._readRequests.length > 0; ) {
            if (0 === e3._queueTotalSize) return;
            He(e3, t3._readRequests.shift());
          }
        })(e2), 0 === G(r2)) Be(e2, i2, n2, a2);
        else {
          e2._pendingPullIntos.length > 0 && Me(e2);
          U(r2, new Uint8Array(i2, n2, a2), false);
        }
        else if (nt(r2)) {
          Be(e2, i2, n2, a2);
          We(r2, Fe(e2));
        } else Be(e2, i2, n2, a2);
        Pe(e2);
      }
      function Ne(e2, t2) {
        const r2 = e2._controlledReadableByteStream;
        "readable" === r2._state && (qe(e2), we(e2), Ye(e2), jr(r2, t2));
      }
      function He(e2, t2) {
        const r2 = e2._queue.shift();
        e2._queueTotalSize -= r2.byteLength, De(e2);
        const o2 = new Uint8Array(r2.buffer, r2.byteOffset, r2.byteLength);
        t2._chunkSteps(o2);
      }
      function Ve(e2) {
        if (null === e2._byobRequest && e2._pendingPullIntos.length > 0) {
          const t2 = e2._pendingPullIntos.peek(), r2 = new Uint8Array(t2.buffer, t2.byteOffset + t2.bytesFilled, t2.byteLength - t2.bytesFilled), o2 = Object.create(ReadableStreamBYOBRequest.prototype);
          !(function(e3, t3, r3) {
            e3._associatedReadableByteStreamController = t3, e3._view = r3;
          })(o2, e2, r2), e2._byobRequest = o2;
        }
        return e2._byobRequest;
      }
      function Ue(e2) {
        const t2 = e2._controlledReadableByteStream._state;
        return "errored" === t2 ? null : "closed" === t2 ? 0 : e2._strategyHWM - e2._queueTotalSize;
      }
      function Ge(e2, t2) {
        const r2 = e2._pendingPullIntos.peek();
        if ("closed" === e2._controlledReadableByteStream._state) {
          if (0 !== t2) throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
        } else {
          if (0 === t2) throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          if (r2.bytesFilled + t2 > r2.byteLength) throw new RangeError("bytesWritten out of range");
        }
        r2.buffer = ie(r2.buffer), $e(e2, t2);
      }
      function Xe(e2, t2) {
        const r2 = e2._pendingPullIntos.peek();
        if ("closed" === e2._controlledReadableByteStream._state) {
          if (0 !== t2.byteLength) throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
        } else if (0 === t2.byteLength) throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
        if (r2.byteOffset + r2.bytesFilled !== t2.byteOffset) throw new RangeError("The region specified by view does not match byobRequest");
        if (r2.bufferByteLength !== t2.buffer.byteLength) throw new RangeError("The buffer of view has different capacity than byobRequest");
        if (r2.bytesFilled + t2.byteLength > r2.byteLength) throw new RangeError("The region specified by view is larger than byobRequest");
        const o2 = t2.byteLength;
        r2.buffer = ie(t2.buffer), $e(e2, o2);
      }
      function Je(e2, t2, r2, o2, n2, a2, i2) {
        t2._controlledReadableByteStream = e2, t2._pullAgain = false, t2._pulling = false, t2._byobRequest = null, t2._queue = t2._queueTotalSize = void 0, we(t2), t2._closeRequested = false, t2._started = false, t2._strategyHWM = a2, t2._pullAlgorithm = o2, t2._cancelAlgorithm = n2, t2._autoAllocateChunkSize = i2, t2._pendingPullIntos = new v(), e2._readableStreamController = t2;
        b(c(r2()), () => (t2._started = true, Pe(t2), null), (e3) => (Ne(t2, e3), null));
      }
      function Ke(e2) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${e2} can only be used on a ReadableStreamBYOBRequest`);
      }
      function Ze(e2) {
        return new TypeError(`ReadableByteStreamController.prototype.${e2} can only be used on a ReadableByteStreamController`);
      }
      function et(e2, t2) {
        if ("byob" !== (e2 = `${e2}`)) throw new TypeError(`${t2} '${e2}' is not a valid enumeration value for ReadableStreamReaderMode`);
        return e2;
      }
      function tt(e2) {
        return new ReadableStreamBYOBReader(e2);
      }
      function rt(e2, t2) {
        e2._reader._readIntoRequests.push(t2);
      }
      function ot(e2) {
        return e2._reader._readIntoRequests.length;
      }
      function nt(e2) {
        const t2 = e2._reader;
        return void 0 !== t2 && !!at(t2);
      }
      Object.defineProperties(ReadableByteStreamController.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, byobRequest: { enumerable: true }, desiredSize: { enumerable: true } }), o(ReadableByteStreamController.prototype.close, "close"), o(ReadableByteStreamController.prototype.enqueue, "enqueue"), o(ReadableByteStreamController.prototype.error, "error"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(ReadableByteStreamController.prototype, Symbol.toStringTag, { value: "ReadableByteStreamController", configurable: true });
      class ReadableStreamBYOBReader {
        constructor(e2) {
          if ($(e2, 1, "ReadableStreamBYOBReader"), N(e2, "First parameter"), Wr(e2)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          if (!Te(e2._readableStreamController)) throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          q(this, e2), this._readIntoRequests = new v();
        }
        get closed() {
          return at(this) ? this._closedPromise : d(st("closed"));
        }
        cancel(e2 = void 0) {
          return at(this) ? void 0 === this._ownerReadableStream ? d(O("cancel")) : E(this, e2) : d(st("cancel"));
        }
        read(e2, t2 = {}) {
          if (!at(this)) return d(st("read"));
          if (!ArrayBuffer.isView(e2)) return d(new TypeError("view must be an array buffer view"));
          if (0 === e2.byteLength) return d(new TypeError("view must have non-zero byteLength"));
          if (0 === e2.buffer.byteLength) return d(new TypeError("view's buffer must have non-zero byteLength"));
          if (le(e2.buffer)) return d(new TypeError("view's buffer has been detached"));
          let r2;
          try {
            r2 = (function(e3, t3) {
              var r3;
              return L(e3, t3), { min: x(null !== (r3 = null == e3 ? void 0 : e3.min) && void 0 !== r3 ? r3 : 1, `${t3} has member 'min' that`) };
            })(t2, "options");
          } catch (e3) {
            return d(e3);
          }
          const o2 = r2.min;
          if (0 === o2) return d(new TypeError("options.min must be greater than 0"));
          if ((function(e3) {
            return Re(e3.constructor);
          })(e2)) {
            if (o2 > e2.byteLength) return d(new RangeError("options.min must be less than or equal to view's byteLength"));
          } else if (o2 > e2.length) return d(new RangeError("options.min must be less than or equal to view's length"));
          if (void 0 === this._ownerReadableStream) return d(O("read from"));
          let n2, a2;
          const i2 = u((e3, t3) => {
            n2 = e3, a2 = t3;
          });
          return it(this, e2, o2, { _chunkSteps: (e3) => n2({ value: e3, done: false }), _closeSteps: (e3) => n2({ value: e3, done: true }), _errorSteps: (e3) => a2(e3) }), i2;
        }
        releaseLock() {
          if (!at(this)) throw st("releaseLock");
          void 0 !== this._ownerReadableStream && (function(e2) {
            W(e2);
            const t2 = new TypeError("Reader was released");
            lt(e2, t2);
          })(this);
        }
      }
      function at(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_readIntoRequests") && e2 instanceof ReadableStreamBYOBReader);
      }
      function it(e2, t2, r2, o2) {
        const n2 = e2._ownerReadableStream;
        n2._disturbed = true, "errored" === n2._state ? o2._errorSteps(n2._storedError) : Ie(n2._readableStreamController, t2, r2, o2);
      }
      function lt(e2, t2) {
        const r2 = e2._readIntoRequests;
        e2._readIntoRequests = new v(), r2.forEach((e3) => {
          e3._errorSteps(t2);
        });
      }
      function st(e2) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${e2} can only be used on a ReadableStreamBYOBReader`);
      }
      function ut(e2, t2) {
        const { highWaterMark: r2 } = e2;
        if (void 0 === r2) return t2;
        if (ye(r2) || r2 < 0) throw new RangeError("Invalid highWaterMark");
        return r2;
      }
      function ct(e2) {
        const { size: t2 } = e2;
        return t2 || (() => 1);
      }
      function dt(e2, t2) {
        L(e2, t2);
        const r2 = null == e2 ? void 0 : e2.highWaterMark, o2 = null == e2 ? void 0 : e2.size;
        return { highWaterMark: void 0 === r2 ? void 0 : Y(r2), size: void 0 === o2 ? void 0 : ft(o2, `${t2} has member 'size' that`) };
      }
      function ft(e2, t2) {
        return F(e2, t2), (t3) => Y(e2(t3));
      }
      function bt(e2, t2, r2) {
        return F(e2, r2), (r3) => g(e2, t2, [r3]);
      }
      function ht(e2, t2, r2) {
        return F(e2, r2), () => g(e2, t2, []);
      }
      function mt(e2, t2, r2) {
        return F(e2, r2), (r3) => S(e2, t2, [r3]);
      }
      function _t(e2, t2, r2) {
        return F(e2, r2), (r3, o2) => g(e2, t2, [r3, o2]);
      }
      function pt(e2, t2) {
        if (!gt(e2)) throw new TypeError(`${t2} is not a WritableStream.`);
      }
      Object.defineProperties(ReadableStreamBYOBReader.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), o(ReadableStreamBYOBReader.prototype.cancel, "cancel"), o(ReadableStreamBYOBReader.prototype.read, "read"), o(ReadableStreamBYOBReader.prototype.releaseLock, "releaseLock"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(ReadableStreamBYOBReader.prototype, Symbol.toStringTag, { value: "ReadableStreamBYOBReader", configurable: true });
      class WritableStream {
        constructor(e2 = {}, t2 = {}) {
          void 0 === e2 ? e2 = null : I(e2, "First parameter");
          const r2 = dt(t2, "Second parameter"), o2 = (function(e3, t3) {
            L(e3, t3);
            const r3 = null == e3 ? void 0 : e3.abort, o3 = null == e3 ? void 0 : e3.close, n3 = null == e3 ? void 0 : e3.start, a2 = null == e3 ? void 0 : e3.type, i2 = null == e3 ? void 0 : e3.write;
            return { abort: void 0 === r3 ? void 0 : bt(r3, e3, `${t3} has member 'abort' that`), close: void 0 === o3 ? void 0 : ht(o3, e3, `${t3} has member 'close' that`), start: void 0 === n3 ? void 0 : mt(n3, e3, `${t3} has member 'start' that`), write: void 0 === i2 ? void 0 : _t(i2, e3, `${t3} has member 'write' that`), type: a2 };
          })(e2, "First parameter");
          St(this);
          if (void 0 !== o2.type) throw new RangeError("Invalid type is specified");
          const n2 = ct(r2);
          !(function(e3, t3, r3, o3) {
            const n3 = Object.create(WritableStreamDefaultController.prototype);
            let a2, i2, l2, s2;
            a2 = void 0 !== t3.start ? () => t3.start(n3) : () => {
            };
            i2 = void 0 !== t3.write ? (e4) => t3.write(e4, n3) : () => c(void 0);
            l2 = void 0 !== t3.close ? () => t3.close() : () => c(void 0);
            s2 = void 0 !== t3.abort ? (e4) => t3.abort(e4) : () => c(void 0);
            Ft(e3, n3, a2, i2, l2, s2, r3, o3);
          })(this, o2, ut(r2, 1), n2);
        }
        get locked() {
          if (!gt(this)) throw Nt("locked");
          return vt(this);
        }
        abort(e2 = void 0) {
          return gt(this) ? vt(this) ? d(new TypeError("Cannot abort a stream that already has a writer")) : wt(this, e2) : d(Nt("abort"));
        }
        close() {
          return gt(this) ? vt(this) ? d(new TypeError("Cannot close a stream that already has a writer")) : qt(this) ? d(new TypeError("Cannot close an already-closing stream")) : Rt(this) : d(Nt("close"));
        }
        getWriter() {
          if (!gt(this)) throw Nt("getWriter");
          return yt(this);
        }
      }
      function yt(e2) {
        return new WritableStreamDefaultWriter(e2);
      }
      function St(e2) {
        e2._state = "writable", e2._storedError = void 0, e2._writer = void 0, e2._writableStreamController = void 0, e2._writeRequests = new v(), e2._inFlightWriteRequest = void 0, e2._closeRequest = void 0, e2._inFlightCloseRequest = void 0, e2._pendingAbortRequest = void 0, e2._backpressure = false;
      }
      function gt(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_writableStreamController") && e2 instanceof WritableStream);
      }
      function vt(e2) {
        return void 0 !== e2._writer;
      }
      function wt(e2, t2) {
        var r2;
        if ("closed" === e2._state || "errored" === e2._state) return c(void 0);
        e2._writableStreamController._abortReason = t2, null === (r2 = e2._writableStreamController._abortController) || void 0 === r2 || r2.abort(t2);
        const o2 = e2._state;
        if ("closed" === o2 || "errored" === o2) return c(void 0);
        if (void 0 !== e2._pendingAbortRequest) return e2._pendingAbortRequest._promise;
        let n2 = false;
        "erroring" === o2 && (n2 = true, t2 = void 0);
        const a2 = u((r3, o3) => {
          e2._pendingAbortRequest = { _promise: void 0, _resolve: r3, _reject: o3, _reason: t2, _wasAlreadyErroring: n2 };
        });
        return e2._pendingAbortRequest._promise = a2, n2 || Ct(e2, t2), a2;
      }
      function Rt(e2) {
        const t2 = e2._state;
        if ("closed" === t2 || "errored" === t2) return d(new TypeError(`The stream (in ${t2} state) is not in the writable state and cannot be closed`));
        const r2 = u((t3, r3) => {
          const o3 = { _resolve: t3, _reject: r3 };
          e2._closeRequest = o3;
        }), o2 = e2._writer;
        var n2;
        return void 0 !== o2 && e2._backpressure && "writable" === t2 && or(o2), ve(n2 = e2._writableStreamController, Dt, 0), Mt(n2), r2;
      }
      function Tt(e2, t2) {
        "writable" !== e2._state ? Pt(e2) : Ct(e2, t2);
      }
      function Ct(e2, t2) {
        const r2 = e2._writableStreamController;
        e2._state = "erroring", e2._storedError = t2;
        const o2 = e2._writer;
        void 0 !== o2 && kt(o2, t2), !(function(e3) {
          if (void 0 === e3._inFlightWriteRequest && void 0 === e3._inFlightCloseRequest) return false;
          return true;
        })(e2) && r2._started && Pt(e2);
      }
      function Pt(e2) {
        e2._state = "errored", e2._writableStreamController[R]();
        const t2 = e2._storedError;
        if (e2._writeRequests.forEach((e3) => {
          e3._reject(t2);
        }), e2._writeRequests = new v(), void 0 === e2._pendingAbortRequest) return void Et(e2);
        const r2 = e2._pendingAbortRequest;
        if (e2._pendingAbortRequest = void 0, r2._wasAlreadyErroring) return r2._reject(t2), void Et(e2);
        b(e2._writableStreamController[w](r2._reason), () => (r2._resolve(), Et(e2), null), (t3) => (r2._reject(t3), Et(e2), null));
      }
      function qt(e2) {
        return void 0 !== e2._closeRequest || void 0 !== e2._inFlightCloseRequest;
      }
      function Et(e2) {
        void 0 !== e2._closeRequest && (e2._closeRequest._reject(e2._storedError), e2._closeRequest = void 0);
        const t2 = e2._writer;
        void 0 !== t2 && Jt(t2, e2._storedError);
      }
      function Wt(e2, t2) {
        const r2 = e2._writer;
        void 0 !== r2 && t2 !== e2._backpressure && (t2 ? (function(e3) {
          Zt(e3);
        })(r2) : or(r2)), e2._backpressure = t2;
      }
      Object.defineProperties(WritableStream.prototype, { abort: { enumerable: true }, close: { enumerable: true }, getWriter: { enumerable: true }, locked: { enumerable: true } }), o(WritableStream.prototype.abort, "abort"), o(WritableStream.prototype.close, "close"), o(WritableStream.prototype.getWriter, "getWriter"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(WritableStream.prototype, Symbol.toStringTag, { value: "WritableStream", configurable: true });
      class WritableStreamDefaultWriter {
        constructor(e2) {
          if ($(e2, 1, "WritableStreamDefaultWriter"), pt(e2, "First parameter"), vt(e2)) throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          this._ownerWritableStream = e2, e2._writer = this;
          const t2 = e2._state;
          if ("writable" === t2) !qt(e2) && e2._backpressure ? Zt(this) : tr(this), Gt(this);
          else if ("erroring" === t2) er(this, e2._storedError), Gt(this);
          else if ("closed" === t2) tr(this), Gt(r2 = this), Kt(r2);
          else {
            const t3 = e2._storedError;
            er(this, t3), Xt(this, t3);
          }
          var r2;
        }
        get closed() {
          return Ot(this) ? this._closedPromise : d(Vt("closed"));
        }
        get desiredSize() {
          if (!Ot(this)) throw Vt("desiredSize");
          if (void 0 === this._ownerWritableStream) throw Ut("desiredSize");
          return (function(e2) {
            const t2 = e2._ownerWritableStream, r2 = t2._state;
            if ("errored" === r2 || "erroring" === r2) return null;
            if ("closed" === r2) return 0;
            return $t(t2._writableStreamController);
          })(this);
        }
        get ready() {
          return Ot(this) ? this._readyPromise : d(Vt("ready"));
        }
        abort(e2 = void 0) {
          return Ot(this) ? void 0 === this._ownerWritableStream ? d(Ut("abort")) : (function(e3, t2) {
            return wt(e3._ownerWritableStream, t2);
          })(this, e2) : d(Vt("abort"));
        }
        close() {
          if (!Ot(this)) return d(Vt("close"));
          const e2 = this._ownerWritableStream;
          return void 0 === e2 ? d(Ut("close")) : qt(e2) ? d(new TypeError("Cannot close an already-closing stream")) : Bt(this);
        }
        releaseLock() {
          if (!Ot(this)) throw Vt("releaseLock");
          void 0 !== this._ownerWritableStream && At(this);
        }
        write(e2 = void 0) {
          return Ot(this) ? void 0 === this._ownerWritableStream ? d(Ut("write to")) : zt(this, e2) : d(Vt("write"));
        }
      }
      function Ot(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_ownerWritableStream") && e2 instanceof WritableStreamDefaultWriter);
      }
      function Bt(e2) {
        return Rt(e2._ownerWritableStream);
      }
      function jt(e2, t2) {
        "pending" === e2._closedPromiseState ? Jt(e2, t2) : (function(e3, t3) {
          Xt(e3, t3);
        })(e2, t2);
      }
      function kt(e2, t2) {
        "pending" === e2._readyPromiseState ? rr(e2, t2) : (function(e3, t3) {
          er(e3, t3);
        })(e2, t2);
      }
      function At(e2) {
        const t2 = e2._ownerWritableStream, r2 = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
        kt(e2, r2), jt(e2, r2), t2._writer = void 0, e2._ownerWritableStream = void 0;
      }
      function zt(e2, t2) {
        const r2 = e2._ownerWritableStream, o2 = r2._writableStreamController, n2 = (function(e3, t3) {
          if (void 0 === e3._strategySizeAlgorithm) return 1;
          try {
            return e3._strategySizeAlgorithm(t3);
          } catch (t4) {
            return Yt(e3, t4), 1;
          }
        })(o2, t2);
        if (r2 !== e2._ownerWritableStream) return d(Ut("write to"));
        const a2 = r2._state;
        if ("errored" === a2) return d(r2._storedError);
        if (qt(r2) || "closed" === a2) return d(new TypeError("The stream is closing or closed and cannot be written to"));
        if ("erroring" === a2) return d(r2._storedError);
        const i2 = (function(e3) {
          return u((t3, r3) => {
            const o3 = { _resolve: t3, _reject: r3 };
            e3._writeRequests.push(o3);
          });
        })(r2);
        return (function(e3, t3, r3) {
          try {
            ve(e3, t3, r3);
          } catch (t4) {
            return void Yt(e3, t4);
          }
          const o3 = e3._controlledWritableStream;
          if (!qt(o3) && "writable" === o3._state) {
            Wt(o3, Qt(e3));
          }
          Mt(e3);
        })(o2, t2, n2), i2;
      }
      Object.defineProperties(WritableStreamDefaultWriter.prototype, { abort: { enumerable: true }, close: { enumerable: true }, releaseLock: { enumerable: true }, write: { enumerable: true }, closed: { enumerable: true }, desiredSize: { enumerable: true }, ready: { enumerable: true } }), o(WritableStreamDefaultWriter.prototype.abort, "abort"), o(WritableStreamDefaultWriter.prototype.close, "close"), o(WritableStreamDefaultWriter.prototype.releaseLock, "releaseLock"), o(WritableStreamDefaultWriter.prototype.write, "write"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(WritableStreamDefaultWriter.prototype, Symbol.toStringTag, { value: "WritableStreamDefaultWriter", configurable: true });
      const Dt = {};
      class WritableStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get abortReason() {
          if (!Lt(this)) throw Ht("abortReason");
          return this._abortReason;
        }
        get signal() {
          if (!Lt(this)) throw Ht("signal");
          if (void 0 === this._abortController) throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          return this._abortController.signal;
        }
        error(e2 = void 0) {
          if (!Lt(this)) throw Ht("error");
          "writable" === this._controlledWritableStream._state && xt(this, e2);
        }
        [w](e2) {
          const t2 = this._abortAlgorithm(e2);
          return It(this), t2;
        }
        [R]() {
          we(this);
        }
      }
      function Lt(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledWritableStream") && e2 instanceof WritableStreamDefaultController);
      }
      function Ft(e2, t2, r2, o2, n2, a2, i2, l2) {
        t2._controlledWritableStream = e2, e2._writableStreamController = t2, t2._queue = void 0, t2._queueTotalSize = void 0, we(t2), t2._abortReason = void 0, t2._abortController = (function() {
          if ("function" == typeof AbortController) return new AbortController();
        })(), t2._started = false, t2._strategySizeAlgorithm = l2, t2._strategyHWM = i2, t2._writeAlgorithm = o2, t2._closeAlgorithm = n2, t2._abortAlgorithm = a2;
        const s2 = Qt(t2);
        Wt(e2, s2);
        b(c(r2()), () => (t2._started = true, Mt(t2), null), (r3) => (t2._started = true, Tt(e2, r3), null));
      }
      function It(e2) {
        e2._writeAlgorithm = void 0, e2._closeAlgorithm = void 0, e2._abortAlgorithm = void 0, e2._strategySizeAlgorithm = void 0;
      }
      function $t(e2) {
        return e2._strategyHWM - e2._queueTotalSize;
      }
      function Mt(e2) {
        const t2 = e2._controlledWritableStream;
        if (!e2._started) return;
        if (void 0 !== t2._inFlightWriteRequest) return;
        if ("erroring" === t2._state) return void Pt(t2);
        if (0 === e2._queue.length) return;
        const r2 = e2._queue.peek().value;
        r2 === Dt ? (function(e3) {
          const t3 = e3._controlledWritableStream;
          (function(e4) {
            e4._inFlightCloseRequest = e4._closeRequest, e4._closeRequest = void 0;
          })(t3), ge(e3);
          const r3 = e3._closeAlgorithm();
          It(e3), b(r3, () => ((function(e4) {
            e4._inFlightCloseRequest._resolve(void 0), e4._inFlightCloseRequest = void 0, "erroring" === e4._state && (e4._storedError = void 0, void 0 !== e4._pendingAbortRequest && (e4._pendingAbortRequest._resolve(), e4._pendingAbortRequest = void 0)), e4._state = "closed";
            const t4 = e4._writer;
            void 0 !== t4 && Kt(t4);
          })(t3), null), (e4) => ((function(e5, t4) {
            e5._inFlightCloseRequest._reject(t4), e5._inFlightCloseRequest = void 0, void 0 !== e5._pendingAbortRequest && (e5._pendingAbortRequest._reject(t4), e5._pendingAbortRequest = void 0), Tt(e5, t4);
          })(t3, e4), null));
        })(e2) : (function(e3, t3) {
          const r3 = e3._controlledWritableStream;
          !(function(e4) {
            e4._inFlightWriteRequest = e4._writeRequests.shift();
          })(r3);
          const o2 = e3._writeAlgorithm(t3);
          b(o2, () => {
            !(function(e4) {
              e4._inFlightWriteRequest._resolve(void 0), e4._inFlightWriteRequest = void 0;
            })(r3);
            const t4 = r3._state;
            if (ge(e3), !qt(r3) && "writable" === t4) {
              const t5 = Qt(e3);
              Wt(r3, t5);
            }
            return Mt(e3), null;
          }, (t4) => ("writable" === r3._state && It(e3), (function(e4, t5) {
            e4._inFlightWriteRequest._reject(t5), e4._inFlightWriteRequest = void 0, Tt(e4, t5);
          })(r3, t4), null));
        })(e2, r2);
      }
      function Yt(e2, t2) {
        "writable" === e2._controlledWritableStream._state && xt(e2, t2);
      }
      function Qt(e2) {
        return $t(e2) <= 0;
      }
      function xt(e2, t2) {
        const r2 = e2._controlledWritableStream;
        It(e2), Ct(r2, t2);
      }
      function Nt(e2) {
        return new TypeError(`WritableStream.prototype.${e2} can only be used on a WritableStream`);
      }
      function Ht(e2) {
        return new TypeError(`WritableStreamDefaultController.prototype.${e2} can only be used on a WritableStreamDefaultController`);
      }
      function Vt(e2) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${e2} can only be used on a WritableStreamDefaultWriter`);
      }
      function Ut(e2) {
        return new TypeError("Cannot " + e2 + " a stream using a released writer");
      }
      function Gt(e2) {
        e2._closedPromise = u((t2, r2) => {
          e2._closedPromise_resolve = t2, e2._closedPromise_reject = r2, e2._closedPromiseState = "pending";
        });
      }
      function Xt(e2, t2) {
        Gt(e2), Jt(e2, t2);
      }
      function Jt(e2, t2) {
        void 0 !== e2._closedPromise_reject && (p(e2._closedPromise), e2._closedPromise_reject(t2), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0, e2._closedPromiseState = "rejected");
      }
      function Kt(e2) {
        void 0 !== e2._closedPromise_resolve && (e2._closedPromise_resolve(void 0), e2._closedPromise_resolve = void 0, e2._closedPromise_reject = void 0, e2._closedPromiseState = "resolved");
      }
      function Zt(e2) {
        e2._readyPromise = u((t2, r2) => {
          e2._readyPromise_resolve = t2, e2._readyPromise_reject = r2;
        }), e2._readyPromiseState = "pending";
      }
      function er(e2, t2) {
        Zt(e2), rr(e2, t2);
      }
      function tr(e2) {
        Zt(e2), or(e2);
      }
      function rr(e2, t2) {
        void 0 !== e2._readyPromise_reject && (p(e2._readyPromise), e2._readyPromise_reject(t2), e2._readyPromise_resolve = void 0, e2._readyPromise_reject = void 0, e2._readyPromiseState = "rejected");
      }
      function or(e2) {
        void 0 !== e2._readyPromise_resolve && (e2._readyPromise_resolve(void 0), e2._readyPromise_resolve = void 0, e2._readyPromise_reject = void 0, e2._readyPromiseState = "fulfilled");
      }
      Object.defineProperties(WritableStreamDefaultController.prototype, { abortReason: { enumerable: true }, signal: { enumerable: true }, error: { enumerable: true } }), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(WritableStreamDefaultController.prototype, Symbol.toStringTag, { value: "WritableStreamDefaultController", configurable: true });
      const nr = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof global ? global : void 0;
      const ar = (function() {
        const e2 = null == nr ? void 0 : nr.DOMException;
        return (function(e3) {
          if ("function" != typeof e3 && "object" != typeof e3) return false;
          if ("DOMException" !== e3.name) return false;
          try {
            return new e3(), true;
          } catch (e4) {
            return false;
          }
        })(e2) ? e2 : void 0;
      })() || (function() {
        const e2 = function(e3, t2) {
          this.message = e3 || "", this.name = t2 || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
        };
        return o(e2, "DOMException"), e2.prototype = Object.create(Error.prototype), Object.defineProperty(e2.prototype, "constructor", { value: e2, writable: true, configurable: true }), e2;
      })();
      function ir(t2, r2, o2, n2, a2, i2) {
        const l2 = H(t2), s2 = yt(r2);
        t2._disturbed = true;
        let _2 = false, y2 = c(void 0);
        return u((S2, g2) => {
          let v2;
          if (void 0 !== i2) {
            if (v2 = () => {
              const e2 = void 0 !== i2.reason ? i2.reason : new ar("Aborted", "AbortError"), o3 = [];
              n2 || o3.push(() => "writable" === r2._state ? wt(r2, e2) : c(void 0)), a2 || o3.push(() => "readable" === t2._state ? Or(t2, e2) : c(void 0)), q2(() => Promise.all(o3.map((e3) => e3())), true, e2);
            }, i2.aborted) return void v2();
            i2.addEventListener("abort", v2);
          }
          var w2, R2, T2;
          if (P2(t2, l2._closedPromise, (e2) => (n2 ? E2(true, e2) : q2(() => wt(r2, e2), true, e2), null)), P2(r2, s2._closedPromise, (e2) => (a2 ? E2(true, e2) : q2(() => Or(t2, e2), true, e2), null)), w2 = t2, R2 = l2._closedPromise, T2 = () => (o2 ? E2() : q2(() => (function(e2) {
            const t3 = e2._ownerWritableStream, r3 = t3._state;
            return qt(t3) || "closed" === r3 ? c(void 0) : "errored" === r3 ? d(t3._storedError) : Bt(e2);
          })(s2)), null), "closed" === w2._state ? T2() : h(R2, T2), qt(r2) || "closed" === r2._state) {
            const e2 = new TypeError("the destination writable stream closed before all data could be piped to it");
            a2 ? E2(true, e2) : q2(() => Or(t2, e2), true, e2);
          }
          function C2() {
            const e2 = y2;
            return f(y2, () => e2 !== y2 ? C2() : void 0);
          }
          function P2(e2, t3, r3) {
            "errored" === e2._state ? r3(e2._storedError) : m(t3, r3);
          }
          function q2(e2, t3, o3) {
            function n3() {
              return b(e2(), () => O2(t3, o3), (e3) => O2(true, e3)), null;
            }
            _2 || (_2 = true, "writable" !== r2._state || qt(r2) ? n3() : h(C2(), n3));
          }
          function E2(e2, t3) {
            _2 || (_2 = true, "writable" !== r2._state || qt(r2) ? O2(e2, t3) : h(C2(), () => O2(e2, t3)));
          }
          function O2(e2, t3) {
            return At(s2), W(l2), void 0 !== i2 && i2.removeEventListener("abort", v2), e2 ? g2(t3) : S2(void 0), null;
          }
          p(u((t3, r3) => {
            !(function o3(n3) {
              n3 ? t3() : f(_2 ? c(true) : f(s2._readyPromise, () => u((t4, r4) => {
                K(l2, { _chunkSteps: (r5) => {
                  y2 = f(zt(s2, r5), void 0, e), t4(false);
                }, _closeSteps: () => t4(true), _errorSteps: r4 });
              })), o3, r3);
            })(false);
          }));
        });
      }
      class ReadableStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get desiredSize() {
          if (!lr(this)) throw pr("desiredSize");
          return hr(this);
        }
        close() {
          if (!lr(this)) throw pr("close");
          if (!mr(this)) throw new TypeError("The stream is not in a state that permits close");
          dr(this);
        }
        enqueue(e2 = void 0) {
          if (!lr(this)) throw pr("enqueue");
          if (!mr(this)) throw new TypeError("The stream is not in a state that permits enqueue");
          return fr(this, e2);
        }
        error(e2 = void 0) {
          if (!lr(this)) throw pr("error");
          br(this, e2);
        }
        [T](e2) {
          we(this);
          const t2 = this._cancelAlgorithm(e2);
          return cr(this), t2;
        }
        [C](e2) {
          const t2 = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const r2 = ge(this);
            this._closeRequested && 0 === this._queue.length ? (cr(this), Br(t2)) : sr(this), e2._chunkSteps(r2);
          } else V(t2, e2), sr(this);
        }
        [P]() {
        }
      }
      function lr(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledReadableStream") && e2 instanceof ReadableStreamDefaultController);
      }
      function sr(e2) {
        if (!ur(e2)) return;
        if (e2._pulling) return void (e2._pullAgain = true);
        e2._pulling = true;
        b(e2._pullAlgorithm(), () => (e2._pulling = false, e2._pullAgain && (e2._pullAgain = false, sr(e2)), null), (t2) => (br(e2, t2), null));
      }
      function ur(e2) {
        const t2 = e2._controlledReadableStream;
        if (!mr(e2)) return false;
        if (!e2._started) return false;
        if (Wr(t2) && G(t2) > 0) return true;
        return hr(e2) > 0;
      }
      function cr(e2) {
        e2._pullAlgorithm = void 0, e2._cancelAlgorithm = void 0, e2._strategySizeAlgorithm = void 0;
      }
      function dr(e2) {
        if (!mr(e2)) return;
        const t2 = e2._controlledReadableStream;
        e2._closeRequested = true, 0 === e2._queue.length && (cr(e2), Br(t2));
      }
      function fr(e2, t2) {
        if (!mr(e2)) return;
        const r2 = e2._controlledReadableStream;
        if (Wr(r2) && G(r2) > 0) U(r2, t2, false);
        else {
          let r3;
          try {
            r3 = e2._strategySizeAlgorithm(t2);
          } catch (t3) {
            throw br(e2, t3), t3;
          }
          try {
            ve(e2, t2, r3);
          } catch (t3) {
            throw br(e2, t3), t3;
          }
        }
        sr(e2);
      }
      function br(e2, t2) {
        const r2 = e2._controlledReadableStream;
        "readable" === r2._state && (we(e2), cr(e2), jr(r2, t2));
      }
      function hr(e2) {
        const t2 = e2._controlledReadableStream._state;
        return "errored" === t2 ? null : "closed" === t2 ? 0 : e2._strategyHWM - e2._queueTotalSize;
      }
      function mr(e2) {
        const t2 = e2._controlledReadableStream._state;
        return !e2._closeRequested && "readable" === t2;
      }
      function _r(e2, t2, r2, o2, n2, a2, i2) {
        t2._controlledReadableStream = e2, t2._queue = void 0, t2._queueTotalSize = void 0, we(t2), t2._started = false, t2._closeRequested = false, t2._pullAgain = false, t2._pulling = false, t2._strategySizeAlgorithm = i2, t2._strategyHWM = a2, t2._pullAlgorithm = o2, t2._cancelAlgorithm = n2, e2._readableStreamController = t2;
        b(c(r2()), () => (t2._started = true, sr(t2), null), (e3) => (br(t2, e3), null));
      }
      function pr(e2) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${e2} can only be used on a ReadableStreamDefaultController`);
      }
      function yr(e2, t2) {
        return Te(e2._readableStreamController) ? (function(e3) {
          let t3, r2, o2, n2, a2, i2 = H(e3), l2 = false, s2 = false, d2 = false, f2 = false, b2 = false;
          const h2 = u((e4) => {
            a2 = e4;
          });
          function _2(e4) {
            m(e4._closedPromise, (t4) => (e4 !== i2 || (Ne(o2._readableStreamController, t4), Ne(n2._readableStreamController, t4), f2 && b2 || a2(void 0)), null));
          }
          function p2() {
            at(i2) && (W(i2), i2 = H(e3), _2(i2));
            K(i2, { _chunkSteps: (t4) => {
              y(() => {
                s2 = false, d2 = false;
                const r3 = t4;
                let i3 = t4;
                if (!f2 && !b2) try {
                  i3 = Se(t4);
                } catch (t5) {
                  return Ne(o2._readableStreamController, t5), Ne(n2._readableStreamController, t5), void a2(Or(e3, t5));
                }
                f2 || xe(o2._readableStreamController, r3), b2 || xe(n2._readableStreamController, i3), l2 = false, s2 ? g2() : d2 && v2();
              });
            }, _closeSteps: () => {
              l2 = false, f2 || Qe(o2._readableStreamController), b2 || Qe(n2._readableStreamController), o2._readableStreamController._pendingPullIntos.length > 0 && Ge(o2._readableStreamController, 0), n2._readableStreamController._pendingPullIntos.length > 0 && Ge(n2._readableStreamController, 0), f2 && b2 || a2(void 0);
            }, _errorSteps: () => {
              l2 = false;
            } });
          }
          function S2(t4, r3) {
            J(i2) && (W(i2), i2 = tt(e3), _2(i2));
            const u2 = r3 ? n2 : o2, c2 = r3 ? o2 : n2;
            it(i2, t4, 1, { _chunkSteps: (t5) => {
              y(() => {
                s2 = false, d2 = false;
                const o3 = r3 ? b2 : f2;
                if (r3 ? f2 : b2) o3 || Xe(u2._readableStreamController, t5);
                else {
                  let r4;
                  try {
                    r4 = Se(t5);
                  } catch (t6) {
                    return Ne(u2._readableStreamController, t6), Ne(c2._readableStreamController, t6), void a2(Or(e3, t6));
                  }
                  o3 || Xe(u2._readableStreamController, t5), xe(c2._readableStreamController, r4);
                }
                l2 = false, s2 ? g2() : d2 && v2();
              });
            }, _closeSteps: (e4) => {
              l2 = false;
              const t5 = r3 ? b2 : f2, o3 = r3 ? f2 : b2;
              t5 || Qe(u2._readableStreamController), o3 || Qe(c2._readableStreamController), void 0 !== e4 && (t5 || Xe(u2._readableStreamController, e4), !o3 && c2._readableStreamController._pendingPullIntos.length > 0 && Ge(c2._readableStreamController, 0)), t5 && o3 || a2(void 0);
            }, _errorSteps: () => {
              l2 = false;
            } });
          }
          function g2() {
            if (l2) return s2 = true, c(void 0);
            l2 = true;
            const e4 = Ve(o2._readableStreamController);
            return null === e4 ? p2() : S2(e4._view, false), c(void 0);
          }
          function v2() {
            if (l2) return d2 = true, c(void 0);
            l2 = true;
            const e4 = Ve(n2._readableStreamController);
            return null === e4 ? p2() : S2(e4._view, true), c(void 0);
          }
          function w2(o3) {
            if (f2 = true, t3 = o3, b2) {
              const o4 = ne([t3, r2]), n3 = Or(e3, o4);
              a2(n3);
            }
            return h2;
          }
          function R2(o3) {
            if (b2 = true, r2 = o3, f2) {
              const o4 = ne([t3, r2]), n3 = Or(e3, o4);
              a2(n3);
            }
            return h2;
          }
          function T2() {
          }
          return o2 = Pr(T2, g2, w2), n2 = Pr(T2, v2, R2), _2(i2), [o2, n2];
        })(e2) : (function(e3) {
          const t3 = H(e3);
          let r2, o2, n2, a2, i2, l2 = false, s2 = false, d2 = false, f2 = false;
          const b2 = u((e4) => {
            i2 = e4;
          });
          function h2() {
            if (l2) return s2 = true, c(void 0);
            l2 = true;
            return K(t3, { _chunkSteps: (e4) => {
              y(() => {
                s2 = false;
                const t4 = e4, r3 = e4;
                d2 || fr(n2._readableStreamController, t4), f2 || fr(a2._readableStreamController, r3), l2 = false, s2 && h2();
              });
            }, _closeSteps: () => {
              l2 = false, d2 || dr(n2._readableStreamController), f2 || dr(a2._readableStreamController), d2 && f2 || i2(void 0);
            }, _errorSteps: () => {
              l2 = false;
            } }), c(void 0);
          }
          function _2(t4) {
            if (d2 = true, r2 = t4, f2) {
              const t5 = ne([r2, o2]), n3 = Or(e3, t5);
              i2(n3);
            }
            return b2;
          }
          function p2(t4) {
            if (f2 = true, o2 = t4, d2) {
              const t5 = ne([r2, o2]), n3 = Or(e3, t5);
              i2(n3);
            }
            return b2;
          }
          function S2() {
          }
          return n2 = Cr(S2, h2, _2), a2 = Cr(S2, h2, p2), m(t3._closedPromise, (e4) => (br(n2._readableStreamController, e4), br(a2._readableStreamController, e4), d2 && f2 || i2(void 0), null)), [n2, a2];
        })(e2);
      }
      function Sr(r2) {
        return t(o2 = r2) && void 0 !== o2.getReader ? (function(r3) {
          let o3;
          function n2() {
            let e2;
            try {
              e2 = r3.read();
            } catch (e3) {
              return d(e3);
            }
            return _(e2, (e3) => {
              if (!t(e3)) throw new TypeError("The promise returned by the reader.read() method must fulfill with an object");
              if (e3.done) dr(o3._readableStreamController);
              else {
                const t2 = e3.value;
                fr(o3._readableStreamController, t2);
              }
            });
          }
          function a2(e2) {
            try {
              return c(r3.cancel(e2));
            } catch (e3) {
              return d(e3);
            }
          }
          return o3 = Cr(e, n2, a2, 0), o3;
        })(r2.getReader()) : (function(r3) {
          let o3;
          const n2 = fe(r3, "async");
          function a2() {
            let e2;
            try {
              e2 = be(n2);
            } catch (e3) {
              return d(e3);
            }
            return _(c(e2), (e3) => {
              if (!t(e3)) throw new TypeError("The promise returned by the iterator.next() method must fulfill with an object");
              if (e3.done) dr(o3._readableStreamController);
              else {
                const t2 = e3.value;
                fr(o3._readableStreamController, t2);
              }
            });
          }
          function i2(e2) {
            const r4 = n2.iterator;
            let o4;
            try {
              o4 = ue(r4, "return");
            } catch (e3) {
              return d(e3);
            }
            if (void 0 === o4) return c(void 0);
            return _(g(o4, r4, [e2]), (e3) => {
              if (!t(e3)) throw new TypeError("The promise returned by the iterator.return() method must fulfill with an object");
            });
          }
          return o3 = Cr(e, a2, i2, 0), o3;
        })(r2);
        var o2;
      }
      function gr(e2, t2, r2) {
        return F(e2, r2), (r3) => g(e2, t2, [r3]);
      }
      function vr(e2, t2, r2) {
        return F(e2, r2), (r3) => g(e2, t2, [r3]);
      }
      function wr(e2, t2, r2) {
        return F(e2, r2), (r3) => S(e2, t2, [r3]);
      }
      function Rr(e2, t2) {
        if ("bytes" !== (e2 = `${e2}`)) throw new TypeError(`${t2} '${e2}' is not a valid enumeration value for ReadableStreamType`);
        return e2;
      }
      function Tr(e2, t2) {
        L(e2, t2);
        const r2 = null == e2 ? void 0 : e2.preventAbort, o2 = null == e2 ? void 0 : e2.preventCancel, n2 = null == e2 ? void 0 : e2.preventClose, a2 = null == e2 ? void 0 : e2.signal;
        return void 0 !== a2 && (function(e3, t3) {
          if (!(function(e4) {
            if ("object" != typeof e4 || null === e4) return false;
            try {
              return "boolean" == typeof e4.aborted;
            } catch (e5) {
              return false;
            }
          })(e3)) throw new TypeError(`${t3} is not an AbortSignal.`);
        })(a2, `${t2} has member 'signal' that`), { preventAbort: Boolean(r2), preventCancel: Boolean(o2), preventClose: Boolean(n2), signal: a2 };
      }
      Object.defineProperties(ReadableStreamDefaultController.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, desiredSize: { enumerable: true } }), o(ReadableStreamDefaultController.prototype.close, "close"), o(ReadableStreamDefaultController.prototype.enqueue, "enqueue"), o(ReadableStreamDefaultController.prototype.error, "error"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(ReadableStreamDefaultController.prototype, Symbol.toStringTag, { value: "ReadableStreamDefaultController", configurable: true });
      class ReadableStream2 {
        constructor(e2 = {}, t2 = {}) {
          void 0 === e2 ? e2 = null : I(e2, "First parameter");
          const r2 = dt(t2, "Second parameter"), o2 = (function(e3, t3) {
            L(e3, t3);
            const r3 = e3, o3 = null == r3 ? void 0 : r3.autoAllocateChunkSize, n2 = null == r3 ? void 0 : r3.cancel, a2 = null == r3 ? void 0 : r3.pull, i2 = null == r3 ? void 0 : r3.start, l2 = null == r3 ? void 0 : r3.type;
            return { autoAllocateChunkSize: void 0 === o3 ? void 0 : x(o3, `${t3} has member 'autoAllocateChunkSize' that`), cancel: void 0 === n2 ? void 0 : gr(n2, r3, `${t3} has member 'cancel' that`), pull: void 0 === a2 ? void 0 : vr(a2, r3, `${t3} has member 'pull' that`), start: void 0 === i2 ? void 0 : wr(i2, r3, `${t3} has member 'start' that`), type: void 0 === l2 ? void 0 : Rr(l2, `${t3} has member 'type' that`) };
          })(e2, "First parameter");
          if (qr(this), "bytes" === o2.type) {
            if (void 0 !== r2.size) throw new RangeError("The strategy for a byte stream cannot have a size function");
            !(function(e3, t3, r3) {
              const o3 = Object.create(ReadableByteStreamController.prototype);
              let n2, a2, i2;
              n2 = void 0 !== t3.start ? () => t3.start(o3) : () => {
              }, a2 = void 0 !== t3.pull ? () => t3.pull(o3) : () => c(void 0), i2 = void 0 !== t3.cancel ? (e4) => t3.cancel(e4) : () => c(void 0);
              const l2 = t3.autoAllocateChunkSize;
              if (0 === l2) throw new TypeError("autoAllocateChunkSize must be greater than 0");
              Je(e3, o3, n2, a2, i2, r3, l2);
            })(this, o2, ut(r2, 0));
          } else {
            const e3 = ct(r2);
            !(function(e4, t3, r3, o3) {
              const n2 = Object.create(ReadableStreamDefaultController.prototype);
              let a2, i2, l2;
              a2 = void 0 !== t3.start ? () => t3.start(n2) : () => {
              }, i2 = void 0 !== t3.pull ? () => t3.pull(n2) : () => c(void 0), l2 = void 0 !== t3.cancel ? (e5) => t3.cancel(e5) : () => c(void 0), _r(e4, n2, a2, i2, l2, r3, o3);
            })(this, o2, ut(r2, 1), e3);
          }
        }
        get locked() {
          if (!Er(this)) throw kr("locked");
          return Wr(this);
        }
        cancel(e2 = void 0) {
          return Er(this) ? Wr(this) ? d(new TypeError("Cannot cancel a stream that already has a reader")) : Or(this, e2) : d(kr("cancel"));
        }
        getReader(e2 = void 0) {
          if (!Er(this)) throw kr("getReader");
          return void 0 === (function(e3, t2) {
            L(e3, t2);
            const r2 = null == e3 ? void 0 : e3.mode;
            return { mode: void 0 === r2 ? void 0 : et(r2, `${t2} has member 'mode' that`) };
          })(e2, "First parameter").mode ? H(this) : tt(this);
        }
        pipeThrough(e2, t2 = {}) {
          if (!Er(this)) throw kr("pipeThrough");
          $(e2, 1, "pipeThrough");
          const r2 = (function(e3, t3) {
            L(e3, t3);
            const r3 = null == e3 ? void 0 : e3.readable;
            M(r3, "readable", "ReadableWritablePair"), N(r3, `${t3} has member 'readable' that`);
            const o3 = null == e3 ? void 0 : e3.writable;
            return M(o3, "writable", "ReadableWritablePair"), pt(o3, `${t3} has member 'writable' that`), { readable: r3, writable: o3 };
          })(e2, "First parameter"), o2 = Tr(t2, "Second parameter");
          if (Wr(this)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          if (vt(r2.writable)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          return p(ir(this, r2.writable, o2.preventClose, o2.preventAbort, o2.preventCancel, o2.signal)), r2.readable;
        }
        pipeTo(e2, t2 = {}) {
          if (!Er(this)) return d(kr("pipeTo"));
          if (void 0 === e2) return d("Parameter 1 is required in 'pipeTo'.");
          if (!gt(e2)) return d(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
          let r2;
          try {
            r2 = Tr(t2, "Second parameter");
          } catch (e3) {
            return d(e3);
          }
          return Wr(this) ? d(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : vt(e2) ? d(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : ir(this, e2, r2.preventClose, r2.preventAbort, r2.preventCancel, r2.signal);
        }
        tee() {
          if (!Er(this)) throw kr("tee");
          return ne(yr(this));
        }
        values(e2 = void 0) {
          if (!Er(this)) throw kr("values");
          return (function(e3, t2) {
            const r2 = H(e3), o2 = new he(r2, t2), n2 = Object.create(me);
            return n2._asyncIteratorImpl = o2, n2;
          })(this, (function(e3, t2) {
            L(e3, t2);
            const r2 = null == e3 ? void 0 : e3.preventCancel;
            return { preventCancel: Boolean(r2) };
          })(e2, "First parameter").preventCancel);
        }
        [de](e2) {
          return this.values(e2);
        }
        static from(e2) {
          return Sr(e2);
        }
      }
      function Cr(e2, t2, r2, o2 = 1, n2 = () => 1) {
        const a2 = Object.create(ReadableStream2.prototype);
        qr(a2);
        return _r(a2, Object.create(ReadableStreamDefaultController.prototype), e2, t2, r2, o2, n2), a2;
      }
      function Pr(e2, t2, r2) {
        const o2 = Object.create(ReadableStream2.prototype);
        qr(o2);
        return Je(o2, Object.create(ReadableByteStreamController.prototype), e2, t2, r2, 0, void 0), o2;
      }
      function qr(e2) {
        e2._state = "readable", e2._reader = void 0, e2._storedError = void 0, e2._disturbed = false;
      }
      function Er(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_readableStreamController") && e2 instanceof ReadableStream2);
      }
      function Wr(e2) {
        return void 0 !== e2._reader;
      }
      function Or(t2, r2) {
        if (t2._disturbed = true, "closed" === t2._state) return c(void 0);
        if ("errored" === t2._state) return d(t2._storedError);
        Br(t2);
        const o2 = t2._reader;
        if (void 0 !== o2 && at(o2)) {
          const e2 = o2._readIntoRequests;
          o2._readIntoRequests = new v(), e2.forEach((e3) => {
            e3._closeSteps(void 0);
          });
        }
        return _(t2._readableStreamController[T](r2), e);
      }
      function Br(e2) {
        e2._state = "closed";
        const t2 = e2._reader;
        if (void 0 !== t2 && (A(t2), J(t2))) {
          const e3 = t2._readRequests;
          t2._readRequests = new v(), e3.forEach((e4) => {
            e4._closeSteps();
          });
        }
      }
      function jr(e2, t2) {
        e2._state = "errored", e2._storedError = t2;
        const r2 = e2._reader;
        void 0 !== r2 && (k(r2, t2), J(r2) ? Z(r2, t2) : lt(r2, t2));
      }
      function kr(e2) {
        return new TypeError(`ReadableStream.prototype.${e2} can only be used on a ReadableStream`);
      }
      function Ar(e2, t2) {
        L(e2, t2);
        const r2 = null == e2 ? void 0 : e2.highWaterMark;
        return M(r2, "highWaterMark", "QueuingStrategyInit"), { highWaterMark: Y(r2) };
      }
      Object.defineProperties(ReadableStream2, { from: { enumerable: true } }), Object.defineProperties(ReadableStream2.prototype, { cancel: { enumerable: true }, getReader: { enumerable: true }, pipeThrough: { enumerable: true }, pipeTo: { enumerable: true }, tee: { enumerable: true }, values: { enumerable: true }, locked: { enumerable: true } }), o(ReadableStream2.from, "from"), o(ReadableStream2.prototype.cancel, "cancel"), o(ReadableStream2.prototype.getReader, "getReader"), o(ReadableStream2.prototype.pipeThrough, "pipeThrough"), o(ReadableStream2.prototype.pipeTo, "pipeTo"), o(ReadableStream2.prototype.tee, "tee"), o(ReadableStream2.prototype.values, "values"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(ReadableStream2.prototype, Symbol.toStringTag, { value: "ReadableStream", configurable: true }), Object.defineProperty(ReadableStream2.prototype, de, { value: ReadableStream2.prototype.values, writable: true, configurable: true });
      const zr = (e2) => e2.byteLength;
      o(zr, "size");
      class ByteLengthQueuingStrategy {
        constructor(e2) {
          $(e2, 1, "ByteLengthQueuingStrategy"), e2 = Ar(e2, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = e2.highWaterMark;
        }
        get highWaterMark() {
          if (!Lr(this)) throw Dr("highWaterMark");
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        get size() {
          if (!Lr(this)) throw Dr("size");
          return zr;
        }
      }
      function Dr(e2) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${e2} can only be used on a ByteLengthQueuingStrategy`);
      }
      function Lr(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_byteLengthQueuingStrategyHighWaterMark") && e2 instanceof ByteLengthQueuingStrategy);
      }
      Object.defineProperties(ByteLengthQueuingStrategy.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(ByteLengthQueuingStrategy.prototype, Symbol.toStringTag, { value: "ByteLengthQueuingStrategy", configurable: true });
      const Fr = () => 1;
      o(Fr, "size");
      class CountQueuingStrategy {
        constructor(e2) {
          $(e2, 1, "CountQueuingStrategy"), e2 = Ar(e2, "First parameter"), this._countQueuingStrategyHighWaterMark = e2.highWaterMark;
        }
        get highWaterMark() {
          if (!$r(this)) throw Ir("highWaterMark");
          return this._countQueuingStrategyHighWaterMark;
        }
        get size() {
          if (!$r(this)) throw Ir("size");
          return Fr;
        }
      }
      function Ir(e2) {
        return new TypeError(`CountQueuingStrategy.prototype.${e2} can only be used on a CountQueuingStrategy`);
      }
      function $r(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_countQueuingStrategyHighWaterMark") && e2 instanceof CountQueuingStrategy);
      }
      function Mr(e2, t2, r2) {
        return F(e2, r2), (r3) => g(e2, t2, [r3]);
      }
      function Yr(e2, t2, r2) {
        return F(e2, r2), (r3) => S(e2, t2, [r3]);
      }
      function Qr(e2, t2, r2) {
        return F(e2, r2), (r3, o2) => g(e2, t2, [r3, o2]);
      }
      function xr(e2, t2, r2) {
        return F(e2, r2), (r3) => g(e2, t2, [r3]);
      }
      Object.defineProperties(CountQueuingStrategy.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(CountQueuingStrategy.prototype, Symbol.toStringTag, { value: "CountQueuingStrategy", configurable: true });
      class TransformStream {
        constructor(e2 = {}, t2 = {}, r2 = {}) {
          void 0 === e2 && (e2 = null);
          const o2 = dt(t2, "Second parameter"), n2 = dt(r2, "Third parameter"), a2 = (function(e3, t3) {
            L(e3, t3);
            const r3 = null == e3 ? void 0 : e3.cancel, o3 = null == e3 ? void 0 : e3.flush, n3 = null == e3 ? void 0 : e3.readableType, a3 = null == e3 ? void 0 : e3.start, i3 = null == e3 ? void 0 : e3.transform, l3 = null == e3 ? void 0 : e3.writableType;
            return { cancel: void 0 === r3 ? void 0 : xr(r3, e3, `${t3} has member 'cancel' that`), flush: void 0 === o3 ? void 0 : Mr(o3, e3, `${t3} has member 'flush' that`), readableType: n3, start: void 0 === a3 ? void 0 : Yr(a3, e3, `${t3} has member 'start' that`), transform: void 0 === i3 ? void 0 : Qr(i3, e3, `${t3} has member 'transform' that`), writableType: l3 };
          })(e2, "First parameter");
          if (void 0 !== a2.readableType) throw new RangeError("Invalid readableType specified");
          if (void 0 !== a2.writableType) throw new RangeError("Invalid writableType specified");
          const i2 = ut(n2, 0), l2 = ct(n2), s2 = ut(o2, 1), f2 = ct(o2);
          let h2;
          !(function(e3, t3, r3, o3, n3, a3) {
            function i3() {
              return t3;
            }
            function l3(t4) {
              return (function(e4, t5) {
                const r4 = e4._transformStreamController;
                if (e4._backpressure) {
                  return _(e4._backpressureChangePromise, () => {
                    const o4 = e4._writable;
                    if ("erroring" === o4._state) throw o4._storedError;
                    return Zr(r4, t5);
                  });
                }
                return Zr(r4, t5);
              })(e3, t4);
            }
            function s3(t4) {
              return (function(e4, t5) {
                const r4 = e4._transformStreamController;
                if (void 0 !== r4._finishPromise) return r4._finishPromise;
                const o4 = e4._readable;
                r4._finishPromise = u((e5, t6) => {
                  r4._finishPromise_resolve = e5, r4._finishPromise_reject = t6;
                });
                const n4 = r4._cancelAlgorithm(t5);
                return Jr(r4), b(n4, () => ("errored" === o4._state ? ro(r4, o4._storedError) : (br(o4._readableStreamController, t5), to(r4)), null), (e5) => (br(o4._readableStreamController, e5), ro(r4, e5), null)), r4._finishPromise;
              })(e3, t4);
            }
            function c2() {
              return (function(e4) {
                const t4 = e4._transformStreamController;
                if (void 0 !== t4._finishPromise) return t4._finishPromise;
                const r4 = e4._readable;
                t4._finishPromise = u((e5, r5) => {
                  t4._finishPromise_resolve = e5, t4._finishPromise_reject = r5;
                });
                const o4 = t4._flushAlgorithm();
                return Jr(t4), b(o4, () => ("errored" === r4._state ? ro(t4, r4._storedError) : (dr(r4._readableStreamController), to(t4)), null), (e5) => (br(r4._readableStreamController, e5), ro(t4, e5), null)), t4._finishPromise;
              })(e3);
            }
            function d2() {
              return (function(e4) {
                return Gr(e4, false), e4._backpressureChangePromise;
              })(e3);
            }
            function f3(t4) {
              return (function(e4, t5) {
                const r4 = e4._transformStreamController;
                if (void 0 !== r4._finishPromise) return r4._finishPromise;
                const o4 = e4._writable;
                r4._finishPromise = u((e5, t6) => {
                  r4._finishPromise_resolve = e5, r4._finishPromise_reject = t6;
                });
                const n4 = r4._cancelAlgorithm(t5);
                return Jr(r4), b(n4, () => ("errored" === o4._state ? ro(r4, o4._storedError) : (Yt(o4._writableStreamController, t5), Ur(e4), to(r4)), null), (t6) => (Yt(o4._writableStreamController, t6), Ur(e4), ro(r4, t6), null)), r4._finishPromise;
              })(e3, t4);
            }
            e3._writable = (function(e4, t4, r4, o4, n4 = 1, a4 = () => 1) {
              const i4 = Object.create(WritableStream.prototype);
              return St(i4), Ft(i4, Object.create(WritableStreamDefaultController.prototype), e4, t4, r4, o4, n4, a4), i4;
            })(i3, l3, c2, s3, r3, o3), e3._readable = Cr(i3, d2, f3, n3, a3), e3._backpressure = void 0, e3._backpressureChangePromise = void 0, e3._backpressureChangePromise_resolve = void 0, Gr(e3, true), e3._transformStreamController = void 0;
          })(this, u((e3) => {
            h2 = e3;
          }), s2, f2, i2, l2), (function(e3, t3) {
            const r3 = Object.create(TransformStreamDefaultController.prototype);
            let o3, n3, a3;
            o3 = void 0 !== t3.transform ? (e4) => t3.transform(e4, r3) : (e4) => {
              try {
                return Kr(r3, e4), c(void 0);
              } catch (e5) {
                return d(e5);
              }
            };
            n3 = void 0 !== t3.flush ? () => t3.flush(r3) : () => c(void 0);
            a3 = void 0 !== t3.cancel ? (e4) => t3.cancel(e4) : () => c(void 0);
            !(function(e4, t4, r4, o4, n4) {
              t4._controlledTransformStream = e4, e4._transformStreamController = t4, t4._transformAlgorithm = r4, t4._flushAlgorithm = o4, t4._cancelAlgorithm = n4, t4._finishPromise = void 0, t4._finishPromise_resolve = void 0, t4._finishPromise_reject = void 0;
            })(e3, r3, o3, n3, a3);
          })(this, a2), void 0 !== a2.start ? h2(a2.start(this._transformStreamController)) : h2(void 0);
        }
        get readable() {
          if (!Nr(this)) throw oo("readable");
          return this._readable;
        }
        get writable() {
          if (!Nr(this)) throw oo("writable");
          return this._writable;
        }
      }
      function Nr(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_transformStreamController") && e2 instanceof TransformStream);
      }
      function Hr(e2, t2) {
        br(e2._readable._readableStreamController, t2), Vr(e2, t2);
      }
      function Vr(e2, t2) {
        Jr(e2._transformStreamController), Yt(e2._writable._writableStreamController, t2), Ur(e2);
      }
      function Ur(e2) {
        e2._backpressure && Gr(e2, false);
      }
      function Gr(e2, t2) {
        void 0 !== e2._backpressureChangePromise && e2._backpressureChangePromise_resolve(), e2._backpressureChangePromise = u((t3) => {
          e2._backpressureChangePromise_resolve = t3;
        }), e2._backpressure = t2;
      }
      Object.defineProperties(TransformStream.prototype, { readable: { enumerable: true }, writable: { enumerable: true } }), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(TransformStream.prototype, Symbol.toStringTag, { value: "TransformStream", configurable: true });
      class TransformStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get desiredSize() {
          if (!Xr(this)) throw eo("desiredSize");
          return hr(this._controlledTransformStream._readable._readableStreamController);
        }
        enqueue(e2 = void 0) {
          if (!Xr(this)) throw eo("enqueue");
          Kr(this, e2);
        }
        error(e2 = void 0) {
          if (!Xr(this)) throw eo("error");
          var t2;
          t2 = e2, Hr(this._controlledTransformStream, t2);
        }
        terminate() {
          if (!Xr(this)) throw eo("terminate");
          !(function(e2) {
            const t2 = e2._controlledTransformStream;
            dr(t2._readable._readableStreamController);
            const r2 = new TypeError("TransformStream terminated");
            Vr(t2, r2);
          })(this);
        }
      }
      function Xr(e2) {
        return !!t(e2) && (!!Object.prototype.hasOwnProperty.call(e2, "_controlledTransformStream") && e2 instanceof TransformStreamDefaultController);
      }
      function Jr(e2) {
        e2._transformAlgorithm = void 0, e2._flushAlgorithm = void 0, e2._cancelAlgorithm = void 0;
      }
      function Kr(e2, t2) {
        const r2 = e2._controlledTransformStream, o2 = r2._readable._readableStreamController;
        if (!mr(o2)) throw new TypeError("Readable side is not in a state that permits enqueue");
        try {
          fr(o2, t2);
        } catch (e3) {
          throw Vr(r2, e3), r2._readable._storedError;
        }
        const n2 = (function(e3) {
          return !ur(e3);
        })(o2);
        n2 !== r2._backpressure && Gr(r2, true);
      }
      function Zr(e2, t2) {
        return _(e2._transformAlgorithm(t2), void 0, (t3) => {
          throw Hr(e2._controlledTransformStream, t3), t3;
        });
      }
      function eo(e2) {
        return new TypeError(`TransformStreamDefaultController.prototype.${e2} can only be used on a TransformStreamDefaultController`);
      }
      function to(e2) {
        void 0 !== e2._finishPromise_resolve && (e2._finishPromise_resolve(), e2._finishPromise_resolve = void 0, e2._finishPromise_reject = void 0);
      }
      function ro(e2, t2) {
        void 0 !== e2._finishPromise_reject && (p(e2._finishPromise), e2._finishPromise_reject(t2), e2._finishPromise_resolve = void 0, e2._finishPromise_reject = void 0);
      }
      function oo(e2) {
        return new TypeError(`TransformStream.prototype.${e2} can only be used on a TransformStream`);
      }
      Object.defineProperties(TransformStreamDefaultController.prototype, { enqueue: { enumerable: true }, error: { enumerable: true }, terminate: { enumerable: true }, desiredSize: { enumerable: true } }), o(TransformStreamDefaultController.prototype.enqueue, "enqueue"), o(TransformStreamDefaultController.prototype.error, "error"), o(TransformStreamDefaultController.prototype.terminate, "terminate"), "symbol" == typeof Symbol.toStringTag && Object.defineProperty(TransformStreamDefaultController.prototype, Symbol.toStringTag, { value: "TransformStreamDefaultController", configurable: true });
      const no = { ReadableStream: ReadableStream2, ReadableStreamDefaultController, ReadableByteStreamController, ReadableStreamBYOBRequest, ReadableStreamDefaultReader, ReadableStreamBYOBReader, WritableStream, WritableStreamDefaultController, WritableStreamDefaultWriter, ByteLengthQueuingStrategy, CountQueuingStrategy, TransformStream, TransformStreamDefaultController };
      for (const e2 in no) Object.prototype.hasOwnProperty.call(no, e2) && Object.defineProperty(nr, e2, { value: no[e2], writable: true, configurable: true });
    })();
  }
});

// node_modules/@ungap/structured-clone/cjs/types.js
var require_types = __commonJS({
  "node_modules/@ungap/structured-clone/cjs/types.js"(exports2) {
    "use strict";
    var VOID = -1;
    exports2.VOID = VOID;
    var PRIMITIVE = 0;
    exports2.PRIMITIVE = PRIMITIVE;
    var ARRAY = 1;
    exports2.ARRAY = ARRAY;
    var OBJECT = 2;
    exports2.OBJECT = OBJECT;
    var DATE = 3;
    exports2.DATE = DATE;
    var REGEXP = 4;
    exports2.REGEXP = REGEXP;
    var MAP = 5;
    exports2.MAP = MAP;
    var SET = 6;
    exports2.SET = SET;
    var ERROR = 7;
    exports2.ERROR = ERROR;
    var BIGINT = 8;
    exports2.BIGINT = BIGINT;
  }
});

// node_modules/@ungap/structured-clone/cjs/deserialize.js
var require_deserialize = __commonJS({
  "node_modules/@ungap/structured-clone/cjs/deserialize.js"(exports2) {
    "use strict";
    var {
      VOID,
      PRIMITIVE,
      ARRAY,
      OBJECT,
      DATE,
      REGEXP,
      MAP,
      SET,
      ERROR,
      BIGINT
    } = require_types();
    var env = typeof self === "object" ? self : globalThis;
    var deserializer = ($, _) => {
      const as = (out, index) => {
        $.set(index, out);
        return out;
      };
      const unpair = (index) => {
        if ($.has(index))
          return $.get(index);
        const [type, value] = _[index];
        switch (type) {
          case PRIMITIVE:
          case VOID:
            return as(value, index);
          case ARRAY: {
            const arr = as([], index);
            for (const index2 of value)
              arr.push(unpair(index2));
            return arr;
          }
          case OBJECT: {
            const object = as({}, index);
            for (const [key, index2] of value)
              object[unpair(key)] = unpair(index2);
            return object;
          }
          case DATE:
            return as(new Date(value), index);
          case REGEXP: {
            const { source, flags } = value;
            return as(new RegExp(source, flags), index);
          }
          case MAP: {
            const map = as(/* @__PURE__ */ new Map(), index);
            for (const [key, index2] of value)
              map.set(unpair(key), unpair(index2));
            return map;
          }
          case SET: {
            const set = as(/* @__PURE__ */ new Set(), index);
            for (const index2 of value)
              set.add(unpair(index2));
            return set;
          }
          case ERROR: {
            const { name, message } = value;
            return as(new env[name](message), index);
          }
          case BIGINT:
            return as(BigInt(value), index);
          case "BigInt":
            return as(Object(BigInt(value)), index);
          case "ArrayBuffer":
            return as(new Uint8Array(value).buffer, value);
          case "DataView": {
            const { buffer } = new Uint8Array(value);
            return as(new DataView(buffer), value);
          }
        }
        return as(new env[type](value), index);
      };
      return unpair;
    };
    var deserialize = (serialized) => deserializer(/* @__PURE__ */ new Map(), serialized)(0);
    exports2.deserialize = deserialize;
  }
});

// node_modules/@ungap/structured-clone/cjs/serialize.js
var require_serialize = __commonJS({
  "node_modules/@ungap/structured-clone/cjs/serialize.js"(exports2) {
    "use strict";
    var {
      VOID,
      PRIMITIVE,
      ARRAY,
      OBJECT,
      DATE,
      REGEXP,
      MAP,
      SET,
      ERROR,
      BIGINT
    } = require_types();
    var EMPTY = "";
    var { toString } = {};
    var { keys } = Object;
    var typeOf = (value) => {
      const type = typeof value;
      if (type !== "object" || !value)
        return [PRIMITIVE, type];
      const asString = toString.call(value).slice(8, -1);
      switch (asString) {
        case "Array":
          return [ARRAY, EMPTY];
        case "Object":
          return [OBJECT, EMPTY];
        case "Date":
          return [DATE, EMPTY];
        case "RegExp":
          return [REGEXP, EMPTY];
        case "Map":
          return [MAP, EMPTY];
        case "Set":
          return [SET, EMPTY];
        case "DataView":
          return [ARRAY, asString];
      }
      if (asString.includes("Array"))
        return [ARRAY, asString];
      if (asString.includes("Error"))
        return [ERROR, asString];
      return [OBJECT, asString];
    };
    var shouldSkip = ([TYPE, type]) => TYPE === PRIMITIVE && (type === "function" || type === "symbol");
    var serializer = (strict, json, $, _) => {
      const as = (out, value) => {
        const index = _.push(out) - 1;
        $.set(value, index);
        return index;
      };
      const pair = (value) => {
        if ($.has(value))
          return $.get(value);
        let [TYPE, type] = typeOf(value);
        switch (TYPE) {
          case PRIMITIVE: {
            let entry = value;
            switch (type) {
              case "bigint":
                TYPE = BIGINT;
                entry = value.toString();
                break;
              case "function":
              case "symbol":
                if (strict)
                  throw new TypeError("unable to serialize " + type);
                entry = null;
                break;
              case "undefined":
                return as([VOID], value);
            }
            return as([TYPE, entry], value);
          }
          case ARRAY: {
            if (type) {
              let spread = value;
              if (type === "DataView") {
                spread = new Uint8Array(value.buffer);
              } else if (type === "ArrayBuffer") {
                spread = new Uint8Array(value);
              }
              return as([type, [...spread]], value);
            }
            const arr = [];
            const index = as([TYPE, arr], value);
            for (const entry of value)
              arr.push(pair(entry));
            return index;
          }
          case OBJECT: {
            if (type) {
              switch (type) {
                case "BigInt":
                  return as([type, value.toString()], value);
                case "Boolean":
                case "Number":
                case "String":
                  return as([type, value.valueOf()], value);
              }
            }
            if (json && "toJSON" in value)
              return pair(value.toJSON());
            const entries = [];
            const index = as([TYPE, entries], value);
            for (const key of keys(value)) {
              if (strict || !shouldSkip(typeOf(value[key])))
                entries.push([pair(key), pair(value[key])]);
            }
            return index;
          }
          case DATE:
            return as([TYPE, value.toISOString()], value);
          case REGEXP: {
            const { source, flags } = value;
            return as([TYPE, { source, flags }], value);
          }
          case MAP: {
            const entries = [];
            const index = as([TYPE, entries], value);
            for (const [key, entry] of value) {
              if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))
                entries.push([pair(key), pair(entry)]);
            }
            return index;
          }
          case SET: {
            const entries = [];
            const index = as([TYPE, entries], value);
            for (const entry of value) {
              if (strict || !shouldSkip(typeOf(entry)))
                entries.push(pair(entry));
            }
            return index;
          }
        }
        const { message } = value;
        return as([TYPE, { name: type, message }], value);
      };
      return pair;
    };
    var serialize = (value, { json, lossy } = {}) => {
      const _ = [];
      return serializer(!(json || lossy), !!json, /* @__PURE__ */ new Map(), _)(value), _;
    };
    exports2.serialize = serialize;
  }
});

// node_modules/@ungap/structured-clone/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/@ungap/structured-clone/cjs/index.js"(exports2) {
    "use strict";
    var { deserialize } = require_deserialize();
    var { serialize } = require_serialize();
    Object.defineProperty(exports2, "__esModule", { value: true }).default = typeof structuredClone === "function" ? (
      /* c8 ignore start */
      (any, options) => options && ("json" in options || "lossy" in options) ? deserialize(serialize(any, options)) : structuredClone(any)
    ) : (any, options) => deserialize(serialize(any, options));
    exports2.deserialize = deserialize;
    exports2.serialize = serialize;
  }
});

// node_modules/js-yaml/lib/common.js
var require_common = __commonJS({
  "node_modules/js-yaml/lib/common.js"(exports2, module2) {
    "use strict";
    function isNothing(subject) {
      return typeof subject === "undefined" || subject === null;
    }
    function isObject(subject) {
      return typeof subject === "object" && subject !== null;
    }
    function toArray(sequence) {
      if (Array.isArray(sequence)) return sequence;
      else if (isNothing(sequence)) return [];
      return [sequence];
    }
    function extend(target, source) {
      var index, length, key, sourceKeys;
      if (source) {
        sourceKeys = Object.keys(source);
        for (index = 0, length = sourceKeys.length; index < length; index += 1) {
          key = sourceKeys[index];
          target[key] = source[key];
        }
      }
      return target;
    }
    function repeat(string, count) {
      var result = "", cycle;
      for (cycle = 0; cycle < count; cycle += 1) {
        result += string;
      }
      return result;
    }
    function isNegativeZero(number) {
      return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
    }
    module2.exports.isNothing = isNothing;
    module2.exports.isObject = isObject;
    module2.exports.toArray = toArray;
    module2.exports.repeat = repeat;
    module2.exports.isNegativeZero = isNegativeZero;
    module2.exports.extend = extend;
  }
});

// node_modules/js-yaml/lib/exception.js
var require_exception = __commonJS({
  "node_modules/js-yaml/lib/exception.js"(exports2, module2) {
    "use strict";
    function formatError(exception, compact) {
      var where = "", message = exception.reason || "(unknown reason)";
      if (!exception.mark) return message;
      if (exception.mark.name) {
        where += 'in "' + exception.mark.name + '" ';
      }
      where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
      if (!compact && exception.mark.snippet) {
        where += "\n\n" + exception.mark.snippet;
      }
      return message + " " + where;
    }
    function YAMLException(reason, mark) {
      Error.call(this);
      this.name = "YAMLException";
      this.reason = reason;
      this.mark = mark;
      this.message = formatError(this, false);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error().stack || "";
      }
    }
    YAMLException.prototype = Object.create(Error.prototype);
    YAMLException.prototype.constructor = YAMLException;
    YAMLException.prototype.toString = function toString(compact) {
      return this.name + ": " + formatError(this, compact);
    };
    module2.exports = YAMLException;
  }
});

// node_modules/js-yaml/lib/snippet.js
var require_snippet = __commonJS({
  "node_modules/js-yaml/lib/snippet.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
      var head = "";
      var tail = "";
      var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
      if (position - lineStart > maxHalfLength) {
        head = " ... ";
        lineStart = position - maxHalfLength + head.length;
      }
      if (lineEnd - position > maxHalfLength) {
        tail = " ...";
        lineEnd = position + maxHalfLength - tail.length;
      }
      return {
        str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
        pos: position - lineStart + head.length
        // relative position
      };
    }
    function padStart(string, max) {
      return common.repeat(" ", max - string.length) + string;
    }
    function makeSnippet(mark, options) {
      options = Object.create(options || null);
      if (!mark.buffer) return null;
      if (!options.maxLength) options.maxLength = 79;
      if (typeof options.indent !== "number") options.indent = 1;
      if (typeof options.linesBefore !== "number") options.linesBefore = 3;
      if (typeof options.linesAfter !== "number") options.linesAfter = 2;
      var re = /\r?\n|\r|\0/g;
      var lineStarts = [0];
      var lineEnds = [];
      var match;
      var foundLineNo = -1;
      while (match = re.exec(mark.buffer)) {
        lineEnds.push(match.index);
        lineStarts.push(match.index + match[0].length);
        if (mark.position <= match.index && foundLineNo < 0) {
          foundLineNo = lineStarts.length - 2;
        }
      }
      if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
      var result = "", i, line;
      var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
      var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
      for (i = 1; i <= options.linesBefore; i++) {
        if (foundLineNo - i < 0) break;
        line = getLine(
          mark.buffer,
          lineStarts[foundLineNo - i],
          lineEnds[foundLineNo - i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
          maxLineLength
        );
        result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
      }
      line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
      result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
      result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
      for (i = 1; i <= options.linesAfter; i++) {
        if (foundLineNo + i >= lineEnds.length) break;
        line = getLine(
          mark.buffer,
          lineStarts[foundLineNo + i],
          lineEnds[foundLineNo + i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
          maxLineLength
        );
        result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
      }
      return result.replace(/\n$/, "");
    }
    module2.exports = makeSnippet;
  }
});

// node_modules/js-yaml/lib/type.js
var require_type = __commonJS({
  "node_modules/js-yaml/lib/type.js"(exports2, module2) {
    "use strict";
    var YAMLException = require_exception();
    var TYPE_CONSTRUCTOR_OPTIONS = [
      "kind",
      "multi",
      "resolve",
      "construct",
      "instanceOf",
      "predicate",
      "represent",
      "representName",
      "defaultStyle",
      "styleAliases"
    ];
    var YAML_NODE_KINDS = [
      "scalar",
      "sequence",
      "mapping"
    ];
    function compileStyleAliases(map) {
      var result = {};
      if (map !== null) {
        Object.keys(map).forEach(function(style) {
          map[style].forEach(function(alias) {
            result[String(alias)] = style;
          });
        });
      }
      return result;
    }
    function Type(tag, options) {
      options = options || {};
      Object.keys(options).forEach(function(name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      });
      this.options = options;
      this.tag = tag;
      this.kind = options["kind"] || null;
      this.resolve = options["resolve"] || function() {
        return true;
      };
      this.construct = options["construct"] || function(data) {
        return data;
      };
      this.instanceOf = options["instanceOf"] || null;
      this.predicate = options["predicate"] || null;
      this.represent = options["represent"] || null;
      this.representName = options["representName"] || null;
      this.defaultStyle = options["defaultStyle"] || null;
      this.multi = options["multi"] || false;
      this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }
    module2.exports = Type;
  }
});

// node_modules/js-yaml/lib/schema.js
var require_schema = __commonJS({
  "node_modules/js-yaml/lib/schema.js"(exports2, module2) {
    "use strict";
    var YAMLException = require_exception();
    var Type = require_type();
    function compileList(schema, name) {
      var result = [];
      schema[name].forEach(function(currentType) {
        var newIndex = result.length;
        result.forEach(function(previousType, previousIndex) {
          if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
            newIndex = previousIndex;
          }
        });
        result[newIndex] = currentType;
      });
      return result;
    }
    function compileMap() {
      var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {},
        multi: {
          scalar: [],
          sequence: [],
          mapping: [],
          fallback: []
        }
      }, index, length;
      function collectType(type) {
        if (type.multi) {
          result.multi[type.kind].push(type);
          result.multi["fallback"].push(type);
        } else {
          result[type.kind][type.tag] = result["fallback"][type.tag] = type;
        }
      }
      for (index = 0, length = arguments.length; index < length; index += 1) {
        arguments[index].forEach(collectType);
      }
      return result;
    }
    function Schema(definition) {
      return this.extend(definition);
    }
    Schema.prototype.extend = function extend(definition) {
      var implicit = [];
      var explicit = [];
      if (definition instanceof Type) {
        explicit.push(definition);
      } else if (Array.isArray(definition)) {
        explicit = explicit.concat(definition);
      } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
        if (definition.implicit) implicit = implicit.concat(definition.implicit);
        if (definition.explicit) explicit = explicit.concat(definition.explicit);
      } else {
        throw new YAMLException("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
      }
      implicit.forEach(function(type) {
        if (!(type instanceof Type)) {
          throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
        if (type.loadKind && type.loadKind !== "scalar") {
          throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
        }
        if (type.multi) {
          throw new YAMLException("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
        }
      });
      explicit.forEach(function(type) {
        if (!(type instanceof Type)) {
          throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
      });
      var result = Object.create(Schema.prototype);
      result.implicit = (this.implicit || []).concat(implicit);
      result.explicit = (this.explicit || []).concat(explicit);
      result.compiledImplicit = compileList(result, "implicit");
      result.compiledExplicit = compileList(result, "explicit");
      result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
      return result;
    };
    module2.exports = Schema;
  }
});

// node_modules/js-yaml/lib/type/str.js
var require_str = __commonJS({
  "node_modules/js-yaml/lib/type/str.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function(data) {
        return data !== null ? data : "";
      }
    });
  }
});

// node_modules/js-yaml/lib/type/seq.js
var require_seq = __commonJS({
  "node_modules/js-yaml/lib/type/seq.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:seq", {
      kind: "sequence",
      construct: function(data) {
        return data !== null ? data : [];
      }
    });
  }
});

// node_modules/js-yaml/lib/type/map.js
var require_map = __commonJS({
  "node_modules/js-yaml/lib/type/map.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:map", {
      kind: "mapping",
      construct: function(data) {
        return data !== null ? data : {};
      }
    });
  }
});

// node_modules/js-yaml/lib/schema/failsafe.js
var require_failsafe = __commonJS({
  "node_modules/js-yaml/lib/schema/failsafe.js"(exports2, module2) {
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      explicit: [
        require_str(),
        require_seq(),
        require_map()
      ]
    });
  }
});

// node_modules/js-yaml/lib/type/null.js
var require_null = __commonJS({
  "node_modules/js-yaml/lib/type/null.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlNull(data) {
      if (data === null) return true;
      var max = data.length;
      return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
    }
    function constructYamlNull() {
      return null;
    }
    function isNull(object) {
      return object === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:null", {
      kind: "scalar",
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function() {
          return "~";
        },
        lowercase: function() {
          return "null";
        },
        uppercase: function() {
          return "NULL";
        },
        camelcase: function() {
          return "Null";
        },
        empty: function() {
          return "";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/type/bool.js
var require_bool = __commonJS({
  "node_modules/js-yaml/lib/type/bool.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlBoolean(data) {
      if (data === null) return false;
      var max = data.length;
      return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
    }
    function constructYamlBoolean(data) {
      return data === "true" || data === "True" || data === "TRUE";
    }
    function isBoolean(object) {
      return Object.prototype.toString.call(object) === "[object Boolean]";
    }
    module2.exports = new Type("tag:yaml.org,2002:bool", {
      kind: "scalar",
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function(object) {
          return object ? "true" : "false";
        },
        uppercase: function(object) {
          return object ? "TRUE" : "FALSE";
        },
        camelcase: function(object) {
          return object ? "True" : "False";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/type/int.js
var require_int = __commonJS({
  "node_modules/js-yaml/lib/type/int.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var Type = require_type();
    function isHexCode(c) {
      return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
    }
    function isOctCode(c) {
      return 48 <= c && c <= 55;
    }
    function isDecCode(c) {
      return 48 <= c && c <= 57;
    }
    function resolveYamlInteger(data) {
      if (data === null) return false;
      var max = data.length, index = 0, hasDigits = false, ch;
      if (!max) return false;
      ch = data[index];
      if (ch === "-" || ch === "+") {
        ch = data[++index];
      }
      if (ch === "0") {
        if (index + 1 === max) return true;
        ch = data[++index];
        if (ch === "b") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (ch !== "0" && ch !== "1") return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        if (ch === "x") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (!isHexCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        if (ch === "o") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (!isOctCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
      }
      if (ch === "_") return false;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isDecCode(data.charCodeAt(index))) {
          return false;
        }
        hasDigits = true;
      }
      if (!hasDigits || ch === "_") return false;
      return true;
    }
    function constructYamlInteger(data) {
      var value = data, sign = 1, ch;
      if (value.indexOf("_") !== -1) {
        value = value.replace(/_/g, "");
      }
      ch = value[0];
      if (ch === "-" || ch === "+") {
        if (ch === "-") sign = -1;
        value = value.slice(1);
        ch = value[0];
      }
      if (value === "0") return 0;
      if (ch === "0") {
        if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
        if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
      }
      return sign * parseInt(value, 10);
    }
    function isInteger(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:int", {
      kind: "scalar",
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function(obj) {
          return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
        },
        octal: function(obj) {
          return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
        },
        decimal: function(obj) {
          return obj.toString(10);
        },
        /* eslint-disable max-len */
        hexadecimal: function(obj) {
          return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: "decimal",
      styleAliases: {
        binary: [2, "bin"],
        octal: [8, "oct"],
        decimal: [10, "dec"],
        hexadecimal: [16, "hex"]
      }
    });
  }
});

// node_modules/js-yaml/lib/type/float.js
var require_float = __commonJS({
  "node_modules/js-yaml/lib/type/float.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var Type = require_type();
    var YAML_FLOAT_PATTERN = new RegExp(
      // 2.5e4, 2.5 and integers
      "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
    );
    function resolveYamlFloat(data) {
      if (data === null) return false;
      if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === "_") {
        return false;
      }
      return true;
    }
    function constructYamlFloat(data) {
      var value, sign;
      value = data.replace(/_/g, "").toLowerCase();
      sign = value[0] === "-" ? -1 : 1;
      if ("+-".indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }
      if (value === ".inf") {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      } else if (value === ".nan") {
        return NaN;
      }
      return sign * parseFloat(value, 10);
    }
    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
    function representYamlFloat(object, style) {
      var res;
      if (isNaN(object)) {
        switch (style) {
          case "lowercase":
            return ".nan";
          case "uppercase":
            return ".NAN";
          case "camelcase":
            return ".NaN";
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return ".inf";
          case "uppercase":
            return ".INF";
          case "camelcase":
            return ".Inf";
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return "-.inf";
          case "uppercase":
            return "-.INF";
          case "camelcase":
            return "-.Inf";
        }
      } else if (common.isNegativeZero(object)) {
        return "-0.0";
      }
      res = object.toString(10);
      return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
    }
    function isFloat(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:float", {
      kind: "scalar",
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/schema/json.js
var require_json = __commonJS({
  "node_modules/js-yaml/lib/schema/json.js"(exports2, module2) {
    "use strict";
    module2.exports = require_failsafe().extend({
      implicit: [
        require_null(),
        require_bool(),
        require_int(),
        require_float()
      ]
    });
  }
});

// node_modules/js-yaml/lib/schema/core.js
var require_core = __commonJS({
  "node_modules/js-yaml/lib/schema/core.js"(exports2, module2) {
    "use strict";
    module2.exports = require_json();
  }
});

// node_modules/js-yaml/lib/type/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/js-yaml/lib/type/timestamp.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var YAML_DATE_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
    );
    var YAML_TIMESTAMP_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
    );
    function resolveYamlTimestamp(data) {
      if (data === null) return false;
      if (YAML_DATE_REGEXP.exec(data) !== null) return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
      return false;
    }
    function constructYamlTimestamp(data) {
      var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
      match = YAML_DATE_REGEXP.exec(data);
      if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
      if (match === null) throw new Error("Date resolve error");
      year = +match[1];
      month = +match[2] - 1;
      day = +match[3];
      if (!match[4]) {
        return new Date(Date.UTC(year, month, day));
      }
      hour = +match[4];
      minute = +match[5];
      second = +match[6];
      if (match[7]) {
        fraction = match[7].slice(0, 3);
        while (fraction.length < 3) {
          fraction += "0";
        }
        fraction = +fraction;
      }
      if (match[9]) {
        tz_hour = +match[10];
        tz_minute = +(match[11] || 0);
        delta = (tz_hour * 60 + tz_minute) * 6e4;
        if (match[9] === "-") delta = -delta;
      }
      date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
      if (delta) date.setTime(date.getTime() - delta);
      return date;
    }
    function representYamlTimestamp(object) {
      return object.toISOString();
    }
    module2.exports = new Type("tag:yaml.org,2002:timestamp", {
      kind: "scalar",
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });
  }
});

// node_modules/js-yaml/lib/type/merge.js
var require_merge = __commonJS({
  "node_modules/js-yaml/lib/type/merge.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlMerge(data) {
      return data === "<<" || data === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:merge", {
      kind: "scalar",
      resolve: resolveYamlMerge
    });
  }
});

// node_modules/js-yaml/lib/type/binary.js
var require_binary = __commonJS({
  "node_modules/js-yaml/lib/type/binary.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
    function resolveYamlBinary(data) {
      if (data === null) return false;
      var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx));
        if (code > 64) continue;
        if (code < 0) return false;
        bitlen += 6;
      }
      return bitlen % 8 === 0;
    }
    function constructYamlBinary(data) {
      var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map = BASE64_MAP, bits = 0, result = [];
      for (idx = 0; idx < max; idx++) {
        if (idx % 4 === 0 && idx) {
          result.push(bits >> 16 & 255);
          result.push(bits >> 8 & 255);
          result.push(bits & 255);
        }
        bits = bits << 6 | map.indexOf(input.charAt(idx));
      }
      tailbits = max % 4 * 6;
      if (tailbits === 0) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      } else if (tailbits === 18) {
        result.push(bits >> 10 & 255);
        result.push(bits >> 2 & 255);
      } else if (tailbits === 12) {
        result.push(bits >> 4 & 255);
      }
      return new Uint8Array(result);
    }
    function representYamlBinary(object) {
      var result = "", bits = 0, idx, tail, max = object.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        if (idx % 3 === 0 && idx) {
          result += map[bits >> 18 & 63];
          result += map[bits >> 12 & 63];
          result += map[bits >> 6 & 63];
          result += map[bits & 63];
        }
        bits = (bits << 8) + object[idx];
      }
      tail = max % 3;
      if (tail === 0) {
        result += map[bits >> 18 & 63];
        result += map[bits >> 12 & 63];
        result += map[bits >> 6 & 63];
        result += map[bits & 63];
      } else if (tail === 2) {
        result += map[bits >> 10 & 63];
        result += map[bits >> 4 & 63];
        result += map[bits << 2 & 63];
        result += map[64];
      } else if (tail === 1) {
        result += map[bits >> 2 & 63];
        result += map[bits << 4 & 63];
        result += map[64];
        result += map[64];
      }
      return result;
    }
    function isBinary(obj) {
      return Object.prototype.toString.call(obj) === "[object Uint8Array]";
    }
    module2.exports = new Type("tag:yaml.org,2002:binary", {
      kind: "scalar",
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });
  }
});

// node_modules/js-yaml/lib/type/omap.js
var require_omap = __commonJS({
  "node_modules/js-yaml/lib/type/omap.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var _toString = Object.prototype.toString;
    function resolveYamlOmap(data) {
      if (data === null) return true;
      var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        pairHasKey = false;
        if (_toString.call(pair) !== "[object Object]") return false;
        for (pairKey in pair) {
          if (_hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey) pairHasKey = true;
            else return false;
          }
        }
        if (!pairHasKey) return false;
        if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
        else return false;
      }
      return true;
    }
    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }
    module2.exports = new Type("tag:yaml.org,2002:omap", {
      kind: "sequence",
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });
  }
});

// node_modules/js-yaml/lib/type/pairs.js
var require_pairs = __commonJS({
  "node_modules/js-yaml/lib/type/pairs.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _toString = Object.prototype.toString;
    function resolveYamlPairs(data) {
      if (data === null) return true;
      var index, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        if (_toString.call(pair) !== "[object Object]") return false;
        keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [keys[0], pair[keys[0]]];
      }
      return true;
    }
    function constructYamlPairs(data) {
      if (data === null) return [];
      var index, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        keys = Object.keys(pair);
        result[index] = [keys[0], pair[keys[0]]];
      }
      return result;
    }
    module2.exports = new Type("tag:yaml.org,2002:pairs", {
      kind: "sequence",
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });
  }
});

// node_modules/js-yaml/lib/type/set.js
var require_set = __commonJS({
  "node_modules/js-yaml/lib/type/set.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    function resolveYamlSet(data) {
      if (data === null) return true;
      var key, object = data;
      for (key in object) {
        if (_hasOwnProperty.call(object, key)) {
          if (object[key] !== null) return false;
        }
      }
      return true;
    }
    function constructYamlSet(data) {
      return data !== null ? data : {};
    }
    module2.exports = new Type("tag:yaml.org,2002:set", {
      kind: "mapping",
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });
  }
});

// node_modules/js-yaml/lib/schema/default.js
var require_default = __commonJS({
  "node_modules/js-yaml/lib/schema/default.js"(exports2, module2) {
    "use strict";
    module2.exports = require_core().extend({
      implicit: [
        require_timestamp(),
        require_merge()
      ],
      explicit: [
        require_binary(),
        require_omap(),
        require_pairs(),
        require_set()
      ]
    });
  }
});

// node_modules/js-yaml/lib/loader.js
var require_loader = __commonJS({
  "node_modules/js-yaml/lib/loader.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var makeSnippet = require_snippet();
    var DEFAULT_SCHEMA = require_default();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CONTEXT_FLOW_IN = 1;
    var CONTEXT_FLOW_OUT = 2;
    var CONTEXT_BLOCK_IN = 3;
    var CONTEXT_BLOCK_OUT = 4;
    var CHOMPING_CLIP = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP = 3;
    var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
    var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
    var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
    function _class(obj) {
      return Object.prototype.toString.call(obj);
    }
    function is_EOL(c) {
      return c === 10 || c === 13;
    }
    function is_WHITE_SPACE(c) {
      return c === 9 || c === 32;
    }
    function is_WS_OR_EOL(c) {
      return c === 9 || c === 32 || c === 10 || c === 13;
    }
    function is_FLOW_INDICATOR(c) {
      return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
    }
    function fromHexCode(c) {
      var lc;
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      lc = c | 32;
      if (97 <= lc && lc <= 102) {
        return lc - 97 + 10;
      }
      return -1;
    }
    function escapedHexLen(c) {
      if (c === 120) {
        return 2;
      }
      if (c === 117) {
        return 4;
      }
      if (c === 85) {
        return 8;
      }
      return 0;
    }
    function fromDecimalCode(c) {
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      return -1;
    }
    function simpleEscapeSequence(c) {
      return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
    }
    function charFromCodepoint(c) {
      if (c <= 65535) {
        return String.fromCharCode(c);
      }
      return String.fromCharCode(
        (c - 65536 >> 10) + 55296,
        (c - 65536 & 1023) + 56320
      );
    }
    function setProperty(object, key, value) {
      if (key === "__proto__") {
        Object.defineProperty(object, key, {
          configurable: true,
          enumerable: true,
          writable: true,
          value
        });
      } else {
        object[key] = value;
      }
    }
    var simpleEscapeCheck = new Array(256);
    var simpleEscapeMap = new Array(256);
    for (i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    var i;
    function State(input, options) {
      this.input = input;
      this.filename = options["filename"] || null;
      this.schema = options["schema"] || DEFAULT_SCHEMA;
      this.onWarning = options["onWarning"] || null;
      this.legacy = options["legacy"] || false;
      this.json = options["json"] || false;
      this.listener = options["listener"] || null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap = this.schema.compiledTypeMap;
      this.length = input.length;
      this.position = 0;
      this.line = 0;
      this.lineStart = 0;
      this.lineIndent = 0;
      this.firstTabInLine = -1;
      this.documents = [];
    }
    function generateError(state, message) {
      var mark = {
        name: state.filename,
        buffer: state.input.slice(0, -1),
        // omit trailing \0
        position: state.position,
        line: state.line,
        column: state.position - state.lineStart
      };
      mark.snippet = makeSnippet(mark);
      return new YAMLException(message, mark);
    }
    function throwError(state, message) {
      throw generateError(state, message);
    }
    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }
    var directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args) {
        var match, major, minor;
        if (state.version !== null) {
          throwError(state, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
          throwError(state, "YAML directive accepts exactly one argument");
        }
        match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
          throwError(state, "ill-formed argument of the YAML directive");
        }
        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);
        if (major !== 1) {
          throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
          throwWarning(state, "unsupported YAML version of the document");
        }
      },
      TAG: function handleTagDirective(state, name, args) {
        var handle, prefix;
        if (args.length !== 2) {
          throwError(state, "TAG directive accepts exactly two arguments");
        }
        handle = args[0];
        prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle)) {
          throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty.call(state.tagMap, handle)) {
          throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        try {
          prefix = decodeURIComponent(prefix);
        } catch (err) {
          throwError(state, "tag prefix is malformed: " + prefix);
        }
        state.tagMap[handle] = prefix;
      }
    };
    function captureSegment(state, start, end, checkJson) {
      var _position, _length, _character, _result;
      if (start < end) {
        _result = state.input.slice(start, end);
        if (checkJson) {
          for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
            _character = _result.charCodeAt(_position);
            if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
              throwError(state, "expected valid JSON character");
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, "the stream contains non-printable characters");
        }
        state.result += _result;
      }
    }
    function mergeMappings(state, destination, source, overridableKeys) {
      var sourceKeys, key, index, quantity;
      if (!common.isObject(source)) {
        throwError(state, "cannot merge mappings; the provided source object is unacceptable");
      }
      sourceKeys = Object.keys(source);
      for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
        key = sourceKeys[index];
        if (!_hasOwnProperty.call(destination, key)) {
          setProperty(destination, key, source[key]);
          overridableKeys[key] = true;
        }
      }
    }
    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
      var index, quantity;
      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
          if (Array.isArray(keyNode[index])) {
            throwError(state, "nested arrays are not supported inside keys");
          }
          if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
            keyNode[index] = "[object Object]";
          }
        }
      }
      if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
      }
      keyNode = String(keyNode);
      if (_result === null) {
        _result = {};
      }
      if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
          for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
            mergeMappings(state, _result, valueNode[index], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.lineStart = startLineStart || state.lineStart;
          state.position = startPos || state.position;
          throwError(state, "duplicated mapping key");
        }
        setProperty(_result, keyNode, valueNode);
        delete overridableKeys[keyNode];
      }
      return _result;
    }
    function readLineBreak(state) {
      var ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 10) {
        state.position++;
      } else if (ch === 13) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 10) {
          state.position++;
        }
      } else {
        throwError(state, "a line break is expected");
      }
      state.line += 1;
      state.lineStart = state.position;
      state.firstTabInLine = -1;
    }
    function skipSeparationSpace(state, allowComments, checkIndent) {
      var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          if (ch === 9 && state.firstTabInLine === -1) {
            state.firstTabInLine = state.position;
          }
          ch = state.input.charCodeAt(++state.position);
        }
        if (allowComments && ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 10 && ch !== 13 && ch !== 0);
        }
        if (is_EOL(ch)) {
          readLineBreak(state);
          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;
          while (ch === 32) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }
      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, "deficient indentation");
      }
      return lineBreaks;
    }
    function testDocumentSeparator(state) {
      var _position = state.position, ch;
      ch = state.input.charCodeAt(_position);
      if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);
        if (ch === 0 || is_WS_OR_EOL(ch)) {
          return true;
        }
      }
      return false;
    }
    function writeFoldedLines(state, count) {
      if (count === 1) {
        state.result += " ";
      } else if (count > 1) {
        state.result += common.repeat("\n", count - 1);
      }
    }
    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
      ch = state.input.charCodeAt(state.position);
      if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
        return false;
      }
      if (ch === 63 || ch === 45) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
          return false;
        }
      }
      state.kind = "scalar";
      state.result = "";
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
      while (ch !== 0) {
        if (ch === 58) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
            break;
          }
        } else if (ch === 35) {
          preceding = state.input.charCodeAt(state.position - 1);
          if (is_WS_OR_EOL(preceding)) {
            break;
          }
        } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
          break;
        } else if (is_EOL(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);
          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }
        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }
        if (!is_WHITE_SPACE(ch)) {
          captureEnd = state.position + 1;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, captureEnd, false);
      if (state.result) {
        return true;
      }
      state.kind = _kind;
      state.result = _result;
      return false;
    }
    function readSingleQuotedScalar(state, nodeIndent) {
      var ch, captureStart, captureEnd;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 39) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 39) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (ch === 39) {
            captureStart = state.position;
            state.position++;
            captureEnd = state.position;
          } else {
            return true;
          }
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a single quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a single quoted scalar");
    }
    function readDoubleQuotedScalar(state, nodeIndent) {
      var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 34) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 34) {
          captureSegment(state, captureStart, state.position, true);
          state.position++;
          return true;
        } else if (ch === 92) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (is_EOL(ch)) {
            skipSeparationSpace(state, false, nodeIndent);
          } else if (ch < 256 && simpleEscapeCheck[ch]) {
            state.result += simpleEscapeMap[ch];
            state.position++;
          } else if ((tmp = escapedHexLen(ch)) > 0) {
            hexLength = tmp;
            hexResult = 0;
            for (; hexLength > 0; hexLength--) {
              ch = state.input.charCodeAt(++state.position);
              if ((tmp = fromHexCode(ch)) >= 0) {
                hexResult = (hexResult << 4) + tmp;
              } else {
                throwError(state, "expected hexadecimal character");
              }
            }
            state.result += charFromCodepoint(hexResult);
            state.position++;
          } else {
            throwError(state, "unknown escape sequence");
          }
          captureStart = captureEnd = state.position;
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a double quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a double quoted scalar");
    }
    function readFlowCollection(state, nodeIndent) {
      var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 91) {
        terminator = 93;
        isMapping = false;
        _result = [];
      } else if (ch === 123) {
        terminator = 125;
        isMapping = true;
        _result = {};
      } else {
        return false;
      }
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(++state.position);
      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? "mapping" : "sequence";
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, "missed comma between flow collection entries");
        } else if (ch === 44) {
          throwError(state, "expected the node content, but found ','");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following)) {
            isPair = isExplicitPair = true;
            state.position++;
            skipSeparationSpace(state, true, nodeIndent);
          }
        }
        _line = state.line;
        _lineStart = state.lineStart;
        _pos = state.position;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if ((isExplicitPair || state.line === _line) && ch === 58) {
          isPair = true;
          ch = state.input.charCodeAt(++state.position);
          skipSeparationSpace(state, true, nodeIndent);
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          valueNode = state.result;
        }
        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
        } else {
          _result.push(keyNode);
        }
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === 44) {
          readNext = true;
          ch = state.input.charCodeAt(++state.position);
        } else {
          readNext = false;
        }
      }
      throwError(state, "unexpected end of the stream within a flow collection");
    }
    function readBlockScalar(state, nodeIndent) {
      var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 124) {
        folding = false;
      } else if (ch === 62) {
        folding = true;
      } else {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
        if (ch === 43 || ch === 45) {
          if (CHOMPING_CLIP === chomping) {
            chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
          } else {
            throwError(state, "repeat of a chomping mode identifier");
          }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, "repeat of an indentation width identifier");
          }
        } else {
          break;
        }
      }
      if (is_WHITE_SPACE(ch)) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (is_WHITE_SPACE(ch));
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (!is_EOL(ch) && ch !== 0);
        }
      }
      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);
        while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }
        if (is_EOL(ch)) {
          emptyLines++;
          continue;
        }
        if (state.lineIndent < textIndent) {
          if (chomping === CHOMPING_KEEP) {
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) {
              state.result += "\n";
            }
          }
          break;
        }
        if (folding) {
          if (is_WHITE_SPACE(ch)) {
            atMoreIndented = true;
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common.repeat("\n", emptyLines + 1);
          } else if (emptyLines === 0) {
            if (didReadContent) {
              state.result += " ";
            }
          } else {
            state.result += common.repeat("\n", emptyLines);
          }
        } else {
          state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        captureStart = state.position;
        while (!is_EOL(ch) && ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, state.position, false);
      }
      return true;
    }
    function readBlockSequence(state, nodeIndent) {
      var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
      if (state.firstTabInLine !== -1) return false;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, "tab characters must not be used in indentation");
        }
        if (ch !== 45) {
          break;
        }
        following = state.input.charCodeAt(state.position + 1);
        if (!is_WS_OR_EOL(following)) {
          break;
        }
        detected = true;
        state.position++;
        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);
            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        _result.push(state.result);
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a sequence entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "sequence";
        state.result = _result;
        return true;
      }
      return false;
    }
    function readBlockMapping(state, nodeIndent, flowIndent) {
      var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
      if (state.firstTabInLine !== -1) return false;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (!atExplicitKey && state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, "tab characters must not be used in indentation");
        }
        following = state.input.charCodeAt(state.position + 1);
        _line = state.line;
        if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
          if (ch === 63) {
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = true;
            allowCompact = true;
          } else if (atExplicitKey) {
            atExplicitKey = false;
            allowCompact = true;
          } else {
            throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
          }
          state.position += 1;
          ch = following;
        } else {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
          if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
            break;
          }
          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);
            while (is_WHITE_SPACE(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }
            if (ch === 58) {
              ch = state.input.charCodeAt(++state.position);
              if (!is_WS_OR_EOL(ch)) {
                throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
              }
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
                keyTag = keyNode = valueNode = null;
              }
              detected = true;
              atExplicitKey = false;
              allowCompact = false;
              keyTag = state.tag;
              keyNode = state.result;
            } else if (detected) {
              throwError(state, "can not read an implicit mapping pair; a colon is missed");
            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true;
            }
          } else if (detected) {
            throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        }
        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (atExplicitKey) {
            _keyLine = state.line;
            _keyLineStart = state.lineStart;
            _keyPos = state.position;
          }
          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }
          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a mapping entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "mapping";
        state.result = _result;
      }
      return detected;
    }
    function readTagProperty(state) {
      var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 33) return false;
      if (state.tag !== null) {
        throwError(state, "duplication of a tag property");
      }
      ch = state.input.charCodeAt(++state.position);
      if (ch === 60) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);
      } else if (ch === 33) {
        isNamed = true;
        tagHandle = "!!";
        ch = state.input.charCodeAt(++state.position);
      } else {
        tagHandle = "!";
      }
      _position = state.position;
      if (isVerbatim) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && ch !== 62);
        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, "unexpected end of the stream within a verbatim tag");
        }
      } else {
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          if (ch === 33) {
            if (!isNamed) {
              tagHandle = state.input.slice(_position - 1, state.position + 1);
              if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                throwError(state, "named tag handle cannot contain such characters");
              }
              isNamed = true;
              _position = state.position + 1;
            } else {
              throwError(state, "tag suffix cannot contain exclamation marks");
            }
          }
          ch = state.input.charCodeAt(++state.position);
        }
        tagName = state.input.slice(_position, state.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, "tag suffix cannot contain flow indicator characters");
        }
      }
      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, "tag name cannot contain such characters: " + tagName);
      }
      try {
        tagName = decodeURIComponent(tagName);
      } catch (err) {
        throwError(state, "tag name is malformed: " + tagName);
      }
      if (isVerbatim) {
        state.tag = tagName;
      } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
      } else if (tagHandle === "!") {
        state.tag = "!" + tagName;
      } else if (tagHandle === "!!") {
        state.tag = "tag:yaml.org,2002:" + tagName;
      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }
      return true;
    }
    function readAnchorProperty(state) {
      var _position, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 38) return false;
      if (state.anchor !== null) {
        throwError(state, "duplication of an anchor property");
      }
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an anchor node must contain at least one character");
      }
      state.anchor = state.input.slice(_position, state.position);
      return true;
    }
    function readAlias(state) {
      var _position, alias, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 42) return false;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an alias node must contain at least one character");
      }
      alias = state.input.slice(_position, state.position);
      if (!_hasOwnProperty.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }
      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }
    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type, flowIndent, blockIndent;
      if (state.listener !== null) {
        state.listener("open", state);
      }
      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }
      if (indentStatus === 1) {
        while (readTagProperty(state) || readAnchorProperty(state)) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;
            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }
      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }
      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }
        blockIndent = state.position - state.lineStart;
        if (indentStatus === 1) {
          if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;
            } else if (readAlias(state)) {
              hasContent = true;
              if (state.tag !== null || state.anchor !== null) {
                throwError(state, "alias node should not have any properties");
              }
            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;
              if (state.tag === null) {
                state.tag = "?";
              }
            }
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else if (indentStatus === 0) {
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }
      if (state.tag === null) {
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      } else if (state.tag === "?") {
        if (state.result !== null && state.kind !== "scalar") {
          throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
        }
        for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
          type = state.implicitTypes[typeIndex];
          if (type.resolve(state.result)) {
            state.result = type.construct(state.result);
            state.tag = type.tag;
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
            break;
          }
        }
      } else if (state.tag !== "!") {
        if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
          type = state.typeMap[state.kind || "fallback"][state.tag];
        } else {
          type = null;
          typeList = state.typeMap.multi[state.kind || "fallback"];
          for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
            if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
              type = typeList[typeIndex];
              break;
            }
          }
        }
        if (!type) {
          throwError(state, "unknown tag !<" + state.tag + ">");
        }
        if (state.result !== null && type.kind !== state.kind) {
          throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
        }
        if (!type.resolve(state.result, state.tag)) {
          throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
        } else {
          state.result = type.construct(state.result, state.tag);
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      }
      if (state.listener !== null) {
        state.listener("close", state);
      }
      return state.tag !== null || state.anchor !== null || hasContent;
    }
    function readDocument(state) {
      var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = /* @__PURE__ */ Object.create(null);
      state.anchorMap = /* @__PURE__ */ Object.create(null);
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if (state.lineIndent > 0 || ch !== 37) {
          break;
        }
        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        _position = state.position;
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveName = state.input.slice(_position, state.position);
        directiveArgs = [];
        if (directiveName.length < 1) {
          throwError(state, "directive name must not be less than one character in length");
        }
        while (ch !== 0) {
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 35) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (ch !== 0 && !is_EOL(ch));
            break;
          }
          if (is_EOL(ch)) break;
          _position = state.position;
          while (ch !== 0 && !is_WS_OR_EOL(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          directiveArgs.push(state.input.slice(_position, state.position));
        }
        if (ch !== 0) readLineBreak(state);
        if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }
      skipSeparationSpace(state, true, -1);
      if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      } else if (hasDirectives) {
        throwError(state, "directives end mark is expected");
      }
      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);
      if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, "non-ASCII line breaks are interpreted as content");
      }
      state.documents.push(state.result);
      if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 46) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        }
        return;
      }
      if (state.position < state.length - 1) {
        throwError(state, "end of the stream or a document separator is expected");
      } else {
        return;
      }
    }
    function loadDocuments(input, options) {
      input = String(input);
      options = options || {};
      if (input.length !== 0) {
        if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
          input += "\n";
        }
        if (input.charCodeAt(0) === 65279) {
          input = input.slice(1);
        }
      }
      var state = new State(input, options);
      var nullpos = input.indexOf("\0");
      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, "null byte is not allowed in input");
      }
      state.input += "\0";
      while (state.input.charCodeAt(state.position) === 32) {
        state.lineIndent += 1;
        state.position += 1;
      }
      while (state.position < state.length - 1) {
        readDocument(state);
      }
      return state.documents;
    }
    function loadAll(input, iterator, options) {
      if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
        options = iterator;
        iterator = null;
      }
      var documents = loadDocuments(input, options);
      if (typeof iterator !== "function") {
        return documents;
      }
      for (var index = 0, length = documents.length; index < length; index += 1) {
        iterator(documents[index]);
      }
    }
    function load(input, options) {
      var documents = loadDocuments(input, options);
      if (documents.length === 0) {
        return void 0;
      } else if (documents.length === 1) {
        return documents[0];
      }
      throw new YAMLException("expected a single document in the stream, but found more");
    }
    module2.exports.loadAll = loadAll;
    module2.exports.load = load;
  }
});

// node_modules/js-yaml/lib/dumper.js
var require_dumper = __commonJS({
  "node_modules/js-yaml/lib/dumper.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var DEFAULT_SCHEMA = require_default();
    var _toString = Object.prototype.toString;
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CHAR_BOM = 65279;
    var CHAR_TAB = 9;
    var CHAR_LINE_FEED = 10;
    var CHAR_CARRIAGE_RETURN = 13;
    var CHAR_SPACE = 32;
    var CHAR_EXCLAMATION = 33;
    var CHAR_DOUBLE_QUOTE = 34;
    var CHAR_SHARP = 35;
    var CHAR_PERCENT = 37;
    var CHAR_AMPERSAND = 38;
    var CHAR_SINGLE_QUOTE = 39;
    var CHAR_ASTERISK = 42;
    var CHAR_COMMA = 44;
    var CHAR_MINUS = 45;
    var CHAR_COLON = 58;
    var CHAR_EQUALS = 61;
    var CHAR_GREATER_THAN = 62;
    var CHAR_QUESTION = 63;
    var CHAR_COMMERCIAL_AT = 64;
    var CHAR_LEFT_SQUARE_BRACKET = 91;
    var CHAR_RIGHT_SQUARE_BRACKET = 93;
    var CHAR_GRAVE_ACCENT = 96;
    var CHAR_LEFT_CURLY_BRACKET = 123;
    var CHAR_VERTICAL_LINE = 124;
    var CHAR_RIGHT_CURLY_BRACKET = 125;
    var ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    var DEPRECATED_BOOLEANS_SYNTAX = [
      "y",
      "Y",
      "yes",
      "Yes",
      "YES",
      "on",
      "On",
      "ON",
      "n",
      "N",
      "no",
      "No",
      "NO",
      "off",
      "Off",
      "OFF"
    ];
    var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
    function compileStyleMap(schema, map) {
      var result, keys, index, length, tag, style, type;
      if (map === null) return {};
      result = {};
      keys = Object.keys(map);
      for (index = 0, length = keys.length; index < length; index += 1) {
        tag = keys[index];
        style = String(map[tag]);
        if (tag.slice(0, 2) === "!!") {
          tag = "tag:yaml.org,2002:" + tag.slice(2);
        }
        type = schema.compiledTypeMap["fallback"][tag];
        if (type && _hasOwnProperty.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }
        result[tag] = style;
      }
      return result;
    }
    function encodeHex(character) {
      var string, handle, length;
      string = character.toString(16).toUpperCase();
      if (character <= 255) {
        handle = "x";
        length = 2;
      } else if (character <= 65535) {
        handle = "u";
        length = 4;
      } else if (character <= 4294967295) {
        handle = "U";
        length = 8;
      } else {
        throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
      }
      return "\\" + handle + common.repeat("0", length - string.length) + string;
    }
    var QUOTING_TYPE_SINGLE = 1;
    var QUOTING_TYPE_DOUBLE = 2;
    function State(options) {
      this.schema = options["schema"] || DEFAULT_SCHEMA;
      this.indent = Math.max(1, options["indent"] || 2);
      this.noArrayIndent = options["noArrayIndent"] || false;
      this.skipInvalid = options["skipInvalid"] || false;
      this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
      this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
      this.sortKeys = options["sortKeys"] || false;
      this.lineWidth = options["lineWidth"] || 80;
      this.noRefs = options["noRefs"] || false;
      this.noCompatMode = options["noCompatMode"] || false;
      this.condenseFlow = options["condenseFlow"] || false;
      this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
      this.forceQuotes = options["forceQuotes"] || false;
      this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;
      this.tag = null;
      this.result = "";
      this.duplicates = [];
      this.usedDuplicates = null;
    }
    function indentString(string, spaces) {
      var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
      while (position < length) {
        next = string.indexOf("\n", position);
        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }
        if (line.length && line !== "\n") result += ind;
        result += line;
      }
      return result;
    }
    function generateNextLine(state, level) {
      return "\n" + common.repeat(" ", state.indent * level);
    }
    function testImplicitResolving(state, str) {
      var index, length, type;
      for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
        type = state.implicitTypes[index];
        if (type.resolve(str)) {
          return true;
        }
      }
      return false;
    }
    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    }
    function isPrintable(c) {
      return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
    }
    function isNsCharOrWhitespace(c) {
      return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
    }
    function isPlainSafe(c, prev, inblock) {
      var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
      var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
      return (
        // ns-plain-safe
        (inblock ? (
          // c = flow-in
          cIsNsCharOrWhitespace
        ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
      );
    }
    function isPlainSafeFirst(c) {
      return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
    }
    function isPlainSafeLast(c) {
      return !isWhitespace(c) && c !== CHAR_COLON;
    }
    function codePointAt(string, pos) {
      var first = string.charCodeAt(pos), second;
      if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
        second = string.charCodeAt(pos + 1);
        if (second >= 56320 && second <= 57343) {
          return (first - 55296) * 1024 + second - 56320 + 65536;
        }
      }
      return first;
    }
    function needIndentIndicator(string) {
      var leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }
    var STYLE_PLAIN = 1;
    var STYLE_SINGLE = 2;
    var STYLE_LITERAL = 3;
    var STYLE_FOLDED = 4;
    var STYLE_DOUBLE = 5;
    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
      var i;
      var char = 0;
      var prevChar = null;
      var hasLineBreak = false;
      var hasFoldableLine = false;
      var shouldTrackWidth = lineWidth !== -1;
      var previousLineBreak = -1;
      var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
      if (singleLineOnly || forceQuotes) {
        for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
      } else {
        for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true;
            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
              i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
      }
      if (!hasLineBreak && !hasFoldableLine) {
        if (plain && !forceQuotes && !testAmbiguousType(string)) {
          return STYLE_PLAIN;
        }
        return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
      }
      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      }
      if (!forceQuotes) {
        return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    function writeScalar(state, string, level, iskey, inblock) {
      state.dump = (function() {
        if (string.length === 0) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
        }
        if (!state.noCompatMode) {
          if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
            return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
          }
        }
        var indent = state.indent * Math.max(1, level);
        var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
        function testAmbiguity(string2) {
          return testImplicitResolving(state, string2);
        }
        switch (chooseScalarStyle(
          string,
          singleLineOnly,
          state.indent,
          lineWidth,
          testAmbiguity,
          state.quotingType,
          state.forceQuotes && !iskey,
          inblock
        )) {
          case STYLE_PLAIN:
            return string;
          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";
          case STYLE_LITERAL:
            return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
          case STYLE_FOLDED:
            return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
          case STYLE_DOUBLE:
            return '"' + escapeString(string, lineWidth) + '"';
          default:
            throw new YAMLException("impossible error: invalid scalar style");
        }
      })();
    }
    function blockHeader(string, indentPerLevel) {
      var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
      var clip = string[string.length - 1] === "\n";
      var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
      var chomp = keep ? "+" : clip ? "" : "-";
      return indentIndicator + chomp + "\n";
    }
    function dropEndingNewline(string) {
      return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
    }
    function foldString(string, width) {
      var lineRe = /(\n+)([^\n]*)/g;
      var result = (function() {
        var nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      })();
      var prevMoreIndented = string[0] === "\n" || string[0] === " ";
      var moreIndented;
      var match;
      while (match = lineRe.exec(string)) {
        var prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }
      return result;
    }
    function foldLine(line, width) {
      if (line === "" || line[0] === " ") return line;
      var breakRe = / [^ ]/g;
      var match;
      var start = 0, end, curr = 0, next = 0;
      var result = "";
      while (match = breakRe.exec(line)) {
        next = match.index;
        if (next - start > width) {
          end = curr > start ? curr : next;
          result += "\n" + line.slice(start, end);
          start = end + 1;
        }
        curr = next;
      }
      result += "\n";
      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }
      return result.slice(1);
    }
    function escapeString(string) {
      var result = "";
      var char = 0;
      var escapeSeq;
      for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        escapeSeq = ESCAPE_SEQUENCES[char];
        if (!escapeSeq && isPrintable(char)) {
          result += string[i];
          if (char >= 65536) result += string[i + 1];
        } else {
          result += escapeSeq || encodeHex(char);
        }
      }
      return result;
    }
    function writeFlowSequence(state, level, object) {
      var _result = "", _tag = state.tag, index, length, value;
      for (index = 0, length = object.length; index < length; index += 1) {
        value = object[index];
        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }
        if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
          if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = "[" + _result + "]";
    }
    function writeBlockSequence(state, level, object, compact) {
      var _result = "", _tag = state.tag, index, length, value;
      for (index = 0, length = object.length; index < length; index += 1) {
        value = object[index];
        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }
        if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
          if (!compact || _result !== "") {
            _result += generateNextLine(state, level);
          }
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += "-";
          } else {
            _result += "- ";
          }
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = _result || "[]";
    }
    function writeFlowMapping(state, level, object) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = "";
        if (_result !== "") pairBuffer += ", ";
        if (state.condenseFlow) pairBuffer += '"';
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }
        if (!writeNode(state, level, objectKey, false, false)) {
          continue;
        }
        if (state.dump.length > 1024) pairBuffer += "? ";
        pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
        if (!writeNode(state, level, objectValue, false, false)) {
          continue;
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = "{" + _result + "}";
    }
    function writeBlockMapping(state, level, object, compact) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
      if (state.sortKeys === true) {
        objectKeyList.sort();
      } else if (typeof state.sortKeys === "function") {
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        throw new YAMLException("sortKeys must be a boolean or a function");
      }
      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = "";
        if (!compact || _result !== "") {
          pairBuffer += generateNextLine(state, level);
        }
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue;
        }
        explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += "?";
          } else {
            pairBuffer += "? ";
          }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue;
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ":";
        } else {
          pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = _result || "{}";
    }
    function detectType(state, object, explicit) {
      var _result, typeList, index, length, type, style;
      typeList = explicit ? state.explicitTypes : state.implicitTypes;
      for (index = 0, length = typeList.length; index < length; index += 1) {
        type = typeList[index];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
          if (explicit) {
            if (type.multi && type.representName) {
              state.tag = type.representName(object);
            } else {
              state.tag = type.tag;
            }
          } else {
            state.tag = "?";
          }
          if (type.represent) {
            style = state.styleMap[type.tag] || type.defaultStyle;
            if (_toString.call(type.represent) === "[object Function]") {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new YAMLException("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
            }
            state.dump = _result;
          }
          return true;
        }
      }
      return false;
    }
    function writeNode(state, level, object, block, compact, iskey, isblockseq) {
      state.tag = null;
      state.dump = object;
      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }
      var type = _toString.call(state.dump);
      var inblock = block;
      var tagStr;
      if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
      }
      var objectOrArray = type === "[object Object]" || type === "[object Array]", duplicateIndex, duplicate;
      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }
      if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
      }
      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = "*ref_" + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
          if (block && Object.keys(state.dump).length !== 0) {
            writeBlockMapping(state, level, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object Array]") {
          if (block && state.dump.length !== 0) {
            if (state.noArrayIndent && !isblockseq && level > 0) {
              writeBlockSequence(state, level - 1, state.dump, compact);
            } else {
              writeBlockSequence(state, level, state.dump, compact);
            }
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object String]") {
          if (state.tag !== "?") {
            writeScalar(state, state.dump, level, iskey, inblock);
          }
        } else if (type === "[object Undefined]") {
          return false;
        } else {
          if (state.skipInvalid) return false;
          throw new YAMLException("unacceptable kind of an object to dump " + type);
        }
        if (state.tag !== null && state.tag !== "?") {
          tagStr = encodeURI(
            state.tag[0] === "!" ? state.tag.slice(1) : state.tag
          ).replace(/!/g, "%21");
          if (state.tag[0] === "!") {
            tagStr = "!" + tagStr;
          } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
            tagStr = "!!" + tagStr.slice(18);
          } else {
            tagStr = "!<" + tagStr + ">";
          }
          state.dump = tagStr + " " + state.dump;
        }
      }
      return true;
    }
    function getDuplicateReferences(object, state) {
      var objects = [], duplicatesIndexes = [], index, length;
      inspectNode(object, objects, duplicatesIndexes);
      for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index]]);
      }
      state.usedDuplicates = new Array(length);
    }
    function inspectNode(object, objects, duplicatesIndexes) {
      var objectKeyList, index, length;
      if (object !== null && typeof object === "object") {
        index = objects.indexOf(object);
        if (index !== -1) {
          if (duplicatesIndexes.indexOf(index) === -1) {
            duplicatesIndexes.push(index);
          }
        } else {
          objects.push(object);
          if (Array.isArray(object)) {
            for (index = 0, length = object.length; index < length; index += 1) {
              inspectNode(object[index], objects, duplicatesIndexes);
            }
          } else {
            objectKeyList = Object.keys(object);
            for (index = 0, length = objectKeyList.length; index < length; index += 1) {
              inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }
    function dump(input, options) {
      options = options || {};
      var state = new State(options);
      if (!state.noRefs) getDuplicateReferences(input, state);
      var value = input;
      if (state.replacer) {
        value = state.replacer.call({ "": value }, "", value);
      }
      if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
      return "";
    }
    module2.exports.dump = dump;
  }
});

// node_modules/js-yaml/index.js
var require_js_yaml = __commonJS({
  "node_modules/js-yaml/index.js"(exports2, module2) {
    "use strict";
    var loader = require_loader();
    var dumper = require_dumper();
    function renamed(from, to) {
      return function() {
        throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
      };
    }
    module2.exports.Type = require_type();
    module2.exports.Schema = require_schema();
    module2.exports.FAILSAFE_SCHEMA = require_failsafe();
    module2.exports.JSON_SCHEMA = require_json();
    module2.exports.CORE_SCHEMA = require_core();
    module2.exports.DEFAULT_SCHEMA = require_default();
    module2.exports.load = loader.load;
    module2.exports.loadAll = loader.loadAll;
    module2.exports.dump = dumper.dump;
    module2.exports.YAMLException = require_exception();
    module2.exports.types = {
      binary: require_binary(),
      float: require_float(),
      map: require_map(),
      null: require_null(),
      pairs: require_pairs(),
      set: require_set(),
      timestamp: require_timestamp(),
      bool: require_bool(),
      int: require_int(),
      merge: require_merge(),
      omap: require_omap(),
      seq: require_seq(),
      str: require_str()
    };
    module2.exports.safeLoad = renamed("safeLoad", "load");
    module2.exports.safeLoadAll = renamed("safeLoadAll", "loadAll");
    module2.exports.safeDump = renamed("safeDump", "dump");
  }
});

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports2, module2) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports2, module2) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports2, module2) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = exports2.re = [];
    var safeRe = exports2.safeRe = [];
    var src = exports2.src = [];
    var safeSrc = exports2.safeSrc = [];
    var t = exports2.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports2, module2) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports2, module2) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports2, module2) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse;
  }
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/semver/functions/valid.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var valid = (version, options) => {
      const v = parse(version, options);
      return v ? v.version : null;
    };
    module2.exports = valid;
  }
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/semver/functions/clean.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var clean = (version, options) => {
      const s = parse(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module2.exports = clean;
  }
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/semver/functions/inc.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version instanceof SemVer ? version.version : version,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module2.exports = inc;
  }
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/semver/functions/diff.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module2.exports = diff;
  }
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/semver/functions/major.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module2.exports = major;
  }
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/semver/functions/minor.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module2.exports = minor;
  }
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/semver/functions/patch.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module2.exports = patch;
  }
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/semver/functions/prerelease.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version, options) => {
      const parsed = parse(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module2.exports = prerelease;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/semver/functions/rcompare.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module2.exports = rcompare;
  }
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/semver/functions/compare-loose.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module2.exports = compareLoose;
  }
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/semver/functions/compare-build.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module2.exports = compareBuild;
  }
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/semver/functions/sort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module2.exports = sort;
  }
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/semver/functions/rsort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module2.exports = rsort;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports2, module2) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module2.exports = coerce;
  }
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/semver/internal/lrucache.js"(exports2, module2) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports2, module2) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports2, module2) {
    "use strict";
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  }
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/semver/ranges/to-comparators.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module2.exports = toComparators;
  }
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/semver/ranges/max-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module2.exports = maxSatisfying;
  }
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/semver/ranges/min-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module2.exports = minSatisfying;
  }
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/semver/ranges/min-version.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module2.exports = minVersion;
  }
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/semver/ranges/valid.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module2.exports = validRange;
  }
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/semver/ranges/outside.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options) => {
      version = new SemVer(version, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module2.exports = outside;
  }
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/semver/ranges/gtr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var gtr = (version, range, options) => outside(version, range, ">", options);
    module2.exports = gtr;
  }
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/semver/ranges/ltr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var ltr = (version, range, options) => outside(version, range, "<", options);
    module2.exports = ltr;
  }
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/semver/ranges/intersects.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module2.exports = intersects;
  }
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/semver/ranges/simplify.js"(exports2, module2) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module2.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        const included = satisfies(version, range, options);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/semver/ranges/subset.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !satisfies(gt.semver, String(c), options)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !satisfies(lt.semver, String(c), options)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module2.exports = subset;
  }
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/semver/index.js"(exports2, module2) {
    "use strict";
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module2.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/picomatch/lib/constants.js
var require_constants2 = __commonJS({
  "node_modules/picomatch/lib/constants.js"(exports2, module2) {
    "use strict";
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DEFAULT_MAX_EXTGLOB_RECURSION = 0;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var SEP = "/";
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR,
      SEP
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`,
      SEP: "\\"
    };
    var POSIX_REGEX_SOURCE = {
      __proto__: null,
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module2.exports = {
      DEFAULT_MAX_EXTGLOB_RECURSION,
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        __proto__: null,
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// node_modules/picomatch/lib/utils.js
var require_utils = __commonJS({
  "node_modules/picomatch/lib/utils.js"(exports2) {
    "use strict";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants2();
    exports2.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports2.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports2.isRegexChar = (str) => str.length === 1 && exports2.hasRegexChars(str);
    exports2.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports2.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports2.isWindows = () => {
      if (typeof navigator !== "undefined" && navigator.platform) {
        const platform = navigator.platform.toLowerCase();
        return platform === "win32" || platform === "windows";
      }
      if (typeof process !== "undefined" && process.platform) {
        return process.platform === "win32";
      }
      return false;
    };
    exports2.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports2.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports2.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports2.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports2.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
    exports2.basename = (path, { windows } = {}) => {
      const segs = path.split(windows ? /[\\/]/ : "/");
      const last = segs[segs.length - 1];
      if (last === "") {
        return segs[segs.length - 2];
      }
      return last;
    };
  }
});

// node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "node_modules/picomatch/lib/scan.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants2();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  isGlob = token.isGlob = true;
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_LEFT_PARENTHESES) {
                backslashes = token.backslashes = true;
                code = advance();
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob) glob = utils.removeBackslashes(glob);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n = prevIndex ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value = input.slice(n, i);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (idx !== 0 || value !== "") {
            parts.push(value);
          }
          prevIndex = i;
        }
        if (prevIndex && prevIndex + 1 < input.length) {
          const value = input.slice(prevIndex + 1);
          parts.push(value);
          if (opts.tokens) {
            tokens[tokens.length - 1].value = value;
            depth(tokens[tokens.length - 1]);
            state.maxDepth += tokens[tokens.length - 1].depth;
          }
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module2.exports = scan;
  }
});

// node_modules/picomatch/lib/parse.js
var require_parse2 = __commonJS({
  "node_modules/picomatch/lib/parse.js"(exports2, module2) {
    "use strict";
    var constants = require_constants2();
    var utils = require_utils();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var splitTopLevel = (input) => {
      const parts = [];
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let value = "";
      let escaped = false;
      for (const ch of input) {
        if (escaped === true) {
          value += ch;
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          value += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          value += ch;
          continue;
        }
        if (quote === 0) {
          if (ch === "[") {
            bracket++;
          } else if (ch === "]" && bracket > 0) {
            bracket--;
          } else if (bracket === 0) {
            if (ch === "(") {
              paren++;
            } else if (ch === ")" && paren > 0) {
              paren--;
            } else if (ch === "|" && paren === 0) {
              parts.push(value);
              value = "";
              continue;
            }
          }
        }
        value += ch;
      }
      parts.push(value);
      return parts;
    };
    var isPlainBranch = (branch) => {
      let escaped = false;
      for (const ch of branch) {
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (/[?*+@!()[\]{}]/.test(ch)) {
          return false;
        }
      }
      return true;
    };
    var normalizeSimpleBranch = (branch) => {
      let value = branch.trim();
      let changed = true;
      while (changed === true) {
        changed = false;
        if (/^@\([^\\()[\]{}|]+\)$/.test(value)) {
          value = value.slice(2, -1);
          changed = true;
        }
      }
      if (!isPlainBranch(value)) {
        return;
      }
      return value.replace(/\\(.)/g, "$1");
    };
    var hasRepeatedCharPrefixOverlap = (branches) => {
      const values = branches.map(normalizeSimpleBranch).filter(Boolean);
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const a = values[i];
          const b = values[j];
          const char = a[0];
          if (!char || a !== char.repeat(a.length) || b !== char.repeat(b.length)) {
            continue;
          }
          if (a === b || a.startsWith(b) || b.startsWith(a)) {
            return true;
          }
        }
      }
      return false;
    };
    var parseRepeatedExtglob = (pattern, requireEnd = true) => {
      if (pattern[0] !== "+" && pattern[0] !== "*" || pattern[1] !== "(") {
        return;
      }
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let escaped = false;
      for (let i = 1; i < pattern.length; i++) {
        const ch = pattern[i];
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          continue;
        }
        if (quote === 1) {
          continue;
        }
        if (ch === "[") {
          bracket++;
          continue;
        }
        if (ch === "]" && bracket > 0) {
          bracket--;
          continue;
        }
        if (bracket > 0) {
          continue;
        }
        if (ch === "(") {
          paren++;
          continue;
        }
        if (ch === ")") {
          paren--;
          if (paren === 0) {
            if (requireEnd === true && i !== pattern.length - 1) {
              return;
            }
            return {
              type: pattern[0],
              body: pattern.slice(2, i),
              end: i
            };
          }
        }
      }
    };
    var getStarExtglobSequenceOutput = (pattern) => {
      let index = 0;
      const chars = [];
      while (index < pattern.length) {
        const match = parseRepeatedExtglob(pattern.slice(index), false);
        if (!match || match.type !== "*") {
          return;
        }
        const branches = splitTopLevel(match.body).map((branch2) => branch2.trim());
        if (branches.length !== 1) {
          return;
        }
        const branch = normalizeSimpleBranch(branches[0]);
        if (!branch || branch.length !== 1) {
          return;
        }
        chars.push(branch);
        index += match.end + 1;
      }
      if (chars.length < 1) {
        return;
      }
      const source = chars.length === 1 ? utils.escapeRegex(chars[0]) : `[${chars.map((ch) => utils.escapeRegex(ch)).join("")}]`;
      return `${source}*`;
    };
    var repeatedExtglobRecursion = (pattern) => {
      let depth = 0;
      let value = pattern.trim();
      let match = parseRepeatedExtglob(value);
      while (match) {
        depth++;
        value = match.body.trim();
        match = parseRepeatedExtglob(value);
      }
      return depth;
    };
    var analyzeRepeatedExtglob = (body, options) => {
      if (options.maxExtglobRecursion === false) {
        return { risky: false };
      }
      const max = typeof options.maxExtglobRecursion === "number" ? options.maxExtglobRecursion : constants.DEFAULT_MAX_EXTGLOB_RECURSION;
      const branches = splitTopLevel(body).map((branch) => branch.trim());
      if (branches.length > 1) {
        if (branches.some((branch) => branch === "") || branches.some((branch) => /^[*?]+$/.test(branch)) || hasRepeatedCharPrefixOverlap(branches)) {
          return { risky: true };
        }
      }
      for (const branch of branches) {
        const safeOutput = getStarExtglobSequenceOutput(branch);
        if (safeOutput) {
          return { risky: true, safeOutput };
        }
        if (repeatedExtglobRecursion(branch) > max) {
          return { risky: true };
        }
      }
      return { risky: false };
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const PLATFORM_CHARS = constants.globChars(opts.windows);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n = 1) => input[state.index + n];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.output = (prev.output || prev.value) + tok.value;
          prev.value += tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        token.startIndex = state.index;
        token.tokensIndex = tokens.length;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        const literal = input.slice(token.startIndex, state.index + 1);
        const body = input.slice(token.startIndex + 2, state.index);
        const analysis = analyzeRepeatedExtglob(body, opts);
        if ((token.type === "plus" || token.type === "star") && analysis.risky) {
          const safeOutput = analysis.safeOutput ? (token.output ? "" : ONE_CHAR) + (opts.capture ? `(${analysis.safeOutput})` : analysis.safeOutput) : void 0;
          const open = tokens[token.tokensIndex];
          open.type = "text";
          open.value = literal;
          open.output = safeOutput || utils.escapeRegex(literal);
          for (let i = token.tokensIndex + 1; i < tokens.length; i++) {
            tokens[i].value = "";
            tokens[i].output = "";
            delete tokens[i].suffix;
          }
          state.output = token.output + open.output;
          state.backtrack = true;
          push({ type: "paren", extglob: true, value, output: "" });
          decrement("parens");
          return;
        }
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse(rest, { ...options, fastpaths: false }).output;
            output = token.close = `)${expression})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star : "");
            }
            return star;
          }
          return esc ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range.unshift(arr[i].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants.globChars(opts.windows);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true) return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match) return;
            const source2 = create(match[1]);
            if (!source2) return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module2.exports = parse;
  }
});

// node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "node_modules/picomatch/lib/picomatch.js"(exports2, module2) {
    "use strict";
    var scan = require_scan();
    var parse = require_parse2();
    var utils = require_utils();
    var constants = require_constants2();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch = (glob, options, returnState = false) => {
      if (Array.isArray(glob)) {
        const fns = glob.map((input) => picomatch(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix = opts.windows;
      const regex = isState ? picomatch.compileRe(glob, options) : picomatch.makeRe(glob, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
        const result = { glob, state, regex, posix, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch.test = (input, regex, options, { glob, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix ? utils.toPosixSlashes : null);
      let match = input === glob;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch.matchBase(input, regex, options, posix);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch.matchBase = (input, glob, options) => {
      const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
      return regex.test(utils.basename(input));
    };
    picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    picomatch.parse = (pattern, options) => {
      if (Array.isArray(pattern)) return pattern.map((p) => picomatch.parse(p, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch.scan = (input, options) => scan(input, options);
    picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err) {
        if (options && options.debug === true) throw err;
        return /$^/;
      }
    };
    picomatch.constants = constants;
    module2.exports = picomatch;
  }
});

// node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "node_modules/picomatch/index.js"(exports2, module2) {
    "use strict";
    var pico = require_picomatch();
    var utils = require_utils();
    function picomatch(glob, options, returnState = false) {
      if (options && (options.windows === null || options.windows === void 0)) {
        options = { ...options, windows: utils.isWindows() };
      }
      return pico(glob, options, returnState);
    }
    Object.assign(picomatch, pico);
    module2.exports = picomatch;
  }
});

// index.js
if (typeof globalThis.global === "undefined") globalThis.global = globalThis;
if (typeof globalThis.self === "undefined") globalThis.self = globalThis;
if (typeof globalThis.process === "undefined") globalThis.process = {};
if (typeof process.nextTick === "undefined") {
  process.nextTick = function(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    Promise.resolve().then(function() {
      fn.apply(null, args);
    });
  };
}
if (typeof process.env === "undefined") process.env = {};
require_polyfill();
if (!globalThis.__swiftBunPackages) {
  __swiftBunStructuredClonePackage = require_cjs();
  __swiftBunYAMLPackage = require_js_yaml();
  globalThis.__swiftBunPackages = {
    structuredClone: __swiftBunStructuredClonePackage && __swiftBunStructuredClonePackage.default ? __swiftBunStructuredClonePackage.default : __swiftBunStructuredClonePackage,
    semver: require_semver2(),
    YAML: {
      parse: function(input) {
        return __swiftBunYAMLPackage.load(String(input || ""));
      },
      stringify: function(value) {
        return __swiftBunYAMLPackage.dump(value);
      }
    },
    picomatch: require_picomatch2()
  };
}
var __swiftBunStructuredClonePackage;
var __swiftBunYAMLPackage;
(function() {
  function EventEmitter() {
    this._events = {};
    this._maxListeners = 10;
  }
  EventEmitter.prototype.on = function(event, fn) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(fn);
    return this;
  };
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prototype.once = function(event, fn) {
    var self2 = this;
    function wrapper() {
      self2.removeListener(event, wrapper);
      fn.apply(this, arguments);
    }
    wrapper._original = fn;
    return this.on(event, wrapper);
  };
  EventEmitter.prototype.off = function(event, fn) {
    return this.removeListener(event, fn);
  };
  EventEmitter.prototype.removeListener = function(event, fn) {
    if (!this._events[event]) return this;
    this._events[event] = this._events[event].filter(function(listener) {
      return listener !== fn && listener._original !== fn;
    });
    return this;
  };
  EventEmitter.prototype.removeAllListeners = function(event) {
    if (event) delete this._events[event];
    else this._events = {};
    return this;
  };
  EventEmitter.prototype.emit = function(event) {
    if (!this._events[event]) return false;
    var args = Array.prototype.slice.call(arguments, 1);
    var listeners = this._events[event].slice();
    for (var index = 0; index < listeners.length; index++) {
      listeners[index].apply(this, args);
    }
    return true;
  };
  EventEmitter.prototype.listeners = function(event) {
    return (this._events[event] || []).slice();
  };
  EventEmitter.prototype.listenerCount = function(event) {
    return (this._events[event] || []).length;
  };
  EventEmitter.prototype.setMaxListeners = function(n) {
    this._maxListeners = n;
    return this;
  };
  EventEmitter.prototype.getMaxListeners = function() {
    return this._maxListeners;
  };
  EventEmitter.prototype.rawListeners = EventEmitter.prototype.listeners;
  EventEmitter.prototype.prependListener = EventEmitter.prototype.on;
  EventEmitter.prototype.prependOnceListener = EventEmitter.prototype.once;
  EventEmitter.prototype.eventNames = function() {
    return Object.keys(this._events);
  };
  EventEmitter.defaultMaxListeners = 10;
  EventEmitter.listenerCount = function(emitter, event) {
    return emitter.listenerCount(event);
  };
  function Readable() {
    EventEmitter.call(this);
    this.readable = true;
    this.destroyed = false;
    this._readableState = {
      flowing: null,
      ended: false,
      buffer: [],
      encoding: null
    };
  }
  Readable.prototype = Object.create(EventEmitter.prototype);
  Readable.prototype.constructor = Readable;
  Readable.prototype.read = function() {
    if (this._readableState.buffer.length === 0) return null;
    return this._readableState.buffer.shift();
  };
  Readable.prototype.pipe = function(dest) {
    var self2 = this;
    self2.on("end", function() {
      dest.end();
    });
    self2.on("data", function(chunk) {
      dest.write(chunk);
    });
    if (typeof self2.resume === "function") {
      self2.resume();
    }
    return dest;
  };
  Readable.prototype.unpipe = function() {
    return this;
  };
  Readable.prototype.resume = function() {
    this._readableState.flowing = true;
    while (this._readableState.buffer.length > 0) {
      this.emit("data", this._readableState.buffer.shift());
    }
    if (this._readableState.ended && this._readableState.buffer.length === 0) {
      this.emit("end");
    }
    return this;
  };
  Readable.prototype.pause = function() {
    this._readableState.flowing = false;
    return this;
  };
  Readable.prototype.setEncoding = function(encoding) {
    this._readableState.encoding = encoding || "utf8";
    return this;
  };
  Readable.prototype.destroy = function(error) {
    this.destroyed = true;
    if (error) this.emit("error", error);
    return this;
  };
  Readable.prototype.push = function(chunk) {
    if (chunk === null) {
      this._readableState.ended = true;
      if (this.listenerCount("readable") > 0) {
        this.emit("readable");
      }
      if (this._readableState.flowing !== false && this._readableState.buffer.length === 0) {
        this.emit("end");
      }
      return false;
    }
    if (this._readableState.flowing === false) {
      this._readableState.buffer.push(chunk);
      if (this.listenerCount("readable") > 0) {
        this.emit("readable");
      }
      return true;
    }
    if (this.listenerCount("data") === 0) {
      this._readableState.buffer.push(chunk);
      if (this.listenerCount("readable") > 0) {
        this.emit("readable");
      }
      return true;
    }
    if (this.listenerCount("readable") > 0) {
      this._readableState.buffer.push(chunk);
      this.emit("readable");
      return true;
    }
    this.emit("data", chunk);
    return true;
  };
  Readable.prototype[Symbol.asyncIterator] = function() {
    var self2 = this;
    var done = false;
    var waiting = null;
    var pendingError = null;
    function resolveNext(result) {
      if (!waiting) return;
      var current = waiting;
      waiting = null;
      current.resolve(result);
    }
    self2.on("data", function(chunk) {
      if (waiting) {
        resolveNext({ value: chunk, done: false });
      }
    });
    self2.on("end", function() {
      done = true;
      resolveNext({ value: void 0, done: true });
    });
    self2.on("error", function(error) {
      done = true;
      if (waiting) {
        var current = waiting;
        waiting = null;
        current.reject(error);
      } else {
        pendingError = error;
      }
    });
    return {
      next: function() {
        var chunk = self2.read();
        if (chunk !== null) return Promise.resolve({ value: chunk, done: false });
        if (pendingError) {
          var error = pendingError;
          pendingError = null;
          return Promise.reject(error);
        }
        if (done) return Promise.resolve({ value: void 0, done: true });
        return new Promise(function(resolve, reject) {
          waiting = { resolve, reject };
          self2.resume();
        });
      },
      return: function() {
        done = true;
        self2.destroy();
        return Promise.resolve({ value: void 0, done: true });
      },
      [Symbol.asyncIterator]: function() {
        return this;
      }
    };
  };
  function Writable(options) {
    EventEmitter.call(this);
    this.writable = true;
    this.destroyed = false;
    this._writableState = { ended: false, finished: false };
    this._impl = options || {};
  }
  Writable.prototype = Object.create(EventEmitter.prototype);
  Writable.prototype.constructor = Writable;
  Writable.prototype.write = function(chunk, encoding, cb) {
    if (typeof encoding === "function") cb = encoding;
    if (typeof this._impl.write === "function") {
      this._impl.write(chunk, encoding, cb || function() {
      });
    } else if (cb) {
      cb();
    }
    return true;
  };
  Writable.prototype.end = function(chunk, encoding, cb) {
    if (chunk) this.write(chunk, encoding);
    if (typeof chunk === "function") cb = chunk;
    if (typeof encoding === "function") cb = encoding;
    if (typeof this._impl.final === "function") {
      this._impl.final(cb || function() {
      });
    }
    this._writableState.ended = true;
    this._writableState.finished = true;
    this.emit("finish");
    if (cb) cb();
    return this;
  };
  Writable.prototype.destroy = function(error) {
    this.destroyed = true;
    if (error) this.emit("error", error);
    return this;
  };
  Writable.prototype.cork = function() {
  };
  Writable.prototype.uncork = function() {
  };
  Writable.prototype.setDefaultEncoding = function() {
    return this;
  };
  function Duplex(options) {
    Readable.call(this, options);
    Writable.call(this, options);
  }
  Duplex.prototype = Object.create(Readable.prototype);
  Object.assign(Duplex.prototype, Writable.prototype);
  Duplex.prototype.constructor = Duplex;
  function Transform(options) {
    Duplex.call(this, options);
  }
  Transform.prototype = Object.create(Duplex.prototype);
  Transform.prototype.constructor = Transform;
  Transform.prototype._transform = function(chunk, encoding, cb) {
    cb(null, chunk);
  };
  function PassThrough(options) {
    Transform.call(this, options);
  }
  PassThrough.prototype = Object.create(Transform.prototype);
  PassThrough.prototype.constructor = PassThrough;
  PassThrough.prototype.write = function(chunk, encoding, cb) {
    this.push(chunk);
    if (typeof cb === "function") cb();
    return true;
  };
  PassThrough.prototype.end = function(chunk, encoding, cb) {
    if (chunk) this.write(chunk, encoding);
    this.push(null);
    this.emit("finish");
    if (typeof cb === "function") cb();
    return this;
  };
  function pipeline() {
    var streams = Array.prototype.slice.call(arguments);
    var callback = typeof streams[streams.length - 1] === "function" ? streams.pop() : null;
    var last = streams[streams.length - 1];
    if (callback) {
      last.on("finish", function() {
        callback(null);
      });
      last.on("error", function(error) {
        callback(error);
      });
    }
    for (var index = 0; index < streams.length - 1; index++) {
      streams[index].pipe(streams[index + 1]);
    }
    return last;
  }
  function finished(stream2, callback) {
    stream2.on("end", function() {
      callback(null);
    });
    stream2.on("finish", function() {
      callback(null);
    });
    stream2.on("error", function(error) {
      callback(error);
    });
  }
  var stream = {
    Readable,
    Writable,
    Duplex,
    Transform,
    PassThrough,
    EventEmitter,
    pipeline,
    finished,
    Stream: Readable
  };
  stream.default = stream;
  globalThis.__readableStream = stream;
  if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
  globalThis.__nodeModules.stream = stream;
  var stdin = new Readable();
  stdin.setEncoding("utf8");
  stdin.fd = 0;
  stdin.isTTY = false;
  stdin.setRawMode = function() {
    return stdin;
  };
  globalThis.__deliverStdinData = function(chunk) {
    if (chunk === null) {
      stdin.push(null);
    } else {
      stdin.push(chunk);
    }
  };
  if (!globalThis.process) globalThis.process = {};
  globalThis.process.stdin = stdin;
})();
(function() {
  if (!globalThis.process || !globalThis.process.stdin) return;
  var stdin = globalThis.process.stdin;
  if (typeof stdin.listenerCount !== "function") return;
  var nativeRefed = false;
  var manualRefed = false;
  var listenerRefed = false;
  var iteratorRefs = 0;
  var resumeRefed = false;
  function nativeRef() {
    if (typeof globalThis.__stdinRef === "function") {
      globalThis.__stdinRef();
    }
  }
  function nativeUnref() {
    if (typeof globalThis.__stdinUnref === "function") {
      globalThis.__stdinUnref();
    }
  }
  function syncRefState() {
    var shouldRef = manualRefed || listenerRefed || iteratorRefs > 0 || resumeRefed;
    if (shouldRef && !nativeRefed) {
      nativeRefed = true;
      nativeRef();
    } else if (!shouldRef && nativeRefed) {
      nativeRefed = false;
      nativeUnref();
    }
  }
  function refreshListenerRef() {
    listenerRefed = stdin.listenerCount("data") > 0 || stdin.listenerCount("readable") > 0;
    syncRefState();
  }
  function releaseIteratorRef() {
    if (iteratorRefs > 0) {
      iteratorRefs -= 1;
      syncRefState();
    }
  }
  stdin.ref = function() {
    manualRefed = true;
    syncRefState();
    return stdin;
  };
  stdin.unref = function() {
    manualRefed = false;
    syncRefState();
    return stdin;
  };
  if (typeof stdin.resume === "function") {
    var origResume = stdin.resume;
    stdin.resume = function() {
      resumeRefed = true;
      syncRefState();
      return origResume.call(stdin);
    };
  }
  if (typeof stdin.pause === "function") {
    var origPause = stdin.pause;
    stdin.pause = function() {
      resumeRefed = false;
      syncRefState();
      return origPause.call(stdin);
    };
  }
  if (typeof stdin.on === "function") {
    var origOn = stdin.on;
    stdin.on = function(event, fn) {
      var result = origOn.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
    stdin.addListener = stdin.on;
  }
  if (typeof stdin.once === "function") {
    var origOnce = stdin.once;
    stdin.once = function(event, fn) {
      var result = origOnce.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }
  if (typeof stdin.prependListener === "function") {
    var origPrependListener = stdin.prependListener;
    stdin.prependListener = function(event, fn) {
      var result = origPrependListener.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }
  if (typeof stdin.prependOnceListener === "function") {
    var origPrependOnceListener = stdin.prependOnceListener;
    stdin.prependOnceListener = function(event, fn) {
      var result = origPrependOnceListener.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }
  if (typeof stdin.removeListener === "function") {
    var origRemoveListener = stdin.removeListener;
    stdin.removeListener = function(event, fn) {
      var result = origRemoveListener.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }
  if (typeof stdin.off === "function") {
    stdin.off = function(event, fn) {
      return stdin.removeListener(event, fn);
    };
  }
  if (typeof stdin.removeAllListeners === "function") {
    var origRemoveAllListeners = stdin.removeAllListeners;
    stdin.removeAllListeners = function(event) {
      var result = origRemoveAllListeners.call(stdin, event);
      if (event === void 0 || event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }
  if (typeof stdin.on === "function") {
    stdin.on("end", function() {
      listenerRefed = false;
      iteratorRefs = 0;
      resumeRefed = false;
      syncRefState();
    });
  }
  var origIterator = stdin[Symbol.asyncIterator];
  if (origIterator) {
    stdin[Symbol.asyncIterator] = function() {
      iteratorRefs += 1;
      syncRefState();
      var iterator = origIterator.call(stdin);
      var released = false;
      function releaseOnce() {
        if (released) return;
        released = true;
        releaseIteratorRef();
      }
      return {
        next: function() {
          return Promise.resolve(iterator.next.apply(iterator, arguments)).then(
            function(result) {
              if (result && result.done) releaseOnce();
              return result;
            },
            function(error) {
              releaseOnce();
              throw error;
            }
          );
        },
        return: function() {
          releaseOnce();
          if (typeof iterator.return === "function") {
            return iterator.return.apply(iterator, arguments);
          }
          return Promise.resolve({ value: void 0, done: true });
        },
        throw: function() {
          releaseOnce();
          if (typeof iterator.throw === "function") {
            return iterator.throw.apply(iterator, arguments);
          }
          return Promise.reject(arguments[0]);
        },
        [Symbol.asyncIterator]: function() {
          return this;
        }
      };
    };
  }
})();
(function() {
  var Writable = globalThis.__readableStream.Writable;
  var stdout = new Writable({
    write: function(chunk, encoding, callback) {
      var str = typeof chunk === "string" ? chunk : chunk.toString();
      if (typeof globalThis.__nativeStdoutWrite === "function") {
        globalThis.__nativeStdoutWrite(str);
      }
      callback();
    }
  });
  stdout.fd = 1;
  stdout.isTTY = false;
  stdout.columns = 80;
  stdout.rows = 24;
  stdout.writable = true;
  var _origCork = stdout.cork;
  var _origUncork = stdout.uncork;
  stdout.cork = function() {
    if (_origCork) _origCork.call(stdout);
  };
  stdout.uncork = function() {
    if (_origUncork) _origUncork.call(stdout);
  };
  if (!globalThis.process) globalThis.process = {};
  globalThis.process.stdout = stdout;
})();
(function() {
  var Writable = globalThis.__readableStream.Writable;
  var stderr = new Writable({
    write: function(chunk, encoding, callback) {
      var str = typeof chunk === "string" ? chunk : chunk.toString();
      if (typeof globalThis.__nativeStderrWrite === "function") {
        globalThis.__nativeStderrWrite(str);
      }
      callback();
    }
  });
  stderr.fd = 2;
  stderr.isTTY = false;
  stderr.writable = true;
  if (!globalThis.process) globalThis.process = {};
  globalThis.process.stderr = stderr;
})();
if (typeof globalThis.queueMicrotask === "undefined") {
  globalThis.queueMicrotask = function(fn) {
    Promise.resolve().then(fn);
  };
}
(function() {
  function getBufferCtor() {
    return typeof Buffer !== "undefined" ? Buffer : null;
  }
  function normalizeHeaders(init) {
    var map = {};
    if (!init) return map;
    if (typeof globalThis.Headers === "function" && init instanceof globalThis.Headers) {
      init.forEach(function(value, key2) {
        map[key2.toLowerCase()] = String(value);
      });
      return map;
    }
    if (Array.isArray(init)) {
      for (var i = 0; i < init.length; i++) {
        map[String(init[i][0]).toLowerCase()] = String(init[i][1]);
      }
      return map;
    }
    for (var key in init) {
      map[key.toLowerCase()] = String(init[key]);
    }
    return map;
  }
  function bodyToText(body) {
    if (body === void 0 || body === null) return "";
    if (typeof body === "string") return body;
    var BufferCtor = getBufferCtor();
    if (BufferCtor && BufferCtor.isBuffer && BufferCtor.isBuffer(body)) {
      return body.toString("utf8");
    }
    if (body instanceof Uint8Array) {
      return new TextDecoder().decode(body);
    }
    if (body instanceof ArrayBuffer) {
      return new TextDecoder().decode(new Uint8Array(body));
    }
    if (typeof Blob === "function" && body instanceof Blob && typeof body.text === "function") {
      throw new TypeError("Blob request bodies must be consumed before fetch()");
    }
    return String(body);
  }
  function isReadableStreamBody(body) {
    return !!body && typeof body.getReader === "function";
  }
  function encodeBodyChunk(bodyText) {
    var BufferCtor = getBufferCtor();
    if (BufferCtor) return BufferCtor.from(bodyText, "utf8");
    return new TextEncoder().encode(bodyText);
  }
  function concatByteChunks(chunks, totalLength) {
    var BufferCtor = getBufferCtor();
    if (BufferCtor) {
      var buffers = [];
      for (var i = 0; i < chunks.length; i++) {
        buffers.push(BufferCtor.from(chunks[i]));
      }
      return BufferCtor.concat(buffers, totalLength);
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var j = 0; j < chunks.length; j++) {
      result.set(chunks[j], offset);
      offset += chunks[j].length;
    }
    return result;
  }
  function consumeBodyStream(body) {
    if (!body) {
      return Promise.resolve(new Uint8Array(0));
    }
    if (!isReadableStreamBody(body)) {
      return Promise.resolve(encodeBodyChunk(bodyToText(body)));
    }
    var reader = body.getReader();
    var chunks = [];
    var totalLength = 0;
    function pump() {
      return reader.read().then(function(step) {
        if (step.done) {
          return concatByteChunks(chunks, totalLength);
        }
        var value = step.value instanceof Uint8Array ? step.value : new Uint8Array(step.value);
        chunks.push(value);
        totalLength += value.length;
        return pump();
      });
    }
    return pump();
  }
  function makeReadableBodyStream(bodyText) {
    if (typeof ReadableStream !== "function") return null;
    return new ReadableStream({
      start: function(controller) {
        var chunk = encodeBodyChunk(bodyText);
        if (chunk && chunk.length > 0) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });
  }
  function createAbortError(message) {
    var text = message || "The operation was aborted.";
    if (typeof DOMException === "function") {
      return new DOMException(text, "AbortError");
    }
    var error = new Error(text);
    error.name = "AbortError";
    return error;
  }
  function Headers(init) {
    this._map = normalizeHeaders(init);
  }
  Headers.prototype.get = function(name) {
    return this._map[name.toLowerCase()] || null;
  };
  Headers.prototype.set = function(name, value) {
    this._map[name.toLowerCase()] = String(value);
  };
  Headers.prototype.has = function(name) {
    return name.toLowerCase() in this._map;
  };
  Headers.prototype.delete = function(name) {
    delete this._map[name.toLowerCase()];
  };
  Headers.prototype.append = function(name, value) {
    var key = name.toLowerCase();
    if (this._map[key]) this._map[key] += ", " + value;
    else this._map[key] = String(value);
  };
  Headers.prototype.forEach = function(cb) {
    for (var key in this._map) cb(this._map[key], key, this);
  };
  Headers.prototype.entries = function() {
    var pairs = [];
    for (var key in this._map) pairs.push([key, this._map[key]]);
    return pairs[Symbol.iterator]();
  };
  Headers.prototype.keys = function() {
    return Object.keys(this._map)[Symbol.iterator]();
  };
  Headers.prototype.values = function() {
    var values = [];
    for (var key in this._map) values.push(this._map[key]);
    return values[Symbol.iterator]();
  };
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  function Response(body, init) {
    init = init || {};
    this._bodyText = isReadableStreamBody(body) ? null : bodyToText(body);
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = init.statusText || "";
    this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers || {});
    this.url = init.url || "";
    this.type = "default";
    this.redirected = false;
    this.bodyUsed = false;
    if (body === void 0 || body === null) {
      this.body = null;
    } else if (isReadableStreamBody(body)) {
      this.body = body;
    } else {
      this.body = makeReadableBodyStream(this._bodyText);
    }
  }
  Response.prototype._consumeBody = function(mapper) {
    if (this.bodyUsed) {
      return Promise.reject(new TypeError("Body is unusable"));
    }
    this.bodyUsed = true;
    if (this._bodyText !== null) {
      return Promise.resolve(mapper(this._bodyText, encodeBodyChunk(this._bodyText)));
    }
    var body = this.body;
    this.body = null;
    return consumeBodyStream(body).then(function(bytes) {
      return mapper(new TextDecoder().decode(bytes), bytes);
    });
  };
  Response.prototype.text = function() {
    return this._consumeBody(function(text) {
      return text;
    });
  };
  Response.prototype.json = function() {
    return this._consumeBody(function(text) {
      return JSON.parse(text);
    });
  };
  Response.prototype.arrayBuffer = function() {
    return this._consumeBody(function(_text, bytes) {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    });
  };
  Response.prototype.blob = function() {
    return this._consumeBody(function(_text, bytes) {
      return typeof Blob === "function" ? new Blob([bytes]) : bytes;
    });
  };
  Response.prototype.clone = function() {
    if (this.bodyUsed) {
      throw new TypeError("Body is unusable");
    }
    if (this._bodyText === null && this.body && typeof this.body.tee === "function") {
      var branches = this.body.tee();
      this.body = branches[0];
      return new Response(branches[1], {
        status: this.status,
        statusText: this.statusText,
        headers: new Headers(this.headers),
        url: this.url
      });
    }
    return new Response(this._bodyText, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };
  Response.json = function(data, init) {
    init = init || {};
    var headers = new Headers(init.headers || {});
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify(data), {
      status: init.status || 200,
      statusText: init.statusText || "",
      headers
    });
  };
  function Request(input, init) {
    init = init || {};
    if (typeof input === "string") {
      this.url = input;
    } else {
      this.url = input.url;
      init = Object.assign({}, input, init);
    }
    this.method = (init.method || "GET").toUpperCase();
    this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers || {});
    this.body = init.body || null;
    this.signal = init.signal || null;
  }
  if (typeof globalThis.Headers === "undefined") globalThis.Headers = Headers;
  if (typeof globalThis.Request === "undefined") globalThis.Request = Request;
  if (typeof globalThis.Response === "undefined") globalThis.Response = Response;
  if (typeof globalThis.fetch === "undefined") {
    globalThis.fetch = function fetch2(input, init) {
      var request = input instanceof Request ? new Request(input, init) : new Request(input, init || {});
      var fetchOptions = {
        method: request.method,
        headers: normalizeHeaders(request.headers)
      };
      if (request.body !== void 0 && request.body !== null && request.method !== "GET" && request.method !== "HEAD") {
        fetchOptions.body = bodyToText(request.body);
      }
      return new Promise(function(resolve, reject) {
        if (typeof globalThis.__nativeFetchStream !== "function" && typeof globalThis.__nativeFetch !== "function") {
          reject(new TypeError("fetch failed: missing native transport"));
          return;
        }
        var settled = false;
        var abortHandler = null;
        function finishWithFailure(error) {
          if (settled) return;
          settled = true;
          if (request.signal && abortHandler && typeof request.signal.removeEventListener === "function") {
            request.signal.removeEventListener("abort", abortHandler);
          }
          reject(error);
        }
        function finishWithSuccess(response) {
          if (settled) return;
          settled = true;
          if (request.signal && abortHandler && typeof request.signal.removeEventListener === "function") {
            request.signal.removeEventListener("abort", abortHandler);
          }
          resolve(response);
        }
        if (request.signal && request.signal.aborted) {
          finishWithFailure(createAbortError());
          return;
        }
        if (request.signal && typeof request.signal.addEventListener === "function") {
          abortHandler = function() {
            finishWithFailure(createAbortError());
          };
          request.signal.addEventListener("abort", abortHandler);
        }
        if (typeof globalThis.__nativeFetchStream === "function") {
          var streamController = null;
          var streamCancelled = false;
          var operationID = 0;
          var responseStream = typeof ReadableStream === "function" ? new ReadableStream({
            start: function(controller) {
              streamController = controller;
            },
            cancel: function() {
              streamCancelled = true;
              if (typeof globalThis.__cancelFetch === "function" && operationID) {
                globalThis.__cancelFetch(operationID);
              }
            }
          }) : null;
          operationID = globalThis.__nativeFetchStream(
            request.url,
            JSON.stringify(fetchOptions),
            function(statusCode, responseURL, headersJSON) {
              var parsedHeaders = {};
              try {
                parsedHeaders = JSON.parse(headersJSON);
              } catch (error) {
              }
              finishWithSuccess(
                new Response(responseStream, {
                  status: statusCode,
                  headers: parsedHeaders,
                  url: responseURL
                })
              );
            },
            function(bytes) {
              if (streamCancelled || !streamController) return;
              streamController.enqueue(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
            },
            function() {
              if (streamCancelled || !streamController) return;
              streamController.close();
            },
            function(error) {
              var wrappedError = new TypeError("fetch failed: " + error);
              if (!settled) {
                finishWithFailure(wrappedError);
                return;
              }
              if (streamController) {
                streamController.error(wrappedError);
              }
            }
          );
          if (request.signal && abortHandler) {
            var priorAbortHandler = abortHandler;
            abortHandler = function() {
              if (typeof globalThis.__cancelFetch === "function" && operationID) {
                globalThis.__cancelFetch(operationID);
              }
              priorAbortHandler();
              if (streamController && settled) {
                streamController.error(createAbortError());
              }
            };
            request.signal.removeEventListener("abort", priorAbortHandler);
            request.signal.addEventListener("abort", abortHandler);
          }
          return;
        }
        globalThis.__nativeFetch(
          request.url,
          JSON.stringify(fetchOptions),
          function(statusCode, responseURL, headersJSON, body) {
            var parsedHeaders = {};
            try {
              parsedHeaders = JSON.parse(headersJSON);
            } catch (error) {
            }
            finishWithSuccess(
              new Response(body, {
                status: statusCode,
                headers: parsedHeaders,
                url: responseURL
              })
            );
          },
          function(error) {
            finishWithFailure(new TypeError("fetch failed: " + error));
          }
        );
      });
    };
  }
})();
if (typeof globalThis.Event === "undefined") {
  let Event = function(type, options) {
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
  };
  Event2 = Event;
  Event.prototype.preventDefault = function() {
    if (this.cancelable) this.defaultPrevented = true;
  };
  Event.prototype.stopPropagation = function() {
  };
  Event.prototype.stopImmediatePropagation = function() {
  };
  Event.NONE = 0;
  Event.CAPTURING_PHASE = 1;
  Event.AT_TARGET = 2;
  Event.BUBBLING_PHASE = 3;
  globalThis.Event = Event;
}
var Event2;
if (typeof globalThis.EventTarget === "undefined") {
  let EventTarget = function() {
    this._listeners = {};
  };
  EventTarget2 = EventTarget;
  EventTarget.prototype.addEventListener = function(type, fn, options) {
    if (!fn) return;
    if (!this._listeners[type]) this._listeners[type] = [];
    var once = options && (options.once || options === true);
    this._listeners[type].push({ fn, once });
  };
  EventTarget.prototype.removeEventListener = function(type, fn) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter(function(e) {
      return e.fn !== fn;
    });
  };
  EventTarget.prototype.dispatchEvent = function(event) {
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
var EventTarget2;
if (typeof globalThis.CustomEvent === "undefined") {
  let CustomEvent = function(type, options) {
    Event2.call(this, type, options);
    this.detail = options && options.detail !== void 0 ? options.detail : null;
  };
  CustomEvent2 = CustomEvent;
  CustomEvent.prototype = Object.create(Event2.prototype);
  CustomEvent.prototype.constructor = CustomEvent;
  globalThis.CustomEvent = CustomEvent;
}
var CustomEvent2;
function __swiftBunCloneArrayBuffer(buffer, byteOffset, byteLength) {
  var start = byteOffset || 0;
  var end = byteLength === void 0 ? buffer.byteLength : start + byteLength;
  return buffer.slice(start, end);
}
function __swiftBunEncodeText(value) {
  return new TextEncoder().encode(String(value));
}
function __swiftBunDecodeText(bytes) {
  return new TextDecoder().decode(bytes);
}
function __swiftBunConcatUint8Arrays(chunks) {
  var total = 0;
  for (var i = 0; i < chunks.length; i++) {
    total += chunks[i].byteLength;
  }
  var merged = new Uint8Array(total);
  var offset = 0;
  for (var j = 0; j < chunks.length; j++) {
    merged.set(chunks[j], offset);
    offset += chunks[j].byteLength;
  }
  return merged;
}
function __swiftBunNormalizeBlobPart(part) {
  if (part === void 0 || part === null) {
    return __swiftBunEncodeText("");
  }
  if (part instanceof Uint8Array) {
    return new Uint8Array(part);
  }
  if (part instanceof ArrayBuffer) {
    return new Uint8Array(__swiftBunCloneArrayBuffer(part));
  }
  if (ArrayBuffer.isView(part)) {
    return new Uint8Array(__swiftBunCloneArrayBuffer(part.buffer, part.byteOffset, part.byteLength));
  }
  if (typeof Blob === "function" && part instanceof Blob && part._bytes instanceof Uint8Array) {
    return new Uint8Array(part._bytes);
  }
  return __swiftBunEncodeText(String(part));
}
if (typeof globalThis.Blob === "undefined") {
  globalThis.Blob = function Blob2(parts, options) {
    options = options || {};
    var normalized = [];
    var sourceParts = parts || [];
    for (var i = 0; i < sourceParts.length; i++) {
      normalized.push(__swiftBunNormalizeBlobPart(sourceParts[i]));
    }
    this.type = String(options.type || "").toLowerCase();
    this._bytes = __swiftBunConcatUint8Arrays(normalized);
    this.size = this._bytes.byteLength;
  };
  Blob.prototype.text = function() {
    return Promise.resolve(__swiftBunDecodeText(this._bytes));
  };
  Blob.prototype.arrayBuffer = function() {
    return Promise.resolve(__swiftBunCloneArrayBuffer(this._bytes.buffer, this._bytes.byteOffset, this._bytes.byteLength));
  };
  Blob.prototype.slice = function(start, end, type) {
    var relativeStart = start === void 0 ? 0 : start;
    var relativeEnd = end === void 0 ? this.size : end;
    var size = this.size;
    if (relativeStart < 0) relativeStart = Math.max(size + relativeStart, 0);
    else relativeStart = Math.min(relativeStart, size);
    if (relativeEnd < 0) relativeEnd = Math.max(size + relativeEnd, 0);
    else relativeEnd = Math.min(relativeEnd, size);
    var span = Math.max(relativeEnd - relativeStart, 0);
    var sliced = this._bytes.slice(relativeStart, relativeStart + span);
    return new Blob([sliced], { type: type === void 0 ? this.type : type });
  };
  Blob.prototype.stream = function() {
    var bytes = new Uint8Array(this._bytes);
    return new ReadableStream({
      start: function(controller) {
        if (bytes.byteLength > 0) {
          controller.enqueue(bytes);
        }
        controller.close();
      }
    });
  };
}
if (typeof globalThis.File === "undefined") {
  globalThis.File = function File2(parts, name, options) {
    Blob.call(this, parts, options);
    this.name = String(name || "");
    this.lastModified = options && typeof options.lastModified === "number" ? options.lastModified : Date.now();
  };
  File.prototype = Object.create(Blob.prototype);
  File.prototype.constructor = File;
}
if (typeof globalThis.FormData === "undefined") {
  globalThis.FormData = function FormData2() {
    this._entries = [];
  };
  FormData.prototype.append = function(name, value, filename) {
    this._entries.push({ name, value, filename });
  };
  FormData.prototype.get = function(name) {
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i].name === name) return this._entries[i].value;
    }
    return null;
  };
  FormData.prototype.getAll = function(name) {
    return this._entries.filter(function(e) {
      return e.name === name;
    }).map(function(e) {
      return e.value;
    });
  };
  FormData.prototype.has = function(name) {
    return this._entries.some(function(e) {
      return e.name === name;
    });
  };
  FormData.prototype.set = function(name, value, filename) {
    this._entries = this._entries.filter(function(e) {
      return e.name !== name;
    });
    this.append(name, value, filename);
  };
  FormData.prototype.delete = function(name) {
    this._entries = this._entries.filter(function(e) {
      return e.name !== name;
    });
  };
  FormData.prototype.forEach = function(cb) {
    for (var i = 0; i < this._entries.length; i++) {
      cb(this._entries[i].value, this._entries[i].name, this);
    }
  };
  FormData.prototype.entries = function() {
    var arr = this._entries.map(function(e) {
      return [e.name, e.value];
    });
    return arr[Symbol.iterator]();
  };
  FormData.prototype[Symbol.iterator] = FormData.prototype.entries;
}
if (typeof globalThis.WebSocket === "undefined") {
  let WebSocket = function(url) {
    EventTarget2.call(this);
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.protocol = "";
    this.extensions = "";
    this.binaryType = "blob";
    this.bufferedAmount = 0;
  };
  WebSocket2 = WebSocket;
  WebSocket.prototype = Object.create(EventTarget2.prototype);
  WebSocket.prototype.constructor = WebSocket;
  WebSocket.prototype.send = function() {
  };
  WebSocket.prototype.close = function() {
    this.readyState = WebSocket.CLOSED;
  };
  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;
  globalThis.WebSocket = WebSocket;
}
var WebSocket2;
if (typeof globalThis.MessageChannel === "undefined") {
  let MessagePort = function() {
    EventTarget2.call(this);
    this.onmessage = null;
  }, MessageChannel = function() {
    this.port1 = new MessagePort();
    this.port2 = new MessagePort();
    this.port1._other = this.port2;
    this.port2._other = this.port1;
  };
  MessagePort2 = MessagePort, MessageChannel2 = MessageChannel;
  MessagePort.prototype = Object.create(EventTarget2.prototype);
  MessagePort.prototype.constructor = MessagePort;
  MessagePort.prototype.postMessage = function(data) {
    var self2 = this;
    if (self2._other && self2._other.onmessage) {
      Promise.resolve().then(function() {
        self2._other.onmessage({ data });
      });
    }
  };
  MessagePort.prototype.start = function() {
  };
  MessagePort.prototype.close = function() {
  };
  globalThis.MessagePort = MessagePort;
  globalThis.MessageChannel = MessageChannel;
}
var MessagePort2;
var MessageChannel2;
if (typeof globalThis.Worker === "undefined") {
  globalThis.Worker = function() {
    throw new Error("Worker is not supported in swift-bun");
  };
}
if (typeof globalThis.XMLHttpRequest === "undefined") {
  let dispatchXMLHttpRequestEvent = function(target, type) {
    var event = new Event2(type);
    target.dispatchEvent(event);
    var handler = target["on" + type];
    if (typeof handler === "function") {
      handler.call(target, event);
    }
  }, cloneHeaderMap = function(headers) {
    var map = {};
    if (!headers || typeof headers.forEach !== "function") {
      return map;
    }
    headers.forEach(function(value, key) {
      map[String(key).toLowerCase()] = String(value);
    });
    return map;
  };
  dispatchXMLHttpRequestEvent2 = dispatchXMLHttpRequestEvent, cloneHeaderMap2 = cloneHeaderMap;
  globalThis.XMLHttpRequest = function XMLHttpRequest2() {
    EventTarget2.call(this);
    this.readyState = XMLHttpRequest2.UNSENT;
    this.status = 0;
    this.statusText = "";
    this.responseType = "";
    this.response = null;
    this.responseText = "";
    this.responseURL = "";
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.onloadend = null;
    this._method = "GET";
    this._url = "";
    this._async = true;
    this._headers = {};
    this._responseHeaders = {};
    this._sendFlag = false;
    this._aborted = false;
    this._controller = null;
  };
  XMLHttpRequest.prototype = Object.create(EventTarget2.prototype);
  XMLHttpRequest.prototype.constructor = XMLHttpRequest;
  XMLHttpRequest.UNSENT = 0;
  XMLHttpRequest.OPENED = 1;
  XMLHttpRequest.HEADERS_RECEIVED = 2;
  XMLHttpRequest.LOADING = 3;
  XMLHttpRequest.DONE = 4;
  XMLHttpRequest.prototype.UNSENT = XMLHttpRequest.UNSENT;
  XMLHttpRequest.prototype.OPENED = XMLHttpRequest.OPENED;
  XMLHttpRequest.prototype.HEADERS_RECEIVED = XMLHttpRequest.HEADERS_RECEIVED;
  XMLHttpRequest.prototype.LOADING = XMLHttpRequest.LOADING;
  XMLHttpRequest.prototype.DONE = XMLHttpRequest.DONE;
  XMLHttpRequest.prototype.open = function(method, url, async) {
    if (async === false) {
      throw new Error("Synchronous XMLHttpRequest is not supported in swift-bun");
    }
    this._method = String(method || "GET").toUpperCase();
    this._url = String(url || "");
    this._async = async !== false;
    this._headers = {};
    this._responseHeaders = {};
    this._sendFlag = false;
    this._aborted = false;
    this.status = 0;
    this.statusText = "";
    this.response = null;
    this.responseText = "";
    this.responseURL = "";
    this.readyState = XMLHttpRequest.OPENED;
    dispatchXMLHttpRequestEvent(this, "readystatechange");
  };
  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (this.readyState !== XMLHttpRequest.OPENED || this._sendFlag) {
      throw new Error("INVALID_STATE_ERR");
    }
    var headerName = String(name).toLowerCase();
    var headerValue = String(value);
    if (this._headers[headerName]) {
      this._headers[headerName] += ", " + headerValue;
    } else {
      this._headers[headerName] = headerValue;
    }
  };
  XMLHttpRequest.prototype.getResponseHeader = function(name) {
    if (this.readyState < XMLHttpRequest.HEADERS_RECEIVED) return null;
    var value = this._responseHeaders[String(name).toLowerCase()];
    return value === void 0 ? null : value;
  };
  XMLHttpRequest.prototype.getAllResponseHeaders = function() {
    if (this.readyState < XMLHttpRequest.HEADERS_RECEIVED) return "";
    var lines = [];
    for (var key in this._responseHeaders) {
      lines.push(key + ": " + this._responseHeaders[key]);
    }
    return lines.join("\r\n");
  };
  XMLHttpRequest.prototype.overrideMimeType = function() {
  };
  XMLHttpRequest.prototype.abort = function() {
    if (this.readyState === XMLHttpRequest.UNSENT || this.readyState === XMLHttpRequest.OPENED && !this._sendFlag) {
      this.readyState = XMLHttpRequest.UNSENT;
      return;
    }
    this._aborted = true;
    this._sendFlag = false;
    if (this._controller && typeof this._controller.abort === "function") {
      this._controller.abort();
    }
    this.status = 0;
    this.statusText = "";
    this.response = null;
    this.responseText = "";
    this.readyState = XMLHttpRequest.DONE;
    dispatchXMLHttpRequestEvent(this, "readystatechange");
    dispatchXMLHttpRequestEvent(this, "abort");
    dispatchXMLHttpRequestEvent(this, "loadend");
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (this.readyState !== XMLHttpRequest.OPENED) {
      throw new Error("INVALID_STATE_ERR");
    }
    if (this._sendFlag) {
      throw new Error("INVALID_STATE_ERR");
    }
    var self2 = this;
    self2._sendFlag = true;
    self2._aborted = false;
    self2.response = null;
    self2.responseText = "";
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    self2._controller = controller;
    var options = {
      method: self2._method,
      headers: self2._headers
    };
    if (controller) {
      options.signal = controller.signal;
    }
    if (self2._method !== "GET" && self2._method !== "HEAD" && body !== void 0) {
      options.body = body;
    }
    var responseRef = null;
    fetch(self2._url, options).then(function(response) {
      if (self2._aborted) {
        return null;
      }
      responseRef = response;
      self2.status = response.status;
      self2.statusText = response.statusText || "";
      self2.responseURL = response.url || self2._url;
      self2._responseHeaders = cloneHeaderMap(response.headers);
      self2.readyState = XMLHttpRequest.HEADERS_RECEIVED;
      dispatchXMLHttpRequestEvent(self2, "readystatechange");
      self2.readyState = XMLHttpRequest.LOADING;
      dispatchXMLHttpRequestEvent(self2, "readystatechange");
      if (self2.responseType === "arraybuffer") {
        return response.arrayBuffer();
      }
      if (self2.responseType === "blob") {
        return response.arrayBuffer().then(function(buffer) {
          return new Blob([buffer], { type: response.headers.get("content-type") || "" });
        });
      }
      return response.text();
    }).then(function(payload) {
      if (self2._aborted || payload === null) {
        return;
      }
      if (self2.responseType === "arraybuffer" || self2.responseType === "blob") {
        self2.response = payload;
      } else if (self2.responseType === "json") {
        self2.responseText = String(payload || "");
        self2.response = self2.responseText ? JSON.parse(self2.responseText) : null;
      } else {
        self2.responseText = String(payload || "");
        self2.response = self2.responseText;
      }
      if (self2.responseType === "" || self2.responseType === "text") {
        self2.responseText = String(payload || "");
        self2.response = self2.responseText;
      }
      self2._sendFlag = false;
      self2.readyState = XMLHttpRequest.DONE;
      dispatchXMLHttpRequestEvent(self2, "readystatechange");
      dispatchXMLHttpRequestEvent(self2, "load");
      dispatchXMLHttpRequestEvent(self2, "loadend");
    }, function(error) {
      if (self2._aborted || error && error.name === "AbortError") {
        if (!self2._aborted) {
          self2.abort();
        }
        return;
      }
      self2._sendFlag = false;
      self2.status = 0;
      self2.statusText = responseRef && responseRef.statusText ? responseRef.statusText : "";
      self2.response = null;
      self2.responseText = "";
      self2.readyState = XMLHttpRequest.DONE;
      dispatchXMLHttpRequestEvent(self2, "readystatechange");
      dispatchXMLHttpRequestEvent(self2, "error");
      dispatchXMLHttpRequestEvent(self2, "loadend");
    });
  };
}
var dispatchXMLHttpRequestEvent2;
var cloneHeaderMap2;
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = {
    getRandomValues: function(arr) {
      if (typeof globalThis.__cryptoRandomBytes === "function") {
        var byteLen = arr.byteLength || arr.length;
        var randomBytes = globalThis.__cryptoRandomBytes(byteLen);
        var view = new Uint8Array(arr.buffer, arr.byteOffset, byteLen);
        for (var i = 0; i < byteLen; i++) view[i] = randomBytes[i];
      } else {
        var fallbackView = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength || arr.length);
        for (var i = 0; i < fallbackView.length; i++) fallbackView[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: function() {
      var b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = b[6] & 15 | 64;
      b[8] = b[8] & 63 | 128;
      var h = [];
      for (var i = 0; i < 16; i++) h.push(("0" + b[i].toString(16)).slice(-2));
      return h.slice(0, 4).join("") + "-" + h.slice(4, 6).join("") + "-" + h.slice(6, 8).join("") + "-" + h.slice(8, 10).join("") + "-" + h.slice(10).join("");
    },
    subtle: {
      digest: function(algorithm, data) {
        if (typeof globalThis.__subtleDigest !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var name = typeof algorithm === "string" ? algorithm : algorithm && algorithm.name;
        var bytes = globalThis.__subtleDigest(name, Array.from(data instanceof Uint8Array ? data : new Uint8Array(data)));
        if (!bytes || bytes.length === 0) {
          return Promise.reject(new DOMException("Algorithm is not supported", "NotSupportedError"));
        }
        var result = new Uint8Array(bytes);
        return Promise.resolve(result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength));
      },
      importKey: function(format, keyData, algorithm, extractable, keyUsages) {
        if (typeof globalThis.__subtleImportKey !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var payload;
        if (format === "jwk") {
          payload = new TextEncoder().encode(JSON.stringify(keyData));
        } else if (keyData instanceof Uint8Array) {
          payload = keyData;
        } else if (ArrayBuffer.isView(keyData)) {
          payload = new Uint8Array(keyData.buffer, keyData.byteOffset, keyData.byteLength);
        } else if (keyData instanceof ArrayBuffer) {
          payload = new Uint8Array(keyData);
        } else {
          payload = new TextEncoder().encode(String(keyData));
        }
        var imported = globalThis.__subtleImportKey(
          format,
          Array.from(payload),
          JSON.stringify(algorithm),
          !!extractable,
          JSON.stringify(keyUsages || [])
        );
        if (imported && imported.error) {
          return Promise.reject(new DOMException(imported.error, "NotSupportedError"));
        }
        imported.usages = imported.usages || [];
        imported.algorithm = imported.algorithm || algorithm;
        imported.extractable = !!imported.extractable;
        imported[Symbol.toStringTag] = "CryptoKey";
        return Promise.resolve(imported);
      },
      sign: function(algorithm, key, data) {
        if (typeof globalThis.__subtleSign !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var result = globalThis.__subtleSign(
          JSON.stringify(algorithm),
          key.token,
          Array.from(data instanceof Uint8Array ? data : new Uint8Array(data))
        );
        if (result && result.error) {
          return Promise.reject(new DOMException(result.error, "OperationError"));
        }
        var signature = new Uint8Array(result.bytes || []);
        return Promise.resolve(signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength));
      },
      verify: function(algorithm, key, signature, data) {
        if (typeof globalThis.__subtleVerify !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var result = globalThis.__subtleVerify(
          JSON.stringify(algorithm),
          key.token,
          Array.from(signature instanceof Uint8Array ? signature : new Uint8Array(signature)),
          Array.from(data instanceof Uint8Array ? data : new Uint8Array(data))
        );
        if (result && result.error) {
          return Promise.reject(new DOMException(result.error, "OperationError"));
        }
        return Promise.resolve(!!result.verified);
      },
      encrypt: function() {
        return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
      },
      decrypt: function() {
        return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
      }
    }
  };
}
if (typeof globalThis.structuredClone === "undefined") {
  let cloneBlobLike = function(value) {
    if (typeof File === "function" && value instanceof File) {
      return new File([value._bytes ? new Uint8Array(value._bytes) : value], value.name, {
        type: value.type,
        lastModified: value.lastModified
      });
    }
    if (typeof Blob === "function" && value instanceof Blob) {
      return new Blob([value._bytes ? new Uint8Array(value._bytes) : value], { type: value.type });
    }
    return null;
  };
  cloneBlobLike2 = cloneBlobLike;
  globalThis.structuredClone = function(obj) {
    if (obj === void 0) return void 0;
    var directBlobClone = cloneBlobLike(obj);
    if (directBlobClone) return directBlobClone;
    return globalThis.__swiftBunPackages.structuredClone(obj);
  };
}
var cloneBlobLike2;
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = { userAgent: "swift-bun", platform: "darwin", language: "en", languages: ["en"] };
}
if (!Symbol.dispose) Symbol.dispose = /* @__PURE__ */ Symbol.for("Symbol.dispose");
if (!Symbol.asyncDispose) Symbol.asyncDispose = /* @__PURE__ */ Symbol.for("Symbol.asyncDispose");
/*! Bundled license information:

web-streams-polyfill/dist/polyfill.js:
  (**
   * @license
   * web-streams-polyfill v4.2.0
   * Copyright 2025 Mattias Buelens, Diwank Singh Tomer and other contributors.
   * This code is released under the MIT license.
   * SPDX-License-Identifier: MIT
   *)
*/
