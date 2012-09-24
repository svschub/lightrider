
function readFile(fileName) {  
    var shaderSource;
        
    $.ajax({
        url: "getFileContent.php",
        type: 'POST',
        data: {
            filename: fileName
        },
        async: false,
        cache: false,
        timeout: 30000,
        error: function(){
            deleteShader(shader);
            shaderSource = "";
        },
        success: function(response){
            shaderSource = response;
        }
    });

    return shaderSource;
}

function setVisibility (object3d, visible) {
    THREE.SceneUtils.traverseHierarchy(object3d, function (child) {
        child.visible = visible;
    });
}

BetaSlider = function (properties) {
    var a = properties.halfScale*properties.halfScale/(1-2*properties.halfScale),
        b = Math.log((1+a)/a);
            
    $("#betaSlider").slider({
        orientation: "vertical",
        min: 0.0,
        max: 1.0,
        step: 0.01,
        slide: function(e, ui) { 
            properties.handle(a*Math.exp(b*ui.value)-a);
        }
    });
        
    $("#betaSlider .ui-slider-handle").unbind("keydown");
    
    this.sliderHeight = parseFloat($("#betaSlider").css("height"));

    this.scaleHeight = parseFloat($("#betaScale").attr("height"));
    this.scaleOffset = 0.5*(this.scaleHeight - this.sliderHeight);
    
    this.scale = $("#betaScale")[0].getContext('2d');
    this.scale.lineWidth = 3;
    this.scale.strokeStyle = "#000000";
    
    this.a = a;
    this.b = b;
    
    this.drawScale();
};

BetaSlider.prototype = {
    constructor: BetaSlider,
    
    getScaleY: function (beta) {
        return Math.log(beta/this.a + 1)/this.b;
    },
    
    drawScaleEntry: function (beta, precision, lineWidth, fontsize) {
        var y = this.scaleOffset + this.sliderHeight*(1.0-this.getScaleY(beta));
        
        this.scale.beginPath();
        this.scale.moveTo(0, y);
        this.scale.lineTo(lineWidth, y);
        this.scale.stroke();
        
        this.scale.fillText(beta.toFixed(precision), lineWidth + 13, y + fontsize/2 - 2);
    },

    drawScale: function () {
        this.scale.font = "normal 16pt Calibri";
        this.drawScaleEntry(0.5, 1, 13, 16);
        this.drawScaleEntry(0.8, 1, 13, 16);
        this.drawScaleEntry(0.9, 1, 13, 16);
        this.drawScaleEntry(0.95, 2, 13, 16);
        this.drawScaleEntry(0.99, 2, 13, 16);

        this.scale.font = "normal 20pt Calibri";
        this.drawScaleEntry(0.001, 0, 18, 20);
        this.drawScaleEntry(0.999, 0, 18, 20);
    },
};


DopplerShiftTable = function () {
    this.tableSize = 512;

    this.texture = this.createEmptyTexture();

    this.setRgbBoundaryVectors();
    this.setShiftBoundaries();
    
    this.setInitialBoostParameters();
        
    this.disable();
};

DopplerShiftTable.prototype = {
    constructor: DopplerShiftTable,
    
    createEmptyTexture: function () {
        var n = 3*this.tableSize,
            data = new Uint8Array(n),
            texture = new THREE.DataTexture(data, this.tableSize, 1, THREE.RGBFormat);
            
        for (var i=0; i < n; i++) {
            texture.image.data[i] = 0;
        }
        
        return texture;
    },
    
    setRgbBoundaryVectors: function () {
        var rMin = -0.448615,
            rMax = 1.55035,
            gMin = -0.230001,
            gMax = 1.02742,
            bMin = -0.269253, 
            bMax = 1.13998;

        this.rgbMinVector = new THREE.Vector4(rMin, gMin, bMin, 0.0);
        this.rgbRangeVector = new THREE.Vector4(rMax-rMin, gMax-gMin, bMax-bMin, 1.0);
    },
    
    setShiftBoundaries: function () {
        var lambdaMin = 380,  // [nm]
            lambdaMax = 780;  // [nm]

        this.shiftMin = lambdaMin/lambdaMax;
        this.shiftMax = lambdaMax/lambdaMin;
        
        this.shiftRange = this.shiftMax - this.shiftMin;
        this.invShiftRange = 1/this.shiftRange;
    },
    
    setInitialBoostParameters: function () {
        this.beta = 0;
        this.betaCalculated = -1000;

        this.gamma = 1.0;

        this.dopplerShiftRescale = 1.0;
        this.dopplerShiftRescaleCalculated = -1.0;
    },
    
    enable: function () {
        this.isDopplerEffectEnabled = true;
    },
    
    disable: function () {
        this.isDopplerEffectEnabled = false;
    },
    
    calculateNonrelativisticValues: function () {    
        var n = 3*this.tableSize,
            shift = 255*(1.0-this.shiftMin)*this.invShiftRange;

        if (shift > 255) shift = 255;
        
        for (var i=0; i < n; i += 3) {
            this.texture.image.data[i] = shift;
        }
    },

    calculateRelativisticValues: function () {    
        var n = 3*this.tableSize,
            cosAngle, tanAngle, dTanAngle, 
            cosAngleRef, tanAngleRef, 
            shift;
        
        tanAngle = 0;
        dTanAngle = this.tanObserverViewConeAngle/(this.tableSize-1);
        
        for (var i=0; i < n; i += 3) {
            cosAngle = 1/Math.sqrt(1+tanAngle*tanAngle);
            tanAngleRef = tanAngle*cosAngle/(this.gamma*(cosAngle-this.beta));
            cosAngleRef = 1/Math.sqrt(1+tanAngleRef*tanAngleRef);
            if (tanAngleRef < 0) cosAngleRef = -cosAngleRef;

            shift = this.gamma*(1 - this.beta*cosAngleRef);
            shift = 1 + (shift - 1)*this.dopplerShiftRescale;
            
            if (shift < this.shiftMin) shift = this.shiftMin;
            if (shift > this.shiftMax) shift = this.shiftMax;

            this.texture.image.data[i] = 255*(shift-this.shiftMin)*this.invShiftRange;

            tanAngle += dTanAngle;
        }
    },

    calculateValues: function () {
        if (this.beta !== 0) {
            this.calculateRelativisticValues();
        } else {
            this.calculateNonrelativisticValues();
        }
        this.texture.needsUpdate = true;        
    },

    update: function (boostParameters) {
        if (typeof boostParameters !== "undefined") {
            for (var property in boostParameters) {
                this[property] = boostParameters[property];
            }
        }
        
        if (this.isDopplerEffectEnabled) {
            if ( (this.beta !== this.betaCalculated) || (this.dopplerShiftRescale !== this.dopplerShiftRescaleCalculated) ) {
                this.calculateValues(); 

                this.betaCalculated = this.beta;
                this.dopplerShiftRescaleCalculated = this.dopplerShiftRescale;
            }
        }
    },
};
BoostFactory = function () {
    this.beta = 0.0;
    this.gamma = 1.0;
    this.invgamma = 1.0;
    
    this.material = [];

    this.vertexShaderCode = readFile("shaders/covariantLambert.vs");
    this.fragmentShaderCode = readFile("shaders/covariantLambert.fs");

    this.dopplerShiftTable = new DopplerShiftTable();    

    this.relativityUniforms = { 
        "isBoostEnabled": { type: "i", value: 0 },
        "isDopplerEffectEnabled": { type: "i", value: 0 },
        "beta": { type: "f", value: 0.0 },
        "gamma": { type: "f", value: 1.0 },
        "tanObserverViewConeAngle": { type: "f", value: 0.0 },
        "dopplerShift": { type: "t", value: 0 },
        "dopplerMap": { type: "t", value: 1 },
        "rgbmin" : { type: "v4", value: this.dopplerShiftTable.rgbMinVector },
        "rgbrange" : { type: "v4", value: this.dopplerShiftTable.rgbRangeVector },
    };

    this.dopplerMap = THREE.ImageUtils.loadTexture('shaders/dopplerMap.png');

    this.relativityUniforms.dopplerMap.texture = this.dopplerMap;
    this.relativityUniforms.dopplerShift.texture = this.dopplerShiftTable.texture;
    
    this.observerViewConeAngle = 0;
    this.setBoostParameters(0);
};

