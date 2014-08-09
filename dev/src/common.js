function loadObject(objectName) {
    var asciiData;

    $.ajax({
        url: "/Lightrider/Objects/" + objectName,
        type: 'GET',
        data: {},
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
