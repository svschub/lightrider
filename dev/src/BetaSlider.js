function BetaSlider (properties) {
    var self = this,

        enabled = true,
        scale,
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

        updateScaleSize = function () {
            var renderCanvas = $("#renderContainer > canvas"),
                renderCanvasWidth = renderCanvas[0].width,
                renderCanvasHeight = renderCanvas[0].height,
                instrumentContainer = $("#instrumentContainer > div"),
                betaScale = $("#betaScale"),
                betaSlider = $("#betaSlider"),
                betaSliderMarginTop = parseFloat(betaSlider.css("margin-top")),
                betaSliderMarginBottom = parseFloat(betaSlider.css("margin-bottom")),
                width = 100, 
                height = 0.7*renderCanvasHeight,
                scaleHeight;

            sliderHeight = height;
            betaSlider.css("height", sliderHeight.toFixed(0));

            scaleHeight = height + betaSliderMarginTop + betaSliderMarginBottom;
            scaleOffset = betaSliderMarginBottom + 1;

            betaScale.attr("width", width);
            betaScale.attr("height", scaleHeight.toFixed(0));

            instrumentContainer.css("top", 0.5 * (renderCanvasHeight - instrumentContainer.height()));
            instrumentContainer.css("left", renderCanvasWidth - instrumentContainer.width() - 20);
        },

        drawScaleEntry = function (beta, precision, lineWidth, fontsize) {
            var y = scaleOffset + sliderHeight*(1.0-getScaleY(beta)),
                betaText = beta.toFixed(precision),
                betaTextWidth;

            scale.beginPath();
            scale.moveTo(100, y);
            scale.lineTo(100-lineWidth, y);
            scale.stroke();

            betaTextWidth = scale.measureText(betaText).width;
            scale.fillText(betaText, 100 - lineWidth - 13 - betaTextWidth, y + fontsize/2 - 2);
        },

        drawScale = function () {
            var betaScale = $("#betaScale");

            scale = betaScale[0].getContext('2d');
            scale.lineWidth = 3;
            scale.strokeStyle = "#FFFF00";
            scale.fillStyle = "#FFFF00";

           // scale.clearRect(0,0,betaScale[0].width, betaScale[0].height);

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

            updateScaleSize();
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