BoostFactory.prototype = {
    constructor: BoostFactory,

    setUniforms: function (uniformName, value) {
        for (var i=0; i < this.material.length; i++) {
            this.material[i].object.uniforms[uniformName].value = value;
        }
    },

    enableBoost: function () {
        this.setUniforms("isBoostEnabled", 1);
    },

    disableBoost: function () {        
        this.setUniforms("isBoostEnabled", 0);
    },

    enableDopplerEffect: function () {
        this.setUniforms("isDopplerEffectEnabled", 1);

        this.dopplerShiftTable.enable();
        this.dopplerShiftTable.update();
    },

    disableDopplerEffect: function () {        
        this.setUniforms("isDopplerEffectEnabled", 0);

        this.dopplerShiftTable.disable();
    },

    setBoostParameters: function (beta) {
        this.beta = beta;
        this.invgamma = Math.sqrt(1-this.beta*this.beta);
        this.gamma = 1/this.invgamma;

        this.setUniforms("beta", this.beta);
        this.setUniforms("gamma", this.gamma);

        this.dopplerShiftTable.update({
            beta: this.beta, 
            gamma: this.gamma, 
            tanObserverViewConeAngle: Math.tan(this.observerViewConeAngle),
        });

        this.calculateReferenceViewConeAngle();
    },

    setObserverViewConeAngle: function (observerViewConeAngle) {
        this.observerViewConeAngle = observerViewConeAngle;
        this.setUniforms("tanObserverViewConeAngle", Math.tan(this.observerViewConeAngle));

        this.calculateReferenceViewConeAngle();        
    },
    
    calculateReferenceViewConeAngle: function () {
        this.referenceViewConeAngle = this.getReferenceAngle(this.observerViewConeAngle);        
    },
    
    getReferenceVertex: function (vertex) {
        return new THREE.Vector3(vertex.x, vertex.y, this.gamma*vertex.z - this.gamma*this.beta*vertex.length());
    },

    getObserverVertex: function (vertex) {
        return new THREE.Vector3(vertex.x, vertex.y, this.gamma*vertex.z + this.gamma*this.beta*vertex.length());
    },

    getReferenceAngle: function (angle) {
        var referenceAngle = Math.atan(this.invgamma*Math.sin(angle)/(Math.cos(angle)-this.beta));
        if (referenceAngle <= 0) {
            referenceAngle += Math.PI;
        }
        return referenceAngle;
    },

    getObserverAngle: function (angle) {
        var observerAngle = Math.atan(this.invgamma*Math.sin(angle)/(Math.cos(angle)+this.beta));
        if (observerAngle <= 0) {
            observerAngle += Math.PI;
        }
        return observerAngle;
    },
    
    isMaterialEqual: function (material1, material2) {
        if (material1.vertexShader !== material2.vertexShader) return false;
        if (material1.fragmentShader !== material2.fragmentShader) return false;

        if (material1.ambient !== material2.ambient) return false;
        if (material1.color !== material2.color) return false;

        if (material1.shading !== material2.shading) return false;

        if (material1.map !== material2.map) return false;

        return true;
    },

    setMaterial: function (material) {
        var vertexShaderCode, fragmentShaderCode, uniforms;

        for (var i=0; i < this.material.length; i++) {
            if ( this.isMaterialEqual(material, this.material[i]) ) {
                return this.material[i].object;
            }
        }
        
        uniforms = THREE.UniformsUtils.merge([
            THREE.ShaderLib['lambert'].uniforms,
            this.relativityUniforms,
            material.uniforms || {},
        ]);

        uniforms.dopplerMap.texture = this.dopplerMap;        
        uniforms.dopplerShift.texture = this.dopplerShiftTable.texture;

        if (material.vertexShader) {
            vertexShaderCode = material.vertexShader;
        } else {
            vertexShaderCode = this.vertexShaderCode;
        }
        
        if (material.fragmentShader) {
            fragmentShaderCode = material.fragmentShader;
        } else {
            fragmentShaderCode = this.fragmentShaderCode;
        }

        if (material.ambient) {
            uniforms.ambient.value = new THREE.Color(material.ambient);
        }
        if (material.color) {
            uniforms.diffuse.value = new THREE.Color(material.color);
        }
        
        if (material.map) {
            uniforms.map.texture = THREE.ImageUtils.loadTexture(material.map);

            vertexShaderCode = [
                "#define USE_MAP",
                vertexShaderCode,
            ].join("\n");
            
            fragmentShaderCode = [
                "#define USE_MAP",
                fragmentShaderCode,
            ].join("\n");
        }

        this.material.push({
            vertexShader: material.vertexShader,
            fragmentShader: material.fragmentShader,

            ambient: material.ambient,
            color: material.color,
            shading: material.shading,

            map: material.map,
            
            object: new THREE.ShaderMaterial({
                uniforms:       uniforms,
                vertexShader:   vertexShaderCode,
                fragmentShader: fragmentShaderCode,
                shading:        material.shading,
                lights:         true,
            }),
        });
        
        return this.material[this.material.length-1].object;
    },
};

