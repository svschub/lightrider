function LookDownGroup () {
    var self = this,

        y = 20,
        mesh, camera, ground,
        
        init = function () {
            mesh = new THREE.Object3D();

            camera = new THREE.OrthographicCamera(-80,+80, +70,-70, 1, 1000);
            camera.up = new THREE.Vector3(0,0,1);
            camera.lookAt(new THREE.Vector3(0,-1,0));
            mesh.add(camera);

            ground = new THREE.Mesh(
                new THREE.PlaneGeometry(160, 140),
                new THREE.MeshBasicMaterial({
                    ambient: 0x446600,
                    color: 0x446600
                })
            );
            ground.position.y = -y-10;
            mesh.add(ground);
        };

    self.getMesh = function () {
        return mesh;
    }
    
    self.getCamera = function () {
        return camera;
    }

    self.setPosition = function (position) {
        mesh.position = new THREE.Vector3(position.x, y, position.z);
    };

    self.setViewAngle = function (angles) {
        mesh.lookAt(new THREE.Vector3(
            mesh.position.x + angles.sinYawAngle,
            mesh.position.y,
            mesh.position.z - angles.cosYawAngle
        ));
    };

    init();    
}
