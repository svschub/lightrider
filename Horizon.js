Horizon = function () {
	this.geometry = new HorizonGeometry(); 
    this.geometry.setZ(100);
	
	this.mesh = new THREE.Mesh(
	    this.geometry,
	    new THREE.MeshBasicMaterial({
		    color: 0xFFFFFF,
//		    shading: THREE.FlatShading, 
		    vertexColors: THREE.VertexColors
	    })
    );
};

Horizon.prototype = {
    constructor: Horizon,
		
	update: function (angles) {
	    var xmin,ymin,xmax,ymax,diag,
		    centerx,centery,h,
		    near,far,
			pax,pay,pbx,pby,yRect,
			offset;
			
        near = this.observerNear;		
		far = this.geometry.vertices[0].z;

		ymax = near*Math.tan(this.observerFov*Math.PI/360);
		ymin = -ymax;
		xmax = ymax*this.observerAspect;
		xmin = -xmax;
		
		xmin = far*xmin/near;
	    xmax = far*xmax/near;
	    ymin = far*ymin/near;
	    ymax = far*ymax/near;
		
		diag = Math.sqrt(xmax*xmax + ymax*ymax);
		
	    if (angles.cosPitchAngle > Math.abs(angles.sinPitchAngle)*far/diag) {
            h = far*angles.sinPitchAngle/angles.cosPitchAngle;

		    centerx = h*angles.sinRollAngle;  // vanishing point
		    centery = -h*angles.cosRollAngle;

		    if (Math.abs(angles.cosRollAngle) >= Math.abs(angles.sinRollAngle)) {
			    pax = xmin;
				pay = centery - (centerx - xmin)*angles.sinRollAngle/angles.cosRollAngle;
				
				pbx = xmax;
				pby = centery + (xmax - centerx)*angles.sinRollAngle/angles.cosRollAngle;
				
				if (angles.cosRollAngle > 0) {
				    offset = 0;  // sky
                } else {
				    offset = 7;  // ground
                }				

				this.geometry.vertices[offset].x = pax;
				this.geometry.vertices[offset].y = pay;
                if (pay < pby) {
				    this.geometry.vertices[offset+1].x = pax;
				    this.geometry.vertices[offset+1].y = pby;
				    this.geometry.vertices[offset+2].x = pbx;
				    this.geometry.vertices[offset+2].y = pby;
                } else {
				    this.geometry.vertices[offset+1].x = pbx;
				    this.geometry.vertices[offset+1].y = pay;
				    this.geometry.vertices[offset+2].x = pbx;
				    this.geometry.vertices[offset+2].y = pby;
                }

				yRect = Math.max(pay,pby);
			    this.geometry.vertices[offset+3].x = pbx;
			    this.geometry.vertices[offset+3].y = Math.min(yRect,ymax);
			    this.geometry.vertices[offset+4].x = pax;
			    this.geometry.vertices[offset+4].y = Math.min(yRect,ymax);
			    this.geometry.vertices[offset+5].x = pax;
			    this.geometry.vertices[offset+5].y = ymax;
			    this.geometry.vertices[offset+6].x = pbx;
			    this.geometry.vertices[offset+6].y = ymax;
				
				if (angles.cosRollAngle > 0) {
				    offset = 7;  // ground
                } else {
				    offset = 0;  // sky
                }				
				this.geometry.vertices[offset].x = pbx;
				this.geometry.vertices[offset].y = pby;
                if (pay < pby) {
				    this.geometry.vertices[offset+1].x = pbx;
				    this.geometry.vertices[offset+1].y = pay;
				    this.geometry.vertices[offset+2].x = pax;
				    this.geometry.vertices[offset+2].y = pay;
                } else {
				    this.geometry.vertices[offset+1].x = pax;
				    this.geometry.vertices[offset+1].y = pby;
				    this.geometry.vertices[offset+2].x = pax;
				    this.geometry.vertices[offset+2].y = pay;
                }				
				
				yRect = Math.min(pay,pby);
			    this.geometry.vertices[offset+3].x = pax;
			    this.geometry.vertices[offset+3].y = Math.max(yRect,ymin);
			    this.geometry.vertices[offset+4].x = pbx;
			    this.geometry.vertices[offset+4].y = Math.max(yRect,ymin);
			    this.geometry.vertices[offset+5].x = pbx;
			    this.geometry.vertices[offset+5].y = ymin;
			    this.geometry.vertices[offset+6].x = pax;
			    this.geometry.vertices[offset+6].y = ymin;

			} else {

			    pax = centerx + (ymax - centery)*angles.cosRollAngle/angles.sinRollAngle;
			    pay = ymax;

			    pbx = centerx - (centery - ymin)*angles.cosRollAngle/angles.sinRollAngle;
			    pby = ymin;
							
				if (-angles.sinRollAngle > 0) {
				    offset = 0;  // sky
                } else {
				    offset = 7;  // ground
                }				

				this.geometry.vertices[offset].x = pax;
				this.geometry.vertices[offset].y = pay;
                if (pax < pbx) {
				    this.geometry.vertices[offset+1].x = pbx;
				    this.geometry.vertices[offset+1].y = pay;
				    this.geometry.vertices[offset+2].x = pbx;
				    this.geometry.vertices[offset+2].y = pby;
                } else {
				    this.geometry.vertices[offset+1].x = pax;
				    this.geometry.vertices[offset+1].y = pby;
				    this.geometry.vertices[offset+2].x = pbx;
				    this.geometry.vertices[offset+2].y = pby;
                }

				yRect = Math.max(pax,pbx);
			    this.geometry.vertices[offset+3].x = Math.min(yRect,xmax);
			    this.geometry.vertices[offset+3].y = pby;
			    this.geometry.vertices[offset+4].x = Math.min(yRect,xmax);
			    this.geometry.vertices[offset+4].y = pay;
			    this.geometry.vertices[offset+5].x = xmax;
			    this.geometry.vertices[offset+5].y = pay;
			    this.geometry.vertices[offset+6].x = xmax;
			    this.geometry.vertices[offset+6].y = pby;

				if (-angles.sinRollAngle > 0) {
				    offset = 7;  // ground
                } else {
				    offset = 0;  // sky
                }				
				this.geometry.vertices[offset].x = pbx;
				this.geometry.vertices[offset].y = pby;
                if (pax < pbx) {
				    this.geometry.vertices[offset+1].x = pax;
				    this.geometry.vertices[offset+1].y = pby;
				    this.geometry.vertices[offset+2].x = pax;
				    this.geometry.vertices[offset+2].y = pay;
                } else {
				    this.geometry.vertices[offset+1].x = pbx;
				    this.geometry.vertices[offset+1].y = pay;
				    this.geometry.vertices[offset+2].x = pax;
				    this.geometry.vertices[offset+2].y = pay;
                }				

				yRect = Math.min(pax,pbx);
			    this.geometry.vertices[offset+3].x = Math.max(yRect,xmin);
			    this.geometry.vertices[offset+3].y = pay;
			    this.geometry.vertices[offset+4].x = Math.max(yRect,xmin);
			    this.geometry.vertices[offset+4].y = pby;
			    this.geometry.vertices[offset+5].x = xmin;
			    this.geometry.vertices[offset+5].y = pby;
			    this.geometry.vertices[offset+6].x = xmin;
			    this.geometry.vertices[offset+6].y = pay;
			}
	    } else {
			if (angles.sinPitchAngle > 0) {
			    offset = 0;
			} else {
			    offset = 7;
			}

		    this.geometry.vertices[offset+3].x = xmin;
		    this.geometry.vertices[offset+3].y = ymin;
		    this.geometry.vertices[offset+4].x = xmin;
		    this.geometry.vertices[offset+4].y = ymax;
		    this.geometry.vertices[offset+5].x = xmax;
		    this.geometry.vertices[offset+5].y = ymax;
		    this.geometry.vertices[offset+6].x = xmax;
		    this.geometry.vertices[offset+6].y = ymin;
	    }

        this.geometry.computeCentroids();

	    this.geometry.verticesNeedUpdate = true;
        this.geometry.normalsNeedUpdate = true;
    }

};