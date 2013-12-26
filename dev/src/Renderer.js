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
        lookDownGroup,

        init = function () {
            var observer;

            boost = new BoostFactory();

            world = new World(boost);

            observer = new Observer(boost);

            cabin = new Cabin();
            cabin.addObserver(observer);

            world.add(cabin.getMesh());

            lookDownGroup = new LookDownGroup();
            world.add(lookDownGroup.getMesh());

            beta = -1000.0;
            beta_next = 0.0;

            dopplerShiftRescale = -1;
            dopplerShiftRescale_next = parseFloat($("#dopplerShiftRescale").val());

            self.updateObserverViewport();

            paused = false;
        },
        
        setVisibility = function (object3d, visible) {
            THREE.SceneUtils.traverseHierarchy(object3d, function (child) {
                child.visible = visible;
            });
/*
            object3d.traverse(function (child) {
                child.visible = visible;
            });
*/
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

        renderLookDownImage = function () {
            lookDownGroup.setPosition(plane.getPosition());
            lookDownGroup.setViewAngle(plane.getAngles());

            boost.disableBoost();

            setVisibility(lookDownGroup.getMesh(), true);
            setVisibility(cabin.getMesh(), false);

            glRenderer.render(world.getScene(), lookDownGroup.getCamera(), cabin.getCockpit().getLookDownImage(), true);
        },
        
        renderObserverView = function () {
            cabin.setPosition(plane.getPosition());
            cabin.setAltitude(plane.getAltitude());
            cabin.setLookAtVector(plane.getLookAtVector());
            cabin.setUpVector(plane.getYawAxis());
            cabin.setAngles(plane.getAngles());
            cabin.setSpeed(plane.getSpeed());
            cabin.update();

            boost.enableBoost();

            setVisibility(lookDownGroup.getMesh(), false);
            setVisibility(cabin.getMesh(), true);  
  
            glRenderer.render(world.getScene(), cabin.getObserver().getCamera());
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

    self.updateObserverViewport = function () {
        var canvasWidth = $(window).width() - 240, // 0.75 * $(window).width(),
            canvasHeight = $(window).height();

        glRenderer.setSize(canvasWidth, canvasHeight);

        cabin.getObserver().setViewport(canvasWidth, canvasHeight); 
    };

    self.drawFrame = function () {
        if (!paused) {
            updateBoostParameters();

            renderLookDownImage();
            renderObserverView();
        }
    };

    try {
        glRenderer = new THREE.WebGLRenderer();
        $("#renderContainer").append(glRenderer.domElement);
        renderContextAvailable = true;

        init();
    } catch (e) {
        renderContextAvailable = false;
        return;
    }
}
