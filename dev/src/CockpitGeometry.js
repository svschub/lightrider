function CockpitGeometry () {
    var lightGrey = new THREE.Color(0xDDDDDD),
        darkGrey = new THREE.Color(0xAAAAAA),
        black = new THREE.Color(0x333333),
        vertices, shape;

    THREE.Geometry.call(this);

    this.normal = new THREE.Vector3(0, 0, -1);

    this.materials = [
        new THREE.MeshBasicMaterial({
            color: 0xDDDDDD,
            vertexColors: THREE.VertexColors,
        }),
        new THREE.MeshBasicMaterial({
            color: 0x333333,
            vertexColors: THREE.VertexColors,
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
        this.vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
    }

    this.faces.push(this.triangle(0, 1, 2, lightGrey));
    this.faces.push(this.triangle(3, 0, 2, lightGrey));
    this.faces.push(this.rectangle(3, 2, 4, 5, lightGrey));
    this.faces.push(this.triangle(5, 4, 6, lightGrey));
    this.faces.push(this.triangle(2, 7, 6, lightGrey));

    this.faces.push(this.triangle(10, 9, 8, lightGrey));
    this.faces.push(this.triangle(10, 8, 11, lightGrey));
    this.faces.push(this.rectangle(13, 12, 10, 11, lightGrey));
    this.faces.push(this.triangle(14, 12, 13, lightGrey));
    this.faces.push(this.triangle(14, 15, 10, lightGrey));

    this.faces.push(this.rectangle(16, 17, 18, 19, lightGrey));

    this.faces.push(this.rectangle(20, 21, 22, 23, darkGrey));
    this.faces.push(this.rectangle(27, 26, 25, 24, darkGrey));

    this.faces.push(this.rectangle(28, 29, 30, 31, black));
    this.faces.push(this.rectangle(29, 28, 32, 33, black));

    this.faceVertexUvs[0] = [];

    this.computeCentroids();
}

CockpitGeometry.prototype = new THREE.Geometry();

CockpitGeometry.prototype.constructor = CockpitGeometry;

CockpitGeometry.prototype.triangle = function (a, b, c, color) {
    var shape = new THREE.Face3(a, b, c);
    shape.normal.copy(this.normal);
    shape.vertexNormals = [
        this.normal.clone(),
        this.normal.clone(),
        this.normal.clone(),
    ];
    shape.vertexColors = [
        color.clone(),
        color.clone(),
        color.clone(),
    ];
    shape.materialIndex = 0;
    return shape;
};

CockpitGeometry.prototype.rectangle = function (a, b, c, d, color) {
    var shape = new THREE.Face4(a, b, c, d);
    shape.normal.copy(this.normal);
    shape.vertexNormals = [
        this.normal.clone(),
        this.normal.clone(),
        this.normal.clone(),
        this.normal.clone(),
    ];
    shape.vertexColors = [
        color.clone(),
        color.clone(),
        color.clone(),
        color.clone(),
    ];
    shape.materialIndex = 0;
    return shape;
};
