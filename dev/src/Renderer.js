function Renderer() {
    var self = this,
    
        glRenderer,
        renderContextAvailable,

        boost,
        covariantMaterial,

        beta, beta_next,
        dopplerShiftRescale, dopplerShiftRescale_next,

        plane,
        world,
        cabin,
        observer,

        fontScaleRatio = 1,

        updateBoostParameters = function () {
            if (dopplerShiftRescale_next !== dopplerShiftRescale) {
                dopplerShiftRescale = dopplerShiftRescale_next;
                covariantMaterial.updateDopplerShiftRescale(dopplerShiftRescale);
            }

            if (beta_next !== beta) {
                beta = beta_next;
                boost.setBeta(beta);
                covariantMaterial.updateBoostParameters(boost);
            }
        },
  
        renderObserverView = function () {
            observer.setPosition(plane.getPosition());
            observer.setLookAtVector(plane.getLookAtVector());
            observer.setUpVector(plane.getYawAxis());
            observer.setAltitude(plane.getAltitude());
            observer.setAngles(plane.getAngles());
            observer.setSpeed(plane.getSpeed());

            observer.updateLookDownCamera();

            // render observer view:
            cabin.setPosition(plane.getPosition());
            cabin.setLookAtVector(plane.getLookAtVector());
            cabin.setUpVector(plane.getYawAxis());
            cabin.setAngles(plane.getAngles());
            cabin.update();

            observer.update();

            // render topview scene into cockpit display:
            glRenderer.render(world.getTopviewScene(), observer.getLookDownCamera(), cabin.getDisplayImage(), true);

            // render observer view into screen:
            glRenderer.render(world.getScene(), observer.getCamera());
        },

        calculateFontScaleRatio = function (canvasWidth, canvasHeight) {
            fontScaleRatio = Math.max(0.5, canvasHeight/600.0);
        },

        init = function () {
            glRenderer.setClearColor(0x446600, 1);

            boost = new Boost();
            covariantMaterial = new CovariantMaterial();

            world = new World();
            glRenderer.render(world.getScene(), world.getTopviewCamera(), world.getTopviewImage(), true);

            observer = new Observer();
            world.add(observer.getHorizonMesh());

            cabin = new Cabin();
            world.add(cabin.getMesh());

            beta = -1000.0;
            beta_next = 0.0;

            dopplerShiftRescale = -1;
            dopplerShiftRescale_next = parseFloat($("#dopplerShiftRescale").val());

            self.updateViewport();
        };
        

    self.isRenderContextAvailable = function () {
        return renderContextAvailable;
    };

    self.setFlightModel = function (flightmodel) {
        plane = flightmodel;
    };

    self.setBeta = function (beta) {
        beta_next = Math.min(beta, 0.9999);
    };

    self.setDopplerShiftRescale = function (dopplerShiftRescale) {
        dopplerShiftRescale_next = dopplerShiftRescale;
    };

    self.getFontScaleRatio = function () {
        return fontScaleRatio;
    };

    self.updateViewport = function () {
        var canvas = $("#renderContainer > canvas"),
            overlay = $("#renderOverlay"),
            windowWidth = $(window).width(),
            windowHeight = $(window).height(),
            maxRatio = 16.0/9.0,
            minRatio = 4.0/3.0,
            canvasWidth, 
            canvasHeight;

        if (windowWidth/windowHeight < minRatio) {
            canvasWidth = windowWidth;
            canvasHeight = windowWidth / minRatio;
        } else if (windowWidth/windowHeight > maxRatio) {
            canvasHeight = windowHeight;
            canvasWidth = windowHeight * maxRatio;
        } else {
            canvasWidth = windowWidth;
            canvasHeight = windowHeight;
        }

        calculateFontScaleRatio(canvasWidth, canvasHeight);

        $("#pageContent").css("width", canvasWidth.toFixed(0) + "px");

        overlay.css("width", canvasWidth.toFixed(0) + "px");
        overlay.css("height", canvasHeight.toFixed(0) + "px");

        glRenderer.setSize(canvasWidth, canvasHeight);
        observer.setViewport(canvasWidth, canvasHeight); 
    };

    self.drawFrame = function () {
        updateBoostParameters();
        renderObserverView();
    };

    try {
        glRenderer = new THREE.WebGLRenderer();
        $("#renderContainer").append(glRenderer.domElement);
        renderContextAvailable = true;

        init();
    } catch (e) {
        console.log("error message: " + e.message);
        renderContextAvailable = false;
    }
}
