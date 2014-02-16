function Cabin() {
    var self = this,

        cabin, cockpit,
        altitude, 
        angles,
        speed,

        init = function () {
            cabin = new THREE.Object3D();

            cockpit = new Cockpit();
            cabin.add(cockpit.getMesh());
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

    self.setAltitude = function (alt) {
        altitude = alt;
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
    
    self.setSpeed = function (spd) {
        speed = spd;
    };

    self.update = function () {
        cockpit.setAngles(angles);
        cockpit.update();
    };


    init();
}