CockpitGeometry = function () {
    var lightGrey = new THREE.Color(0xDDDDDD),
        darkGrey = new THREE.Color(0xAAAAAA),
        black = new THREE.Color(0x333333),
        vertices, shape; 
    
    THREE.Geometry.call(this);
    
    this.normal = new THREE.Vector3(0, 0, -1);
    
    this.materials = [
        new THREE.MeshBasicMaterial({
            color: 0xDDDDDD,
            vertexColors: THREE.VertexColors,
        }),
        new THREE.MeshBasicMaterial({
            color: 0x333333,
            vertexColors: THREE.VertexColors,
        }),        
    ];

    vertices = [
        [0.1, 0.83, 0.77],
        [0.2, 0.87, 0.77],
        [0.35, 0.82, 0.77],
        [0.1, 0.82, 0.77],
        [0.35, 0.73, 0.77],
        [0.1, 0.73, 0.77],
        [0.35, 0.67, 0.77],
        [0.39, 0.74, 0.77],

        [-0.1, 0.83, 0.77],
        [-0.2, 0.87, 0.77],
        [-0.35, 0.82, 0.77],
        [-0.1, 0.82, 0.77],
        [-0.35, 0.73, 0.77],
        [-0.1, 0.73, 0.77],
        [-0.35, 0.67, 0.77],
        [-0.39, 0.74, 0.77],

        [-0.09, 0.71, 0.79],
        [0.09, 0.71, 0.79],
        [0.025, 0.6, 0.6],
        [-0.025, 0.6, 0.6],
        
        [0.29, 0.67, 0.77],
        [0.39, 0.74, 0.77],
        [0.39, 0.74, 0.5],
        [0.29, 0.67, 0.5],

        [-0.29, 0.67, 0.77],
        [-0.39, 0.74, 0.77],
        [-0.39, 0.74, 0.5],
        [-0.29, 0.67, 0.5],

        [-0.4, 0.6, 0.8],
        [+0.4, 0.6, 0.8],
        [+0.4, 0.6, 0.5],
        [-0.4, 0.6, 0.5],

        [-0.3, 0.8, 0.9],
        [+0.3, 0.8, 0.9],
    ];
    
    for (var i=0; i < vertices.length; i++) {
        var vertex = vertices[i];
        this.vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
    }
    
    this.faces.push(this.triangle(0, 1, 2, lightGrey));
    this.faces.push(this.triangle(3, 0, 2, lightGrey));
    this.faces.push(this.rectangle(3, 2, 4, 5, lightGrey));
    this.faces.push(this.triangle(5, 4, 6, lightGrey));
    this.faces.push(this.triangle(2, 7, 6, lightGrey));

    this.faces.push(this.triangle(10, 9, 8, lightGrey));
    this.faces.push(this.triangle(10, 8, 11, lightGrey));
    this.faces.push(this.rectangle(13, 12, 10, 11, lightGrey));
    this.faces.push(this.triangle(14, 12, 13, lightGrey));
    this.faces.push(this.triangle(14, 15, 10, lightGrey));

    this.faces.push(this.rectangle(16, 17, 18, 19, lightGrey));

    this.faces.push(this.rectangle(20, 21, 22, 23, darkGrey));
    this.faces.push(this.rectangle(27, 26, 25, 24, darkGrey));

    this.faces.push(this.rectangle(28, 29, 30, 31, black));
    this.faces.push(this.rectangle(29, 28, 32, 33, black));
    
    this.faceVertexUvs[0] = [];        

    this.computeCentroids();
};

CockpitGeometry.prototype = new THREE.Geometry();

CockpitGeometry.prototype.constructor = CockpitGeometry;

CockpitGeometry.prototype.triangle = function (a, b, c, color) {
    var shape = new THREE.Face3(a, b, c);
    shape.normal.copy(this.normal);
    shape.vertexNormals = [
        this.normal.clone(), 
        this.normal.clone(), 
        this.normal.clone(),
    ];
    shape.vertexColors = [
        color.clone(),
        color.clone(),
        color.clone(),
    ];
    shape.materialIndex = 0;
    return shape;
};

CockpitGeometry.prototype.rectangle = function (a, b, c, d, color) {
    var shape = new THREE.Face4(a, b, c, d);
    shape.normal.copy(this.normal);
    shape.vertexNormals = [
        this.normal.clone(), 
        this.normal.clone(), 
        this.normal.clone(),
        this.normal.clone(),
    ];
    shape.vertexColors = [
        color.clone(),
        color.clone(),
        color.clone(),
        color.clone(),
    ];
    shape.materialIndex = 0;
    return shape;
};

// TODO

