function BetaSlider (properties) {
    var self = this,

        enabled = true,
        scale,
        scaleHeight,
        scaleOffset,
        sliderHeight,
        handleSlider = properties.handle,
        a = properties.halfScale*properties.halfScale/(1-2*properties.halfScale),
        b = Math.log((1+a)/a),

        setValue = function (value) {
            $("#betaSlider").slider("value", value);
        },

        getValue = function () {
            return $("#betaSlider").slider("value");
        },

        getBeta = function () {
            return Math.max(0.0, a*Math.exp(b*getValue()) - a);
        },

        getScaleY = function (beta) {
            return Math.log(beta/a + 1)/b;
        },

        handleMouseWheel = function (e) {
            var event, delta, value;

            if (enabled) {
                event = window.event || e, // equalize event object
                delta = event.detail? -event.detail : event.wheelDelta, // check for detail first so Opera uses that instead of wheelDelta
                value = getValue();

                value += 0.05*delta/Math.abs(delta);
                if (value < 0.0) value = 0.0;
                if (value > 1.0) value = 1.0;

                setValue(value);
                handleSlider(getBeta());
            }
        },

        bindMouseWheelEvents = function () {
            if (document.body.addEventListener) {
                // Chrome, Safari, Opera, IE9
                document.body.addEventListener("mousewheel", function (e) {
                    handleMouseWheel(e);
                }, false);

                // Firefox
                document.body.addEventListener("DOMMouseScroll", function (e) {
                    handleMouseWheel(e);
                }, false);
            }
        },

        addScale = function (width, height) {
            sliderHeight = height;
            $("#betaSlider").css("height", sliderHeight.toFixed(0));

            scaleHeight = height + 20;
            scaleOffset = 10;

            $(['<canvas id="betaScale" class="horizontal"',
               ' width="', width.toFixed(0), '"',
               ' height="', scaleHeight.toFixed(0), '">',
               'Browser does not support canvas!',
               '</canvas>'].join("")).insertAfter("#betaSlider");

            $("#betaScale").width(width);
            $("#betaScale").height(height + 20);
            $("#betaScale").attr("height", scaleHeight.toFixed(0));

            $("#instrumentContainer > div").css("top", 0.9 * ($(window).height() - $("#instrumentContainer > div").height()));

            scale = $("#betaScale")[0].getContext('2d');
            scale.lineWidth = 3;
            scale.strokeStyle = "#000000";
        },

        drawScaleEntry = function (beta, precision, lineWidth, fontsize) {
            var y = scaleOffset + sliderHeight*(1.0-getScaleY(beta));

            scale.beginPath();
            scale.moveTo(0, y);
            scale.lineTo(lineWidth, y);
            scale.stroke();

            scale.fillText(beta.toFixed(precision), lineWidth + 13, y + fontsize/2 - 2);
        },

        drawScale = function () {
            scale.font = "normal 16pt Calibri";
            drawScaleEntry(0.5, 1, 13, 16);
            drawScaleEntry(0.8, 1, 13, 16);
            drawScaleEntry(0.9, 1, 13, 16);
            drawScaleEntry(0.95, 2, 13, 16);
            drawScaleEntry(0.99, 2, 13, 16);

            scale.font = "normal 20pt Calibri";
            drawScaleEntry(0, 0, 18, 20);
            drawScaleEntry(1, 0, 18, 20);
        },
 
        init = function () {
            $("#instrumentContainer").css("height", $(window).height().toFixed(0));

            $("#betaSlider").slider({
                orientation: "vertical",
                min: 0.0,
                max: 1.0,
                step: 0.01,
                slide: function(e, ui) {
                    handleSlider(a*Math.exp(b*ui.value)-a);
                }
            });
            $("#betaSlider .ui-slider-handle").unbind("keydown");
            bindMouseWheelEvents();

            addScale(100, Math.min(0.8*$(window).height(), 500));

            drawScale();
        };
    
    self.enable = function () {
        enabled = true;  
    };
    
    self.disable = function () {
        enabled = false;
    };
    
    init();
}
