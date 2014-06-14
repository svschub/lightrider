
function Boost () {
    var instance = null,
        boost = function () {
            var self = this,
                beta = 0.0, 
                gamma = 1.0, 
                invgamma = 1.0,
                observerViewConeAngle = 0.0,
                referenceViewConeAngle = 0.0;

            self.setBeta = function(betaParam) {
                beta = betaParam;
                invgamma = Math.sqrt(1-beta*beta);
                gamma = 1/invgamma;
                referenceViewConeAngle = self.getReferenceAngle(observerViewConeAngle);
            };

            self.getBeta = function () {
                return beta;
            };

            self.getGamma = function () {
                return gamma;
            };

            self.getReferenceVertex = function(vertex) {
                return new THREE.Vector3(vertex.x, vertex.y, gamma*(vertex.z - beta*vertex.length()));
            };

            self.getObserverVertex = function(vertex) {
                return new THREE.Vector3(vertex.x, vertex.y, gamma*(vertex.z + beta*vertex.length()));
            };

            self.getReferenceAngle = function(angle) {
                var referenceAngle = Math.atan(invgamma*Math.sin(angle)/(Math.cos(angle)-beta));
                if (referenceAngle <= 0) {
                    referenceAngle += Math.PI;
                }
                return referenceAngle;
            };

            self.getObserverAngle = function(angle) {
                var observerAngle = Math.atan(invgamma*Math.sin(angle)/(Math.cos(angle)+beta));
                if (observerAngle <= 0) {
                    observerAngle += Math.PI;
                }
                return observerAngle;
            };

            self.setObserverViewConeAngle = function(observerViewConeAngleParam) {
                observerViewConeAngle = observerViewConeAngleParam;
                referenceViewConeAngle = self.getReferenceAngle(observerViewConeAngle);
            };

            self.getObserverViewConeAngle = function () {
                return observerViewConeAngle;
            };

            self.getReferenceViewConeAngle = function () {
                return referenceViewConeAngle;
            };
        };

    instance = new boost();

    Boost = function () {
        return instance;
    };

    return instance;
}
