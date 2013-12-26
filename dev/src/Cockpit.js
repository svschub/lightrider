function Cockpit () {
    var self = this,

        mesh,
        rollAngleIndicator,
        pitchAngleIndicator,
        vorIndicator,
        lookDownImage,
        angles,

        displayCross = function () {
            var cross, crossLine, lineMaterial;

            cross = new THREE.Object3D();

            lineMaterial = new THREE.LineBasicMaterial({
                color: 0xFFFF00,
                opacity: 1,
                linewidth: 3
            });

            crossLine = new THREE.Geometry();
            crossLine.vertices = [
                new THREE.Vector3(-0.03, 0, 0),
                new THREE.Vector3(+0.03, 0, 0),
            ];
            cross.add(new THREE.Line(crossLine, lineMaterial));

            crossLine = new THREE.Geometry();
            crossLine.vertices = [
                new THREE.Vector3(0, -0.03, 0),
                new THREE.Vector3(0, 0.03, 0),
            ];
            cross.add(new THREE.Line(crossLine,    lineMaterial));

            return cross;
        },

        addVorIndicator = function () {
            var indicator = new AngleIndicator({
                sketch: [
                    [0, 0, 0.028],
                    [-0.007, 0, 0.008],
                    [-0.025, 0, -0.002],
                    [-0.006, 0, -0.005],
                    [-0.019, 0, -0.018],
                    [-0.006, 0, -0.013],
                    [0.006, 0, -0.013],
                    [0.019, 0, -0.018],
                    [0.006, 0, -0.005],
                    [0.025, 0, -0.002],
                    [0.007, 0, 0.008],
                    [0, 0, 0.028],
                ],
                texture: loadTexture("vorIndicator"),
                position: new THREE.Vector3(-0.18, 0.79, 0.75)
            });

            return indicator;
        },

        addRollAngleIndicator = function () {
            var indicator = new AngleIndicator({
                sketch: [
                    [0, 0, 0.02],
                    [-0.004, 0, 0.005],
                    [-0.027, 0, -0.002],
                    [0.0, 0, -0.005],
                    [0.026, 0, -0.002],
                    [0.004, 0, 0.005],
                    [0, 0, 0.02],
                ],
                texture: loadTexture("rollIndicator"),
                position: new THREE.Vector3(0.18, 0.79, 0.75)
            });

            return indicator;
        },

        addPitchAngleIndicator = function () {
            var indicator = new AngleIndicator({
                sketch: [
                    [-0.012, 0, 0.008],
                    [-0.016, 0, 0.005],
                    [-0.029, 0, -0.002],
                    [-0.01, 0, -0.004],
                    [0.024, 0, -0.003],
                    [0.024, 0, 0.018],
                    [0.01, 0, 0.004],
                    [-0.005, 0, 0.004],
                    [-0.012, 0, 0.008],
                ],
                texture: loadTexture("pitchIndicator"),
                position: new THREE.Vector3(0.29, 0.77, 0.75)
            });

            return indicator;
        },

        init = function () {
            var cockpit, cockpitMesh,
                display, displayGeometry,
                indicator,
                cross;

            mesh = new THREE.Object3D();

            displayGeometry = new DisplayGeometry();
            display = new THREE.Mesh(
                displayGeometry,
                new THREE.MeshFaceMaterial()
            );
            display.position = new THREE.Vector3(0,0.8,0.75);
            mesh.add(display);

            cross = displayCross();
            cross.position = new THREE.Vector3(0,0.8,0.73);
            mesh.add(cross);

            lookDownImage = displayGeometry.getLookDownImage();

            vorIndicator = addVorIndicator();
            mesh.add(vorIndicator.getMesh());

            rollAngleIndicator = addRollAngleIndicator();
            mesh.add(rollAngleIndicator.getMesh());

            pitchAngleIndicator = addPitchAngleIndicator();
            mesh.add(pitchAngleIndicator.getMesh());

            mesh.add(new THREE.Mesh(
                new CockpitGeometry(),
                new THREE.MeshFaceMaterial()
            ));
        };

    self.getMesh = function () {
        return mesh;
    };

    self.getLookDownImage = function () {
        return lookDownImage;  
    };

    self.setAngles = function (a) {
        angles = a;
    };

    self.update = function () {
        vorIndicator.updateDirection(-angles.sinYawAngle,+angles.cosYawAngle);

        rollAngleIndicator.updateDirection(+angles.sinRollAngle,+angles.cosRollAngle);

        var cPa = angles.cosPitchAngle;
        if (angles.cosRollAngle < 0) cPa = -cPa;
        pitchAngleIndicator.updateDirection(+angles.sinPitchAngle,+cPa);
    };

    init();
}
