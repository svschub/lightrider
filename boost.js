
// transform from reference system to observer:

function getBoostedVertex(vertex, beta, gamma) {
    return new THREE.Vector3(vertex.x, vertex.y, gamma*vertex.z - gamma*beta*vertex.length());
};

function getBoostedAngle(angle, beta) {
	var boostedAngle = Math.atan(Math.sqrt(1-beta*beta)*Math.sin(angle)/(Math.cos(angle)+beta));
	if (boostedAngle <= 0) {
	    boostedAngle += Math.PI;
	}
	return boostedAngle;
};

