function Cabin() {
    var self = this,

        cabinLoader,
        cabinScene,
        cabin, 
        cockpit,
        angles,

        pitchAngleIndicator,
        rollAngleIndicator,
        vorAngleIndicator,

        display,
        displayImage,

        init = function () {
            cabin = new THREE.Object3D();

            cabinLoader = new X3d.SceneLoader();

            cabinLoader.loadTextureTreeFromXml('/Lightrider/Objects/Textures/textures.xml');

            cabinLoader.loadSceneFromX3d('/Lightrider/Objects/Scene/cockpit.x3d');

            cabinScene = cabinLoader.getScene();
            
            cockpit = cabinLoader.getNode('cockpit_TRANSFORM');
            cockpit.position = new THREE.Vector3(0, -0.7, 0.3);
            cabin.add(cockpit);

            pitchAngleIndicator = cabinLoader.getNode('group_ME_pitch_plane_sketch_mesh');
            rollAngleIndicator = cabinLoader.getNode('group_ME_roll_plane_sketch_mesh');
            vorAngleIndicator = cabinLoader.getNode('group_ME_vor_plane_sketch_mesh');


            display = cabinLoader.getNode('shape_display_plane_mesh');

            displayImage = new THREE.WebGLRenderTarget(256, 182, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat
            });
            
            display.material = new THREE.MeshBasicMaterial({
                color: 0xDDDDDD,
                vertexColors: THREE.VertexColors,
                map: displayImage
            });
        },

        updateIndicator = function (indicator, dy, dz) {
            indicator.lookAt(new THREE.Vector3(
                indicator.position.x,
                indicator.position.y-dy,
                indicator.position.z-dz
            ));
        };


    self.getMesh = function () {
        return cabin;
    };

    self.getCockpit = function () {
        return cockpit;
    };
    
    self.setPosition = function (posVec) {
        cabin.position = posVec;
    };
    
    self.setLookAtVector = function(lookAtVec) {
        cabin.lookAt(lookAtVec);
    };
    
    self.setUpVector = function(upVec) {
        cabin.up = upVec;
    };

    self.setAngles = function (a) {
        angles = a;
    };

    self.update = function () {
        var pitchUp = (angles.cosRollAngle < 0) ? -1 : 1;

        updateIndicator(pitchAngleIndicator, pitchUp*angles.sinPitchAngle, -pitchUp*angles.cosPitchAngle);
        updateIndicator(rollAngleIndicator, angles.sinRollAngle,-angles.cosRollAngle);
        updateIndicator(vorAngleIndicator, -angles.sinYawAngle,-angles.cosYawAngle);
    };

    self.getDisplayImage = function () {
        return displayImage;  
    };

    init();
}
