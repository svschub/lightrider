
function CovariantMaterial () {
    var instance = null,
        covariantMaterial = function () {
            var self = this,
                
                deferred,

                material = [],
                vertexShaderCode,
                fragmentShaderCode,
                relativityUniforms,
                dopplerMap,
                dopplerShiftTable,

                init = function () {
//                    console.log('DEBUG: CovariantMaterial init');
                    deferred = new $.Deferred();

                    $.when(
                        AsyncLoader.get("Shaders/covariantLambert.vs"),
                        AsyncLoader.get("Shaders/covariantLambert.fs")
                    ).then(function(vsResponse, fsResponse) {
//                        console.log('DEBUG: CovariantMaterial ready');
                        vertexShaderCode = vsResponse;
                        fragmentShaderCode = fsResponse;

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

                        dopplerMap = THREE.ImageUtils.loadTexture(
                            "/Lightrider/Objects/Shaders/dopplerMap.png", 
                            THREE.UVMapping, 
                            function () {
                                dopplerMap.needsUpdate = true;
                            }
                        );

                        relativityUniforms.dopplerMap.value = dopplerMap;

                        relativityUniforms.dopplerShift.value = dopplerShiftTable.getTexture();

//                        console.log('DEBUG: CovariantMaterial resolve');
                        deferred.resolve();
                    }).fail(function(error) {
//                        console.log('DEBUG: CovariantMaterial reject');
                        deferred.reject(error); 
                    });
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


            self.getPromise = function () {
                return deferred.promise();                
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
                var i, vsCode, fsCode, uniforms,
                    shaderDefinitions = [];

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
                } else {
                    uniforms.ambient.value = new THREE.Color(0xAAAAAA);
                }

                if (newMaterial.color) {
                    uniforms.diffuse.value = new THREE.Color(newMaterial.color);
                } else {
                    uniforms.diffuse.value = new THREE.Color(0xAAAAAA);
                }

                if (newMaterial.vertexColors && newMaterial.vertexColors == THREE.VertexColors) {
                    shaderDefinitions.push("#define USE_COLOR");
                }

                if (newMaterial.map) {
                    shaderDefinitions.push("#define USE_MAP");
                    uniforms.map.texture = THREE.ImageUtils.loadTexture(newMaterial.map);
                }

                if (shaderDefinitions.length > 0) {
                    vsCode = shaderDefinitions.concat([vsCode]).join("\n");
                    fsCode = shaderDefinitions.concat([fsCode]).join("\n");
                }

                material.push({
                    vertexShader: newMaterial.vertexShader,
                    fragmentShader: newMaterial.fragmentShader,

                    ambient: newMaterial.ambient,
                    color: newMaterial.color,
                    shading: newMaterial.shading,
                    vertexColors: newMaterial.vertexColors,

                    map: newMaterial.map,

                    object: new THREE.ShaderMaterial({
                        uniforms:       uniforms,
                        vertexShader:   vsCode,
                        fragmentShader: fsCode,
                        shading:        newMaterial.shading,
                        vertexColors:   newMaterial.vertexColors,
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
