function World(boost) {
    var self = this,

        LOD = 4,  // level of detail
        scene,

        createColumnRow = function (radius, height, number, dx) {
            var columnRow, 
                column, 
                i;

            columnRow = new THREE.Object3D();

            for (i = 0; i < number; i++) {
                column = new THREE.Mesh(
                    new THREE.CylinderGeometry(radius, radius, height, 12, 4 * LOD, false),
                    boost.setMaterial({
                        color: 0x999999,
                        ambient: 0x777777,
                        shading: THREE.SmoothShading
                    })
                );
                column.position.x = i * dx - (number - 1) * dx / 2;

                columnRow.add(column);
            }

            return columnRow;
        },

        createPalace = function () {
            var palace, 
                columnRow, 
                building, 
                roof, 
                top;

            palace = new THREE.Object3D();

            columnRow = createColumnRow(0.5, 6, 4, 3);
            columnRow.position.y = 3;
            columnRow.position.z = 4.5;
            palace.add(columnRow);

            columnRow = createColumnRow(0.5, 6, 4, 3);
            columnRow.position.y = 3;
            columnRow.position.z = -4.5;
            palace.add(columnRow);

            columnRow = createColumnRow(0.5, 6, 4, 3);
            columnRow.rotation.y = Math.PI / 2;
            columnRow.position.y = 3;
            columnRow.position.x = +7.5;
            palace.add(columnRow);

            columnRow = createColumnRow(0.5, 6, 4, 3);
            columnRow.rotation.y = Math.PI / 2;
            columnRow.position.y = 3;
            columnRow.position.x = -7.5;
            palace.add(columnRow);

            building = new THREE.Mesh(
                new THREE.CubeGeometry(13, 6, 7, LOD * 2, LOD, LOD),
                boost.setMaterial({
                    ambient: 0xCCEECC,
                    color: 0xCCEECC,
                    shading: THREE.SmoothShading
                })
            );
            building.position.y = 3;
            palace.add(building);

            roof = new THREE.Mesh(
                new THREE.CubeGeometry(17, 11, 0.5, LOD * 2, LOD * 2, 1),
                boost.setMaterial({
                    ambient: 0xCCEECC,
                    color: 0xCCEECC,
                    shading: THREE.SmoothShading
                })
            );
            roof.rotation.x = Math.PI / 2;
            roof.position.y = 6.25;
            palace.add(roof);

            top = new THREE.Mesh(
                new THREE.CubeGeometry(6, 3, 4, LOD * 2, LOD, LOD),
                boost.setMaterial({
                    ambient: 0xCACA9C,
                    color: 0xCACA9C,
                    shading: THREE.SmoothShading
                })
            );
            top.position.y = 8;
            palace.add(top);

            return palace;
        },

        createChurch = function () {
            var church, 
                tower, 
                towerRoof, 
                building, 
                crossHorizontalBar, 
                crossVerticalBar, 
                r;

            church = new THREE.Object3D();

            building = new THREE.Mesh(
                new THREE.CubeGeometry(6, 4, 8, LOD * 2, LOD, LOD * 2),
                boost.setMaterial({
                    ambient: 0xCCEECC,
                    color: 0xCCEECC,
                    shading: THREE.SmoothShading
                })
            );
            building.position.y = 2;
            church.add(building);

            tower = new THREE.Mesh(
                new THREE.CubeGeometry(3, 9, 3, LOD, LOD * 2, LOD),
                boost.setMaterial({
                    ambient: 0xCCEECC,
                    color: 0xCCEECC,
                    shading: THREE.SmoothShading
                })
            );
            tower.position = new THREE.Vector3(0, 4.5, 5.5);
            church.add(tower);

            r = 0.2;
            towerRoof = new THREE.Mesh(
                new THREE.CylinderGeometry(r, 2.5, 3, 16, 4 * LOD, false),
                boost.setMaterial({
                    ambient: 0xFFAA99,
                    color: 0xFFAA99,
                    shading: THREE.FlatShading
                })
            );
            towerRoof.rotation.y = Math.PI / 4;
            towerRoof.position = new THREE.Vector3(0, 10.5, 5.5);
            church.add(towerRoof);

            crossVerticalBar = new THREE.Mesh(
                new THREE.CubeGeometry(r * 1.41, r * 1.41, 4, 1, 1, LOD),
                boost.setMaterial({
                    ambient: 0xCACA9C,
                    color: 0xCACA9C,
                    shading: THREE.SmoothShading
                })
            );
            crossVerticalBar.rotation.x = Math.PI / 2;
            crossVerticalBar.position = new THREE.Vector3(0, 14, 5.5);
            church.add(crossVerticalBar);

            crossHorizontalBar = new THREE.Mesh(
                new THREE.CubeGeometry(r * 1.41, r * 1.41, 2, 1, 1, LOD),
                boost.setMaterial({
                    ambient: 0xCACA9C,
                    color: 0xCACA9C,
                    shading: THREE.SmoothShading
                })
            );
            crossHorizontalBar.rotation.y = Math.PI / 2;
            crossHorizontalBar.position = new THREE.Vector3(0, 15, 5.5);
            church.add(crossHorizontalBar);

            return church;
        },

        createRunway = function () {
            var runway = new THREE.Mesh(
                new THREE.PlaneGeometry(10, 100, 2 * LOD, 8 * LOD),
                boost.setMaterial({
                    ambient: 0xAAAAAA,
                    color: 0x777777,
                    shading: THREE.SmoothShading
                })
            );

            runway.rotation.x = -Math.PI / 2;

            return runway;
        },

        init = function () {
            var church, 
                palace, 
                runway, 
                ambientLight, 
                pointLight;

            scene = new THREE.Scene();

            church = createChurch();
            church.position = new THREE.Vector3(10, 0, -15);
            scene.add(church);

            palace = createPalace();
            palace.position = new THREE.Vector3(-5, 0, -25);
            scene.add(palace);

            runway = createRunway();
            runway.position = new THREE.Vector3(-25, 0, -20);
            scene.add(runway);

            ambientLight = new THREE.AmbientLight(0x999999);
            scene.add(ambientLight);

            pointLight = new THREE.PointLight(0xCCFF22);
            pointLight.position.x = 0.5;
            pointLight.position.y = 0.7;
            pointLight.position.z = 10;
            scene.add(pointLight);

            scene.traverse(function (child) {
                child.frustumCulled = false;
            });
        };
 
    self.getScene = function () {
        return scene;
    };
    
    self.add = function (object3d) {
        scene.add(object3d);
    };

    init();
}
