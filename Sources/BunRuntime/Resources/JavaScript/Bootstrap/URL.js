(function() {
    if (typeof globalThis.URL !== 'undefined') return;

    function encodeURLComponent(value) {
        return encodeURIComponent(String(value));
    }

    function parseURL(input, base) {
        var url = String(input);
        if (base && !/^[a-z]+:/i.test(url)) {
            var baseRecord = parseURL(base);
            if (url.startsWith('/')) {
                url = baseRecord.protocol + '//' + baseRecord.host + url;
            } else {
                var parentPath = baseRecord.pathname.replace(/[^/]*$/, '');
                url = baseRecord.protocol + '//' + baseRecord.host + parentPath + url;
            }
        }

        var match = url.match(/^([a-z]+:)\/\/(?:([^:@/?#]+)(?::([^@/?#]*))?@)?([^/?#:]*)(?::(\d+))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/i);
        if (!match) {
            return {
                protocol: '',
                username: '',
                password: '',
                hostname: '',
                port: '',
                pathname: '/',
                search: '',
                hash: '',
                host: ''
            };
        }

        var hostname = match[4] || '';
        var port = match[5] || '';
        return {
            protocol: match[1] || '',
            username: match[2] || '',
            password: match[3] || '',
            hostname: hostname,
            port: port,
            pathname: match[6] || '/',
            search: match[7] ? '?' + match[7] : '',
            hash: match[8] ? '#' + match[8] : '',
            host: hostname + (port ? ':' + port : '')
        };
    }

    function updateRecordHost(record) {
        record.host = record.hostname + (record.port ? ':' + record.port : '');
    }

    function hrefFromRecord(record) {
        var auth = record.username
            ? record.username + (record.password ? ':' + record.password : '') + '@'
            : '';
        return record.protocol + '//' + auth + record.host + (record.pathname || '/') + (record.search || '') + (record.hash || '');
    }

    function originFromRecord(record) {
        return record.protocol ? record.protocol + '//' + record.host : '';
    }

    function URL(url, base) {
        this._record = parseURL(url, base);
        this.searchParams = new URLSearchParams(this._record.search.replace(/^\?/, ''), this);
    }

    Object.defineProperties(URL.prototype, {
        protocol: {
            get: function() { return this._record.protocol; },
            set: function(value) {
                this._record.protocol = String(value || '');
                if (this._record.protocol && this._record.protocol.slice(-1) !== ':') {
                    this._record.protocol += ':';
                }
            }
        },
        username: {
            get: function() { return this._record.username; },
            set: function(value) { this._record.username = String(value || ''); }
        },
        password: {
            get: function() { return this._record.password; },
            set: function(value) { this._record.password = String(value || ''); }
        },
        host: {
            get: function() { return this._record.host; },
            set: function(value) {
                var parts = String(value || '').split(':');
                this._record.hostname = parts[0] || '';
                this._record.port = parts.length > 1 ? parts.slice(1).join(':') : '';
                updateRecordHost(this._record);
            }
        },
        hostname: {
            get: function() { return this._record.hostname; },
            set: function(value) {
                this._record.hostname = String(value || '');
                updateRecordHost(this._record);
            }
        },
        port: {
            get: function() { return this._record.port; },
            set: function(value) {
                this._record.port = String(value || '');
                updateRecordHost(this._record);
            }
        },
        pathname: {
            get: function() { return this._record.pathname; },
            set: function(value) {
                var next = String(value || '');
                this._record.pathname = next.startsWith('/') ? next : '/' + next;
            }
        },
        search: {
            get: function() { return this._record.search; },
            set: function(value) {
                var next = String(value || '');
                this._record.search = next ? (next.startsWith('?') ? next : '?' + next) : '';
                this.searchParams._replaceFromString(this._record.search.replace(/^\?/, ''), false);
            }
        },
        hash: {
            get: function() { return this._record.hash; },
            set: function(value) {
                var next = String(value || '');
                this._record.hash = next ? (next.startsWith('#') ? next : '#' + next) : '';
            }
        },
        origin: {
            get: function() { return originFromRecord(this._record); }
        },
        href: {
            get: function() { return hrefFromRecord(this._record); },
            set: function(value) {
                this._record = parseURL(value);
                this.searchParams._replaceFromString(this._record.search.replace(/^\?/, ''), false);
            }
        }
    });

    URL.prototype.toString = function() { return this.href; };
    URL.prototype.toJSON = function() { return this.href; };

    function URLSearchParams(init, owner) {
        this._params = [];
        this._owner = owner || null;
        this._replaceFromString(init || '', false);
    }

    URLSearchParams.prototype._replaceFromString = function(init, syncOwner) {
        this._params = [];
        if (typeof init === 'string' && init.length > 0) {
            var pairs = init.replace(/^\?/, '').split('&');
            for (var index = 0; index < pairs.length; index++) {
                if (!pairs[index]) continue;
                var kv = pairs[index].split('=');
                this._params.push([
                    decodeURIComponent(kv[0]),
                    decodeURIComponent(kv.slice(1).join('='))
                ]);
            }
        }
        if (syncOwner !== false && this._owner) {
            this._owner._record.search = this.toString();
            this._owner._record.search = this._owner._record.search ? '?' + this._owner._record.search : '';
        }
    };
    URLSearchParams.prototype.get = function(name) {
        for (var i = 0; i < this._params.length; i++) {
            if (this._params[i][0] === name) return this._params[i][1];
        }
        return null;
    };
    URLSearchParams.prototype.has = function(name) { return this.get(name) !== null; };
    URLSearchParams.prototype.set = function(name, value) {
        var found = false;
        for (var i = 0; i < this._params.length; i++) {
            if (this._params[i][0] === name) {
                if (!found) {
                    this._params[i][1] = String(value);
                    found = true;
                } else {
                    this._params.splice(i, 1);
                    i -= 1;
                }
            }
        }
        if (!found) this._params.push([name, String(value)]);
        if (this._owner) {
            this._owner._record.search = this.toString();
            this._owner._record.search = this._owner._record.search ? '?' + this._owner._record.search : '';
        }
    };
    URLSearchParams.prototype.append = function(name, value) {
        this._params.push([name, String(value)]);
        if (this._owner) {
            this._owner._record.search = this.toString();
            this._owner._record.search = this._owner._record.search ? '?' + this._owner._record.search : '';
        }
    };
    URLSearchParams.prototype.delete = function(name) {
        this._params = this._params.filter(function(pair) { return pair[0] !== name; });
        if (this._owner) {
            this._owner._record.search = this.toString();
            this._owner._record.search = this._owner._record.search ? '?' + this._owner._record.search : '';
        }
    };
    URLSearchParams.prototype.toString = function() {
        return this._params.map(function(pair) {
            return encodeURLComponent(pair[0]) + '=' + encodeURLComponent(pair[1]);
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
