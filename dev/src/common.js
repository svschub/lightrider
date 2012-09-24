
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
    THREE.SceneUtils.traverseHierarchy(object3d, function (child) {
        child.visible = visible;
    });
}
