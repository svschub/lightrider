function SettingsBox(properties) {
    var self = this,

        deferred,

        isMobileDevice = properties.isMobileDevice,
        openHandler = properties.openHandler,
        closeHandler = properties.closeHandler,
        orientableDevice = properties.orientableDevice,

        is_open = false,
        is_centering_mobile_device = false,

        centerMobileDevice = function () {
            is_centering_mobile_device = true;
        },

        init = function () {
            deferred = new $.Deferred();

            $.ajax({
                url: '/Lightrider/Settings',
                type: 'GET',
                data: {
                    is_mobile: isMobileDevice ? 1 : 0
                },
                success: function(response) {
                    $("#settings_content").html(response);

                    $("#open_settings_box_button").bind("click", function(event) {
                        event.preventDefault();

                        self.open();
                    });

                    $("#center_mobile_device_button").bind("click", function(event) {
                        event.preventDefault();

                        $("#how_to_fly_instructions").addClass("hidden");
                        $("#center_mobile_device").removeClass("hidden");

                        if (orientableDevice) {
                            centerMobileDevice();
                        }
                    });

                    $("#take_off_button").bind("click", function(event) {
                        event.preventDefault();

                        if (orientableDevice) {
                            orientableDevice.registerPitchAngle0();
                            is_centering_mobile_device = false;
                            self.close(); 
                        } else {
                            self.close(); 
                        }
                    });

                    if (orientableDevice) {
                        orientableDevice.addUpdateOrientationAnglesHandler(function(angles) {
                            var img = $('#panoramaView img'),
                                takeOffButton = $('#take_off_button');
         
                            if (is_centering_mobile_device) {
                                if (orientableDevice.isPanoramaView() &&
                                    angles.pitchAngleRaw < -0.125*Math.PI && 
                                    angles.pitchAngleRaw > -0.25*Math.PI &&
                                    Math.abs(angles.rollAngleRaw) < 0.05*Math.PI) {
                                    img.removeClass('warning');
                                    takeOffButton.removeClass('warning');
                                } else {
                                    img.addClass('warning');
                                    takeOffButton.addClass('warning');
                                }
                            }
                        });
                    }

                    deferred.resolve(response);
                },
                error: function(response) {
                    deferred.reject(response);
                }
            });
        };
        
    self.open = function () {
        is_open = true;

        openHandler();

        $("#how_to_fly_instructions").removeClass("hidden");
        $("#center_mobile_device").addClass("hidden");

        $("#settings_content").fadeIn();
    };
        
    self.close = function () {
        $("#settings_content").fadeOut();

        closeHandler();
        
        is_open = false;
    };

    self.getPromise = function () {
        return deferred.promise();
    };

    self.isOpen = function () {
        return is_open;
    };

    init();     
}