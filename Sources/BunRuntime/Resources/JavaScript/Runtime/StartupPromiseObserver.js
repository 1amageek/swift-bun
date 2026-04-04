Promise.resolve(globalThis.__swiftBunStartupPromise).then(
    function() { __swiftStartupPromiseSettled(true, null); },
    function(error) {
        var message = null;
        if (error && typeof error === "object" && typeof error.message === "string") {
            message = error.message;
        } else if (typeof error !== "undefined") {
            message = String(error);
        }
        __swiftStartupPromiseSettled(false, message);
    }
);
