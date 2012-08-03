
AngleIndicator = function (options) {
	this.mesh = this.create(options);
};

AngleIndicator.prototype = {
    constructor: AngleIndicator,

	create: function (options) {
		var indicator, indicatorBackplane,
		    planeSketchGeometry;
		
		indicator = new THREE.Object3D();
		
		indicatorBackplane = new THREE.Mesh(
			new THREE.PlaneGeometry(0.1, 0.1),
			new THREE.MeshBasicMaterial({
				ambient: 0xFFFFFF,
				color: 0xFFFFFF,
				map: THREE.ImageUtils.loadTexture(options.texture),
			})
		);
		indicator.add(indicatorBackplane);

		planeSketchGeometry = new THREE.Geometry();
		for (var i=0; i < options.sketch.length; i++) {
			var vertex = options.sketch[i];
			planeSketchGeometry.vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
		}

		this.planeSketch = new THREE.Line(
			planeSketchGeometry, 
			new THREE.LineBasicMaterial({
			    color: 0xFFFF00,
				opacity: 1,
				linewidth: 3,
			})
		);
		this.planeSketch.position = new THREE.Vector3(0, 0.003, 0);
		indicator.add(this.planeSketch);

		indicator.position = options.position;
		indicator.rotation.x = -Math.PI/2;
		
		return indicator;
	},
	
	updateDirection: function (dx, dz) {
		this.planeSketch.lookAt(new THREE.Vector3(
		    this.planeSketch.position.x+dx,
		    this.planeSketch.position.y,
		    this.planeSketch.position.z+dz
		));
	}
};