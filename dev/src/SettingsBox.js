function SettingsBox(properties) {
    var self = this,

        deferred,

        isMobileDevice = properties.isMobileDevice,
        openHandler = properties.openHandler,
        closeHandler = properties.closeHandler,
        orientableDevice = properties.orientableDevice,

        init = function () {
            deferred = new $.Deferred();

            $.ajax({
                url: '/Lightrider/Settings',
                type: 'GET',
                data: {
                    is_mobile: isMobileDevice ? 1 : 0
                },
                success: function(response) {
                    $("#settings_box").html(response);

                    $("#open_settings_box_button").bind("click", function(event) {
                        event.preventDefault();

                        self.open();
                    });

                    $("#center_mobile_device_button").bind("click", function(event) {
                        event.preventDefault();

                        $("#how_to_fly_instructions").addClass("hidden");
                        $("#center_mobile_device").removeClass("hidden");
                    });

                    $("#take_off_button").bind("click", function(event) {
                        event.preventDefault();

                        if (orientableDevice) {
                            if (orientableDevice.isPanoramaView()) {
                                orientableDevice.registerPitchAngle0();
                                self.close(); 
                            }
                        } else {
                            self.close(); 
                        }
                    });

                    deferred.resolve(response);
                },
                error: function(response) {
                    deferred.reject(response);
                }
            });
        };
        
    self.open = function () {
        openHandler();

        $("#how_to_fly_instructions").removeClass("hidden");
        $("#center_mobile_device").addClass("hidden");

        $("#settings_box").css("display", "block");
        $("#settings_box_background").css("display", "block");
    };
        
    self.close = function () {
        $("#settings_box").css("display", "none");
        $("#settings_box_background").css("display", "none");

        closeHandler();
    };

    self.getPromise = function () {
        return deferred.promise();
    };

    init();     
}