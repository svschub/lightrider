function Observer(boost) {
    var self = this,

        mesh, 
        camera, 
        horizon, 
        viewConeAngle, 
        viewSphereRadius,
        altitude,
        angles,
        speedMetersPerSecond,

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
            mesh = new THREE.Object3D();

            camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.3, 10000);
            camera.position = new THREE.Vector3(0, 0, 0);
            camera.lookAt(new THREE.Vector3(0, 0, 1));
            camera.up = new THREE.Vector3(0, 1, 0);
            mesh.add(camera);

            horizon = new Horizon(boost);
            horizon.setZ(5000);
            horizon.setFrustumParametersFromCamera(camera);
            mesh.add(horizon.getMesh());

            mesh.position.y = 1;

            updateObserverViewCone();
        };

    self.getMesh = function () {
        return mesh;
    };

    self.getCamera = function () {
        return camera;
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

    self.update = function () {
        horizon.update(angles);
        updateHud();
    };

    init();
}