LookDownGroup = function () {
    this.y = 20;

    this.mesh = new THREE.Object3D();

//    this.camera = new THREE.OrthographicCamera(-80,+80, +70,-70, -1000, 1);
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
        
        this.vorIndicator = this.addVorIndicator();
        mesh.add(this.vorIndicator.mesh);
        
        this.rollAngleIndicator = this.addRollAngleIndicator();
        mesh.add(this.rollAngleIndicator.mesh);
        
        this.pitchAngleIndicator = this.addPitchAngleIndicator();
        mesh.add(this.pitchAngleIndicator.mesh);
        
        mesh.add(new THREE.Mesh(
            new CockpitGeometry(),
            new THREE.MeshFaceMaterial()
        ));
                        
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
        cross.add(new THREE.Line(crossLine,    lineMaterial));
        
        return cross;
    },
    
    addVorIndicator: function () {
        var indicator = new AngleIndicator({
            sketch: [
                [0, 0, 0.028],
                [-0.007, 0, 0.008],
                [-0.025, 0, -0.002],
                [-0.006, 0, -0.005],
                [-0.019, 0, -0.018],
                [-0.006, 0, -0.013],
                [0.006, 0, -0.013],
                [0.019, 0, -0.018],
                [0.006, 0, -0.005],
                [0.025, 0, -0.002],
                [0.007, 0, 0.008],
                [0, 0, 0.028],
            ],
            texture: 'textures/vor_indicator.jpg',
            position: new THREE.Vector3(-0.18, 0.79, 0.75),
        });

        return indicator;        
    },
    
    addRollAngleIndicator: function () {
        var indicator = new AngleIndicator({
            sketch: [
                [0, 0, 0.02],
                [-0.004, 0, 0.005],
                [-0.027, 0, -0.002],
                [0.0, 0, -0.005],
                [0.026, 0, -0.002],
                [0.004, 0, 0.005],
                [0, 0, 0.02],
            ],
            texture: 'textures/roll_indicator.jpg',
            position: new THREE.Vector3(0.18, 0.79, 0.75),
        });

        return indicator;
    },
    
    addPitchAngleIndicator: function () {
        var indicator = new AngleIndicator({
            sketch: [
                [-0.012, 0, 0.008],
                [-0.016, 0, 0.005],
                [-0.029, 0, -0.002],
                [-0.01, 0, -0.004],
                [0.024, 0, -0.003],
                [0.024, 0, 0.018],            
                [0.01, 0, 0.004],
                [-0.005, 0, 0.004],
                [-0.012, 0, 0.008],
            ],
            texture: 'textures/pitch_indicator.jpg',
            position: new THREE.Vector3(0.29, 0.77, 0.75),
        });

        return indicator;
    },

    update: function (angles) {
        this.vorIndicator.updateDirection(-angles.sinYawAngle,+angles.cosYawAngle);

        this.rollAngleIndicator.updateDirection(+angles.sinRollAngle,+angles.cosRollAngle);

        var cPa = angles.cosPitchAngle;
        if (angles.cosRollAngle < 0) cPa = -cPa;
        this.pitchAngleIndicator.updateDirection(+angles.sinPitchAngle,+cPa);
    }
};
Horizon = function (boost) {
    this.horizonNormal = new THREE.Vector3(0, 0, -1);
    this.groundNormal = new THREE.Vector3(0, 1, 0);

    this.skyColor = new THREE.Color(0x3355AA);
    this.groundColor = new THREE.Color(0x446600);
            
    this.boundingRadius = 1;
    this.granularity = 16;
    this.horizonArcZshift = 100;  // TODO

    this.boost = boost;
    
    this.initShaders();
    
    this.mesh = new THREE.Object3D();
    
    this.horizonBackground = this.createRectangle(this.horizonBackgroundMaterial);
    this.mesh.add(this.horizonBackground);

    this.horizonArc = this.createHorizonArc();
    this.horizonArc.position.z = -this.horizonArcZshift;
    this.mesh.add(this.horizonArc);

    this.verticalRect = this.createRectangle(this.horizonArcMaterial);
    this.verticalRect.position.z = -this.horizonArcZshift;
    this.mesh.add(this.verticalRect);

    this.horizontalRect = this.createRectangle(this.horizonArcMaterial);
    this.horizontalRect.position.z = -this.horizonArcZshift;
    this.mesh.add(this.horizontalRect);

    this.edgeRect = this.createRectangle(this.horizonArcMaterial);
    this.edgeRect.position.z = -this.horizonArcZshift;
    this.mesh.add(this.edgeRect);
};

