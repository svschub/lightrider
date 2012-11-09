
function KeyHandler(options) {
    this.keyPressed = new Array(256);
    this.flightControlKeys = [83, 87, 37, 39, 38, 40, 65, 68],		

    this.handleFlight = options.handleFlight || this.emptyHandler;
	this.handleKey = options.handleKey || this.emptyHandler;
	this.keyInterval = options.keyInterval || 250;

	this.lastPressedKey = 0;
	this.lastPressedTime = 0;

    this.enable();

    this.init();
}

KeyHandler.prototype = {
    constructor: KeyHandler,

	isFlightControlKey: function (self, key) {
	    for (var i=0; i < self.flightControlKeys.length; i++) {
		    if (key === self.flightControlKeys[i]) {
			    return true;
			}
		}
		return false;
	},

    init: function () {
        var self = this, i;

        for (i = 0; i < 256; i++) {
            self.keyPressed[i] = false;
        }

		$(document).unbind("keydown").bind("keydown", function (event) {
	        self.registerKey(self, event, true);
        });

		$(document).unbind("keyup").bind("keyup", function (event) {
            self.registerKey(self, event, false);
        });
	},

	registerKey: function (self, event, keyPressed) {
	    var keyCode = event.which,
		    isFlightControlKeyPressed,
		    time;

		if (keyCode > 256) return;

		isFlightControlKeyPressed = self.enabled && self.isFlightControlKey(self, event.which);
		if (self.keyPressed[keyCode] === keyPressed) {
			if (isFlightControlKeyPressed) {
				event.preventDefault();
			}
 		    return;
        }

        time = (new Date()).getTime();		
        self.keyPressed[keyCode] = keyPressed;

        if (isFlightControlKeyPressed) {
			self.handleFlight(self.keyPressed);
	        event.preventDefault();
        }

	    if (keyPressed) {
		    self.lastPressedKey = keyCode;
			self.lastPressedTime = time;
		} else {
		    if (    (keyCode === self.lastPressedKey)
                 && (time - self.lastPressedTime < self.keyInterval)) {
				 self.handleKey(keyCode);
			}
			self.lastPressedKey = 0;
		}
	},

	enable: function () {
	    this.enabled = true;
	},

	disable: function () {
	    this.enabled = false;
	},
	
	emptyHandler: function () {
	}
};
