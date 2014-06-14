
function CovariantMaterial () {
    var instance = null,
        covariantMaterial = function () {
            var self = this,

                material = [],
                vertexShaderCode,
                fragmentShaderCode,
                relativityUniforms,
                dopplerMap,
                dopplerShiftTable,

                init = function () {
                    vertexShaderCode = loadAscii("lambertVertexShader");
                    fragmentShaderCode = loadAscii("lambertFragmentShader");
                    dopplerShiftTable = new DopplerShiftTable();

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
                },

                setUniforms = function(uniformName, value) {
                    for (var i = 0; i < material.length; i++) {
                        material[i].object.uniforms[uniformName].value = value;
                    }
                },

                isMaterialEqual = function(material1, material2) {
                    if (material1.vertexShader !== material2.vertexShader) return false;
                    if (material1.fragmentShader !== material2.fragmentShader) return false;

                    if (material1.ambient !== material2.ambient) return false;
                    if (material1.color !== material2.color) return false;

                    if (material1.shading !== material2.shading) return false;

                    if (material1.map !== material2.map) return false;

                    return true;
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

            self.updateBoostParameters = function(boost) {
                var beta = boost.getBeta(),
                    gamma = boost.getGamma(),
                    tanObserverViewConeAngle = Math.tan(boost.getObserverViewConeAngle());

                setUniforms("beta", beta);
                setUniforms("gamma", gamma);
                setUniforms("tanObserverViewConeAngle", tanObserverViewConeAngle);

                dopplerShiftTable.update({
                    beta: beta,
                    gamma: gamma,
                    tanObserverViewConeAngle: tanObserverViewConeAngle
                });
            };

            self.updateDopplerShiftRescale = function(dopplerShiftRescale) {
                dopplerShiftTable.update({
                    dopplerShiftRescale: dopplerShiftRescale
                });                
            };

            self.getMaterial = function(newMaterial) {
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
        };

    instance = new covariantMaterial();

    CovariantMaterial = function () {
        return instance;
    };

    return instance;
}