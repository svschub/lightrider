function FlightModel() {
    var self = this,

        loopMilliseconds,
        moveHandler,

        position = new THREE.Vector3(0, 0, 0),
        speed = 0.0,
        acceleration = 0.0,
        resetAcceleration = false,

        // Rollen:
        rollAction = new THREE.Quaternion(),
        rollAxis = new THREE.Vector3(0, 0, -1),
        sinRollAngle = 0.0,
        cosRollAngle = 1.0,  // 0 .. 360
        rollSpeed = 0.0,
        rollAngle = 0.0,

        // Neigen:
        pitchAction = new THREE.Quaternion(),
        pitchAxis = new THREE.Vector3(1, 0, 0),
        sinPitchAngle = 0.0,
        cosPitchAngle = 1.0,  // -90 .. +90
        pitchSpeed = 0.0,
        pitchAngle = 0.0,

        // Gieren:
        yawAction = new THREE.Quaternion(),
        yawAxis = new THREE.Vector3(0, 1, 0),
        sinYawAngle = 0.0,
        cosYawAngle = 1.0,  // 0 .. 360
        yawSpeed = 0.0,
        yawAngle = 0.0,

        roll = function (rollAngleIncr) {
            rollSpeed = rollSpeed + rollAngleIncr - 0.3 * rollSpeed;
            if (Math.abs(rollSpeed) < 0.0001) {
                rollSpeed = 0.0;
            }
            if (rollSpeed !== 0.0) {
                rollAxis.normalize();
                rollAction.setFromAxisAngle(rollAxis, rollSpeed);
                yawAxis.applyQuaternion(rollAction);
                pitchAxis.applyQuaternion(rollAction);
            }
        },

        pitch = function (pitchAngleIncr) {
            pitchSpeed = pitchSpeed + pitchAngleIncr - 0.6 * pitchSpeed;
            if (Math.abs(pitchSpeed) < 0.0001) {
                pitchSpeed = 0.0;
            }
            if (pitchSpeed !== 0.0) {
                pitchAxis.normalize();
                pitchAction.setFromAxisAngle(pitchAxis, pitchSpeed);
                yawAxis.applyQuaternion(pitchAction);
                rollAxis.applyQuaternion(pitchAction);
            }
        },

        yaw = function (yawAngleIncr) {
            yawSpeed = yawSpeed + yawAngleIncr - 0.55 * yawSpeed;
            if (Math.abs(yawSpeed) < 0.0001) {
                yawSpeed = 0.0;
            }
            if (yawSpeed !== 0.0) {
                yawAxis.normalize();
                yawAction.setFromAxisAngle(yawAxis, yawSpeed);
                rollAxis.applyQuaternion(yawAction);
                pitchAxis.applyQuaternion(yawAction);
            }
        },

        accelerate = function (accelerationIncr) {
            if (accelerationIncr !== 0.0) {
                speed += accelerationIncr;
            }
            var direction = new THREE.Vector3();
            direction.copy(rollAxis);
            direction.multiplyScalar(speed);
            position.add(direction);

            if (resetAcceleration) {
                acceleration = 0.0;
                resetAcceleration = false;
            }
        },

        move = function () {
            accelerate(acceleration);
            roll(rollAngle);
            pitch(pitchAngle);
            yaw(yawAngle);
        },
        
        calculateAngles = function () {
            var yAxis, axis, lengthSq;

            rollAxis.normalize();
            sinPitchAngle = rollAxis.y;
            cosPitchAngle = Math.sqrt(1.0 - sinPitchAngle * sinPitchAngle);

            pitchAxis.normalize();
            yAxis = new THREE.Vector3(0, 1, 0);
            axis = new THREE.Vector3();
            axis.crossVectors(rollAxis, yAxis);

            lengthSq = axis.lengthSq();
            if (lengthSq > 0.000001) {
                axis.divideScalar(Math.sqrt(lengthSq));
                cosRollAngle = axis.dot(pitchAxis);
                yAxis.crossVectors(axis, rollAxis);
                yAxis.normalize();
                sinRollAngle = yAxis.dot(pitchAxis);
            }

            axis.x = rollAxis.x;
            axis.y = 0.0;
            axis.z = -rollAxis.z;
            axis.normalize();
            cosYawAngle = axis.z;
            sinYawAngle = axis.x;
        };


    self.setIntervalMilliseconds = function(milliseconds) {
        loopMilliseconds = milliseconds;
    };

    self.setMoveHandler = function (handler) {
        moveHandler = handler;
    };

    self.setPosition = function (pos) {
        position = pos;
    };

    self.getPosition = function () {
        return position;
    };

    self.getAltitude = function () {
        return position.y;
    };

    self.getYawAxis = function () {
        return yawAxis;
    };

    self.getLookAtVector = function () {
        var lookAt = new THREE.Vector3();
        return lookAt.addVectors(position, rollAxis);
    };

    self.getAngles = function () {
        return {
            sinRollAngle: sinRollAngle,
            cosRollAngle: cosRollAngle,

            sinPitchAngle: sinPitchAngle,
            cosPitchAngle: cosPitchAngle,

            sinYawAngle: sinYawAngle,
            cosYawAngle: cosYawAngle
        };
    };

    self.getSpeed = function () {
        // returns speed in meters per second:
        return speed * 1000 / loopMilliseconds;        
    };

    self.setAcceleration = function (accel) {
        acceleration = accel;
    };

    self.resetAccelerationAfterUpdate = function () {
        resetAcceleration = true;
    };

    self.setRollAngle = function (rollangle) {
        rollAngle = rollangle;
    };
    
    self.setPitchAngle = function (pitchangle) {
        pitchAngle = pitchangle;
    };
    
    self.setYawAngle = function (yawangle) {
        yawAngle = yawangle;
    };

    self.update = function () {
        move();

        if (typeof moveHandler !== "undefined") {
            moveHandler(self.getPosition());
        }

        calculateAngles();
    };
}
