
function readFile(fileName) {  
    var shaderSource;
		
    $.ajax({
        url: "getFileContent.php",
        type: 'POST',
        data: {
		    filename: fileName
	    },
        async: false,
        cache: false,
        timeout: 30000,
        error: function(){
            deleteShader(shader);
            shaderSource = "";
        },
        success: function(response){
		    shaderSource = response;
        }
    });

	return shaderSource;
}

function setVisibility (object3d, visible) {
    if (object3d instanceof THREE.Object3D) {
        object3d.visible = visible;

	    if (object3d.children === undefined) {
	        return;
	    }

		for (var i=0; i < object3d.children.length; i++) {
			setVisibility(object3d.children[i], visible);
		}
	}
}

function setObjectProperties (object3d, properties) {
    if (object3d instanceof THREE.Object3D) {
        for (property in properties) {
		    object3d[property] = properties[property];
		}

	    if (object3d.children === undefined) {
	        return;
	    }

		for (var i=0; i < object3d.children.length; i++) {
			setObjectProperties(object3d.children[i], properties);
		}
	}
}
