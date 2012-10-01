(function ($) {
    'use strict';

    var mainLoop, slider;

    function animate() {
        requestAnimationFrame(animate);
        mainLoop.drawFrame();
    }

    function handleMouseWheel (e) {
        var event = window.event || e, // equalize event object
            delta = event.detail? -event.detail : event.wheelDelta, // check for detail first so Opera uses that instead of wheelDelta
            value = slider.getValue();

        value += 0.05*delta/Math.abs(delta);
        if (value < 0.0) value = 0.0;
        if (value > 1.0) value = 1.0;

        slider.setValue(value);
        mainLoop.setBeta(slider.getBeta());
    }

    function printCopyright() {
        var author, canvas, canvasPosition;

        $("#hudIndicators").after('<div id="author" class="overlay mediumFont yellow">by Sven Schubert, 2012</div>');

        author = $("#author");
        canvas = $("canvas");
        canvasPosition = canvas.position();
            
        author.offset({
            top: canvasPosition.top + canvas.height() - author.height() - 10,
            left: canvasPosition.left + canvas.width() - author.width() - 10,
        });
    }
    
    function isWebGLSupported() {
        return window.WebGLRenderingContext;
    }

    function initWidgets() {
        slider = new BetaSlider({
            halfScale: 0.9,
            handle: function (value) {
                mainLoop.setBeta(value);
            }
        });

        $("#dopplerForm").bind('submit', function () {
            return false;
        });

        $("#setDopplerEffect").attr('checked', false);
        $("#setDopplerEffect").bind('click', function () {
            if ($(this).is(':checked')) {
                mainLoop.boost.enableDopplerEffect();
            } else {
                mainLoop.boost.disableDopplerEffect();
            }
        });

        $("#dopplerShiftRescale").bind('change', function () {
            mainLoop.setDopplerShiftRescale(parseFloat($(this).val()));
        });

        if (document.body.addEventListener) {  
            // IE9, Chrome, Safari, Opera
            document.body.addEventListener("mousewheel", handleMouseWheel, false);  
            // Firefox
            document.body.addEventListener("DOMMouseScroll", handleMouseWheel, false);  
        }
    }
    
    function init() {
        if (isWebGLSupported()) {
            mainLoop = new MainLoop();

            initWidgets();
            printCopyright();
            
            mainLoop.start(30);
        
            animate();
        } else {
            document.body.innerHTML = "Sorry, your browser does not support WebGL or your graphics driver is outdated.";
            return;
        }
    }

    $(document).ready(init);
    
}(jQuery));
