
function BoostFactory () {
    var self = this,

        beta = 0.0,
        gamma = 1.0,
        invgamma = 1.0,
        material = [],
        vertexShaderCode,
        fragmentShaderCode,
        dopplerShiftTable,
        relativityUniforms,
        dopplerMap,
        observerViewConeAngle,
        referenceViewConeAngle,

        init = function () {
            vertexShaderCode = loadAscii("lambertVertexShader"),
            fragmentShaderCode = loadAscii("lambertFragmentShader"),
            dopplerShiftTable = new DopplerShiftTable(),

            relativityUniforms = {
                "isBoostEnabled": { type: "i", value: 0 },
                "isDopplerEffectEnabled": { type: "i", value: 0 },
                "beta": { type: "f", value: 0.0 },
                "gamma": { type: "f", value: 1.0 },
                "tanObserverViewConeAngle": { type: "f", value: 0.0 },
                "dopplerShift": { type: "t" },
                "dopplerMap": { type: "t" },
                "rgbmin" : { type: "v4", value: dopplerShiftTable.getRgbMinVector() },
                "rgbrange" : { type: "v4", value: dopplerShiftTable.getRgbRangeVector() }
            };

            dopplerMap = loadTexture("dopplerMap");
            relativityUniforms.dopplerMap.value = dopplerMap;

            relativityUniforms.dopplerShift.value = dopplerShiftTable.getTexture();

            observerViewConeAngle = 0;
            self.setBoostParameters(0);
        },
        
        setUniforms = function (uniformName, value) {
            var i;

            for (i = 0; i < material.length; i++) {
                material[i].object.uniforms[uniformName].value = value;
            }
        },

        isMaterialEqual = function (material1, material2) {
            if (material1.vertexShader !== material2.vertexShader) return false;
            if (material1.fragmentShader !== material2.fragmentShader) return false;

            if (material1.ambient !== material2.ambient) return false;
            if (material1.color !== material2.color) return false;

            if (material1.shading !== material2.shading) return false;

            if (material1.map !== material2.map) return false;

            return true;
        },

        calculateReferenceViewConeAngle = function () {
            referenceViewConeAngle = self.getReferenceAngle(observerViewConeAngle);
        };

    self.enableBoost = function () {
        setUniforms("isBoostEnabled", 1);
    };

    self.disableBoost = function () {
        setUniforms("isBoostEnabled", 0);
    };

    self.enableDopplerEffect = function () {
        setUniforms("isDopplerEffectEnabled", 1);
        dopplerShiftTable.enable();
        dopplerShiftTable.update();
    };

    self.disableDopplerEffect = function () {
        setUniforms("isDopplerEffectEnabled", 0);
        dopplerShiftTable.disable();
    },

    self.setBoostParameters = function (betaParam) {
        beta = betaParam;
        invgamma = Math.sqrt(1-beta*beta);
        gamma = 1/invgamma;

        setUniforms("beta", beta);
        setUniforms("gamma", gamma);

        dopplerShiftTable.update({
            beta: beta,
            gamma: gamma,
            tanObserverViewConeAngle: Math.tan(observerViewConeAngle)
        });

        calculateReferenceViewConeAngle();
    };

    self.getBeta = function () {
        return beta;
    };
    
    self.getDopplerShiftTable = function () {
        return dopplerShiftTable;
    };

    self.getReferenceViewConeAngle = function () {
        return referenceViewConeAngle;
    };
    
    self.setObserverViewConeAngle = function (observerViewConeAngleParam) {
        observerViewConeAngle = observerViewConeAngleParam;
        setUniforms("tanObserverViewConeAngle", Math.tan(observerViewConeAngle));
        calculateReferenceViewConeAngle();
    };

    self.getReferenceVertex = function (vertex) {
        return new THREE.Vector3(vertex.x, vertex.y, gamma*(vertex.z - beta*vertex.length()));
    };

    self.getObserverVertex = function (vertex) {
        return new THREE.Vector3(vertex.x, vertex.y, gamma*(vertex.z + beta*vertex.length()));
    };

    self.getReferenceAngle = function (angle) {
        var referenceAngle = Math.atan(invgamma*Math.sin(angle)/(Math.cos(angle)-beta));
        if (referenceAngle <= 0) {
            referenceAngle += Math.PI;
        }
        return referenceAngle;
    };

    self.getObserverAngle = function (angle) {
        var observerAngle = Math.atan(invgamma*Math.sin(angle)/(Math.cos(angle)+beta));
        if (observerAngle <= 0) {
            observerAngle += Math.PI;
        }
        return observerAngle;
    };

    self.setMaterial = function (newMaterial) {
        var i, vsCode, fsCode, uniforms;

        for (i = 0; i < material.length; i++) {
            if ( isMaterialEqual(newMaterial, material[i]) ) {
                return material[i].object;
            }
        }


        uniforms = THREE.UniformsUtils.merge([
            THREE.ShaderLib['lambert'].uniforms,
            relativityUniforms,
            newMaterial.uniforms || {},
        ]);

        uniforms.dopplerMap.value = dopplerMap;
        uniforms.dopplerShift.value = dopplerShiftTable.getTexture();

        if (newMaterial.vertexShader) {
            vsCode = newMaterial.vertexShader;
        } else {
            vsCode = vertexShaderCode;
        }

        if (newMaterial.fragmentShader) {
            fsCode = newMaterial.fragmentShader;
        } else {
            fsCode = fragmentShaderCode;
        }

        if (newMaterial.ambient) {
            uniforms.ambient.value = new THREE.Color(newMaterial.ambient);
        }
        if (newMaterial.color) {
            uniforms.diffuse.value = new THREE.Color(newMaterial.color);
        }

        if (newMaterial.map) {
            uniforms.map.texture = THREE.ImageUtils.loadTexture(newMaterial.map);

            vsCode = [
                "#define USE_MAP",
                vsCode,
            ].join("\n");

            fsCode = [
                "#define USE_MAP",
                fsCode,
            ].join("\n");
        }

        material.push({
            vertexShader: newMaterial.vertexShader,
            fragmentShader: newMaterial.fragmentShader,

            ambient: newMaterial.ambient,
            color: newMaterial.color,
            shading: newMaterial.shading,

            map: newMaterial.map,

            object: new THREE.ShaderMaterial({
                uniforms:       uniforms,
                vertexShader:   vsCode,
                fragmentShader: fsCode,
                shading:        newMaterial.shading,
                lights:         true
            })
        });

        return material[material.length-1].object;
    };

    init();
}
