(function ($) {
    'use strict';

    var renderer, world, plane,
        accelerationIncr, rollAngleIncr, pitchAngleIncr, yawAngleIncr,
        keyPressed,
        planeLoop,
        lookDownGroup,
        loopMilliseconds,
        beta, beta_next,
        dopplerShiftRescale, dopplerShiftRescale_next,
        boost;

    function initKeyboardEvents() {
        keyPressed = new Array(256);
        for (var i=0; i < 256; i++) {
            keyPressed[i] = false;
        }        
        $(window).bind("keydown", function (key) {
            if (key.which < 256) {
                keyPressed[key.which] = true;
            }
        });
        $(window).bind("keyup", function (key) {
            if (key.which < 256) {
                keyPressed[key.which] = false;
            }
        });
    }
    
    function initWorld() {
        var canvasWidth=1400, canvasHeight=800;
        
        boost = new BoostFactory();
        
        world = new World(boost);

        plane = new FlightModel(boost);
        plane.position = new THREE.Vector3(0,10,13);
        plane.observer.setViewport(canvasWidth, canvasHeight);
        world.add(plane.cabin);
        
        lookDownGroup = new LookDownGroup();
        world.add(lookDownGroup.mesh);
        
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(canvasWidth, canvasHeight);
        $("#renderContainer").append(renderer.domElement);
    
        accelerationIncr = 0.007;
        pitchAngleIncr = 0.022;
        rollAngleIncr = 0.03;
        yawAngleIncr = 0.02;
    }

    function movePlane() {
        var acceleration,rollAngle,pitchAngle,yawAngle;    

        acceleration = 0.0;
        if (keyPressed[109]) {  // -
            acceleration -= accelerationIncr;
        }
        if (keyPressed[107]) {  // + 
            acceleration += accelerationIncr;
        }
        plane.accelerate(acceleration);
        
        // Rollen:
        rollAngle = 0.0;
        if (keyPressed[37]) {  // left cursor
            rollAngle -= rollAngleIncr;
        }
        if (keyPressed[39]) {  // right cursor
            rollAngle += rollAngleIncr;
        }
        plane.roll(rollAngle);
        
        // Neigen:
        pitchAngle = 0.0;
        if (keyPressed[38]) {  // up cursor
            pitchAngle -= pitchAngleIncr;
        }
        if (keyPressed[40]) {  // down cursor
            pitchAngle += pitchAngleIncr;
        }
        plane.pitch(pitchAngle);
        
        // Gieren:
        yawAngle = 0.0;
        if (keyPressed[33]) {
            yawAngle += yawAngleIncr;
        }
        if (keyPressed[34]) {
            yawAngle -= yawAngleIncr;
        }
        plane.yaw(yawAngle);

        if (keyPressed[27]) {
            clearInterval(planeLoop);
        }
        
        plane.update();
    }

    function updateHudIndicators() {
         var speedMetersPerSecond=plane.getSpeed()*1000/loopMilliseconds,
            speedKmPerSecond=speedMetersPerSecond*3.6,
            viewConeAngle;
            
        if (beta < 0.1) {        
            $("#speed").html("spd " + speedKmPerSecond.toFixed(1) + " km/h");
        } else {
            $("#speed").html("spd " + beta.toFixed(4) + " c");
        }
        
        $("#altitude").html("alt " + plane.getAltitude().toFixed(1) + " m");

        viewConeAngle = 360*boost.referenceViewConeAngle/Math.PI;
        $("#viewConeAngle").html("fov " + viewConeAngle.toFixed(1) + " deg");
    }
    
    function render() {    
          var angles = plane.getAngles(),
            position = plane.getPosition();
            
        if (dopplerShiftRescale_next != dopplerShiftRescale) {
            dopplerShiftRescale = dopplerShiftRescale_next;
            boost.dopplerShiftTable.update({
                dopplerShiftRescale: dopplerShiftRescale,
            });
        }

        if (beta_next != beta) {
            beta = beta_next;
            boost.setBoostParameters(beta);
        }

        updateHudIndicators();
        
        lookDownGroup.setPosition(position);
        lookDownGroup.setViewAngle(angles);

        boost.disableBoost();
        setVisibility(lookDownGroup.mesh, true);
        setVisibility(plane.cabin, false);
        renderer.render(world.scene, lookDownGroup.camera, plane.cockpit.lookDownImage, true);
        
        boost.enableBoost();
        setVisibility(lookDownGroup.mesh, false);
        setVisibility(plane.cabin, true);
        renderer.render(world.scene, plane.observer.camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function init() {                
        initKeyboardEvents();
        initWorld();

        beta = -1000.0;
        beta_next = 0.0;
        
        var slider = new BetaSlider({
            halfScale: 0.9,
            handle: function (value) {
                beta_next = Math.min(value, 0.9999);
            },
        });
        
        $("#setDopplerEffect").attr('checked', false);
        $("#setDopplerEffect").click(function () {
            if ($(this).is(':checked')) {
                boost.enableDopplerEffect();
            } else {
                boost.disableDopplerEffect();
            };
        });

        dopplerShiftRescale = -1;
        dopplerShiftRescale_next = parseFloat( $("#dopplerShiftRescale").val() );
        
        $("#dopplerShiftRescale").bind("change", function () {
            dopplerShiftRescale_next = parseFloat( $("#dopplerShiftRescale").val() );
        });
        
        loopMilliseconds = 30;
        planeLoop = setInterval(movePlane, loopMilliseconds);
    }
    
    init();
    animate();
    
}(jQuery));
