
var timer,
    plane, 
    renderer, 
    keyHandler,
    orientableDevice,
    betaSlider,
    dopplerCheckbox,
    firstFrame,
    paused,
    recentlyResized,
    orientationDetectionEnabled,
    isMobile;

function isMobileDevice () {
    return ($("#is_mobile_device").val() == 1);
}

function rescaleCopyrightMessage () {
    var copyrightFontSize = renderer.getWidgetScaleRatio() * 16;

    $("#grr").css("font-size", copyrightFontSize.toFixed(0) + "px");
}

function openSettingsBox () {
    paused = true;
    plane.stop();
    betaSlider.disable();

    $("#how_to_fly_instructions").removeClass("hidden");
    $("#center_mobile_device").addClass("hidden");

    $("#settings_box").css("display", "block");
    $("#settings_box_background").css("display", "block");
}

function closeSettingsBox () {
    $("#settings_box").css("display", "none");
    $("#settings_box_background").css("display", "none");

    paused = false;
    plane.start();
    betaSlider.enable();
}

function initSettingsBox () {
    $("#open_settings_box_button").bind("click", function(event) {
        event.preventDefault();

        openSettingsBox();
    });

    $("#center_mobile_device_button").bind("click", function(event) {
        event.preventDefault();

        $("#how_to_fly_instructions").addClass("hidden");
        $("#center_mobile_device").removeClass("hidden");
    });

    $("#take_off_button").bind("click", function(event) {
        event.preventDefault();

        if (orientableDevice) {
            if (orientableDevice.isPanoramaView()) {
                orientableDevice.registerPitchAngle0();
                closeSettingsBox(); 
            }
        } else {
            closeSettingsBox(); 
        }
    });
}

function loadSettingsBox() {
    var deferred = new $.Deferred(),
        touchTime = 0, 
        touchTimePrevious;

    $.ajax({
        url: '/Lightrider/Settings',
        type: 'GET',
        data: {
            is_mobile: isMobileDevice() ? 1 : 0
        },
        success: function(response) {
            $("#settings_box").html(response);

            initSettingsBox();

            deferred.resolve(response);
        },
        error: function(response) {
            deferred.reject(response);
        }
    });

    return deferred.promise();
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

function initWidgets() {
    var covariantMaterial = new CovariantMaterial();

    betaSlider = new BetaSlider({
        widgetScaleRatio: renderer.getWidgetScaleRatio(),
        halfScale: 0.9,
        handleBetaSlider: function(value) {
            renderer.setBeta(value);
        }
    });

    dopplerCheckbox = new DopplerCheckbox({
        widgetScaleRatio: renderer.getWidgetScaleRatio(),
        handleDopplerShiftRescaleSlider: function(value) {
            renderer.setDopplerShiftRescale(value);
        },
        enableDopplerEffectHandler: function () {
            covariantMaterial.enableDopplerEffect();
        },
        disableDopplerEffectHandler: function () {
            covariantMaterial.disableDopplerEffect();
        }
    });

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

function updateWidgets() {
    betaSlider.setWidgetScaleRatio(renderer.getWidgetScaleRatio());
    betaSlider.update();

    dopplerCheckbox.setWidgetScaleRatio(renderer.getWidgetScaleRatio());
    dopplerCheckbox.update();

    rescaleCopyrightMessage();
}

function animate() {
    requestAnimationFrame(animate);

    if (!paused || recentlyResized) {
        renderer.drawFrame();
        recentlyResized = false;
    }

    if (firstFrame) {
        openSettingsBox();
        firstFrame = false;
        orientationDetectionEnabled = true;
    }
}

function initRendererWindow() {
    isMobile = isMobileDevice();

    paused = false;
    recentlyResized = false;

    renderer = new Renderer();

    $.when(renderer.getPromise(), loadSettingsBox()).done(function () {
        console.log('DEBUG: main ready');

        $('#loading_page').css("display", "none");
        $('#loading_page').html('');

        $("#page").css("display", "block");

        initWidgets();
        updateWidgets();

        timer = new Timer();
        timer.setIntervalMilliseconds(30);

        plane = new FlightModel();
        plane.setIntervalMilliseconds(timer.getIntervalMilliseconds());
        plane.setPosition(new THREE.Vector3(0, 10, 13));
        plane.setMoveHandler(function(position) {
            if (position.y <= 0.0) {
                timer.stop();
                document.body.innerHTML = "";
                $(document).ready(function () {
                    alert("Crashed!");
                });
            }
        });

        renderer.setFlightModel(plane);

        renderer.setBeta(betaSlider.getBeta());
        renderer.setDopplerShiftRescale(dopplerCheckbox.getDopplerShiftRescaleValue());

        plane.start();
        plane.update();

        timer.addCallback(plane.update);
        timer.addCallback(dopplerCheckbox.hideDopplerShiftRescaleScrollbarIfNecessary);
        timer.start();

        firstFrame = true;
        animate();
    }).fail(function(error) {
        if (!Detector.webgl) {
            document.body.innerHTML = "";
            Detector.addGetWebGLMessage();
        } else {
            document.body.innerHTML = error;
        }    
    });
}

function initPreloader () {
    $('#loading_page').height($(window).height());
    $('#loading_icon').offset({
        top: 0.5*$(window).height() - 50,
        left: 0.5*$(window).width() - 50
    });

    $('#loading_page').css('display', 'block');
    
    $.ajax({
        url: '/Lightrider/RenderWindow',
        type: 'GET',
        data: {},
        success: function(response) {
            $('#page').html(response);
            $(document).ready(initRendererWindow);
        },
        error: function(response) {
        }
    });
}

$(document).ready(initPreloader);
