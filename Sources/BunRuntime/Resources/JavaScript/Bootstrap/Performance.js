(function() {
    if (typeof globalThis.performance === 'undefined') {
        var timeOrigin = Date.now();
        var marks = {};
        var entries = [];
        globalThis.performance = {
            timeOrigin: timeOrigin,
            now: function() { return Date.now() - timeOrigin; },
            mark: function(name) {
                var t = performance.now();
                marks[name] = t;
                entries.push({ entryType: 'mark', name: name, startTime: t, duration: 0 });
            },
            measure: function(name, startMark, endMark) {
                var start = startMark && marks[startMark] !== undefined ? marks[startMark] : 0;
                var end = endMark && marks[endMark] !== undefined ? marks[endMark] : performance.now();
                entries.push({ entryType: 'measure', name: name, startTime: start, duration: end - start });
            },
            markResourceTiming: function(timingInfo, requestedUrl, initiatorType, global, cacheMode, bodyInfo, responseStatus, deliveryType) {
                var startTime = timingInfo && typeof timingInfo.startTime === 'number' ? timingInfo.startTime : performance.now();
                var duration = timingInfo && typeof timingInfo.duration === 'number' ? timingInfo.duration : 0;
                entries.push({
                    entryType: 'resource',
                    name: requestedUrl || '',
                    initiatorType: initiatorType || '',
                    startTime: startTime,
                    duration: duration,
                    responseStatus: typeof responseStatus === 'number' ? responseStatus : 0,
                    deliveryType: deliveryType || '',
                    cacheMode: cacheMode || '',
                    bodyInfo: bodyInfo || null,
                });
            },
            getEntries: function() { return entries.slice(); },
            getEntriesByName: function(name) {
                return entries.filter(function(entry) { return entry.name === name; });
            },
            getEntriesByType: function(type) {
                return entries.filter(function(entry) { return entry.entryType === type; });
            },
            clearMarks: function(name) {
                if (name) {
                    delete marks[name];
                    entries = entries.filter(function(entry) {
                        return !(entry.entryType === 'mark' && entry.name === name);
                    });
                } else {
                    marks = {};
                    entries = entries.filter(function(entry) { return entry.entryType !== 'mark'; });
                }
            },
            clearMeasures: function(name) {
                if (name) {
                    entries = entries.filter(function(entry) {
                        return !(entry.entryType === 'measure' && entry.name === name);
                    });
                } else {
                    entries = entries.filter(function(entry) { return entry.entryType !== 'measure'; });
                }
            },
        };
    }
})();
