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

        subdivideFaces = function(rootObject, maxAllowedEdgeLength) {
            var maxAllowedEdgeLengthSq = (maxAllowedEdgeLength > 0) ? 1.02*maxAllowedEdgeLength*maxAllowedEdgeLength : 0,
                minEdgeLengthSqInScene = null,
                maxEdgeLengthSqInScene = null,

                subdivideFace = function(faceIndex, edgeToSubdivide, object, worldVertices) {
                    var geometry = object.geometry,
                        face = geometry.faces[faceIndex],
                        face1, face2,
                        vertexIndices = [face.a, face.b, face.c, face.a, face.b],
                        faceVertexIndices = [0, 1, 2, 0, 1],
                        newVertexIndex = geometry.vertices.length,
                        newVertex = new THREE.Vector3(),
                        newWorldVertex = new THREE.Vector3(),
                        newVertexNormal = new THREE.Vector3(),
                        newVertexColor = new THREE.Color(),
                        faceVertexUvs,
                        newVertexUv;


                    newVertex.addVectors(geometry.vertices[vertexIndices[edgeToSubdivide]], geometry.vertices[vertexIndices[edgeToSubdivide+1]]);
                    newVertex.multiplyScalar(0.5);
                    geometry.vertices.push(newVertex);

                    newWorldVertex.copy(newVertex);
                    worldVertices.push(object.localToWorld(newWorldVertex));

                    newVertexNormal.addVectors(face.vertexNormals[faceVertexIndices[edgeToSubdivide]], face.vertexNormals[faceVertexIndices[edgeToSubdivide+1]]);
                    newVertexNormal.multiplyScalar(0.5);
                    newVertexNormal.normalize();

                    newVertexColor.addColors(face.vertexColors[faceVertexIndices[edgeToSubdivide]], face.vertexColors[faceVertexIndices[edgeToSubdivide+1]]);
                    newVertexColor.multiplyScalar(0.5);


                    face1 = new THREE.Face3(vertexIndices[edgeToSubdivide], newVertexIndex, vertexIndices[edgeToSubdivide+2]);
                    face1.normal = face.normal.clone();
                    face1.vertexNormals = [
                        face.vertexNormals[faceVertexIndices[edgeToSubdivide]].clone(),
                        newVertexNormal.clone(),
                        face.vertexNormals[faceVertexIndices[edgeToSubdivide+2]].clone(),
                    ];
                    face1.color = face.color.clone();
                    face1.vertexColors = [
                        face.vertexColors[faceVertexIndices[edgeToSubdivide]].clone(),
                        newVertexColor.clone(),
                        face.vertexColors[faceVertexIndices[edgeToSubdivide+2]].clone(),
                    ];

                    geometry.faces[faceIndex] = face1;


                    face2 = new THREE.Face3(newVertexIndex, vertexIndices[edgeToSubdivide+1], vertexIndices[edgeToSubdivide+2]);
                    face2.normal = face.normal.clone();
                    face2.vertexNormals = [
                        newVertexNormal.clone(),
                        face.vertexNormals[faceVertexIndices[edgeToSubdivide+1]].clone(),
                        face.vertexNormals[faceVertexIndices[edgeToSubdivide+2]].clone(),
                    ];
                    face2.color = face.color.clone();
                    face2.vertexColors = [
                        newVertexColor.clone(),
                        face.vertexColors[faceVertexIndices[edgeToSubdivide+1]].clone(),
                        face.vertexColors[faceVertexIndices[edgeToSubdivide+2]].clone(),
                    ];

                    geometry.faces.push(face2);


                    if (geometry.faceVertexUvs && geometry.faceVertexUvs[0] && geometry.faceVertexUvs[0].length > 0) {
                        faceVertexUvs = geometry.faceVertexUvs[0][faceIndex];

                        newVertexUv = new THREE.Vector2();
                        newVertexUv.addVectors(faceVertexUvs[faceVertexIndices[edgeToSubdivide]], faceVertexUvs[faceVertexIndices[edgeToSubdivide+1]]);
                        newVertexUv.multiplyScalar(0.5);

                        geometry.faceVertexUvs[0][faceIndex] = [
                            faceVertexUvs[faceVertexIndices[edgeToSubdivide]].clone(),
                            newVertexUv.clone(),
                            faceVertexUvs[faceVertexIndices[edgeToSubdivide+2]].clone(),
                        ];

                        geometry.faceVertexUvs[0].push([
                            newVertexUv.clone(),
                            faceVertexUvs[faceVertexIndices[edgeToSubdivide+1]].clone(),
                            faceVertexUvs[faceVertexIndices[edgeToSubdivide+2]].clone(),
                        ]);
                    }
                };

            /**
             * Subdivide all faces of this object and all its descendants until the
             * longest edge of each face is not longer than maxAllowedEdgeLength.
             */
            rootObject.traverse(function(object) {
                var geometry = object.geometry,
                    worldVertices = [],
                    vertexIndices,
                    numOfFaces,
                    edgeToSubdivide,
                    edgeVector = new THREE.Vector3(),
                    edgeLengthSq, maxFaceEdgeLengthSq,
                    facesToSubdivide, numOfFacesToSubdivide,
                    facesToSubdivideNext, numOfFacesToSubdivideNext,
                    face, faceIndex;

                object.updateMatrix();
                object.updateMatrixWorld(true);

                if (geometry && geometry.faces && geometry.faces.length > 0) {
                    /**
                     * transform all object vertices into world vertices and create
                     * the corresponding vertex array for temporary calculations:
                     */
                    geometry.vertices.forEach(function(vertex) {
                        var worldVertex = new THREE.Vector3();
                        worldVertex.copy(vertex);
                        worldVertices.push(object.localToWorld(worldVertex));
                    });

                    /**
                     * Loop over all faces of the object geometry and subdivide all faces
                     * whose longest edges are longer than maxAllowedEdgeLength. Repeat this
                     * loop until all faces are small enough and do not need to be subdivided
                     * anymore.
                     */
                    numOfFaces = geometry.faces.length;
                    numOfFacesToSubdivideNext = numOfFaces;
                    facesToSubdivideNext = new Array(numOfFacesToSubdivideNext);
                    for (var i=0; i < numOfFacesToSubdivideNext; i++) {
                        facesToSubdivideNext[i] = i;
                    }

                    do {
//                        console.log('subdividing ' + numOfFaces + ' faces with ' + geometry.vertices.length + ' vertices...');

                        facesToSubdivide = facesToSubdivideNext;
                        numOfFacesToSubdivide = numOfFacesToSubdivideNext;
//                        console.log('faces to check for subdivision: ' + JSON.stringify(facesToSubdivide));

                        facesToSubdivideNext = new Array(2*numOfFacesToSubdivide);
                        numOfFacesToSubdivideNext = 0;
                        for (var j=0; j < numOfFacesToSubdivide; j++) {
                            faceIndex = facesToSubdivide[j];

                            face = geometry.faces[faceIndex];
                            vertexIndices = [face.a, face.b, face.c, face.a, face.b];

                            // find the longest edge of the face: maxFaceEdgeLengthSq
                            maxFaceEdgeLengthSq = 0;
                            for (var edge=0; edge < 3; edge++) {
                                edgeVector.subVectors(worldVertices[vertexIndices[edge+1]], worldVertices[vertexIndices[edge]]);
                                edgeLengthSq = edgeVector.lengthSq();
                                if (edgeLengthSq > maxFaceEdgeLengthSq) {
                                    maxFaceEdgeLengthSq = edgeLengthSq;
                                    edgeToSubdivide = edge;
                                }

                                // find the shortest and longest egde within the scene:
                                if (minEdgeLengthSqInScene == null || edgeLengthSq < minEdgeLengthSqInScene) {
                                    minEdgeLengthSqInScene = edgeLengthSq;
                                }
                                if (maxEdgeLengthSqInScene == null || edgeLengthSq > maxEdgeLengthSqInScene) {
                                    maxEdgeLengthSqInScene = edgeLengthSq;
                                }
                            }

                            /**
                             * subdivide this face in two faces by bisecting the longest edge
                             * if this edge is longer than maxAllowedEdgeLength and if
                             * maxAllowedEdgeLength > 0:
                             */
                            if (maxAllowedEdgeLengthSq > 0 && maxFaceEdgeLengthSq > maxAllowedEdgeLengthSq) {
        //                        console.log('subdividing face ' + faceIndex + ': longest edge = ' + Math.sqrt(maxFaceEdgeLengthSq));
                                subdivideFace(faceIndex, edgeToSubdivide, object, worldVertices);

                                facesToSubdivideNext[numOfFacesToSubdivideNext++] = faceIndex;
        //                        numOfFacesToSubdivideNext++;
                                facesToSubdivideNext[numOfFacesToSubdivideNext++] = numOfFaces;
        //                        numOfFacesToSubdivideNext++;

                                numOfFaces++;
                            }
                        }

//                        console.log(numOfFaces + ' faces with '  + geometry.vertices.length + ' vertices after subdivision...');
                    } while (numOfFacesToSubdivideNext > 0);

                    geometry.mergeVertices();
//                    console.log(geometry.faces.length + ' faces with '  + geometry.vertices.length + ' vertices after merging vertices...');
                }
            });

//            console.log('edge length between ' + Math.sqrt(minEdgeLengthSqInScene) + ' and ' + Math.sqrt(maxEdgeLengthSqInScene));
        },

        init = function () {
//            console.log('DEBUG: World init');

            deferred = new $.Deferred();

            covariantMaterial = new CovariantMaterial();

            worldLoader = new X3d.SceneLoader();
            worldLoader.setCreateMaterialHandler(function(properties) {
                return covariantMaterial.getMaterial(properties);
            });

            $.when(covariantMaterial.getPromise()).then(function(covariantMaterialResponse) {
                worldLoader.loadSceneFromX3d('/Objects/Scene/world.x3d');
                return worldLoader.getPromise();
            }).done(function(worldLoaderResponse) {
//                console.log('DEBUG: World ready');
                scene = worldLoader.getScene();
                scene.traverse(function(child) {
                    child.frustumCulled = false;
                });

                world = worldLoader.getNode('world_TRANSFORM');
//                if (world) {
//                    console.log('DEBUG: world_TRANSFORM found');
//                }
                world.scale = new THREE.Vector3(10, 10, 10);
                subdivideFaces(world, 2.0);

                sceneBoundingBox = computeBoundingBox(scene);
                topviewScene = createTopviewSceneFromBoundingBox(sceneBoundingBox);

//                console.log('DEBUG: World resolve');
                deferred.resolve();
            }).fail(function(error) {
//                console.log('DEBUG: World reject');
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
