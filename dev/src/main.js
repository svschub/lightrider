
var mainLoop, keyHandler, slider, firstFrame;

function printCopyright() {
    var author, canvas, canvasPosition;

    $("#hudIndicators").after('<div id="grr" class="overlay mediumFont yellow">by Sven Schubert, 2012</div>');

    author = $("#grr");
    canvas = $("canvas");
    canvasPosition = canvas.position();

    author.offset({
        top: canvasPosition.top + canvas.height() - author.height() - 10,
        left: canvasPosition.left + canvas.width() - author.width() - 10
    });
}

function toggleLightbox() {
	var cssDisplayValue;

	if ($("#lightbox").css("display") === "block") {
	    cssDisplayValue = "none";
		mainLoop.restart();
		slider.enabled = true;
    } else {
	    cssDisplayValue = "block";
		mainLoop.pause();
		slider.enabled = false;
    }

	$("#lightbox").css("display", cssDisplayValue);
	$("#lightboxbackground").css("display", cssDisplayValue);
}

function initLightbox() {
	$("#lightbox .button > a").bind("click", function () {
		toggleLightbox();
	});

    $("#dopplerForm").bind('submit', function () {
        return false;
    });

    $("#setDopplerEffect").attr('checked', false);
    $("#setDopplerEffect").bind('click', function () {
        if ($(this).is(':checked')) {
            mainLoop.boost.enableDopplerEffect();
        } else {
            mainLoop.boost.disableDopplerEffect();
        }
    });

    $("#dopplerShiftRescale").bind('change', function () {
        mainLoop.setDopplerShiftRescale(parseFloat($(this).val()));
    });
    $("#dopplerShiftRescale").focus(function () {
        keyHandler.disable();
    });
    $("#dopplerShiftRescale").blur(function () {
        keyHandler.enable();
    });
}

function initKeyHandler() {
    keyHandler = new KeyHandler({
	    handleFlight: function (keyPressed) {
			mainLoop.plane.speedUp = keyPressed[87]; // w
			mainLoop.plane.speedDown = keyPressed[83]; // s

			mainLoop.plane.rollLeft = keyPressed[37];  // left cursor
			mainLoop.plane.rollRight = keyPressed[39];  // right cursor

			mainLoop.plane.pitchUp = keyPressed[40];  // arrow down
			mainLoop.plane.pitchDown = keyPressed[38];  // arrow up

			mainLoop.plane.yawLeft = keyPressed[65];  // a
			mainLoop.plane.yawRight = keyPressed[68];  // d
		},
		handleKey: function (keyCode) {
			if (keyCode === 27) {
			    toggleLightbox();
			}
		}
	});
}

function initWidgets() {
    slider = new BetaSlider({
        halfScale: 0.9,
        handle: function (value) {
            mainLoop.setBeta(value);
        }
    });

    initLightbox();
}

function animate() {
    requestAnimationFrame(animate);
    mainLoop.drawFrame();

	if (firstFrame) {
	    toggleLightbox();
	    firstFrame = false;
	}
}

function init() {
    mainLoop = new MainLoop();
    if (mainLoop.isRenderContextAvailable()) {
	    $("#page").css("display", "block");

	    initKeyHandler();
        initWidgets();
        printCopyright();

        mainLoop.start(30);

		firstFrame = true;
        animate();
    } else if (! Detector.webgl) {
		document.body.innerHTML = "";
		Detector.addGetWebGLMessage();
    } else {
	    document.body.innerHTML = "unknown error";
	}
}

$(document).ready(init);
