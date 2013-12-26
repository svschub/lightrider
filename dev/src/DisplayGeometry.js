function DisplayGeometry () {
    var self = this,

        displayColor = new THREE.Color(0xDDDDDD),
        frameInnerColor = new THREE.Color(0x888888),
        frameOuterColor = new THREE.Color(0xBBBBBB),
        normal = new THREE.Vector3(0, 0, 1),
        lookDownImage,        
        display, 
        frame,
        
        frameBar = function (a, b, c, d, innerColor, outerColor) {
            var frameBar = new THREE.Face4(a, b, c, d);

            frameBar.normal.copy(normal);

            frameBar.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            frameBar.vertexColors = [
                innerColor.clone(),
                outerColor.clone(),
                outerColor.clone(),
                innerColor.clone(),
            ];

            frameBar.materialIndex = 1;

            return frameBar;
        }, 
        
        init = function () {
            THREE.Geometry.call(self);

//            self.normal = normal.clone();

            lookDownImage = new THREE.WebGLRenderTarget(256,256, {
                minFilter: THREE.LinearMipMapLinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat
            });

            self.materials = [
                new THREE.MeshBasicMaterial({ // screen
                    color: 0xDDDDDD,
                    shading: THREE.FlatShading,
                    vertexColors: THREE.VertexColors,
                    map: lookDownImage
                }),
                new THREE.MeshBasicMaterial({ // frame
                    color: 0xFFFFFF,
                    vertexColors: THREE.VertexColors
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

            display = new THREE.Face4(0, 1, 2, 3);
            display.normal.copy(normal);
            display.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            display.vertexColors = [
                displayColor.clone(),
                displayColor.clone(),
                displayColor.clone(),
                displayColor.clone(),
            ];
            display.materialIndex = 0;
            self.faces.push(display);

            self.faces.push(frameBar(0, 4, 5, 1, frameInnerColor, frameOuterColor));
            self.faces.push(frameBar(1, 5, 6, 2, frameInnerColor, frameOuterColor));
            self.faces.push(frameBar(2, 6, 7, 3, frameInnerColor, frameOuterColor));
            self.faces.push(frameBar(3, 7, 4, 0, frameInnerColor, frameOuterColor));

            self.faces.push(frameBar(4, 8, 9, 5, frameOuterColor, frameInnerColor));
            self.faces.push(frameBar(5, 9, 10, 6, frameOuterColor, frameInnerColor));
            self.faces.push(frameBar(6, 10, 11, 7, frameOuterColor, frameInnerColor));
            self.faces.push(frameBar(7, 11, 8, 4, frameOuterColor, frameInnerColor));

//            self.faceVertexUvs[0].push([ new THREE.Vector2(1,0), new THREE.Vector2(1,1), new THREE.Vector2(0,1), new THREE.Vector2(0,0) ]);
            self.faceVertexUvs[0].push([ new THREE.UV(1,0), new THREE.UV(1,1), new THREE.UV(0,1), new THREE.UV(0,0) ]);

            self.computeCentroids();
        };

    self.getLookDownImage = function () {
        return lookDownImage;
    };
    
    init(self);
}

DisplayGeometry.prototype = new THREE.Geometry();

DisplayGeometry.prototype.constructor = DisplayGeometry;
