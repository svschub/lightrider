
MainLoop = function () {
    var canvasWidth = 0.75*$(window).width(), 
        canvasHeight = canvasWidth/1.75;
        
    this.boost = new BoostFactory();
        
    this.world = new World(this.boost);

    this.plane = new FlightModel(this.boost);
    this.plane.position = new THREE.Vector3(0,10,13);
    this.plane.observer.setViewport(canvasWidth, canvasHeight);
    this.world.add(this.plane.cabin);
       
    this.lookDownGroup = new LookDownGroup();
    this.world.add(this.lookDownGroup.mesh);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(canvasWidth, canvasHeight);
    $("#renderContainer").append(this.renderer.domElement);
    
    this.beta = -1000.0;
    this.beta_next = 0.0;

    this.dopplerShiftRescale = -1;
    this.dopplerShiftRescale_next = parseFloat( $("#dopplerShiftRescale").val() );
};

MainLoop.prototype = {
    constructor: MainLoop,

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
        this.plane.startLoop(30);
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
       if (this.dopplerShiftRescale_next != this.dopplerShiftRescale) {
            this.dopplerShiftRescale = this.dopplerShiftRescale_next;
            this.boost.dopplerShiftTable.update({
                dopplerShiftRescale: this.dopplerShiftRescale,
            });
        }

        if (this.beta_next != this.beta) {
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
        this.updateBoostParameters();

		this.renderLookDownImage();		
		this.renderObserverView();
    },   
};
