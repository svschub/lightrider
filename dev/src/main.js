
var mainLoop, slider;

function printCopyright() {
    var author, canvas, canvasPosition;

    $("#hudIndicators").after('<div id="grr" class="overlay mediumFont yellow">by Sven Schubert, 2012</div>');

    author = $("#grr");
    canvas = $("canvas");
    canvasPosition = canvas.position();

    author.offset({
        top: canvasPosition.top + canvas.height() - author.height() - 10,
        left: canvasPosition.left + canvas.width() - author.width() - 10
    });
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
    $("#dopplerShiftRescale").focus(function () {
        mainLoop.plane.disableKeyHandler();
    });
    $("#dopplerShiftRescale").blur(function () {
        mainLoop.plane.enableKeyHandler();
    });
}

function animate() {
    requestAnimationFrame(animate);
    mainLoop.drawFrame();
}

function init() {
    mainLoop = new MainLoop();
    if (mainLoop.isRenderContextAvailable()) {
        initWidgets();
        printCopyright();

        mainLoop.start(30);
        animate();
    } else {
		document.body.innerHTML = window.WebGLRenderingContext ? [
		    'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br />',
		    'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
		].join( '\n' ) : [
		    'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>',
		    'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
		].join( '\n' );        
    }
}

$(document).ready(init);
