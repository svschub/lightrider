function FlightModel(boost) {
    this.boost = boost;

    this.position = new THREE.Vector3(0, 0, 0);

    this.speed = 0.0;
    this.speedUp = false;
    this.speedDown = false;
    this.accelerationIncr = 0.007;

    // Rollen:
    this.rollAction = new THREE.Quaternion();
    this.rollAxis = new THREE.Vector3(0, 0, -1);
    this.rollAngleIncr = 0.0;
    this.sinRollAngle = 0.0;
    this.cosRollAngle = 1.0;  // 0 .. 360
    this.rollSpeed = 0.0;
    this.rollLeft = false;
    this.rollRight = false;
    this.rollAngleIncr = 0.03;

    // Neigen:
    this.pitchAction = new THREE.Quaternion();
    this.pitchAxis = new THREE.Vector3(1, 0, 0);
    this.pitchAngleIncr = 0.0;
    this.sinPitchAngle = 0.0;
    this.cosPitchAngle = 1.0;  // -90 .. +90
    this.pitchSpeed = 0.0;
    this.pitchUp = false;
    this.pitchDown = false;
    this.pitchAngleIncr = 0.022;

    // Gieren:
    this.yawAction = new THREE.Quaternion();
    this.yawAxis = new THREE.Vector3(0, 1, 0);
    this.yawAngleIncr = 0.0;
    this.sinYawAngle = 0.0;
    this.cosYawAngle = 1.0;  // 0 .. 360
    this.yawSpeed = 0.0;
    this.yawLeft = false;
    this.yawRight = false;
    this.yawAngleIncr = 0.02;

    this.createCabin();

    this.update(this);
}

