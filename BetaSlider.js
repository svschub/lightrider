BetaSlider = function (properties) {
	var a=properties.halfScale*properties.halfScale/(1-2*properties.halfScale),
	    b=Math.log((1+a)/a);
			
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
	
    this.scaleHeight = 200;
	
	this.scale = $("#betaScale")[0].getContext('2d');
	this.scale.lineWidth = 3;
	this.scale.strokeStyle = "#000000";
	this.scale.font = "normal 16pt Calibri";
	
	this.a = a;
	this.b = b;
	
	this.drawScale();
};

BetaSlider.prototype = {
    constructor: BetaSlider,
	
	getScaleY: function (beta) {
        return Math.log(beta/this.a + 1)/this.b;
	},
	
	drawScaleEntry: function (beta, precision, lineWidth) {
	    var y = this.scaleHeight*(1.0-this.getScaleY(beta));
		
		this.scale.beginPath();
        this.scale.moveTo(0, y);
        this.scale.lineTo(lineWidth, y);
        this.scale.stroke();
		
        this.scale.fillText(beta.toFixed(precision), 26, y + 6);
	},
	
	drawScaleBorders: function (lineWidth) {
        var scalePosition = $("#betaScale").position();
		
		$("#betaScaleTitle").css({
		    left: scalePosition.left - 10, 
			top: scalePosition.top - 65,
		});

		this.scale.beginPath();
        this.scale.moveTo(0, 4);
        this.scale.lineTo(lineWidth, 4);
        this.scale.stroke();	
		$("#betaScale1").css({
		    left: scalePosition.left + 30, 
			top: scalePosition.top - 11,
		});
		
		this.scale.beginPath();
        this.scale.moveTo(0, this.scaleHeight-2);
        this.scale.lineTo(lineWidth, this.scaleHeight-2);
        this.scale.stroke();			
		$("#betaScale0").css({
		    left: scalePosition.left + 30, 
			top: scalePosition.top + this.scaleHeight - 16,
		});
	},
	
	drawScale: function () {
	    var x=13;
		this.drawScaleEntry(0.5, 1, x);
		this.drawScaleEntry(0.8, 1, x);
		this.drawScaleEntry(0.9, 1, x);
		this.drawScaleEntry(0.95, 2, x);
		this.drawScaleEntry(0.99, 2, x);

	    this.drawScaleBorders(24);
	},
};

