globalThis.__swiftBunAwaitResult = function(value, token) {
    Promise.resolve(value).then(function(resolved) {
        __swiftResolveAsyncResult(token, resolved);
    }, function(error) {
        __swiftRejectAsyncResult(token, error);
    });
};

globalThis.__swiftBunObserveCallbackResult = function(value, source) {
    Promise.resolve(value).then(function() {
        __swiftObservedCallbackSettled(source, true, null);
    }, function(error) {
        __swiftObservedCallbackSettled(source, false, error);
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
