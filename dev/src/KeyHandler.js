function KeyHandler(options) {
    var self = this,

        enabled = true,
        keyPressed = new Array(256),
        flightControlKeys = [83, 87, 37, 39, 38, 40, 65, 68],
        handleFlight = options.handleFlight || function () { },
        handleKey = options.handleKey || function () { },
        keyInterval = options.keyInterval || 250,
        lastPressedKey = 0,
        lastPressedTime = 0,
        
        isFlightControlKey = function (key) {
            var i;

            for (i = 0; i < flightControlKeys.length; i++) {
                if (key === flightControlKeys[i]) {
                    return true;
                }
            }
            return false;
        },

        registerKey = function (event, isKeyDown) {
            var keyCode = event.which,
                isFlightControlKeyPressed,
                time;

            if (keyCode > 256) return;

            isFlightControlKeyPressed = enabled && isFlightControlKey(event.which);
            if (keyPressed[keyCode] === isKeyDown) {
                if (isFlightControlKeyPressed) {
                    event.preventDefault();
                }
                return;
            }

            time = (new Date()).getTime();
            keyPressed[keyCode] = isKeyDown;
            
            if (isFlightControlKeyPressed) {
                handleFlight(keyPressed);
                event.preventDefault();
            }

            if (isKeyDown) {
                lastPressedKey = keyCode;
                lastPressedTime = time;
            } else {
                if (    (keyCode === lastPressedKey)
                     && (time - lastPressedTime < keyInterval)) {
                     handleKey(keyCode);
                }
                lastPressedKey = 0;
            }
        },

        init = function () {
            var i;

            for (i = 0; i < 256; i++) {
                keyPressed[i] = false;
            }

            $(document).unbind("keydown").bind("keydown", function (event) {
                registerKey(event, true);
            });

            $(document).unbind("keyup").bind("keyup", function (event) {
                registerKey(event, false);
            });
        };

    self.enable = function () {
        enabled = true;
    };

    self.disable = function () {
        enabled = false;
    };

    init();
}
