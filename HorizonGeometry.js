
HorizonGeometry = function () {
    var skyColor = new THREE.Color(0x3355AA),
	    skyTriangle, skyRectangle,
	    groundColor = new THREE.Color(0x446600),
		groundTriangle, groundRectangle,
	    normal = new THREE.Vector3(0, 0, 1),
	    z = 100;
	
	THREE.Geometry.call(this);
	
	this.vertices = [
	    new THREE.Vector3(+0.4, 0.0, z),
	    new THREE.Vector3(-0.4, 0.4, z),
	    new THREE.Vector3(+0.4, 0.4, z),

	    new THREE.Vector3(+0.4, 0.4, z),
	    new THREE.Vector3(-0.4, 0.4, z),
	    new THREE.Vector3(-0.4, 0.8, z),
	    new THREE.Vector3(+0.4, 0.8, z),

	    new THREE.Vector3(+0.4, 1.0, z),
	    new THREE.Vector3(-0.4, 1.4, z),
	    new THREE.Vector3(+0.4, 1.4, z),

	    new THREE.Vector3(+0.4, 1.4, z),
	    new THREE.Vector3(-0.4, 1.4, z),
	    new THREE.Vector3(-0.4, 1.8, z),
	    new THREE.Vector3(+0.4, 1.8, z),
	];

	skyTriangle = new THREE.Face3(0, 1, 2);
	skyTriangle.normal.copy(normal);
	skyTriangle.vertexNormals = [
	    normal.clone(), 
		normal.clone(), 
		normal.clone(),
	];
	skyTriangle.vertexColors = [
	    skyColor.clone(),
	    skyColor.clone(),
	    skyColor.clone(),
	];
	this.faces.push(skyTriangle);

	skyRectangle = new THREE.Face4(3, 4, 5, 6);
	skyRectangle.normal.copy(normal);
	skyRectangle.vertexNormals = [
	    normal.clone(), 
		normal.clone(), 
		normal.clone(),
		normal.clone(),
	];
	skyRectangle.vertexColors = [
	    skyColor.clone(),
	    skyColor.clone(),
	    skyColor.clone(),
	    skyColor.clone(),
	];
	this.faces.push(skyRectangle);
	
	groundTriangle = new THREE.Face3(7, 8, 9);
	groundTriangle.normal.copy(normal);
	groundTriangle.vertexNormals = [
	    normal.clone(), 
		normal.clone(), 
		normal.clone(),
	];
	groundTriangle.vertexColors = [
	    groundColor.clone(),
	    groundColor.clone(),
	    groundColor.clone(),
	];
	this.faces.push(groundTriangle);

	groundRectangle = new THREE.Face4(10, 11, 12, 13);
	groundRectangle.normal.copy(normal);
	groundRectangle.vertexNormals = [
	    normal.clone(), 
		normal.clone(), 
		normal.clone(),
		normal.clone(),
	];
	groundRectangle.vertexColors = [
	    groundColor.clone(),
	    groundColor.clone(),
	    groundColor.clone(),
	    groundColor.clone(),
	];
	this.faces.push(groundRectangle);
	
	this.faceVertexUvs[0] = [];
		
	this.computeCentroids();
	
	this.dynamic = true;
};

HorizonGeometry.prototype = new THREE.Geometry();

HorizonGeometry.prototype.constructor = HorizonGeometry;

HorizonGeometry.prototype.setZ = function (z) {
    for (var i=0; i < this.vertices.length; i++) {
	    this.vertices[i].z = z;
	}
};
