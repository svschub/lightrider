function Renderer() {
    var self = this,
    
        deferred,

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

        widgetScaleRatio = 1,

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

            covariantMaterial.enableBoost();

            // render observer view into screen:
            glRenderer.render(world.getScene(), observer.getCamera());
        },

        calculateWidgetScaleRatio = function(canvasWidth, canvasHeight) {
            widgetScaleRatio = Math.max(0.5, canvasHeight/600.0);
        },

        init = function () {
            console.log('DEBUG: Renderer init');

            glRenderer.setClearColor(0x446600, 1);

            boost = new Boost();

            world = new World();
            cabin = new Cabin();

            $.when(
                world.getPromise(), 
                cabin.getPromise()
            ).then(function(worldResponse, cabinResponse) {
                console.log('DEBUG: Renderer: world and cabin response received');
                observer = new Observer();
                return observer.getPromise();
            }).done(function(observerResponse) {
                console.log('DEBUG: Renderer: observer response received');
                covariantMaterial = new CovariantMaterial();

                glRenderer.render(world.getScene(), world.getTopviewCamera(), world.getTopviewImage(), true);

                world.add(cabin.getMesh());

                world.add(observer.getHorizonMesh());

                beta = -1000.0;
                dopplerShiftRescale = -1;

                self.updateViewport();

                console.log('DEBUG: Renderer resolve');
                deferred.resolve();
            }).fail(function(error) {
                console.log('DEBUG: Renderer reject');
                deferred.reject(error);                
            })
        };


    self.getPromise = function () {
        return deferred.promise();
    };

    self.isRenderContextAvailable = function () {
        return renderContextAvailable;
    };

    self.setFlightModel = function (flightmodel) {
        plane = flightmodel;
    };

    self.setBeta = function(beta) {
        beta_next = Math.min(beta, 0.9999);
    };

    self.setDopplerShiftRescale = function (dopplerShiftRescale) {
        dopplerShiftRescale_next = dopplerShiftRescale;
    };

    self.getWidgetScaleRatio = function () {
        return widgetScaleRatio;
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

        calculateWidgetScaleRatio(canvasWidth, canvasHeight);

        $("#pageContent").css("width", canvasWidth.toFixed(0) + "px");

        overlay.css("width", canvasWidth.toFixed(0) + "px");
        overlay.css("height", canvasHeight.toFixed(0) + "px");

        glRenderer.setSize(canvasWidth, canvasHeight);

        observer.setViewport(canvasWidth, canvasHeight);
        observer.rescaleHudFondSize(widgetScaleRatio);
    };

    self.drawFrame = function () {
        updateBoostParameters();
        renderObserverView();
    };

    try {
        deferred = new $.Deferred();

        glRenderer = new THREE.WebGLRenderer();
        $("#renderContainer").append(glRenderer.domElement);
        renderContextAvailable = true;

        init();
    } catch(e) {
        deferred.reject(e.message);
        renderContextAvailable = false;
    }
}
