
DisplayGeometry = function () {
    var displayColor = new THREE.Color(0xDDDDDD),
	    frameInnerColor = new THREE.Color(0x888888),
	    frameOuterColor = new THREE.Color(0xBBBBBB),
	    display, frame; 
	
	THREE.Geometry.call(this);

	this.displayNormal = new THREE.Vector3(0, 0, 1);
	
	this.lookDownImage = new THREE.WebGLRenderTarget(256,256, {
		minFilter: THREE.LinearMipMapLinearFilter, 
		magFilter: THREE.LinearFilter, 
		format: THREE.RGBFormat
	});

	this.materials = [
		new THREE.MeshBasicMaterial({ // screen
			color: 0xDDDDDD,
		    shading: THREE.FlatShading, 
			vertexColors: THREE.VertexColors,
			map: this.lookDownImage,
		}),
		new THREE.MeshBasicMaterial({ // frame
			color: 0xFFFFFF,
			vertexColors: THREE.VertexColors,
		}),		
	];
	
	this.vertices = [
	    new THREE.Vector3(-0.1, -0.07, 0),
	    new THREE.Vector3(-0.1, +0.07, 0),
	    new THREE.Vector3(+0.1, +0.07, 0),
	    new THREE.Vector3(+0.1, -0.07, 0),

	    new THREE.Vector3(-0.11, -0.08, 0),
	    new THREE.Vector3(-0.11, +0.08, 0),
	    new THREE.Vector3(+0.11, +0.08, 0),
	    new THREE.Vector3(+0.11, -0.08, 0),

	    new THREE.Vector3(-0.12, -0.09, 0.01),
	    new THREE.Vector3(-0.12, +0.09, 0.01),
	    new THREE.Vector3(+0.12, +0.09, 0.01),
	    new THREE.Vector3(+0.12, -0.09, 0.01),
	];

	display = new THREE.Face4(0, 1, 2, 3);
	display.normal.copy(this.displayNormal);
	display.vertexNormals = [
	    this.displayNormal.clone(), 
		this.displayNormal.clone(), 
		this.displayNormal.clone(),
		this.displayNormal.clone(),
	];
	display.vertexColors = [
	    displayColor.clone(),
	    displayColor.clone(),
	    displayColor.clone(),
	    displayColor.clone(),
	];
	display.materialIndex = 0;
	this.faces.push(display);

	this.faces.push(this.frameBar(0, 4, 5, 1, frameInnerColor, frameOuterColor));
	this.faces.push(this.frameBar(1, 5, 6, 2, frameInnerColor, frameOuterColor));
	this.faces.push(this.frameBar(2, 6, 7, 3, frameInnerColor, frameOuterColor));
	this.faces.push(this.frameBar(3, 7, 4, 0, frameInnerColor, frameOuterColor));

	this.faces.push(this.frameBar(4, 8, 9, 5, frameOuterColor, frameInnerColor));
	this.faces.push(this.frameBar(5, 9, 10, 6, frameOuterColor, frameInnerColor));
	this.faces.push(this.frameBar(6, 10, 11, 7, frameOuterColor, frameInnerColor));
	this.faces.push(this.frameBar(7, 11, 8, 4, frameOuterColor, frameInnerColor));

    this.faceVertexUvs[0].push([ new THREE.UV(1,0), new THREE.UV(1,1), new THREE.UV(0,1), new THREE.UV(0,0) ]);		

	this.computeCentroids();
};

DisplayGeometry.prototype = new THREE.Geometry();

DisplayGeometry.prototype.constructor = DisplayGeometry;

DisplayGeometry.prototype.frameBar = function (a, b, c, d, innerColor, outerColor) {
    var frameBar = new THREE.Face4(a, b, c, d);

	frameBar.normal.copy(this.displayNormal);

	frameBar.vertexNormals = [
	    this.displayNormal.clone(), 
		this.displayNormal.clone(), 
		this.displayNormal.clone(),
		this.displayNormal.clone(),
	];
	frameBar.vertexColors = [
	    innerColor.clone(),
	    outerColor.clone(),
	    outerColor.clone(),
	    innerColor.clone(),
	];

	frameBar.materialIndex = 1;
	
	return frameBar;
};
