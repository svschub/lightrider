function CockpitGeometry () {
    var self = this,

        lightGrey = new THREE.Color(0xDDDDDD),
        darkGrey = new THREE.Color(0xAAAAAA),
        black = new THREE.Color(0x333333),
        normal = new THREE.Vector3(0, 0, -1),
        vertices, 
        shape,
        
        triangle = function (a, b, c, color) {
            var shape = new THREE.Face3(a, b, c);
            shape.normal.copy(normal);
            shape.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            shape.vertexColors = [
                color.clone(),
                color.clone(),
                color.clone(),
            ];
            shape.materialIndex = 0;
            return shape;
        },

        rectangle = function (a, b, c, d, color) {
            var shape = new THREE.Face4(a, b, c, d);
            shape.normal.copy(normal);
            shape.vertexNormals = [
                normal.clone(),
                normal.clone(),
                normal.clone(),
                normal.clone(),
            ];
            shape.vertexColors = [
                color.clone(),
                color.clone(),
                color.clone(),
                color.clone(),
            ];
            shape.materialIndex = 0;
            return shape;
        }, 
        
        init = function () {
            THREE.Geometry.call(self);

//            self.normal = normal.clone();

            self.materials = [
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
                self.vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
            }

            self.faces.push(triangle(0, 1, 2, lightGrey));
            self.faces.push(triangle(3, 0, 2, lightGrey));
            self.faces.push(rectangle(3, 2, 4, 5, lightGrey));
            self.faces.push(triangle(5, 4, 6, lightGrey));
            self.faces.push(triangle(2, 7, 6, lightGrey));

            self.faces.push(triangle(10, 9, 8, lightGrey));
            self.faces.push(triangle(10, 8, 11, lightGrey));
            self.faces.push(rectangle(13, 12, 10, 11, lightGrey));
            self.faces.push(triangle(14, 12, 13, lightGrey));
            self.faces.push(triangle(14, 15, 10, lightGrey));

            self.faces.push(rectangle(16, 17, 18, 19, lightGrey));

            self.faces.push(rectangle(20, 21, 22, 23, darkGrey));
            self.faces.push(rectangle(27, 26, 25, 24, darkGrey));

            self.faces.push(rectangle(28, 29, 30, 31, black));
            self.faces.push(rectangle(29, 28, 32, 33, black));

            self.faceVertexUvs[0] = [];

            self.computeCentroids();            
        };

    init();
}

CockpitGeometry.prototype = new THREE.Geometry();

CockpitGeometry.prototype.constructor = CockpitGeometry;
