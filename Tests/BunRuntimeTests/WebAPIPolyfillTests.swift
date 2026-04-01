import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Web API Polyfills", .serialized, .heartbeat)
struct WebAPIPolyfillTests {
    private func evaluate(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluate(js: js)
        }
    }

    private func evaluateAsync(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluateAsync(js: js)
        }
    }

    private func withLoadedProcess<T: Sendable>(
        _ body: (BunProcess) async throws -> T
    ) async throws -> T {
        try await TestProcessSupport.withLoadedProcess(operation: body)
    }

    private func withServer(
        _ body: (String) async throws -> Void
    ) async throws {
        let server = try await LocalHTTPTestServer.start()
        do {
            try await body(server.baseURL)
            try await server.shutdown()
        } catch {
            do {
                try await server.shutdown()
            } catch {
            }
            throw error
        }
    }

    @Test("ReadableStream exists and is constructable")
    func readableStream() async throws {
        let result = try await evaluate("""
            var rs = new ReadableStream({
                start: function(controller) {
                    controller.enqueue('hello');
                    controller.close();
                }
            });
            typeof rs.getReader === 'function' && typeof rs.pipeTo === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("TransformStream exists")
    func transformStream() async throws {
        let result = try await evaluate("""
            var ts = new TransformStream();
            typeof ts.readable === 'object' && typeof ts.writable === 'object';
        """)
        #expect(result.boolValue == true)
    }

    @Test("TextDecoderStream decodes streamed UTF-8 chunks")
    func textDecoderStream() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var stream = new ReadableStream({
                    start: function(controller) {
                        controller.enqueue(new Uint8Array([0xE3, 0x81]));
                        controller.enqueue(new Uint8Array([0x82, 0xE3, 0x81, 0x84]));
                        controller.close();
                    }
                });
                var reader = stream.pipeThrough(new TextDecoderStream()).getReader();
                var text = '';
                while (true) {
                    var step = await reader.read();
                    if (step.done) break;
                    text += step.value;
                }
                return text;
            })()
        """)
        #expect(result.stringValue == "あい")
    }

    @Test("TextEncoder.encodeInto writes into destination")
    func textEncoderEncodeInto() async throws {
        let result = try await evaluate("""
            var encoder = new TextEncoder();
            var target = new Uint8Array(8);
            var outcome = encoder.encodeInto('hello', target);
            JSON.stringify({ read: outcome.read, written: outcome.written, bytes: Array.from(target.slice(0, 5)) });
        """)
        #expect(result.stringValue == #"{"read":5,"written":5,"bytes":[104,101,108,108,111]}"#)
    }

    @Test("AbortSignal.any adopts earliest abort reason")
    func abortSignalAny() async throws {
        let result = try await evaluate("""
            var first = new AbortController();
            var second = new AbortController();
            var combined = AbortSignal.any([first.signal, second.signal]);
            second.abort('later');
            first.abort('first');
            JSON.stringify({ aborted: combined.aborted, reason: combined.reason });
        """)
        #expect(result.stringValue == #"{"aborted":true,"reason":"later"}"#)
    }

    @Test("Event and EventTarget work")
    func eventTarget() async throws {
        let result = try await evaluate("""
            var received = '';
            var target = new EventTarget();
            target.addEventListener('test', function(e) { received = e.type; });
            target.dispatchEvent(new Event('test'));
            received;
        """)
        #expect(result.stringValue == "test")
    }

    @Test("CustomEvent carries detail")
    func customEvent() async throws {
        let result = try await evaluate("""
            var detail = null;
            var target = new EventTarget();
            target.addEventListener('msg', function(e) { detail = e.detail; });
            target.dispatchEvent(new CustomEvent('msg', { detail: 42 }));
            detail;
        """)
        #expect(result.int32Value == 42)
    }

    @Test("class extends EventTarget works")
    func extendsEventTarget() async throws {
        let result = try await evaluate("""
            class MyTarget extends EventTarget {
                constructor() { super(); this.x = 1; }
            }
            var t = new MyTarget();
            var ok = t.x === 1 && typeof t.addEventListener === 'function';
            ok;
        """)
        #expect(result.boolValue == true)
    }

    @Test("Blob size and type")
    func blob() async throws {
        let result = try await evaluate("""
            var b = new Blob(['hello', ' ', 'world'], { type: 'text/plain' });
            JSON.stringify({ size: b.size, type: b.type, instanceof: b instanceof Blob });
        """)
        #expect(result.stringValue == #"{"size":11,"type":"text/plain","instanceof":true}"#)
    }

    @Test("File extends Blob with name")
    func file() async throws {
        let result = try await evaluate("""
            var f = new File(['content'], 'test.txt', { type: 'text/plain', lastModified: 123 });
            JSON.stringify({ name: f.name, lastModified: f.lastModified, instanceof: f instanceof Blob });
        """)
        #expect(result.stringValue == #"{"name":"test.txt","lastModified":123,"instanceof":true}"#)
    }

    @Test("FormData append and get")
    func formData() async throws {
        let result = try await evaluate("""
            var fd = new FormData();
            fd.append('key', 'value');
            fd.append('key', 'value2');
            JSON.stringify({ get: fd.get('key'), all: fd.getAll('key'), has: fd.has('key') });
        """)
        #expect(result.stringValue == #"{"get":"value","all":["value","value2"],"has":true}"#)
    }

    @Test("MessageChannel exists")
    func messageChannel() async throws {
        let result = try await evaluate("""
            var ch = new MessageChannel();
            typeof ch.port1.postMessage === 'function' && typeof ch.port2.postMessage === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("structuredClone deep copies")
    func structuredClone() async throws {
        let result = try await evaluate("""
            var obj = { a: 1, b: { c: 2 } };
            var clone = structuredClone(obj);
            clone.b.c = 99;
            obj.b.c;
        """)
        #expect(result.int32Value == 2)
    }

    @Test("Blob slice preserves bytes and text")
    func blobSlice() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var blob = new Blob(['hello world'], { type: 'text/plain' });
                var sliced = blob.slice(6, 11);
                return JSON.stringify({
                    text: await sliced.text(),
                    size: sliced.size,
                    type: sliced.type
                });
            })()
        """)
        #expect(result.stringValue == #"{"text":"world","size":5,"type":"text/plain"}"#)
    }

    @Test("structuredClone preserves Date and typed arrays")
    func structuredCloneRichTypes() async throws {
        let result = try await evaluate("""
            var value = {
                date: new Date('2024-01-02T03:04:05.000Z'),
                bytes: new Uint8Array([1, 2, 3])
            };
            var clone = structuredClone(value);
            JSON.stringify({
                sameDate: clone.date instanceof Date && clone.date.toISOString() === value.date.toISOString(),
                sameBytes: clone.bytes instanceof Uint8Array && clone.bytes[1] === 2 && clone.bytes !== value.bytes
            });
        """)
        #expect(result.stringValue == #"{"sameDate":true,"sameBytes":true}"#)
    }

    @Test("structuredClone preserves cyclic objects")
    func structuredCloneCycles() async throws {
        let result = try await evaluate("""
            var obj = {};
            obj.self = obj;
            var clone = structuredClone(obj);
            clone !== obj && clone.self === clone;
        """)
        #expect(result.boolValue == true)
    }

    @Test("XMLHttpRequest GET text response")
    func xmlHttpRequestText() async throws {
        try await withServer { baseURL in
            let result = try await withLoadedProcess { p in
                try await p.evaluateAsync(js: """
                (async function() {
                    return await new Promise(function(resolve, reject) {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', '\(baseURL)/html');
                        xhr.onload = function() { resolve(xhr.responseText); };
                        xhr.onerror = function() { reject(new Error('xhr error')); };
                        xhr.send();
                    });
                })()
            """)
            }
            #expect(result.stringValue.contains("Herman Melville"))
        }
    }

    @Test("XMLHttpRequest JSON responseType")
    func xmlHttpRequestJSON() async throws {
        try await withServer { baseURL in
            let result = try await withLoadedProcess { p in
                try await p.evaluateAsync(js: """
                (async function() {
                    return await new Promise(function(resolve, reject) {
                        var xhr = new XMLHttpRequest();
                        xhr.responseType = 'json';
                        xhr.open('GET', '\(baseURL)/json');
                        xhr.onload = function() { resolve(xhr.response.slideshow.title); };
                        xhr.onerror = function() { reject(new Error('xhr error')); };
                        xhr.send();
                    });
                })()
            """)
            }
            #expect(result.stringValue == "Sample Slide Show")
        }
    }

    @Test("XMLHttpRequest abort emits abort and loadend")
    func xmlHttpRequestAbort() async throws {
        try await withServer { baseURL in
            let result = try await withLoadedProcess { p in
                try await p.evaluateAsync(js: """
                (async function() {
                    return await new Promise(function(resolve) {
                        var xhr = new XMLHttpRequest();
                        var events = [];
                        xhr.addEventListener('readystatechange', function() { events.push('state:' + xhr.readyState); });
                        xhr.addEventListener('abort', function() { events.push('abort'); });
                        xhr.addEventListener('loadend', function() { events.push('loadend'); resolve(events.join(',')); });
                        xhr.open('GET', '\(baseURL)/delay?ms=50');
                        xhr.send();
                        xhr.abort();
                    });
                })()
            """)
            }
            #expect(result.stringValue.contains("abort"))
            #expect(result.stringValue.contains("loadend"))
        }
    }

    @Test("crypto.getRandomValues fills array")
    func cryptoGetRandomValues() async throws {
        let result = try await evaluate("""
            var arr = new Uint8Array(4);
            crypto.getRandomValues(arr);
            arr.length === 4 && (arr[0] !== 0 || arr[1] !== 0 || arr[2] !== 0 || arr[3] !== 0);
        """)
        #expect(result.boolValue == true)
    }

    @Test("crypto.randomUUID returns valid format")
    func cryptoRandomUUID() async throws {
        let result = try await evaluate("""
            var uuid = crypto.randomUUID();
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid);
        """)
        #expect(result.boolValue == true)
    }

    @Test("Symbol.dispose exists")
    func symbolDispose() async throws {
        let result = try await evaluate("""
            typeof Symbol.dispose === 'symbol' && typeof Symbol.asyncDispose === 'symbol';
        """)
        #expect(result.boolValue == true)
    }

    @Test("navigator exists")
    func navigator() async throws {
        let result = try await evaluate("navigator.platform")
        #expect(result.stringValue == "darwin")
    }

    @Test("crypto.getRandomValues fills Uint32Array correctly")
    func cryptoGetRandomValuesUint32() async throws {
        let result = try await evaluate("""
            var arr = new Uint32Array(4);
            crypto.getRandomValues(arr);
            // Each element should be a full 32-bit value, not 0-255
            var hasLargeValue = false;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] > 255) hasLargeValue = true;
            }
            hasLargeValue;
        """)
        #expect(result.boolValue == true)
    }

    @Test("crypto.subtle.digest computes SHA-256")
    func cryptoSubtleDigest() async throws {
        let result = try await evaluateAsync("""
            crypto.subtle.digest('SHA-256', new Uint8Array([1,2,3]))
                .then(function(buffer) {
                    return Array.from(new Uint8Array(buffer)).map(function(byte) {
                        return ('0' + byte.toString(16)).slice(-2);
                    }).join('');
                });
        """)
        #expect(result.stringValue == "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81")
    }

    @Test("crypto.subtle imports HMAC key and signs/verifies")
    func cryptoSubtleHMAC() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var key = await crypto.subtle.importKey(
                    'raw',
                    new TextEncoder().encode('secret-key'),
                    { name: 'HMAC', hash: { name: 'SHA-256' } },
                    false,
                    ['sign', 'verify']
                );
                var data = new TextEncoder().encode('hello subtle');
                var signature = await crypto.subtle.sign({ name: 'HMAC' }, key, data);
                var verified = await crypto.subtle.verify({ name: 'HMAC' }, key, signature, data);
                return JSON.stringify({
                    type: key.type,
                    algorithm: key.algorithm.name,
                    usages: key.usages.join(','),
                    verified: verified,
                    signatureLength: new Uint8Array(signature).length
                });
            })()
        """)
        #expect(result.stringValue == #"{"type":"secret","algorithm":"HMAC","usages":"sign,verify","verified":true,"signatureLength":32}"#)
    }
}

// MARK: - Node.js polyfill additions
