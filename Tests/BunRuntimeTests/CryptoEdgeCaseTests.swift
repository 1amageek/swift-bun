import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Crypto Edge Cases", .serialized, .heartbeat)
struct CryptoEdgeCaseTests {
    private static let rsaPrivateKeyPEM = """
        -----BEGIN PRIVATE KEY-----
        MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDBYqJJLQue1DS+
        wmk0GZZ7L891cMBXUBkppu2QS6kKatuGShJgkiPGh/+j0WMLXR777huH/SoIJ8zz
        SLlyHFanHhKfNFweXcPl+VChR1V4ugn5Ffenuc9D9yqN0m5/Y0X1q9L4hXpSLju3
        j04fdoTFGayiyrU41zFZalnPsDQlBssPpILd+wU0e7g1JeI3T/KFB8hyoQ3Mwakc
        kKpElKyJ+CfpoKiON4nNqtEkb9A6/bJvSyTM+X1pKuf+FkignhgcuM3neMCa+UCT
        WSubvvpdZGjPaSIbhS6nPDOuma+sZaZKYnKhLh8porNmu88Pw5HiEpSb3t/IAzF0
        osOKgrUhAgMBAAECggEBAIT1jsSnDt1F43ngarqieR77MTT6r5OYg6Rqm91g17lM
        3OAIn3f8IlLGgJIeTW2rubjW7eDiw/pVewkt0CrPpxhBieYh9s/+AcllT/WC+RYH
        OwIiA2MzUnjVQFHAA67cD2aom2W5R++mz/IVuk3Ri9mEHHjUzCJneguTHmq4KDHn
        tmPMNBlvesW/IslO1oyrc22m5y2DtLdPIs3Pl/LjumViLADascj4egpzdkVlvC/I
        RAFt/J4TMQzupEtdXh99JZqld+ElZTxChbf3dhlNYpGIvNlr1Z+tIRMl6fMyZFsP
        Tbgc9iHG5F8172ur6F7HKt3MsBiRRSkJTcXrokOymz0CgYEA6p2TikbuwjmqPr6z
        R60I9dPsnQW5+tigENWuGU1MmuRqYYgXbzFGKwR85ZCeg7YONfevLcKlue934WlP
        RQ/0By4bTIyYHSOJxcogcxGp1WOFcilz/5rCifkoBGXcA0q+j2nIishrkORQHW89
        ux+h77NbW9aSYfD25HfZLp27sWsCgYEA0wMCAESIdmDixvAeKrtxyOkcpGANR8kG
        6JE65xUcZOKEoxClOWkQyGpkn2mvGVf23hrAd83cWDzNPRPWy1Bglmm7TSxT8PJA
        pcwkC7SlK2+yU/E6IULymgrynkJTGnw1rX7h2qCjejhsimyf96nMO22bKWak2F3J
        VDltxjiLuqMCgYBhBp/AnMsa2bw1TKpZ5w6Ak48T9Q1P1wyDSctBPX2DxRjVkvGW
        E3ugSK/aRG+5qq2/1dnFg+0DsywRtXqJ5ioWWhQCGVbDHjJY8NlwnQpubEUAzHHj
        cD4pzzekcfeGCQA70RSViIMrnbAgLCQMYe2XcsZCeb9576w7GfFgXO0FVwKBgCia
        pJDunx/AZwMHA5cPeMbDbLqIrSWKHmU0RRRgcJVNLV6/fju85vjZ2EEAsiv7TErS
        9QRYvbTRBmFhZuy6q8tlzx/7jq+Hvj7pOGp0OXBRTwxuF9R8sHhJ8QPZGWq4Sg/3
        oXhTfwGux9wfKO0cZGtvHPNrh/8GlQ46+s+w49pnAoGACAPTMWIJzdaH1f8BmKAh
        MJj0JD+Gva/zJtFKZBlrscEv0PfgTgJjafZM277zNJ5UDqXXBB+AJ0Yw8DsgP9ZT
        6mIqt2FogLpTx9yiMglWz2hOpftwOOHYopqCkgLhMVv8QRY7vex6ARHdSPnGYYfF
        wB9rqnxsk1qqq2kVIk2jR4Y=
        -----END PRIVATE KEY-----
        """

