
FlightModel = function (covariantMaterials) {
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
		
	this.createCabin(covariantMaterials);
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
	
	update: function () {
        this.cabin.position = this.getPosition();
		this.cabin.up = this.getUpVector();
		this.cabin.lookAt(this.getLookAtVector());

		this.calculateAngles();

		this.observer.update(this.getAngles());
        this.cockpit.update(this.getAngles());		
	},

	createCabin: function (covariantMaterials) {
		this.cabin = new THREE.Object3D();        

	    this.cockpit = new Cockpit();
		this.cabin.add(this.cockpit.mesh);

        this.observer = new Observer(covariantMaterials);
		this.cabin.add(this.observer.mesh);
		
		this.update();
	},
};
