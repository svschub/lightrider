
var timer,
    flightModel, 
    renderer, 
    keyHandler,
    orientableDevice,
    betaSlider,
    dopplerCheckbox,
    recentlyResized,
    settingsBox,
    isMobile;

function isMobileDevice () {
    return ($("#is_mobile_device").val() == 1);
}

function rescaleCopyrightMessage () {
    var copyrightFontSize = renderer.getWidgetScaleRatio() * 16;

    $("#grr").css("font-size", copyrightFontSize.toFixed(0) + "px");
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
            flightModel.setAcceleration(acceleration);

            if (rollLeft) {
                rollAngle -= rollAngleIncr;
            }
            if (rollRight) {
                rollAngle += rollAngleIncr;
            }
            flightModel.setRollAngle(rollAngle);

            if (pitchUp) {
                pitchAngle += pitchAngleIncr;
            }
            if (pitchDown) {
                pitchAngle -= pitchAngleIncr;
            }
            flightModel.setPitchAngle(pitchAngle);

            if (yawLeft) {
                yawAngle += yawAngleIncr;
            }
            if (yawRight) {
                yawAngle -= yawAngleIncr;
            }
            flightModel.setYawAngle(yawAngle);
        },

        handleKey: function (keyCode) {
        }
    });
}

function initOrientableDevice() {
    orientableDevice = new OrientableDevice();

    orientableDevice.bindUpdateOrientationHandler(function(orientation) {
        var warningsContent = $("#warnings_content");

        if (!settingsBox.isOpen()) { 
            if (!orientableDevice.isPanoramaView()) {
                timer.pause();
                warningsContent.show();
            } else {
                warningsContent.hide();
                timer.restart();
            }
        }
    });

    orientableDevice.bindUpdateOrientationAnglesHandler(function(angles) {
        if (!timer.isPaused() && 
            orientableDevice.isPanoramaView()) {
            flightModel.setPitchAngle(0.06*angles.boundedPitchAngle);
            flightModel.setRollAngle(-0.06*angles.boundedRollAngle);
        }
    });

    orientableDevice.bindUpdateSpeedHandler(function(acceleration) {
        if (!timer.isPaused() && 
            orientableDevice.isPanoramaView()) {
            flightModel.setAcceleration(-0.2*acceleration);
            flightModel.resetAccelerationAfterUpdate();
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

    if (!timer.isPaused() || recentlyResized) {
        renderer.drawFrame();
        recentlyResized = false;
    }
}

function initRendererWindow() {
    isMobile = isMobileDevice();

    recentlyResized = false;

    renderer = new Renderer();

    $.when(renderer.getPromise()).then(function () {
//        console.log('main 1 ready');

        $('#loading_page').css("display", "none");
        $('#loading_page').html('');

        $("#page").css("display", "block");

        initWidgets();
        updateWidgets();

        timer = new Timer();
        timer.setIntervalMilliseconds(30);

        flightModel = new FlightModel();
        flightModel.setIntervalMilliseconds(timer.getIntervalMilliseconds());
        flightModel.setPosition(new THREE.Vector3(0, 10, 13));
        flightModel.setMoveHandler(function(position) {
            if (position.y <= 0.0) {
                timer.stop();
                document.body.innerHTML = "";
                $(document).ready(function () {
                    alert("Crashed!");
                });
            }
        });

        settingsBox = new SettingsBox({
            isMobileDevice: isMobileDevice(),
            orientableDevice: orientableDevice,
            openHandler: function () {
                timer.pause();
                betaSlider.disable();
                dopplerCheckbox.hideDopplerShiftRescaleScrollbar();
            },
            closeHandler: function () {
                timer.restart();
                betaSlider.enable();
            }
        });

        return settingsBox.getPromise();
    }).then(function () {
//        console.log('main 2 ready');

        renderer.setFlightModel(flightModel);

        renderer.setBeta(betaSlider.getBeta());
        renderer.setDopplerShiftRescale(dopplerCheckbox.getDopplerShiftRescaleValue());

        flightModel.update();
        renderer.drawFrame();

        timer.addCallback(flightModel.update);
        timer.addCallback(dopplerCheckbox.hideDopplerShiftRescaleScrollbarIfNecessary);
        timer.start();

        settingsBox.open();

        animate();
    }).fail(function(error) {
        if (!Detector.webgl) {
            document.body.innerHTML = "";
            Detector.addGetWebGLMessage();
        } else {
//            document.body.innerHTML = error;
            document.body.innerHTML = "unknown error";
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