Horizon.prototype = {
    constructor: Horizon,

    initShaders: function () {
        var horizonVertexShaderCode = readFile("shaders/covariantHorizon.vs"),
            horizonFragmentShaderCode = readFile("shaders/covariantLambert.fs");

        this.horizonArcMaterial = this.boost.setMaterial({
            vertexShader: [
                "#define HORIZON_ARC",
                horizonVertexShaderCode,
            ].join("\n"),
            fragmentShader: [
                "#define HORIZON",
                "#define USE_COLOR",
                horizonFragmentShaderCode,
            ].join("\n"),

            uniforms: { "horizonArcColor": { type: "c", value: this.skyColor, }, },
        });
        
        this.horizonBackgroundMaterial = this.boost.setMaterial({
            vertexShader: [
                "#define HORIZON_BACKGROUND",
                horizonVertexShaderCode,
            ].join("\n"),
            fragmentShader: [
                "#define HORIZON",
                "#define USE_COLOR",
                horizonFragmentShaderCode,
            ].join("\n"),

            uniforms: { "horizonBackgroundColor": { type: "c", value: this.groundColor, }, },
        });
    },
    
    setZ: function (z) {
        this.mesh.position.z = z;
    },

    getZ: function () {
        return this.mesh.position.z;
    },

    setFrustumParametersFromCamera: function (camera) {
        var near = camera.near,
            far = (this.getZ() + this.horizonBackground.position.z);

        this.ymax = near*Math.tan(camera.fov*Math.PI/360);
        this.ymin = -this.ymax;
        this.xmax = this.ymax*camera.aspect;
        this.xmin = -this.xmax;
        
        this.xmin = far*this.xmin/near;
        this.xmax = far*this.xmax/near;
        this.ymin = far*this.ymin/near;
        this.ymax = far*this.ymax/near;
        
        this.updateRectangleGeometry(
            this.horizonBackground, 
            this.xmin, this.ymin, this.xmax, this.ymax
        );
    },    

    calculateGroundNormal: function (angles) {
        var v = new THREE.Vector3(0, angles.cosPitchAngle, angles.sinPitchAngle);
    
        this.groundNormal.x = -v.y*angles.sinRollAngle;    
        this.groundNormal.y = v.y*angles.cosRollAngle;
        this.groundNormal.z = v.z;
    },
    
    calculateBoundingCircle: function () {
        this.boundingRadius = (this.getZ()-this.horizonArcZshift)*Math.tan(this.viewConeAngle);
    },
    
    calculatePitchCircle: function (angles) {
        var v, vRef, vObs;

        v = new THREE.Vector3(0, -this.viewSphereRadius*angles.sinPitchAngle, this.viewSphereRadius*angles.cosPitchAngle);
        vRef = new THREE.Vector3(-v.y*angles.sinRollAngle, v.y*angles.cosRollAngle, v.z);
        vObs = this.boost.getObserverVertex(vRef);

        vObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/vObs.z);
        
        this.pitchRadius = Math.sqrt(vObs.x*vObs.x + vObs.y*vObs.y);
        this.vanishingPoint = vObs;
    },
    
    calculateAngularNormals: function () {
        var alpha;
        
        this.angularNormal = [];
        
        for (var i=0; i < this.granularity; i++) {
            alpha = Math.PI*i/this.granularity;

            this.angularNormal[i] = new THREE.Vector3(
                -this.viewSphereRadius*Math.cos(alpha),
                 this.viewSphereRadius*Math.sin(alpha),
                 0
            );
        }
    },
    
    updateObserverViewCone: function (viewconeparameters) {
        this.viewConeAngle = viewconeparameters.viewConeAngle;
        this.viewSphereRadius = viewconeparameters.viewSphereRadius;

        this.calculateBoundingCircle();
        this.calculateAngularNormals();
    },

    createRectangle: function (rectangleMaterial) {
        var rectangle, rectangleGeometry, rectangleFace;

        rectangleGeometry = new THREE.Geometry();
        rectangleGeometry.dynamic = true;
        
        rectangleGeometry.vertices = [
            new THREE.Vector3(-1, -1, 0),
            new THREE.Vector3(-1, +1, 0),
            new THREE.Vector3(+1, +1, 0),
            new THREE.Vector3(+1, -1, 0), 
        ];
    
        rectangleFace = new THREE.Face4(0,1,2,3);

        rectangleFace.normal.copy(this.horizonNormal);
        rectangleFace.vertexNormals = [
            this.horizonNormal.clone(), 
            this.horizonNormal.clone(), 
            this.horizonNormal.clone(),
            this.horizonNormal.clone(),
        ];

        rectangleGeometry.faces.push(rectangleFace);
        rectangleGeometry.faceVertexUvs[0] = [];
        rectangleGeometry.computeCentroids();
                
        rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
        
        rectangle.doubleSided = true;
        rectangle.visible = true;
    
        return rectangle;
    },

    updateRectangleGeometry: function (rectangle, xmin, ymin, xmax, ymax) {
        rectangle.geometry.vertices[0].set(xmin, ymin, 0);
        rectangle.geometry.vertices[1].set(xmax, ymin, 0);
        rectangle.geometry.vertices[2].set(xmax, ymax, 0);
        rectangle.geometry.vertices[3].set(xmin, ymax, 0); 

        rectangle.geometry.verticesNeedUpdate = true;

        if ( (xmin != xmax) && (ymin != ymax) ) {
            rectangle.visible = true;
        }        
    },
    
    createHorizonArc: function () {
        var i, j, horizonArc;
        
        this.horizonArcGeometry = new THREE.Geometry();
        this.horizonArcGeometry.dynamic = true;
        
        for (i = 0; i < 2*this.granularity+1; i++) {
            this.horizonArcGeometry.vertices.push(new THREE.Vector3());
        }
        
        for (i = 0; i < 2*this.granularity; i++) {
            j = i + 1;
            if (j == 2*this.granularity) {
                j = 0;
            }
            
            var arcSlice = new THREE.Face3(2*this.granularity, i, j);
            arcSlice.normal.copy(this.horizonNormal);
            arcSlice.vertexNormals = [
                this.horizonNormal.clone(), 
                this.horizonNormal.clone(), 
                this.horizonNormal.clone(),
            ];
            this.horizonArcGeometry.faces.push(arcSlice);
        }
        this.horizonArcGeometry.faceVertexUvs[0] = [];        
        this.horizonArcGeometry.computeCentroids();
        
        horizonArc = new THREE.Mesh(this.horizonArcGeometry, this.horizonArcMaterial);
        
        horizonArc.doubleSided = true;
        
        return horizonArc;
    },
        
    updateHorizonArcColor: function (color) {
        this.horizonArcColor = color;
        this.horizonArcMaterial.uniforms.horizonArcColor.value = color;

        if (this.horizonArcColor === this.skyColor) {
            this.horizonBackgroundMaterial.uniforms.horizonBackgroundColor.value = this.groundColor;
        } else {
            this.horizonBackgroundMaterial.uniforms.horizonBackgroundColor.value = this.skyColor;
        }
    },
        
    isCurvatureNeglegible: function (v0, vn, center) {
        var curvature, v0n, vr, vc, length;
        
        v0n = new THREE.Vector3();
        v0n.sub(vn, v0);
        length = v0n.length();

        vr = new THREE.Vector3(v0n.y, -v0n.x, v0n.z);
        vr.divideScalar(length);
        
        vc = new THREE.Vector3();
        vc.sub(center, v0);
        
        curvature = vc.dot(vr)/length;
        
        return (Math.abs(curvature) < 0.001);
    },

    isTriangle: function (v0, vn, vR) {
        if (vR.x == v0.x) {
            if (Math.abs(vR.y - v0.y) < 0.01) {
                return false;
            }
        }

        if (vR.x == vn.x) {
            if (Math.abs(vR.y - vn.y) < 0.01) {
                return false;
            }
        }
        
        return true;
    },
    
    trianglePointsToCenter: function (v0, vn, vR) {
        var va, vb, det;
        
        va = new THREE.Vector3();
        va.sub(vn,v0);
        
        vb = new THREE.Vector3();
        vb.sub(vR,v0);
        
        det = va.x*vb.y - va.y*vb.x;
                
        return (det*(-va.x*v0.y + va.y*v0.x) > 0);
    },
    
    findRectificationVertex: function (v0, vn, center) {
        var va, vb, det, vRect;
        
        va = new THREE.Vector3();
        va.sub(vn, v0);

        vb = new THREE.Vector3();
        vb.sub(center, v0);

        det = va.x*vb.y - va.y*vb.x;
        
        vRect = new THREE.Vector3(vn.x, v0.y, v0.z);
        vb.sub(vRect, v0);

        if (det*(va.x*vb.y - va.y*vb.x) >= 0) {
            vRect.x = v0.x;
            vRect.y = vn.y;
        }
        
        return vRect;
    },
    
    findGroundRectificationVertex: function (v0, vn, angles) {
        var va, vRect;
        
        vRect = new THREE.Vector3(vn.x, v0.y, v0.z);
        va = new THREE.Vector3();
        va.sub(vRect, v0);
        
        if ((this.groundNormal.x*va.x + this.groundNormal.y*va.y) > 0) {
            vRect.x = v0.x;
            vRect.y = vn.y;
        }
        
        return vRect;
    },
    
    simpleHorizonArcCompletion: function (angles, v0, vn, vR) {
        var x1, y1, x2, y2;
        
        if (Math.abs(angles.cosRollAngle) > 0.5) {
            x1 = this.xmin;
            x2 = this.xmax;
            y1 = v0.y;
            if (angles.cosRollAngle > 0) {
                if (this.horizonArcColor === this.skyColor) {
                    y2 = this.ymax;
                } else {
                    y2 = this.ymin;
                }
            } else {
                if (this.horizonArcColor === this.skyColor) {
                    y2 = this.ymin;
                } else {
                    y2 = this.ymax;
                }
            }
        } else {
            y1 = this.ymin;
            y2 = this.ymax;
            x1 = v0.x;
            if (angles.sinRollAngle > 0) {
                if (this.horizonArcColor === this.skyColor) {
                    x2 = this.xmax;
                } else {
                    x2 = this.xmin;
                }
            } else {
                if (this.horizonArcColor === this.skyColor) {
                    x2 = this.xmin;
                } else {
                    x2 = this.xmax;
                }
            }
        }
        
        this.updateRectangleGeometry(this.horizontalRect, x1, y1, x2, y2);
    },
    
    triangularHorizonArcCompletion: function (angles, v0, vn, vR) {
        var xE, yE, x, y, trianglePointsToCenter;
        
        xE = vR.x;
        yE = vR.y;
                                
        trianglePointsToCenter = this.trianglePointsToCenter(v0,vn,vR);
        
        if (v0.y == vR.y) {

            if (trianglePointsToCenter) {
                if (v0.x < vR.x) {
                    x = this.xmin;
                } else {
                    x = this.xmax;
                }
            } else {
                 x = v0.x;
            }
            
            if (v0.y < vn.y) {
                if (v0.y > this.ymin) {
                    this.updateRectangleGeometry(this.horizontalRect, x, this.ymin, vR.x, vR.y);
                    yE = this.ymin;                    
                }
            } else {
                if (v0.y < this.ymax) {
                    this.updateRectangleGeometry(this.horizontalRect, x, this.ymax, vR.x, vR.y);                
                    yE = this.ymax;
                }
            }
        }

        if (v0.x == vR.x) {

            if (trianglePointsToCenter) {
                if (v0.y < vR.y) {
                    y = this.ymin;
                } else {
                    y = this.ymax;
                }
            } else {
                 y = v0.y;
            }

            if (v0.x < vn.x) {
                if (v0.x > this.xmin) {
                    this.updateRectangleGeometry(this.horizontalRect, this.xmin, y, vR.x, vR.y);                
                    xE = this.xmin;
                }
            } else {
                if (v0.x < this.xmax) {
                    this.updateRectangleGeometry(this.horizontalRect, this.xmax, y, vR.x, vR.y);                
                    xE = this.xmax;
                }
            }
        }

        if (vn.y == vR.y) {

            if (trianglePointsToCenter) {
                if (vn.x < vR.x) {
                    x = this.xmin;
                } else {
                    x = this.xmax;
                }
            } else {
                 x = vn.x;
            }
            
            if (vn.y < v0.y) {
                if (vn.y > this.ymin) {
                    this.updateRectangleGeometry(this.verticalRect, x, this.ymin, vR.x, vR.y);
                    yE = this.ymin;                    
                }
            } else {
                if (vn.y < this.ymax) {
                    this.updateRectangleGeometry(this.verticalRect, x, this.ymax, vR.x, vR.y);                
                    yE = this.ymax;
                }
            }
        }

        if (vn.x == vR.x) {

            if (trianglePointsToCenter) {
                if (vn.y < vR.y) {
                    y = this.ymin;
                } else {
                    y = this.ymax;
                }
            } else {
                 y = vn.y;
            }
            
            if (vn.x < v0.x) {
                if (vn.x > this.xmin) {
                    this.updateRectangleGeometry(this.verticalRect, this.xmin, y, vR.x, vR.y);                
                    xE = this.xmin;
                }
            } else {
                if (vn.x < this.xmax) {
                    this.updateRectangleGeometry(this.verticalRect, this.xmax, y, vR.x, vR.y);                
                    xE = this.xmax;
                }
            }
        }
        
        this.updateRectangleGeometry(this.edgeRect, vR.x, vR.y, xE, yE);
    },

    horizonArcCompletion: function (angles, v0, vn, vR) {        
        this.horizontalRect.visible = false;
        this.verticalRect.visible = false;
        this.edgeRect.visible = false;
        
        if (this.isTriangle(v0, vn, vR)) {
            this.triangularHorizonArcCompletion(angles, v0, vn, vR);
        } else {
            this.simpleHorizonArcCompletion(angles, v0, vn, vR);
        }
    },
    
    updateOpenHorizonArc: function (angles) {
        var dy, vObs, vRef, vRect, 
            h, dx,
            pRef, pObs,
            center, n;
        
        n = this.granularity-1;
        
        this.horizonArcGeometry.vertices[n].x = this.vanishingPoint.x;
        this.horizonArcGeometry.vertices[n].y = this.vanishingPoint.y;
        
        dy = (this.boundingRadius-this.pitchRadius)/n,
        vObs = new THREE.Vector3(0,this.pitchRadius,this.getZ()-this.horizonArcZshift);
        
        pRef = new THREE.Vector3();

        center = new THREE.Vector3();
        center.addSelf(this.horizonArcGeometry.vertices[n]);
        
        for (var i=1; i <= n; i++) {
            vObs.y += dy;
            vRef = this.boost.getReferenceVertex(vObs);
            vRef.multiplyScalar(this.viewSphereRadius/vRef.length());
            
            h = -vRef.z*angles.sinPitchAngle/angles.cosPitchAngle;
            dx = Math.sqrt(vRef.y*vRef.y - h*h);
            
            pRef.x = -dx*angles.cosRollAngle - h*angles.sinRollAngle;
            pRef.y = -dx*angles.sinRollAngle + h*angles.cosRollAngle;
            pRef.z = vRef.z;
            
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);            

            
              this.horizonArcGeometry.vertices[n-i].x = pObs.x;
            this.horizonArcGeometry.vertices[n-i].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[n-i]);

            pRef.x = dx*angles.cosRollAngle - h*angles.sinRollAngle;
            pRef.y = dx*angles.sinRollAngle + h*angles.cosRollAngle;
            pRef.z = vRef.z;
            
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);
            
              this.horizonArcGeometry.vertices[n+i].x = pObs.x;
            this.horizonArcGeometry.vertices[n+i].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[n+i]);
        }        

        center.divideScalar(2*n+1);
        this.horizonArcGeometry.vertices[2*n+2].copy(center);

        if (this.isCurvatureNeglegible(this.horizonArcGeometry.vertices[0], this.horizonArcGeometry.vertices[2*n], center)) {
            vRect = this.findGroundRectificationVertex(
                this.horizonArcGeometry.vertices[0],
                this.horizonArcGeometry.vertices[2*n],
                angles
            );
            this.horizonArcGeometry.vertices[2*n+1].copy(vRect);
            this.updateHorizonArcColor(this.groundColor);
        } else {
            vRect = this.findRectificationVertex(
                this.horizonArcGeometry.vertices[0], 
                this.horizonArcGeometry.vertices[2*n], 
                center
            );    
            this.horizonArcGeometry.vertices[2*n+1].copy(vRect);
            if (angles.sinPitchAngle > 0) {
                this.updateHorizonArcColor(this.skyColor);
            } else {
                this.updateHorizonArcColor(this.groundColor);
            }
        }

        this.horizonArcCompletion(angles, this.horizonArcGeometry.vertices[0], this.horizonArcGeometry.vertices[2*n], vRect);
        
           this.horizonArcGeometry.verticesNeedUpdate = true;
        this.horizonArc.visible = true;
    },

    updateClosedHorizonArc: function (angles) {
        var pCut, pRef, pObs, center;
                
        pRef = new THREE.Vector3();
        vObs = new THREE.Vector3();
        pCut = new THREE.Vector3();
        
         center = new THREE.Vector3();

        for (var i=0; i < this.granularity; i++) {
            pCut.cross(this.angularNormal[i],this.groundNormal);
            pCut.multiplyScalar(this.viewSphereRadius/pCut.length());
            
            pRef.copy(pCut);
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);

              this.horizonArcGeometry.vertices[i].x = pObs.x;
            this.horizonArcGeometry.vertices[i].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[i]);

            pRef.copy(pCut);
            pRef.multiplyScalar(-1);
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);

              this.horizonArcGeometry.vertices[i+this.granularity].x = pObs.x;
            this.horizonArcGeometry.vertices[i+this.granularity].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[i+this.granularity]);
        }

        center.divideScalar(2*this.granularity);
        this.horizonArcGeometry.vertices[2*this.granularity].copy(center);        
        
        if (angles.sinPitchAngle > 0) {
            this.updateHorizonArcColor(this.skyColor);
        } else {
            this.updateHorizonArcColor(this.groundColor);
        }

           this.horizonArcGeometry.verticesNeedUpdate = true;
        this.horizonArc.visible = true;
    },

    update: function (angles) {
        var cosReferenceViewConeAngle = Math.cos(this.boost.referenceViewConeAngle);
        
        this.calculateGroundNormal(angles);

        this.horizonArc.visible = false;
        this.updateRectangleGeometry(this.horizontalRect, 0, 0, 0, 0);                
        this.updateRectangleGeometry(this.verticalRect, 0, 0, 0, 0);                
        this.updateRectangleGeometry(this.edgeRect, 0, 0, 0, 0);                
        
        if (angles.cosPitchAngle > Math.abs(cosReferenceViewConeAngle)) {
            // horizon ground plane cuts the view cone in the reference frame:
            this.calculatePitchCircle(angles);
            this.updateOpenHorizonArc(angles);
        } else {
            if (cosReferenceViewConeAngle < 0) {
                // horizon ground plane completely within the view cone of the reference frame draw 360 deg horizon ...
                this.updateClosedHorizonArc(angles);
            } else {
                // view cone angle in reference frame < 180 deg:
                if (angles.sinPitchAngle >= 0) {
                    this.updateHorizonArcColor(this.groundColor); 
                } else {
                    this.updateHorizonArcColor(this.skyColor); 
                }
            }
        }
    },
};
Observer = function (boost) {
    this.mesh = new THREE.Object3D();
    
    this.camera = new THREE.PerspectiveCamera(45, 4/3, 0.3, 10000);
    this.camera.position = new THREE.Vector3(0,0,0);
    this.camera.lookAt(new THREE.Vector3(0,0,1));
    this.camera.up = new THREE.Vector3(0,1,0);
    this.mesh.add(this.camera);

    this.boost = boost;
    
    this.horizon = new Horizon(this.boost);
    this.horizon.setZ(5000);
    this.horizon.setFrustumParametersFromCamera(this.camera);
    this.mesh.add(this.horizon.mesh);

    this.mesh.position.y = 1;

    this.updateObserverViewCone();
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

        this.boost.setObserverViewConeAngle(this.viewConeAngle);

        this.horizon.updateObserverViewCone({
            viewConeAngle: this.viewConeAngle,
            viewSphereRadius: this.viewSphereRadius,
        });
    },

    update: function (angles) {
        this.horizon.update(angles);
    },
};
World = function (boost) {
    this.LOD = 4;  // level of detail
    
    this.scene = new THREE.Scene();

    this.boost = boost;
    
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
        
    THREE.SceneUtils.traverseHierarchy(this.scene, function (child) {
        child.frustumCulled = false;
    });
};

