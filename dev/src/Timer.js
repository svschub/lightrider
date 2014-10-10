function Timer () {
    var self = this,

        timerLoopHandle,
        loopMilliseconds,
        callbacks = [],
        isPaused = true,

        intervalHandler = function () {
            if (!isPaused) {
                callbacks.forEach(function(callback) {
                    callback({
                        loopMilliseconds: loopMilliseconds
                    });
                });
            }
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
        isPaused = false;
        timerLoopHandle = setInterval(function () {
            intervalHandler();
        }, loopMilliseconds);
    };

    self.stop = function () {
        clearInterval(timerLoopHandle);
    };

    self.pause = function () {
        isPaused = true;
    };

    self.restart = function () {
        isPaused = false;
    };

    self.isPaused = function () {
        return isPaused;  
    };
}
