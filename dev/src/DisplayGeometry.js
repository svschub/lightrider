function DisplayGeometry () {
    var self = this,

        displayColor = new THREE.Color(0xDDDDDD),
        frameInnerColor = new THREE.Color(0x888888),
        frameOuterColor = new THREE.Color(0xBBBBBB),
        normal = new THREE.Vector3(0, 0, 1),
        faceMaterials,
        lookDownImage,        

        addFrameBar = function (a, b, c, d, innerColor, outerColor) {
            var frameBar1, frameBar2;
                    
            frameBar1 = new THREE.Face3(a, b, c);
            frameBar1.normal.copy(normal);
            frameBar1.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            frameBar1.vertexColors = [
                innerColor.clone(),
                outerColor.clone(),
                outerColor.clone(),
            ];
            frameBar1.materialIndex = 1;
            self.faces.push(frameBar1);
                    
            frameBar2 = new THREE.Face3(a, c, d);
            frameBar2.normal.copy(normal);
            frameBar2.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            frameBar2.vertexColors = [
                innerColor.clone(),
                outerColor.clone(),
                innerColor.clone(),
            ];
            frameBar2.materialIndex = 1;
            self.faces.push(frameBar2);
        }, 
        
        addDisplay = function () {
            var display1, display2;

            display1 = new THREE.Face3(0, 1, 2);
            display1.normal.copy(normal);
            display1.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            display1.vertexColors = [
                displayColor.clone(),
                displayColor.clone(),
                displayColor.clone(),
            ];
            display1.materialIndex = 0;
            self.faces.push(display1);
            self.faceVertexUvs[0].push([ new THREE.Vector2(1,0), new THREE.Vector2(1,1), new THREE.Vector2(0,1) ]);

            display2 = new THREE.Face3(0, 2, 3);
            display2.normal.copy(normal);
            display2.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            display2.vertexColors = [
                displayColor.clone(),
                displayColor.clone(),
                displayColor.clone(),
            ];
            display2.materialIndex = 0;
            self.faces.push(display2);
            self.faceVertexUvs[0].push([ new THREE.Vector2(1,0), new THREE.Vector2(0,1), new THREE.Vector2(0,0) ]);
        },

        addDisplayFrame = function () {
            addFrameBar(0, 4, 5, 1, frameInnerColor, frameOuterColor);
            addFrameBar(1, 5, 6, 2, frameInnerColor, frameOuterColor);
            addFrameBar(2, 6, 7, 3, frameInnerColor, frameOuterColor);
            addFrameBar(3, 7, 4, 0, frameInnerColor, frameOuterColor);

            addFrameBar(4, 8, 9, 5, frameOuterColor, frameInnerColor);
            addFrameBar(5, 9, 10, 6, frameOuterColor, frameInnerColor);
            addFrameBar(6, 10, 11, 7, frameOuterColor, frameInnerColor);
            addFrameBar(7, 11, 8, 4, frameOuterColor, frameInnerColor);
        },

        init = function () {
            THREE.Geometry.call(self);

            lookDownImage = new THREE.WebGLRenderTarget(256, 179, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat
            });

            faceMaterials = [
                new THREE.MeshBasicMaterial({ // screen
                    color: 0xDDDDDD,
                    vertexColors: THREE.VertexColors,
                    map: lookDownImage
                }),
                new THREE.MeshBasicMaterial({ // frame
                    color: 0xFFFFFF,
                    vertexColors: THREE.VertexColors,
                }),
            ];

            self.vertices = [
                new THREE.Vector3(-0.1, -0.07, 0),
                new THREE.Vector3(-0.1, +0.07, 0),
                new THREE.Vector3(+0.1, +0.07, 0),
                new THREE.Vector3(+0.1, -0.07, 0),

                new THREE.Vector3(-0.11, -0.08, 0),
                new THREE.Vector3(-0.11, +0.08, 0),
                new THREE.Vector3(+0.11, +0.08, 0),
                new THREE.Vector3(+0.11, -0.08, 0),

                new THREE.Vector3(-0.12, -0.09, 0.01),
                new THREE.Vector3(-0.12, +0.09, 0.01),
                new THREE.Vector3(+0.12, +0.09, 0.01),
                new THREE.Vector3(+0.12, -0.09, 0.01),
            ];

            addDisplay();

            addDisplayFrame();

            self.computeCentroids();
        };

    self.getLookDownImage = function () {
        return lookDownImage;
    };

    self.getFaceMaterials = function () {
        return faceMaterials;
    };

    init();
}

DisplayGeometry.prototype = Object.create(THREE.Geometry.prototype);