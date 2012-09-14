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