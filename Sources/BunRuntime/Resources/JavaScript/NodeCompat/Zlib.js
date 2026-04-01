(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    function toBuffer(value) {
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value)) return value;
        if (value instanceof Uint8Array) return Buffer.from(value);
        if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
        if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
        if (typeof value === 'string') return Buffer.from(value, 'utf8');
        throw new TypeError('Unsupported zlib input');
    }

    var zlib = {
        createGzip: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        createGunzip: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        createDeflate: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        createInflate: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        gzipSync: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        gunzipSync: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        inflateSync: function(input) {
            var buffer = toBuffer(input);
            var result = __zlibInflateSync(Array.from(buffer));
            if (result && result.error) {
                throw new Error(result.error);
            }
            return Buffer.from(result.bytes || []);
        },
        deflateSync: function(input) {
            var buffer = toBuffer(input);
            var result = __zlibDeflateSync(Array.from(buffer));
            if (result && result.error) {
                throw new Error(result.error);
            }
            return Buffer.from(result.bytes || []);
        },
        constants: {
            Z_NO_FLUSH: 0,
            Z_PARTIAL_FLUSH: 1,
            Z_SYNC_FLUSH: 2,
            Z_FULL_FLUSH: 3,
            Z_FINISH: 4,
            Z_BLOCK: 5,
            Z_DEFAULT_COMPRESSION: -1,
            Z_DEFAULT_STRATEGY: 0,
            Z_DEFLATED: 8,
        },
    };
    zlib.default = zlib;
    __nodeModules.zlib = zlib;
})();
