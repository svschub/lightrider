function BetaSlider (properties) {
    var self = this,
        a = properties.halfScale*properties.halfScale/(1-2*properties.halfScale),
        b = Math.log((1+a)/a);

    this.enabled = true;

    this.handleSlider = properties.handle;

    $("#instrumentContainer").css("height", $(window).height().toFixed(0));

    $("#betaSlider").slider({
        orientation: "vertical",
        min: 0.0,
        max: 1.0,
        step: 0.01,
        slide: function(e, ui) {
            self.handleSlider(a*Math.exp(b*ui.value)-a);
        }
    });
    $("#betaSlider .ui-slider-handle").unbind("keydown");
    this.bindMouseWheelEvents();

    this.addScale(100, Math.min(0.8*$(window).height(), 500));

    this.a = a;
    this.b = b;

    this.drawScale();
}

BetaSlider.prototype = {
    constructor: BetaSlider,

    addScale: function (width, height) {
        this.sliderHeight = height;
        $("#betaSlider").css("height", this.sliderHeight.toFixed(0));

        this.scaleHeight = height + 20;
        this.scaleOffset = 10;

        $(['<canvas id="betaScale" class="horizontal"',
           ' width="', width.toFixed(0), '"',
           ' height="', this.scaleHeight.toFixed(0), '">',
           'Browser does not support canvas!',
           '</canvas>'].join("")).insertAfter("#betaSlider");

        $("#betaScale").width(width);
        $("#betaScale").height(height + 20);
        $("#betaScale").attr("height", this.scaleHeight.toFixed(0));

        $("#instrumentContainer > div").css("top", 0.9 * ($(window).height() - $("#instrumentContainer > div").height()));

        this.scale = $("#betaScale")[0].getContext('2d');
        this.scale.lineWidth = 3;
        this.scale.strokeStyle = "#000000";
    },

    bindMouseWheelEvents: function () {
        var self = this;

        if (document.body.addEventListener) {
            // Chrome, Safari, Opera, IE9
            document.body.addEventListener("mousewheel", function (e) {
                self.handleMouseWheel(self, e);
            }, false);

            // Firefox
            document.body.addEventListener("DOMMouseScroll", function (e) {
                self.handleMouseWheel(self, e);
            }, false);
        }
    },

    handleMouseWheel: function (self, e) {
        var event, delta, value;

        if (self.enabled) {
            event = window.event || e, // equalize event object
            delta = event.detail? -event.detail : event.wheelDelta, // check for detail first so Opera uses that instead of wheelDelta
            value = self.getValue();

            value += 0.05*delta/Math.abs(delta);
            if (value < 0.0) value = 0.0;
            if (value > 1.0) value = 1.0;

            self.setValue(value);
            self.handleSlider(self.getBeta());
        }
    },

    setValue: function (value) {
        $("#betaSlider").slider("value", value);
    },

    getValue: function () {
        return $("#betaSlider").slider("value");
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
        this.drawScaleEntry(0, 0, 18, 20);
        this.drawScaleEntry(1, 0, 18, 20);
    }
};

