function BetaSlider (properties) {
    var self = this,

        renderCanvas = $("#renderContainer > canvas"),
        instrumentContainer = $("#instrumentContainer"),
        betaScale = $("#betaScale"),
        betaScaleTitle = $("#betaScaleTitle"),
        betaSlider = $("#betaSlider"),
        
        enabled = true,

        scale,
        scaleWidth,
        scaleHeight,
        scaleOffset,
        sliderHeight,

        handleSlider = properties.handle,
        fontScaleRatio = properties.fontScaleRatio || 1,
        a = properties.halfScale*properties.halfScale/(1-2*properties.halfScale),
        b = Math.log((1+a)/a),

        setValue = function (value) {
            betaSlider.slider("value", value);
        },

        getValue = function () {
            return betaSlider.slider("value");
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

        drawScaleEntry = function (beta, precision, lineWidth, fontsize) {
            var y = scaleOffset + sliderHeight*(1.0-getScaleY(beta)),
                betaText = beta.toFixed(precision),
                betaTextWidth;

            scale.beginPath();
            scale.moveTo(scaleWidth, y);
            scale.lineTo(scaleWidth-lineWidth, y);
            scale.stroke();

            betaTextWidth = scale.measureText(betaText).width;
            scale.fillText(betaText, scaleWidth - lineWidth - 13 - betaTextWidth, y + fontsize/2 - 2);
        },

        drawScale = function () {
            var scaleEntryFontSize;

            scale = betaScale[0].getContext('2d');
            scale.lineWidth = 3;
            scale.strokeStyle = "#FFFF00";
            scale.fillStyle = "#FFFF00";

            scale.clearRect(0, 0, betaScale[0].width, betaScale[0].height);

            scaleEntryFontSize = fontScaleRatio * 16;
            scale.font = "normal " + scaleEntryFontSize.toFixed(0) + "px Calibri";
            drawScaleEntry(0.5, 1, 13, 16);
            drawScaleEntry(0.8, 1, 13, 16);
            drawScaleEntry(0.9, 1, 13, 16);
            drawScaleEntry(0.95, 2, 13, 16);
            drawScaleEntry(0.99, 2, 13, 16);

            scaleEntryFontSize = fontScaleRatio * 20;
            scale.font = "normal " + scaleEntryFontSize.toFixed(0) + "px Calibri";
            drawScaleEntry(0, 0, 18, 20);
            drawScaleEntry(1, 0, 18, 20);
        },
 
        init = function () {
            betaSlider.slider({
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

            self.update();
        };
    

    self.enable = function () {
        enabled = true;  
    };
    
    self.disable = function () {
        enabled = false;
    };

    self.setFontScaleRatio = function (ratio) {
        fontScaleRatio = ratio;
    };

    self.update = function () {
        var renderCanvasWidth = renderCanvas[0].width,
            renderCanvasHeight = renderCanvas[0].height,
            betaSliderMarginTop = parseFloat(betaSlider.css("margin-top")),
            betaSliderMarginBottom = parseFloat(betaSlider.css("margin-bottom")),
            width = Math.max(50, fontScaleRatio * 100), 
            height = 0.7*renderCanvasHeight,
            betaScaleTitleSize = fontScaleRatio * 26;

        betaScaleTitle.css("font-size", betaScaleTitleSize.toFixed(0) + "px");

        sliderHeight = height;
        betaSlider.css("height", sliderHeight.toFixed(0));

        scaleWidth = width;
        scaleHeight = height + betaSliderMarginTop + betaSliderMarginBottom;
        scaleOffset = betaSliderMarginBottom + 1;

        betaScale.css("width", scaleWidth.toFixed(0) + "px");
        betaScale.attr("width", scaleWidth.toFixed(0));
        betaScale.attr("height", scaleHeight.toFixed(0));

        // redraw the beta slider scale:
        drawScale();

        // update left and top to get the correct width and height:
        instrumentContainer.css("left", instrumentContainer.css("left"));
        instrumentContainer.css("top", instrumentContainer.css("top"));

        // move the beta slider container to the correct top and left position:
        instrumentContainer.css("left", renderCanvasWidth - instrumentContainer.width() - 20);
        instrumentContainer.css("top", 0.5 * (renderCanvasHeight - instrumentContainer.height()));
    };

    init();
}
