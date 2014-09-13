function Observer() {
    var self = this,

        deferred,

        boost,

        camera,
        lookDownCamera,
        horizon, 

        viewConeAngle, 
        viewSphereRadius,
        speedMetersPerSecond,

        position,
        upVector,
        lookAtVector,
        altitude,
        angles,

        updateObserverViewCone = function () {
            var h = 2 * Math.tan(Math.PI * camera.fov / 360) * camera.near,
                w = h * camera.aspect,
                rNear = 0.5 * Math.sqrt(h * h + w * w),
                rFar = rNear * camera.far / camera.near;

            viewConeAngle = Math.atan(rNear / camera.near);
            viewSphereRadius = Math.sqrt(rFar * rFar + camera.far * camera.far);

            boost.setObserverViewConeAngle(viewConeAngle);

            horizon.updateObserverViewCone({
                viewConeAngle: viewConeAngle,
                viewSphereRadius: viewSphereRadius
            });
        },

        updateCamera = function () {
            camera.position = position;
            camera.lookAt(lookAtVector);
            camera.up = upVector;
        },

        updateHorizon = function () {
            horizon.setPosition(position);
            horizon.setLookAtVector(lookAtVector);
            horizon.setUpVector(upVector);
            horizon.setAngles(angles);

            horizon.update();
        },

        updateHud = function () {
            var speedKmPerSecond = 3.6 * speedMetersPerSecond,
                viewConeAngle;

            if (boost.getBeta() < 0.1) {
                $("#speed").html("spd " + speedKmPerSecond.toFixed(1) + " km/h");
            } else {
                $("#speed").html("spd " + boost.getBeta().toFixed(4) + " c");
            }

            $("#altitude").html("alt " + altitude.toFixed(1) + " m");

            viewConeAngle = 360 * boost.getReferenceViewConeAngle() / Math.PI;
            $("#viewConeAngle").html("fov " + viewConeAngle.toFixed(1) + " deg");
        },

        init = function () {
            console.log('DEBUG: Observer init');

            deferred = new $.Deferred();

            boost = new Boost();

            camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.3, 10000);
 
            lookDownCamera = new THREE.OrthographicCamera(-80,+80, +70,-70, 1, 1000);
            lookDownCamera.up = new THREE.Vector3(0,0,1);
            lookDownCamera.lookAt(new THREE.Vector3(0,-1,0));

            horizon = new Horizon();
            
            $.when(horizon.getPromise()).done(function(horizonResponse) {
                console.log('DEBUG: Observer ready');
                horizon.setZ(5000);
                horizon.setFrustumParametersFromCamera(camera);

                updateObserverViewCone();

                console.log('DEBUG: Observer resolve');
                deferred.resolve();
            }).fail(function(error) {
                console.log('DEBUG: Observer reject');
                deferred.reject(error); 
            });
        };


    self.getPromise = function () {
        return deferred.promise();
    };

    self.getCamera = function () {
        return camera;
    };

    self.getLookDownCamera = function () {
        return lookDownCamera;
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

    self.setAltitude = function (alt) {
        altitude = alt;
    };

    self.setAngles = function (a) {
        angles = a;
    };
    
    self.setSpeed = function (speed) {
        speedMetersPerSecond = speed;
    };

    self.setFov = function (fov) {
        camera.fov = fov;
        horizon.setFrustumParametersFromCamera(camera);
        camera.updateProjectionMatrix();
        updateObserverViewCone();
    };

    self.setViewport = function (width, height) {
        camera.aspect = width / height;
        horizon.setFrustumParametersFromCamera(camera);
        camera.updateProjectionMatrix();
        updateObserverViewCone();
    };

    self.getHorizonMesh = function () {
        return horizon.getMesh();
    };

    self.updateLookDownCamera = function () {
        var moveVector, downVector;

        lookDownCamera.position = new THREE.Vector3(position.x, 50, position.z);

        moveVector = new THREE.Vector3();
        moveVector.subVectors(lookAtVector, position);
        moveVector.y = 0;
        if (moveVector.lengthSq() > 0.0001) {
            lookDownCamera.up = moveVector;
        }

        downVector = new THREE.Vector3(position.x, 0, position.z);
        lookDownCamera.lookAt(downVector);
    };

    self.update = function () {
        updateCamera();
        updateHorizon();
        updateHud();
    };

    init();
}
