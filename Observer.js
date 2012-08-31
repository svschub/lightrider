Observer = function () {
    this.mesh = new THREE.Object3D();
	
    this.camera = new THREE.PerspectiveCamera(45, 4/3, 0.3, 10000);
    this.camera.position = new THREE.Vector3(0,0,0);
    this.camera.lookAt(new THREE.Vector3(0,0,1));
    this.camera.up = new THREE.Vector3(0,1,0);
    this.mesh.add(this.camera);

	this.horizon = new Horizon();
	this.horizon.setZ(5000);
	this.horizon.setFrustumParametersFromCamera(this.camera);
    this.mesh.add(this.horizon.mesh);

	this.mesh.position.y = 1;

    this.updateObserverViewCone();
	this.setBoostParameters(0);
};

Observer.prototype = {
    constructor: Observer,

	setFov: function (fov) {
        this.camera.fov = fov;
		this.horizon.setFrustumParametersFromCamera(this.camera);
		this.camera.updateProjectionMatrix();
		this.updateObserverViewCone();
	},

	setViewport: function (width, height) {
        this.camera.aspect = width/height;
		this.horizon.setFrustumParametersFromCamera(this.camera);
		this.camera.updateProjectionMatrix();
		this.updateObserverViewCone();
	},
	
	updateObserverViewCone: function () {
	    var h = 2*Math.tan(Math.PI*this.camera.fov/360)*this.camera.near,
		    w = h*this.camera.aspect,
			rNear = 0.5*Math.sqrt(h*h + w*w),
			rFar = rNear*this.camera.far/this.camera.near;			

		this.viewConeAngle = Math.atan(rNear/this.camera.near);
        this.viewSphereRadius = Math.sqrt(rFar*rFar + this.camera.far*this.camera.far);		

        this.horizon.updateObserverViewCone({
		    viewConeAngle: this.viewConeAngle,
			viewSphereRadius: this.viewSphereRadius,
		});
	},

	setBoostParameters: function (beta) {
	    this.beta = beta;
		this.referenceViewConeAngle = getBoostedAngle(this.viewConeAngle, -this.beta);		

		this.horizon.setBoostParameters(this.beta);
		this.horizon.setReferenceViewConeAngle(this.referenceViewConeAngle);
	},
	
	update: function (angles) {
		this.horizon.update(angles);
	},
};