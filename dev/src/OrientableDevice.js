function OrientableDevice () {
    var self = this,

        orientation,
        isPanoramaView = null,

        deviceOrientationSupported,
        deviceMotionSupported,

        updateOrientationHandlers = [],
        updateOrientationAnglesHandlers = [],
        updateSpeedHandlers = [],

        x0axis = new THREE.Vector3(1,0,0),
        y0axis = new THREE.Vector3(0,1,0),
        z0axis = new THREE.Vector3(0,0,1),
        x = new THREE.Vector3(1,0,0),
        y = new THREE.Vector3(0,1,0),
        z = new THREE.Vector3(0,0,1),
        z_pxy = new THREE.Vector3(), 
        y_pxy = new THREE.Vector3(),

        nAvg,
        iAvg,
        pitchAngleArr,
        rollAngleArr,

        pitchAngle0,
        pitchAngle,
        minPitchAngle,
        maxPitchAngle,

        rollAngle0,
        rollAngle,
        minRollAngle,
        maxRollAngle,

        acceleration = new THREE.Vector3(),
        accelerationIncludingGravity = new THREE.Vector3(),
        acceleration0 = new THREE.Vector3(),
        acc = new THREE.Vector3(),
        forwardAcceleration,

        accelerationThreshold = 6.0,    // m/s^2
        minAccelerationTimeGap = 1000,  // ms
        accelerationThresholdReached,
        accelerationTime,
        accelerationTimePrevious,
        accelerationTimeLast,
        speedBoost,
        accelerationSgn,

        rad = function(deg) {
            return (Math.PI*deg/180.0);
        },

        getBoundedAngle = function(angle, minAngle, maxAngle) {
            var sgnAngle = (angle >= 0 ? 1 : -1),
                boundedAngle = sgnAngle * angle;

            if (angle >= 0) {
                if (angle < minAngle) {
                    boundedAngle = 0;
                } else if (angle > maxAngle) {
                    boundedAngle = maxAngle - minAngle;
                } else {
                    boundedAngle = angle - minAngle;
                }
            } else {
                if (angle > -minAngle) {
                    boundedAngle = 0;
                } else if (angle < -maxAngle) {
                    boundedAngle = minAngle - maxAngle;
                } else {
                    boundedAngle = minAngle + angle;
                }
            }

            return boundedAngle;
        },

        calculateAngles = function(event) {
            var radAlpha = rad(event.alpha),
                radBeta = rad(event.beta),
                radGamma = rad(event.gamma),
                i;

            x.set(1, 0, 0);
            y.set(0, 1, 0);
            z.set(0, 0, 1);

            x.applyAxisAngle(y0axis, radGamma);
            z.applyAxisAngle(y0axis, radGamma);

            x.applyAxisAngle(x0axis, radBeta);
            y.applyAxisAngle(x0axis, radBeta);
            z.applyAxisAngle(x0axis, radBeta);

            x.applyAxisAngle(z0axis, radAlpha);
            y.applyAxisAngle(z0axis, radAlpha);
            z.applyAxisAngle(z0axis, radAlpha);


            // pitch angle:

            z_pxy.set(z.x, z.y, 0);
            z_pxy.normalize();

            pitchAngle = z.angleTo(z_pxy);
            if (z.z > 0) {
                pitchAngle = -pitchAngle;
            }

            pitchAngleArr[iAvg] = pitchAngle - pitchAngle0;
            pitchAngle = 0.0;
            for (i = 0; i < nAvg; i++) {
                pitchAngle += pitchAngleArr[i];
            }
            pitchAngle = pitchAngle / nAvg;


            // roll angle:

            y_pxy.set(z_pxy.y, -z_pxy.x, 0);

            rollAngle = y.angleTo(y_pxy);
            if (rollAngle > 0.5*Math.PI) {
                rollAngle = Math.PI - rollAngle;
            }
            if (y.z > 0) {
                rollAngle = -rollAngle;
            }
            if (x.z < 0) {
                rollAngle = -rollAngle;
            }

            rollAngleArr[iAvg] = rollAngle - rollAngle0;
            rollAngle = 0.0;
            for (i = 0; i < nAvg; i++) {
                rollAngle += rollAngleArr[i];
            }
            rollAngle = rollAngle / nAvg;
            

            if (iAvg > 0) {
                iAvg--;
            } else {
                iAvg = nAvg - 1;
            }
        },

        deviceOrientationHandler = function(event) {
            if (event.alpha === null || event.beta === null || event.gamma === null) {
                deviceOrientationSupported = false;
            } else {
                deviceOrientationSupported = true;

                deviceOrientationHandler = function(event) {
                    var isPanoramaViewNew;
                            
                    calculateAngles(event);

                    isPanoramaViewNew = (window.orientation !== 0) && Math.abs(rollAngle) < 0.35*Math.PI;

                    if (isPanoramaView !== isPanoramaViewNew) {
                        isPanoramaView = isPanoramaViewNew;

                        updateOrientationHandlers.forEach(function(handler) {
                            handler({
                                isPanoramaView: isPanoramaView
                            });
                        });
                    }

                    updateOrientationAnglesHandlers.forEach(function(handler) {
                        handler({
                            pitchAngleRaw: pitchAngle + pitchAngle0,
                            rollAngleRaw: rollAngle + rollAngle0,
                            pitchAngle: pitchAngle,
                            rollAngle: rollAngle,
                            boundedPitchAngle: getBoundedAngle(pitchAngle, minPitchAngle, maxPitchAngle), 
                            boundedRollAngle: getBoundedAngle(rollAngle, minRollAngle, maxRollAngle),
                        });
                    });
                }
            }
        },

        bindDeviceOrientationEvents = function () {
            deviceOrientationSupported = false;
            if (window.DeviceOrientationEvent) {
                window.addEventListener("deviceorientation", function(event) {
                    deviceOrientationHandler(event);
                }, true);
            }
        },

        calculateAcceleration = function (event) {
            accelerationIncludingGravity.set(
                event.accelerationIncludingGravity.x,
                event.accelerationIncludingGravity.y,
                event.accelerationIncludingGravity.z
            );

            if (acceleration) {
                acceleration.set(
                    event.acceleration.x,
                    event.acceleration.y,
                    event.acceleration.z
                );
            }

            acceleration0.set(0, 0, 0);

            acc.copy(x);
            acc.multiplyScalar(accelerationIncludingGravity.x);
            acceleration0.add(acc);

            acc.copy(y);
            acc.multiplyScalar(accelerationIncludingGravity.y);
            acceleration0.add(acc);

            acc.copy(z);
            acc.multiplyScalar(accelerationIncludingGravity.z);
            acceleration0.add(acc);
            
            forwardAcceleration = acceleration0.dot(z_pxy);

            accelerationTimePrevious = accelerationTime;
            accelerationTime = Date.now();
        },

        evaluateAccleration = function () {
            var sngForwardAcceleration = (forwardAcceleration >= 0.0 ? 1.0 : -1.0),
                absForwardAcceleration = sngForwardAcceleration * forwardAcceleration;

            if (absForwardAcceleration > accelerationThreshold) {
                if (!accelerationThresholdReached && accelerationTime > accelerationTimeLast + minAccelerationTimeGap) {
                    accelerationSgn = sngForwardAcceleration;
                }

                if (sngForwardAcceleration == accelerationSgn) {
                    speedBoost += forwardAcceleration * (accelerationTime - accelerationTimePrevious);
                    accelerationTimeLast = accelerationTime;
                }

                accelerationThresholdReached = true;
            } else {
                updateSpeedHandlers.forEach(function(handler) {
                    handler(0.001 * speedBoost);
                });

                if (speedBoost !== 0.0) {
                    speedBoost = 0.0;
                }

                accelerationThresholdReached = false;
            }
        },

        deviceMotionHandler = function(event) {
            if (event.accelerationIncludingGravity === null) {
                deviceMotionSupported = false;
            } else {
                deviceMotionSupported = true;

                deviceMotionHandler = function(event) {
                    calculateAcceleration(event);
                    evaluateAccleration();
                }
            }
        },

        bindDeviceMotionEvents = function () {
            accelerationThresholdReached = false;
            accelerationTime = Date.now();
            accelerationTimeLast = accelerationTime;
            speedBoost = 0.0;

            deviceMotionSupported = false;
            if (window.DeviceMotionEvent) {
                window.addEventListener("devicemotion", function(event) {
                    deviceMotionHandler(event);
                }, false);
            }
        },

        initSlidingAverage = function () {
            nAvg = 2;
            iAvg = nAvg - 1;

            pitchAngleArr = new Array(nAvg);
            rollAngleArr = new Array(nAvg);
        },

        init = function () {
            record = false;
            max_records = 20000;
            va = new Array(max_records);
            vt = new Array(max_records);

            pitchAngle0 = 0;
            minPitchAngle = rad(10);
            maxPitchAngle = rad(50);

            rollAngle0 = 0;
            minRollAngle = rad(10);
            maxRollAngle = rad(50);

            initSlidingAverage();

            bindDeviceOrientationEvents();
            bindDeviceMotionEvents();
        };



    self.isDeviceOrientationSupported = function() {
        return deviceOrientationSupported;
    };

    self.isDeviceMotionSupported = function() {
        return deviceMotionSupported;
    };

    self.isPanoramaView = function () {
        return isPanoramaView;
    };

    self.registerPitchAngle0 = function() {
        pitchAngle0 = pitchAngle + pitchAngle0;
    };

    self.registerRollAngle0 = function() {
        rollAngle0 = rollAngle + rollAngle0;
    };

    self.addUpdateOrientationHandler = function(handler) {
        updateOrientationHandlers.push(handler);
    };

    self.addUpdateOrientationAnglesHandler = function(handler) {
        updateOrientationAnglesHandlers.push(handler);
    };

    self.addUpdateSpeedHandler = function(handler) {
        updateSpeedHandlers.push(handler);
    };

    init();
}
