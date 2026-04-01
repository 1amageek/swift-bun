(function() {
    if (typeof globalThis.URL !== 'undefined') return;

    function URL(url, base) {
        if (base) {
            if (!url.match(/^[a-z]+:/i)) {
                if (url.startsWith('/')) {
                    var baseMatch = base.match(/^([a-z]+:\/\/[^/]+)/i);
                    url = (baseMatch ? baseMatch[1] : '') + url;
                } else {
                    url = base.replace(/[^/]*$/, '') + url;
                }
            }
        }
        var match = url.match(/^([a-z]+:)\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:/?#]*)(?::(\d+))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/i);
        if (!match) {
            this.href = url;
            this.protocol = '';
            this.username = '';
            this.password = '';
            this.hostname = '';
            this.host = '';
            this.port = '';
            this.pathname = '/';
            this.search = '';
            this.hash = '';
            this.origin = '';
            this.searchParams = new URLSearchParams('');
            return;
        }
        this.protocol = match[1] || '';
        this.username = match[2] || '';
        this.password = match[3] || '';
        this.hostname = match[4] || '';
        this.port = match[5] || '';
        this.host = this.hostname + (this.port ? ':' + this.port : '');
        this.pathname = match[6] || '/';
        this.search = match[7] ? '?' + match[7] : '';
        this.hash = match[8] ? '#' + match[8] : '';
        this.origin = this.protocol + '//' + this.host;
        this.href = this.protocol + '//' +
            (this.username ? this.username + (this.password ? ':' + this.password : '') + '@' : '') +
            this.host + this.pathname + this.search + this.hash;
        this.searchParams = new URLSearchParams(match[7] || '');
    }
    URL.prototype.toString = function() { return this.href; };
    URL.prototype.toJSON = function() { return this.href; };

    function URLSearchParams(init) {
        this._params = [];
        if (typeof init === 'string') {
            var pairs = init.replace(/^\?/, '').split('&');
            for (var i = 0; i < pairs.length; i++) {
                if (!pairs[i]) continue;
                var kv = pairs[i].split('=');
                this._params.push([decodeURIComponent(kv[0]), decodeURIComponent(kv.slice(1).join('='))]);
            }
        }
    }
    URLSearchParams.prototype.get = function(name) {
        for (var i = 0; i < this._params.length; i++) {
            if (this._params[i][0] === name) return this._params[i][1];
        }
        return null;
    };
    URLSearchParams.prototype.has = function(name) { return this.get(name) !== null; };
    URLSearchParams.prototype.set = function(name, value) {
        for (var i = 0; i < this._params.length; i++) {
            if (this._params[i][0] === name) {
                this._params[i][1] = value;
                return;
            }
        }
        this._params.push([name, value]);
    };
    URLSearchParams.prototype.append = function(name, value) { this._params.push([name, value]); };
    URLSearchParams.prototype.delete = function(name) {
        this._params = this._params.filter(function(pair) { return pair[0] !== name; });
    };
    URLSearchParams.prototype.toString = function() {
        return this._params.map(function(pair) {
            return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]);
        }).join('&');
    };
    URLSearchParams.prototype.forEach = function(cb) {
        for (var i = 0; i < this._params.length; i++) {
            cb(this._params[i][1], this._params[i][0]);
        }
    };
    URLSearchParams.prototype.entries = function() { return this._params[Symbol.iterator](); };
    URLSearchParams.prototype[Symbol.iterator] = URLSearchParams.prototype.entries;

    globalThis.URL = URL;
    globalThis.URLSearchParams = URLSearchParams;
})();
