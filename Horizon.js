Horizon = function (boost) {
    this.horizonNormal = new THREE.Vector3(0, 0, -1);
    this.groundNormal = new THREE.Vector3(0, 1, 0);

    this.skyColor = new THREE.Color(0x3355AA);
    this.groundColor = new THREE.Color(0x446600);
            
    this.boundingRadius = 1;
    this.granularity = 16;
    this.horizonArcZshift = 100;  // TODO

    this.boost = boost;
    
    this.initShaders();
    
    this.mesh = new THREE.Object3D();
    
    this.horizonBackground = this.createRectangle(this.horizonBackgroundMaterial);
    this.mesh.add(this.horizonBackground);

    this.horizonArc = this.createHorizonArc();
    this.horizonArc.position.z = -this.horizonArcZshift;
    this.mesh.add(this.horizonArc);

    this.verticalRect = this.createRectangle(this.horizonArcMaterial);
    this.verticalRect.position.z = -this.horizonArcZshift;
    this.mesh.add(this.verticalRect);

    this.horizontalRect = this.createRectangle(this.horizonArcMaterial);
    this.horizontalRect.position.z = -this.horizonArcZshift;
    this.mesh.add(this.horizontalRect);

    this.edgeRect = this.createRectangle(this.horizonArcMaterial);
    this.edgeRect.position.z = -this.horizonArcZshift;
    this.mesh.add(this.edgeRect);
};

