(() => {
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

  // node_modules/base64-js/index.js
  var require_base64_js = __commonJS({
    "node_modules/base64-js/index.js"(exports) {
      "use strict";
      exports.byteLength = byteLength;
      exports.toByteArray = toByteArray;
      exports.fromByteArray = fromByteArray;
      var lookup = [];
      var revLookup = [];
      var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }
      var i;
      var len;
      revLookup["-".charCodeAt(0)] = 62;
      revLookup["_".charCodeAt(0)] = 63;
      function getLens(b64) {
        var len2 = b64.length;
        if (len2 % 4 > 0) {
          throw new Error("Invalid string. Length must be a multiple of 4");
        }
        var validLen = b64.indexOf("=");
        if (validLen === -1) validLen = len2;
        var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
        return [validLen, placeHoldersLen];
      }
      function byteLength(b64) {
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function _byteLength(b64, validLen, placeHoldersLen) {
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function toByteArray(b64) {
        var tmp;
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
        var curByte = 0;
        var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
        var i2;
        for (i2 = 0; i2 < len2; i2 += 4) {
          tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
          arr[curByte++] = tmp >> 16 & 255;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 2) {
          tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 1) {
          tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        return arr;
      }
      function tripletToBase64(num) {
        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
      }
      function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];
        for (var i2 = start; i2 < end; i2 += 3) {
          tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
          output.push(tripletToBase64(tmp));
        }
        return output.join("");
      }
      function fromByteArray(uint8) {
        var tmp;
        var len2 = uint8.length;
        var extraBytes = len2 % 3;
        var parts = [];
        var maxChunkLength = 16383;
        for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
          parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
        }
        if (extraBytes === 1) {
          tmp = uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
          );
        } else if (extraBytes === 2) {
          tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
          );
        }
        return parts.join("");
      }
    }
  });

  // node_modules/ieee754/index.js
  var require_ieee754 = __commonJS({
    "node_modules/ieee754/index.js"(exports) {
      exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };
      exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
        }
        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
        }
        buffer[offset + i - d] |= s * 128;
      };
    }
  });

  // node_modules/buffer/index.js
  var require_buffer = __commonJS({
    "node_modules/buffer/index.js"(exports) {
      "use strict";
      var base64 = require_base64_js();
      var ieee754 = require_ieee754();
      var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
      exports.Buffer = Buffer2;
      exports.SlowBuffer = SlowBuffer;
      exports.INSPECT_MAX_BYTES = 50;
      var K_MAX_LENGTH = 2147483647;
      exports.kMaxLength = K_MAX_LENGTH;
      Buffer2.TYPED_ARRAY_SUPPORT = typedArraySupport();
      if (!Buffer2.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
        );
      }
      function typedArraySupport() {
        try {
          const arr = new Uint8Array(1);
          const proto = { foo: function() {
            return 42;
          } };
          Object.setPrototypeOf(proto, Uint8Array.prototype);
          Object.setPrototypeOf(arr, proto);
          return arr.foo() === 42;
        } catch (e) {
          return false;
        }
      }
      Object.defineProperty(Buffer2.prototype, "parent", {
        enumerable: true,
        get: function() {
          if (!Buffer2.isBuffer(this)) return void 0;
          return this.buffer;
        }
      });
      Object.defineProperty(Buffer2.prototype, "offset", {
        enumerable: true,
        get: function() {
          if (!Buffer2.isBuffer(this)) return void 0;
          return this.byteOffset;
        }
      });
      function createBuffer(length) {
        if (length > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length + '" is invalid for option "size"');
        }
        const buf = new Uint8Array(length);
        Object.setPrototypeOf(buf, Buffer2.prototype);
        return buf;
      }
      function Buffer2(arg, encodingOrOffset, length) {
        if (typeof arg === "number") {
          if (typeof encodingOrOffset === "string") {
            throw new TypeError(
              'The "string" argument must be of type string. Received type number'
            );
          }
          return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
      }
      Buffer2.poolSize = 8192;
      function from(value, encodingOrOffset, length) {
        if (typeof value === "string") {
          return fromString(value, encodingOrOffset);
        }
        if (ArrayBuffer.isView(value)) {
          return fromArrayView(value);
        }
        if (value == null) {
          throw new TypeError(
            "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
          );
        }
        if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof value === "number") {
          throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
          );
        }
        const valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value) {
          return Buffer2.from(valueOf, encodingOrOffset, length);
        }
        const b = fromObject(value);
        if (b) return b;
        if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
          return Buffer2.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
        }
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      Buffer2.from = function(value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
      };
      Object.setPrototypeOf(Buffer2.prototype, Uint8Array.prototype);
      Object.setPrototypeOf(Buffer2, Uint8Array);
      function assertSize(size) {
        if (typeof size !== "number") {
          throw new TypeError('"size" argument must be of type number');
        } else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
      }
      function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
          return createBuffer(size);
        }
        if (fill !== void 0) {
          return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
        }
        return createBuffer(size);
      }
      Buffer2.alloc = function(size, fill, encoding) {
        return alloc(size, fill, encoding);
      };
      function allocUnsafe(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
      }
      Buffer2.allocUnsafe = function(size) {
        return allocUnsafe(size);
      };
      Buffer2.allocUnsafeSlow = function(size) {
        return allocUnsafe(size);
      };
      function fromString(string, encoding) {
        if (typeof encoding !== "string" || encoding === "") {
          encoding = "utf8";
        }
        if (!Buffer2.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        const length = byteLength(string, encoding) | 0;
        let buf = createBuffer(length);
        const actual = buf.write(string, encoding);
        if (actual !== length) {
          buf = buf.slice(0, actual);
        }
        return buf;
      }
      function fromArrayLike(array) {
        const length = array.length < 0 ? 0 : checked(array.length) | 0;
        const buf = createBuffer(length);
        for (let i = 0; i < length; i += 1) {
          buf[i] = array[i] & 255;
        }
        return buf;
      }
      function fromArrayView(arrayView) {
        if (isInstance(arrayView, Uint8Array)) {
          const copy = new Uint8Array(arrayView);
          return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
        }
        return fromArrayLike(arrayView);
      }
      function fromArrayBuffer(array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds');
        }
        if (array.byteLength < byteOffset + (length || 0)) {
          throw new RangeError('"length" is outside of buffer bounds');
        }
        let buf;
        if (byteOffset === void 0 && length === void 0) {
          buf = new Uint8Array(array);
        } else if (length === void 0) {
          buf = new Uint8Array(array, byteOffset);
        } else {
          buf = new Uint8Array(array, byteOffset, length);
        }
        Object.setPrototypeOf(buf, Buffer2.prototype);
        return buf;
      }
      function fromObject(obj) {
        if (Buffer2.isBuffer(obj)) {
          const len = checked(obj.length) | 0;
          const buf = createBuffer(len);
          if (buf.length === 0) {
            return buf;
          }
          obj.copy(buf, 0, 0, len);
          return buf;
        }
        if (obj.length !== void 0) {
          if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
            return createBuffer(0);
          }
          return fromArrayLike(obj);
        }
        if (obj.type === "Buffer" && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data);
        }
      }
      function checked(length) {
        if (length >= K_MAX_LENGTH) {
          throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        }
        return length | 0;
      }
      function SlowBuffer(length) {
        if (+length != length) {
          length = 0;
        }
        return Buffer2.alloc(+length);
      }
      Buffer2.isBuffer = function isBuffer(b) {
        return b != null && b._isBuffer === true && b !== Buffer2.prototype;
      };
      Buffer2.compare = function compare(a, b) {
        if (isInstance(a, Uint8Array)) a = Buffer2.from(a, a.offset, a.byteLength);
        if (isInstance(b, Uint8Array)) b = Buffer2.from(b, b.offset, b.byteLength);
        if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
          throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
          );
        }
        if (a === b) return 0;
        let x = a.length;
        let y = b.length;
        for (let i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      Buffer2.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "latin1":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return true;
          default:
            return false;
        }
      };
      Buffer2.concat = function concat(list, length) {
        if (!Array.isArray(list)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        }
        if (list.length === 0) {
          return Buffer2.alloc(0);
        }
        let i;
        if (length === void 0) {
          length = 0;
          for (i = 0; i < list.length; ++i) {
            length += list[i].length;
          }
        }
        const buffer = Buffer2.allocUnsafe(length);
        let pos = 0;
        for (i = 0; i < list.length; ++i) {
          let buf = list[i];
          if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
              if (!Buffer2.isBuffer(buf)) buf = Buffer2.from(buf);
              buf.copy(buffer, pos);
            } else {
              Uint8Array.prototype.set.call(
                buffer,
                buf,
                pos
              );
            }
          } else if (!Buffer2.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
          } else {
            buf.copy(buffer, pos);
          }
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string, encoding) {
        if (Buffer2.isBuffer(string)) {
          return string.length;
        }
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
          return string.byteLength;
        }
        if (typeof string !== "string") {
          throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
          );
        }
        const len = string.length;
        const mustMatch = arguments.length > 2 && arguments[2] === true;
        if (!mustMatch && len === 0) return 0;
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "ascii":
            case "latin1":
            case "binary":
              return len;
            case "utf8":
            case "utf-8":
              return utf8ToBytes(string).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return len * 2;
            case "hex":
              return len >>> 1;
            case "base64":
              return base64ToBytes(string).length;
            default:
              if (loweredCase) {
                return mustMatch ? -1 : utf8ToBytes(string).length;
              }
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer2.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        let loweredCase = false;
        if (start === void 0 || start < 0) {
          start = 0;
        }
        if (start > this.length) {
          return "";
        }
        if (end === void 0 || end > this.length) {
          end = this.length;
        }
        if (end <= 0) {
          return "";
        }
        end >>>= 0;
        start >>>= 0;
        if (end <= start) {
          return "";
        }
        if (!encoding) encoding = "utf8";
        while (true) {
          switch (encoding) {
            case "hex":
              return hexSlice(this, start, end);
            case "utf8":
            case "utf-8":
              return utf8Slice(this, start, end);
            case "ascii":
              return asciiSlice(this, start, end);
            case "latin1":
            case "binary":
              return latin1Slice(this, start, end);
            case "base64":
              return base64Slice(this, start, end);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return utf16leSlice(this, start, end);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = (encoding + "").toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer2.prototype._isBuffer = true;
      function swap(b, n, m) {
        const i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer2.prototype.swap16 = function swap16() {
        const len = this.length;
        if (len % 2 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 16-bits");
        }
        for (let i = 0; i < len; i += 2) {
          swap(this, i, i + 1);
        }
        return this;
      };
      Buffer2.prototype.swap32 = function swap32() {
        const len = this.length;
        if (len % 4 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 32-bits");
        }
        for (let i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer2.prototype.swap64 = function swap64() {
        const len = this.length;
        if (len % 8 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 64-bits");
        }
        for (let i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer2.prototype.toString = function toString() {
        const length = this.length;
        if (length === 0) return "";
        if (arguments.length === 0) return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
      };
      Buffer2.prototype.toLocaleString = Buffer2.prototype.toString;
      Buffer2.prototype.equals = function equals(b) {
        if (!Buffer2.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return Buffer2.compare(this, b) === 0;
      };
      Buffer2.prototype.inspect = function inspect() {
        let str = "";
        const max = exports.INSPECT_MAX_BYTES;
        str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
        if (this.length > max) str += " ... ";
        return "<Buffer " + str + ">";
      };
      if (customInspectSymbol) {
        Buffer2.prototype[customInspectSymbol] = Buffer2.prototype.inspect;
      }
      Buffer2.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer2.from(target, target.offset, target.byteLength);
        }
        if (!Buffer2.isBuffer(target)) {
          throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
          );
        }
        if (start === void 0) {
          start = 0;
        }
        if (end === void 0) {
          end = target ? target.length : 0;
        }
        if (thisStart === void 0) {
          thisStart = 0;
        }
        if (thisEnd === void 0) {
          thisEnd = this.length;
        }
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError("out of range index");
        }
        if (thisStart >= thisEnd && start >= end) {
          return 0;
        }
        if (thisStart >= thisEnd) {
          return -1;
        }
        if (start >= end) {
          return 1;
        }
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target) return 0;
        let x = thisEnd - thisStart;
        let y = end - start;
        const len = Math.min(x, y);
        const thisCopy = this.slice(thisStart, thisEnd);
        const targetCopy = target.slice(start, end);
        for (let i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (buffer.length === 0) return -1;
        if (typeof byteOffset === "string") {
          encoding = byteOffset;
          byteOffset = 0;
        } else if (byteOffset > 2147483647) {
          byteOffset = 2147483647;
        } else if (byteOffset < -2147483648) {
          byteOffset = -2147483648;
        }
        byteOffset = +byteOffset;
        if (numberIsNaN(byteOffset)) {
          byteOffset = dir ? 0 : buffer.length - 1;
        }
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
          if (dir) return -1;
          else byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (dir) byteOffset = 0;
          else return -1;
        }
        if (typeof val === "string") {
          val = Buffer2.from(val, encoding);
        }
        if (Buffer2.isBuffer(val)) {
          if (val.length === 0) {
            return -1;
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        } else if (typeof val === "number") {
          val = val & 255;
          if (typeof Uint8Array.prototype.indexOf === "function") {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
          }
          return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        let indexSize = 1;
        let arrLength = arr.length;
        let valLength = val.length;
        if (encoding !== void 0) {
          encoding = String(encoding).toLowerCase();
          if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
            if (arr.length < 2 || val.length < 2) {
              return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read(buf, i2) {
          if (indexSize === 1) {
            return buf[i2];
          } else {
            return buf.readUInt16BE(i2 * indexSize);
          }
        }
        let i;
        if (dir) {
          let foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) {
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1) foundIndex = i;
              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
              if (foundIndex !== -1) i -= i - foundIndex;
              foundIndex = -1;
            }
          }
        } else {
          if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
          for (i = byteOffset; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < valLength; j++) {
              if (read(arr, i + j) !== read(val, j)) {
                found = false;
                break;
              }
            }
            if (found) return i;
          }
        }
        return -1;
      }
      Buffer2.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer2.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer2.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        const remaining = buf.length - offset;
        if (!length) {
          length = remaining;
        } else {
          length = Number(length);
          if (length > remaining) {
            length = remaining;
          }
        }
        const strLen = string.length;
        if (length > strLen / 2) {
          length = strLen / 2;
        }
        let i;
        for (i = 0; i < length; ++i) {
          const parsed = parseInt(string.substr(i * 2, 2), 16);
          if (numberIsNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
      }
      Buffer2.prototype.write = function write(string, offset, length, encoding) {
        if (offset === void 0) {
          encoding = "utf8";
          length = this.length;
          offset = 0;
        } else if (length === void 0 && typeof offset === "string") {
          encoding = offset;
          length = this.length;
          offset = 0;
        } else if (isFinite(offset)) {
          offset = offset >>> 0;
          if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === void 0) encoding = "utf8";
          } else {
            encoding = length;
            length = void 0;
          }
        } else {
          throw new Error(
            "Buffer.write(string, encoding, offset[, length]) is no longer supported"
          );
        }
        const remaining = this.length - offset;
        if (length === void 0 || length > remaining) length = remaining;
        if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
          throw new RangeError("Attempt to write outside buffer bounds");
        }
        if (!encoding) encoding = "utf8";
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "hex":
              return hexWrite(this, string, offset, length);
            case "utf8":
            case "utf-8":
              return utf8Write(this, string, offset, length);
            case "ascii":
            case "latin1":
            case "binary":
              return asciiWrite(this, string, offset, length);
            case "base64":
              return base64Write(this, string, offset, length);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return ucs2Write(this, string, offset, length);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      };
      Buffer2.prototype.toJSON = function toJSON() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
          return base64.fromByteArray(buf);
        } else {
          return base64.fromByteArray(buf.slice(start, end));
        }
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        const res = [];
        let i = start;
        while (i < end) {
          const firstByte = buf[i];
          let codePoint = null;
          let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 128) {
                  codePoint = firstByte;
                }
                break;
              case 2:
                secondByte = buf[i + 1];
                if ((secondByte & 192) === 128) {
                  tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                  if (tempCodePoint > 127) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 3:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 4:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                fourthByte = buf[i + 3];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                    codePoint = tempCodePoint;
                  }
                }
            }
          }
          if (codePoint === null) {
            codePoint = 65533;
            bytesPerSequence = 1;
          } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | codePoint & 1023;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
      var MAX_ARGUMENTS_LENGTH = 4096;
      function decodeCodePointsArray(codePoints) {
        const len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints);
        }
        let res = "";
        let i = 0;
        while (i < len) {
          res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
          );
        }
        return res;
      }
      function asciiSlice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 127);
        }
        return ret;
      }
      function latin1Slice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i]);
        }
        return ret;
      }
      function hexSlice(buf, start, end) {
        const len = buf.length;
        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;
        let out = "";
        for (let i = start; i < end; ++i) {
          out += hexSliceLookupTable[buf[i]];
        }
        return out;
      }
      function utf16leSlice(buf, start, end) {
        const bytes = buf.slice(start, end);
        let res = "";
        for (let i = 0; i < bytes.length - 1; i += 2) {
          res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
        }
        return res;
      }
      Buffer2.prototype.slice = function slice(start, end) {
        const len = this.length;
        start = ~~start;
        end = end === void 0 ? len : ~~end;
        if (start < 0) {
          start += len;
          if (start < 0) start = 0;
        } else if (start > len) {
          start = len;
        }
        if (end < 0) {
          end += len;
          if (end < 0) end = 0;
        } else if (end > len) {
          end = len;
        }
        if (end < start) end = start;
        const newBuf = this.subarray(start, end);
        Object.setPrototypeOf(newBuf, Buffer2.prototype);
        return newBuf;
      };
      function checkOffset(offset, ext, length) {
        if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
      }
      Buffer2.prototype.readUintLE = Buffer2.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        return val;
      };
      Buffer2.prototype.readUintBE = Buffer2.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          checkOffset(offset, byteLength2, this.length);
        }
        let val = this[offset + --byteLength2];
        let mul = 1;
        while (byteLength2 > 0 && (mul *= 256)) {
          val += this[offset + --byteLength2] * mul;
        }
        return val;
      };
      Buffer2.prototype.readUint8 = Buffer2.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer2.prototype.readUint16LE = Buffer2.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | this[offset + 1] << 8;
      };
      Buffer2.prototype.readUint16BE = Buffer2.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] << 8 | this[offset + 1];
      };
      Buffer2.prototype.readUint32LE = Buffer2.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
      };
      Buffer2.prototype.readUint32BE = Buffer2.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      };
      Buffer2.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
        const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
        return BigInt(lo) + (BigInt(hi) << BigInt(32));
      });
      Buffer2.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
        return (BigInt(hi) << BigInt(32)) + BigInt(lo);
      });
      Buffer2.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer2.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let i = byteLength2;
        let mul = 1;
        let val = this[offset + --i];
        while (i > 0 && (mul *= 256)) {
          val += this[offset + --i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer2.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        if (!(this[offset] & 128)) return this[offset];
        return (255 - this[offset] + 1) * -1;
      };
      Buffer2.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset] | this[offset + 1] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer2.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset + 1] | this[offset] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer2.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      };
      Buffer2.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      };
      Buffer2.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
        return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
      });
      Buffer2.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = (first << 24) + // Overflow
        this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
      });
      Buffer2.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer2.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer2.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer2.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer2.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      Buffer2.prototype.writeUintLE = Buffer2.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let mul = 1;
        let i = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeUintBE = Buffer2.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeUint8 = Buffer2.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer2.prototype.writeUint16LE = Buffer2.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer2.prototype.writeUint16BE = Buffer2.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer2.prototype.writeUint32LE = Buffer2.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset + 3] = value >>> 24;
        this[offset + 2] = value >>> 16;
        this[offset + 1] = value >>> 8;
        this[offset] = value & 255;
        return offset + 4;
      };
      Buffer2.prototype.writeUint32BE = Buffer2.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      function wrtBigUInt64LE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        return offset;
      }
      function wrtBigUInt64BE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset + 7] = lo;
        lo = lo >> 8;
        buf[offset + 6] = lo;
        lo = lo >> 8;
        buf[offset + 5] = lo;
        lo = lo >> 8;
        buf[offset + 4] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset + 3] = hi;
        hi = hi >> 8;
        buf[offset + 2] = hi;
        hi = hi >> 8;
        buf[offset + 1] = hi;
        hi = hi >> 8;
        buf[offset] = hi;
        return offset + 8;
      }
      Buffer2.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer2.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer2.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = 0;
        let mul = 1;
        let sub = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        let sub = 0;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
        if (value < 0) value = 255 + value + 1;
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer2.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer2.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer2.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        this[offset + 2] = value >>> 16;
        this[offset + 3] = value >>> 24;
        return offset + 4;
      };
      Buffer2.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        if (value < 0) value = 4294967295 + value + 1;
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      Buffer2.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      Buffer2.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer2.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer2.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer2.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer2.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer2.prototype.copy = function copy(target, targetStart, start, end) {
        if (!Buffer2.isBuffer(target)) throw new TypeError("argument should be a Buffer");
        if (!start) start = 0;
        if (!end && end !== 0) end = this.length;
        if (targetStart >= target.length) targetStart = target.length;
        if (!targetStart) targetStart = 0;
        if (end > 0 && end < start) end = start;
        if (end === start) return 0;
        if (target.length === 0 || this.length === 0) return 0;
        if (targetStart < 0) {
          throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start;
        }
        const len = end - start;
        if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
          this.copyWithin(targetStart, start, end);
        } else {
          Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
          );
        }
        return len;
      };
      Buffer2.prototype.fill = function fill(val, start, end, encoding) {
        if (typeof val === "string") {
          if (typeof start === "string") {
            encoding = start;
            start = 0;
            end = this.length;
          } else if (typeof end === "string") {
            encoding = end;
            end = this.length;
          }
          if (encoding !== void 0 && typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
          }
          if (typeof encoding === "string" && !Buffer2.isEncoding(encoding)) {
            throw new TypeError("Unknown encoding: " + encoding);
          }
          if (val.length === 1) {
            const code = val.charCodeAt(0);
            if (encoding === "utf8" && code < 128 || encoding === "latin1") {
              val = code;
            }
          }
        } else if (typeof val === "number") {
          val = val & 255;
        } else if (typeof val === "boolean") {
          val = Number(val);
        }
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError("Out of range index");
        }
        if (end <= start) {
          return this;
        }
        start = start >>> 0;
        end = end === void 0 ? this.length : end >>> 0;
        if (!val) val = 0;
        let i;
        if (typeof val === "number") {
          for (i = start; i < end; ++i) {
            this[i] = val;
          }
        } else {
          const bytes = Buffer2.isBuffer(val) ? val : Buffer2.from(val, encoding);
          const len = bytes.length;
          if (len === 0) {
            throw new TypeError('The value "' + val + '" is invalid for argument "value"');
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
          }
        }
        return this;
      };
      var errors = {};
      function E(sym, getMessage, Base) {
        errors[sym] = class NodeError extends Base {
          constructor() {
            super();
            Object.defineProperty(this, "message", {
              value: getMessage.apply(this, arguments),
              writable: true,
              configurable: true
            });
            this.name = `${this.name} [${sym}]`;
            this.stack;
            delete this.name;
          }
          get code() {
            return sym;
          }
          set code(value) {
            Object.defineProperty(this, "code", {
              configurable: true,
              enumerable: true,
              value,
              writable: true
            });
          }
          toString() {
            return `${this.name} [${sym}]: ${this.message}`;
          }
        };
      }
      E(
        "ERR_BUFFER_OUT_OF_BOUNDS",
        function(name) {
          if (name) {
            return `${name} is outside of buffer bounds`;
          }
          return "Attempt to access memory outside buffer bounds";
        },
        RangeError
      );
      E(
        "ERR_INVALID_ARG_TYPE",
        function(name, actual) {
          return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
        },
        TypeError
      );
      E(
        "ERR_OUT_OF_RANGE",
        function(str, range, input) {
          let msg = `The value of "${str}" is out of range.`;
          let received = input;
          if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
          } else if (typeof input === "bigint") {
            received = String(input);
            if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
              received = addNumericalSeparator(received);
            }
            received += "n";
          }
          msg += ` It must be ${range}. Received ${received}`;
          return msg;
        },
        RangeError
      );
      function addNumericalSeparator(val) {
        let res = "";
        let i = val.length;
        const start = val[0] === "-" ? 1 : 0;
        for (; i >= start + 4; i -= 3) {
          res = `_${val.slice(i - 3, i)}${res}`;
        }
        return `${val.slice(0, i)}${res}`;
      }
      function checkBounds(buf, offset, byteLength2) {
        validateNumber(offset, "offset");
        if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
          boundsError(offset, buf.length - (byteLength2 + 1));
        }
      }
      function checkIntBI(value, min, max, buf, offset, byteLength2) {
        if (value > max || value < min) {
          const n = typeof min === "bigint" ? "n" : "";
          let range;
          if (byteLength2 > 3) {
            if (min === 0 || min === BigInt(0)) {
              range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
            } else {
              range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
            }
          } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
          }
          throw new errors.ERR_OUT_OF_RANGE("value", range, value);
        }
        checkBounds(buf, offset, byteLength2);
      }
      function validateNumber(value, name) {
        if (typeof value !== "number") {
          throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
        }
      }
      function boundsError(value, length, type) {
        if (Math.floor(value) !== value) {
          validateNumber(value, type);
          throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
        }
        if (length < 0) {
          throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
        }
        throw new errors.ERR_OUT_OF_RANGE(
          type || "offset",
          `>= ${type ? 1 : 0} and <= ${length}`,
          value
        );
      }
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function base64clean(str) {
        str = str.split("=")[0];
        str = str.trim().replace(INVALID_BASE64_RE, "");
        if (str.length < 2) return "";
        while (str.length % 4 !== 0) {
          str = str + "=";
        }
        return str;
      }
      function utf8ToBytes(string, units) {
        units = units || Infinity;
        let codePoint;
        const length = string.length;
        let leadSurrogate = null;
        const bytes = [];
        for (let i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i);
          if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              } else if (i + 1 === length) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              leadSurrogate = codePoint;
              continue;
            }
            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
          } else if (leadSurrogate) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
          }
          leadSurrogate = null;
          if (codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(
              codePoint >> 6 | 192,
              codePoint & 63 | 128
            );
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(
              codePoint >> 12 | 224,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else if (codePoint < 1114112) {
            if ((units -= 4) < 0) break;
            bytes.push(
              codePoint >> 18 | 240,
              codePoint >> 12 & 63 | 128,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else {
            throw new Error("Invalid code point");
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          byteArray.push(str.charCodeAt(i) & 255);
        }
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        let c, hi, lo;
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes(str) {
        return base64.toByteArray(base64clean(str));
      }
      function blitBuffer(src, dst, offset, length) {
        let i;
        for (i = 0; i < length; ++i) {
          if (i + offset >= dst.length || i >= src.length) break;
          dst[i + offset] = src[i];
        }
        return i;
      }
      function isInstance(obj, type) {
        return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
      }
      function numberIsNaN(obj) {
        return obj !== obj;
      }
      var hexSliceLookupTable = (function() {
        const alphabet = "0123456789abcdef";
        const table = new Array(256);
        for (let i = 0; i < 16; ++i) {
          const i16 = i * 16;
          for (let j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet[i] + alphabet[j];
          }
        }
        return table;
      })();
      function defineBigIntMethod(fn) {
        return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
      }
      function BufferBigIntNotDefined() {
        throw new Error("BigInt not supported");
      }
    }
  });

  // node_modules/readable-stream/lib/ours/primordials.js
  var require_primordials = __commonJS({
    "node_modules/readable-stream/lib/ours/primordials.js"(exports, module) {
      "use strict";
      var AggregateError = class extends Error {
        constructor(errors) {
          if (!Array.isArray(errors)) {
            throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
          }
          let message = "";
          for (let i = 0; i < errors.length; i++) {
            message += `    ${errors[i].stack}
`;
          }
          super(message);
          this.name = "AggregateError";
          this.errors = errors;
        }
      };
      module.exports = {
        AggregateError,
        ArrayIsArray(self2) {
          return Array.isArray(self2);
        },
        ArrayPrototypeIncludes(self2, el) {
          return self2.includes(el);
        },
        ArrayPrototypeIndexOf(self2, el) {
          return self2.indexOf(el);
        },
        ArrayPrototypeJoin(self2, sep) {
          return self2.join(sep);
        },
        ArrayPrototypeMap(self2, fn) {
          return self2.map(fn);
        },
        ArrayPrototypePop(self2, el) {
          return self2.pop(el);
        },
        ArrayPrototypePush(self2, el) {
          return self2.push(el);
        },
        ArrayPrototypeSlice(self2, start, end) {
          return self2.slice(start, end);
        },
        Error,
        FunctionPrototypeCall(fn, thisArgs, ...args) {
          return fn.call(thisArgs, ...args);
        },
        FunctionPrototypeSymbolHasInstance(self2, instance) {
          return Function.prototype[Symbol.hasInstance].call(self2, instance);
        },
        MathFloor: Math.floor,
        Number,
        NumberIsInteger: Number.isInteger,
        NumberIsNaN: Number.isNaN,
        NumberMAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
        NumberMIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
        NumberParseInt: Number.parseInt,
        ObjectDefineProperties(self2, props) {
          return Object.defineProperties(self2, props);
        },
        ObjectDefineProperty(self2, name, prop) {
          return Object.defineProperty(self2, name, prop);
        },
        ObjectGetOwnPropertyDescriptor(self2, name) {
          return Object.getOwnPropertyDescriptor(self2, name);
        },
        ObjectKeys(obj) {
          return Object.keys(obj);
        },
        ObjectSetPrototypeOf(target, proto) {
          return Object.setPrototypeOf(target, proto);
        },
        Promise,
        PromisePrototypeCatch(self2, fn) {
          return self2.catch(fn);
        },
        PromisePrototypeThen(self2, thenFn, catchFn) {
          return self2.then(thenFn, catchFn);
        },
        PromiseReject(err) {
          return Promise.reject(err);
        },
        PromiseResolve(val) {
          return Promise.resolve(val);
        },
        ReflectApply: Reflect.apply,
        RegExpPrototypeTest(self2, value) {
          return self2.test(value);
        },
        SafeSet: Set,
        String,
        StringPrototypeSlice(self2, start, end) {
          return self2.slice(start, end);
        },
        StringPrototypeToLowerCase(self2) {
          return self2.toLowerCase();
        },
        StringPrototypeToUpperCase(self2) {
          return self2.toUpperCase();
        },
        StringPrototypeTrim(self2) {
          return self2.trim();
        },
        Symbol,
        SymbolFor: Symbol.for,
        SymbolAsyncIterator: Symbol.asyncIterator,
        SymbolHasInstance: Symbol.hasInstance,
        SymbolIterator: Symbol.iterator,
        SymbolDispose: Symbol.dispose || /* @__PURE__ */ Symbol("Symbol.dispose"),
        SymbolAsyncDispose: Symbol.asyncDispose || /* @__PURE__ */ Symbol("Symbol.asyncDispose"),
        TypedArrayPrototypeSet(self2, buf, len) {
          return self2.set(buf, len);
        },
        Boolean,
        Uint8Array
      };
    }
  });

  // node_modules/readable-stream/lib/ours/util/inspect.js
  var require_inspect = __commonJS({
    "node_modules/readable-stream/lib/ours/util/inspect.js"(exports, module) {
      "use strict";
      module.exports = {
        format(format, ...args) {
          return format.replace(/%([sdifj])/g, function(...[_unused, type]) {
            const replacement = args.shift();
            if (type === "f") {
              return replacement.toFixed(6);
            } else if (type === "j") {
              return JSON.stringify(replacement);
            } else if (type === "s" && typeof replacement === "object") {
              const ctor = replacement.constructor !== Object ? replacement.constructor.name : "";
              return `${ctor} {}`.trim();
            } else {
              return replacement.toString();
            }
          });
        },
        inspect(value) {
          switch (typeof value) {
            case "string":
              if (value.includes("'")) {
                if (!value.includes('"')) {
                  return `"${value}"`;
                } else if (!value.includes("`") && !value.includes("${")) {
                  return `\`${value}\``;
                }
              }
              return `'${value}'`;
            case "number":
              if (isNaN(value)) {
                return "NaN";
              } else if (Object.is(value, -0)) {
                return String(value);
              }
              return value;
            case "bigint":
              return `${String(value)}n`;
            case "boolean":
            case "undefined":
              return String(value);
            case "object":
              return "{}";
          }
        }
      };
    }
  });

  // node_modules/readable-stream/lib/ours/errors.js
  var require_errors = __commonJS({
    "node_modules/readable-stream/lib/ours/errors.js"(exports, module) {
      "use strict";
      var { format, inspect } = require_inspect();
      var { AggregateError: CustomAggregateError } = require_primordials();
      var AggregateError = globalThis.AggregateError || CustomAggregateError;
      var kIsNodeError = /* @__PURE__ */ Symbol("kIsNodeError");
      var kTypes = [
        "string",
        "function",
        "number",
        "object",
        // Accept 'Function' and 'Object' as alternative to the lower cased version.
        "Function",
        "Object",
        "boolean",
        "bigint",
        "symbol"
      ];
      var classRegExp = /^([A-Z][a-z0-9]*)+$/;
      var nodeInternalPrefix = "__node_internal_";
      var codes = {};
      function assert(value, message) {
        if (!value) {
          throw new codes.ERR_INTERNAL_ASSERTION(message);
        }
      }
      function addNumericalSeparator(val) {
        let res = "";
        let i = val.length;
        const start = val[0] === "-" ? 1 : 0;
        for (; i >= start + 4; i -= 3) {
          res = `_${val.slice(i - 3, i)}${res}`;
        }
        return `${val.slice(0, i)}${res}`;
      }
      function getMessage(key, msg, args) {
        if (typeof msg === "function") {
          assert(
            msg.length <= args.length,
            // Default options do not count.
            `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${msg.length}).`
          );
          return msg(...args);
        }
        const expectedLength = (msg.match(/%[dfijoOs]/g) || []).length;
        assert(
          expectedLength === args.length,
          `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${expectedLength}).`
        );
        if (args.length === 0) {
          return msg;
        }
        return format(msg, ...args);
      }
      function E(code, message, Base) {
        if (!Base) {
          Base = Error;
        }
        class NodeError extends Base {
          constructor(...args) {
            super(getMessage(code, message, args));
          }
          toString() {
            return `${this.name} [${code}]: ${this.message}`;
          }
        }
        Object.defineProperties(NodeError.prototype, {
          name: {
            value: Base.name,
            writable: true,
            enumerable: false,
            configurable: true
          },
          toString: {
            value() {
              return `${this.name} [${code}]: ${this.message}`;
            },
            writable: true,
            enumerable: false,
            configurable: true
          }
        });
        NodeError.prototype.code = code;
        NodeError.prototype[kIsNodeError] = true;
        codes[code] = NodeError;
      }
      function hideStackFrames(fn) {
        const hidden = nodeInternalPrefix + fn.name;
        Object.defineProperty(fn, "name", {
          value: hidden
        });
        return fn;
      }
      function aggregateTwoErrors(innerError, outerError) {
        if (innerError && outerError && innerError !== outerError) {
          if (Array.isArray(outerError.errors)) {
            outerError.errors.push(innerError);
            return outerError;
          }
          const err = new AggregateError([outerError, innerError], outerError.message);
          err.code = outerError.code;
          return err;
        }
        return innerError || outerError;
      }
      var AbortError = class extends Error {
        constructor(message = "The operation was aborted", options = void 0) {
          if (options !== void 0 && typeof options !== "object") {
            throw new codes.ERR_INVALID_ARG_TYPE("options", "Object", options);
          }
          super(message, options);
          this.code = "ABORT_ERR";
          this.name = "AbortError";
        }
      };
      E("ERR_ASSERTION", "%s", Error);
      E(
        "ERR_INVALID_ARG_TYPE",
        (name, expected, actual) => {
          assert(typeof name === "string", "'name' must be a string");
          if (!Array.isArray(expected)) {
            expected = [expected];
          }
          let msg = "The ";
          if (name.endsWith(" argument")) {
            msg += `${name} `;
          } else {
            msg += `"${name}" ${name.includes(".") ? "property" : "argument"} `;
          }
          msg += "must be ";
          const types = [];
          const instances = [];
          const other = [];
          for (const value of expected) {
            assert(typeof value === "string", "All expected entries have to be of type string");
            if (kTypes.includes(value)) {
              types.push(value.toLowerCase());
            } else if (classRegExp.test(value)) {
              instances.push(value);
            } else {
              assert(value !== "object", 'The value "object" should be written as "Object"');
              other.push(value);
            }
          }
          if (instances.length > 0) {
            const pos = types.indexOf("object");
            if (pos !== -1) {
              types.splice(types, pos, 1);
              instances.push("Object");
            }
          }
          if (types.length > 0) {
            switch (types.length) {
              case 1:
                msg += `of type ${types[0]}`;
                break;
              case 2:
                msg += `one of type ${types[0]} or ${types[1]}`;
                break;
              default: {
                const last = types.pop();
                msg += `one of type ${types.join(", ")}, or ${last}`;
              }
            }
            if (instances.length > 0 || other.length > 0) {
              msg += " or ";
            }
          }
          if (instances.length > 0) {
            switch (instances.length) {
              case 1:
                msg += `an instance of ${instances[0]}`;
                break;
              case 2:
                msg += `an instance of ${instances[0]} or ${instances[1]}`;
                break;
              default: {
                const last = instances.pop();
                msg += `an instance of ${instances.join(", ")}, or ${last}`;
              }
            }
            if (other.length > 0) {
              msg += " or ";
            }
          }
          switch (other.length) {
            case 0:
              break;
            case 1:
              if (other[0].toLowerCase() !== other[0]) {
                msg += "an ";
              }
              msg += `${other[0]}`;
              break;
            case 2:
              msg += `one of ${other[0]} or ${other[1]}`;
              break;
            default: {
              const last = other.pop();
              msg += `one of ${other.join(", ")}, or ${last}`;
            }
          }
          if (actual == null) {
            msg += `. Received ${actual}`;
          } else if (typeof actual === "function" && actual.name) {
            msg += `. Received function ${actual.name}`;
          } else if (typeof actual === "object") {
            var _actual$constructor;
            if ((_actual$constructor = actual.constructor) !== null && _actual$constructor !== void 0 && _actual$constructor.name) {
              msg += `. Received an instance of ${actual.constructor.name}`;
            } else {
              const inspected = inspect(actual, {
                depth: -1
              });
              msg += `. Received ${inspected}`;
            }
          } else {
            let inspected = inspect(actual, {
              colors: false
            });
            if (inspected.length > 25) {
              inspected = `${inspected.slice(0, 25)}...`;
            }
            msg += `. Received type ${typeof actual} (${inspected})`;
          }
          return msg;
        },
        TypeError
      );
      E(
        "ERR_INVALID_ARG_VALUE",
        (name, value, reason = "is invalid") => {
          let inspected = inspect(value);
          if (inspected.length > 128) {
            inspected = inspected.slice(0, 128) + "...";
          }
          const type = name.includes(".") ? "property" : "argument";
          return `The ${type} '${name}' ${reason}. Received ${inspected}`;
        },
        TypeError
      );
      E(
        "ERR_INVALID_RETURN_VALUE",
        (input, name, value) => {
          var _value$constructor;
          const type = value !== null && value !== void 0 && (_value$constructor = value.constructor) !== null && _value$constructor !== void 0 && _value$constructor.name ? `instance of ${value.constructor.name}` : `type ${typeof value}`;
          return `Expected ${input} to be returned from the "${name}" function but got ${type}.`;
        },
        TypeError
      );
      E(
        "ERR_MISSING_ARGS",
        (...args) => {
          assert(args.length > 0, "At least one arg needs to be specified");
          let msg;
          const len = args.length;
          args = (Array.isArray(args) ? args : [args]).map((a) => `"${a}"`).join(" or ");
          switch (len) {
            case 1:
              msg += `The ${args[0]} argument`;
              break;
            case 2:
              msg += `The ${args[0]} and ${args[1]} arguments`;
              break;
            default:
              {
                const last = args.pop();
                msg += `The ${args.join(", ")}, and ${last} arguments`;
              }
              break;
          }
          return `${msg} must be specified`;
        },
        TypeError
      );
      E(
        "ERR_OUT_OF_RANGE",
        (str, range, input) => {
          assert(range, 'Missing "range" argument');
          let received;
          if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
          } else if (typeof input === "bigint") {
            received = String(input);
            const limit = BigInt(2) ** BigInt(32);
            if (input > limit || input < -limit) {
              received = addNumericalSeparator(received);
            }
            received += "n";
          } else {
            received = inspect(input);
          }
          return `The value of "${str}" is out of range. It must be ${range}. Received ${received}`;
        },
        RangeError
      );
      E("ERR_MULTIPLE_CALLBACK", "Callback called multiple times", Error);
      E("ERR_METHOD_NOT_IMPLEMENTED", "The %s method is not implemented", Error);
      E("ERR_STREAM_ALREADY_FINISHED", "Cannot call %s after a stream was finished", Error);
      E("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable", Error);
      E("ERR_STREAM_DESTROYED", "Cannot call %s after a stream was destroyed", Error);
      E("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
      E("ERR_STREAM_PREMATURE_CLOSE", "Premature close", Error);
      E("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF", Error);
      E("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event", Error);
      E("ERR_STREAM_WRITE_AFTER_END", "write after end", Error);
      E("ERR_UNKNOWN_ENCODING", "Unknown encoding: %s", TypeError);
      module.exports = {
        AbortError,
        aggregateTwoErrors: hideStackFrames(aggregateTwoErrors),
        hideStackFrames,
        codes
      };
    }
  });

  // node_modules/event-target-shim/dist/event-target-shim.js
  var require_event_target_shim = __commonJS({
    "node_modules/event-target-shim/dist/event-target-shim.js"(exports, module) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var privateData = /* @__PURE__ */ new WeakMap();
      var wrappers = /* @__PURE__ */ new WeakMap();
      function pd(event) {
        const retv = privateData.get(event);
        console.assert(
          retv != null,
          "'this' is expected an Event object, but got",
          event
        );
        return retv;
      }
      function setCancelFlag(data) {
        if (data.passiveListener != null) {
          if (typeof console !== "undefined" && typeof console.error === "function") {
            console.error(
              "Unable to preventDefault inside passive event listener invocation.",
              data.passiveListener
            );
          }
          return;
        }
        if (!data.event.cancelable) {
          return;
        }
        data.canceled = true;
        if (typeof data.event.preventDefault === "function") {
          data.event.preventDefault();
        }
      }
      function Event(eventTarget, event) {
        privateData.set(this, {
          eventTarget,
          event,
          eventPhase: 2,
          currentTarget: eventTarget,
          canceled: false,
          stopped: false,
          immediateStopped: false,
          passiveListener: null,
          timeStamp: event.timeStamp || Date.now()
        });
        Object.defineProperty(this, "isTrusted", { value: false, enumerable: true });
        const keys = Object.keys(event);
        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i];
          if (!(key in this)) {
            Object.defineProperty(this, key, defineRedirectDescriptor(key));
          }
        }
      }
      Event.prototype = {
        /**
         * The type of this event.
         * @type {string}
         */
        get type() {
          return pd(this).event.type;
        },
        /**
         * The target of this event.
         * @type {EventTarget}
         */
        get target() {
          return pd(this).eventTarget;
        },
        /**
         * The target of this event.
         * @type {EventTarget}
         */
        get currentTarget() {
          return pd(this).currentTarget;
        },
        /**
         * @returns {EventTarget[]} The composed path of this event.
         */
        composedPath() {
          const currentTarget = pd(this).currentTarget;
          if (currentTarget == null) {
            return [];
          }
          return [currentTarget];
        },
        /**
         * Constant of NONE.
         * @type {number}
         */
        get NONE() {
          return 0;
        },
        /**
         * Constant of CAPTURING_PHASE.
         * @type {number}
         */
        get CAPTURING_PHASE() {
          return 1;
        },
        /**
         * Constant of AT_TARGET.
         * @type {number}
         */
        get AT_TARGET() {
          return 2;
        },
        /**
         * Constant of BUBBLING_PHASE.
         * @type {number}
         */
        get BUBBLING_PHASE() {
          return 3;
        },
        /**
         * The target of this event.
         * @type {number}
         */
        get eventPhase() {
          return pd(this).eventPhase;
        },
        /**
         * Stop event bubbling.
         * @returns {void}
         */
        stopPropagation() {
          const data = pd(this);
          data.stopped = true;
          if (typeof data.event.stopPropagation === "function") {
            data.event.stopPropagation();
          }
        },
        /**
         * Stop event bubbling.
         * @returns {void}
         */
        stopImmediatePropagation() {
          const data = pd(this);
          data.stopped = true;
          data.immediateStopped = true;
          if (typeof data.event.stopImmediatePropagation === "function") {
            data.event.stopImmediatePropagation();
          }
        },
        /**
         * The flag to be bubbling.
         * @type {boolean}
         */
        get bubbles() {
          return Boolean(pd(this).event.bubbles);
        },
        /**
         * The flag to be cancelable.
         * @type {boolean}
         */
        get cancelable() {
          return Boolean(pd(this).event.cancelable);
        },
        /**
         * Cancel this event.
         * @returns {void}
         */
        preventDefault() {
          setCancelFlag(pd(this));
        },
        /**
         * The flag to indicate cancellation state.
         * @type {boolean}
         */
        get defaultPrevented() {
          return pd(this).canceled;
        },
        /**
         * The flag to be composed.
         * @type {boolean}
         */
        get composed() {
          return Boolean(pd(this).event.composed);
        },
        /**
         * The unix time of this event.
         * @type {number}
         */
        get timeStamp() {
          return pd(this).timeStamp;
        },
        /**
         * The target of this event.
         * @type {EventTarget}
         * @deprecated
         */
        get srcElement() {
          return pd(this).eventTarget;
        },
        /**
         * The flag to stop event bubbling.
         * @type {boolean}
         * @deprecated
         */
        get cancelBubble() {
          return pd(this).stopped;
        },
        set cancelBubble(value) {
          if (!value) {
            return;
          }
          const data = pd(this);
          data.stopped = true;
          if (typeof data.event.cancelBubble === "boolean") {
            data.event.cancelBubble = true;
          }
        },
        /**
         * The flag to indicate cancellation state.
         * @type {boolean}
         * @deprecated
         */
        get returnValue() {
          return !pd(this).canceled;
        },
        set returnValue(value) {
          if (!value) {
            setCancelFlag(pd(this));
          }
        },
        /**
         * Initialize this event object. But do nothing under event dispatching.
         * @param {string} type The event type.
         * @param {boolean} [bubbles=false] The flag to be possible to bubble up.
         * @param {boolean} [cancelable=false] The flag to be possible to cancel.
         * @deprecated
         */
        initEvent() {
        }
      };
      Object.defineProperty(Event.prototype, "constructor", {
        value: Event,
        configurable: true,
        writable: true
      });
      if (typeof window !== "undefined" && typeof window.Event !== "undefined") {
        Object.setPrototypeOf(Event.prototype, window.Event.prototype);
        wrappers.set(window.Event.prototype, Event);
      }
      function defineRedirectDescriptor(key) {
        return {
          get() {
            return pd(this).event[key];
          },
          set(value) {
            pd(this).event[key] = value;
          },
          configurable: true,
          enumerable: true
        };
      }
      function defineCallDescriptor(key) {
        return {
          value() {
            const event = pd(this).event;
            return event[key].apply(event, arguments);
          },
          configurable: true,
          enumerable: true
        };
      }
      function defineWrapper(BaseEvent, proto) {
        const keys = Object.keys(proto);
        if (keys.length === 0) {
          return BaseEvent;
        }
        function CustomEvent(eventTarget, event) {
          BaseEvent.call(this, eventTarget, event);
        }
        CustomEvent.prototype = Object.create(BaseEvent.prototype, {
          constructor: { value: CustomEvent, configurable: true, writable: true }
        });
        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i];
          if (!(key in BaseEvent.prototype)) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, key);
            const isFunc = typeof descriptor.value === "function";
            Object.defineProperty(
              CustomEvent.prototype,
              key,
              isFunc ? defineCallDescriptor(key) : defineRedirectDescriptor(key)
            );
          }
        }
        return CustomEvent;
      }
      function getWrapper(proto) {
        if (proto == null || proto === Object.prototype) {
          return Event;
        }
        let wrapper = wrappers.get(proto);
        if (wrapper == null) {
          wrapper = defineWrapper(getWrapper(Object.getPrototypeOf(proto)), proto);
          wrappers.set(proto, wrapper);
        }
        return wrapper;
      }
      function wrapEvent(eventTarget, event) {
        const Wrapper = getWrapper(Object.getPrototypeOf(event));
        return new Wrapper(eventTarget, event);
      }
      function isStopped(event) {
        return pd(event).immediateStopped;
      }
      function setEventPhase(event, eventPhase) {
        pd(event).eventPhase = eventPhase;
      }
      function setCurrentTarget(event, currentTarget) {
        pd(event).currentTarget = currentTarget;
      }
      function setPassiveListener(event, passiveListener) {
        pd(event).passiveListener = passiveListener;
      }
      var listenersMap = /* @__PURE__ */ new WeakMap();
      var CAPTURE = 1;
      var BUBBLE = 2;
      var ATTRIBUTE = 3;
      function isObject(x) {
        return x !== null && typeof x === "object";
      }
      function getListeners(eventTarget) {
        const listeners = listenersMap.get(eventTarget);
        if (listeners == null) {
          throw new TypeError(
            "'this' is expected an EventTarget object, but got another value."
          );
        }
        return listeners;
      }
      function defineEventAttributeDescriptor(eventName) {
        return {
          get() {
            const listeners = getListeners(this);
            let node = listeners.get(eventName);
            while (node != null) {
              if (node.listenerType === ATTRIBUTE) {
                return node.listener;
              }
              node = node.next;
            }
            return null;
          },
          set(listener) {
            if (typeof listener !== "function" && !isObject(listener)) {
              listener = null;
            }
            const listeners = getListeners(this);
            let prev = null;
            let node = listeners.get(eventName);
            while (node != null) {
              if (node.listenerType === ATTRIBUTE) {
                if (prev !== null) {
                  prev.next = node.next;
                } else if (node.next !== null) {
                  listeners.set(eventName, node.next);
                } else {
                  listeners.delete(eventName);
                }
              } else {
                prev = node;
              }
              node = node.next;
            }
            if (listener !== null) {
              const newNode = {
                listener,
                listenerType: ATTRIBUTE,
                passive: false,
                once: false,
                next: null
              };
              if (prev === null) {
                listeners.set(eventName, newNode);
              } else {
                prev.next = newNode;
              }
            }
          },
          configurable: true,
          enumerable: true
        };
      }
      function defineEventAttribute(eventTargetPrototype, eventName) {
        Object.defineProperty(
          eventTargetPrototype,
          `on${eventName}`,
          defineEventAttributeDescriptor(eventName)
        );
      }
      function defineCustomEventTarget(eventNames) {
        function CustomEventTarget() {
          EventTarget.call(this);
        }
        CustomEventTarget.prototype = Object.create(EventTarget.prototype, {
          constructor: {
            value: CustomEventTarget,
            configurable: true,
            writable: true
          }
        });
        for (let i = 0; i < eventNames.length; ++i) {
          defineEventAttribute(CustomEventTarget.prototype, eventNames[i]);
        }
        return CustomEventTarget;
      }
      function EventTarget() {
        if (this instanceof EventTarget) {
          listenersMap.set(this, /* @__PURE__ */ new Map());
          return;
        }
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
          return defineCustomEventTarget(arguments[0]);
        }
        if (arguments.length > 0) {
          const types = new Array(arguments.length);
          for (let i = 0; i < arguments.length; ++i) {
            types[i] = arguments[i];
          }
          return defineCustomEventTarget(types);
        }
        throw new TypeError("Cannot call a class as a function");
      }
      EventTarget.prototype = {
        /**
         * Add a given listener to this event target.
         * @param {string} eventName The event name to add.
         * @param {Function} listener The listener to add.
         * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
         * @returns {void}
         */
        addEventListener(eventName, listener, options) {
          if (listener == null) {
            return;
          }
          if (typeof listener !== "function" && !isObject(listener)) {
            throw new TypeError("'listener' should be a function or an object.");
          }
          const listeners = getListeners(this);
          const optionsIsObj = isObject(options);
          const capture = optionsIsObj ? Boolean(options.capture) : Boolean(options);
          const listenerType = capture ? CAPTURE : BUBBLE;
          const newNode = {
            listener,
            listenerType,
            passive: optionsIsObj && Boolean(options.passive),
            once: optionsIsObj && Boolean(options.once),
            next: null
          };
          let node = listeners.get(eventName);
          if (node === void 0) {
            listeners.set(eventName, newNode);
            return;
          }
          let prev = null;
          while (node != null) {
            if (node.listener === listener && node.listenerType === listenerType) {
              return;
            }
            prev = node;
            node = node.next;
          }
          prev.next = newNode;
        },
        /**
         * Remove a given listener from this event target.
         * @param {string} eventName The event name to remove.
         * @param {Function} listener The listener to remove.
         * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
         * @returns {void}
         */
        removeEventListener(eventName, listener, options) {
          if (listener == null) {
            return;
          }
          const listeners = getListeners(this);
          const capture = isObject(options) ? Boolean(options.capture) : Boolean(options);
          const listenerType = capture ? CAPTURE : BUBBLE;
          let prev = null;
          let node = listeners.get(eventName);
          while (node != null) {
            if (node.listener === listener && node.listenerType === listenerType) {
              if (prev !== null) {
                prev.next = node.next;
              } else if (node.next !== null) {
                listeners.set(eventName, node.next);
              } else {
                listeners.delete(eventName);
              }
              return;
            }
            prev = node;
            node = node.next;
          }
        },
        /**
         * Dispatch a given event.
         * @param {Event|{type:string}} event The event to dispatch.
         * @returns {boolean} `false` if canceled.
         */
        dispatchEvent(event) {
          if (event == null || typeof event.type !== "string") {
            throw new TypeError('"event.type" should be a string.');
          }
          const listeners = getListeners(this);
          const eventName = event.type;
          let node = listeners.get(eventName);
          if (node == null) {
            return true;
          }
          const wrappedEvent = wrapEvent(this, event);
          let prev = null;
          while (node != null) {
            if (node.once) {
              if (prev !== null) {
                prev.next = node.next;
              } else if (node.next !== null) {
                listeners.set(eventName, node.next);
              } else {
                listeners.delete(eventName);
              }
            } else {
              prev = node;
            }
            setPassiveListener(
              wrappedEvent,
              node.passive ? node.listener : null
            );
            if (typeof node.listener === "function") {
              try {
                node.listener.call(this, wrappedEvent);
              } catch (err) {
                if (typeof console !== "undefined" && typeof console.error === "function") {
                  console.error(err);
                }
              }
            } else if (node.listenerType !== ATTRIBUTE && typeof node.listener.handleEvent === "function") {
              node.listener.handleEvent(wrappedEvent);
            }
            if (isStopped(wrappedEvent)) {
              break;
            }
            node = node.next;
          }
          setPassiveListener(wrappedEvent, null);
          setEventPhase(wrappedEvent, 0);
          setCurrentTarget(wrappedEvent, null);
          return !wrappedEvent.defaultPrevented;
        }
      };
      Object.defineProperty(EventTarget.prototype, "constructor", {
        value: EventTarget,
        configurable: true,
        writable: true
      });
      if (typeof window !== "undefined" && typeof window.EventTarget !== "undefined") {
        Object.setPrototypeOf(EventTarget.prototype, window.EventTarget.prototype);
      }
      exports.defineEventAttribute = defineEventAttribute;
      exports.EventTarget = EventTarget;
      exports.default = EventTarget;
      module.exports = EventTarget;
      module.exports.EventTarget = module.exports["default"] = EventTarget;
      module.exports.defineEventAttribute = defineEventAttribute;
    }
  });

  // node_modules/abort-controller/dist/abort-controller.js
  var require_abort_controller = __commonJS({
    "node_modules/abort-controller/dist/abort-controller.js"(exports, module) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var eventTargetShim = require_event_target_shim();
      var AbortSignal = class extends eventTargetShim.EventTarget {
        /**
         * AbortSignal cannot be constructed directly.
         */
        constructor() {
          super();
          throw new TypeError("AbortSignal cannot be constructed directly");
        }
        /**
         * Returns `true` if this `AbortSignal`'s `AbortController` has signaled to abort, and `false` otherwise.
         */
        get aborted() {
          const aborted = abortedFlags.get(this);
          if (typeof aborted !== "boolean") {
            throw new TypeError(`Expected 'this' to be an 'AbortSignal' object, but got ${this === null ? "null" : typeof this}`);
          }
          return aborted;
        }
      };
      eventTargetShim.defineEventAttribute(AbortSignal.prototype, "abort");
      function createAbortSignal() {
        const signal = Object.create(AbortSignal.prototype);
        eventTargetShim.EventTarget.call(signal);
        abortedFlags.set(signal, false);
        return signal;
      }
      function abortSignal(signal) {
        if (abortedFlags.get(signal) !== false) {
          return;
        }
        abortedFlags.set(signal, true);
        signal.dispatchEvent({ type: "abort" });
      }
      var abortedFlags = /* @__PURE__ */ new WeakMap();
      Object.defineProperties(AbortSignal.prototype, {
        aborted: { enumerable: true }
      });
      if (typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
          configurable: true,
          value: "AbortSignal"
        });
      }
      var AbortController2 = class {
        /**
         * Initialize this controller.
         */
        constructor() {
          signals.set(this, createAbortSignal());
        }
        /**
         * Returns the `AbortSignal` object associated with this object.
         */
        get signal() {
          return getSignal(this);
        }
        /**
         * Abort and signal to any observers that the associated activity is to be aborted.
         */
        abort() {
          abortSignal(getSignal(this));
        }
      };
      var signals = /* @__PURE__ */ new WeakMap();
      function getSignal(controller) {
        const signal = signals.get(controller);
        if (signal == null) {
          throw new TypeError(`Expected 'this' to be an 'AbortController' object, but got ${controller === null ? "null" : typeof controller}`);
        }
        return signal;
      }
      Object.defineProperties(AbortController2.prototype, {
        signal: { enumerable: true },
        abort: { enumerable: true }
      });
      if (typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(AbortController2.prototype, Symbol.toStringTag, {
          configurable: true,
          value: "AbortController"
        });
      }
      exports.AbortController = AbortController2;
      exports.AbortSignal = AbortSignal;
      exports.default = AbortController2;
      module.exports = AbortController2;
      module.exports.AbortController = module.exports["default"] = AbortController2;
      module.exports.AbortSignal = AbortSignal;
    }
  });

  // node_modules/events/events.js
  var require_events = __commonJS({
    "node_modules/events/events.js"(exports, module) {
      "use strict";
      var R = typeof Reflect === "object" ? Reflect : null;
      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      var ReflectOwnKeys;
      if (R && typeof R.ownKeys === "function") {
        ReflectOwnKeys = R.ownKeys;
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target);
        };
      }
      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }
      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
        return value !== value;
      };
      function EventEmitter() {
        EventEmitter.init.call(this);
      }
      module.exports = EventEmitter;
      module.exports.once = once;
      EventEmitter.EventEmitter = EventEmitter;
      EventEmitter.prototype._events = void 0;
      EventEmitter.prototype._eventsCount = 0;
      EventEmitter.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if (typeof listener !== "function") {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }
      Object.defineProperty(EventEmitter, "defaultMaxListeners", {
        enumerable: true,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          }
          defaultMaxListeners = arg;
        }
      });
      EventEmitter.init = function() {
        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        }
        this._maxListeners = this._maxListeners || void 0;
      };
      EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
        if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
        }
        this._maxListeners = n;
        return this;
      };
      function _getMaxListeners(that) {
        if (that._maxListeners === void 0)
          return EventEmitter.defaultMaxListeners;
        return that._maxListeners;
      }
      EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };
      EventEmitter.prototype.emit = function emit(type) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = type === "error";
        var events = this._events;
        if (events !== void 0)
          doError = doError && events.error === void 0;
        else if (!doError)
          return false;
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            throw er;
          }
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          err.context = er;
          throw err;
        }
        var handler = events[type];
        if (handler === void 0)
          return false;
        if (typeof handler === "function") {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i = 0; i < len; ++i)
            ReflectApply(listeners[i], this, args);
        }
        return true;
      };
      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;
        checkListener(listener);
        events = target._events;
        if (events === void 0) {
          events = target._events = /* @__PURE__ */ Object.create(null);
          target._eventsCount = 0;
        } else {
          if (events.newListener !== void 0) {
            target.emit(
              "newListener",
              type,
              listener.listener ? listener.listener : listener
            );
            events = target._events;
          }
          existing = events[type];
        }
        if (existing === void 0) {
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === "function") {
            existing = events[type] = prepend ? [listener, existing] : [existing, listener];
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            w.name = "MaxListenersExceededWarning";
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }
        return target;
      }
      EventEmitter.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };
      EventEmitter.prototype.on = EventEmitter.prototype.addListener;
      EventEmitter.prototype.prependListener = function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }
      function _onceWrap(target, type, listener) {
        var state = { fired: false, wrapFn: void 0, target, type, listener };
        var wrapped = onceWrapper.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped;
      }
      EventEmitter.prototype.once = function once2(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.removeListener = function removeListener(type, listener) {
        var list, events, position, i, originalListener;
        checkListener(listener);
        events = this._events;
        if (events === void 0)
          return this;
        list = events[type];
        if (list === void 0)
          return this;
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit("removeListener", type, list.listener || listener);
          }
        } else if (typeof list !== "function") {
          position = -1;
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
          if (position < 0)
            return this;
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
          if (list.length === 1)
            events[type] = list[0];
          if (events.removeListener !== void 0)
            this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      };
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
      EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
        var listeners, events, i;
        events = this._events;
        if (events === void 0)
          return this;
        if (events.removeListener === void 0) {
          if (arguments.length === 0) {
            this._events = /* @__PURE__ */ Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== void 0) {
            if (--this._eventsCount === 0)
              this._events = /* @__PURE__ */ Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
          return this;
        }
        listeners = events[type];
        if (typeof listeners === "function") {
          this.removeListener(type, listeners);
        } else if (listeners !== void 0) {
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
        return this;
      };
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (events === void 0)
          return [];
        var evlistener = events[type];
        if (evlistener === void 0)
          return [];
        if (typeof evlistener === "function")
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      EventEmitter.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };
      EventEmitter.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };
      EventEmitter.listenerCount = function(emitter, type) {
        if (typeof emitter.listenerCount === "function") {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };
      EventEmitter.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;
        if (events !== void 0) {
          var evlistener = events[type];
          if (typeof evlistener === "function") {
            return 1;
          } else if (evlistener !== void 0) {
            return evlistener.length;
          }
        }
        return 0;
      }
      EventEmitter.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
      function arrayClone(arr, n) {
        var copy = new Array(n);
        for (var i = 0; i < n; ++i)
          copy[i] = arr[i];
        return copy;
      }
      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }
      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i = 0; i < ret.length; ++i) {
          ret[i] = arr[i].listener || arr[i];
        }
        return ret;
      }
      function once(emitter, name) {
        return new Promise(function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
          }
          function resolver() {
            if (typeof emitter.removeListener === "function") {
              emitter.removeListener("error", errorListener);
            }
            resolve([].slice.call(arguments));
          }
          ;
          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
          if (name !== "error") {
            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
          }
        });
      }
      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
        if (typeof emitter.on === "function") {
          eventTargetAgnosticAddListener(emitter, "error", handler, flags);
        }
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if (typeof emitter.on === "function") {
          if (flags.once) {
            emitter.once(name, listener);
          } else {
            emitter.on(name, listener);
          }
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(name, function wrapListener(arg) {
            if (flags.once) {
              emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
          });
        } else {
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
        }
      }
    }
  });

  // node_modules/readable-stream/lib/ours/util.js
  var require_util = __commonJS({
    "node_modules/readable-stream/lib/ours/util.js"(exports, module) {
      "use strict";
      var bufferModule = require_buffer();
      var { format, inspect } = require_inspect();
      var {
        codes: { ERR_INVALID_ARG_TYPE }
      } = require_errors();
      var { kResistStopPropagation, AggregateError, SymbolDispose } = require_primordials();
      var AbortSignal = globalThis.AbortSignal || require_abort_controller().AbortSignal;
      var AbortController2 = globalThis.AbortController || require_abort_controller().AbortController;
      var AsyncFunction = Object.getPrototypeOf(async function() {
      }).constructor;
      var Blob2 = globalThis.Blob || bufferModule.Blob;
      var isBlob = typeof Blob2 !== "undefined" ? function isBlob2(b) {
        return b instanceof Blob2;
      } : function isBlob2(b) {
        return false;
      };
      var validateAbortSignal = (signal, name) => {
        if (signal !== void 0 && (signal === null || typeof signal !== "object" || !("aborted" in signal))) {
          throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
        }
      };
      var validateFunction = (value, name) => {
        if (typeof value !== "function") {
          throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
        }
      };
      module.exports = {
        AggregateError,
        kEmptyObject: Object.freeze({}),
        once(callback) {
          let called = false;
          return function(...args) {
            if (called) {
              return;
            }
            called = true;
            callback.apply(this, args);
          };
        },
        createDeferredPromise: function() {
          let resolve;
          let reject;
          const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
          });
          return {
            promise,
            resolve,
            reject
          };
        },
        promisify(fn) {
          return new Promise((resolve, reject) => {
            fn((err, ...args) => {
              if (err) {
                return reject(err);
              }
              return resolve(...args);
            });
          });
        },
        debuglog() {
          return function() {
          };
        },
        format,
        inspect,
        types: {
          isAsyncFunction(fn) {
            return fn instanceof AsyncFunction;
          },
          isArrayBufferView(arr) {
            return ArrayBuffer.isView(arr);
          }
        },
        isBlob,
        deprecate(fn, message) {
          return fn;
        },
        addAbortListener: require_events().addAbortListener || function addAbortListener(signal, listener) {
          if (signal === void 0) {
            throw new ERR_INVALID_ARG_TYPE("signal", "AbortSignal", signal);
          }
          validateAbortSignal(signal, "signal");
          validateFunction(listener, "listener");
          let removeEventListener;
          if (signal.aborted) {
            queueMicrotask(() => listener());
          } else {
            signal.addEventListener("abort", listener, {
              __proto__: null,
              once: true,
              [kResistStopPropagation]: true
            });
            removeEventListener = () => {
              signal.removeEventListener("abort", listener);
            };
          }
          return {
            __proto__: null,
            [SymbolDispose]() {
              var _removeEventListener;
              (_removeEventListener = removeEventListener) === null || _removeEventListener === void 0 ? void 0 : _removeEventListener();
            }
          };
        },
        AbortSignalAny: AbortSignal.any || function AbortSignalAny(signals) {
          if (signals.length === 1) {
            return signals[0];
          }
          const ac = new AbortController2();
          const abort = () => ac.abort();
          signals.forEach((signal) => {
            validateAbortSignal(signal, "signals");
            signal.addEventListener("abort", abort, {
              once: true
            });
          });
          ac.signal.addEventListener(
            "abort",
            () => {
              signals.forEach((signal) => signal.removeEventListener("abort", abort));
            },
            {
              once: true
            }
          );
          return ac.signal;
        }
      };
      module.exports.promisify.custom = /* @__PURE__ */ Symbol.for("nodejs.util.promisify.custom");
    }
  });

  // node_modules/readable-stream/lib/internal/validators.js
  var require_validators = __commonJS({
    "node_modules/readable-stream/lib/internal/validators.js"(exports, module) {
      "use strict";
      var {
        ArrayIsArray,
        ArrayPrototypeIncludes,
        ArrayPrototypeJoin,
        ArrayPrototypeMap,
        NumberIsInteger,
        NumberIsNaN,
        NumberMAX_SAFE_INTEGER,
        NumberMIN_SAFE_INTEGER,
        NumberParseInt,
        ObjectPrototypeHasOwnProperty,
        RegExpPrototypeExec,
        String: String2,
        StringPrototypeToUpperCase,
        StringPrototypeTrim
      } = require_primordials();
      var {
        hideStackFrames,
        codes: { ERR_SOCKET_BAD_PORT, ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE, ERR_OUT_OF_RANGE, ERR_UNKNOWN_SIGNAL }
      } = require_errors();
      var { normalizeEncoding } = require_util();
      var { isAsyncFunction, isArrayBufferView } = require_util().types;
      var signals = {};
      function isInt32(value) {
        return value === (value | 0);
      }
      function isUint32(value) {
        return value === value >>> 0;
      }
      var octalReg = /^[0-7]+$/;
      var modeDesc = "must be a 32-bit unsigned integer or an octal string";
      function parseFileMode(value, name, def) {
        if (typeof value === "undefined") {
          value = def;
        }
        if (typeof value === "string") {
          if (RegExpPrototypeExec(octalReg, value) === null) {
            throw new ERR_INVALID_ARG_VALUE(name, value, modeDesc);
          }
          value = NumberParseInt(value, 8);
        }
        validateUint32(value, name);
        return value;
      }
      var validateInteger = hideStackFrames((value, name, min = NumberMIN_SAFE_INTEGER, max = NumberMAX_SAFE_INTEGER) => {
        if (typeof value !== "number") throw new ERR_INVALID_ARG_TYPE(name, "number", value);
        if (!NumberIsInteger(value)) throw new ERR_OUT_OF_RANGE(name, "an integer", value);
        if (value < min || value > max) throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
      });
      var validateInt32 = hideStackFrames((value, name, min = -2147483648, max = 2147483647) => {
        if (typeof value !== "number") {
          throw new ERR_INVALID_ARG_TYPE(name, "number", value);
        }
        if (!NumberIsInteger(value)) {
          throw new ERR_OUT_OF_RANGE(name, "an integer", value);
        }
        if (value < min || value > max) {
          throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
        }
      });
      var validateUint32 = hideStackFrames((value, name, positive = false) => {
        if (typeof value !== "number") {
          throw new ERR_INVALID_ARG_TYPE(name, "number", value);
        }
        if (!NumberIsInteger(value)) {
          throw new ERR_OUT_OF_RANGE(name, "an integer", value);
        }
        const min = positive ? 1 : 0;
        const max = 4294967295;
        if (value < min || value > max) {
          throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
        }
      });
      function validateString(value, name) {
        if (typeof value !== "string") throw new ERR_INVALID_ARG_TYPE(name, "string", value);
      }
      function validateNumber(value, name, min = void 0, max) {
        if (typeof value !== "number") throw new ERR_INVALID_ARG_TYPE(name, "number", value);
        if (min != null && value < min || max != null && value > max || (min != null || max != null) && NumberIsNaN(value)) {
          throw new ERR_OUT_OF_RANGE(
            name,
            `${min != null ? `>= ${min}` : ""}${min != null && max != null ? " && " : ""}${max != null ? `<= ${max}` : ""}`,
            value
          );
        }
      }
      var validateOneOf = hideStackFrames((value, name, oneOf) => {
        if (!ArrayPrototypeIncludes(oneOf, value)) {
          const allowed = ArrayPrototypeJoin(
            ArrayPrototypeMap(oneOf, (v) => typeof v === "string" ? `'${v}'` : String2(v)),
            ", "
          );
          const reason = "must be one of: " + allowed;
          throw new ERR_INVALID_ARG_VALUE(name, value, reason);
        }
      });
      function validateBoolean(value, name) {
        if (typeof value !== "boolean") throw new ERR_INVALID_ARG_TYPE(name, "boolean", value);
      }
      function getOwnPropertyValueOrDefault(options, key, defaultValue) {
        return options == null || !ObjectPrototypeHasOwnProperty(options, key) ? defaultValue : options[key];
      }
      var validateObject = hideStackFrames((value, name, options = null) => {
        const allowArray = getOwnPropertyValueOrDefault(options, "allowArray", false);
        const allowFunction = getOwnPropertyValueOrDefault(options, "allowFunction", false);
        const nullable = getOwnPropertyValueOrDefault(options, "nullable", false);
        if (!nullable && value === null || !allowArray && ArrayIsArray(value) || typeof value !== "object" && (!allowFunction || typeof value !== "function")) {
          throw new ERR_INVALID_ARG_TYPE(name, "Object", value);
        }
      });
      var validateDictionary = hideStackFrames((value, name) => {
        if (value != null && typeof value !== "object" && typeof value !== "function") {
          throw new ERR_INVALID_ARG_TYPE(name, "a dictionary", value);
        }
      });
      var validateArray = hideStackFrames((value, name, minLength = 0) => {
        if (!ArrayIsArray(value)) {
          throw new ERR_INVALID_ARG_TYPE(name, "Array", value);
        }
        if (value.length < minLength) {
          const reason = `must be longer than ${minLength}`;
          throw new ERR_INVALID_ARG_VALUE(name, value, reason);
        }
      });
      function validateStringArray(value, name) {
        validateArray(value, name);
        for (let i = 0; i < value.length; i++) {
          validateString(value[i], `${name}[${i}]`);
        }
      }
      function validateBooleanArray(value, name) {
        validateArray(value, name);
        for (let i = 0; i < value.length; i++) {
          validateBoolean(value[i], `${name}[${i}]`);
        }
      }
      function validateAbortSignalArray(value, name) {
        validateArray(value, name);
        for (let i = 0; i < value.length; i++) {
          const signal = value[i];
          const indexedName = `${name}[${i}]`;
          if (signal == null) {
            throw new ERR_INVALID_ARG_TYPE(indexedName, "AbortSignal", signal);
          }
          validateAbortSignal(signal, indexedName);
        }
      }
      function validateSignalName(signal, name = "signal") {
        validateString(signal, name);
        if (signals[signal] === void 0) {
          if (signals[StringPrototypeToUpperCase(signal)] !== void 0) {
            throw new ERR_UNKNOWN_SIGNAL(signal + " (signals must use all capital letters)");
          }
          throw new ERR_UNKNOWN_SIGNAL(signal);
        }
      }
      var validateBuffer = hideStackFrames((buffer, name = "buffer") => {
        if (!isArrayBufferView(buffer)) {
          throw new ERR_INVALID_ARG_TYPE(name, ["Buffer", "TypedArray", "DataView"], buffer);
        }
      });
      function validateEncoding(data, encoding) {
        const normalizedEncoding = normalizeEncoding(encoding);
        const length = data.length;
        if (normalizedEncoding === "hex" && length % 2 !== 0) {
          throw new ERR_INVALID_ARG_VALUE("encoding", encoding, `is invalid for data of length ${length}`);
        }
      }
      function validatePort(port, name = "Port", allowZero = true) {
        if (typeof port !== "number" && typeof port !== "string" || typeof port === "string" && StringPrototypeTrim(port).length === 0 || +port !== +port >>> 0 || port > 65535 || port === 0 && !allowZero) {
          throw new ERR_SOCKET_BAD_PORT(name, port, allowZero);
        }
        return port | 0;
      }
      var validateAbortSignal = hideStackFrames((signal, name) => {
        if (signal !== void 0 && (signal === null || typeof signal !== "object" || !("aborted" in signal))) {
          throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
        }
      });
      var validateFunction = hideStackFrames((value, name) => {
        if (typeof value !== "function") throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
      });
      var validatePlainFunction = hideStackFrames((value, name) => {
        if (typeof value !== "function" || isAsyncFunction(value)) throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
      });
      var validateUndefined = hideStackFrames((value, name) => {
        if (value !== void 0) throw new ERR_INVALID_ARG_TYPE(name, "undefined", value);
      });
      function validateUnion(value, name, union) {
        if (!ArrayPrototypeIncludes(union, value)) {
          throw new ERR_INVALID_ARG_TYPE(name, `('${ArrayPrototypeJoin(union, "|")}')`, value);
        }
      }
      var linkValueRegExp = /^(?:<[^>]*>)(?:\s*;\s*[^;"\s]+(?:=(")?[^;"\s]*\1)?)*$/;
      function validateLinkHeaderFormat(value, name) {
        if (typeof value === "undefined" || !RegExpPrototypeExec(linkValueRegExp, value)) {
          throw new ERR_INVALID_ARG_VALUE(
            name,
            value,
            'must be an array or string of format "</styles.css>; rel=preload; as=style"'
          );
        }
      }
      function validateLinkHeaderValue(hints) {
        if (typeof hints === "string") {
          validateLinkHeaderFormat(hints, "hints");
          return hints;
        } else if (ArrayIsArray(hints)) {
          const hintsLength = hints.length;
          let result = "";
          if (hintsLength === 0) {
            return result;
          }
          for (let i = 0; i < hintsLength; i++) {
            const link = hints[i];
            validateLinkHeaderFormat(link, "hints");
            result += link;
            if (i !== hintsLength - 1) {
              result += ", ";
            }
          }
          return result;
        }
        throw new ERR_INVALID_ARG_VALUE(
          "hints",
          hints,
          'must be an array or string of format "</styles.css>; rel=preload; as=style"'
        );
      }
      module.exports = {
        isInt32,
        isUint32,
        parseFileMode,
        validateArray,
        validateStringArray,
        validateBooleanArray,
        validateAbortSignalArray,
        validateBoolean,
        validateBuffer,
        validateDictionary,
        validateEncoding,
        validateFunction,
        validateInt32,
        validateInteger,
        validateNumber,
        validateObject,
        validateOneOf,
        validatePlainFunction,
        validatePort,
        validateSignalName,
        validateString,
        validateUint32,
        validateUndefined,
        validateUnion,
        validateAbortSignal,
        validateLinkHeaderValue
      };
    }
  });

  // node_modules/process/index.js
  var require_process = __commonJS({
    "node_modules/process/index.js"(exports, module) {
      module.exports = global.process;
    }
  });

  // node_modules/readable-stream/lib/internal/streams/utils.js
  var require_utils = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/utils.js"(exports, module) {
      "use strict";
      var { SymbolAsyncIterator, SymbolIterator, SymbolFor } = require_primordials();
      var kIsDestroyed = SymbolFor("nodejs.stream.destroyed");
      var kIsErrored = SymbolFor("nodejs.stream.errored");
      var kIsReadable = SymbolFor("nodejs.stream.readable");
      var kIsWritable = SymbolFor("nodejs.stream.writable");
      var kIsDisturbed = SymbolFor("nodejs.stream.disturbed");
      var kIsClosedPromise = SymbolFor("nodejs.webstream.isClosedPromise");
      var kControllerErrorFunction = SymbolFor("nodejs.webstream.controllerErrorFunction");
      function isReadableNodeStream(obj, strict = false) {
        var _obj$_readableState;
        return !!(obj && typeof obj.pipe === "function" && typeof obj.on === "function" && (!strict || typeof obj.pause === "function" && typeof obj.resume === "function") && (!obj._writableState || ((_obj$_readableState = obj._readableState) === null || _obj$_readableState === void 0 ? void 0 : _obj$_readableState.readable) !== false) && // Duplex
        (!obj._writableState || obj._readableState));
      }
      function isWritableNodeStream(obj) {
        var _obj$_writableState;
        return !!(obj && typeof obj.write === "function" && typeof obj.on === "function" && (!obj._readableState || ((_obj$_writableState = obj._writableState) === null || _obj$_writableState === void 0 ? void 0 : _obj$_writableState.writable) !== false));
      }
      function isDuplexNodeStream(obj) {
        return !!(obj && typeof obj.pipe === "function" && obj._readableState && typeof obj.on === "function" && typeof obj.write === "function");
      }
      function isNodeStream(obj) {
        return obj && (obj._readableState || obj._writableState || typeof obj.write === "function" && typeof obj.on === "function" || typeof obj.pipe === "function" && typeof obj.on === "function");
      }
      function isReadableStream(obj) {
        return !!(obj && !isNodeStream(obj) && typeof obj.pipeThrough === "function" && typeof obj.getReader === "function" && typeof obj.cancel === "function");
      }
      function isWritableStream(obj) {
        return !!(obj && !isNodeStream(obj) && typeof obj.getWriter === "function" && typeof obj.abort === "function");
      }
      function isTransformStream(obj) {
        return !!(obj && !isNodeStream(obj) && typeof obj.readable === "object" && typeof obj.writable === "object");
      }
      function isWebStream(obj) {
        return isReadableStream(obj) || isWritableStream(obj) || isTransformStream(obj);
      }
      function isIterable(obj, isAsync) {
        if (obj == null) return false;
        if (isAsync === true) return typeof obj[SymbolAsyncIterator] === "function";
        if (isAsync === false) return typeof obj[SymbolIterator] === "function";
        return typeof obj[SymbolAsyncIterator] === "function" || typeof obj[SymbolIterator] === "function";
      }
      function isDestroyed(stream) {
        if (!isNodeStream(stream)) return null;
        const wState = stream._writableState;
        const rState = stream._readableState;
        const state = wState || rState;
        return !!(stream.destroyed || stream[kIsDestroyed] || state !== null && state !== void 0 && state.destroyed);
      }
      function isWritableEnded(stream) {
        if (!isWritableNodeStream(stream)) return null;
        if (stream.writableEnded === true) return true;
        const wState = stream._writableState;
        if (wState !== null && wState !== void 0 && wState.errored) return false;
        if (typeof (wState === null || wState === void 0 ? void 0 : wState.ended) !== "boolean") return null;
        return wState.ended;
      }
      function isWritableFinished(stream, strict) {
        if (!isWritableNodeStream(stream)) return null;
        if (stream.writableFinished === true) return true;
        const wState = stream._writableState;
        if (wState !== null && wState !== void 0 && wState.errored) return false;
        if (typeof (wState === null || wState === void 0 ? void 0 : wState.finished) !== "boolean") return null;
        return !!(wState.finished || strict === false && wState.ended === true && wState.length === 0);
      }
      function isReadableEnded(stream) {
        if (!isReadableNodeStream(stream)) return null;
        if (stream.readableEnded === true) return true;
        const rState = stream._readableState;
        if (!rState || rState.errored) return false;
        if (typeof (rState === null || rState === void 0 ? void 0 : rState.ended) !== "boolean") return null;
        return rState.ended;
      }
      function isReadableFinished(stream, strict) {
        if (!isReadableNodeStream(stream)) return null;
        const rState = stream._readableState;
        if (rState !== null && rState !== void 0 && rState.errored) return false;
        if (typeof (rState === null || rState === void 0 ? void 0 : rState.endEmitted) !== "boolean") return null;
        return !!(rState.endEmitted || strict === false && rState.ended === true && rState.length === 0);
      }
      function isReadable(stream) {
        if (stream && stream[kIsReadable] != null) return stream[kIsReadable];
        if (typeof (stream === null || stream === void 0 ? void 0 : stream.readable) !== "boolean") return null;
        if (isDestroyed(stream)) return false;
        return isReadableNodeStream(stream) && stream.readable && !isReadableFinished(stream);
      }
      function isWritable(stream) {
        if (stream && stream[kIsWritable] != null) return stream[kIsWritable];
        if (typeof (stream === null || stream === void 0 ? void 0 : stream.writable) !== "boolean") return null;
        if (isDestroyed(stream)) return false;
        return isWritableNodeStream(stream) && stream.writable && !isWritableEnded(stream);
      }
      function isFinished(stream, opts) {
        if (!isNodeStream(stream)) {
          return null;
        }
        if (isDestroyed(stream)) {
          return true;
        }
        if ((opts === null || opts === void 0 ? void 0 : opts.readable) !== false && isReadable(stream)) {
          return false;
        }
        if ((opts === null || opts === void 0 ? void 0 : opts.writable) !== false && isWritable(stream)) {
          return false;
        }
        return true;
      }
      function isWritableErrored(stream) {
        var _stream$_writableStat, _stream$_writableStat2;
        if (!isNodeStream(stream)) {
          return null;
        }
        if (stream.writableErrored) {
          return stream.writableErrored;
        }
        return (_stream$_writableStat = (_stream$_writableStat2 = stream._writableState) === null || _stream$_writableStat2 === void 0 ? void 0 : _stream$_writableStat2.errored) !== null && _stream$_writableStat !== void 0 ? _stream$_writableStat : null;
      }
      function isReadableErrored(stream) {
        var _stream$_readableStat, _stream$_readableStat2;
        if (!isNodeStream(stream)) {
          return null;
        }
        if (stream.readableErrored) {
          return stream.readableErrored;
        }
        return (_stream$_readableStat = (_stream$_readableStat2 = stream._readableState) === null || _stream$_readableStat2 === void 0 ? void 0 : _stream$_readableStat2.errored) !== null && _stream$_readableStat !== void 0 ? _stream$_readableStat : null;
      }
      function isClosed(stream) {
        if (!isNodeStream(stream)) {
          return null;
        }
        if (typeof stream.closed === "boolean") {
          return stream.closed;
        }
        const wState = stream._writableState;
        const rState = stream._readableState;
        if (typeof (wState === null || wState === void 0 ? void 0 : wState.closed) === "boolean" || typeof (rState === null || rState === void 0 ? void 0 : rState.closed) === "boolean") {
          return (wState === null || wState === void 0 ? void 0 : wState.closed) || (rState === null || rState === void 0 ? void 0 : rState.closed);
        }
        if (typeof stream._closed === "boolean" && isOutgoingMessage(stream)) {
          return stream._closed;
        }
        return null;
      }
      function isOutgoingMessage(stream) {
        return typeof stream._closed === "boolean" && typeof stream._defaultKeepAlive === "boolean" && typeof stream._removedConnection === "boolean" && typeof stream._removedContLen === "boolean";
      }
      function isServerResponse(stream) {
        return typeof stream._sent100 === "boolean" && isOutgoingMessage(stream);
      }
      function isServerRequest(stream) {
        var _stream$req;
        return typeof stream._consuming === "boolean" && typeof stream._dumped === "boolean" && ((_stream$req = stream.req) === null || _stream$req === void 0 ? void 0 : _stream$req.upgradeOrConnect) === void 0;
      }
      function willEmitClose(stream) {
        if (!isNodeStream(stream)) return null;
        const wState = stream._writableState;
        const rState = stream._readableState;
        const state = wState || rState;
        return !state && isServerResponse(stream) || !!(state && state.autoDestroy && state.emitClose && state.closed === false);
      }
      function isDisturbed(stream) {
        var _stream$kIsDisturbed;
        return !!(stream && ((_stream$kIsDisturbed = stream[kIsDisturbed]) !== null && _stream$kIsDisturbed !== void 0 ? _stream$kIsDisturbed : stream.readableDidRead || stream.readableAborted));
      }
      function isErrored(stream) {
        var _ref, _ref2, _ref3, _ref4, _ref5, _stream$kIsErrored, _stream$_readableStat3, _stream$_writableStat3, _stream$_readableStat4, _stream$_writableStat4;
        return !!(stream && ((_ref = (_ref2 = (_ref3 = (_ref4 = (_ref5 = (_stream$kIsErrored = stream[kIsErrored]) !== null && _stream$kIsErrored !== void 0 ? _stream$kIsErrored : stream.readableErrored) !== null && _ref5 !== void 0 ? _ref5 : stream.writableErrored) !== null && _ref4 !== void 0 ? _ref4 : (_stream$_readableStat3 = stream._readableState) === null || _stream$_readableStat3 === void 0 ? void 0 : _stream$_readableStat3.errorEmitted) !== null && _ref3 !== void 0 ? _ref3 : (_stream$_writableStat3 = stream._writableState) === null || _stream$_writableStat3 === void 0 ? void 0 : _stream$_writableStat3.errorEmitted) !== null && _ref2 !== void 0 ? _ref2 : (_stream$_readableStat4 = stream._readableState) === null || _stream$_readableStat4 === void 0 ? void 0 : _stream$_readableStat4.errored) !== null && _ref !== void 0 ? _ref : (_stream$_writableStat4 = stream._writableState) === null || _stream$_writableStat4 === void 0 ? void 0 : _stream$_writableStat4.errored));
      }
      module.exports = {
        isDestroyed,
        kIsDestroyed,
        isDisturbed,
        kIsDisturbed,
        isErrored,
        kIsErrored,
        isReadable,
        kIsReadable,
        kIsClosedPromise,
        kControllerErrorFunction,
        kIsWritable,
        isClosed,
        isDuplexNodeStream,
        isFinished,
        isIterable,
        isReadableNodeStream,
        isReadableStream,
        isReadableEnded,
        isReadableFinished,
        isReadableErrored,
        isNodeStream,
        isWebStream,
        isWritable,
        isWritableNodeStream,
        isWritableStream,
        isWritableEnded,
        isWritableFinished,
        isWritableErrored,
        isServerRequest,
        isServerResponse,
        willEmitClose,
        isTransformStream
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/end-of-stream.js
  var require_end_of_stream = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/end-of-stream.js"(exports, module) {
      "use strict";
      var process2 = require_process();
      var { AbortError, codes } = require_errors();
      var { ERR_INVALID_ARG_TYPE, ERR_STREAM_PREMATURE_CLOSE } = codes;
      var { kEmptyObject, once } = require_util();
      var { validateAbortSignal, validateFunction, validateObject, validateBoolean } = require_validators();
      var { Promise: Promise2, PromisePrototypeThen, SymbolDispose } = require_primordials();
      var {
        isClosed,
        isReadable,
        isReadableNodeStream,
        isReadableStream,
        isReadableFinished,
        isReadableErrored,
        isWritable,
        isWritableNodeStream,
        isWritableStream,
        isWritableFinished,
        isWritableErrored,
        isNodeStream,
        willEmitClose: _willEmitClose,
        kIsClosedPromise
      } = require_utils();
      var addAbortListener;
      function isRequest(stream) {
        return stream.setHeader && typeof stream.abort === "function";
      }
      var nop = () => {
      };
      function eos(stream, options, callback) {
        var _options$readable, _options$writable;
        if (arguments.length === 2) {
          callback = options;
          options = kEmptyObject;
        } else if (options == null) {
          options = kEmptyObject;
        } else {
          validateObject(options, "options");
        }
        validateFunction(callback, "callback");
        validateAbortSignal(options.signal, "options.signal");
        callback = once(callback);
        if (isReadableStream(stream) || isWritableStream(stream)) {
          return eosWeb(stream, options, callback);
        }
        if (!isNodeStream(stream)) {
          throw new ERR_INVALID_ARG_TYPE("stream", ["ReadableStream", "WritableStream", "Stream"], stream);
        }
        const readable = (_options$readable = options.readable) !== null && _options$readable !== void 0 ? _options$readable : isReadableNodeStream(stream);
        const writable = (_options$writable = options.writable) !== null && _options$writable !== void 0 ? _options$writable : isWritableNodeStream(stream);
        const wState = stream._writableState;
        const rState = stream._readableState;
        const onlegacyfinish = () => {
          if (!stream.writable) {
            onfinish();
          }
        };
        let willEmitClose = _willEmitClose(stream) && isReadableNodeStream(stream) === readable && isWritableNodeStream(stream) === writable;
        let writableFinished = isWritableFinished(stream, false);
        const onfinish = () => {
          writableFinished = true;
          if (stream.destroyed) {
            willEmitClose = false;
          }
          if (willEmitClose && (!stream.readable || readable)) {
            return;
          }
          if (!readable || readableFinished) {
            callback.call(stream);
          }
        };
        let readableFinished = isReadableFinished(stream, false);
        const onend = () => {
          readableFinished = true;
          if (stream.destroyed) {
            willEmitClose = false;
          }
          if (willEmitClose && (!stream.writable || writable)) {
            return;
          }
          if (!writable || writableFinished) {
            callback.call(stream);
          }
        };
        const onerror = (err) => {
          callback.call(stream, err);
        };
        let closed = isClosed(stream);
        const onclose = () => {
          closed = true;
          const errored = isWritableErrored(stream) || isReadableErrored(stream);
          if (errored && typeof errored !== "boolean") {
            return callback.call(stream, errored);
          }
          if (readable && !readableFinished && isReadableNodeStream(stream, true)) {
            if (!isReadableFinished(stream, false)) return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE());
          }
          if (writable && !writableFinished) {
            if (!isWritableFinished(stream, false)) return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE());
          }
          callback.call(stream);
        };
        const onclosed = () => {
          closed = true;
          const errored = isWritableErrored(stream) || isReadableErrored(stream);
          if (errored && typeof errored !== "boolean") {
            return callback.call(stream, errored);
          }
          callback.call(stream);
        };
        const onrequest = () => {
          stream.req.on("finish", onfinish);
        };
        if (isRequest(stream)) {
          stream.on("complete", onfinish);
          if (!willEmitClose) {
            stream.on("abort", onclose);
          }
          if (stream.req) {
            onrequest();
          } else {
            stream.on("request", onrequest);
          }
        } else if (writable && !wState) {
          stream.on("end", onlegacyfinish);
          stream.on("close", onlegacyfinish);
        }
        if (!willEmitClose && typeof stream.aborted === "boolean") {
          stream.on("aborted", onclose);
        }
        stream.on("end", onend);
        stream.on("finish", onfinish);
        if (options.error !== false) {
          stream.on("error", onerror);
        }
        stream.on("close", onclose);
        if (closed) {
          process2.nextTick(onclose);
        } else if (wState !== null && wState !== void 0 && wState.errorEmitted || rState !== null && rState !== void 0 && rState.errorEmitted) {
          if (!willEmitClose) {
            process2.nextTick(onclosed);
          }
        } else if (!readable && (!willEmitClose || isReadable(stream)) && (writableFinished || isWritable(stream) === false)) {
          process2.nextTick(onclosed);
        } else if (!writable && (!willEmitClose || isWritable(stream)) && (readableFinished || isReadable(stream) === false)) {
          process2.nextTick(onclosed);
        } else if (rState && stream.req && stream.aborted) {
          process2.nextTick(onclosed);
        }
        const cleanup = () => {
          callback = nop;
          stream.removeListener("aborted", onclose);
          stream.removeListener("complete", onfinish);
          stream.removeListener("abort", onclose);
          stream.removeListener("request", onrequest);
          if (stream.req) stream.req.removeListener("finish", onfinish);
          stream.removeListener("end", onlegacyfinish);
          stream.removeListener("close", onlegacyfinish);
          stream.removeListener("finish", onfinish);
          stream.removeListener("end", onend);
          stream.removeListener("error", onerror);
          stream.removeListener("close", onclose);
        };
        if (options.signal && !closed) {
          const abort = () => {
            const endCallback = callback;
            cleanup();
            endCallback.call(
              stream,
              new AbortError(void 0, {
                cause: options.signal.reason
              })
            );
          };
          if (options.signal.aborted) {
            process2.nextTick(abort);
          } else {
            addAbortListener = addAbortListener || require_util().addAbortListener;
            const disposable = addAbortListener(options.signal, abort);
            const originalCallback = callback;
            callback = once((...args) => {
              disposable[SymbolDispose]();
              originalCallback.apply(stream, args);
            });
          }
        }
        return cleanup;
      }
      function eosWeb(stream, options, callback) {
        let isAborted = false;
        let abort = nop;
        if (options.signal) {
          abort = () => {
            isAborted = true;
            callback.call(
              stream,
              new AbortError(void 0, {
                cause: options.signal.reason
              })
            );
          };
          if (options.signal.aborted) {
            process2.nextTick(abort);
          } else {
            addAbortListener = addAbortListener || require_util().addAbortListener;
            const disposable = addAbortListener(options.signal, abort);
            const originalCallback = callback;
            callback = once((...args) => {
              disposable[SymbolDispose]();
              originalCallback.apply(stream, args);
            });
          }
        }
        const resolverFn = (...args) => {
          if (!isAborted) {
            process2.nextTick(() => callback.apply(stream, args));
          }
        };
        PromisePrototypeThen(stream[kIsClosedPromise].promise, resolverFn, resolverFn);
        return nop;
      }
      function finished(stream, opts) {
        var _opts;
        let autoCleanup = false;
        if (opts === null) {
          opts = kEmptyObject;
        }
        if ((_opts = opts) !== null && _opts !== void 0 && _opts.cleanup) {
          validateBoolean(opts.cleanup, "cleanup");
          autoCleanup = opts.cleanup;
        }
        return new Promise2((resolve, reject) => {
          const cleanup = eos(stream, opts, (err) => {
            if (autoCleanup) {
              cleanup();
            }
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
      module.exports = eos;
      module.exports.finished = finished;
    }
  });

  // node_modules/readable-stream/lib/internal/streams/destroy.js
  var require_destroy = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/destroy.js"(exports, module) {
      "use strict";
      var process2 = require_process();
      var {
        aggregateTwoErrors,
        codes: { ERR_MULTIPLE_CALLBACK },
        AbortError
      } = require_errors();
      var { Symbol: Symbol2 } = require_primordials();
      var { kIsDestroyed, isDestroyed, isFinished, isServerRequest } = require_utils();
      var kDestroy = Symbol2("kDestroy");
      var kConstruct = Symbol2("kConstruct");
      function checkError(err, w, r) {
        if (err) {
          err.stack;
          if (w && !w.errored) {
            w.errored = err;
          }
          if (r && !r.errored) {
            r.errored = err;
          }
        }
      }
      function destroy(err, cb) {
        const r = this._readableState;
        const w = this._writableState;
        const s = w || r;
        if (w !== null && w !== void 0 && w.destroyed || r !== null && r !== void 0 && r.destroyed) {
          if (typeof cb === "function") {
            cb();
          }
          return this;
        }
        checkError(err, w, r);
        if (w) {
          w.destroyed = true;
        }
        if (r) {
          r.destroyed = true;
        }
        if (!s.constructed) {
          this.once(kDestroy, function(er) {
            _destroy(this, aggregateTwoErrors(er, err), cb);
          });
        } else {
          _destroy(this, err, cb);
        }
        return this;
      }
      function _destroy(self2, err, cb) {
        let called = false;
        function onDestroy(err2) {
          if (called) {
            return;
          }
          called = true;
          const r = self2._readableState;
          const w = self2._writableState;
          checkError(err2, w, r);
          if (w) {
            w.closed = true;
          }
          if (r) {
            r.closed = true;
          }
          if (typeof cb === "function") {
            cb(err2);
          }
          if (err2) {
            process2.nextTick(emitErrorCloseNT, self2, err2);
          } else {
            process2.nextTick(emitCloseNT, self2);
          }
        }
        try {
          self2._destroy(err || null, onDestroy);
        } catch (err2) {
          onDestroy(err2);
        }
      }
      function emitErrorCloseNT(self2, err) {
        emitErrorNT(self2, err);
        emitCloseNT(self2);
      }
      function emitCloseNT(self2) {
        const r = self2._readableState;
        const w = self2._writableState;
        if (w) {
          w.closeEmitted = true;
        }
        if (r) {
          r.closeEmitted = true;
        }
        if (w !== null && w !== void 0 && w.emitClose || r !== null && r !== void 0 && r.emitClose) {
          self2.emit("close");
        }
      }
      function emitErrorNT(self2, err) {
        const r = self2._readableState;
        const w = self2._writableState;
        if (w !== null && w !== void 0 && w.errorEmitted || r !== null && r !== void 0 && r.errorEmitted) {
          return;
        }
        if (w) {
          w.errorEmitted = true;
        }
        if (r) {
          r.errorEmitted = true;
        }
        self2.emit("error", err);
      }
      function undestroy() {
        const r = this._readableState;
        const w = this._writableState;
        if (r) {
          r.constructed = true;
          r.closed = false;
          r.closeEmitted = false;
          r.destroyed = false;
          r.errored = null;
          r.errorEmitted = false;
          r.reading = false;
          r.ended = r.readable === false;
          r.endEmitted = r.readable === false;
        }
        if (w) {
          w.constructed = true;
          w.destroyed = false;
          w.closed = false;
          w.closeEmitted = false;
          w.errored = null;
          w.errorEmitted = false;
          w.finalCalled = false;
          w.prefinished = false;
          w.ended = w.writable === false;
          w.ending = w.writable === false;
          w.finished = w.writable === false;
        }
      }
      function errorOrDestroy(stream, err, sync) {
        const r = stream._readableState;
        const w = stream._writableState;
        if (w !== null && w !== void 0 && w.destroyed || r !== null && r !== void 0 && r.destroyed) {
          return this;
        }
        if (r !== null && r !== void 0 && r.autoDestroy || w !== null && w !== void 0 && w.autoDestroy)
          stream.destroy(err);
        else if (err) {
          err.stack;
          if (w && !w.errored) {
            w.errored = err;
          }
          if (r && !r.errored) {
            r.errored = err;
          }
          if (sync) {
            process2.nextTick(emitErrorNT, stream, err);
          } else {
            emitErrorNT(stream, err);
          }
        }
      }
      function construct(stream, cb) {
        if (typeof stream._construct !== "function") {
          return;
        }
        const r = stream._readableState;
        const w = stream._writableState;
        if (r) {
          r.constructed = false;
        }
        if (w) {
          w.constructed = false;
        }
        stream.once(kConstruct, cb);
        if (stream.listenerCount(kConstruct) > 1) {
          return;
        }
        process2.nextTick(constructNT, stream);
      }
      function constructNT(stream) {
        let called = false;
        function onConstruct(err) {
          if (called) {
            errorOrDestroy(stream, err !== null && err !== void 0 ? err : new ERR_MULTIPLE_CALLBACK());
            return;
          }
          called = true;
          const r = stream._readableState;
          const w = stream._writableState;
          const s = w || r;
          if (r) {
            r.constructed = true;
          }
          if (w) {
            w.constructed = true;
          }
          if (s.destroyed) {
            stream.emit(kDestroy, err);
          } else if (err) {
            errorOrDestroy(stream, err, true);
          } else {
            process2.nextTick(emitConstructNT, stream);
          }
        }
        try {
          stream._construct((err) => {
            process2.nextTick(onConstruct, err);
          });
        } catch (err) {
          process2.nextTick(onConstruct, err);
        }
      }
      function emitConstructNT(stream) {
        stream.emit(kConstruct);
      }
      function isRequest(stream) {
        return (stream === null || stream === void 0 ? void 0 : stream.setHeader) && typeof stream.abort === "function";
      }
      function emitCloseLegacy(stream) {
        stream.emit("close");
      }
      function emitErrorCloseLegacy(stream, err) {
        stream.emit("error", err);
        process2.nextTick(emitCloseLegacy, stream);
      }
      function destroyer(stream, err) {
        if (!stream || isDestroyed(stream)) {
          return;
        }
        if (!err && !isFinished(stream)) {
          err = new AbortError();
        }
        if (isServerRequest(stream)) {
          stream.socket = null;
          stream.destroy(err);
        } else if (isRequest(stream)) {
          stream.abort();
        } else if (isRequest(stream.req)) {
          stream.req.abort();
        } else if (typeof stream.destroy === "function") {
          stream.destroy(err);
        } else if (typeof stream.close === "function") {
          stream.close();
        } else if (err) {
          process2.nextTick(emitErrorCloseLegacy, stream, err);
        } else {
          process2.nextTick(emitCloseLegacy, stream);
        }
        if (!stream.destroyed) {
          stream[kIsDestroyed] = true;
        }
      }
      module.exports = {
        construct,
        destroyer,
        destroy,
        undestroy,
        errorOrDestroy
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/legacy.js
  var require_legacy = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/legacy.js"(exports, module) {
      "use strict";
      var { ArrayIsArray, ObjectSetPrototypeOf } = require_primordials();
      var { EventEmitter: EE } = require_events();
      function Stream(opts) {
        EE.call(this, opts);
      }
      ObjectSetPrototypeOf(Stream.prototype, EE.prototype);
      ObjectSetPrototypeOf(Stream, EE);
      Stream.prototype.pipe = function(dest, options) {
        const source = this;
        function ondata(chunk) {
          if (dest.writable && dest.write(chunk) === false && source.pause) {
            source.pause();
          }
        }
        source.on("data", ondata);
        function ondrain() {
          if (source.readable && source.resume) {
            source.resume();
          }
        }
        dest.on("drain", ondrain);
        if (!dest._isStdio && (!options || options.end !== false)) {
          source.on("end", onend);
          source.on("close", onclose);
        }
        let didOnEnd = false;
        function onend() {
          if (didOnEnd) return;
          didOnEnd = true;
          dest.end();
        }
        function onclose() {
          if (didOnEnd) return;
          didOnEnd = true;
          if (typeof dest.destroy === "function") dest.destroy();
        }
        function onerror(er) {
          cleanup();
          if (EE.listenerCount(this, "error") === 0) {
            this.emit("error", er);
          }
        }
        prependListener(source, "error", onerror);
        prependListener(dest, "error", onerror);
        function cleanup() {
          source.removeListener("data", ondata);
          dest.removeListener("drain", ondrain);
          source.removeListener("end", onend);
          source.removeListener("close", onclose);
          source.removeListener("error", onerror);
          dest.removeListener("error", onerror);
          source.removeListener("end", cleanup);
          source.removeListener("close", cleanup);
          dest.removeListener("close", cleanup);
        }
        source.on("end", cleanup);
        source.on("close", cleanup);
        dest.on("close", cleanup);
        dest.emit("pipe", source);
        return dest;
      };
      function prependListener(emitter, event, fn) {
        if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
        if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
        else if (ArrayIsArray(emitter._events[event])) emitter._events[event].unshift(fn);
        else emitter._events[event] = [fn, emitter._events[event]];
      }
      module.exports = {
        Stream,
        prependListener
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/add-abort-signal.js
  var require_add_abort_signal = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/add-abort-signal.js"(exports, module) {
      "use strict";
      var { SymbolDispose } = require_primordials();
      var { AbortError, codes } = require_errors();
      var { isNodeStream, isWebStream, kControllerErrorFunction } = require_utils();
      var eos = require_end_of_stream();
      var { ERR_INVALID_ARG_TYPE } = codes;
      var addAbortListener;
      var validateAbortSignal = (signal, name) => {
        if (typeof signal !== "object" || !("aborted" in signal)) {
          throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
        }
      };
      module.exports.addAbortSignal = function addAbortSignal(signal, stream) {
        validateAbortSignal(signal, "signal");
        if (!isNodeStream(stream) && !isWebStream(stream)) {
          throw new ERR_INVALID_ARG_TYPE("stream", ["ReadableStream", "WritableStream", "Stream"], stream);
        }
        return module.exports.addAbortSignalNoValidate(signal, stream);
      };
      module.exports.addAbortSignalNoValidate = function(signal, stream) {
        if (typeof signal !== "object" || !("aborted" in signal)) {
          return stream;
        }
        const onAbort = isNodeStream(stream) ? () => {
          stream.destroy(
            new AbortError(void 0, {
              cause: signal.reason
            })
          );
        } : () => {
          stream[kControllerErrorFunction](
            new AbortError(void 0, {
              cause: signal.reason
            })
          );
        };
        if (signal.aborted) {
          onAbort();
        } else {
          addAbortListener = addAbortListener || require_util().addAbortListener;
          const disposable = addAbortListener(signal, onAbort);
          eos(stream, disposable[SymbolDispose]);
        }
        return stream;
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/buffer_list.js
  var require_buffer_list = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/buffer_list.js"(exports, module) {
      "use strict";
      var { StringPrototypeSlice, SymbolIterator, TypedArrayPrototypeSet, Uint8Array: Uint8Array2 } = require_primordials();
      var { Buffer: Buffer2 } = require_buffer();
      var { inspect } = require_util();
      module.exports = class BufferList {
        constructor() {
          this.head = null;
          this.tail = null;
          this.length = 0;
        }
        push(v) {
          const entry = {
            data: v,
            next: null
          };
          if (this.length > 0) this.tail.next = entry;
          else this.head = entry;
          this.tail = entry;
          ++this.length;
        }
        unshift(v) {
          const entry = {
            data: v,
            next: this.head
          };
          if (this.length === 0) this.tail = entry;
          this.head = entry;
          ++this.length;
        }
        shift() {
          if (this.length === 0) return;
          const ret = this.head.data;
          if (this.length === 1) this.head = this.tail = null;
          else this.head = this.head.next;
          --this.length;
          return ret;
        }
        clear() {
          this.head = this.tail = null;
          this.length = 0;
        }
        join(s) {
          if (this.length === 0) return "";
          let p = this.head;
          let ret = "" + p.data;
          while ((p = p.next) !== null) ret += s + p.data;
          return ret;
        }
        concat(n) {
          if (this.length === 0) return Buffer2.alloc(0);
          const ret = Buffer2.allocUnsafe(n >>> 0);
          let p = this.head;
          let i = 0;
          while (p) {
            TypedArrayPrototypeSet(ret, p.data, i);
            i += p.data.length;
            p = p.next;
          }
          return ret;
        }
        // Consumes a specified amount of bytes or characters from the buffered data.
        consume(n, hasStrings) {
          const data = this.head.data;
          if (n < data.length) {
            const slice = data.slice(0, n);
            this.head.data = data.slice(n);
            return slice;
          }
          if (n === data.length) {
            return this.shift();
          }
          return hasStrings ? this._getString(n) : this._getBuffer(n);
        }
        first() {
          return this.head.data;
        }
        *[SymbolIterator]() {
          for (let p = this.head; p; p = p.next) {
            yield p.data;
          }
        }
        // Consumes a specified amount of characters from the buffered data.
        _getString(n) {
          let ret = "";
          let p = this.head;
          let c = 0;
          do {
            const str = p.data;
            if (n > str.length) {
              ret += str;
              n -= str.length;
            } else {
              if (n === str.length) {
                ret += str;
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                ret += StringPrototypeSlice(str, 0, n);
                this.head = p;
                p.data = StringPrototypeSlice(str, n);
              }
              break;
            }
            ++c;
          } while ((p = p.next) !== null);
          this.length -= c;
          return ret;
        }
        // Consumes a specified amount of bytes from the buffered data.
        _getBuffer(n) {
          const ret = Buffer2.allocUnsafe(n);
          const retLen = n;
          let p = this.head;
          let c = 0;
          do {
            const buf = p.data;
            if (n > buf.length) {
              TypedArrayPrototypeSet(ret, buf, retLen - n);
              n -= buf.length;
            } else {
              if (n === buf.length) {
                TypedArrayPrototypeSet(ret, buf, retLen - n);
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                TypedArrayPrototypeSet(ret, new Uint8Array2(buf.buffer, buf.byteOffset, n), retLen - n);
                this.head = p;
                p.data = buf.slice(n);
              }
              break;
            }
            ++c;
          } while ((p = p.next) !== null);
          this.length -= c;
          return ret;
        }
        // Make sure the linked list only shows the minimal necessary information.
        [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")](_, options) {
          return inspect(this, {
            ...options,
            // Only inspect one level.
            depth: 0,
            // It should not recurse.
            customInspect: false
          });
        }
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/state.js
  var require_state = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/state.js"(exports, module) {
      "use strict";
      var { MathFloor, NumberIsInteger } = require_primordials();
      var { validateInteger } = require_validators();
      var { ERR_INVALID_ARG_VALUE } = require_errors().codes;
      var defaultHighWaterMarkBytes = 16 * 1024;
      var defaultHighWaterMarkObjectMode = 16;
      function highWaterMarkFrom(options, isDuplex, duplexKey) {
        return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
      }
      function getDefaultHighWaterMark(objectMode) {
        return objectMode ? defaultHighWaterMarkObjectMode : defaultHighWaterMarkBytes;
      }
      function setDefaultHighWaterMark(objectMode, value) {
        validateInteger(value, "value", 0);
        if (objectMode) {
          defaultHighWaterMarkObjectMode = value;
        } else {
          defaultHighWaterMarkBytes = value;
        }
      }
      function getHighWaterMark(state, options, duplexKey, isDuplex) {
        const hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
        if (hwm != null) {
          if (!NumberIsInteger(hwm) || hwm < 0) {
            const name = isDuplex ? `options.${duplexKey}` : "options.highWaterMark";
            throw new ERR_INVALID_ARG_VALUE(name, hwm);
          }
          return MathFloor(hwm);
        }
        return getDefaultHighWaterMark(state.objectMode);
      }
      module.exports = {
        getHighWaterMark,
        getDefaultHighWaterMark,
        setDefaultHighWaterMark
      };
    }
  });

  // node_modules/safe-buffer/index.js
  var require_safe_buffer = __commonJS({
    "node_modules/safe-buffer/index.js"(exports, module) {
      var buffer = require_buffer();
      var Buffer2 = buffer.Buffer;
      function copyProps(src, dst) {
        for (var key in src) {
          dst[key] = src[key];
        }
      }
      if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
        module.exports = buffer;
      } else {
        copyProps(buffer, exports);
        exports.Buffer = SafeBuffer;
      }
      function SafeBuffer(arg, encodingOrOffset, length) {
        return Buffer2(arg, encodingOrOffset, length);
      }
      SafeBuffer.prototype = Object.create(Buffer2.prototype);
      copyProps(Buffer2, SafeBuffer);
      SafeBuffer.from = function(arg, encodingOrOffset, length) {
        if (typeof arg === "number") {
          throw new TypeError("Argument must not be a number");
        }
        return Buffer2(arg, encodingOrOffset, length);
      };
      SafeBuffer.alloc = function(size, fill, encoding) {
        if (typeof size !== "number") {
          throw new TypeError("Argument must be a number");
        }
        var buf = Buffer2(size);
        if (fill !== void 0) {
          if (typeof encoding === "string") {
            buf.fill(fill, encoding);
          } else {
            buf.fill(fill);
          }
        } else {
          buf.fill(0);
        }
        return buf;
      };
      SafeBuffer.allocUnsafe = function(size) {
        if (typeof size !== "number") {
          throw new TypeError("Argument must be a number");
        }
        return Buffer2(size);
      };
      SafeBuffer.allocUnsafeSlow = function(size) {
        if (typeof size !== "number") {
          throw new TypeError("Argument must be a number");
        }
        return buffer.SlowBuffer(size);
      };
    }
  });

  // node_modules/string_decoder/lib/string_decoder.js
  var require_string_decoder = __commonJS({
    "node_modules/string_decoder/lib/string_decoder.js"(exports) {
      "use strict";
      var Buffer2 = require_safe_buffer().Buffer;
      var isEncoding = Buffer2.isEncoding || function(encoding) {
        encoding = "" + encoding;
        switch (encoding && encoding.toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
          case "raw":
            return true;
          default:
            return false;
        }
      };
      function _normalizeEncoding(enc) {
        if (!enc) return "utf8";
        var retried;
        while (true) {
          switch (enc) {
            case "utf8":
            case "utf-8":
              return "utf8";
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return "utf16le";
            case "latin1":
            case "binary":
              return "latin1";
            case "base64":
            case "ascii":
            case "hex":
              return enc;
            default:
              if (retried) return;
              enc = ("" + enc).toLowerCase();
              retried = true;
          }
        }
      }
      function normalizeEncoding(enc) {
        var nenc = _normalizeEncoding(enc);
        if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
        return nenc || enc;
      }
      exports.StringDecoder = StringDecoder;
      function StringDecoder(encoding) {
        this.encoding = normalizeEncoding(encoding);
        var nb;
        switch (this.encoding) {
          case "utf16le":
            this.text = utf16Text;
            this.end = utf16End;
            nb = 4;
            break;
          case "utf8":
            this.fillLast = utf8FillLast;
            nb = 4;
            break;
          case "base64":
            this.text = base64Text;
            this.end = base64End;
            nb = 3;
            break;
          default:
            this.write = simpleWrite;
            this.end = simpleEnd;
            return;
        }
        this.lastNeed = 0;
        this.lastTotal = 0;
        this.lastChar = Buffer2.allocUnsafe(nb);
      }
      StringDecoder.prototype.write = function(buf) {
        if (buf.length === 0) return "";
        var r;
        var i;
        if (this.lastNeed) {
          r = this.fillLast(buf);
          if (r === void 0) return "";
          i = this.lastNeed;
          this.lastNeed = 0;
        } else {
          i = 0;
        }
        if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
        return r || "";
      };
      StringDecoder.prototype.end = utf8End;
      StringDecoder.prototype.text = utf8Text;
      StringDecoder.prototype.fillLast = function(buf) {
        if (this.lastNeed <= buf.length) {
          buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
          return this.lastChar.toString(this.encoding, 0, this.lastTotal);
        }
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
        this.lastNeed -= buf.length;
      };
      function utf8CheckByte(byte) {
        if (byte <= 127) return 0;
        else if (byte >> 5 === 6) return 2;
        else if (byte >> 4 === 14) return 3;
        else if (byte >> 3 === 30) return 4;
        return byte >> 6 === 2 ? -1 : -2;
      }
      function utf8CheckIncomplete(self2, buf, i) {
        var j = buf.length - 1;
        if (j < i) return 0;
        var nb = utf8CheckByte(buf[j]);
        if (nb >= 0) {
          if (nb > 0) self2.lastNeed = nb - 1;
          return nb;
        }
        if (--j < i || nb === -2) return 0;
        nb = utf8CheckByte(buf[j]);
        if (nb >= 0) {
          if (nb > 0) self2.lastNeed = nb - 2;
          return nb;
        }
        if (--j < i || nb === -2) return 0;
        nb = utf8CheckByte(buf[j]);
        if (nb >= 0) {
          if (nb > 0) {
            if (nb === 2) nb = 0;
            else self2.lastNeed = nb - 3;
          }
          return nb;
        }
        return 0;
      }
      function utf8CheckExtraBytes(self2, buf, p) {
        if ((buf[0] & 192) !== 128) {
          self2.lastNeed = 0;
          return "\uFFFD";
        }
        if (self2.lastNeed > 1 && buf.length > 1) {
          if ((buf[1] & 192) !== 128) {
            self2.lastNeed = 1;
            return "\uFFFD";
          }
          if (self2.lastNeed > 2 && buf.length > 2) {
            if ((buf[2] & 192) !== 128) {
              self2.lastNeed = 2;
              return "\uFFFD";
            }
          }
        }
      }
      function utf8FillLast(buf) {
        var p = this.lastTotal - this.lastNeed;
        var r = utf8CheckExtraBytes(this, buf, p);
        if (r !== void 0) return r;
        if (this.lastNeed <= buf.length) {
          buf.copy(this.lastChar, p, 0, this.lastNeed);
          return this.lastChar.toString(this.encoding, 0, this.lastTotal);
        }
        buf.copy(this.lastChar, p, 0, buf.length);
        this.lastNeed -= buf.length;
      }
      function utf8Text(buf, i) {
        var total = utf8CheckIncomplete(this, buf, i);
        if (!this.lastNeed) return buf.toString("utf8", i);
        this.lastTotal = total;
        var end = buf.length - (total - this.lastNeed);
        buf.copy(this.lastChar, 0, end);
        return buf.toString("utf8", i, end);
      }
      function utf8End(buf) {
        var r = buf && buf.length ? this.write(buf) : "";
        if (this.lastNeed) return r + "\uFFFD";
        return r;
      }
      function utf16Text(buf, i) {
        if ((buf.length - i) % 2 === 0) {
          var r = buf.toString("utf16le", i);
          if (r) {
            var c = r.charCodeAt(r.length - 1);
            if (c >= 55296 && c <= 56319) {
              this.lastNeed = 2;
              this.lastTotal = 4;
              this.lastChar[0] = buf[buf.length - 2];
              this.lastChar[1] = buf[buf.length - 1];
              return r.slice(0, -1);
            }
          }
          return r;
        }
        this.lastNeed = 1;
        this.lastTotal = 2;
        this.lastChar[0] = buf[buf.length - 1];
        return buf.toString("utf16le", i, buf.length - 1);
      }
      function utf16End(buf) {
        var r = buf && buf.length ? this.write(buf) : "";
        if (this.lastNeed) {
          var end = this.lastTotal - this.lastNeed;
          return r + this.lastChar.toString("utf16le", 0, end);
        }
        return r;
      }
      function base64Text(buf, i) {
        var n = (buf.length - i) % 3;
        if (n === 0) return buf.toString("base64", i);
        this.lastNeed = 3 - n;
        this.lastTotal = 3;
        if (n === 1) {
          this.lastChar[0] = buf[buf.length - 1];
        } else {
          this.lastChar[0] = buf[buf.length - 2];
          this.lastChar[1] = buf[buf.length - 1];
        }
        return buf.toString("base64", i, buf.length - n);
      }
      function base64End(buf) {
        var r = buf && buf.length ? this.write(buf) : "";
        if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
        return r;
      }
      function simpleWrite(buf) {
        return buf.toString(this.encoding);
      }
      function simpleEnd(buf) {
        return buf && buf.length ? this.write(buf) : "";
      }
    }
  });

  // node_modules/readable-stream/lib/internal/streams/from.js
  var require_from = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/from.js"(exports, module) {
      "use strict";
      var process2 = require_process();
      var { PromisePrototypeThen, SymbolAsyncIterator, SymbolIterator } = require_primordials();
      var { Buffer: Buffer2 } = require_buffer();
      var { ERR_INVALID_ARG_TYPE, ERR_STREAM_NULL_VALUES } = require_errors().codes;
      function from(Readable, iterable, opts) {
        let iterator;
        if (typeof iterable === "string" || iterable instanceof Buffer2) {
          return new Readable({
            objectMode: true,
            ...opts,
            read() {
              this.push(iterable);
              this.push(null);
            }
          });
        }
        let isAsync;
        if (iterable && iterable[SymbolAsyncIterator]) {
          isAsync = true;
          iterator = iterable[SymbolAsyncIterator]();
        } else if (iterable && iterable[SymbolIterator]) {
          isAsync = false;
          iterator = iterable[SymbolIterator]();
        } else {
          throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
        }
        const readable = new Readable({
          objectMode: true,
          highWaterMark: 1,
          // TODO(ronag): What options should be allowed?
          ...opts
        });
        let reading = false;
        readable._read = function() {
          if (!reading) {
            reading = true;
            next();
          }
        };
        readable._destroy = function(error, cb) {
          PromisePrototypeThen(
            close(error),
            () => process2.nextTick(cb, error),
            // nextTick is here in case cb throws
            (e) => process2.nextTick(cb, e || error)
          );
        };
        async function close(error) {
          const hadError = error !== void 0 && error !== null;
          const hasThrow = typeof iterator.throw === "function";
          if (hadError && hasThrow) {
            const { value, done } = await iterator.throw(error);
            await value;
            if (done) {
              return;
            }
          }
          if (typeof iterator.return === "function") {
            const { value } = await iterator.return();
            await value;
          }
        }
        async function next() {
          for (; ; ) {
            try {
              const { value, done } = isAsync ? await iterator.next() : iterator.next();
              if (done) {
                readable.push(null);
              } else {
                const res = value && typeof value.then === "function" ? await value : value;
                if (res === null) {
                  reading = false;
                  throw new ERR_STREAM_NULL_VALUES();
                } else if (readable.push(res)) {
                  continue;
                } else {
                  reading = false;
                }
              }
            } catch (err) {
              readable.destroy(err);
            }
            break;
          }
        }
        return readable;
      }
      module.exports = from;
    }
  });

  // node_modules/readable-stream/lib/internal/streams/readable.js
  var require_readable = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/readable.js"(exports, module) {
      "use strict";
      var process2 = require_process();
      var {
        ArrayPrototypeIndexOf,
        NumberIsInteger,
        NumberIsNaN,
        NumberParseInt,
        ObjectDefineProperties,
        ObjectKeys,
        ObjectSetPrototypeOf,
        Promise: Promise2,
        SafeSet,
        SymbolAsyncDispose,
        SymbolAsyncIterator,
        Symbol: Symbol2
      } = require_primordials();
      module.exports = Readable;
      Readable.ReadableState = ReadableState;
      var { EventEmitter: EE } = require_events();
      var { Stream, prependListener } = require_legacy();
      var { Buffer: Buffer2 } = require_buffer();
      var { addAbortSignal } = require_add_abort_signal();
      var eos = require_end_of_stream();
      var debug = require_util().debuglog("stream", (fn) => {
        debug = fn;
      });
      var BufferList = require_buffer_list();
      var destroyImpl = require_destroy();
      var { getHighWaterMark, getDefaultHighWaterMark } = require_state();
      var {
        aggregateTwoErrors,
        codes: {
          ERR_INVALID_ARG_TYPE,
          ERR_METHOD_NOT_IMPLEMENTED,
          ERR_OUT_OF_RANGE,
          ERR_STREAM_PUSH_AFTER_EOF,
          ERR_STREAM_UNSHIFT_AFTER_END_EVENT
        },
        AbortError
      } = require_errors();
      var { validateObject } = require_validators();
      var kPaused = Symbol2("kPaused");
      var { StringDecoder } = require_string_decoder();
      var from = require_from();
      ObjectSetPrototypeOf(Readable.prototype, Stream.prototype);
      ObjectSetPrototypeOf(Readable, Stream);
      var nop = () => {
      };
      var { errorOrDestroy } = destroyImpl;
      var kObjectMode = 1 << 0;
      var kEnded = 1 << 1;
      var kEndEmitted = 1 << 2;
      var kReading = 1 << 3;
      var kConstructed = 1 << 4;
      var kSync = 1 << 5;
      var kNeedReadable = 1 << 6;
      var kEmittedReadable = 1 << 7;
      var kReadableListening = 1 << 8;
      var kResumeScheduled = 1 << 9;
      var kErrorEmitted = 1 << 10;
      var kEmitClose = 1 << 11;
      var kAutoDestroy = 1 << 12;
      var kDestroyed = 1 << 13;
      var kClosed = 1 << 14;
      var kCloseEmitted = 1 << 15;
      var kMultiAwaitDrain = 1 << 16;
      var kReadingMore = 1 << 17;
      var kDataEmitted = 1 << 18;
      function makeBitMapDescriptor(bit) {
        return {
          enumerable: false,
          get() {
            return (this.state & bit) !== 0;
          },
          set(value) {
            if (value) this.state |= bit;
            else this.state &= ~bit;
          }
        };
      }
      ObjectDefineProperties(ReadableState.prototype, {
        objectMode: makeBitMapDescriptor(kObjectMode),
        ended: makeBitMapDescriptor(kEnded),
        endEmitted: makeBitMapDescriptor(kEndEmitted),
        reading: makeBitMapDescriptor(kReading),
        // Stream is still being constructed and cannot be
        // destroyed until construction finished or failed.
        // Async construction is opt in, therefore we start as
        // constructed.
        constructed: makeBitMapDescriptor(kConstructed),
        // A flag to be able to tell if the event 'readable'/'data' is emitted
        // immediately, or on a later tick.  We set this to true at first, because
        // any actions that shouldn't happen until "later" should generally also
        // not happen before the first read call.
        sync: makeBitMapDescriptor(kSync),
        // Whenever we return null, then we set a flag to say
        // that we're awaiting a 'readable' event emission.
        needReadable: makeBitMapDescriptor(kNeedReadable),
        emittedReadable: makeBitMapDescriptor(kEmittedReadable),
        readableListening: makeBitMapDescriptor(kReadableListening),
        resumeScheduled: makeBitMapDescriptor(kResumeScheduled),
        // True if the error was already emitted and should not be thrown again.
        errorEmitted: makeBitMapDescriptor(kErrorEmitted),
        emitClose: makeBitMapDescriptor(kEmitClose),
        autoDestroy: makeBitMapDescriptor(kAutoDestroy),
        // Has it been destroyed.
        destroyed: makeBitMapDescriptor(kDestroyed),
        // Indicates whether the stream has finished destroying.
        closed: makeBitMapDescriptor(kClosed),
        // True if close has been emitted or would have been emitted
        // depending on emitClose.
        closeEmitted: makeBitMapDescriptor(kCloseEmitted),
        multiAwaitDrain: makeBitMapDescriptor(kMultiAwaitDrain),
        // If true, a maybeReadMore has been scheduled.
        readingMore: makeBitMapDescriptor(kReadingMore),
        dataEmitted: makeBitMapDescriptor(kDataEmitted)
      });
      function ReadableState(options, stream, isDuplex) {
        if (typeof isDuplex !== "boolean") isDuplex = stream instanceof require_duplex();
        this.state = kEmitClose | kAutoDestroy | kConstructed | kSync;
        if (options && options.objectMode) this.state |= kObjectMode;
        if (isDuplex && options && options.readableObjectMode) this.state |= kObjectMode;
        this.highWaterMark = options ? getHighWaterMark(this, options, "readableHighWaterMark", isDuplex) : getDefaultHighWaterMark(false);
        this.buffer = new BufferList();
        this.length = 0;
        this.pipes = [];
        this.flowing = null;
        this[kPaused] = null;
        if (options && options.emitClose === false) this.state &= ~kEmitClose;
        if (options && options.autoDestroy === false) this.state &= ~kAutoDestroy;
        this.errored = null;
        this.defaultEncoding = options && options.defaultEncoding || "utf8";
        this.awaitDrainWriters = null;
        this.decoder = null;
        this.encoding = null;
        if (options && options.encoding) {
          this.decoder = new StringDecoder(options.encoding);
          this.encoding = options.encoding;
        }
      }
      function Readable(options) {
        if (!(this instanceof Readable)) return new Readable(options);
        const isDuplex = this instanceof require_duplex();
        this._readableState = new ReadableState(options, this, isDuplex);
        if (options) {
          if (typeof options.read === "function") this._read = options.read;
          if (typeof options.destroy === "function") this._destroy = options.destroy;
          if (typeof options.construct === "function") this._construct = options.construct;
          if (options.signal && !isDuplex) addAbortSignal(options.signal, this);
        }
        Stream.call(this, options);
        destroyImpl.construct(this, () => {
          if (this._readableState.needReadable) {
            maybeReadMore(this, this._readableState);
          }
        });
      }
      Readable.prototype.destroy = destroyImpl.destroy;
      Readable.prototype._undestroy = destroyImpl.undestroy;
      Readable.prototype._destroy = function(err, cb) {
        cb(err);
      };
      Readable.prototype[EE.captureRejectionSymbol] = function(err) {
        this.destroy(err);
      };
      Readable.prototype[SymbolAsyncDispose] = function() {
        let error;
        if (!this.destroyed) {
          error = this.readableEnded ? null : new AbortError();
          this.destroy(error);
        }
        return new Promise2((resolve, reject) => eos(this, (err) => err && err !== error ? reject(err) : resolve(null)));
      };
      Readable.prototype.push = function(chunk, encoding) {
        return readableAddChunk(this, chunk, encoding, false);
      };
      Readable.prototype.unshift = function(chunk, encoding) {
        return readableAddChunk(this, chunk, encoding, true);
      };
      function readableAddChunk(stream, chunk, encoding, addToFront) {
        debug("readableAddChunk", chunk);
        const state = stream._readableState;
        let err;
        if ((state.state & kObjectMode) === 0) {
          if (typeof chunk === "string") {
            encoding = encoding || state.defaultEncoding;
            if (state.encoding !== encoding) {
              if (addToFront && state.encoding) {
                chunk = Buffer2.from(chunk, encoding).toString(state.encoding);
              } else {
                chunk = Buffer2.from(chunk, encoding);
                encoding = "";
              }
            }
          } else if (chunk instanceof Buffer2) {
            encoding = "";
          } else if (Stream._isUint8Array(chunk)) {
            chunk = Stream._uint8ArrayToBuffer(chunk);
            encoding = "";
          } else if (chunk != null) {
            err = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
          }
        }
        if (err) {
          errorOrDestroy(stream, err);
        } else if (chunk === null) {
          state.state &= ~kReading;
          onEofChunk(stream, state);
        } else if ((state.state & kObjectMode) !== 0 || chunk && chunk.length > 0) {
          if (addToFront) {
            if ((state.state & kEndEmitted) !== 0) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
            else if (state.destroyed || state.errored) return false;
            else addChunk(stream, state, chunk, true);
          } else if (state.ended) {
            errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
          } else if (state.destroyed || state.errored) {
            return false;
          } else {
            state.state &= ~kReading;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
              else maybeReadMore(stream, state);
            } else {
              addChunk(stream, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.state &= ~kReading;
          maybeReadMore(stream, state);
        }
        return !state.ended && (state.length < state.highWaterMark || state.length === 0);
      }
      function addChunk(stream, state, chunk, addToFront) {
        if (state.flowing && state.length === 0 && !state.sync && stream.listenerCount("data") > 0) {
          if ((state.state & kMultiAwaitDrain) !== 0) {
            state.awaitDrainWriters.clear();
          } else {
            state.awaitDrainWriters = null;
          }
          state.dataEmitted = true;
          stream.emit("data", chunk);
        } else {
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);
          else state.buffer.push(chunk);
          if ((state.state & kNeedReadable) !== 0) emitReadable(stream);
        }
        maybeReadMore(stream, state);
      }
      Readable.prototype.isPaused = function() {
        const state = this._readableState;
        return state[kPaused] === true || state.flowing === false;
      };
      Readable.prototype.setEncoding = function(enc) {
        const decoder = new StringDecoder(enc);
        this._readableState.decoder = decoder;
        this._readableState.encoding = this._readableState.decoder.encoding;
        const buffer = this._readableState.buffer;
        let content = "";
        for (const data of buffer) {
          content += decoder.write(data);
        }
        buffer.clear();
        if (content !== "") buffer.push(content);
        this._readableState.length = content.length;
        return this;
      };
      var MAX_HWM = 1073741824;
      function computeNewHighWaterMark(n) {
        if (n > MAX_HWM) {
          throw new ERR_OUT_OF_RANGE("size", "<= 1GiB", n);
        } else {
          n--;
          n |= n >>> 1;
          n |= n >>> 2;
          n |= n >>> 4;
          n |= n >>> 8;
          n |= n >>> 16;
          n++;
        }
        return n;
      }
      function howMuchToRead(n, state) {
        if (n <= 0 || state.length === 0 && state.ended) return 0;
        if ((state.state & kObjectMode) !== 0) return 1;
        if (NumberIsNaN(n)) {
          if (state.flowing && state.length) return state.buffer.first().length;
          return state.length;
        }
        if (n <= state.length) return n;
        return state.ended ? state.length : 0;
      }
      Readable.prototype.read = function(n) {
        debug("read", n);
        if (n === void 0) {
          n = NaN;
        } else if (!NumberIsInteger(n)) {
          n = NumberParseInt(n, 10);
        }
        const state = this._readableState;
        const nOrig = n;
        if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
        if (n !== 0) state.state &= ~kEmittedReadable;
        if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
          debug("read: emitReadable", state.length, state.ended);
          if (state.length === 0 && state.ended) endReadable(this);
          else emitReadable(this);
          return null;
        }
        n = howMuchToRead(n, state);
        if (n === 0 && state.ended) {
          if (state.length === 0) endReadable(this);
          return null;
        }
        let doRead = (state.state & kNeedReadable) !== 0;
        debug("need readable", doRead);
        if (state.length === 0 || state.length - n < state.highWaterMark) {
          doRead = true;
          debug("length less than watermark", doRead);
        }
        if (state.ended || state.reading || state.destroyed || state.errored || !state.constructed) {
          doRead = false;
          debug("reading, ended or constructing", doRead);
        } else if (doRead) {
          debug("do read");
          state.state |= kReading | kSync;
          if (state.length === 0) state.state |= kNeedReadable;
          try {
            this._read(state.highWaterMark);
          } catch (err) {
            errorOrDestroy(this, err);
          }
          state.state &= ~kSync;
          if (!state.reading) n = howMuchToRead(nOrig, state);
        }
        let ret;
        if (n > 0) ret = fromList(n, state);
        else ret = null;
        if (ret === null) {
          state.needReadable = state.length <= state.highWaterMark;
          n = 0;
        } else {
          state.length -= n;
          if (state.multiAwaitDrain) {
            state.awaitDrainWriters.clear();
          } else {
            state.awaitDrainWriters = null;
          }
        }
        if (state.length === 0) {
          if (!state.ended) state.needReadable = true;
          if (nOrig !== n && state.ended) endReadable(this);
        }
        if (ret !== null && !state.errorEmitted && !state.closeEmitted) {
          state.dataEmitted = true;
          this.emit("data", ret);
        }
        return ret;
      };
      function onEofChunk(stream, state) {
        debug("onEofChunk");
        if (state.ended) return;
        if (state.decoder) {
          const chunk = state.decoder.end();
          if (chunk && chunk.length) {
            state.buffer.push(chunk);
            state.length += state.objectMode ? 1 : chunk.length;
          }
        }
        state.ended = true;
        if (state.sync) {
          emitReadable(stream);
        } else {
          state.needReadable = false;
          state.emittedReadable = true;
          emitReadable_(stream);
        }
      }
      function emitReadable(stream) {
        const state = stream._readableState;
        debug("emitReadable", state.needReadable, state.emittedReadable);
        state.needReadable = false;
        if (!state.emittedReadable) {
          debug("emitReadable", state.flowing);
          state.emittedReadable = true;
          process2.nextTick(emitReadable_, stream);
        }
      }
      function emitReadable_(stream) {
        const state = stream._readableState;
        debug("emitReadable_", state.destroyed, state.length, state.ended);
        if (!state.destroyed && !state.errored && (state.length || state.ended)) {
          stream.emit("readable");
          state.emittedReadable = false;
        }
        state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
        flow(stream);
      }
      function maybeReadMore(stream, state) {
        if (!state.readingMore && state.constructed) {
          state.readingMore = true;
          process2.nextTick(maybeReadMore_, stream, state);
        }
      }
      function maybeReadMore_(stream, state) {
        while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
          const len = state.length;
          debug("maybeReadMore read 0");
          stream.read(0);
          if (len === state.length)
            break;
        }
        state.readingMore = false;
      }
      Readable.prototype._read = function(n) {
        throw new ERR_METHOD_NOT_IMPLEMENTED("_read()");
      };
      Readable.prototype.pipe = function(dest, pipeOpts) {
        const src = this;
        const state = this._readableState;
        if (state.pipes.length === 1) {
          if (!state.multiAwaitDrain) {
            state.multiAwaitDrain = true;
            state.awaitDrainWriters = new SafeSet(state.awaitDrainWriters ? [state.awaitDrainWriters] : []);
          }
        }
        state.pipes.push(dest);
        debug("pipe count=%d opts=%j", state.pipes.length, pipeOpts);
        const doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process2.stdout && dest !== process2.stderr;
        const endFn = doEnd ? onend : unpipe;
        if (state.endEmitted) process2.nextTick(endFn);
        else src.once("end", endFn);
        dest.on("unpipe", onunpipe);
        function onunpipe(readable, unpipeInfo) {
          debug("onunpipe");
          if (readable === src) {
            if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
              unpipeInfo.hasUnpiped = true;
              cleanup();
            }
          }
        }
        function onend() {
          debug("onend");
          dest.end();
        }
        let ondrain;
        let cleanedUp = false;
        function cleanup() {
          debug("cleanup");
          dest.removeListener("close", onclose);
          dest.removeListener("finish", onfinish);
          if (ondrain) {
            dest.removeListener("drain", ondrain);
          }
          dest.removeListener("error", onerror);
          dest.removeListener("unpipe", onunpipe);
          src.removeListener("end", onend);
          src.removeListener("end", unpipe);
          src.removeListener("data", ondata);
          cleanedUp = true;
          if (ondrain && state.awaitDrainWriters && (!dest._writableState || dest._writableState.needDrain)) ondrain();
        }
        function pause() {
          if (!cleanedUp) {
            if (state.pipes.length === 1 && state.pipes[0] === dest) {
              debug("false write response, pause", 0);
              state.awaitDrainWriters = dest;
              state.multiAwaitDrain = false;
            } else if (state.pipes.length > 1 && state.pipes.includes(dest)) {
              debug("false write response, pause", state.awaitDrainWriters.size);
              state.awaitDrainWriters.add(dest);
            }
            src.pause();
          }
          if (!ondrain) {
            ondrain = pipeOnDrain(src, dest);
            dest.on("drain", ondrain);
          }
        }
        src.on("data", ondata);
        function ondata(chunk) {
          debug("ondata");
          const ret = dest.write(chunk);
          debug("dest.write", ret);
          if (ret === false) {
            pause();
          }
        }
        function onerror(er) {
          debug("onerror", er);
          unpipe();
          dest.removeListener("error", onerror);
          if (dest.listenerCount("error") === 0) {
            const s = dest._writableState || dest._readableState;
            if (s && !s.errorEmitted) {
              errorOrDestroy(dest, er);
            } else {
              dest.emit("error", er);
            }
          }
        }
        prependListener(dest, "error", onerror);
        function onclose() {
          dest.removeListener("finish", onfinish);
          unpipe();
        }
        dest.once("close", onclose);
        function onfinish() {
          debug("onfinish");
          dest.removeListener("close", onclose);
          unpipe();
        }
        dest.once("finish", onfinish);
        function unpipe() {
          debug("unpipe");
          src.unpipe(dest);
        }
        dest.emit("pipe", src);
        if (dest.writableNeedDrain === true) {
          pause();
        } else if (!state.flowing) {
          debug("pipe resume");
          src.resume();
        }
        return dest;
      };
      function pipeOnDrain(src, dest) {
        return function pipeOnDrainFunctionResult() {
          const state = src._readableState;
          if (state.awaitDrainWriters === dest) {
            debug("pipeOnDrain", 1);
            state.awaitDrainWriters = null;
          } else if (state.multiAwaitDrain) {
            debug("pipeOnDrain", state.awaitDrainWriters.size);
            state.awaitDrainWriters.delete(dest);
          }
          if ((!state.awaitDrainWriters || state.awaitDrainWriters.size === 0) && src.listenerCount("data")) {
            src.resume();
          }
        };
      }
      Readable.prototype.unpipe = function(dest) {
        const state = this._readableState;
        const unpipeInfo = {
          hasUnpiped: false
        };
        if (state.pipes.length === 0) return this;
        if (!dest) {
          const dests = state.pipes;
          state.pipes = [];
          this.pause();
          for (let i = 0; i < dests.length; i++)
            dests[i].emit("unpipe", this, {
              hasUnpiped: false
            });
          return this;
        }
        const index = ArrayPrototypeIndexOf(state.pipes, dest);
        if (index === -1) return this;
        state.pipes.splice(index, 1);
        if (state.pipes.length === 0) this.pause();
        dest.emit("unpipe", this, unpipeInfo);
        return this;
      };
      Readable.prototype.on = function(ev, fn) {
        const res = Stream.prototype.on.call(this, ev, fn);
        const state = this._readableState;
        if (ev === "data") {
          state.readableListening = this.listenerCount("readable") > 0;
          if (state.flowing !== false) this.resume();
        } else if (ev === "readable") {
          if (!state.endEmitted && !state.readableListening) {
            state.readableListening = state.needReadable = true;
            state.flowing = false;
            state.emittedReadable = false;
            debug("on readable", state.length, state.reading);
            if (state.length) {
              emitReadable(this);
            } else if (!state.reading) {
              process2.nextTick(nReadingNextTick, this);
            }
          }
        }
        return res;
      };
      Readable.prototype.addListener = Readable.prototype.on;
      Readable.prototype.removeListener = function(ev, fn) {
        const res = Stream.prototype.removeListener.call(this, ev, fn);
        if (ev === "readable") {
          process2.nextTick(updateReadableListening, this);
        }
        return res;
      };
      Readable.prototype.off = Readable.prototype.removeListener;
      Readable.prototype.removeAllListeners = function(ev) {
        const res = Stream.prototype.removeAllListeners.apply(this, arguments);
        if (ev === "readable" || ev === void 0) {
          process2.nextTick(updateReadableListening, this);
        }
        return res;
      };
      function updateReadableListening(self2) {
        const state = self2._readableState;
        state.readableListening = self2.listenerCount("readable") > 0;
        if (state.resumeScheduled && state[kPaused] === false) {
          state.flowing = true;
        } else if (self2.listenerCount("data") > 0) {
          self2.resume();
        } else if (!state.readableListening) {
          state.flowing = null;
        }
      }
      function nReadingNextTick(self2) {
        debug("readable nexttick read 0");
        self2.read(0);
      }
      Readable.prototype.resume = function() {
        const state = this._readableState;
        if (!state.flowing) {
          debug("resume");
          state.flowing = !state.readableListening;
          resume(this, state);
        }
        state[kPaused] = false;
        return this;
      };
      function resume(stream, state) {
        if (!state.resumeScheduled) {
          state.resumeScheduled = true;
          process2.nextTick(resume_, stream, state);
        }
      }
      function resume_(stream, state) {
        debug("resume", state.reading);
        if (!state.reading) {
          stream.read(0);
        }
        state.resumeScheduled = false;
        stream.emit("resume");
        flow(stream);
        if (state.flowing && !state.reading) stream.read(0);
      }
      Readable.prototype.pause = function() {
        debug("call pause flowing=%j", this._readableState.flowing);
        if (this._readableState.flowing !== false) {
          debug("pause");
          this._readableState.flowing = false;
          this.emit("pause");
        }
        this._readableState[kPaused] = true;
        return this;
      };
      function flow(stream) {
        const state = stream._readableState;
        debug("flow", state.flowing);
        while (state.flowing && stream.read() !== null) ;
      }
      Readable.prototype.wrap = function(stream) {
        let paused = false;
        stream.on("data", (chunk) => {
          if (!this.push(chunk) && stream.pause) {
            paused = true;
            stream.pause();
          }
        });
        stream.on("end", () => {
          this.push(null);
        });
        stream.on("error", (err) => {
          errorOrDestroy(this, err);
        });
        stream.on("close", () => {
          this.destroy();
        });
        stream.on("destroy", () => {
          this.destroy();
        });
        this._read = () => {
          if (paused && stream.resume) {
            paused = false;
            stream.resume();
          }
        };
        const streamKeys = ObjectKeys(stream);
        for (let j = 1; j < streamKeys.length; j++) {
          const i = streamKeys[j];
          if (this[i] === void 0 && typeof stream[i] === "function") {
            this[i] = stream[i].bind(stream);
          }
        }
        return this;
      };
      Readable.prototype[SymbolAsyncIterator] = function() {
        return streamToAsyncIterator(this);
      };
      Readable.prototype.iterator = function(options) {
        if (options !== void 0) {
          validateObject(options, "options");
        }
        return streamToAsyncIterator(this, options);
      };
      function streamToAsyncIterator(stream, options) {
        if (typeof stream.read !== "function") {
          stream = Readable.wrap(stream, {
            objectMode: true
          });
        }
        const iter = createAsyncIterator(stream, options);
        iter.stream = stream;
        return iter;
      }
      async function* createAsyncIterator(stream, options) {
        let callback = nop;
        function next(resolve) {
          if (this === stream) {
            callback();
            callback = nop;
          } else {
            callback = resolve;
          }
        }
        stream.on("readable", next);
        let error;
        const cleanup = eos(
          stream,
          {
            writable: false
          },
          (err) => {
            error = err ? aggregateTwoErrors(error, err) : null;
            callback();
            callback = nop;
          }
        );
        try {
          while (true) {
            const chunk = stream.destroyed ? null : stream.read();
            if (chunk !== null) {
              yield chunk;
            } else if (error) {
              throw error;
            } else if (error === null) {
              return;
            } else {
              await new Promise2(next);
            }
          }
        } catch (err) {
          error = aggregateTwoErrors(error, err);
          throw error;
        } finally {
          if ((error || (options === null || options === void 0 ? void 0 : options.destroyOnReturn) !== false) && (error === void 0 || stream._readableState.autoDestroy)) {
            destroyImpl.destroyer(stream, null);
          } else {
            stream.off("readable", next);
            cleanup();
          }
        }
      }
      ObjectDefineProperties(Readable.prototype, {
        readable: {
          __proto__: null,
          get() {
            const r = this._readableState;
            return !!r && r.readable !== false && !r.destroyed && !r.errorEmitted && !r.endEmitted;
          },
          set(val) {
            if (this._readableState) {
              this._readableState.readable = !!val;
            }
          }
        },
        readableDidRead: {
          __proto__: null,
          enumerable: false,
          get: function() {
            return this._readableState.dataEmitted;
          }
        },
        readableAborted: {
          __proto__: null,
          enumerable: false,
          get: function() {
            return !!(this._readableState.readable !== false && (this._readableState.destroyed || this._readableState.errored) && !this._readableState.endEmitted);
          }
        },
        readableHighWaterMark: {
          __proto__: null,
          enumerable: false,
          get: function() {
            return this._readableState.highWaterMark;
          }
        },
        readableBuffer: {
          __proto__: null,
          enumerable: false,
          get: function() {
            return this._readableState && this._readableState.buffer;
          }
        },
        readableFlowing: {
          __proto__: null,
          enumerable: false,
          get: function() {
            return this._readableState.flowing;
          },
          set: function(state) {
            if (this._readableState) {
              this._readableState.flowing = state;
            }
          }
        },
        readableLength: {
          __proto__: null,
          enumerable: false,
          get() {
            return this._readableState.length;
          }
        },
        readableObjectMode: {
          __proto__: null,
          enumerable: false,
          get() {
            return this._readableState ? this._readableState.objectMode : false;
          }
        },
        readableEncoding: {
          __proto__: null,
          enumerable: false,
          get() {
            return this._readableState ? this._readableState.encoding : null;
          }
        },
        errored: {
          __proto__: null,
          enumerable: false,
          get() {
            return this._readableState ? this._readableState.errored : null;
          }
        },
        closed: {
          __proto__: null,
          get() {
            return this._readableState ? this._readableState.closed : false;
          }
        },
        destroyed: {
          __proto__: null,
          enumerable: false,
          get() {
            return this._readableState ? this._readableState.destroyed : false;
          },
          set(value) {
            if (!this._readableState) {
              return;
            }
            this._readableState.destroyed = value;
          }
        },
        readableEnded: {
          __proto__: null,
          enumerable: false,
          get() {
            return this._readableState ? this._readableState.endEmitted : false;
          }
        }
      });
      ObjectDefineProperties(ReadableState.prototype, {
        // Legacy getter for `pipesCount`.
        pipesCount: {
          __proto__: null,
          get() {
            return this.pipes.length;
          }
        },
        // Legacy property for `paused`.
        paused: {
          __proto__: null,
          get() {
            return this[kPaused] !== false;
          },
          set(value) {
            this[kPaused] = !!value;
          }
        }
      });
      Readable._fromList = fromList;
      function fromList(n, state) {
        if (state.length === 0) return null;
        let ret;
        if (state.objectMode) ret = state.buffer.shift();
        else if (!n || n >= state.length) {
          if (state.decoder) ret = state.buffer.join("");
          else if (state.buffer.length === 1) ret = state.buffer.first();
          else ret = state.buffer.concat(state.length);
          state.buffer.clear();
        } else {
          ret = state.buffer.consume(n, state.decoder);
        }
        return ret;
      }
      function endReadable(stream) {
        const state = stream._readableState;
        debug("endReadable", state.endEmitted);
        if (!state.endEmitted) {
          state.ended = true;
          process2.nextTick(endReadableNT, state, stream);
        }
      }
      function endReadableNT(state, stream) {
        debug("endReadableNT", state.endEmitted, state.length);
        if (!state.errored && !state.closeEmitted && !state.endEmitted && state.length === 0) {
          state.endEmitted = true;
          stream.emit("end");
          if (stream.writable && stream.allowHalfOpen === false) {
            process2.nextTick(endWritableNT, stream);
          } else if (state.autoDestroy) {
            const wState = stream._writableState;
            const autoDestroy = !wState || wState.autoDestroy && // We don't expect the writable to ever 'finish'
            // if writable is explicitly set to false.
            (wState.finished || wState.writable === false);
            if (autoDestroy) {
              stream.destroy();
            }
          }
        }
      }
      function endWritableNT(stream) {
        const writable = stream.writable && !stream.writableEnded && !stream.destroyed;
        if (writable) {
          stream.end();
        }
      }
      Readable.from = function(iterable, opts) {
        return from(Readable, iterable, opts);
      };
      var webStreamsAdapters;
      function lazyWebStreams() {
        if (webStreamsAdapters === void 0) webStreamsAdapters = {};
        return webStreamsAdapters;
      }
      Readable.fromWeb = function(readableStream, options) {
        return lazyWebStreams().newStreamReadableFromReadableStream(readableStream, options);
      };
      Readable.toWeb = function(streamReadable, options) {
        return lazyWebStreams().newReadableStreamFromStreamReadable(streamReadable, options);
      };
      Readable.wrap = function(src, options) {
        var _ref, _src$readableObjectMo;
        return new Readable({
          objectMode: (_ref = (_src$readableObjectMo = src.readableObjectMode) !== null && _src$readableObjectMo !== void 0 ? _src$readableObjectMo : src.objectMode) !== null && _ref !== void 0 ? _ref : true,
          ...options,
          destroy(err, callback) {
            destroyImpl.destroyer(src, err);
            callback(err);
          }
        }).wrap(src);
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/writable.js
  var require_writable = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/writable.js"(exports, module) {
      "use strict";
      var process2 = require_process();
      var {
        ArrayPrototypeSlice,
        Error: Error2,
        FunctionPrototypeSymbolHasInstance,
        ObjectDefineProperty,
        ObjectDefineProperties,
        ObjectSetPrototypeOf,
        StringPrototypeToLowerCase,
        Symbol: Symbol2,
        SymbolHasInstance
      } = require_primordials();
      module.exports = Writable;
      Writable.WritableState = WritableState;
      var { EventEmitter: EE } = require_events();
      var Stream = require_legacy().Stream;
      var { Buffer: Buffer2 } = require_buffer();
      var destroyImpl = require_destroy();
      var { addAbortSignal } = require_add_abort_signal();
      var { getHighWaterMark, getDefaultHighWaterMark } = require_state();
      var {
        ERR_INVALID_ARG_TYPE,
        ERR_METHOD_NOT_IMPLEMENTED,
        ERR_MULTIPLE_CALLBACK,
        ERR_STREAM_CANNOT_PIPE,
        ERR_STREAM_DESTROYED,
        ERR_STREAM_ALREADY_FINISHED,
        ERR_STREAM_NULL_VALUES,
        ERR_STREAM_WRITE_AFTER_END,
        ERR_UNKNOWN_ENCODING
      } = require_errors().codes;
      var { errorOrDestroy } = destroyImpl;
      ObjectSetPrototypeOf(Writable.prototype, Stream.prototype);
      ObjectSetPrototypeOf(Writable, Stream);
      function nop() {
      }
      var kOnFinished = Symbol2("kOnFinished");
      function WritableState(options, stream, isDuplex) {
        if (typeof isDuplex !== "boolean") isDuplex = stream instanceof require_duplex();
        this.objectMode = !!(options && options.objectMode);
        if (isDuplex) this.objectMode = this.objectMode || !!(options && options.writableObjectMode);
        this.highWaterMark = options ? getHighWaterMark(this, options, "writableHighWaterMark", isDuplex) : getDefaultHighWaterMark(false);
        this.finalCalled = false;
        this.needDrain = false;
        this.ending = false;
        this.ended = false;
        this.finished = false;
        this.destroyed = false;
        const noDecode = !!(options && options.decodeStrings === false);
        this.decodeStrings = !noDecode;
        this.defaultEncoding = options && options.defaultEncoding || "utf8";
        this.length = 0;
        this.writing = false;
        this.corked = 0;
        this.sync = true;
        this.bufferProcessing = false;
        this.onwrite = onwrite.bind(void 0, stream);
        this.writecb = null;
        this.writelen = 0;
        this.afterWriteTickInfo = null;
        resetBuffer(this);
        this.pendingcb = 0;
        this.constructed = true;
        this.prefinished = false;
        this.errorEmitted = false;
        this.emitClose = !options || options.emitClose !== false;
        this.autoDestroy = !options || options.autoDestroy !== false;
        this.errored = null;
        this.closed = false;
        this.closeEmitted = false;
        this[kOnFinished] = [];
      }
      function resetBuffer(state) {
        state.buffered = [];
        state.bufferedIndex = 0;
        state.allBuffers = true;
        state.allNoop = true;
      }
      WritableState.prototype.getBuffer = function getBuffer() {
        return ArrayPrototypeSlice(this.buffered, this.bufferedIndex);
      };
      ObjectDefineProperty(WritableState.prototype, "bufferedRequestCount", {
        __proto__: null,
        get() {
          return this.buffered.length - this.bufferedIndex;
        }
      });
      function Writable(options) {
        const isDuplex = this instanceof require_duplex();
        if (!isDuplex && !FunctionPrototypeSymbolHasInstance(Writable, this)) return new Writable(options);
        this._writableState = new WritableState(options, this, isDuplex);
        if (options) {
          if (typeof options.write === "function") this._write = options.write;
          if (typeof options.writev === "function") this._writev = options.writev;
          if (typeof options.destroy === "function") this._destroy = options.destroy;
          if (typeof options.final === "function") this._final = options.final;
          if (typeof options.construct === "function") this._construct = options.construct;
          if (options.signal) addAbortSignal(options.signal, this);
        }
        Stream.call(this, options);
        destroyImpl.construct(this, () => {
          const state = this._writableState;
          if (!state.writing) {
            clearBuffer(this, state);
          }
          finishMaybe(this, state);
        });
      }
      ObjectDefineProperty(Writable, SymbolHasInstance, {
        __proto__: null,
        value: function(object) {
          if (FunctionPrototypeSymbolHasInstance(this, object)) return true;
          if (this !== Writable) return false;
          return object && object._writableState instanceof WritableState;
        }
      });
      Writable.prototype.pipe = function() {
        errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
      };
      function _write(stream, chunk, encoding, cb) {
        const state = stream._writableState;
        if (typeof encoding === "function") {
          cb = encoding;
          encoding = state.defaultEncoding;
        } else {
          if (!encoding) encoding = state.defaultEncoding;
          else if (encoding !== "buffer" && !Buffer2.isEncoding(encoding)) throw new ERR_UNKNOWN_ENCODING(encoding);
          if (typeof cb !== "function") cb = nop;
        }
        if (chunk === null) {
          throw new ERR_STREAM_NULL_VALUES();
        } else if (!state.objectMode) {
          if (typeof chunk === "string") {
            if (state.decodeStrings !== false) {
              chunk = Buffer2.from(chunk, encoding);
              encoding = "buffer";
            }
          } else if (chunk instanceof Buffer2) {
            encoding = "buffer";
          } else if (Stream._isUint8Array(chunk)) {
            chunk = Stream._uint8ArrayToBuffer(chunk);
            encoding = "buffer";
          } else {
            throw new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
          }
        }
        let err;
        if (state.ending) {
          err = new ERR_STREAM_WRITE_AFTER_END();
        } else if (state.destroyed) {
          err = new ERR_STREAM_DESTROYED("write");
        }
        if (err) {
          process2.nextTick(cb, err);
          errorOrDestroy(stream, err, true);
          return err;
        }
        state.pendingcb++;
        return writeOrBuffer(stream, state, chunk, encoding, cb);
      }
      Writable.prototype.write = function(chunk, encoding, cb) {
        return _write(this, chunk, encoding, cb) === true;
      };
      Writable.prototype.cork = function() {
        this._writableState.corked++;
      };
      Writable.prototype.uncork = function() {
        const state = this._writableState;
        if (state.corked) {
          state.corked--;
          if (!state.writing) clearBuffer(this, state);
        }
      };
      Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
        if (typeof encoding === "string") encoding = StringPrototypeToLowerCase(encoding);
        if (!Buffer2.isEncoding(encoding)) throw new ERR_UNKNOWN_ENCODING(encoding);
        this._writableState.defaultEncoding = encoding;
        return this;
      };
      function writeOrBuffer(stream, state, chunk, encoding, callback) {
        const len = state.objectMode ? 1 : chunk.length;
        state.length += len;
        const ret = state.length < state.highWaterMark;
        if (!ret) state.needDrain = true;
        if (state.writing || state.corked || state.errored || !state.constructed) {
          state.buffered.push({
            chunk,
            encoding,
            callback
          });
          if (state.allBuffers && encoding !== "buffer") {
            state.allBuffers = false;
          }
          if (state.allNoop && callback !== nop) {
            state.allNoop = false;
          }
        } else {
          state.writelen = len;
          state.writecb = callback;
          state.writing = true;
          state.sync = true;
          stream._write(chunk, encoding, state.onwrite);
          state.sync = false;
        }
        return ret && !state.errored && !state.destroyed;
      }
      function doWrite(stream, state, writev, len, chunk, encoding, cb) {
        state.writelen = len;
        state.writecb = cb;
        state.writing = true;
        state.sync = true;
        if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED("write"));
        else if (writev) stream._writev(chunk, state.onwrite);
        else stream._write(chunk, encoding, state.onwrite);
        state.sync = false;
      }
      function onwriteError(stream, state, er, cb) {
        --state.pendingcb;
        cb(er);
        errorBuffer(state);
        errorOrDestroy(stream, er);
      }
      function onwrite(stream, er) {
        const state = stream._writableState;
        const sync = state.sync;
        const cb = state.writecb;
        if (typeof cb !== "function") {
          errorOrDestroy(stream, new ERR_MULTIPLE_CALLBACK());
          return;
        }
        state.writing = false;
        state.writecb = null;
        state.length -= state.writelen;
        state.writelen = 0;
        if (er) {
          er.stack;
          if (!state.errored) {
            state.errored = er;
          }
          if (stream._readableState && !stream._readableState.errored) {
            stream._readableState.errored = er;
          }
          if (sync) {
            process2.nextTick(onwriteError, stream, state, er, cb);
          } else {
            onwriteError(stream, state, er, cb);
          }
        } else {
          if (state.buffered.length > state.bufferedIndex) {
            clearBuffer(stream, state);
          }
          if (sync) {
            if (state.afterWriteTickInfo !== null && state.afterWriteTickInfo.cb === cb) {
              state.afterWriteTickInfo.count++;
            } else {
              state.afterWriteTickInfo = {
                count: 1,
                cb,
                stream,
                state
              };
              process2.nextTick(afterWriteTick, state.afterWriteTickInfo);
            }
          } else {
            afterWrite(stream, state, 1, cb);
          }
        }
      }
      function afterWriteTick({ stream, state, count, cb }) {
        state.afterWriteTickInfo = null;
        return afterWrite(stream, state, count, cb);
      }
      function afterWrite(stream, state, count, cb) {
        const needDrain = !state.ending && !stream.destroyed && state.length === 0 && state.needDrain;
        if (needDrain) {
          state.needDrain = false;
          stream.emit("drain");
        }
        while (count-- > 0) {
          state.pendingcb--;
          cb();
        }
        if (state.destroyed) {
          errorBuffer(state);
        }
        finishMaybe(stream, state);
      }
      function errorBuffer(state) {
        if (state.writing) {
          return;
        }
        for (let n = state.bufferedIndex; n < state.buffered.length; ++n) {
          var _state$errored;
          const { chunk, callback } = state.buffered[n];
          const len = state.objectMode ? 1 : chunk.length;
          state.length -= len;
          callback(
            (_state$errored = state.errored) !== null && _state$errored !== void 0 ? _state$errored : new ERR_STREAM_DESTROYED("write")
          );
        }
        const onfinishCallbacks = state[kOnFinished].splice(0);
        for (let i = 0; i < onfinishCallbacks.length; i++) {
          var _state$errored2;
          onfinishCallbacks[i](
            (_state$errored2 = state.errored) !== null && _state$errored2 !== void 0 ? _state$errored2 : new ERR_STREAM_DESTROYED("end")
          );
        }
        resetBuffer(state);
      }
      function clearBuffer(stream, state) {
        if (state.corked || state.bufferProcessing || state.destroyed || !state.constructed) {
          return;
        }
        const { buffered, bufferedIndex, objectMode } = state;
        const bufferedLength = buffered.length - bufferedIndex;
        if (!bufferedLength) {
          return;
        }
        let i = bufferedIndex;
        state.bufferProcessing = true;
        if (bufferedLength > 1 && stream._writev) {
          state.pendingcb -= bufferedLength - 1;
          const callback = state.allNoop ? nop : (err) => {
            for (let n = i; n < buffered.length; ++n) {
              buffered[n].callback(err);
            }
          };
          const chunks = state.allNoop && i === 0 ? buffered : ArrayPrototypeSlice(buffered, i);
          chunks.allBuffers = state.allBuffers;
          doWrite(stream, state, true, state.length, chunks, "", callback);
          resetBuffer(state);
        } else {
          do {
            const { chunk, encoding, callback } = buffered[i];
            buffered[i++] = null;
            const len = objectMode ? 1 : chunk.length;
            doWrite(stream, state, false, len, chunk, encoding, callback);
          } while (i < buffered.length && !state.writing);
          if (i === buffered.length) {
            resetBuffer(state);
          } else if (i > 256) {
            buffered.splice(0, i);
            state.bufferedIndex = 0;
          } else {
            state.bufferedIndex = i;
          }
        }
        state.bufferProcessing = false;
      }
      Writable.prototype._write = function(chunk, encoding, cb) {
        if (this._writev) {
          this._writev(
            [
              {
                chunk,
                encoding
              }
            ],
            cb
          );
        } else {
          throw new ERR_METHOD_NOT_IMPLEMENTED("_write()");
        }
      };
      Writable.prototype._writev = null;
      Writable.prototype.end = function(chunk, encoding, cb) {
        const state = this._writableState;
        if (typeof chunk === "function") {
          cb = chunk;
          chunk = null;
          encoding = null;
        } else if (typeof encoding === "function") {
          cb = encoding;
          encoding = null;
        }
        let err;
        if (chunk !== null && chunk !== void 0) {
          const ret = _write(this, chunk, encoding);
          if (ret instanceof Error2) {
            err = ret;
          }
        }
        if (state.corked) {
          state.corked = 1;
          this.uncork();
        }
        if (err) {
        } else if (!state.errored && !state.ending) {
          state.ending = true;
          finishMaybe(this, state, true);
          state.ended = true;
        } else if (state.finished) {
          err = new ERR_STREAM_ALREADY_FINISHED("end");
        } else if (state.destroyed) {
          err = new ERR_STREAM_DESTROYED("end");
        }
        if (typeof cb === "function") {
          if (err || state.finished) {
            process2.nextTick(cb, err);
          } else {
            state[kOnFinished].push(cb);
          }
        }
        return this;
      };
      function needFinish(state) {
        return state.ending && !state.destroyed && state.constructed && state.length === 0 && !state.errored && state.buffered.length === 0 && !state.finished && !state.writing && !state.errorEmitted && !state.closeEmitted;
      }
      function callFinal(stream, state) {
        let called = false;
        function onFinish(err) {
          if (called) {
            errorOrDestroy(stream, err !== null && err !== void 0 ? err : ERR_MULTIPLE_CALLBACK());
            return;
          }
          called = true;
          state.pendingcb--;
          if (err) {
            const onfinishCallbacks = state[kOnFinished].splice(0);
            for (let i = 0; i < onfinishCallbacks.length; i++) {
              onfinishCallbacks[i](err);
            }
            errorOrDestroy(stream, err, state.sync);
          } else if (needFinish(state)) {
            state.prefinished = true;
            stream.emit("prefinish");
            state.pendingcb++;
            process2.nextTick(finish, stream, state);
          }
        }
        state.sync = true;
        state.pendingcb++;
        try {
          stream._final(onFinish);
        } catch (err) {
          onFinish(err);
        }
        state.sync = false;
      }
      function prefinish(stream, state) {
        if (!state.prefinished && !state.finalCalled) {
          if (typeof stream._final === "function" && !state.destroyed) {
            state.finalCalled = true;
            callFinal(stream, state);
          } else {
            state.prefinished = true;
            stream.emit("prefinish");
          }
        }
      }
      function finishMaybe(stream, state, sync) {
        if (needFinish(state)) {
          prefinish(stream, state);
          if (state.pendingcb === 0) {
            if (sync) {
              state.pendingcb++;
              process2.nextTick(
                (stream2, state2) => {
                  if (needFinish(state2)) {
                    finish(stream2, state2);
                  } else {
                    state2.pendingcb--;
                  }
                },
                stream,
                state
              );
            } else if (needFinish(state)) {
              state.pendingcb++;
              finish(stream, state);
            }
          }
        }
      }
      function finish(stream, state) {
        state.pendingcb--;
        state.finished = true;
        const onfinishCallbacks = state[kOnFinished].splice(0);
        for (let i = 0; i < onfinishCallbacks.length; i++) {
          onfinishCallbacks[i]();
        }
        stream.emit("finish");
        if (state.autoDestroy) {
          const rState = stream._readableState;
          const autoDestroy = !rState || rState.autoDestroy && // We don't expect the readable to ever 'end'
          // if readable is explicitly set to false.
          (rState.endEmitted || rState.readable === false);
          if (autoDestroy) {
            stream.destroy();
          }
        }
      }
      ObjectDefineProperties(Writable.prototype, {
        closed: {
          __proto__: null,
          get() {
            return this._writableState ? this._writableState.closed : false;
          }
        },
        destroyed: {
          __proto__: null,
          get() {
            return this._writableState ? this._writableState.destroyed : false;
          },
          set(value) {
            if (this._writableState) {
              this._writableState.destroyed = value;
            }
          }
        },
        writable: {
          __proto__: null,
          get() {
            const w = this._writableState;
            return !!w && w.writable !== false && !w.destroyed && !w.errored && !w.ending && !w.ended;
          },
          set(val) {
            if (this._writableState) {
              this._writableState.writable = !!val;
            }
          }
        },
        writableFinished: {
          __proto__: null,
          get() {
            return this._writableState ? this._writableState.finished : false;
          }
        },
        writableObjectMode: {
          __proto__: null,
          get() {
            return this._writableState ? this._writableState.objectMode : false;
          }
        },
        writableBuffer: {
          __proto__: null,
          get() {
            return this._writableState && this._writableState.getBuffer();
          }
        },
        writableEnded: {
          __proto__: null,
          get() {
            return this._writableState ? this._writableState.ending : false;
          }
        },
        writableNeedDrain: {
          __proto__: null,
          get() {
            const wState = this._writableState;
            if (!wState) return false;
            return !wState.destroyed && !wState.ending && wState.needDrain;
          }
        },
        writableHighWaterMark: {
          __proto__: null,
          get() {
            return this._writableState && this._writableState.highWaterMark;
          }
        },
        writableCorked: {
          __proto__: null,
          get() {
            return this._writableState ? this._writableState.corked : 0;
          }
        },
        writableLength: {
          __proto__: null,
          get() {
            return this._writableState && this._writableState.length;
          }
        },
        errored: {
          __proto__: null,
          enumerable: false,
          get() {
            return this._writableState ? this._writableState.errored : null;
          }
        },
        writableAborted: {
          __proto__: null,
          enumerable: false,
          get: function() {
            return !!(this._writableState.writable !== false && (this._writableState.destroyed || this._writableState.errored) && !this._writableState.finished);
          }
        }
      });
      var destroy = destroyImpl.destroy;
      Writable.prototype.destroy = function(err, cb) {
        const state = this._writableState;
        if (!state.destroyed && (state.bufferedIndex < state.buffered.length || state[kOnFinished].length)) {
          process2.nextTick(errorBuffer, state);
        }
        destroy.call(this, err, cb);
        return this;
      };
      Writable.prototype._undestroy = destroyImpl.undestroy;
      Writable.prototype._destroy = function(err, cb) {
        cb(err);
      };
      Writable.prototype[EE.captureRejectionSymbol] = function(err) {
        this.destroy(err);
      };
      var webStreamsAdapters;
      function lazyWebStreams() {
        if (webStreamsAdapters === void 0) webStreamsAdapters = {};
        return webStreamsAdapters;
      }
      Writable.fromWeb = function(writableStream, options) {
        return lazyWebStreams().newStreamWritableFromWritableStream(writableStream, options);
      };
      Writable.toWeb = function(streamWritable) {
        return lazyWebStreams().newWritableStreamFromStreamWritable(streamWritable);
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/duplexify.js
  var require_duplexify = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/duplexify.js"(exports, module) {
      var process2 = require_process();
      var bufferModule = require_buffer();
      var {
        isReadable,
        isWritable,
        isIterable,
        isNodeStream,
        isReadableNodeStream,
        isWritableNodeStream,
        isDuplexNodeStream,
        isReadableStream,
        isWritableStream
      } = require_utils();
      var eos = require_end_of_stream();
      var {
        AbortError,
        codes: { ERR_INVALID_ARG_TYPE, ERR_INVALID_RETURN_VALUE }
      } = require_errors();
      var { destroyer } = require_destroy();
      var Duplex = require_duplex();
      var Readable = require_readable();
      var Writable = require_writable();
      var { createDeferredPromise } = require_util();
      var from = require_from();
      var Blob2 = globalThis.Blob || bufferModule.Blob;
      var isBlob = typeof Blob2 !== "undefined" ? function isBlob2(b) {
        return b instanceof Blob2;
      } : function isBlob2(b) {
        return false;
      };
      var AbortController2 = globalThis.AbortController || require_abort_controller().AbortController;
      var { FunctionPrototypeCall } = require_primordials();
      var Duplexify = class extends Duplex {
        constructor(options) {
          super(options);
          if ((options === null || options === void 0 ? void 0 : options.readable) === false) {
            this._readableState.readable = false;
            this._readableState.ended = true;
            this._readableState.endEmitted = true;
          }
          if ((options === null || options === void 0 ? void 0 : options.writable) === false) {
            this._writableState.writable = false;
            this._writableState.ending = true;
            this._writableState.ended = true;
            this._writableState.finished = true;
          }
        }
      };
      module.exports = function duplexify(body, name) {
        if (isDuplexNodeStream(body)) {
          return body;
        }
        if (isReadableNodeStream(body)) {
          return _duplexify({
            readable: body
          });
        }
        if (isWritableNodeStream(body)) {
          return _duplexify({
            writable: body
          });
        }
        if (isNodeStream(body)) {
          return _duplexify({
            writable: false,
            readable: false
          });
        }
        if (isReadableStream(body)) {
          return _duplexify({
            readable: Readable.fromWeb(body)
          });
        }
        if (isWritableStream(body)) {
          return _duplexify({
            writable: Writable.fromWeb(body)
          });
        }
        if (typeof body === "function") {
          const { value, write, final, destroy } = fromAsyncGen(body);
          if (isIterable(value)) {
            return from(Duplexify, value, {
              // TODO (ronag): highWaterMark?
              objectMode: true,
              write,
              final,
              destroy
            });
          }
          const then2 = value === null || value === void 0 ? void 0 : value.then;
          if (typeof then2 === "function") {
            let d;
            const promise = FunctionPrototypeCall(
              then2,
              value,
              (val) => {
                if (val != null) {
                  throw new ERR_INVALID_RETURN_VALUE("nully", "body", val);
                }
              },
              (err) => {
                destroyer(d, err);
              }
            );
            return d = new Duplexify({
              // TODO (ronag): highWaterMark?
              objectMode: true,
              readable: false,
              write,
              final(cb) {
                final(async () => {
                  try {
                    await promise;
                    process2.nextTick(cb, null);
                  } catch (err) {
                    process2.nextTick(cb, err);
                  }
                });
              },
              destroy
            });
          }
          throw new ERR_INVALID_RETURN_VALUE("Iterable, AsyncIterable or AsyncFunction", name, value);
        }
        if (isBlob(body)) {
          return duplexify(body.arrayBuffer());
        }
        if (isIterable(body)) {
          return from(Duplexify, body, {
            // TODO (ronag): highWaterMark?
            objectMode: true,
            writable: false
          });
        }
        if (isReadableStream(body === null || body === void 0 ? void 0 : body.readable) && isWritableStream(body === null || body === void 0 ? void 0 : body.writable)) {
          return Duplexify.fromWeb(body);
        }
        if (typeof (body === null || body === void 0 ? void 0 : body.writable) === "object" || typeof (body === null || body === void 0 ? void 0 : body.readable) === "object") {
          const readable = body !== null && body !== void 0 && body.readable ? isReadableNodeStream(body === null || body === void 0 ? void 0 : body.readable) ? body === null || body === void 0 ? void 0 : body.readable : duplexify(body.readable) : void 0;
          const writable = body !== null && body !== void 0 && body.writable ? isWritableNodeStream(body === null || body === void 0 ? void 0 : body.writable) ? body === null || body === void 0 ? void 0 : body.writable : duplexify(body.writable) : void 0;
          return _duplexify({
            readable,
            writable
          });
        }
        const then = body === null || body === void 0 ? void 0 : body.then;
        if (typeof then === "function") {
          let d;
          FunctionPrototypeCall(
            then,
            body,
            (val) => {
              if (val != null) {
                d.push(val);
              }
              d.push(null);
            },
            (err) => {
              destroyer(d, err);
            }
          );
          return d = new Duplexify({
            objectMode: true,
            writable: false,
            read() {
            }
          });
        }
        throw new ERR_INVALID_ARG_TYPE(
          name,
          [
            "Blob",
            "ReadableStream",
            "WritableStream",
            "Stream",
            "Iterable",
            "AsyncIterable",
            "Function",
            "{ readable, writable } pair",
            "Promise"
          ],
          body
        );
      };
      function fromAsyncGen(fn) {
        let { promise, resolve } = createDeferredPromise();
        const ac = new AbortController2();
        const signal = ac.signal;
        const value = fn(
          (async function* () {
            while (true) {
              const _promise = promise;
              promise = null;
              const { chunk, done, cb } = await _promise;
              process2.nextTick(cb);
              if (done) return;
              if (signal.aborted)
                throw new AbortError(void 0, {
                  cause: signal.reason
                });
              ({ promise, resolve } = createDeferredPromise());
              yield chunk;
            }
          })(),
          {
            signal
          }
        );
        return {
          value,
          write(chunk, encoding, cb) {
            const _resolve = resolve;
            resolve = null;
            _resolve({
              chunk,
              done: false,
              cb
            });
          },
          final(cb) {
            const _resolve = resolve;
            resolve = null;
            _resolve({
              done: true,
              cb
            });
          },
          destroy(err, cb) {
            ac.abort();
            cb(err);
          }
        };
      }
      function _duplexify(pair) {
        const r = pair.readable && typeof pair.readable.read !== "function" ? Readable.wrap(pair.readable) : pair.readable;
        const w = pair.writable;
        let readable = !!isReadable(r);
        let writable = !!isWritable(w);
        let ondrain;
        let onfinish;
        let onreadable;
        let onclose;
        let d;
        function onfinished(err) {
          const cb = onclose;
          onclose = null;
          if (cb) {
            cb(err);
          } else if (err) {
            d.destroy(err);
          }
        }
        d = new Duplexify({
          // TODO (ronag): highWaterMark?
          readableObjectMode: !!(r !== null && r !== void 0 && r.readableObjectMode),
          writableObjectMode: !!(w !== null && w !== void 0 && w.writableObjectMode),
          readable,
          writable
        });
        if (writable) {
          eos(w, (err) => {
            writable = false;
            if (err) {
              destroyer(r, err);
            }
            onfinished(err);
          });
          d._write = function(chunk, encoding, callback) {
            if (w.write(chunk, encoding)) {
              callback();
            } else {
              ondrain = callback;
            }
          };
          d._final = function(callback) {
            w.end();
            onfinish = callback;
          };
          w.on("drain", function() {
            if (ondrain) {
              const cb = ondrain;
              ondrain = null;
              cb();
            }
          });
          w.on("finish", function() {
            if (onfinish) {
              const cb = onfinish;
              onfinish = null;
              cb();
            }
          });
        }
        if (readable) {
          eos(r, (err) => {
            readable = false;
            if (err) {
              destroyer(r, err);
            }
            onfinished(err);
          });
          r.on("readable", function() {
            if (onreadable) {
              const cb = onreadable;
              onreadable = null;
              cb();
            }
          });
          r.on("end", function() {
            d.push(null);
          });
          d._read = function() {
            while (true) {
              const buf = r.read();
              if (buf === null) {
                onreadable = d._read;
                return;
              }
              if (!d.push(buf)) {
                return;
              }
            }
          };
        }
        d._destroy = function(err, callback) {
          if (!err && onclose !== null) {
            err = new AbortError();
          }
          onreadable = null;
          ondrain = null;
          onfinish = null;
          if (onclose === null) {
            callback(err);
          } else {
            onclose = callback;
            destroyer(w, err);
            destroyer(r, err);
          }
        };
        return d;
      }
    }
  });

  // node_modules/readable-stream/lib/internal/streams/duplex.js
  var require_duplex = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/duplex.js"(exports, module) {
      "use strict";
      var {
        ObjectDefineProperties,
        ObjectGetOwnPropertyDescriptor,
        ObjectKeys,
        ObjectSetPrototypeOf
      } = require_primordials();
      module.exports = Duplex;
      var Readable = require_readable();
      var Writable = require_writable();
      ObjectSetPrototypeOf(Duplex.prototype, Readable.prototype);
      ObjectSetPrototypeOf(Duplex, Readable);
      {
        const keys = ObjectKeys(Writable.prototype);
        for (let i = 0; i < keys.length; i++) {
          const method = keys[i];
          if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
        }
      }
      function Duplex(options) {
        if (!(this instanceof Duplex)) return new Duplex(options);
        Readable.call(this, options);
        Writable.call(this, options);
        if (options) {
          this.allowHalfOpen = options.allowHalfOpen !== false;
          if (options.readable === false) {
            this._readableState.readable = false;
            this._readableState.ended = true;
            this._readableState.endEmitted = true;
          }
          if (options.writable === false) {
            this._writableState.writable = false;
            this._writableState.ending = true;
            this._writableState.ended = true;
            this._writableState.finished = true;
          }
        } else {
          this.allowHalfOpen = true;
        }
      }
      ObjectDefineProperties(Duplex.prototype, {
        writable: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writable")
        },
        writableHighWaterMark: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableHighWaterMark")
        },
        writableObjectMode: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableObjectMode")
        },
        writableBuffer: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableBuffer")
        },
        writableLength: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableLength")
        },
        writableFinished: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableFinished")
        },
        writableCorked: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableCorked")
        },
        writableEnded: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableEnded")
        },
        writableNeedDrain: {
          __proto__: null,
          ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableNeedDrain")
        },
        destroyed: {
          __proto__: null,
          get() {
            if (this._readableState === void 0 || this._writableState === void 0) {
              return false;
            }
            return this._readableState.destroyed && this._writableState.destroyed;
          },
          set(value) {
            if (this._readableState && this._writableState) {
              this._readableState.destroyed = value;
              this._writableState.destroyed = value;
            }
          }
        }
      });
      var webStreamsAdapters;
      function lazyWebStreams() {
        if (webStreamsAdapters === void 0) webStreamsAdapters = {};
        return webStreamsAdapters;
      }
      Duplex.fromWeb = function(pair, options) {
        return lazyWebStreams().newStreamDuplexFromReadableWritablePair(pair, options);
      };
      Duplex.toWeb = function(duplex) {
        return lazyWebStreams().newReadableWritablePairFromDuplex(duplex);
      };
      var duplexify;
      Duplex.from = function(body) {
        if (!duplexify) {
          duplexify = require_duplexify();
        }
        return duplexify(body, "body");
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/transform.js
  var require_transform = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/transform.js"(exports, module) {
      "use strict";
      var { ObjectSetPrototypeOf, Symbol: Symbol2 } = require_primordials();
      module.exports = Transform;
      var { ERR_METHOD_NOT_IMPLEMENTED } = require_errors().codes;
      var Duplex = require_duplex();
      var { getHighWaterMark } = require_state();
      ObjectSetPrototypeOf(Transform.prototype, Duplex.prototype);
      ObjectSetPrototypeOf(Transform, Duplex);
      var kCallback = Symbol2("kCallback");
      function Transform(options) {
        if (!(this instanceof Transform)) return new Transform(options);
        const readableHighWaterMark = options ? getHighWaterMark(this, options, "readableHighWaterMark", true) : null;
        if (readableHighWaterMark === 0) {
          options = {
            ...options,
            highWaterMark: null,
            readableHighWaterMark,
            // TODO (ronag): 0 is not optimal since we have
            // a "bug" where we check needDrain before calling _write and not after.
            // Refs: https://github.com/nodejs/node/pull/32887
            // Refs: https://github.com/nodejs/node/pull/35941
            writableHighWaterMark: options.writableHighWaterMark || 0
          };
        }
        Duplex.call(this, options);
        this._readableState.sync = false;
        this[kCallback] = null;
        if (options) {
          if (typeof options.transform === "function") this._transform = options.transform;
          if (typeof options.flush === "function") this._flush = options.flush;
        }
        this.on("prefinish", prefinish);
      }
      function final(cb) {
        if (typeof this._flush === "function" && !this.destroyed) {
          this._flush((er, data) => {
            if (er) {
              if (cb) {
                cb(er);
              } else {
                this.destroy(er);
              }
              return;
            }
            if (data != null) {
              this.push(data);
            }
            this.push(null);
            if (cb) {
              cb();
            }
          });
        } else {
          this.push(null);
          if (cb) {
            cb();
          }
        }
      }
      function prefinish() {
        if (this._final !== final) {
          final.call(this);
        }
      }
      Transform.prototype._final = final;
      Transform.prototype._transform = function(chunk, encoding, callback) {
        throw new ERR_METHOD_NOT_IMPLEMENTED("_transform()");
      };
      Transform.prototype._write = function(chunk, encoding, callback) {
        const rState = this._readableState;
        const wState = this._writableState;
        const length = rState.length;
        this._transform(chunk, encoding, (err, val) => {
          if (err) {
            callback(err);
            return;
          }
          if (val != null) {
            this.push(val);
          }
          if (wState.ended || // Backwards compat.
          length === rState.length || // Backwards compat.
          rState.length < rState.highWaterMark) {
            callback();
          } else {
            this[kCallback] = callback;
          }
        });
      };
      Transform.prototype._read = function() {
        if (this[kCallback]) {
          const callback = this[kCallback];
          this[kCallback] = null;
          callback();
        }
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/passthrough.js
  var require_passthrough = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/passthrough.js"(exports, module) {
      "use strict";
      var { ObjectSetPrototypeOf } = require_primordials();
      module.exports = PassThrough;
      var Transform = require_transform();
      ObjectSetPrototypeOf(PassThrough.prototype, Transform.prototype);
      ObjectSetPrototypeOf(PassThrough, Transform);
      function PassThrough(options) {
        if (!(this instanceof PassThrough)) return new PassThrough(options);
        Transform.call(this, options);
      }
      PassThrough.prototype._transform = function(chunk, encoding, cb) {
        cb(null, chunk);
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/pipeline.js
  var require_pipeline = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/pipeline.js"(exports, module) {
      var process2 = require_process();
      var { ArrayIsArray, Promise: Promise2, SymbolAsyncIterator, SymbolDispose } = require_primordials();
      var eos = require_end_of_stream();
      var { once } = require_util();
      var destroyImpl = require_destroy();
      var Duplex = require_duplex();
      var {
        aggregateTwoErrors,
        codes: {
          ERR_INVALID_ARG_TYPE,
          ERR_INVALID_RETURN_VALUE,
          ERR_MISSING_ARGS,
          ERR_STREAM_DESTROYED,
          ERR_STREAM_PREMATURE_CLOSE
        },
        AbortError
      } = require_errors();
      var { validateFunction, validateAbortSignal } = require_validators();
      var {
        isIterable,
        isReadable,
        isReadableNodeStream,
        isNodeStream,
        isTransformStream,
        isWebStream,
        isReadableStream,
        isReadableFinished
      } = require_utils();
      var AbortController2 = globalThis.AbortController || require_abort_controller().AbortController;
      var PassThrough;
      var Readable;
      var addAbortListener;
      function destroyer(stream, reading, writing) {
        let finished = false;
        stream.on("close", () => {
          finished = true;
        });
        const cleanup = eos(
          stream,
          {
            readable: reading,
            writable: writing
          },
          (err) => {
            finished = !err;
          }
        );
        return {
          destroy: (err) => {
            if (finished) return;
            finished = true;
            destroyImpl.destroyer(stream, err || new ERR_STREAM_DESTROYED("pipe"));
          },
          cleanup
        };
      }
      function popCallback(streams) {
        validateFunction(streams[streams.length - 1], "streams[stream.length - 1]");
        return streams.pop();
      }
      function makeAsyncIterable(val) {
        if (isIterable(val)) {
          return val;
        } else if (isReadableNodeStream(val)) {
          return fromReadable(val);
        }
        throw new ERR_INVALID_ARG_TYPE("val", ["Readable", "Iterable", "AsyncIterable"], val);
      }
      async function* fromReadable(val) {
        if (!Readable) {
          Readable = require_readable();
        }
        yield* Readable.prototype[SymbolAsyncIterator].call(val);
      }
      async function pumpToNode(iterable, writable, finish, { end }) {
        let error;
        let onresolve = null;
        const resume = (err) => {
          if (err) {
            error = err;
          }
          if (onresolve) {
            const callback = onresolve;
            onresolve = null;
            callback();
          }
        };
        const wait = () => new Promise2((resolve, reject) => {
          if (error) {
            reject(error);
          } else {
            onresolve = () => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            };
          }
        });
        writable.on("drain", resume);
        const cleanup = eos(
          writable,
          {
            readable: false
          },
          resume
        );
        try {
          if (writable.writableNeedDrain) {
            await wait();
          }
          for await (const chunk of iterable) {
            if (!writable.write(chunk)) {
              await wait();
            }
          }
          if (end) {
            writable.end();
            await wait();
          }
          finish();
        } catch (err) {
          finish(error !== err ? aggregateTwoErrors(error, err) : err);
        } finally {
          cleanup();
          writable.off("drain", resume);
        }
      }
      async function pumpToWeb(readable, writable, finish, { end }) {
        if (isTransformStream(writable)) {
          writable = writable.writable;
        }
        const writer = writable.getWriter();
        try {
          for await (const chunk of readable) {
            await writer.ready;
            writer.write(chunk).catch(() => {
            });
          }
          await writer.ready;
          if (end) {
            await writer.close();
          }
          finish();
        } catch (err) {
          try {
            await writer.abort(err);
            finish(err);
          } catch (err2) {
            finish(err2);
          }
        }
      }
      function pipeline(...streams) {
        return pipelineImpl(streams, once(popCallback(streams)));
      }
      function pipelineImpl(streams, callback, opts) {
        if (streams.length === 1 && ArrayIsArray(streams[0])) {
          streams = streams[0];
        }
        if (streams.length < 2) {
          throw new ERR_MISSING_ARGS("streams");
        }
        const ac = new AbortController2();
        const signal = ac.signal;
        const outerSignal = opts === null || opts === void 0 ? void 0 : opts.signal;
        const lastStreamCleanup = [];
        validateAbortSignal(outerSignal, "options.signal");
        function abort() {
          finishImpl(new AbortError());
        }
        addAbortListener = addAbortListener || require_util().addAbortListener;
        let disposable;
        if (outerSignal) {
          disposable = addAbortListener(outerSignal, abort);
        }
        let error;
        let value;
        const destroys = [];
        let finishCount = 0;
        function finish(err) {
          finishImpl(err, --finishCount === 0);
        }
        function finishImpl(err, final) {
          var _disposable;
          if (err && (!error || error.code === "ERR_STREAM_PREMATURE_CLOSE")) {
            error = err;
          }
          if (!error && !final) {
            return;
          }
          while (destroys.length) {
            destroys.shift()(error);
          }
          ;
          (_disposable = disposable) === null || _disposable === void 0 ? void 0 : _disposable[SymbolDispose]();
          ac.abort();
          if (final) {
            if (!error) {
              lastStreamCleanup.forEach((fn) => fn());
            }
            process2.nextTick(callback, error, value);
          }
        }
        let ret;
        for (let i = 0; i < streams.length; i++) {
          const stream = streams[i];
          const reading = i < streams.length - 1;
          const writing = i > 0;
          const end = reading || (opts === null || opts === void 0 ? void 0 : opts.end) !== false;
          const isLastStream = i === streams.length - 1;
          if (isNodeStream(stream)) {
            let onError2 = function(err) {
              if (err && err.name !== "AbortError" && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
                finish(err);
              }
            };
            var onError = onError2;
            if (end) {
              const { destroy, cleanup } = destroyer(stream, reading, writing);
              destroys.push(destroy);
              if (isReadable(stream) && isLastStream) {
                lastStreamCleanup.push(cleanup);
              }
            }
            stream.on("error", onError2);
            if (isReadable(stream) && isLastStream) {
              lastStreamCleanup.push(() => {
                stream.removeListener("error", onError2);
              });
            }
          }
          if (i === 0) {
            if (typeof stream === "function") {
              ret = stream({
                signal
              });
              if (!isIterable(ret)) {
                throw new ERR_INVALID_RETURN_VALUE("Iterable, AsyncIterable or Stream", "source", ret);
              }
            } else if (isIterable(stream) || isReadableNodeStream(stream) || isTransformStream(stream)) {
              ret = stream;
            } else {
              ret = Duplex.from(stream);
            }
          } else if (typeof stream === "function") {
            if (isTransformStream(ret)) {
              var _ret;
              ret = makeAsyncIterable((_ret = ret) === null || _ret === void 0 ? void 0 : _ret.readable);
            } else {
              ret = makeAsyncIterable(ret);
            }
            ret = stream(ret, {
              signal
            });
            if (reading) {
              if (!isIterable(ret, true)) {
                throw new ERR_INVALID_RETURN_VALUE("AsyncIterable", `transform[${i - 1}]`, ret);
              }
            } else {
              var _ret2;
              if (!PassThrough) {
                PassThrough = require_passthrough();
              }
              const pt = new PassThrough({
                objectMode: true
              });
              const then = (_ret2 = ret) === null || _ret2 === void 0 ? void 0 : _ret2.then;
              if (typeof then === "function") {
                finishCount++;
                then.call(
                  ret,
                  (val) => {
                    value = val;
                    if (val != null) {
                      pt.write(val);
                    }
                    if (end) {
                      pt.end();
                    }
                    process2.nextTick(finish);
                  },
                  (err) => {
                    pt.destroy(err);
                    process2.nextTick(finish, err);
                  }
                );
              } else if (isIterable(ret, true)) {
                finishCount++;
                pumpToNode(ret, pt, finish, {
                  end
                });
              } else if (isReadableStream(ret) || isTransformStream(ret)) {
                const toRead = ret.readable || ret;
                finishCount++;
                pumpToNode(toRead, pt, finish, {
                  end
                });
              } else {
                throw new ERR_INVALID_RETURN_VALUE("AsyncIterable or Promise", "destination", ret);
              }
              ret = pt;
              const { destroy, cleanup } = destroyer(ret, false, true);
              destroys.push(destroy);
              if (isLastStream) {
                lastStreamCleanup.push(cleanup);
              }
            }
          } else if (isNodeStream(stream)) {
            if (isReadableNodeStream(ret)) {
              finishCount += 2;
              const cleanup = pipe(ret, stream, finish, {
                end
              });
              if (isReadable(stream) && isLastStream) {
                lastStreamCleanup.push(cleanup);
              }
            } else if (isTransformStream(ret) || isReadableStream(ret)) {
              const toRead = ret.readable || ret;
              finishCount++;
              pumpToNode(toRead, stream, finish, {
                end
              });
            } else if (isIterable(ret)) {
              finishCount++;
              pumpToNode(ret, stream, finish, {
                end
              });
            } else {
              throw new ERR_INVALID_ARG_TYPE(
                "val",
                ["Readable", "Iterable", "AsyncIterable", "ReadableStream", "TransformStream"],
                ret
              );
            }
            ret = stream;
          } else if (isWebStream(stream)) {
            if (isReadableNodeStream(ret)) {
              finishCount++;
              pumpToWeb(makeAsyncIterable(ret), stream, finish, {
                end
              });
            } else if (isReadableStream(ret) || isIterable(ret)) {
              finishCount++;
              pumpToWeb(ret, stream, finish, {
                end
              });
            } else if (isTransformStream(ret)) {
              finishCount++;
              pumpToWeb(ret.readable, stream, finish, {
                end
              });
            } else {
              throw new ERR_INVALID_ARG_TYPE(
                "val",
                ["Readable", "Iterable", "AsyncIterable", "ReadableStream", "TransformStream"],
                ret
              );
            }
            ret = stream;
          } else {
            ret = Duplex.from(stream);
          }
        }
        if (signal !== null && signal !== void 0 && signal.aborted || outerSignal !== null && outerSignal !== void 0 && outerSignal.aborted) {
          process2.nextTick(abort);
        }
        return ret;
      }
      function pipe(src, dst, finish, { end }) {
        let ended = false;
        dst.on("close", () => {
          if (!ended) {
            finish(new ERR_STREAM_PREMATURE_CLOSE());
          }
        });
        src.pipe(dst, {
          end: false
        });
        if (end) {
          let endFn2 = function() {
            ended = true;
            dst.end();
          };
          var endFn = endFn2;
          if (isReadableFinished(src)) {
            process2.nextTick(endFn2);
          } else {
            src.once("end", endFn2);
          }
        } else {
          finish();
        }
        eos(
          src,
          {
            readable: true,
            writable: false
          },
          (err) => {
            const rState = src._readableState;
            if (err && err.code === "ERR_STREAM_PREMATURE_CLOSE" && rState && rState.ended && !rState.errored && !rState.errorEmitted) {
              src.once("end", finish).once("error", finish);
            } else {
              finish(err);
            }
          }
        );
        return eos(
          dst,
          {
            readable: false,
            writable: true
          },
          finish
        );
      }
      module.exports = {
        pipelineImpl,
        pipeline
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/compose.js
  var require_compose = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/compose.js"(exports, module) {
      "use strict";
      var { pipeline } = require_pipeline();
      var Duplex = require_duplex();
      var { destroyer } = require_destroy();
      var {
        isNodeStream,
        isReadable,
        isWritable,
        isWebStream,
        isTransformStream,
        isWritableStream,
        isReadableStream
      } = require_utils();
      var {
        AbortError,
        codes: { ERR_INVALID_ARG_VALUE, ERR_MISSING_ARGS }
      } = require_errors();
      var eos = require_end_of_stream();
      module.exports = function compose(...streams) {
        if (streams.length === 0) {
          throw new ERR_MISSING_ARGS("streams");
        }
        if (streams.length === 1) {
          return Duplex.from(streams[0]);
        }
        const orgStreams = [...streams];
        if (typeof streams[0] === "function") {
          streams[0] = Duplex.from(streams[0]);
        }
        if (typeof streams[streams.length - 1] === "function") {
          const idx = streams.length - 1;
          streams[idx] = Duplex.from(streams[idx]);
        }
        for (let n = 0; n < streams.length; ++n) {
          if (!isNodeStream(streams[n]) && !isWebStream(streams[n])) {
            continue;
          }
          if (n < streams.length - 1 && !(isReadable(streams[n]) || isReadableStream(streams[n]) || isTransformStream(streams[n]))) {
            throw new ERR_INVALID_ARG_VALUE(`streams[${n}]`, orgStreams[n], "must be readable");
          }
          if (n > 0 && !(isWritable(streams[n]) || isWritableStream(streams[n]) || isTransformStream(streams[n]))) {
            throw new ERR_INVALID_ARG_VALUE(`streams[${n}]`, orgStreams[n], "must be writable");
          }
        }
        let ondrain;
        let onfinish;
        let onreadable;
        let onclose;
        let d;
        function onfinished(err) {
          const cb = onclose;
          onclose = null;
          if (cb) {
            cb(err);
          } else if (err) {
            d.destroy(err);
          } else if (!readable && !writable) {
            d.destroy();
          }
        }
        const head = streams[0];
        const tail = pipeline(streams, onfinished);
        const writable = !!(isWritable(head) || isWritableStream(head) || isTransformStream(head));
        const readable = !!(isReadable(tail) || isReadableStream(tail) || isTransformStream(tail));
        d = new Duplex({
          // TODO (ronag): highWaterMark?
          writableObjectMode: !!(head !== null && head !== void 0 && head.writableObjectMode),
          readableObjectMode: !!(tail !== null && tail !== void 0 && tail.readableObjectMode),
          writable,
          readable
        });
        if (writable) {
          if (isNodeStream(head)) {
            d._write = function(chunk, encoding, callback) {
              if (head.write(chunk, encoding)) {
                callback();
              } else {
                ondrain = callback;
              }
            };
            d._final = function(callback) {
              head.end();
              onfinish = callback;
            };
            head.on("drain", function() {
              if (ondrain) {
                const cb = ondrain;
                ondrain = null;
                cb();
              }
            });
          } else if (isWebStream(head)) {
            const writable2 = isTransformStream(head) ? head.writable : head;
            const writer = writable2.getWriter();
            d._write = async function(chunk, encoding, callback) {
              try {
                await writer.ready;
                writer.write(chunk).catch(() => {
                });
                callback();
              } catch (err) {
                callback(err);
              }
            };
            d._final = async function(callback) {
              try {
                await writer.ready;
                writer.close().catch(() => {
                });
                onfinish = callback;
              } catch (err) {
                callback(err);
              }
            };
          }
          const toRead = isTransformStream(tail) ? tail.readable : tail;
          eos(toRead, () => {
            if (onfinish) {
              const cb = onfinish;
              onfinish = null;
              cb();
            }
          });
        }
        if (readable) {
          if (isNodeStream(tail)) {
            tail.on("readable", function() {
              if (onreadable) {
                const cb = onreadable;
                onreadable = null;
                cb();
              }
            });
            tail.on("end", function() {
              d.push(null);
            });
            d._read = function() {
              while (true) {
                const buf = tail.read();
                if (buf === null) {
                  onreadable = d._read;
                  return;
                }
                if (!d.push(buf)) {
                  return;
                }
              }
            };
          } else if (isWebStream(tail)) {
            const readable2 = isTransformStream(tail) ? tail.readable : tail;
            const reader = readable2.getReader();
            d._read = async function() {
              while (true) {
                try {
                  const { value, done } = await reader.read();
                  if (!d.push(value)) {
                    return;
                  }
                  if (done) {
                    d.push(null);
                    return;
                  }
                } catch {
                  return;
                }
              }
            };
          }
        }
        d._destroy = function(err, callback) {
          if (!err && onclose !== null) {
            err = new AbortError();
          }
          onreadable = null;
          ondrain = null;
          onfinish = null;
          if (onclose === null) {
            callback(err);
          } else {
            onclose = callback;
            if (isNodeStream(tail)) {
              destroyer(tail, err);
            }
          }
        };
        return d;
      };
    }
  });

  // node_modules/readable-stream/lib/internal/streams/operators.js
  var require_operators = __commonJS({
    "node_modules/readable-stream/lib/internal/streams/operators.js"(exports, module) {
      "use strict";
      var AbortController2 = globalThis.AbortController || require_abort_controller().AbortController;
      var {
        codes: { ERR_INVALID_ARG_VALUE, ERR_INVALID_ARG_TYPE, ERR_MISSING_ARGS, ERR_OUT_OF_RANGE },
        AbortError
      } = require_errors();
      var { validateAbortSignal, validateInteger, validateObject } = require_validators();
      var kWeakHandler = require_primordials().Symbol("kWeak");
      var kResistStopPropagation = require_primordials().Symbol("kResistStopPropagation");
      var { finished } = require_end_of_stream();
      var staticCompose = require_compose();
      var { addAbortSignalNoValidate } = require_add_abort_signal();
      var { isWritable, isNodeStream } = require_utils();
      var { deprecate } = require_util();
      var {
        ArrayPrototypePush,
        Boolean: Boolean2,
        MathFloor,
        Number: Number2,
        NumberIsNaN,
        Promise: Promise2,
        PromiseReject,
        PromiseResolve,
        PromisePrototypeThen,
        Symbol: Symbol2
      } = require_primordials();
      var kEmpty = Symbol2("kEmpty");
      var kEof = Symbol2("kEof");
      function compose(stream, options) {
        if (options != null) {
          validateObject(options, "options");
        }
        if ((options === null || options === void 0 ? void 0 : options.signal) != null) {
          validateAbortSignal(options.signal, "options.signal");
        }
        if (isNodeStream(stream) && !isWritable(stream)) {
          throw new ERR_INVALID_ARG_VALUE("stream", stream, "must be writable");
        }
        const composedStream = staticCompose(this, stream);
        if (options !== null && options !== void 0 && options.signal) {
          addAbortSignalNoValidate(options.signal, composedStream);
        }
        return composedStream;
      }
      function map(fn, options) {
        if (typeof fn !== "function") {
          throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
        }
        if (options != null) {
          validateObject(options, "options");
        }
        if ((options === null || options === void 0 ? void 0 : options.signal) != null) {
          validateAbortSignal(options.signal, "options.signal");
        }
        let concurrency = 1;
        if ((options === null || options === void 0 ? void 0 : options.concurrency) != null) {
          concurrency = MathFloor(options.concurrency);
        }
        let highWaterMark = concurrency - 1;
        if ((options === null || options === void 0 ? void 0 : options.highWaterMark) != null) {
          highWaterMark = MathFloor(options.highWaterMark);
        }
        validateInteger(concurrency, "options.concurrency", 1);
        validateInteger(highWaterMark, "options.highWaterMark", 0);
        highWaterMark += concurrency;
        return async function* map2() {
          const signal = require_util().AbortSignalAny(
            [options === null || options === void 0 ? void 0 : options.signal].filter(Boolean2)
          );
          const stream = this;
          const queue = [];
          const signalOpt = {
            signal
          };
          let next;
          let resume;
          let done = false;
          let cnt = 0;
          function onCatch() {
            done = true;
            afterItemProcessed();
          }
          function afterItemProcessed() {
            cnt -= 1;
            maybeResume();
          }
          function maybeResume() {
            if (resume && !done && cnt < concurrency && queue.length < highWaterMark) {
              resume();
              resume = null;
            }
          }
          async function pump() {
            try {
              for await (let val of stream) {
                if (done) {
                  return;
                }
                if (signal.aborted) {
                  throw new AbortError();
                }
                try {
                  val = fn(val, signalOpt);
                  if (val === kEmpty) {
                    continue;
                  }
                  val = PromiseResolve(val);
                } catch (err) {
                  val = PromiseReject(err);
                }
                cnt += 1;
                PromisePrototypeThen(val, afterItemProcessed, onCatch);
                queue.push(val);
                if (next) {
                  next();
                  next = null;
                }
                if (!done && (queue.length >= highWaterMark || cnt >= concurrency)) {
                  await new Promise2((resolve) => {
                    resume = resolve;
                  });
                }
              }
              queue.push(kEof);
            } catch (err) {
              const val = PromiseReject(err);
              PromisePrototypeThen(val, afterItemProcessed, onCatch);
              queue.push(val);
            } finally {
              done = true;
              if (next) {
                next();
                next = null;
              }
            }
          }
          pump();
          try {
            while (true) {
              while (queue.length > 0) {
                const val = await queue[0];
                if (val === kEof) {
                  return;
                }
                if (signal.aborted) {
                  throw new AbortError();
                }
                if (val !== kEmpty) {
                  yield val;
                }
                queue.shift();
                maybeResume();
              }
              await new Promise2((resolve) => {
                next = resolve;
              });
            }
          } finally {
            done = true;
            if (resume) {
              resume();
              resume = null;
            }
          }
        }.call(this);
      }
      function asIndexedPairs(options = void 0) {
        if (options != null) {
          validateObject(options, "options");
        }
        if ((options === null || options === void 0 ? void 0 : options.signal) != null) {
          validateAbortSignal(options.signal, "options.signal");
        }
        return async function* asIndexedPairs2() {
          let index = 0;
          for await (const val of this) {
            var _options$signal;
            if (options !== null && options !== void 0 && (_options$signal = options.signal) !== null && _options$signal !== void 0 && _options$signal.aborted) {
              throw new AbortError({
                cause: options.signal.reason
              });
            }
            yield [index++, val];
          }
        }.call(this);
      }
      async function some(fn, options = void 0) {
        for await (const unused of filter.call(this, fn, options)) {
          return true;
        }
        return false;
      }
      async function every(fn, options = void 0) {
        if (typeof fn !== "function") {
          throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
        }
        return !await some.call(
          this,
          async (...args) => {
            return !await fn(...args);
          },
          options
        );
      }
      async function find(fn, options) {
        for await (const result of filter.call(this, fn, options)) {
          return result;
        }
        return void 0;
      }
      async function forEach(fn, options) {
        if (typeof fn !== "function") {
          throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
        }
        async function forEachFn(value, options2) {
          await fn(value, options2);
          return kEmpty;
        }
        for await (const unused of map.call(this, forEachFn, options)) ;
      }
      function filter(fn, options) {
        if (typeof fn !== "function") {
          throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
        }
        async function filterFn(value, options2) {
          if (await fn(value, options2)) {
            return value;
          }
          return kEmpty;
        }
        return map.call(this, filterFn, options);
      }
      var ReduceAwareErrMissingArgs = class extends ERR_MISSING_ARGS {
        constructor() {
          super("reduce");
          this.message = "Reduce of an empty stream requires an initial value";
        }
      };
      async function reduce(reducer, initialValue, options) {
        var _options$signal2;
        if (typeof reducer !== "function") {
          throw new ERR_INVALID_ARG_TYPE("reducer", ["Function", "AsyncFunction"], reducer);
        }
        if (options != null) {
          validateObject(options, "options");
        }
        if ((options === null || options === void 0 ? void 0 : options.signal) != null) {
          validateAbortSignal(options.signal, "options.signal");
        }
        let hasInitialValue = arguments.length > 1;
        if (options !== null && options !== void 0 && (_options$signal2 = options.signal) !== null && _options$signal2 !== void 0 && _options$signal2.aborted) {
          const err = new AbortError(void 0, {
            cause: options.signal.reason
          });
          this.once("error", () => {
          });
          await finished(this.destroy(err));
          throw err;
        }
        const ac = new AbortController2();
        const signal = ac.signal;
        if (options !== null && options !== void 0 && options.signal) {
          const opts = {
            once: true,
            [kWeakHandler]: this,
            [kResistStopPropagation]: true
          };
          options.signal.addEventListener("abort", () => ac.abort(), opts);
        }
        let gotAnyItemFromStream = false;
        try {
          for await (const value of this) {
            var _options$signal3;
            gotAnyItemFromStream = true;
            if (options !== null && options !== void 0 && (_options$signal3 = options.signal) !== null && _options$signal3 !== void 0 && _options$signal3.aborted) {
              throw new AbortError();
            }
            if (!hasInitialValue) {
              initialValue = value;
              hasInitialValue = true;
            } else {
              initialValue = await reducer(initialValue, value, {
                signal
              });
            }
          }
          if (!gotAnyItemFromStream && !hasInitialValue) {
            throw new ReduceAwareErrMissingArgs();
          }
        } finally {
          ac.abort();
        }
        return initialValue;
      }
      async function toArray(options) {
        if (options != null) {
          validateObject(options, "options");
        }
        if ((options === null || options === void 0 ? void 0 : options.signal) != null) {
          validateAbortSignal(options.signal, "options.signal");
        }
        const result = [];
        for await (const val of this) {
          var _options$signal4;
          if (options !== null && options !== void 0 && (_options$signal4 = options.signal) !== null && _options$signal4 !== void 0 && _options$signal4.aborted) {
            throw new AbortError(void 0, {
              cause: options.signal.reason
            });
          }
          ArrayPrototypePush(result, val);
        }
        return result;
      }
      function flatMap(fn, options) {
        const values = map.call(this, fn, options);
        return async function* flatMap2() {
          for await (const val of values) {
            yield* val;
          }
        }.call(this);
      }
      function toIntegerOrInfinity(number) {
        number = Number2(number);
        if (NumberIsNaN(number)) {
          return 0;
        }
        if (number < 0) {
          throw new ERR_OUT_OF_RANGE("number", ">= 0", number);
        }
        return number;
      }
      function drop(number, options = void 0) {
        if (options != null) {
          validateObject(options, "options");
        }
        if ((options === null || options === void 0 ? void 0 : options.signal) != null) {
          validateAbortSignal(options.signal, "options.signal");
        }
        number = toIntegerOrInfinity(number);
        return async function* drop2() {
          var _options$signal5;
          if (options !== null && options !== void 0 && (_options$signal5 = options.signal) !== null && _options$signal5 !== void 0 && _options$signal5.aborted) {
            throw new AbortError();
          }
          for await (const val of this) {
            var _options$signal6;
            if (options !== null && options !== void 0 && (_options$signal6 = options.signal) !== null && _options$signal6 !== void 0 && _options$signal6.aborted) {
              throw new AbortError();
            }
            if (number-- <= 0) {
              yield val;
            }
          }
        }.call(this);
      }
      function take(number, options = void 0) {
        if (options != null) {
          validateObject(options, "options");
        }
        if ((options === null || options === void 0 ? void 0 : options.signal) != null) {
          validateAbortSignal(options.signal, "options.signal");
        }
        number = toIntegerOrInfinity(number);
        return async function* take2() {
          var _options$signal7;
          if (options !== null && options !== void 0 && (_options$signal7 = options.signal) !== null && _options$signal7 !== void 0 && _options$signal7.aborted) {
            throw new AbortError();
          }
          for await (const val of this) {
            var _options$signal8;
            if (options !== null && options !== void 0 && (_options$signal8 = options.signal) !== null && _options$signal8 !== void 0 && _options$signal8.aborted) {
              throw new AbortError();
            }
            if (number-- > 0) {
              yield val;
            }
            if (number <= 0) {
              return;
            }
          }
        }.call(this);
      }
      module.exports.streamReturningOperators = {
        asIndexedPairs: deprecate(asIndexedPairs, "readable.asIndexedPairs will be removed in a future version."),
        drop,
        filter,
        flatMap,
        map,
        take,
        compose
      };
      module.exports.promiseReturningOperators = {
        every,
        forEach,
        reduce,
        toArray,
        some,
        find
      };
    }
  });

  // node_modules/readable-stream/lib/stream/promises.js
  var require_promises = __commonJS({
    "node_modules/readable-stream/lib/stream/promises.js"(exports, module) {
      "use strict";
      var { ArrayPrototypePop, Promise: Promise2 } = require_primordials();
      var { isIterable, isNodeStream, isWebStream } = require_utils();
      var { pipelineImpl: pl } = require_pipeline();
      var { finished } = require_end_of_stream();
      require_stream();
      function pipeline(...streams) {
        return new Promise2((resolve, reject) => {
          let signal;
          let end;
          const lastArg = streams[streams.length - 1];
          if (lastArg && typeof lastArg === "object" && !isNodeStream(lastArg) && !isIterable(lastArg) && !isWebStream(lastArg)) {
            const options = ArrayPrototypePop(streams);
            signal = options.signal;
            end = options.end;
          }
          pl(
            streams,
            (err, value) => {
              if (err) {
                reject(err);
              } else {
                resolve(value);
              }
            },
            {
              signal,
              end
            }
          );
        });
      }
      module.exports = {
        finished,
        pipeline
      };
    }
  });

  // node_modules/readable-stream/lib/stream.js
  var require_stream = __commonJS({
    "node_modules/readable-stream/lib/stream.js"(exports, module) {
      "use strict";
      var { Buffer: Buffer2 } = require_buffer();
      var { ObjectDefineProperty, ObjectKeys, ReflectApply } = require_primordials();
      var {
        promisify: { custom: customPromisify }
      } = require_util();
      var { streamReturningOperators, promiseReturningOperators } = require_operators();
      var {
        codes: { ERR_ILLEGAL_CONSTRUCTOR }
      } = require_errors();
      var compose = require_compose();
      var { setDefaultHighWaterMark, getDefaultHighWaterMark } = require_state();
      var { pipeline } = require_pipeline();
      var { destroyer } = require_destroy();
      var eos = require_end_of_stream();
      var promises = require_promises();
      var utils = require_utils();
      var Stream = module.exports = require_legacy().Stream;
      Stream.isDestroyed = utils.isDestroyed;
      Stream.isDisturbed = utils.isDisturbed;
      Stream.isErrored = utils.isErrored;
      Stream.isReadable = utils.isReadable;
      Stream.isWritable = utils.isWritable;
      Stream.Readable = require_readable();
      for (const key of ObjectKeys(streamReturningOperators)) {
        let fn = function(...args) {
          if (new.target) {
            throw ERR_ILLEGAL_CONSTRUCTOR();
          }
          return Stream.Readable.from(ReflectApply(op, this, args));
        };
        const op = streamReturningOperators[key];
        ObjectDefineProperty(fn, "name", {
          __proto__: null,
          value: op.name
        });
        ObjectDefineProperty(fn, "length", {
          __proto__: null,
          value: op.length
        });
        ObjectDefineProperty(Stream.Readable.prototype, key, {
          __proto__: null,
          value: fn,
          enumerable: false,
          configurable: true,
          writable: true
        });
      }
      for (const key of ObjectKeys(promiseReturningOperators)) {
        let fn = function(...args) {
          if (new.target) {
            throw ERR_ILLEGAL_CONSTRUCTOR();
          }
          return ReflectApply(op, this, args);
        };
        const op = promiseReturningOperators[key];
        ObjectDefineProperty(fn, "name", {
          __proto__: null,
          value: op.name
        });
        ObjectDefineProperty(fn, "length", {
          __proto__: null,
          value: op.length
        });
        ObjectDefineProperty(Stream.Readable.prototype, key, {
          __proto__: null,
          value: fn,
          enumerable: false,
          configurable: true,
          writable: true
        });
      }
      Stream.Writable = require_writable();
      Stream.Duplex = require_duplex();
      Stream.Transform = require_transform();
      Stream.PassThrough = require_passthrough();
      Stream.pipeline = pipeline;
      var { addAbortSignal } = require_add_abort_signal();
      Stream.addAbortSignal = addAbortSignal;
      Stream.finished = eos;
      Stream.destroy = destroyer;
      Stream.compose = compose;
      Stream.setDefaultHighWaterMark = setDefaultHighWaterMark;
      Stream.getDefaultHighWaterMark = getDefaultHighWaterMark;
      ObjectDefineProperty(Stream, "promises", {
        __proto__: null,
        configurable: true,
        enumerable: true,
        get() {
          return promises;
        }
      });
      ObjectDefineProperty(pipeline, customPromisify, {
        __proto__: null,
        enumerable: true,
        get() {
          return promises.pipeline;
        }
      });
      ObjectDefineProperty(eos, customPromisify, {
        __proto__: null,
        enumerable: true,
        get() {
          return promises.finished;
        }
      });
      Stream.Stream = Stream;
      Stream._isUint8Array = function isUint8Array(value) {
        return value instanceof Uint8Array;
      };
      Stream._uint8ArrayToBuffer = function _uint8ArrayToBuffer(chunk) {
        return Buffer2.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      };
    }
  });

  // node_modules/readable-stream/lib/ours/browser.js
  var require_browser = __commonJS({
    "node_modules/readable-stream/lib/ours/browser.js"(exports, module) {
      "use strict";
      var CustomStream = require_stream();
      var promises = require_promises();
      var originalDestroy = CustomStream.Readable.destroy;
      module.exports = CustomStream.Readable;
      module.exports._uint8ArrayToBuffer = CustomStream._uint8ArrayToBuffer;
      module.exports._isUint8Array = CustomStream._isUint8Array;
      module.exports.isDisturbed = CustomStream.isDisturbed;
      module.exports.isErrored = CustomStream.isErrored;
      module.exports.isReadable = CustomStream.isReadable;
      module.exports.Readable = CustomStream.Readable;
      module.exports.Writable = CustomStream.Writable;
      module.exports.Duplex = CustomStream.Duplex;
      module.exports.Transform = CustomStream.Transform;
      module.exports.PassThrough = CustomStream.PassThrough;
      module.exports.addAbortSignal = CustomStream.addAbortSignal;
      module.exports.finished = CustomStream.finished;
      module.exports.destroy = CustomStream.destroy;
      module.exports.destroy = originalDestroy;
      module.exports.pipeline = CustomStream.pipeline;
      module.exports.compose = CustomStream.compose;
      Object.defineProperty(CustomStream, "promises", {
        configurable: true,
        enumerable: true,
        get() {
          return promises;
        }
      });
      module.exports.Stream = CustomStream.Stream;
      module.exports.default = module.exports;
    }
  });

  // index.js
  var require_index = __commonJS({
    "index.js"() {
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
      var RS = require_browser();
      globalThis.__readableStream = RS;
      (function() {
        var Readable = RS.Readable;
        var stdin = new Readable({
          read: function() {
          }
        });
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
        var Writable = RS.Writable;
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
        var Writable = RS.Writable;
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
      if (typeof globalThis.Event === "undefined") {
        let Event2 = function(type, options) {
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
        Event = Event2;
        Event2.prototype.preventDefault = function() {
          if (this.cancelable) this.defaultPrevented = true;
        };
        Event2.prototype.stopPropagation = function() {
        };
        Event2.prototype.stopImmediatePropagation = function() {
        };
        Event2.NONE = 0;
        Event2.CAPTURING_PHASE = 1;
        Event2.AT_TARGET = 2;
        Event2.BUBBLING_PHASE = 3;
        globalThis.Event = Event2;
      }
      var Event;
      if (typeof globalThis.EventTarget === "undefined") {
        let EventTarget2 = function() {
          this._listeners = {};
        };
        EventTarget = EventTarget2;
        EventTarget2.prototype.addEventListener = function(type, fn, options) {
          if (!fn) return;
          if (!this._listeners[type]) this._listeners[type] = [];
          var once = options && (options.once || options === true);
          this._listeners[type].push({ fn, once });
        };
        EventTarget2.prototype.removeEventListener = function(type, fn) {
          if (!this._listeners[type]) return;
          this._listeners[type] = this._listeners[type].filter(function(e) {
            return e.fn !== fn;
          });
        };
        EventTarget2.prototype.dispatchEvent = function(event) {
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
        globalThis.EventTarget = EventTarget2;
      }
      var EventTarget;
      if (typeof globalThis.CustomEvent === "undefined") {
        let CustomEvent2 = function(type, options) {
          Event.call(this, type, options);
          this.detail = options && options.detail !== void 0 ? options.detail : null;
        };
        CustomEvent = CustomEvent2;
        CustomEvent2.prototype = Object.create(Event.prototype);
        CustomEvent2.prototype.constructor = CustomEvent2;
        globalThis.CustomEvent = CustomEvent2;
      }
      var CustomEvent;
      if (typeof globalThis.Blob === "undefined") {
        globalThis.Blob = function Blob2(parts, options) {
          options = options || {};
          this.type = options.type || "";
          this._parts = parts || [];
          var size = 0;
          for (var i = 0; i < this._parts.length; i++) {
            var p = this._parts[i];
            if (typeof p === "string") size += p.length;
            else if (p instanceof ArrayBuffer) size += p.byteLength;
            else if (p instanceof Uint8Array) size += p.byteLength;
            else if (p instanceof Blob2) size += p.size;
          }
          this.size = size;
        };
        Blob.prototype.text = function() {
          var result = "";
          for (var i = 0; i < this._parts.length; i++) {
            if (typeof this._parts[i] === "string") result += this._parts[i];
          }
          return Promise.resolve(result);
        };
        Blob.prototype.arrayBuffer = function() {
          return this.text().then(function(t) {
            return new TextEncoder().encode(t).buffer;
          });
        };
        Blob.prototype.slice = function(start, end, type) {
          return new Blob([], { type: type || this.type });
        };
        Blob.prototype.stream = function() {
          var blob = this;
          return new ReadableStream({
            start: function(controller) {
              blob.text().then(function(t) {
                controller.enqueue(new TextEncoder().encode(t));
                controller.close();
              });
            }
          });
        };
      }
      if (typeof globalThis.File === "undefined") {
        globalThis.File = function File2(parts, name, options) {
          Blob.call(this, parts, options);
          this.name = name;
          this.lastModified = options && options.lastModified || Date.now();
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
        let WebSocket2 = function(url) {
          EventTarget.call(this);
          this.url = url;
          this.readyState = WebSocket2.CONNECTING;
          this.protocol = "";
          this.extensions = "";
          this.binaryType = "blob";
          this.bufferedAmount = 0;
        };
        WebSocket = WebSocket2;
        WebSocket2.prototype = Object.create(EventTarget.prototype);
        WebSocket2.prototype.constructor = WebSocket2;
        WebSocket2.prototype.send = function() {
        };
        WebSocket2.prototype.close = function() {
          this.readyState = WebSocket2.CLOSED;
        };
        WebSocket2.CONNECTING = 0;
        WebSocket2.OPEN = 1;
        WebSocket2.CLOSING = 2;
        WebSocket2.CLOSED = 3;
        globalThis.WebSocket = WebSocket2;
      }
      var WebSocket;
      if (typeof globalThis.MessageChannel === "undefined") {
        let MessagePort2 = function() {
          EventTarget.call(this);
          this.onmessage = null;
        }, MessageChannel2 = function() {
          this.port1 = new MessagePort2();
          this.port2 = new MessagePort2();
          this.port1._other = this.port2;
          this.port2._other = this.port1;
        };
        MessagePort = MessagePort2, MessageChannel = MessageChannel2;
        MessagePort2.prototype = Object.create(EventTarget.prototype);
        MessagePort2.prototype.constructor = MessagePort2;
        MessagePort2.prototype.postMessage = function(data) {
          var self2 = this;
          if (self2._other && self2._other.onmessage) {
            Promise.resolve().then(function() {
              self2._other.onmessage({ data });
            });
          }
        };
        MessagePort2.prototype.start = function() {
        };
        MessagePort2.prototype.close = function() {
        };
        globalThis.MessagePort = MessagePort2;
        globalThis.MessageChannel = MessageChannel2;
      }
      var MessagePort;
      var MessageChannel;
      if (typeof globalThis.Worker === "undefined") {
        globalThis.Worker = function() {
          throw new Error("Worker is not supported in swift-bun");
        };
      }
      if (typeof globalThis.XMLHttpRequest === "undefined") {
        globalThis.XMLHttpRequest = function() {
          this.readyState = 0;
          this.status = 0;
        };
        XMLHttpRequest.prototype.open = function() {
        };
        XMLHttpRequest.prototype.send = function() {
        };
        XMLHttpRequest.prototype.setRequestHeader = function() {
        };
        XMLHttpRequest.prototype.abort = function() {
        };
      }
      if (typeof globalThis.crypto === "undefined") {
        globalThis.crypto = {
          getRandomValues: function(arr) {
            for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
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
            digest: function() {
              return Promise.resolve(new ArrayBuffer(32));
            },
            importKey: function() {
              return Promise.resolve({});
            },
            sign: function() {
              return Promise.resolve(new ArrayBuffer(32));
            },
            verify: function() {
              return Promise.resolve(true);
            },
            encrypt: function() {
              return Promise.resolve(new ArrayBuffer(0));
            },
            decrypt: function() {
              return Promise.resolve(new ArrayBuffer(0));
            }
          }
        };
      }
      if (typeof globalThis.structuredClone === "undefined") {
        globalThis.structuredClone = function(obj) {
          if (obj === void 0) return void 0;
          return JSON.parse(JSON.stringify(obj));
        };
      }
      if (typeof globalThis.navigator === "undefined") {
        globalThis.navigator = { userAgent: "swift-bun", platform: "darwin", language: "en", languages: ["en"] };
      }
      if (!Symbol.dispose) Symbol.dispose = /* @__PURE__ */ Symbol.for("Symbol.dispose");
      if (!Symbol.asyncDispose) Symbol.asyncDispose = /* @__PURE__ */ Symbol.for("Symbol.asyncDispose");
    }
  });
  require_index();
})();
/*! Bundled license information:

web-streams-polyfill/dist/polyfill.js:
  (**
   * @license
   * web-streams-polyfill v4.2.0
   * Copyright 2025 Mattias Buelens, Diwank Singh Tomer and other contributors.
   * This code is released under the MIT license.
   * SPDX-License-Identifier: MIT
   *)

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
