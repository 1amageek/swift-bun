Promise.resolve(globalThis.__swiftBunStartupPromise).then(
    function() { __swiftStartupPromiseSettled(); },
    function() { __swiftStartupPromiseSettled(); }
);
