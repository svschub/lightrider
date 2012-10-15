// DopplerShiftTable = function () {
function DopplerShiftTable () {
    this.tableSize = 512;

    this.texture = this.createEmptyTexture();

    this.setRgbBoundaryVectors();
    this.setShiftBoundaries();
    
    this.setInitialBoostParameters();
        
    this.disable();
}

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