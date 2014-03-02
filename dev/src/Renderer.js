function Renderer() {
    var self = this,
    
        paused,

        glRenderer,
        renderContextAvailable,

        boost,
        beta, beta_next,
        dopplerShiftRescale, dopplerShiftRescale_next,

        plane,
        world,
        cabin,
        observer,
        
        setVisibility = function (object3d, visible) {
            object3d.traverse(function (child) {
                child.visible = visible;
            });
        },

        updateBoostParameters = function () {
            if (dopplerShiftRescale_next !== dopplerShiftRescale) {
                dopplerShiftRescale = dopplerShiftRescale_next;
                boost.getDopplerShiftTable().update({
                    dopplerShiftRescale: dopplerShiftRescale
                });
            }

            if (beta_next !== beta) {
                beta = beta_next;
                boost.setBoostParameters(beta);
            }
        },
  
        renderObserverView = function () {
            /**
             * update observer variables:
             * @todo check if observer.update() can be called directly
             * after setting these variables and before rendering the
             * lookdown image!
             */
            observer.setPosition(plane.getPosition());
            observer.setLookAtVector(plane.getLookAtVector());
            observer.setUpVector(plane.getYawAxis());
            observer.setAltitude(plane.getAltitude());
            observer.setAngles(plane.getAngles());
            observer.setSpeed(plane.getSpeed());

            observer.updateLookDownCamera();

            // render lookdown image:

            boost.disableBoost();

            setVisibility(cabin.getMesh(), false);
            glRenderer.render(world.getScene(), observer.getLookDownCamera(), cabin.getCockpit().getLookDownImage(), true);

            // render observer view:

            boost.enableBoost();

            cabin.setPosition(plane.getPosition());
            cabin.setAltitude(plane.getAltitude());
            cabin.setLookAtVector(plane.getLookAtVector());
            cabin.setUpVector(plane.getYawAxis());
            cabin.setAngles(plane.getAngles());
            cabin.setSpeed(plane.getSpeed());
            cabin.update();

            observer.update();

            setVisibility(cabin.getMesh(), true);  

            glRenderer.render(world.getScene(), observer.getCamera());
        },

        init = function () {
            glRenderer.setClearColor(0x446600, 1);

            boost = new BoostFactory();

            world = new World(boost);

            observer = new Observer(boost);
            world.add(observer.getHorizonMesh());

            cabin = new Cabin();
            world.add(cabin.getMesh());

            beta = -1000.0;
            beta_next = 0.0;

            dopplerShiftRescale = -1;
            dopplerShiftRescale_next = parseFloat($("#dopplerShiftRescale").val());

            self.updateViewport();

            paused = false;
        };
        

    self.isRenderContextAvailable = function () {
        return renderContextAvailable;
    };

    self.setFlightModel = function (flightmodel) {
        plane = flightmodel;
    };

    self.pause = function () {
        paused = true;
    };

    self.restart = function () {
        paused = false;
    };

    self.getBoost = function () {
        return boost;
    };

    self.setBeta = function (beta) {
        beta_next = Math.min(beta, 0.9999);
    };

    self.setDopplerShiftRescale = function (dopplerShiftRescale) {
        dopplerShiftRescale_next = dopplerShiftRescale;
    };

    self.updateViewport = function () {
        var canvas = $("#renderContainer > canvas"),
            canvasWidth = $(window).width(), 
            canvasHeight = Math.min(canvasWidth*0.75, $(window).height());

        glRenderer.setSize(canvasWidth, canvasHeight);

        observer.setViewport(canvasWidth, canvasHeight); 
    };

    self.drawFrame = function () {
        if (!paused) {
            updateBoostParameters();

            renderObserverView();
        }
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
