
Cockpit = function () {
    this.mesh = this.create();
};

Cockpit.prototype = {
    constructor: Cockpit,

	create: function () {
	    var mesh, 
		    cockpit, cockpitMesh, 
			display, displayGeometry, 
			indicator,
		    cross;

		mesh = new THREE.Object3D();
		
		displayGeometry = new DisplayGeometry();
		display = new THREE.Mesh(
		    displayGeometry,
			new THREE.MeshFaceMaterial()
		);
		display.position = new THREE.Vector3(0,0.8,0.75);
		mesh.add(display);

		cross = this.displayCross();
		cross.position = new THREE.Vector3(0,0.8,0.73);
		mesh.add(cross);
		
		this.lookDownImage = displayGeometry.lookDownImage;
		
		mesh.add(this.vorIndicator());
		mesh.add(this.rollAngleIndicator());
		mesh.add(this.pitchAngleIndicator());
		
		var cockpitMesh = new THREE.Mesh(
			new CockpitGeometry(),
			new THREE.MeshFaceMaterial()
		);
		mesh.add(cockpitMesh);
		        		
		return mesh; 
	},

	displayCross: function () {
        var cross, crossLine, lineMaterial;

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
		    planeTopViewGeometry;
		
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
		    planeRearViewGeometry;
		
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

		planeRearViewGeometry = new THREE.Geometry();
		planeRearViewGeometry.vertices = [
		    new THREE.Vector3(0, 0, 0.02),
		    new THREE.Vector3(-0.004, 0, 0.005),
		    new THREE.Vector3(-0.027, 0, -0.002),
		    new THREE.Vector3(0.0, 0, -0.005),
		    new THREE.Vector3(0.026, 0, -0.002),
		    new THREE.Vector3(0.004, 0, 0.005),
		    new THREE.Vector3(0, 0, 0.02),
		];
		this.planeRearView = new THREE.Line(
			planeRearViewGeometry, 
			new THREE.LineBasicMaterial({
			    color: 0xFFFF00,
				opacity: 1,
				linewidth: 3,
			})
		);
		this.planeRearView.position = new THREE.Vector3(0, 0.003, 0);
		indicator.add(this.planeRearView);

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
	},

	update: function (angles) {
		this.planeTopView.lookAt(new THREE.Vector3(
		    this.planeTopView.position.x-angles.sinYawAngle,
		    this.planeTopView.position.y,
		    this.planeTopView.position.z+angles.cosYawAngle
		));

		this.planeRearView.lookAt(new THREE.Vector3(
		    this.planeRearView.position.x+angles.sinRollAngle,
		    this.planeRearView.position.y,
		    this.planeRearView.position.z+angles.cosRollAngle
		));

		var cPa = angles.cosPitchAngle;
		if (angles.cosRollAngle < 0) cPa = -cPa;
		this.planeSideView.lookAt(new THREE.Vector3(
		    this.planeSideView.position.x+angles.sinPitchAngle,
		    this.planeSideView.position.y,
		    this.planeSideView.position.z+cPa
		));
	}
};