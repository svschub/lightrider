function SettingsBox(properties) {
    var self = this,

        deferred,

        isMobileDevice = properties.isMobileDevice,
        openHandler = properties.openHandler,
        closeHandler = properties.closeHandler,
        orientableDevice = properties.orientableDevice,

        is_open = false,
        is_centering_mobile_device = false,

        mobileDeviceRenderer = null,
        mobileDeviceRenderContainer,
        mobileDeviceRenderCanvas,
        mobileDeviceScene, 
        mobileDeviceWorld,
        camera,


        centerMobileDevice = function () {
            mobileDeviceRenderer.render(mobileDeviceScene, camera);

            if (is_centering_mobile_device) {
                requestAnimationFrame(centerMobileDevice);
            }
        },

        loadSettingsBox = function () {
            return $.ajax({
                url: '/Settings',
                type: 'GET',
                data: {
                    is_mobile: isMobileDevice ? 1 : 0
                }
            });
        },

        initMobileDeviceRenderer = function () {
            var rendererDeferred = new $.Deferred(),
                sceneLoader = new X3d.SceneLoader();

            if (isMobileDevice) {
                sceneLoader.loadSceneFromX3d('/Objects/Scene/mobileDevice.x3d');
                $.when(sceneLoader.getPromise()).then(function () {
                    mobileDeviceScene = sceneLoader.getScene();
                    camera = sceneLoader.getCamera();

                    mobileDeviceWorld = sceneLoader.getNode('world_TRANSFORM');

                    try {
                        mobileDeviceRenderContainer = $('#mobileDeviceRenderer');

                        mobileDeviceRenderer = new THREE.WebGLRenderer();
                        mobileDeviceRenderer.setClearColor(0xCCCCCC, 1);
                        mobileDeviceRenderCanvas = mobileDeviceRenderer.domElement;
                        mobileDeviceRenderContainer.append(mobileDeviceRenderCanvas);

                        self.updateViewport();
                    } catch(e) {
                        rendererDeferred.reject(e);
                    }

                    rendererDeferred.resolve();
                }).fail(function(error) {
                    rendererDeferred.reject(error);
                });
            } else {
                rendererDeferred.resolve();
            }

            return rendererDeferred.promise();
        },

        init = function () {
            deferred = new $.Deferred();

            $.when(loadSettingsBox()).then(function(loadedSettingsBoxResponse) {
                $("#settings_content").html(loadedSettingsBoxResponse);

                $("#open_settings_box_button").bind("click", function(event) {
                    event.preventDefault();

                    self.open();
                });

                $("#center_mobile_device_button").bind("click", function(event) {
                    event.preventDefault();

                    $("#how_to_fly_instructions").addClass("hidden");
                    $("#center_mobile_device").removeClass("hidden");

                    if (orientableDevice) {
                        is_centering_mobile_device = true;
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

                return initMobileDeviceRenderer();
            }).then(function () {
                if (isMobileDevice && orientableDevice) {
                    orientableDevice.addUpdateOrientationAnglesHandler(function(angles) {
                        var takeOffButton,
                            rollAction, rollAxis,
                            pitchAction, pitchAxis,
                            yawAction, yawAxis;

                        if (true || is_centering_mobile_device) {
                            takeOffButton = $('#take_off_button');

                            rollAction = new THREE.Quaternion();
                            rollAxis = new THREE.Vector3(0, 1, 0);
                            pitchAction = new THREE.Quaternion();
                            pitchAxis = new THREE.Vector3(0, 0, -1);
                            yawAction = new THREE.Quaternion();
                            yawAxis = new THREE.Vector3(1, 0, 0);

                            rollAxis.normalize();
                            rollAction.setFromAxisAngle(rollAxis, angles.rollAngleRaw);
                            yawAxis.applyQuaternion(rollAction);
                            pitchAxis.applyQuaternion(rollAction);

                            pitchAxis.normalize();
                            pitchAction.setFromAxisAngle(pitchAxis, angles.pitchAngleRaw);
                            yawAxis.applyQuaternion(pitchAction);
                            rollAxis.applyQuaternion(pitchAction);

                            mobileDeviceWorld.lookAt(rollAxis);
                            mobileDeviceWorld.up = yawAxis;
                            mobileDeviceWorld.updateMatrix();
      
                            if (orientableDevice.isPanoramaView() &&
                                angles.pitchAngleRaw < -0.125*Math.PI && 
                                angles.pitchAngleRaw > -0.25*Math.PI &&
                                Math.abs(angles.rollAngleRaw) < 0.05*Math.PI) {
                                mobileDeviceRenderContainer.removeClass('warning');
                                takeOffButton.removeClass('warning');
                            } else {
                                mobileDeviceRenderContainer.addClass('warning');
                                takeOffButton.addClass('warning');
                            }
                        }
                    });
                }

                deferred.resolve();
            }).fail(function(error) {
                deferred.reject(error);
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

    self.updateViewport = function () {
        var rendererWidth, rendererHeight;

        if (isMobileDevice && mobileDeviceRenderer) {
            rendererWidth = 0.24*$(window).width();
            rendererHeight = 0.625*rendererWidth;

            mobileDeviceRenderContainer.css('width', rendererWidth + 'px');
            mobileDeviceRenderer.setSize(rendererWidth, rendererHeight);
        }
    };

    self.getPromise = function () {
        return deferred.promise();
    };

    self.isOpen = function () {
        return is_open;
    };

    init();     
}