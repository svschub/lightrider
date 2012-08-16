World = function () {
    this.LOD = 4;  // level of detail
	
    this.scene = new THREE.Scene();

	this.initMaterialTable();
	
	var church = this.church();
	church.position = new THREE.Vector3(10,0,-15);
    this.scene.add(church);
	
	var palace = this.palace();
    palace.position = new THREE.Vector3(-5,0,-25);
	this.scene.add(palace);

    var runway = this.runway();
    runway.position = new THREE.Vector3(-25,0,-20);
    this.scene.add(runway);
	
	var ambientLight = new THREE.AmbientLight(0x999999);
	this.scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xCCFF22);
    pointLight.position.x = 0.5;
    pointLight.position.y = 0.7;
    pointLight.position.z = 10;
    this.scene.add(pointLight);		
		
	this.setBoostParameters(0);
};

World.prototype = {
    constructor: World,

	setBoostParameters: function (beta) {
	    var boostBeta = beta,
		    boostGamma;

		if (boostBeta > 0.9999) boostBeta = 0.9999;
		boostGamma = 1/Math.sqrt(1-boostBeta*boostBeta);
		
	    for (var i=0; i < this.material.length; i++) {
			this.material[i].object.uniforms.beta.value = boostBeta;
			this.material[i].object.uniforms.gamma.value = boostGamma;
		}
	},
	
	initMaterialTable: function () {
	    this.material = [];
	    this.vertexShaderCode = readFile("shaders/covariantLambert.vs");
	    this.fragmentShaderCode = readFile("shaders/covariantLambert.fs");
	}, 
	
	isMaterialEqual: function (material1, material2) {
	    if (material1.map != material2.map) return false;
        if (material1.ambient != material2.ambient)	return false;
        if (material1.color != material2.color)	return false;
        if (material1.shading != material2.shading)	return false;
	    return true;
	},
	
	setMaterial: function (material) {
		var vertexShaderCode = this.vertexShaderCode,
		    fragmentShaderCode = this.fragmentShaderCode;

	    for (var i=0; i < this.material.length; i++) {
		    if ( this.isMaterialEqual(material, this.material[i]) ) {
				return this.material[i].object;
			}
		}
		
		var	materialUniforms = THREE.UniformsUtils.merge([
			THREE.UniformsUtils.clone(THREE.ShaderLib['lambert'].uniforms),
			{ 
			    "beta": { type: "f", value: 1.0 },
			    "gamma": { type: "f", value: 1.0 },
			}, 
		]);
		
		if (material.ambient) {
            materialUniforms.ambient.value = new THREE.Color(material.ambient);
		}
		if (material.color) {
            materialUniforms.diffuse.value = new THREE.Color(material.color);
		}
		
		if (material.map) {
		    materialUniforms.map.texture = THREE.ImageUtils.loadTexture(material.map);
			vertexShaderCode = "#define USE_MAP\n" + this.vertexShaderCode;
			fragmentShaderCode = "#define USE_MAP\n" + this.fragmentShaderCode;
		}

		this.material.push({
		    color: material.color,
			map: material.map,
			shading: material.shading,
			object: new THREE.ShaderMaterial({
			    uniforms:       materialUniforms,
		        vertexShader:   vertexShaderCode,
			    fragmentShader: fragmentShaderCode,
			    shading:        material.shading,
			    lights:         true,
		    }),
		});
		
		return this.material[this.material.length-1].object;
	},
	
	add: function (object3d) {
        this.scene.add(object3d);
	},

	columnRow: function (radius, height, number, dx) {
		var columnRow, column;

        columnRow = new THREE.Object3D();

		for (var i=0; i < number; i++) {
			column = new THREE.Mesh(
				new THREE.CylinderGeometry(radius, radius, height, 12, 4*this.LOD, false),
				this.setMaterial({
					color: 0x999999,
					ambient: 0x777777,
				})
			);
			column.position.x = i*dx - (number-1)*dx/2;
		    column.frustumCulled = false;

			columnRow.add(column);
		}
		
		return columnRow;
	},
	
	palace: function () {
        var palace, columnRow, building, roof, top;
		
		palace = new THREE.Object3D();
		
		columnRow = this.columnRow(0.5, 6, 4, 3);
		columnRow.position.y = 3;
		columnRow.position.z = 4.5;
	    palace.add(columnRow);
		
		columnRow = this.columnRow(0.5, 6, 4, 3);
		columnRow.position.y = 3;
		columnRow.position.z = -4.5;
	    palace.add(columnRow);

		columnRow = this.columnRow(0.5, 6, 4, 3);
		columnRow.rotation.y = Math.PI/2;
		columnRow.position.y = 3;
		columnRow.position.x = +7.5;
	    palace.add(columnRow);

		columnRow = this.columnRow(0.5, 6, 4, 3);
		columnRow.rotation.y = Math.PI/2;
		columnRow.position.y = 3;
		columnRow.position.x = -7.5;
	    palace.add(columnRow);
		
		building = new THREE.Mesh(
			new THREE.CubeGeometry(13, 6, 7, this.LOD*2, this.LOD, this.LOD),
			this.setMaterial({
				ambient: 0xCCEECC,
				color: 0xCCEECC,
			})
		);
        building.position.y = 3;
		building.frustumCulled = false;
		palace.add(building);

		roof = new THREE.Mesh(
			new THREE.CubeGeometry(17, 11, 0.5, this.LOD*2, this.LOD*2, 1),
			this.setMaterial({
				ambient: 0xCCEECC,
				color: 0xCCEECC,
			})
		);
		roof.rotation.x = Math.PI/2;
        roof.position.y = 6.25;
		roof.frustumCulled = false;
		palace.add(roof);
		
		top = new THREE.Mesh(
			new THREE.CubeGeometry(6, 3, 4, this.LOD*2, this.LOD, this.LOD),
			this.setMaterial({
				ambient: 0xCACA9C,
				color: 0xCACA9C,
			})
		);
        top.position.y = 8;
		top.frustumCulled = false;
		palace.add(top);

		return palace;
	},
	
	church: function () {
	    var church, tower, building;

		church = new THREE.Object3D();
		
		building = new THREE.Mesh(
			new THREE.CubeGeometry(6, 4, 8, this.LOD*2, this.LOD, this.LOD*2),
			this.setMaterial({
				ambient: 0xCCEECC,
				color: 0xCCEECC
			})
		);
		building.position.y = 2;
		building.frustumCulled = false;
        church.add(building);
		
		tower = new THREE.Mesh(
			new THREE.CubeGeometry(3, 9, 3, this.LOD, this.LOD*2, this.LOD),
			this.setMaterial({
				ambient: 0xCCEECC,
				color: 0xCCEECC
			})
		);
		tower.position = new THREE.Vector3(0,4.5,5.5);
		tower.frustumCulled = false;
		church.add(tower);

		var r=0.2;
		towerRoof = new THREE.Mesh(
			new THREE.CylinderGeometry(r,2.5,3, 16,4*this.LOD,false),
			this.setMaterial({
				ambient: 0xFFAA99,
				color: 0xFFAA99,
		        shading: THREE.FlatShading, 
			})
		);
		towerRoof.rotation.y = Math.PI/4;
		towerRoof.position = new THREE.Vector3(0,10.5,5.5);
		towerRoof.frustumCulled = false;
		church.add(towerRoof);

		crossVerticalBar = new THREE.Mesh(
			new THREE.CubeGeometry(r*1.41, r*1.41, 4, 1, 1, this.LOD),
			this.setMaterial({
				ambient: 0xCACA9C,
				color: 0xCACA9C
			})
		);
		crossVerticalBar.rotation.x = Math.PI/2;
		crossVerticalBar.position = new THREE.Vector3(0,14,5.5);
		crossVerticalBar.frustumCulled = false;
        church.add(crossVerticalBar);

		crossHorizontalBar = new THREE.Mesh(
			new THREE.CubeGeometry(r*1.41, r*1.41, 2, 1, 1, this.LOD),
			this.setMaterial({
				ambient: 0xCACA9C,
				color: 0xCACA9C
			})
		);
		crossHorizontalBar.rotation.y = Math.PI/2;
		crossHorizontalBar.position = new THREE.Vector3(0,15,5.5);
		crossHorizontalBar.frustumCulled = false;
        church.add(crossHorizontalBar);
		
		return church;
	},
	
	runway: function () {
	    var runway;

		runway = new THREE.Mesh(
			new THREE.PlaneGeometry(10, 100, 2*this.LOD, 8*this.LOD),
			this.setMaterial({
				ambient: 0xAAAAAA,
				color: 0x777777,
			})
		);
		runway.frustumCulled = false;
		
		return runway;
	}	
};