World.prototype = {
    constructor: World,
    
    add: function (object3d) {
        this.scene.add(object3d);
    },

    columnRow: function (radius, height, number, dx) {
        var columnRow, column;

        columnRow = new THREE.Object3D();

        for (var i=0; i < number; i++) {
            column = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, height, 12, 4*this.LOD, false),
                this.boost.setMaterial({
                    color: 0x999999,
                    ambient: 0x777777,
                })
            );
            column.position.x = i*dx - (number-1)*dx/2;

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
            this.boost.setMaterial({
                ambient: 0xCCEECC,
                color: 0xCCEECC,
            })
        );
        building.position.y = 3;
        palace.add(building);

        roof = new THREE.Mesh(
            new THREE.CubeGeometry(17, 11, 0.5, this.LOD*2, this.LOD*2, 1),
            this.boost.setMaterial({
                ambient: 0xCCEECC,
                color: 0xCCEECC,
            })
        );
        roof.rotation.x = Math.PI/2;
        roof.position.y = 6.25;
        palace.add(roof);
        
        top = new THREE.Mesh(
            new THREE.CubeGeometry(6, 3, 4, this.LOD*2, this.LOD, this.LOD),
            this.boost.setMaterial({
                ambient: 0xCACA9C,
                color: 0xCACA9C,
            })
        );
        top.position.y = 8;
        palace.add(top);

        return palace;
    },
    
    church: function () {
        var church, tower, towerRoof, building, crossHorizontalBar, crossVerticalBar;

        church = new THREE.Object3D();
        
        building = new THREE.Mesh(
            new THREE.CubeGeometry(6, 4, 8, this.LOD*2, this.LOD, this.LOD*2),
            this.boost.setMaterial({
                ambient: 0xCCEECC,
                color: 0xCCEECC
            })
        );
        building.position.y = 2;
        church.add(building);
        
        tower = new THREE.Mesh(
            new THREE.CubeGeometry(3, 9, 3, this.LOD, this.LOD*2, this.LOD),
            this.boost.setMaterial({
                ambient: 0xCCEECC,
                color: 0xCCEECC
            })
        );
        tower.position = new THREE.Vector3(0,4.5,5.5);
        church.add(tower);

        var r=0.2;
        towerRoof = new THREE.Mesh(
            new THREE.CylinderGeometry(r,2.5,3, 16,4*this.LOD,false),
            this.boost.setMaterial({
                ambient: 0xFFAA99,
                color: 0xFFAA99,
                shading: THREE.FlatShading, 
            })
        );
        towerRoof.rotation.y = Math.PI/4;
        towerRoof.position = new THREE.Vector3(0,10.5,5.5);
        church.add(towerRoof);

        crossVerticalBar = new THREE.Mesh(
            new THREE.CubeGeometry(r*1.41, r*1.41, 4, 1, 1, this.LOD),
            this.boost.setMaterial({
                ambient: 0xCACA9C,
                color: 0xCACA9C
            })
        );
        crossVerticalBar.rotation.x = Math.PI/2;
        crossVerticalBar.position = new THREE.Vector3(0,14,5.5);
        church.add(crossVerticalBar);

        crossHorizontalBar = new THREE.Mesh(
            new THREE.CubeGeometry(r*1.41, r*1.41, 2, 1, 1, this.LOD),
            this.boost.setMaterial({
                ambient: 0xCACA9C,
                color: 0xCACA9C
            })
        );
        crossHorizontalBar.rotation.y = Math.PI/2;
        crossHorizontalBar.position = new THREE.Vector3(0,15,5.5);
        church.add(crossHorizontalBar);
        
        return church;
    },
    
    runway: function () {
        var runway;

        runway = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 100, 2*this.LOD, 8*this.LOD),
            this.boost.setMaterial({
                ambient: 0xAAAAAA,
                color: 0x777777,
            })
        );
        
        return runway;
    }    
};