    @Test("SHA-256 of empty string")
    func sha256Empty() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHash('sha256').update('').digest('hex')
        """)
        #expect(result.stringValue == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    }

    @Test("SHA-512 produces correct length")
    func sha512Length() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHash('sha512').update('test').digest('hex').length
        """)
        #expect(result.int32Value == 128) // 64 bytes = 128 hex chars
    }

    @Test("HMAC-SHA256")
    func hmacSHA256() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHmac('sha256', 'secret').update('message').digest('hex')
        """)
        #expect(result.stringValue == "8b5f48702995c1598c573db1e21866a9b825d4a794d169d7060a03605796360b")
    }

    @Test("Hash chaining with multiple updates")
    func hashChaining() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var h = require('node:crypto').createHash('sha256');
            h.update('hello');
            h.update(' world');
            h.digest('hex');
        """)
        // sha256('hello world')
        #expect(result.stringValue == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9")
    }

    @Test("randomBytes returns correct length")
    func randomBytesLength() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').randomBytes(16).length
        """)
        #expect(result.int32Value == 16)
    }

    @Test("Unsupported hash algorithm throws")
    func unsupportedAlgorithm() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:crypto').createHash('md5').update('test').digest('hex')
            """)
        }
    }

    @Test("Hash digest base64 encoding")
    func hashBase64() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHash('sha256').update('hello').digest('base64')
        """)
        #expect(result.stringValue == "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=")
    }

    @Test("Hash update with Uint8Array binary data")
    func hashBinaryUpdate() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            // SHA-256 of bytes [0x00, 0x01, 0xFF] — known hash
            var data = new Uint8Array([0, 1, 255]);
            crypto.createHash('sha256').update(data).digest('hex');
        """)
        // SHA-256 of [0x00, 0x01, 0xFF] (verified with Node.js)
        #expect(result.stringValue == "26a66b061e8f48f39927c312f25293959729eee95978e2892d49d3512a5cc092")
    }

    @Test("HMAC with binary key and data")
    func hmacBinaryKeyData() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var key = new Uint8Array([1, 2, 3]);
            var data = new Uint8Array([4, 5, 6]);
            crypto.createHmac('sha256', key).update(data).digest('hex');
        """)
        #expect(result.stringValue == "52f0bd967282a27354acf04172d09644ad38d9411091496cd4b9e43c1b7eee15")
    }

    @Test("HMAC with unsupported algorithm throws")
    func hmacUnsupportedAlgorithm() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:crypto').createHmac('md5', 'key').update('data').digest('hex')
            """)
        }
    }

    @Test("randomInt returns value in range")
    func randomIntRange() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var results = [];
            for (var i = 0; i < 100; i++) {
                var v = crypto.randomInt(0, 10);
                if (v < 0 || v >= 10) results.push(v);
            }
            results.length === 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("randomInt with single argument uses 0 as min")
    func randomIntSingleArg() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var v = crypto.randomInt(1);
            v === 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("randomInt throws on invalid range")
    func randomIntInvalidRange() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:crypto').randomInt(5, 5)
            """)
        }
    }

    @Test("Hash update with mixed string and Uint8Array")
    func hashMixedUpdate() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var h = crypto.createHash('sha256');
            h.update('hello');
            h.update(new Uint8Array([0x00, 0xFF]));
            h.digest('hex');
        """)
        #expect(result.stringValue == "55dfc00c01f3ea84a2f1472b04669ad3ed588c04bad216e855f24fbe6a84822c")
    }

    @Test("createPrivateKey accepts PEM private keys")
    func createPrivateKeyPEM() async throws {
        let escapedPEM = Self.rsaPrivateKeyPEM
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "'", with: "\\'")
        let result = try await TestProcessSupport.evaluate("""
            (function() {
                var crypto = require('node:crypto');
                var key = crypto.createPrivateKey({ key: '\(escapedPEM)', format: 'pem' });
                return JSON.stringify({
                    type: key.type,
                    asymmetricKeyType: key.asymmetricKeyType,
                    instance: key instanceof crypto.KeyObject
                });
            })()
        """)
        #expect(result.stringValue == #"{"type":"private","asymmetricKeyType":"rsa","instance":true}"#)
    }
}
