
FlightModel = function () {
    this.position = new THREE.Vector3(0,0,0);
	this.speed = 0.0;

	// Rollen:
	this.rollAction = new THREE.Quaternion();
    this.rollAxis = new THREE.Vector3(0,0,-1);
    this.rollAngleIncr = 0.0;
    this.sinRollAngle = 0.0;
	this.cosRollAngle = 1.0;  // 0 .. 360
	this.rollSpeed = 0.0;
	
	// Neigen:
	this.pitchAction = new THREE.Quaternion();
	this.pitchAxis = new THREE.Vector3(1,0,0);
    this.pitchAngleIncr = 0.0;
    this.sinPitchAngle = 0.0;
	this.cosPitchAngle = 1.0;  // -90 .. +90
	this.pitchSpeed = 0.0;
	
	// Gieren:
	this.yawAction = new THREE.Quaternion();
	this.yawAxis = new THREE.Vector3(0,1,0);
    this.yawAngleIncr = 0.0;
    this.sinYawAngle = 0.0;
	this.cosYawAngle = 1.0;  // 0 .. 360
	this.yawSpeed = 0.0;
		
	this.createCabin();
};

FlightModel.prototype = {
    constructor: FlightModel,

	roll: function (rollAngleIncr) {
	    this.rollSpeed = this.rollSpeed + rollAngleIncr - 0.3*this.rollSpeed; 
		if (Math.abs(this.rollSpeed) < 0.0001) {
		    this.rollSpeed = 0.0;
		}		
	    if (this.rollSpeed !== 0.0) {
		    this.rollAxis.normalize();
			this.rollAction.setFromAxisAngle(this.rollAxis, this.rollSpeed);
			this.rollAction.multiplyVector3(this.yawAxis);
			this.rollAction.multiplyVector3(this.pitchAxis);			
        }			
	},
	
	pitch: function (pitchAngleIncr) {
	    this.pitchSpeed = this.pitchSpeed + pitchAngleIncr - 0.6*this.pitchSpeed; 
		if (Math.abs(this.pitchSpeed) < 0.0001) {
		    this.pitchSpeed = 0.0;
		}		
	    if (this.pitchSpeed !== 0.0) {
		    this.pitchAxis.normalize();
			this.pitchAction.setFromAxisAngle(this.pitchAxis, this.pitchSpeed);
			this.pitchAction.multiplyVector3(this.yawAxis);
			this.pitchAction.multiplyVector3(this.rollAxis);			
        }
	},

	yaw: function (yawAngleIncr) {
	    this.yawSpeed = this.yawSpeed + yawAngleIncr - 0.55*this.yawSpeed; 
		if (Math.abs(this.yawSpeed) < 0.0001) {
		    this.yawSpeed = 0.0;
		}		
	    if (this.yawSpeed !== 0.0) {
		    this.yawAxis.normalize();
			this.yawAction.setFromAxisAngle(this.yawAxis, this.yawSpeed);
			this.yawAction.multiplyVector3(this.rollAxis);
			this.yawAction.multiplyVector3(this.pitchAxis);			
		}
    },

	accelerate: function (acceleration) {
	    if (acceleration !== 0.0) {
		    this.speed += acceleration;
		}
		var direction = new THREE.Vector3();
		direction.copy(this.rollAxis);
		direction.multiplyScalar(this.speed);
		this.position.addSelf(direction);
	},

    getSpeed: function () {
        return this.speed;
    },
	
    getAltitude: function () {
        return this.position.y;
    },
	
    getPosition: function () {
	    return this.position;
    },

    getUpVector: function () {
	    return this.yawAxis;
    },

    getLookAtVector: function () {
	    var lookAt = new THREE.Vector3();
		return lookAt.add(this.position, this.rollAxis);
    },
	
	calculateAngles: function () {
	    var yAxis,axis,lengthSq;
		
		this.rollAxis.normalize();
	    this.sinPitchAngle = this.rollAxis.y;
		this.cosPitchAngle = Math.sqrt(1.0 - this.sinPitchAngle*this.sinPitchAngle);
		
        this.pitchAxis.normalize();
	    yAxis = new THREE.Vector3(0,1,0);
		axis = new THREE.Vector3();
		axis.cross(this.rollAxis,yAxis);
	    lengthSq = axis.lengthSq();
		if (lengthSq > 0.000001) {
		    axis.divideScalar(Math.sqrt(lengthSq));
		    this.cosRollAngle = axis.dot(this.pitchAxis);
		    yAxis.cross(axis,this.rollAxis);
		    yAxis.normalize();
		    this.sinRollAngle = yAxis.dot(this.pitchAxis);
	    }
		
	    axis.x = this.rollAxis.x;
		axis.y = 0.0;
		axis.z = -this.rollAxis.z;
	    axis.normalize();
	    this.cosYawAngle = axis.z;
	    this.sinYawAngle = axis.x;
	},

	getAngles: function () {
		return {
		    sinRollAngle: this.sinRollAngle,
		    cosRollAngle: this.cosRollAngle,

		    sinPitchAngle: this.sinPitchAngle,
		    cosPitchAngle: this.cosPitchAngle,
			
		    sinYawAngle: this.sinYawAngle,
		    cosYawAngle: this.cosYawAngle
		};
	},
	
	createCabin: function () {
		this.cabin = new THREE.Object3D();        

		this.cockpit = this.createCockpit();
		this.cabin.add(this.cockpit);
		
		this.observerGroup = new THREE.Object3D();
		
        this.observer = new THREE.PerspectiveCamera(45, 4/3, 0.3, 10000);
        this.observer.position = new THREE.Vector3(0,0,0);
        this.observer.lookAt(new THREE.Vector3(0,0,1));
		this.observer.up = new THREE.Vector3(0,1,0);
        this.observerGroup.add(this.observer);

		this.horizon = new Horizon();
	    this.horizon.geometry.setZ(5000);
		this.horizon.observerFov = this.observer.fov;
		this.horizon.observerAspect = this.observer.aspect;
		this.horizon.observerNear = this.observer.near;
		this.horizon.observerFar = this.observer.far;
        this.observerGroup.add(this.horizon.mesh);
		
		this.observerGroup.position.y = 1;
		
		this.cabin.add(this.observerGroup);
		
		this.update();
	},
	
	createCockpit: function () {
	    var cockpit, display, displayGeometry, indicator,
		    cross;

		cockpit = new THREE.Object3D();
		
		displayGeometry = new DisplayGeometry();
		display = new THREE.Mesh(
		    displayGeometry,
			new THREE.MeshFaceMaterial()
		);
		display.position = new THREE.Vector3(0,0.8,0.75);
		cockpit.add(display);

		cross = this.displayCross();
		cross.position = new THREE.Vector3(0,0.8,0.73);
		cockpit.add(cross);
		
		this.lookDownImage = displayGeometry.lookDownImage;
		
		cockpit.add(this.vorIndicator());
		cockpit.add(this.rollAngleIndicator());
		cockpit.add(this.pitchAngleIndicator());
		
		var cockpitMesh = new THREE.Mesh(
			new CockpitGeometry(),
			new THREE.MeshFaceMaterial()
		);
		cockpit.add(cockpitMesh);
		        		
		return cockpit; 
	},
	
	setObserverFov: function (fov) {
        this.observer.fov = fov;
		this.horizon.observerFov = this.observer.fov;
		this.observer.updateProjectionMatrix();
	},

	setObserverViewport: function (width, height) {
        this.observer.aspect = width/height;
		this.horizon.observerAspect = this.observer.aspect;
		this.observer.updateProjectionMatrix();
	},
	
	update: function () {
        this.cabin.position = this.getPosition();
		this.cabin.up = this.getUpVector();
		this.cabin.lookAt(this.getLookAtVector());

		this.calculateAngles();

		this.horizon.update(this.getAngles());
		
		this.planeTopView.lookAt(new THREE.Vector3(
		    this.planeTopView.position.x-this.sinYawAngle,
		    this.planeTopView.position.y,
		    this.planeTopView.position.z+this.cosYawAngle
		));

		this.planeBackView.lookAt(new THREE.Vector3(
		    this.planeBackView.position.x+this.sinRollAngle,
		    this.planeBackView.position.y,
		    this.planeBackView.position.z+this.cosRollAngle
		));

		var cPa = this.cosPitchAngle;
		if (this.cosRollAngle < 0) cPa = -cPa;
		this.planeSideView.lookAt(new THREE.Vector3(
		    this.planeSideView.position.x+this.sinPitchAngle,
		    this.planeSideView.position.y,
		    this.planeSideView.position.z+cPa
		));
	},

	displayCross: function () {
        var cross, crossGeometry, vertices, lineMaterial;

		cross = new THREE.Object3D();
		
		lineMaterial = new THREE.LineBasicMaterial({
			color: 0xFFFF00,
			opacity: 1,
			linewidth: 3,
		});

		crossLine = new THREE.Geometry();
		crossLine.vertices = [
		    new THREE.Vector3(-0.03, 0, 0),
		    new THREE.Vector3(+0.03, 0, 0),
		];
		cross.add(new THREE.Line(crossLine, lineMaterial));

		crossLine = new THREE.Geometry();
		crossLine.vertices = [
		    new THREE.Vector3(0, -0.03, 0),
		    new THREE.Vector3(0, 0.03, 0),
		];
		cross.add(new THREE.Line(crossLine,	lineMaterial));
		
		return cross;
	},
	
	vorIndicator: function () {
		var indicator, indicatorBackplane,
		    planeBackViewGeometry;
		
		indicator = new THREE.Object3D();
		
		indicatorBackplane = new THREE.Mesh(
			new THREE.PlaneGeometry(0.1, 0.1),
			new THREE.MeshBasicMaterial({
				ambient: 0xFFFFFF,
				color: 0xFFFFFF,
				map: THREE.ImageUtils.loadTexture('textures/vor_indicator.jpg'),
			})
		);
		indicator.add(indicatorBackplane);

		planeTopViewGeometry = new THREE.Geometry();
		planeTopViewGeometry.vertices = [
		    new THREE.Vector3(0, 0, 0.028),
		    new THREE.Vector3(-0.007, 0, 0.008),
		    new THREE.Vector3(-0.025, 0, -0.002),
		    new THREE.Vector3(-0.006, 0, -0.005),
		    new THREE.Vector3(-0.019, 0, -0.018),
		    new THREE.Vector3(-0.006, 0, -0.013),
		    new THREE.Vector3(0.006, 0, -0.013),
		    new THREE.Vector3(0.019, 0, -0.018),
		    new THREE.Vector3(0.006, 0, -0.005),
		    new THREE.Vector3(0.025, 0, -0.002),
		    new THREE.Vector3(0.007, 0, 0.008),
		    new THREE.Vector3(0, 0, 0.028),
		];
		this.planeTopView = new THREE.Line(
			planeTopViewGeometry, 
			new THREE.LineBasicMaterial({
			    color: 0xFFFF00,
				opacity: 1,
				linewidth: 3,
			})
		);
		this.planeTopView.position = new THREE.Vector3(0, 0.003, 0);
		indicator.add(this.planeTopView);

		indicator.position = new THREE.Vector3(-0.18, 0.79, 0.75);
		indicator.rotation.x = -Math.PI/2;
		
		return indicator;
	},
	
	rollAngleIndicator: function () {
		var indicator, indicatorBackplane,
		    planeBackViewGeometry;
		
		indicator = new THREE.Object3D();
		
		indicatorBackplane = new THREE.Mesh(
			new THREE.PlaneGeometry(0.1, 0.1),
			new THREE.MeshBasicMaterial({
				ambient: 0xFFFFFF,
				color: 0xFFFFFF,
				map: THREE.ImageUtils.loadTexture('textures/roll_indicator.jpg'),
			})
		);
		indicator.add(indicatorBackplane);

		planeBackViewGeometry = new THREE.Geometry();
		planeBackViewGeometry.vertices = [
		    new THREE.Vector3(0, 0, 0.02),
		    new THREE.Vector3(-0.004, 0, 0.005),
		    new THREE.Vector3(-0.027, 0, -0.002),
		    new THREE.Vector3(0.0, 0, -0.005),
		    new THREE.Vector3(0.026, 0, -0.002),
		    new THREE.Vector3(0.004, 0, 0.005),
		    new THREE.Vector3(0, 0, 0.02),
		];
		this.planeBackView = new THREE.Line(
			planeBackViewGeometry, 
			new THREE.LineBasicMaterial({
			    color: 0xFFFF00,
				opacity: 1,
				linewidth: 3,
			})
		);
		this.planeBackView.position = new THREE.Vector3(0, 0.003, 0);
		indicator.add(this.planeBackView);

		indicator.position = new THREE.Vector3(0.18, 0.79, 0.75);
		indicator.rotation.x = -Math.PI/2;
		
		return indicator;
	},
	
	pitchAngleIndicator: function () {
		var indicator, indicatorBackplane,
		    planeSideViewGeometry;
		
		indicator = new THREE.Object3D();
		
		indicatorBackplane = new THREE.Mesh(
			new THREE.PlaneGeometry(0.1, 0.1),
			new THREE.MeshBasicMaterial({
				ambient: 0xFFFFFF,
				color: 0xFFFFFF,
				map: THREE.ImageUtils.loadTexture('textures/pitch_indicator.jpg'),
			})
		);
		indicator.add(indicatorBackplane);

		planeSideViewGeometry = new THREE.Geometry();
		planeSideViewGeometry.vertices = [
		    new THREE.Vector3(-0.012, 0, 0.008),
		    new THREE.Vector3(-0.016, 0, 0.005),
		    new THREE.Vector3(-0.029, 0, -0.002),
		    new THREE.Vector3(-0.01, 0, -0.004),
		    new THREE.Vector3(0.024, 0, -0.003),
		    new THREE.Vector3(0.024, 0, 0.018),			
		    new THREE.Vector3(0.01, 0, 0.004),
		    new THREE.Vector3(-0.005, 0, 0.004),
		    new THREE.Vector3(-0.012, 0, 0.008),
		];
		this.planeSideView = new THREE.Line(
			planeSideViewGeometry, 
			new THREE.LineBasicMaterial({
			    color: 0xFFFF00,
				opacity: 1,
				linewidth: 3,
			})
		);
		this.planeSideView.position = new THREE.Vector3(0, 0.003, 0);
		indicator.add(this.planeSideView);

		indicator.position = new THREE.Vector3(0.29, 0.77, 0.75);
		indicator.rotation.x = -Math.PI/2;
		
		return indicator;
	}
};
