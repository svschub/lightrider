// TODO

LookDownGroup = function () {
    this.y = 20;

	this.mesh = new THREE.Object3D();

//	this.camera = new THREE.OrthographicCamera(-80,+80, +70,-70, -1000, 1);
	this.camera = new THREE.OrthographicCamera(-80,+80, +70,-70, 1, 1000);
	this.camera.up = new THREE.Vector3(0,0,1);
	this.camera.lookAt(new THREE.Vector3(0,-1,0));
	this.mesh.add(this.camera);

	this.ground = new THREE.Mesh(
		new THREE.PlaneGeometry(160, 140),
		new THREE.MeshBasicMaterial({
			ambient: 0x446600,
			color: 0x446600,
		})
	);
	this.ground.position.y = -this.y-10;
	this.mesh.add(this.ground);
};

LookDownGroup.prototype = {
    constructor: LookDownGroup,
	
	setPosition: function (position) {
        this.mesh.position = new THREE.Vector3(position.x, this.y, position.z);  // 0
	},

	setViewAngle: function (angles) {
        this.mesh.lookAt(new THREE.Vector3(
		    this.mesh.position.x + angles.sinYawAngle, 
			this.mesh.position.y, 
			this.mesh.position.z - angles.cosYawAngle
		));
	}
};