function Cabin() {
    var self = this,

        cabin, cockpit, observer,
        altitude, 
        angles,
        speed,

        init = function () {
            cabin = new THREE.Object3D();

            cockpit = new Cockpit();
            cabin.add(cockpit.getMesh());
        };


    self.addObserver = function(o) {
        observer = o;

        cabin.add(observer.getMesh());
    };

    self.getMesh = function () {
        return cabin;
    };

    self.getCockpit = function () {
        return cockpit;
    };

    self.getObserver = function () {
        return observer;
    };
    
    self.setPosition = function (position) {
        cabin.position = position;
    };
    
    self.setAltitude = function (alt) {
        altitude = alt;
    };
    
    self.setLookAtVector = function(lookAtVector) {
        cabin.lookAt(lookAtVector);
    };
    
    self.setUpVector = function(upVector) {
        cabin.up = upVector;
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

        observer.setAltitude(altitude);
        observer.setAngles(angles);
        observer.setSpeed(speed);
        observer.update();
    };


    init();
}