FlightModel = function (boost) {
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
        
    this.createCabin(boost);
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

    createCabin: function (boost) {
        this.cabin = new THREE.Object3D();        

        this.cockpit = new Cockpit();
        this.cabin.add(this.cockpit.mesh);

        this.observer = new Observer(boost);
        this.cabin.add(this.observer.mesh);
        
        this.update();
    },
};

(function ($) {
    'use strict';

    var renderer, world, plane,
        accelerationIncr, rollAngleIncr, pitchAngleIncr, yawAngleIncr,
        keyPressed,
        planeLoop,
        lookDownGroup,
        loopMilliseconds,
        beta, beta_next,
        dopplerShiftRescale, dopplerShiftRescale_next,
        boost;

    function initKeyboardEvents() {
        keyPressed = new Array(256);
        for (var i=0; i < 256; i++) {
            keyPressed[i] = false;
        }        
        $(window).bind("keydown", function (key) {
            if (key.which < 256) {
                keyPressed[key.which] = true;
            }
        });
        $(window).bind("keyup", function (key) {
            if (key.which < 256) {
                keyPressed[key.which] = false;
            }
        });
    }
    
    function initWorld() {
        var canvasWidth=1400, canvasHeight=800;
        
        boost = new BoostFactory();
        
        world = new World(boost);

        plane = new FlightModel(boost);
        plane.position = new THREE.Vector3(0,10,13);
        plane.observer.setViewport(canvasWidth, canvasHeight);
        world.add(plane.cabin);
        
        lookDownGroup = new LookDownGroup();
        world.add(lookDownGroup.mesh);
        
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(canvasWidth, canvasHeight);
        $("#renderContainer").append(renderer.domElement);
    
        accelerationIncr = 0.007;
        pitchAngleIncr = 0.022;
        rollAngleIncr = 0.03;
        yawAngleIncr = 0.02;
    }

    function movePlane() {
        var acceleration,rollAngle,pitchAngle,yawAngle;    

        acceleration = 0.0;
        if (keyPressed[109]) {  // -
            acceleration -= accelerationIncr;
        }
        if (keyPressed[107]) {  // + 
            acceleration += accelerationIncr;
        }
        plane.accelerate(acceleration);
        
        // Rollen:
        rollAngle = 0.0;
        if (keyPressed[37]) {  // left cursor
            rollAngle -= rollAngleIncr;
        }
        if (keyPressed[39]) {  // right cursor
            rollAngle += rollAngleIncr;
        }
        plane.roll(rollAngle);
        
        // Neigen:
        pitchAngle = 0.0;
        if (keyPressed[38]) {  // up cursor
            pitchAngle -= pitchAngleIncr;
        }
        if (keyPressed[40]) {  // down cursor
            pitchAngle += pitchAngleIncr;
        }
        plane.pitch(pitchAngle);
        
        // Gieren:
        yawAngle = 0.0;
        if (keyPressed[33]) {
            yawAngle += yawAngleIncr;
        }
        if (keyPressed[34]) {
            yawAngle -= yawAngleIncr;
        }
        plane.yaw(yawAngle);

        if (keyPressed[27]) {
            clearInterval(planeLoop);
        }
        
        plane.update();
    }

    function updateHudIndicators() {
         var speedMetersPerSecond=plane.getSpeed()*1000/loopMilliseconds,
            speedKmPerSecond=speedMetersPerSecond*3.6,
            viewConeAngle;
            
        if (beta < 0.1) {        
            $("#speed").html("spd " + speedKmPerSecond.toFixed(1) + " km/h");
        } else {
            $("#speed").html("spd " + beta.toFixed(4) + " c");
        }
        
        $("#altitude").html("alt " + plane.getAltitude().toFixed(1) + " m");

        viewConeAngle = 360*boost.referenceViewConeAngle/Math.PI;
        $("#viewConeAngle").html("fov " + viewConeAngle.toFixed(1) + " deg");
    }
    
    function render() {    
        var angles = plane.getAngles(),
            position = plane.getPosition();
            
        if (dopplerShiftRescale_next != dopplerShiftRescale) {
            dopplerShiftRescale = dopplerShiftRescale_next;
            boost.dopplerShiftTable.update({
                dopplerShiftRescale: dopplerShiftRescale,
            });
        }

        if (beta_next != beta) {
            beta = beta_next;
            boost.setBoostParameters(beta);
        }

        updateHudIndicators();
        
        lookDownGroup.setPosition(position);
        lookDownGroup.setViewAngle(angles);

        boost.disableBoost();
        setVisibility(lookDownGroup.mesh, true);
        setVisibility(plane.cabin, false);
        renderer.render(world.scene, lookDownGroup.camera, plane.cockpit.lookDownImage, true);
        
        boost.enableBoost();
        setVisibility(lookDownGroup.mesh, false);
        setVisibility(plane.cabin, true);
        renderer.render(world.scene, plane.observer.camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function init() {                
        initKeyboardEvents();
        initWorld();

        beta = -1000.0;
        beta_next = 0.0;
        
        var slider = new BetaSlider({
            halfScale: 0.9,
            handle: function (value) {
                beta_next = Math.min(value, 0.9999);
            },
        });
        
        $("#setDopplerEffect").attr('checked', false);
        $("#setDopplerEffect").bind("click", function () {
            if ($(this).is(':checked')) {
                boost.enableDopplerEffect();
            } else {
                boost.disableDopplerEffect();
            };
        });

        dopplerShiftRescale = -1;
        dopplerShiftRescale_next = parseFloat( $("#dopplerShiftRescale").val() );
        $("#dopplerShiftRescale").bind("change", function () {
            dopplerShiftRescale_next = parseFloat( $(this).val() );
        });
        
        loopMilliseconds = 30;
        planeLoop = setInterval(movePlane, loopMilliseconds);
    }
    
    init();
    animate();
    
}(jQuery));

