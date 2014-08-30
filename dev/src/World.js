function World() {
    var self = this,

        deferred,

        covariantMaterial,

        scene,
        sceneBoundingBox,
        topviewScene,
        topviewImage,
        topviewCamera,

        worldLoader,
        world,

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

        init = function () {
            deferred = new $.Deferred();

            covariantMaterial = new CovariantMaterial();

            worldLoader = new X3d.SceneLoader();
            worldLoader.setCreateMaterialHandler(function(properties) {
                return covariantMaterial.getMaterial(properties);
            });

            $.when(covariantMaterial.getPromise()).then(function(covariantMaterialResponse) {
                worldLoader.loadSceneFromX3d('/Lightrider/Objects/Scene/world.x3d');
                return worldLoader.getPromise();
            }).done(function(worldLoaderResponse) {
                scene = worldLoader.getScene();
                scene.traverse(function(child) {
                    child.frustumCulled = false;
                });

                world = worldLoader.getNode('world_TRANSFORM');
                world.scale = new THREE.Vector3(10, 10, 10);

                sceneBoundingBox = computeBoundingBox(scene);
                topviewScene = createTopviewSceneFromBoundingBox(sceneBoundingBox);

                deferred.resolve();
            }).fail(function(error) {
                deferred.reject(error);
            });
        };
 

    self.getPromise = function () {
        return deferred.promise();
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
