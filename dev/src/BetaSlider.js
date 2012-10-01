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
    
    getValue: function () {
        return $("#betaSlider").slider("value");
    },

    setValue: function (value) {
        $("#betaSlider").slider("value", value);
    },

    getBeta: function () {
        return Math.max(0.0, this.a*Math.exp(this.b*this.getValue()) - this.a);
    },

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