FlightModel.prototype = {
    constructor: FlightModel,

    createCabin: function () {
        this.cabin = new THREE.Object3D();

        this.cockpit = new Cockpit();
        this.cabin.add(this.cockpit.mesh);

        this.observer = new Observer(this.boost);
        this.cabin.add(this.observer.mesh);
    },

    startLoop: function (milliseconds) {
        var self = this;

        self.loopMilliseconds = milliseconds;

        this.paused = false;

        self.update(self);

        self.timerLoopHandle = setInterval(function () {
            self.update(self);
        }, self.loopMilliseconds);
    },

    stopLoop: function () {
        clearInterval(this.timerLoopHandle);
    },

    setMoveHandler: function (moveHandler) {
        this.moveHandler = moveHandler;
    },

    roll: function (rollAngleIncr) {
        this.rollSpeed = this.rollSpeed + rollAngleIncr - 0.3 * this.rollSpeed;
        if (Math.abs(this.rollSpeed) < 0.0001) {
            this.rollSpeed = 0.0;
        }
        if (this.rollSpeed !== 0.0) {
            this.rollAxis.normalize();
            this.rollAction.setFromAxisAngle(this.rollAxis, this.rollSpeed);
            this.rollAction.multiplyVector3(this.yawAxis);
            this.rollAction.multiplyVector3(this.pitchAxis);
        }
    },

    pitch: function (pitchAngleIncr) {
        this.pitchSpeed = this.pitchSpeed + pitchAngleIncr - 0.6 * this.pitchSpeed;
        if (Math.abs(this.pitchSpeed) < 0.0001) {
            this.pitchSpeed = 0.0;
        }
        if (this.pitchSpeed !== 0.0) {
            this.pitchAxis.normalize();
            this.pitchAction.setFromAxisAngle(this.pitchAxis, this.pitchSpeed);
            this.pitchAction.multiplyVector3(this.yawAxis);
            this.pitchAction.multiplyVector3(this.rollAxis);
        }
    },

    yaw: function (yawAngleIncr) {
        this.yawSpeed = this.yawSpeed + yawAngleIncr - 0.55 * this.yawSpeed;
        if (Math.abs(this.yawSpeed) < 0.0001) {
            this.yawSpeed = 0.0;
        }
        if (this.yawSpeed !== 0.0) {
            this.yawAxis.normalize();
            this.yawAction.setFromAxisAngle(this.yawAxis, this.yawSpeed);
            this.yawAction.multiplyVector3(this.rollAxis);
            this.yawAction.multiplyVector3(this.pitchAxis);
        }
    },

    accelerate: function (acceleration) {
        if (acceleration !== 0.0) {
            this.speed += acceleration;
        }
        var direction = new THREE.Vector3();
        direction.copy(this.rollAxis);
        direction.multiplyScalar(this.speed);
        this.position.addSelf(direction);
    },

    getSpeed: function () {
        return this.speed;
    },

    getAltitude: function () {
        return this.position.y;
    },

    getPosition: function () {
        return this.position;
    },

    getUpVector: function () {
        return this.yawAxis;
    },

    getLookAtVector: function () {
        var lookAt = new THREE.Vector3();
        return lookAt.add(this.position, this.rollAxis);
    },

    calculateAngles: function () {
        var yAxis, axis, lengthSq;

        this.rollAxis.normalize();
        this.sinPitchAngle = this.rollAxis.y;
        this.cosPitchAngle = Math.sqrt(1.0 - this.sinPitchAngle * this.sinPitchAngle);

        this.pitchAxis.normalize();
        yAxis = new THREE.Vector3(0, 1, 0);
        axis = new THREE.Vector3();
        axis.cross(this.rollAxis, yAxis);
        lengthSq = axis.lengthSq();
        if (lengthSq > 0.000001) {
            axis.divideScalar(Math.sqrt(lengthSq));
            this.cosRollAngle = axis.dot(this.pitchAxis);
            yAxis.cross(axis, this.rollAxis);
            yAxis.normalize();
            this.sinRollAngle = yAxis.dot(this.pitchAxis);
        }

        axis.x = this.rollAxis.x;
        axis.y = 0.0;
        axis.z = -this.rollAxis.z;
        axis.normalize();
        this.cosYawAngle = axis.z;
        this.sinYawAngle = axis.x;
    },

    getAngles: function () {
        return {
            sinRollAngle: this.sinRollAngle,
            cosRollAngle: this.cosRollAngle,

            sinPitchAngle: this.sinPitchAngle,
            cosPitchAngle: this.cosPitchAngle,

            sinYawAngle: this.sinYawAngle,
            cosYawAngle: this.cosYawAngle
        };
    },

    move: function () {
        var acceleration, rollAngle, pitchAngle, yawAngle;

        acceleration = 0.0;
        if (this.speedUp) {
            acceleration += this.accelerationIncr;
        }
        if (this.speedDown) {
            acceleration -= this.accelerationIncr;
        }
        this.accelerate(acceleration);

        rollAngle = 0.0;
        if (this.rollLeft) {
            rollAngle -= this.rollAngleIncr;
        }
        if (this.rollRight) {
            rollAngle += this.rollAngleIncr;
        }
        this.roll(rollAngle);

        pitchAngle = 0.0;
        if (this.pitchUp) {
            pitchAngle += this.pitchAngleIncr;
        }
        if (this.pitchDown) {
            pitchAngle -= this.pitchAngleIncr;
        }
        this.pitch(pitchAngle);

        yawAngle = 0.0;
        if (this.yawLeft) {
            yawAngle += this.yawAngleIncr;
        }
        if (this.yawRight) {
            yawAngle -= this.yawAngleIncr;
        }
        this.yaw(yawAngle);
    },

    updateHud: function () {
        var speedMetersPerSecond = this.getSpeed() * 1000 / this.loopMilliseconds,
            speedKmPerSecond = 3.6 * speedMetersPerSecond,
            viewConeAngle;

        if (this.boost.beta < 0.1) {
            $("#speed").html("spd " + speedKmPerSecond.toFixed(1) + " km/h");
        } else {
            $("#speed").html("spd " + this.boost.beta.toFixed(4) + " c");
        }

        $("#altitude").html("alt " + this.getAltitude().toFixed(1) + " m");

        viewConeAngle = 360 * this.boost.referenceViewConeAngle / Math.PI;
        $("#viewConeAngle").html("fov " + viewConeAngle.toFixed(1) + " deg");
    },

    update: function (self) {
        if (self.paused) {
            return;
        }

        self.move();

        if (typeof self.moveHandler !== "undefined") {
            self.moveHandler(self.getPosition());
        }

        self.cabin.position = self.getPosition();
        self.cabin.up = self.getUpVector();
        self.cabin.lookAt(self.getLookAtVector());

        self.calculateAngles();

        self.observer.update(self.getAngles());
        self.cockpit.update(self.getAngles());

        self.updateHud();
    }
};
