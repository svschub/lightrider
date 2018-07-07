function AsyncLoader () {
};

AsyncLoader.cache = {};

AsyncLoader.get = function(objectPath) {
    var deferred = new $.Deferred();

    if (objectPath && AsyncLoader.cache[objectPath]) {
        deferred.resolve(AsyncLoader.cache[objectPath]);
    } else {
        $.ajax({
            url: "/Objects/" + objectPath,
            type: 'GET',
            data: {},
            success: function(response) {
                AsyncLoader.cache[objectPath] = response;
                deferred.resolve(response);
            },
            error: function(response) {
                deferred.reject(response);
            }
        });
    }

    return deferred.promise();
};
