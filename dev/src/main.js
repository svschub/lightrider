
var plane, 
    renderer, 
    keyHandler, 
    slider, 
    firstFrame,
    paused,
    recentlyResized;

function updateCopyrightMessage() {
    var copyrightFontSize = renderer.getFontScaleRatio() * 16;

    $("#grr").css("font-size", copyrightFontSize.toFixed(0) + "px");
}

function updateHud() {
    var hudFontSize = renderer.getFontScaleRatio() * 24;
    
    $("#hudIndicators").css("font-size", hudFontSize.toFixed(0) + "px");
}

function toggleLightbox() {
    var cssDisplayValue;

    if ($("#lightbox").css("display") === "block") {
        cssDisplayValue = "none";
        paused = false;
        plane.setPaused(false);
        slider.enable();
    } else {
        cssDisplayValue = "block";
        paused = true;
        plane.setPaused(true);
        slider.disable();
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
            renderer.getBoost().enableDopplerEffect();
        } else {
            renderer.getBoost().disableDopplerEffect();
        }
    });

    $("#dopplerShiftRescale").bind('change', function () {
        renderer.setDopplerShiftRescale(parseFloat($(this).val()));
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
            var acceleration = 0.0, 
                accelerationIncr = 0.007,
                speedUp = keyPressed[87],    // w
                speedDown = keyPressed[83],  // s

                rollAngle = 0.0, 
                rollAngleIncr = 0.03,
                rollLeft = keyPressed[37],   // left cursor
                rollRight = keyPressed[39],  // right cursor

                pitchAngle = 0.0, 
                pitchAngleIncr = 0.022,
                pitchUp = keyPressed[40],    // arrow down
                pitchDown = keyPressed[38],  // arrow up

                yawAngle = 0.0, 
                yawAngleIncr = 0.02,
                yawLeft = keyPressed[65],    // a
                yawRight = keyPressed[68];   // d

            if (speedUp) {
                acceleration += accelerationIncr;
            }
            if (speedDown) {
                acceleration -= accelerationIncr;
            }
            plane.setAcceleration(acceleration);

            if (rollLeft) {
                rollAngle -= rollAngleIncr;
            }
            if (rollRight) {
                rollAngle += rollAngleIncr;
            }
            plane.setRollAngle(rollAngle);

            if (pitchUp) {
                pitchAngle += pitchAngleIncr;
            }
            if (pitchDown) {
                pitchAngle -= pitchAngleIncr;
            }
            plane.setPitchAngle(pitchAngle);

            if (yawLeft) {
                yawAngle += yawAngleIncr;
            }
            if (yawRight) {
                yawAngle -= yawAngleIncr;
            }
            plane.setYawAngle(yawAngle);
        },

        handleKey: function (keyCode) {
            if (keyCode === 27) {
                toggleLightbox();
            }
        }
    });
}

function bindEvents() {
    initKeyHandler();

    $(window).bind('resize', function () {
        renderer.updateViewport();

        updateWidgets();
        
        recentlyResized = true;
    });
}

function initWidgets() {
    slider = new BetaSlider({
        fontScaleRatio: renderer.getFontScaleRatio(),
        halfScale: 0.9,
        handle: function (value) {
            renderer.setBeta(value);
        }
    });

    initLightbox();
}

function updateWidgets() {
    slider.setFontScaleRatio(renderer.getFontScaleRatio());
    slider.update();

    updateHud();
    updateCopyrightMessage();
}

function animate() {
    requestAnimationFrame(animate);

    if (!paused || recentlyResized) {
        renderer.drawFrame();
        recentlyResized = false;
    }

    if (firstFrame) {
        toggleLightbox();
        firstFrame = false;
    }
}

function init() {
    paused = false;
    recentlyResized = false;

    renderer = new Renderer();
    if (renderer.isRenderContextAvailable()) {
        $("#page").css("display", "block");

        initWidgets();
        updateWidgets();
        
        bindEvents();

        plane = new FlightModel();
        plane.setPosition(new THREE.Vector3(0, 10, 13));
        plane.setMoveHandler(function (position) {
            if (position.y <= 0.0) {
                plane.stopLoop();
                document.body.innerHTML = "";
                $(document).ready(function () {
                    alert("Crashed!");
                });
            }
        });

        renderer.setFlightModel(plane);

        plane.startLoop(30);

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
