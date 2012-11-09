
// MainLoop = function () {
function MainLoop() {
    try {
        this.renderer = new THREE.WebGLRenderer();
        this.renderContextAvailable = true;
        this.initLoop();
    } catch (e) {
        this.renderContextAvailable = false;
        return;
    }
}

MainLoop.prototype = {
    constructor: MainLoop,

    isRenderContextAvailable: function () {
        return this.renderContextAvailable;
    },

    initLoop: function () {
        var canvasWidth = $(window).width() - 240, // 0.75 * $(window).width(),
            canvasHeight = $(window).height(); // canvasWidth / 1.75;

        this.renderer.setSize(canvasWidth, canvasHeight);
        $("#renderContainer").append(this.renderer.domElement);

        this.boost = new BoostFactory();

        this.world = new World(this.boost);

        this.plane = new FlightModel(this.boost);
        this.plane.position = new THREE.Vector3(0, 10, 13);
        this.plane.observer.setViewport(canvasWidth, canvasHeight);
        this.world.add(this.plane.cabin);

        this.lookDownGroup = new LookDownGroup();
        this.world.add(this.lookDownGroup.mesh);

        this.beta = -1000.0;
        this.beta_next = 0.0;

        this.dopplerShiftRescale = -1;
        this.dopplerShiftRescale_next = parseFloat($("#dopplerShiftRescale").val());

		this.paused = false;
    },

    start: function (milliseconds) {
        var self = this;
        this.plane.setMoveHandler(function (position) {
            if (position.y <= 0.0) {
                self.plane.stopLoop();
                document.body.innerHTML = "";
                $(document).ready(function () {
                    alert("Crashed!");
                });
            }
        });
        this.plane.startLoop(milliseconds);
    },

	pause: function () {
	    this.paused = true;
		this.plane.paused = true;
	},

	restart: function () {
	    this.paused = false;
		this.plane.paused = false;
	},

    setBeta: function (beta) {
        this.beta_next = Math.min(beta, 0.9999);
    },

    setDopplerShiftRescale: function (dopplerShiftRescale) {
        this.dopplerShiftRescale_next = dopplerShiftRescale;
    },

    setVisibility: function (object3d, visible) {
        THREE.SceneUtils.traverseHierarchy(object3d, function (child) {
            child.visible = visible;
        });
    },

    updateBoostParameters: function () {
        if (this.dopplerShiftRescale_next !== this.dopplerShiftRescale) {
            this.dopplerShiftRescale = this.dopplerShiftRescale_next;
            this.boost.dopplerShiftTable.update({
                dopplerShiftRescale: this.dopplerShiftRescale
            });
        }

        if (this.beta_next !== this.beta) {
            this.beta = this.beta_next;
            this.boost.setBoostParameters(this.beta);
        }
    },

    renderLookDownImage: function () {
        var angles = this.plane.getAngles(),
            position = this.plane.getPosition();

        this.lookDownGroup.setPosition(position);
        this.lookDownGroup.setViewAngle(angles);

        this.boost.disableBoost();
        this.setVisibility(this.lookDownGroup.mesh, true);
        this.setVisibility(this.plane.cabin, false);
        this.renderer.render(this.world.scene, this.lookDownGroup.camera, this.plane.cockpit.lookDownImage, true);
    },

    renderObserverView: function () {
        this.boost.enableBoost();
        this.setVisibility(this.lookDownGroup.mesh, false);
        this.setVisibility(this.plane.cabin, true);
        this.renderer.render(this.world.scene, this.plane.observer.camera);
    },

    drawFrame: function () {
	    if (this.paused) {
            return;
		}

        this.updateBoostParameters();

        this.renderLookDownImage();
        this.renderObserverView();
    }
};
