function World() {
    var self = this,

        covariantMaterial,

        LOD = 4,  // level of detail
        scene,
        sceneBoundingBox,
        topviewScene,
        topviewImage,
        topviewCamera,

        setVisibility = function (object3d, visible) {
            object3d.traverse(function (child) {
                child.visible = visible;
            });
        },

        computeBoundingBox = function(object, parentMatrix) {
            var boundingBox = null,
                worldVertices = [],
                matrix = new THREE.Matrix4();

            object.updateMatrix();

            if (parentMatrix) {
                matrix.multiplyMatrices(parentMatrix, object.matrix);
            } else {
                matrix.copy(object.matrix);
            }

            if (object instanceof THREE.Mesh) {
                object.geometry.vertices.forEach(function(vertex) {
                    var worldVertex = new THREE.Vector3();

                    worldVertex.copy(vertex);
                    worldVertex.applyMatrix4(matrix);

                    worldVertices.push(worldVertex);
                });
            } else if (object instanceof THREE.Object3D) {
                object.children.forEach(function(child) {
                    var childBoundingBox = computeBoundingBox(child, matrix);
                    if (childBoundingBox) {
                        worldVertices.push(childBoundingBox.min);
                        worldVertices.push(childBoundingBox.max);
                    }
                });
            }

            if (worldVertices.length > 0) {
                boundingBox = new THREE.Box3(); 
                boundingBox.setFromPoints(worldVertices);
            }

            return boundingBox;
        },

        createTopviewSceneFromBoundingBox = function(boundingBox) {
            var scene = new THREE.Scene(),
                center = new THREE.Vector3(),
                dx, dz,
                mesh;

            center.addVectors(boundingBox.max, boundingBox.min);
            center.multiplyScalar(0.5);
            center.y = boundingBox.min.y;

            dx = Math.abs(boundingBox.max.x - boundingBox.min.x);
            dz = Math.abs(boundingBox.max.z - boundingBox.min.z);

            topviewCamera = new THREE.OrthographicCamera(-0.5*dz,+0.5*dz, 0.5*dx,-0.5*dx, 1, 1000);
            topviewCamera.position = new THREE.Vector3(center.x, 1.25*boundingBox.max.y, center.z);
            topviewCamera.up = new THREE.Vector3(-1,0,0);
            topviewCamera.lookAt(new THREE.Vector3(center.x, 0, center.z));

            topviewImage = new THREE.WebGLRenderTarget(256, 256*dz/dx, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat
            });

            mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(dz, dx),
                new THREE.MeshBasicMaterial({
                    color: 0xFFFFFF,
                    shading: THREE.FlatShading,
                    map: topviewImage
                })
            );

            mesh.rotation.x = -0.5*Math.PI;
            mesh.rotation.z = 0.5*Math.PI;
            mesh.position = center;

            scene.add(mesh);

            return scene;
        },

        createColumnRow = function (radius, height, number, dx) {
            var columnRow, 
                column, 
                i;

            columnRow = new THREE.Object3D();

            for (i = 0; i < number; i++) {
                column = new THREE.Mesh(
                    new THREE.CylinderGeometry(radius, radius, height, 12, 4 * LOD, false),
                    covariantMaterial.getMaterial({
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
                covariantMaterial.getMaterial({
                    ambient: 0xCCEECC,
                    color: 0xCCEECC,
                    shading: THREE.SmoothShading
                })
            );
            building.position.y = 3;
            palace.add(building);

            roof = new THREE.Mesh(
                new THREE.CubeGeometry(17, 11, 0.5, LOD * 2, LOD * 2, 1),
                covariantMaterial.getMaterial({
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
                covariantMaterial.getMaterial({
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
                covariantMaterial.getMaterial({
                    ambient: 0xCCEECC,
                    color: 0xCCEECC,
                    shading: THREE.SmoothShading
                })
            );
            building.position.y = 2;
            church.add(building);

            tower = new THREE.Mesh(
                new THREE.CubeGeometry(3, 9, 3, LOD, LOD * 2, LOD),
                covariantMaterial.getMaterial({
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
                covariantMaterial.getMaterial({
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
                covariantMaterial.getMaterial({
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
                covariantMaterial.getMaterial({
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
                covariantMaterial.getMaterial({
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

            covariantMaterial = new CovariantMaterial();

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

            sceneBoundingBox = computeBoundingBox(scene);

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

            topviewScene = createTopviewSceneFromBoundingBox(sceneBoundingBox);
        };
 
    self.getScene = function () {
        return scene;
    };

    self.getTopviewScene = function () {
        return topviewScene;  
    };

    self.getTopviewImage = function () {
        return topviewImage;  
    };

    self.getTopviewCamera = function () {
        return topviewCamera;  
    };

    self.add = function (object3d) {
        scene.add(object3d);
    };

    init();
}
