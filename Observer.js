Observer = function () {
    this.mesh = new THREE.Object3D();
	
    this.camera = new THREE.PerspectiveCamera(45, 4/3, 0.3, 10000);
    this.camera.position = new THREE.Vector3(0,0,0);
    this.camera.lookAt(new THREE.Vector3(0,0,1));
    this.camera.up = new THREE.Vector3(0,1,0);
    this.mesh.add(this.camera);

	this.horizon = new Horizon();
	this.horizon.geometry.setZ(5000);
	this.horizon.observerFov = this.camera.fov;
	this.horizon.observerAspect = this.camera.aspect;
	this.horizon.observerNear = this.camera.near;
	this.horizon.observerFar = this.camera.far;
    this.mesh.add(this.horizon.mesh);

	this.mesh.position.y = 1;

    this.calculateViewConeParameters();
    this.setBoostParameters(0);
};

Observer.prototype = {
    constructor: Observer,

	setFov: function (fov) {
        this.camera.fov = fov;
		this.horizon.observerFov = this.camera.fov;
		this.camera.updateProjectionMatrix();
		this.calculateViewConeParameters();
	},

	setViewport: function (width, height) {
        this.camera.aspect = width/height;
		this.horizon.observerAspect = this.camera.aspect;
		this.camera.updateProjectionMatrix();
		this.calculateViewConeParameters();
	},
	
	calculateViewConeParameters: function () {
	    var h = 2*Math.tan(Math.PI*this.camera.fov/360)*this.camera.near,
		    w = h*this.camera.aspect,
			rNear = 0.5*Math.sqrt(h*h + w*w),
			rFar = rNear*this.camera.far/this.camera.near;			

		this.viewConeAngle = Math.atan(rNear/this.camera.near);
        this.viewSphereRadius = Math.sqrt(rFar*rFar + this.camera.far*this.camera.far);		
	},

	setBoostParameters: function (beta) {
	    this.beta = beta;
		this.boostedViewConeAngle = this.getBoostedAngle(this.viewConeAngle, this.beta);		
	},
	
	getViewConeParameters: function () {
		return {
		    viewConeAngle: this.viewConeAngle,
			boostedViewConeAngle: this.boostedViewConeAngle,
			viewSphereRadius: this.viewSphereRadius,
		};
	},

	update: function (angles) {
		this.horizon.update(angles);
	},

	getBoostedAngle: function (angle, beta) {
		var boostedAngle = Math.atan(Math.sqrt(1-beta*beta)*Math.sin(angle)/(Math.cos(angle)-beta));
		if (boostedAngle <= 0) {
		    boostedAngle += Math.PI;
		}
		return boostedAngle;
	},
};