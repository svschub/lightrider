
var plane, 
    renderer, 
    keyHandler,
    orientableDevice,
    slider, 
    firstFrame,
    paused,
    recentlyResized,
    orientationDetectionEnabled,
    isMobile;

function isMobileDevice() {
    var userAgent = navigator.userAgent;

    return (
       userAgent.match(/Android/i) || 
       userAgent.match(/webOS/i) || 
       userAgent.match(/iPhone/i) || 
       userAgent.match(/iPad/i) || 
       userAgent.match(/iPod/i) || 
       userAgent.match(/BlackBerry/i)|| 
       userAgent.match(/Windows Phone/i)
    );
}

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
        if (orientableDevice) {
            orientableDevice.registerPitchAngle0();
        }

        if (!orientableDevice || orientableDevice.isPanoramaView()) {
            cssDisplayValue = "none";
            paused = false;
            plane.setPaused(false);
            slider.enable();
        }
    } else {
        if (isMobile) {
            $('#mobileExplanations').css('display', 'block');
            $('#desktopExplanations').css('display', 'none');
        } else {
            $('#mobileExplanations').css('display', 'none');
            $('#desktopExplanations').css('display', 'block');
        }
        
        cssDisplayValue = "block";
        paused = true;
        plane.setPaused(true);
        slider.disable();
    }

    $("#lightbox").css("display", cssDisplayValue);
    $("#lightboxbackground").css("display", cssDisplayValue);
}

function initLightbox() {
    var touchTime = 0, touchTimePrevious;

    $("#lightbox .button > a").bind("click", function () {
        toggleLightbox();
    });

    $("#renderOverlay").on('dblclick', function () {
        toggleLightbox();
    });

    $("#renderOverlay").on('touchstart', function () {
        touchTimePrevious = touchTime;
        touchTime = Date.now();
        if (touchTime - touchTimePrevious < 300) {
            toggleLightbox();
        }
    });

    $("#dopplerForm").bind('submit', function () {
        return false;
    });

    $("#setDopplerEffect").attr('checked', false);
    $("#setDopplerEffect").bind('click', function () {
        var covariantMaterial = new CovariantMaterial();

        if ($(this).is(':checked')) {
            covariantMaterial.enableDopplerEffect();
        } else {
            covariantMaterial.disableDopplerEffect();
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

function initOrientableDevice() {
    orientationDetectionEnabled = false;

    orientableDevice = new OrientableDevice();

    orientableDevice.bindUpdateOrientationHandler(function(orientation) {
        // @todo orientation.angle, orientation.isPanoramaView
        /**
         * show warning message if in portrait mode
         */
    });

    orientableDevice.bindUpdateOrientationAnglesHandler(function(angles) {
        if (!paused && 
            orientationDetectionEnabled &&
            orientableDevice.isPanoramaView()) {
            plane.setPitchAngle(0.06*angles.boundedPitchAngle);
            plane.setRollAngle(-0.06*angles.boundedRollAngle);
        }
    });

    orientableDevice.bindUpdateSpeedHandler(function(acceleration) {
        if (!paused && 
            orientationDetectionEnabled &&
            orientableDevice.isPanoramaView()) {
            plane.setAcceleration(-0.2*acceleration);
            plane.resetAccelerationAfterUpdate();
        }
    });
}

function bindEvents() {
    if (isMobile) {
        initOrientableDevice();
    } else {
        initKeyHandler();
    }

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
        orientationDetectionEnabled = true;
    }
}

function init() {
    isMobile = isMobileDevice();

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
