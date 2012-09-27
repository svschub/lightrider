
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

	setNextBeta: function (beta) {
	    this.beta_next = beta;
	},
	
	setNextDopplerShiftRescale: function (dopplerShiftRescale) {
	    this.dopplerShiftRescale_next = dopplerShiftRescale;
	},

    drawFrame: function () {    
        var angles = this.plane.getAngles(),
            position = this.plane.getPosition();
            
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

        this.lookDownGroup.setPosition(position);
        this.lookDownGroup.setViewAngle(angles);

        this.boost.disableBoost();
        setVisibility(this.lookDownGroup.mesh, true);
        setVisibility(this.plane.cabin, false);
        this.renderer.render(this.world.scene, this.lookDownGroup.camera, this.plane.cockpit.lookDownImage, true);
        
        this.boost.enableBoost();
        setVisibility(this.lookDownGroup.mesh, false);
        setVisibility(this.plane.cabin, true);
        this.renderer.render(this.world.scene, this.plane.observer.camera);
    },
	
	start: function (milliseconds) {
        this.plane.startLoop(30);
	},
   
};
