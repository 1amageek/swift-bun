(function() {
    var url = {
        parse: function(urlStr) {
            try {
                var u = new URL(urlStr);
                return {
                    protocol: u.protocol,
                    hostname: u.hostname,
                    host: u.host,
                    port: u.port || null,
                    pathname: u.pathname,
                    search: u.search || null,
                    query: u.search ? u.search.slice(1) : null,
                    hash: u.hash || null,
                    href: u.href,
                    auth: u.username ? (u.username + (u.password ? ':' + u.password : '')) : null,
                    path: u.pathname + (u.search || ''),
                };
            } catch (e) {
                return { href: urlStr };
            }
        },
        format: function(obj) {
            if (typeof obj === 'string') return obj;
            var result = '';
            if (obj.protocol) result += obj.protocol + '//';
            if (obj.auth) result += obj.auth + '@';
            if (obj.hostname) result += obj.hostname;
            if (obj.port) result += ':' + obj.port;
            if (obj.pathname) result += obj.pathname;
            if (obj.search) result += obj.search;
            if (obj.hash) result += obj.hash;
            return result;
        },
        resolve: function(from, to) {
            return new URL(to, from).href;
        },
        URL: globalThis.URL,
        URLSearchParams: globalThis.URLSearchParams,
        fileURLToPath: function(urlValue) {
            if (typeof urlValue === 'string') {
                if (urlValue.startsWith('file://')) return decodeURIComponent(urlValue.slice(7));
                return urlValue;
            }
            return decodeURIComponent(urlValue.pathname);
        },
        pathToFileURL: function(p) {
            return new URL('file://' + encodeURI(p));
        },
    };

    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.url = url;
})();
