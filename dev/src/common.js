function loadAscii (objectName) {
    var asciiData;

    $.ajax({
        url: "/Lightrider/loadObject/",
        type: 'GET',
        data: {
            name: objectName
        },
        async: false,
        cache: false,
        timeout: 30000,
        error: function(){
            asciiData = "";
        },
        success: function (response) {
            asciiData = response;
        }
    });

    return asciiData;
}

function loadTexture (imageName) {
    var image = new Image(),
        texture = new THREE.Texture(image);

    image.onload = function () {
        texture.needsUpdate = true;
    };

	image.src = loadAscii(imageName);

    return texture;
}