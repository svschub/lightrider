
function AngleIndicator (options) {
    var self = this,
    
        indicator,
        indicatorBackplane,
        planeSketch,
        planeSketchGeometry,

        init = function () {
            indicator = new THREE.Object3D();

            indicatorBackplane = new THREE.Mesh(
                new THREE.PlaneGeometry(0.1, 0.1),
                new THREE.MeshBasicMaterial({
                    ambient: 0xFFFFFF,
                    color: 0xFFFFFF,
                    map: options.texture
                })
            );
            indicator.add(indicatorBackplane);

            planeSketchGeometry = new THREE.Geometry();
            for (var i=0; i < options.sketch.length; i++) {
                var vertex = options.sketch[i];
                planeSketchGeometry.vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
            }

            planeSketch = new THREE.Line(
                planeSketchGeometry,
                new THREE.LineBasicMaterial({
                    color: 0xFFFF00,
                    opacity: 1,
                    linewidth: 2
                })
            );
            planeSketch.position = new THREE.Vector3(0, 0.003, 0);
            indicator.add(planeSketch);

            indicator.position = options.position;
            indicator.rotation.x = -Math.PI/2;
       };
    
    self.getMesh = function () {
        return indicator;
    };

    self.updateDirection = function (dx, dz) {
        planeSketch.lookAt(new THREE.Vector3(
            planeSketch.position.x+dx,
            planeSketch.position.y,
            planeSketch.position.z+dz
        ));
    }
    
    init();
}
