function Timer () {
    var self = this,

        timerLoopHandle,
        loopMilliseconds,
        callbacks = [],

        intervalHandler = function () {
            callbacks.forEach(function(callback) {
                callback({
                    loopMilliseconds: loopMilliseconds
                });
            });
        };


    self.setIntervalMilliseconds = function(milliseconds) {
        loopMilliseconds = milliseconds;
    };

    self.getIntervalMilliseconds = function () {
        return loopMilliseconds;
    };

    self.addCallback = function(callback) {
        callbacks.push(callback);
    };

    self.start = function () {
        timerLoopHandle = setInterval(function () {
            intervalHandler();
        }, loopMilliseconds);
    };

    self.stop = function () {
        clearInterval(timerLoopHandle);
    };
}
