function DopplerShiftTable () {
    var self = this,

        deferred,

        tableSize = 512,
        isDopplerEffectEnabled = false,
        texture,
        rgbMinVector,
        rgbRangeVector,
        shiftMin,
        shiftMax,
        shiftRange,
        invShiftRange,

        params = {
            beta: 0,
            betaCalculated: 0,
            gamma: 1,
            dopplerShiftRescale: 1,
            dopplerShiftRescaleCalculated: 1,
            tanObserverViewConeAngle: 0
        },

        createEmptyTexture = function () {
            var i, n = 3*tableSize,
                data = new Uint8Array(n);

            texture = new THREE.DataTexture(data, tableSize, 1, THREE.RGBFormat);

            for (i = 0; i < n; i++) {
                texture.image.data[i] = 0;
            }
        },

        setRgbBoundaryVectors = function (rgb_range) {
            var rMin = rgb_range.r.min,
                rMax = rgb_range.r.max,
                gMin = rgb_range.g.min,
                gMax = rgb_range.g.max,
                bMin = rgb_range.b.min,
                bMax = rgb_range.b.max;

            rgbMinVector = new THREE.Vector4(rMin, gMin, bMin, 0.0);
            rgbRangeVector = new THREE.Vector4(rMax-rMin, gMax-gMin, bMax-bMin, 1.0);
        },

        setShiftBoundaries  = function () {
            var lambdaMin = 380,  // [nm]
                lambdaMax = 780;  // [nm]

            shiftMin = lambdaMin/lambdaMax;
            shiftMax = lambdaMax/lambdaMin;

            shiftRange = shiftMax - shiftMin;
            invShiftRange = 1/shiftRange;
        },

        setInitialBoostParameters = function () {
            params.beta = 0;
            params.betaCalculated = -1000;

            params.gamma = 1.0;

            params.dopplerShiftRescale = 1.0;
            params.dopplerShiftRescaleCalculated = -1.0;
        },

        init = function () {
            deferred = new $.Deferred();

            $.when(
                AsyncLoader.get("Shaders/rgb_range.json")
            ).then(function(response) {
                createEmptyTexture();

                setRgbBoundaryVectors(response);
                setShiftBoundaries();

                setInitialBoostParameters();
 
                deferred.resolve();
            }).fail(function(error) {
                deferred.reject(error); 
            });
        },

        calculateNonrelativisticValues = function () {
            var i, n = 3*tableSize,
                shift = 255*(1.0-shiftMin)*invShiftRange;

            if (shift > 255) shift = 255;

            for (i = 0; i < n; i += 3) {
                texture.image.data[i] = shift;
            }
        },

        calculateRelativisticValues = function () {
            var i, n = 3*tableSize,
                cosAngle, tanAngle, dTanAngle,
                cosAngleRef, tanAngleRef,
                shift;

            tanAngle = 0;
            dTanAngle = params.tanObserverViewConeAngle/(tableSize-1);

            for (i = 0; i < n; i += 3) {
                cosAngle = 1/Math.sqrt(1+tanAngle*tanAngle);
                tanAngleRef = tanAngle*cosAngle/(params.gamma*(cosAngle-params.beta));
                cosAngleRef = 1/Math.sqrt(1+tanAngleRef*tanAngleRef);
                if (tanAngleRef < 0) cosAngleRef = -cosAngleRef;

                shift = params.gamma*(1 - params.beta*cosAngleRef);
                shift = 1 + (shift - 1)*params.dopplerShiftRescale;

                if (shift < shiftMin) shift = shiftMin;
                if (shift > shiftMax) shift = shiftMax;

                texture.image.data[i] = 255*(shift-shiftMin)*invShiftRange;

                tanAngle += dTanAngle;
            }
        },

        calculateValues = function () {
            if (params.beta !== 0) {
                calculateRelativisticValues();
            } else {
                calculateNonrelativisticValues();
            }
            texture.needsUpdate = true;
        };

    self.getPromise = function () {
        return deferred.promise();
    };

    self.getTexture = function () {
        return texture;
    };

    self.getRgbMinVector = function () {
        return rgbMinVector;
    };

    self.getRgbRangeVector = function () {
        return rgbRangeVector;
    };

    self.enable = function () {
        isDopplerEffectEnabled = true;
    };

    self.disable = function () {
        isDopplerEffectEnabled = false;
    };

    self.update = function (boostParameters) {
        if (typeof boostParameters !== "undefined") {
            for (var property in boostParameters) {
                params[property] = boostParameters[property];
            }
        }

        if (isDopplerEffectEnabled) {
            if ( (params.beta !== params.betaCalculated) || (params.dopplerShiftRescale !== params.dopplerShiftRescaleCalculated) ) {
                calculateValues();

                params.betaCalculated = params.beta;
                params.dopplerShiftRescaleCalculated = params.dopplerShiftRescale;
            }
        }
    };

    init();
}
