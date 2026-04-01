(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var swiftBunPackages = globalThis.__swiftBunPackages || {};

    if (swiftBunPackages.diagnosticsChannel) {
        __nodeModules.diagnostics_channel = swiftBunPackages.diagnosticsChannel;
        if (__nodeModules.diagnostics_channel.default === undefined) {
            __nodeModules.diagnostics_channel.default = __nodeModules.diagnostics_channel;
        }
        return;
    }

    var channels = {};

    function DiagnosticChannel(name) {
        this.name = name;
        this._subscribers = [];
    }
    Object.defineProperty(DiagnosticChannel.prototype, 'hasSubscribers', {
        enumerable: true,
        configurable: true,
        get: function() {
            return this._subscribers.length > 0;
        },
    });
    DiagnosticChannel.prototype.subscribe = function(listener) {
        if (typeof listener !== 'function') return;
        if (this._subscribers.indexOf(listener) === -1) {
            this._subscribers.push(listener);
        }
    };
    DiagnosticChannel.prototype.unsubscribe = function(listener) {
        this._subscribers = this._subscribers.filter(function(candidate) {
            return candidate !== listener;
        });
    };
    DiagnosticChannel.prototype.publish = function(message) {
        var current = this._subscribers.slice();
        for (var i = 0; i < current.length; i++) {
            current[i](message, this.name);
        }
    };

    var diagnosticsChannel = {
        channel: function(name) {
            var key = String(name);
            if (!channels[key]) {
                channels[key] = new DiagnosticChannel(key);
            }
            return channels[key];
        },
        hasSubscribers: function(name) {
            return this.channel(name).hasSubscribers;
        },
        subscribe: function(name, listener) {
            this.channel(name).subscribe(listener);
        },
        unsubscribe: function(name, listener) {
            this.channel(name).unsubscribe(listener);
        },
        Channel: DiagnosticChannel,
    };
    diagnosticsChannel.default = diagnosticsChannel;
    __nodeModules.diagnostics_channel = diagnosticsChannel;
})();
