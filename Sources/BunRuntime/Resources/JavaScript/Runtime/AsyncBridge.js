globalThis.__swiftBunAwaitResult = function(value, token) {
    Promise.resolve(value).then(function(resolved) {
        __swiftResolveAsyncResult(token, resolved);
    }, function(error) {
        __swiftRejectAsyncResult(token, error);
    });
};

globalThis.__swiftBunSchedulePostTurnCheckpoint = function() {
    if (globalThis.__swiftBunPostTurnCheckpointPending) return;
    globalThis.__swiftBunPostTurnCheckpointPending = true;
    Promise.resolve().then(function() {
        globalThis.__swiftBunPostTurnCheckpointPending = false;
        __swiftPostTurnCheckpoint();
    });
};
