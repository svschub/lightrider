function Horizon(boost) {
    var self = this,
    
        mesh,

        position,
        upVector,
        lookAtVector,
        angles,

        skyColor = new THREE.Color(0x3355AA),
        groundColor = new THREE.Color(0x446600),

        horizonNormal = new THREE.Vector3(0, 0, -1),
        groundNormal = new THREE.Vector3(0, 1, 0),

        boundingRadius = 1,
        granularity = 16,

        horizonBackground, // ?
        horizonBackgroundMaterial, // ?

        horizon,
        horizonArc, // ?
        horizonArcGeometry, // ?
        horizonArcColor, // ?
        horizonArcMaterial, // ?
        horizonArcZshift = 100,  // TODO

        verticalRect, // ?
        horizontalRect, // ?
        edgeRect, // ?
        
        viewConeAngle, // ?
        viewSphereRadius, // ?
        pitchRadius, // ?
        vanishingPoint, // ?
        angularNormal, // ?

        xmin, ymin, xmax, ymax,

        createRectangle = function (rectangleMaterial) {
            var rectangle, 
                rectangleGeometry, 
                rectangleFace1, 
                rectangleFace2;

            rectangleGeometry = new THREE.Geometry();
            rectangleGeometry.dynamic = true;

            rectangleGeometry.vertices = [
                new THREE.Vector3(-1, -1, 0),
                new THREE.Vector3(-1, +1, 0),
                new THREE.Vector3(+1, +1, 0),
                new THREE.Vector3(+1, -1, 0)
            ];

            rectangleFace1 = new THREE.Face3(0, 1, 2);
            rectangleFace1.normal.copy(horizonNormal);
            rectangleFace1.vertexNormals = [
                horizonNormal.clone(),
                horizonNormal.clone(),
                horizonNormal.clone(),
                horizonNormal.clone()
            ];
            rectangleFace1.materialIndex = 0;
            rectangleGeometry.faces.push(rectangleFace1);

            rectangleFace2 = new THREE.Face3(0, 2, 3);
            rectangleFace2.normal.copy(horizonNormal);
            rectangleFace2.vertexNormals = [
                horizonNormal.clone(),
                horizonNormal.clone(),
                horizonNormal.clone(),
                horizonNormal.clone()
            ];
            rectangleFace2.materialIndex = 0;
            rectangleGeometry.faces.push(rectangleFace2);

            rectangleGeometry.faceVertexUvs[0] = [];
            rectangleGeometry.computeCentroids();

            rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);

            rectangle.material.side = THREE.DoubleSide;
            rectangle.visible = true;

            return rectangle;
        },

        updateRectangleGeometry = function (rectangle, xmin, ymin, xmax, ymax) {
            rectangle.geometry.vertices[0].set(xmin, ymin, 0);
            rectangle.geometry.vertices[1].set(xmax, ymin, 0);
            rectangle.geometry.vertices[2].set(xmax, ymax, 0);
            rectangle.geometry.vertices[3].set(xmin, ymax, 0);

            rectangle.geometry.verticesNeedUpdate = true;

            if ((xmin !== xmax) && (ymin !== ymax)) {
                rectangle.visible = true;
            }
        },

        initShaders = function () {
            var horizonVertexShaderCode = loadAscii("horizonVertexShader"),
                horizonFragmentShaderCode = loadAscii("lambertFragmentShader");

            horizonArcMaterial = boost.setMaterial({
                vertexShader: [
                    "#define HORIZON_ARC",
                    horizonVertexShaderCode
                ].join("\n"),
                fragmentShader: [
                    "#define HORIZON",
                    "#define USE_COLOR",
                    horizonFragmentShaderCode
                ].join("\n"),

                uniforms: { "horizonArcColor": { type: "c", value: skyColor}}
            });

            horizonBackgroundMaterial = boost.setMaterial({
                vertexShader: [
                    "#define HORIZON_BACKGROUND",
                    horizonVertexShaderCode
                ].join("\n"),
                fragmentShader: [
                    "#define HORIZON",
                    "#define USE_COLOR",
                    horizonFragmentShaderCode
                ].join("\n"),

                uniforms: { "horizonBackgroundColor": { type: "c", value: groundColor}}
            });
        },

        init = function () {
            initShaders();

            mesh = new THREE.Object3D();

            horizon = new THREE.Object3D();

            horizonBackground = createRectangle(horizonBackgroundMaterial);
            horizon.add(horizonBackground);

            horizonArc = createHorizonArc();
            horizonArc.position.z = -horizonArcZshift;
            horizon.add(horizonArc);

            verticalRect = createRectangle(horizonArcMaterial);
            verticalRect.position.z = -horizonArcZshift;
            horizon.add(verticalRect);

            horizontalRect = createRectangle(horizonArcMaterial);
            horizontalRect.position.z = -horizonArcZshift;
            horizon.add(horizontalRect);

            edgeRect = createRectangle(horizonArcMaterial);
            edgeRect.position.z = -horizonArcZshift;
            horizon.add(edgeRect);
            
            mesh.add(horizon);
        },

        calculateGroundNormal = function (angles) {
            var v = new THREE.Vector3(0, angles.cosPitchAngle, angles.sinPitchAngle);

            groundNormal.x = -v.y * angles.sinRollAngle;
            groundNormal.y = v.y * angles.cosRollAngle;
            groundNormal.z = v.z;
        },

        calculateBoundingCircle = function () {
            boundingRadius = (horizon.position.z - horizonArcZshift) * Math.tan(viewConeAngle);
        },

        calculatePitchCircle = function (angles) {
            var v, vRef, vObs;

            v = new THREE.Vector3(0, -viewSphereRadius * angles.sinPitchAngle, viewSphereRadius * angles.cosPitchAngle);
            vRef = new THREE.Vector3(-v.y * angles.sinRollAngle, v.y * angles.cosRollAngle, v.z);
            vObs = boost.getObserverVertex(vRef);

            vObs.multiplyScalar((horizon.position.z - horizonArcZshift) / vObs.z);

            pitchRadius = Math.sqrt(vObs.x * vObs.x + vObs.y * vObs.y);
            vanishingPoint = vObs;
        },

        calculateAngularNormals = function () {
            var alpha, i;

            angularNormal = [];

            for (i = 0; i < granularity; i++) {
                alpha = Math.PI * i / granularity;

                angularNormal[i] = new THREE.Vector3(
                    -viewSphereRadius * Math.cos(alpha),
                    viewSphereRadius * Math.sin(alpha),
                    0
                );
            }
        },

        createHorizonArc = function () {
            var i, j, horizonArc, arcSlice;

            horizonArcGeometry = new THREE.Geometry();
            horizonArcGeometry.dynamic = true;

            for (i = 0; i < 2 * granularity + 1; i++) {
                horizonArcGeometry.vertices.push(new THREE.Vector3());
            }

            for (i = 0; i < 2 * granularity; i++) {
                j = i + 1;
                if (j === 2 * granularity) {
                    j = 0;
                }

                arcSlice = new THREE.Face3(2 * granularity, i, j);
                arcSlice.normal.copy(horizonNormal);
                arcSlice.vertexNormals = [
                    horizonNormal.clone(),
                    horizonNormal.clone(),
                    horizonNormal.clone()
                ];
                horizonArcGeometry.faces.push(arcSlice);
            }
            horizonArcGeometry.faceVertexUvs[0] = [];
            horizonArcGeometry.computeCentroids();

            horizonArc = new THREE.Mesh(horizonArcGeometry, horizonArcMaterial);

            horizonArc.material.side = THREE.DoubleSide;

            return horizonArc;
        },

        updateHorizonArcColor = function (color) {
            horizonArcColor = color;
            horizonArcMaterial.uniforms.horizonArcColor.value = color;

            if (horizonArcColor === skyColor) {
                horizonBackgroundMaterial.uniforms.horizonBackgroundColor.value = groundColor;
            } else {
                horizonBackgroundMaterial.uniforms.horizonBackgroundColor.value = skyColor;
            }
        },

        isCurvatureNeglegible = function (v0, vn, center) {
            var curvature, v0n, vr, vc, length;

            v0n = new THREE.Vector3();
            v0n.subVectors(vn, v0);
            length = v0n.length();

            vr = new THREE.Vector3(v0n.y, -v0n.x, v0n.z);
            vr.divideScalar(length);

            vc = new THREE.Vector3();
            vc.subVectors(center, v0);

            curvature = vc.dot(vr) / length;

            return (Math.abs(curvature) < 0.001);
        },

        isTriangle = function (v0, vn, vR) {
            if (vR.x === v0.x) {
                if (Math.abs(vR.y - v0.y) < 0.01) {
                    return false;
                }
            }

            if (vR.x === vn.x) {
                if (Math.abs(vR.y - vn.y) < 0.01) {
                    return false;
                }
            }

            return true;
        },

        trianglePointsToCenter = function (v0, vn, vR) {
            var va, vb, det;

            va = new THREE.Vector3();
            va.subVectors(vn, v0);

            vb = new THREE.Vector3();
            vb.subVectors(vR, v0);

            det = va.x * vb.y - va.y * vb.x;

            return (det * (-va.x * v0.y + va.y * v0.x) > 0);
        },

        findRectificationVertex = function (v0, vn, center) {
            var va, vb, det, vRect;

            va = new THREE.Vector3();
            va.subVectors(vn, v0);

            vb = new THREE.Vector3();
            vb.subVectors(center, v0);

            det = va.x * vb.y - va.y * vb.x;

            vRect = new THREE.Vector3(vn.x, v0.y, v0.z);
            vb.subVectors(vRect, v0);

            if (det * (va.x * vb.y - va.y * vb.x) >= 0) {
                vRect.x = v0.x;
                vRect.y = vn.y;
            }

            return vRect;
        },

        findGroundRectificationVertex = function (v0, vn) {
            var va, vRect;

            vRect = new THREE.Vector3(vn.x, v0.y, v0.z);
            va = new THREE.Vector3();
            va.subVectors(vRect, v0);

            if ((groundNormal.x * va.x + groundNormal.y * va.y) > 0) {
                vRect.x = v0.x;
                vRect.y = vn.y;
            }

            return vRect;
        },

        simpleHorizonArcCompletion = function (angles, v0, vn, vR) {
            var x1, y1, x2, y2;

            if (Math.abs(angles.cosRollAngle) > 0.5) {
                x1 = xmin;
                x2 = xmax;
                y1 = v0.y;
                if (angles.cosRollAngle > 0) {
                    if (horizonArcColor === skyColor) {
                        y2 = ymax;
                    } else {
                        y2 = ymin;
                    }
                } else {
                    if (horizonArcColor === skyColor) {
                        y2 = ymin;
                    } else {
                        y2 = ymax;
                    }
                }
            } else {
                y1 = ymin;
                y2 = ymax;
                x1 = v0.x;
                if (angles.sinRollAngle > 0) {
                    if (horizonArcColor === skyColor) {
                        x2 = xmax;
                    } else {
                        x2 = xmin;
                    }
                } else {
                    if (horizonArcColor === skyColor) {
                        x2 = xmin;
                    } else {
                        x2 = xmax;
                    }
                }
            }

            updateRectangleGeometry(horizontalRect, x1, y1, x2, y2);
        },

        triangularHorizonArcCompletion = function (angles, v0, vn, vR) {
            var xE, yE, x, y, pointsTriangleToCenter;

            xE = vR.x;
            yE = vR.y;

            pointsTriangleToCenter = trianglePointsToCenter(v0, vn, vR);

            if (v0.y === vR.y) {

                if (pointsTriangleToCenter) {
                    if (v0.x < vR.x) {
                        x = xmin;
                    } else {
                        x = xmax;
                    }
                } else {
                    x = v0.x;
                }

                if (v0.y < vn.y) {
                    if (v0.y > ymin) {
                        updateRectangleGeometry(horizontalRect, x, ymin, vR.x, vR.y);
                        yE = ymin;
                    }
                } else {
                    if (v0.y < ymax) {
                        updateRectangleGeometry(horizontalRect, x, ymax, vR.x, vR.y);
                        yE = ymax;
                    }
                }
            }

            if (v0.x === vR.x) {

                if (pointsTriangleToCenter) {
                    if (v0.y < vR.y) {
                        y = ymin;
                    } else {
                        y = ymax;
                    }
                } else {
                    y = v0.y;
                }

                if (v0.x < vn.x) {
                    if (v0.x > xmin) {
                        updateRectangleGeometry(horizontalRect, xmin, y, vR.x, vR.y);
                        xE = xmin;
                    }
                } else {
                    if (v0.x < xmax) {
                        updateRectangleGeometry(horizontalRect, xmax, y, vR.x, vR.y);
                        xE = xmax;
                    }
                }
            }

            if (vn.y === vR.y) {

                if (pointsTriangleToCenter) {
                    if (vn.x < vR.x) {
                        x = xmin;
                    } else {
                        x = xmax;
                    }
                } else {
                    x = vn.x;
                }

                if (vn.y < v0.y) {
                    if (vn.y > ymin) {
                        updateRectangleGeometry(verticalRect, x, ymin, vR.x, vR.y);
                        yE = ymin;
                    }
                } else {
                    if (vn.y < ymax) {
                        updateRectangleGeometry(verticalRect, x, ymax, vR.x, vR.y);
                        yE = ymax;
                    }
                }
            }

            if (vn.x === vR.x) {

                if (pointsTriangleToCenter) {
                    if (vn.y < vR.y) {
                        y = ymin;
                    } else {
                        y = ymax;
                    }
                } else {
                    y = vn.y;
                }

                if (vn.x < v0.x) {
                    if (vn.x > xmin) {
                        updateRectangleGeometry(verticalRect, xmin, y, vR.x, vR.y);
                        xE = xmin;
                    }
                } else {
                    if (vn.x < xmax) {
                        updateRectangleGeometry(verticalRect, xmax, y, vR.x, vR.y);
                        xE = xmax;
                    }
                }
            }

            updateRectangleGeometry(edgeRect, vR.x, vR.y, xE, yE);
        },

        horizonArcCompletion = function (angles, v0, vn, vR) {
            horizontalRect.visible = false;
            verticalRect.visible = false;
            edgeRect.visible = false;

            if (isTriangle(v0, vn, vR)) {
                triangularHorizonArcCompletion(angles, v0, vn, vR);
            } else {
                simpleHorizonArcCompletion(angles, v0, vn, vR);
            }
        },

        updateOpenHorizonArc = function (angles) {
            var dy, vObs, vRef, vRect,
                h, dx,
                pRef, pObs,
                center, n,
                i;

            n = granularity - 1;

            horizonArcGeometry.vertices[n].x = vanishingPoint.x;
            horizonArcGeometry.vertices[n].y = vanishingPoint.y;

            dy = (boundingRadius - pitchRadius) / n;
            vObs = new THREE.Vector3(0, pitchRadius, horizon.position.z - horizonArcZshift);

            pRef = new THREE.Vector3();

            center = new THREE.Vector3();
            center.add(horizonArcGeometry.vertices[n]);

            for (i = 1; i <= n; i++) {
                vObs.y += dy;
                vRef = boost.getReferenceVertex(vObs);
                vRef.multiplyScalar(viewSphereRadius / vRef.length());

                h = -vRef.z * angles.sinPitchAngle / angles.cosPitchAngle;
                dx = Math.sqrt(vRef.y * vRef.y - h * h);

                pRef.x = -dx * angles.cosRollAngle - h * angles.sinRollAngle;
                pRef.y = -dx * angles.sinRollAngle + h * angles.cosRollAngle;
                pRef.z = vRef.z;

                pObs = boost.getObserverVertex(pRef);
                pObs.multiplyScalar((horizon.position.z - horizonArcZshift) / pObs.z);

                horizonArcGeometry.vertices[n - i].x = pObs.x;
                horizonArcGeometry.vertices[n - i].y = pObs.y;
                center.add(horizonArcGeometry.vertices[n - i]);

                pRef.x = dx * angles.cosRollAngle - h * angles.sinRollAngle;
                pRef.y = dx * angles.sinRollAngle + h * angles.cosRollAngle;
                pRef.z = vRef.z;

                pObs = boost.getObserverVertex(pRef);
                pObs.multiplyScalar((horizon.position.z - horizonArcZshift) / pObs.z);

                horizonArcGeometry.vertices[n + i].x = pObs.x;
                horizonArcGeometry.vertices[n + i].y = pObs.y;
                center.add(horizonArcGeometry.vertices[n + i]);
            }

            center.divideScalar(2 * n + 1);
            horizonArcGeometry.vertices[2 * n + 2].copy(center);

            if (isCurvatureNeglegible(horizonArcGeometry.vertices[0], horizonArcGeometry.vertices[2 * n], center)) {
                vRect = findGroundRectificationVertex(
                    horizonArcGeometry.vertices[0],
                    horizonArcGeometry.vertices[2 * n]
                );
                horizonArcGeometry.vertices[2 * n + 1].copy(vRect);
                updateHorizonArcColor(groundColor);
            } else {
                vRect = findRectificationVertex(
                    horizonArcGeometry.vertices[0],
                    horizonArcGeometry.vertices[2 * n],
                    center
                );
                horizonArcGeometry.vertices[2 * n + 1].copy(vRect);
                if (angles.sinPitchAngle > 0) {
                    updateHorizonArcColor(skyColor);
                } else {
                    updateHorizonArcColor(groundColor);
                }
            }

            horizonArcCompletion(angles, horizonArcGeometry.vertices[0], horizonArcGeometry.vertices[2 * n], vRect);

            horizonArcGeometry.verticesNeedUpdate = true;
            horizonArc.visible = true;
        },

        updateClosedHorizonArc = function (angles) {
            var vRef, vObs, vCut, center, i;

            vRef = new THREE.Vector3();
            vObs = new THREE.Vector3();
            vCut = new THREE.Vector3();

            center = new THREE.Vector3();

            for (i = 0; i < granularity; i++) {
                vCut.crossVectors(angularNormal[i], groundNormal);
                vCut.multiplyScalar(viewSphereRadius / vCut.length());

                vRef.copy(vCut);
                vObs = boost.getObserverVertex(vRef);
                vObs.multiplyScalar((horizon.position.z - horizonArcZshift) / vObs.z);

                horizonArcGeometry.vertices[i].x = vObs.x;
                horizonArcGeometry.vertices[i].y = vObs.y;
                center.add(horizonArcGeometry.vertices[i]);

                vRef.copy(vCut);
                vRef.multiplyScalar(-1);
                vObs = boost.getObserverVertex(vRef);
                vObs.multiplyScalar((horizon.position.z - horizonArcZshift) / vObs.z);

                horizonArcGeometry.vertices[i + granularity].x = vObs.x;
                horizonArcGeometry.vertices[i + granularity].y = vObs.y;
                center.add(horizonArcGeometry.vertices[i + granularity]);
            }

            center.divideScalar(2 * granularity);
            horizonArcGeometry.vertices[2 * granularity].copy(center);

            if (angles.sinPitchAngle > 0) {
                updateHorizonArcColor(skyColor);
            } else {
                updateHorizonArcColor(groundColor);
            }

            horizonArcGeometry.verticesNeedUpdate = true;
            horizonArc.visible = true;
        };


    self.getMesh = function () {
        return mesh;
    };

    self.setZ = function (z) {
        horizon.position.z = z;
    };

    self.setFrustumParametersFromCamera = function (camera) {
        var near = camera.near,
            far = (horizon.position.z + horizonBackground.position.z);

        ymax = near * Math.tan(camera.fov * Math.PI / 360);
        ymin = -ymax;
        xmax = ymax * camera.aspect;
        xmin = -xmax;

        xmin = far * xmin / near;
        xmax = far * xmax / near;
        ymin = far * ymin / near;
        ymax = far * ymax / near;

        updateRectangleGeometry(
            horizonBackground,
            xmin,
            ymin,
            xmax,
            ymax
        );
    };

    self.updateObserverViewCone = function (viewconeparameters) {
        viewConeAngle = viewconeparameters.viewConeAngle;
        viewSphereRadius = viewconeparameters.viewSphereRadius;

        calculateBoundingCircle();
        calculateAngularNormals();
    };


    self.setPosition = function (posVec) {
        position = posVec;
    };

    self.setUpVector = function (upVec) {
        upVector = upVec;
    };

    self.setLookAtVector = function (lookAtVec) {
        lookAtVector = lookAtVec;
    };

    self.setAngles = function (a) {
        angles = a;
    };

    self.update = function () {
        var cosReferenceViewConeAngle = Math.cos(boost.getReferenceViewConeAngle());

        mesh.position = position;
        mesh.up = upVector;
        mesh.lookAt(lookAtVector);

        calculateGroundNormal(angles);

        horizonArc.visible = false;
        updateRectangleGeometry(horizontalRect, 0, 0, 0, 0);
        updateRectangleGeometry(verticalRect, 0, 0, 0, 0);
        updateRectangleGeometry(edgeRect, 0, 0, 0, 0);

        if (angles.cosPitchAngle > Math.abs(cosReferenceViewConeAngle)) {
            // horizon ground plane cuts the view cone in the reference frame:
            calculatePitchCircle(angles);
            updateOpenHorizonArc(angles);
        } else {
            if (cosReferenceViewConeAngle < 0) {
                // horizon ground plane completely within the view cone of the reference frame draw 360 deg horizon ...
                updateClosedHorizonArc(angles);
            } else {
                // view cone angle in reference frame < 180 deg:
                if (angles.sinPitchAngle >= 0) {
                    updateHorizonArcColor(groundColor);
                } else {
                    updateHorizonArcColor(skyColor);
                }
            }
        }
    };

    init();
}
