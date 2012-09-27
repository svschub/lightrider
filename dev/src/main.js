(function ($) {
    'use strict';

    var mainLoop;

    function animate() {
        requestAnimationFrame(animate);
        mainLoop.drawFrame();
    }

    function init() {
	    mainLoop = new MainLoop();
        
        var slider = new BetaSlider({
            halfScale: 0.9,
            handle: function (value) {
                mainLoop.setNextBeta( Math.min(value, 0.9999) );
            },
        });
        
        $("#setDopplerEffect").attr('checked', false);
        $("#setDopplerEffect").bind("click", function () {
            if ($(this).is(':checked')) {
                mainLoop.boost.enableDopplerEffect();
            } else {
                mainLoop.boost.disableDopplerEffect();
            };
        });

        $("#dopplerShiftRescale").bind("change", function () {
            mainLoop.setNextDopplerShiftRescale( parseFloat($(this).val()) );
        });
        
		mainLoop.start(30);
        animate();
    }
    
    init();
    
}(jQuery));