Horizon.prototype = {
    constructor: Horizon,

    initShaders: function () {
        var horizonVertexShaderCode = readFile("shaders/covariantHorizon.vs"),
            horizonFragmentShaderCode = readFile("shaders/covariantLambert.fs");

        this.horizonArcMaterial = this.boost.setMaterial({
            vertexShader: [
                "#define HORIZON_ARC",
                horizonVertexShaderCode,
            ].join("\n"),
            fragmentShader: [
                "#define HORIZON",
                "#define USE_COLOR",
                horizonFragmentShaderCode,
            ].join("\n"),

            uniforms: { "horizonArcColor": { type: "c", value: this.skyColor, }, },
        });
        
        this.horizonBackgroundMaterial = this.boost.setMaterial({
            vertexShader: [
                "#define HORIZON_BACKGROUND",
                horizonVertexShaderCode,
            ].join("\n"),
            fragmentShader: [
                "#define HORIZON",
                "#define USE_COLOR",
                horizonFragmentShaderCode,
            ].join("\n"),

            uniforms: { "horizonBackgroundColor": { type: "c", value: this.groundColor, }, },
        });
    },
    
    setZ: function (z) {
        this.mesh.position.z = z;
    },

    getZ: function () {
        return this.mesh.position.z;
    },

    setFrustumParametersFromCamera: function (camera) {
        var near = camera.near,
            far = (this.getZ() + this.horizonBackground.position.z);

        this.ymax = near*Math.tan(camera.fov*Math.PI/360);
        this.ymin = -this.ymax;
        this.xmax = this.ymax*camera.aspect;
        this.xmin = -this.xmax;
        
        this.xmin = far*this.xmin/near;
        this.xmax = far*this.xmax/near;
        this.ymin = far*this.ymin/near;
        this.ymax = far*this.ymax/near;
        
        this.updateRectangleGeometry(
            this.horizonBackground, 
            this.xmin, this.ymin, this.xmax, this.ymax
        );
    },    

    calculateGroundNormal: function (angles) {
        var v = new THREE.Vector3(0, angles.cosPitchAngle, angles.sinPitchAngle);
    
        this.groundNormal.x = -v.y*angles.sinRollAngle;    
        this.groundNormal.y = v.y*angles.cosRollAngle;
        this.groundNormal.z = v.z;
    },
    
    calculateBoundingCircle: function () {
        this.boundingRadius = (this.getZ()-this.horizonArcZshift)*Math.tan(this.viewConeAngle);
    },
    
    calculatePitchCircle: function (angles) {
        var v, vRef, vObs;

        v = new THREE.Vector3(0, -this.viewSphereRadius*angles.sinPitchAngle, this.viewSphereRadius*angles.cosPitchAngle);
        vRef = new THREE.Vector3(-v.y*angles.sinRollAngle, v.y*angles.cosRollAngle, v.z);
        vObs = this.boost.getObserverVertex(vRef);

        vObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/vObs.z);
        
        this.pitchRadius = Math.sqrt(vObs.x*vObs.x + vObs.y*vObs.y);
        this.vanishingPoint = vObs;
    },
    
    calculateAngularNormals: function () {
        var alpha;
        
        this.angularNormal = [];
        
        for (var i=0; i < this.granularity; i++) {
            alpha = Math.PI*i/this.granularity;

            this.angularNormal[i] = new THREE.Vector3(
                -this.viewSphereRadius*Math.cos(alpha),
                 this.viewSphereRadius*Math.sin(alpha),
                 0
            );
        }
    },
    
    updateObserverViewCone: function (viewconeparameters) {
        this.viewConeAngle = viewconeparameters.viewConeAngle;
        this.viewSphereRadius = viewconeparameters.viewSphereRadius;

        this.calculateBoundingCircle();
        this.calculateAngularNormals();
    },

    createRectangle: function (rectangleMaterial) {
        var rectangle, rectangleGeometry, rectangleFace;

        rectangleGeometry = new THREE.Geometry();
        rectangleGeometry.dynamic = true;
        
        rectangleGeometry.vertices = [
            new THREE.Vector3(-1, -1, 0),
            new THREE.Vector3(-1, +1, 0),
            new THREE.Vector3(+1, +1, 0),
            new THREE.Vector3(+1, -1, 0), 
        ];
    
        rectangleFace = new THREE.Face4(0,1,2,3);

        rectangleFace.normal.copy(this.horizonNormal);
        rectangleFace.vertexNormals = [
            this.horizonNormal.clone(), 
            this.horizonNormal.clone(), 
            this.horizonNormal.clone(),
            this.horizonNormal.clone(),
        ];

        rectangleGeometry.faces.push(rectangleFace);
        rectangleGeometry.faceVertexUvs[0] = [];
        rectangleGeometry.computeCentroids();
                
        rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
        
        rectangle.doubleSided = true;
        rectangle.visible = true;
    
        return rectangle;
    },

    updateRectangleGeometry: function (rectangle, xmin, ymin, xmax, ymax) {
        rectangle.geometry.vertices[0].set(xmin, ymin, 0);
        rectangle.geometry.vertices[1].set(xmax, ymin, 0);
        rectangle.geometry.vertices[2].set(xmax, ymax, 0);
        rectangle.geometry.vertices[3].set(xmin, ymax, 0); 

        rectangle.geometry.verticesNeedUpdate = true;

        if ( (xmin != xmax) && (ymin != ymax) ) {
            rectangle.visible = true;
        }        
    },
    
    createHorizonArc: function () {
        var i, j, horizonArc;
        
        this.horizonArcGeometry = new THREE.Geometry();
        this.horizonArcGeometry.dynamic = true;
        
        for (i = 0; i < 2*this.granularity+1; i++) {
            this.horizonArcGeometry.vertices.push(new THREE.Vector3());
        }
        
        for (i = 0; i < 2*this.granularity; i++) {
            j = i + 1;
            if (j == 2*this.granularity) {
                j = 0;
            }
            
            var arcSlice = new THREE.Face3(2*this.granularity, i, j);
            arcSlice.normal.copy(this.horizonNormal);
            arcSlice.vertexNormals = [
                this.horizonNormal.clone(), 
                this.horizonNormal.clone(), 
                this.horizonNormal.clone(),
            ];
            this.horizonArcGeometry.faces.push(arcSlice);
        }
        this.horizonArcGeometry.faceVertexUvs[0] = [];        
        this.horizonArcGeometry.computeCentroids();
        
        horizonArc = new THREE.Mesh(this.horizonArcGeometry, this.horizonArcMaterial);
        
        horizonArc.doubleSided = true;
        
        return horizonArc;
    },
        
    updateHorizonArcColor: function (color) {
        this.horizonArcColor = color;
        this.horizonArcMaterial.uniforms.horizonArcColor.value = color;

        if (this.horizonArcColor === this.skyColor) {
            this.horizonBackgroundMaterial.uniforms.horizonBackgroundColor.value = this.groundColor;
        } else {
            this.horizonBackgroundMaterial.uniforms.horizonBackgroundColor.value = this.skyColor;
        }
    },
        
    isCurvatureNeglegible: function (v0, vn, center) {
        var curvature, v0n, vr, vc, length;
        
        v0n = new THREE.Vector3();
        v0n.sub(vn, v0);
        length = v0n.length();

        vr = new THREE.Vector3(v0n.y, -v0n.x, v0n.z);
        vr.divideScalar(length);
        
        vc = new THREE.Vector3();
        vc.sub(center, v0);
        
        curvature = vc.dot(vr)/length;
        
        return (Math.abs(curvature) < 0.001);
    },

    isTriangle: function (v0, vn, vR) {
        if (vR.x == v0.x) {
            if (Math.abs(vR.y - v0.y) < 0.01) {
                return false;
            }
        }

        if (vR.x == vn.x) {
            if (Math.abs(vR.y - vn.y) < 0.01) {
                return false;
            }
        }
        
        return true;
    },
    
    trianglePointsToCenter: function (v0, vn, vR) {
        var va, vb, det;
        
        va = new THREE.Vector3();
        va.sub(vn,v0);
        
        vb = new THREE.Vector3();
        vb.sub(vR,v0);
        
        det = va.x*vb.y - va.y*vb.x;
                
        return (det*(-va.x*v0.y + va.y*v0.x) > 0);
    },
    
    findRectificationVertex: function (v0, vn, center) {
        var va, vb, det, vRect;
        
        va = new THREE.Vector3();
        va.sub(vn, v0);

        vb = new THREE.Vector3();
        vb.sub(center, v0);

        det = va.x*vb.y - va.y*vb.x;
        
        vRect = new THREE.Vector3(vn.x, v0.y, v0.z);
        vb.sub(vRect, v0);

        if (det*(va.x*vb.y - va.y*vb.x) >= 0) {
            vRect.x = v0.x;
            vRect.y = vn.y;
        }
        
        return vRect;
    },
    
    findGroundRectificationVertex: function (v0, vn, angles) {
        var va, vRect;
        
        vRect = new THREE.Vector3(vn.x, v0.y, v0.z);
        va = new THREE.Vector3();
        va.sub(vRect, v0);
        
        if ((this.groundNormal.x*va.x + this.groundNormal.y*va.y) > 0) {
            vRect.x = v0.x;
            vRect.y = vn.y;
        }
        
        return vRect;
    },
    
    simpleHorizonArcCompletion: function (angles, v0, vn, vR) {
        var x1, y1, x2, y2;
        
        if (Math.abs(angles.cosRollAngle) > 0.5) {
            x1 = this.xmin;
            x2 = this.xmax;
            y1 = v0.y;
            if (angles.cosRollAngle > 0) {
                if (this.horizonArcColor === this.skyColor) {
                    y2 = this.ymax;
                } else {
                    y2 = this.ymin;
                }
            } else {
                if (this.horizonArcColor === this.skyColor) {
                    y2 = this.ymin;
                } else {
                    y2 = this.ymax;
                }
            }
        } else {
            y1 = this.ymin;
            y2 = this.ymax;
            x1 = v0.x;
            if (angles.sinRollAngle > 0) {
                if (this.horizonArcColor === this.skyColor) {
                    x2 = this.xmax;
                } else {
                    x2 = this.xmin;
                }
            } else {
                if (this.horizonArcColor === this.skyColor) {
                    x2 = this.xmin;
                } else {
                    x2 = this.xmax;
                }
            }
        }
        
        this.updateRectangleGeometry(this.horizontalRect, x1, y1, x2, y2);
    },
    
    triangularHorizonArcCompletion: function (angles, v0, vn, vR) {
        var xE, yE, x, y, trianglePointsToCenter;
        
        xE = vR.x;
        yE = vR.y;
                                
        trianglePointsToCenter = this.trianglePointsToCenter(v0,vn,vR);
        
        if (v0.y == vR.y) {

            if (trianglePointsToCenter) {
                if (v0.x < vR.x) {
                    x = this.xmin;
                } else {
                    x = this.xmax;
                }
            } else {
                 x = v0.x;
            }
            
            if (v0.y < vn.y) {
                if (v0.y > this.ymin) {
                    this.updateRectangleGeometry(this.horizontalRect, x, this.ymin, vR.x, vR.y);
                    yE = this.ymin;                    
                }
            } else {
                if (v0.y < this.ymax) {
                    this.updateRectangleGeometry(this.horizontalRect, x, this.ymax, vR.x, vR.y);                
                    yE = this.ymax;
                }
            }
        }

        if (v0.x == vR.x) {

            if (trianglePointsToCenter) {
                if (v0.y < vR.y) {
                    y = this.ymin;
                } else {
                    y = this.ymax;
                }
            } else {
                 y = v0.y;
            }

            if (v0.x < vn.x) {
                if (v0.x > this.xmin) {
                    this.updateRectangleGeometry(this.horizontalRect, this.xmin, y, vR.x, vR.y);                
                    xE = this.xmin;
                }
            } else {
                if (v0.x < this.xmax) {
                    this.updateRectangleGeometry(this.horizontalRect, this.xmax, y, vR.x, vR.y);                
                    xE = this.xmax;
                }
            }
        }

        if (vn.y == vR.y) {

            if (trianglePointsToCenter) {
                if (vn.x < vR.x) {
                    x = this.xmin;
                } else {
                    x = this.xmax;
                }
            } else {
                 x = vn.x;
            }
            
            if (vn.y < v0.y) {
                if (vn.y > this.ymin) {
                    this.updateRectangleGeometry(this.verticalRect, x, this.ymin, vR.x, vR.y);
                    yE = this.ymin;                    
                }
            } else {
                if (vn.y < this.ymax) {
                    this.updateRectangleGeometry(this.verticalRect, x, this.ymax, vR.x, vR.y);                
                    yE = this.ymax;
                }
            }
        }

        if (vn.x == vR.x) {

            if (trianglePointsToCenter) {
                if (vn.y < vR.y) {
                    y = this.ymin;
                } else {
                    y = this.ymax;
                }
            } else {
                 y = vn.y;
            }
            
            if (vn.x < v0.x) {
                if (vn.x > this.xmin) {
                    this.updateRectangleGeometry(this.verticalRect, this.xmin, y, vR.x, vR.y);                
                    xE = this.xmin;
                }
            } else {
                if (vn.x < this.xmax) {
                    this.updateRectangleGeometry(this.verticalRect, this.xmax, y, vR.x, vR.y);                
                    xE = this.xmax;
                }
            }
        }
        
        this.updateRectangleGeometry(this.edgeRect, vR.x, vR.y, xE, yE);
    },

    horizonArcCompletion: function (angles, v0, vn, vR) {        
        this.horizontalRect.visible = false;
        this.verticalRect.visible = false;
        this.edgeRect.visible = false;
        
        if (this.isTriangle(v0, vn, vR)) {
            this.triangularHorizonArcCompletion(angles, v0, vn, vR);
        } else {
            this.simpleHorizonArcCompletion(angles, v0, vn, vR);
        }
    },
    
    updateOpenHorizonArc: function (angles) {
        var dy, vObs, vRef, vRect, 
            h, dx,
            pRef, pObs,
            center, n;
        
        n = this.granularity-1;
        
        this.horizonArcGeometry.vertices[n].x = this.vanishingPoint.x;
        this.horizonArcGeometry.vertices[n].y = this.vanishingPoint.y;
        
        dy = (this.boundingRadius-this.pitchRadius)/n,
        vObs = new THREE.Vector3(0,this.pitchRadius,this.getZ()-this.horizonArcZshift);
        
        pRef = new THREE.Vector3();

        center = new THREE.Vector3();
        center.addSelf(this.horizonArcGeometry.vertices[n]);
        
        for (var i=1; i <= n; i++) {
            vObs.y += dy;
            vRef = this.boost.getReferenceVertex(vObs);
            vRef.multiplyScalar(this.viewSphereRadius/vRef.length());
            
            h = -vRef.z*angles.sinPitchAngle/angles.cosPitchAngle;
            dx = Math.sqrt(vRef.y*vRef.y - h*h);
            
            pRef.x = -dx*angles.cosRollAngle - h*angles.sinRollAngle;
            pRef.y = -dx*angles.sinRollAngle + h*angles.cosRollAngle;
            pRef.z = vRef.z;
            
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);            

            
              this.horizonArcGeometry.vertices[n-i].x = pObs.x;
            this.horizonArcGeometry.vertices[n-i].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[n-i]);

            pRef.x = dx*angles.cosRollAngle - h*angles.sinRollAngle;
            pRef.y = dx*angles.sinRollAngle + h*angles.cosRollAngle;
            pRef.z = vRef.z;
            
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);
            
              this.horizonArcGeometry.vertices[n+i].x = pObs.x;
            this.horizonArcGeometry.vertices[n+i].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[n+i]);
        }        

        center.divideScalar(2*n+1);
        this.horizonArcGeometry.vertices[2*n+2].copy(center);

        if (this.isCurvatureNeglegible(this.horizonArcGeometry.vertices[0], this.horizonArcGeometry.vertices[2*n], center)) {
            vRect = this.findGroundRectificationVertex(
                this.horizonArcGeometry.vertices[0],
                this.horizonArcGeometry.vertices[2*n],
                angles
            );
            this.horizonArcGeometry.vertices[2*n+1].copy(vRect);
            this.updateHorizonArcColor(this.groundColor);
        } else {
            vRect = this.findRectificationVertex(
                this.horizonArcGeometry.vertices[0], 
                this.horizonArcGeometry.vertices[2*n], 
                center
            );    
            this.horizonArcGeometry.vertices[2*n+1].copy(vRect);
            if (angles.sinPitchAngle > 0) {
                this.updateHorizonArcColor(this.skyColor);
            } else {
                this.updateHorizonArcColor(this.groundColor);
            }
        }

        this.horizonArcCompletion(angles, this.horizonArcGeometry.vertices[0], this.horizonArcGeometry.vertices[2*n], vRect);
        
           this.horizonArcGeometry.verticesNeedUpdate = true;
        this.horizonArc.visible = true;
    },

    updateClosedHorizonArc: function (angles) {
        var pCut, pRef, pObs, center;
                
        pRef = new THREE.Vector3();
        vObs = new THREE.Vector3();
        pCut = new THREE.Vector3();
        
         center = new THREE.Vector3();

        for (var i=0; i < this.granularity; i++) {
            pCut.cross(this.angularNormal[i],this.groundNormal);
            pCut.multiplyScalar(this.viewSphereRadius/pCut.length());
            
            pRef.copy(pCut);
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);

              this.horizonArcGeometry.vertices[i].x = pObs.x;
            this.horizonArcGeometry.vertices[i].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[i]);

            pRef.copy(pCut);
            pRef.multiplyScalar(-1);
            pObs = this.boost.getObserverVertex(pRef);
            pObs.multiplyScalar((this.getZ()-this.horizonArcZshift)/pObs.z);

              this.horizonArcGeometry.vertices[i+this.granularity].x = pObs.x;
            this.horizonArcGeometry.vertices[i+this.granularity].y = pObs.y;
            center.addSelf(this.horizonArcGeometry.vertices[i+this.granularity]);
        }

        center.divideScalar(2*this.granularity);
        this.horizonArcGeometry.vertices[2*this.granularity].copy(center);        
        
        if (angles.sinPitchAngle > 0) {
            this.updateHorizonArcColor(this.skyColor);
        } else {
            this.updateHorizonArcColor(this.groundColor);
        }

           this.horizonArcGeometry.verticesNeedUpdate = true;
        this.horizonArc.visible = true;
    },

    update: function (angles) {
        var cosReferenceViewConeAngle = Math.cos(this.boost.referenceViewConeAngle);
        
        this.calculateGroundNormal(angles);

        this.horizonArc.visible = false;
        this.updateRectangleGeometry(this.horizontalRect, 0, 0, 0, 0);                
        this.updateRectangleGeometry(this.verticalRect, 0, 0, 0, 0);                
        this.updateRectangleGeometry(this.edgeRect, 0, 0, 0, 0);                
        
        if (angles.cosPitchAngle > Math.abs(cosReferenceViewConeAngle)) {
            // horizon ground plane cuts the view cone in the reference frame:
            this.calculatePitchCircle(angles);
            this.updateOpenHorizonArc(angles);
        } else {
            if (cosReferenceViewConeAngle < 0) {
                // horizon ground plane completely within the view cone of the reference frame draw 360 deg horizon ...
                this.updateClosedHorizonArc(angles);
            } else {
                // view cone angle in reference frame < 180 deg:
                if (angles.sinPitchAngle >= 0) {
                    this.updateHorizonArcColor(this.groundColor); 
                } else {
                    this.updateHorizonArcColor(this.skyColor); 
                }
            }
        }
    },
};