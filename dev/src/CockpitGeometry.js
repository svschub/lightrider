function CockpitGeometry () {
    var self = this,

        lightGrey = new THREE.Color(0xDDDDDD),
        darkGrey = new THREE.Color(0xAAAAAA),
        black = new THREE.Color(0x333333),
        normal = new THREE.Vector3(0, 0, -1),
        faceMaterials,
        vertices, 
        shape,
        
        addTriangle = function (a, b, c, color) {
            var triangle = new THREE.Face3(a, b, c);

            triangle.normal.copy(normal);

            triangle.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];

            triangle.vertexColors = [
                color.clone(),
                color.clone(),
                color.clone(),
            ];

            triangle.materialIndex = 0;

            self.faces.push(triangle);
        },

        addRectangle = function (a, b, c, d, color) {
            addTriangle(a, b, c, color);
            addTriangle(a, c, d, color);
        }, 
        
        init = function () {
            THREE.Geometry.call(self);

            faceMaterials = [
                new THREE.MeshBasicMaterial({
                    color: 0xDDDDDD,
                    vertexColors: THREE.VertexColors
                }),
                new THREE.MeshBasicMaterial({
                    color: 0x333333,
                    vertexColors: THREE.VertexColors
                }),
            ];

            vertices = [
                [0.1, 0.83, 0.77],
                [0.2, 0.87, 0.77],
                [0.35, 0.82, 0.77],
                [0.1, 0.82, 0.77],
                [0.35, 0.73, 0.77],
                [0.1, 0.73, 0.77],
                [0.35, 0.67, 0.77],
                [0.39, 0.74, 0.77],

                [-0.1, 0.83, 0.77],
                [-0.2, 0.87, 0.77],
                [-0.35, 0.82, 0.77],
                [-0.1, 0.82, 0.77],
                [-0.35, 0.73, 0.77],
                [-0.1, 0.73, 0.77],
                [-0.35, 0.67, 0.77],
                [-0.39, 0.74, 0.77],

                [-0.09, 0.71, 0.79],
                [0.09, 0.71, 0.79],
                [0.025, 0.6, 0.6],
                [-0.025, 0.6, 0.6],

                [0.29, 0.67, 0.77],
                [0.39, 0.74, 0.77],
                [0.39, 0.74, 0.5],
                [0.29, 0.67, 0.5],

                [-0.29, 0.67, 0.77],
                [-0.39, 0.74, 0.77],
                [-0.39, 0.74, 0.5],
                [-0.29, 0.67, 0.5],

                [-0.4, 0.6, 0.8],
                [+0.4, 0.6, 0.8],
                [+0.4, 0.6, 0.5],
                [-0.4, 0.6, 0.5],

                [-0.3, 0.8, 0.9],
                [+0.3, 0.8, 0.9],
            ];

            for (var i=0; i < vertices.length; i++) {
                var vertex = vertices[i];
                self.vertices.push(new THREE.Vector3(vertex[0], vertex[1]-1.0, vertex[2]));
            }

            addTriangle(0, 1, 2, lightGrey);
            addTriangle(3, 0, 2, lightGrey);
            addRectangle(3, 2, 4, 5, lightGrey);
            addTriangle(5, 4, 6, lightGrey);
            addTriangle(2, 7, 6, lightGrey);

            addTriangle(10, 9, 8, lightGrey);
            addTriangle(10, 8, 11, lightGrey);
            addRectangle(13, 12, 10, 11, lightGrey);
            addTriangle(14, 12, 13, lightGrey);
            addTriangle(14, 15, 10, lightGrey);

            addRectangle(16, 17, 18, 19, lightGrey);

            addRectangle(20, 21, 22, 23, darkGrey);
            addRectangle(27, 26, 25, 24, darkGrey);

            addRectangle(28, 29, 30, 31, black);
            addRectangle(29, 28, 32, 33, black);

            self.faceVertexUvs[0] = [];

            self.computeCentroids();            
        };

    self.getFaceMaterials = function () {
        return faceMaterials;
    };

    init();
}

CockpitGeometry.prototype = Object.create(THREE.Geometry.prototype);
