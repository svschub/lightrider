function DopplerCheckbox(properties) {
    var self = this,

        isMobile = properties.isMobile,

        dopplerTitle = $("#dopplerTitle"),
        dopplerCheckboxImage = $("#doppler_checkbox_image"),
        dopplerShiftRescaleSlider = $('#dopplerShiftRescaleSlider'),
        dopplerShiftRescaleScrollbar = $('#doppler_shift_rescale_scrollbar'),
        sliderScrollbarTitle = $('#dopplerShiftRescaleSlider > span'),
        checkboxEnableDopplerEffect = $('#setDopplerEffect'),
        dopplerCheckboxImage = $('#doppler_checkbox_image'),
        sliderBoundaryTextLabels = $('#doppler_shift_rescale_scrollbar span'),
        sliderHandle,
        sliderHandleTextLabel,

        handleDopplerShiftRescaleSlider = properties.handleDopplerShiftRescaleSlider,
        enableDopplerEffectHandler = properties.enableDopplerEffectHandler,
        disableDopplerEffectHandler = properties.disableDopplerEffectHandler,

        widgetScaleRatio = properties.widgetScaleRatio || 1,

        isDopplerShiftRescaleScrollbarVisible = false,
        isDopplerShiftRescaleScrollbarOnFocus = false,

        counter = 0,
        lastUpdateCounter = 0,

        setDopplerShiftRescaleValue = function(value) {
            var percentValue = value*100;
            $("#dopplerShiftRescaleSlider > a > span").html(percentValue.toFixed(0) + '%');
        },

        bindDopplerCheckboxEvents = function () {
            if (checkboxEnableDopplerEffect.prop('checked')) {
                dopplerCheckboxImage.addClass('checked');
                dopplerCheckboxImage.removeClass('unchecked');
            } else {
                dopplerCheckboxImage.addClass('unchecked');
                dopplerCheckboxImage.removeClass('checked');
            }

            dopplerCheckboxImage.bind('click', function(event) {
                if (checkboxEnableDopplerEffect.prop('checked')) {
                    checkboxEnableDopplerEffect.prop('checked', false);
                    dopplerCheckboxImage.addClass('unchecked');
                    dopplerCheckboxImage.removeClass('checked');
                    disableDopplerEffectHandler();
                    self.hideDopplerShiftRescaleScrollbar();
                } else {
                    checkboxEnableDopplerEffect.prop('checked', true);
                    dopplerCheckboxImage.addClass('checked');
                    dopplerCheckboxImage.removeClass('unchecked');
                    enableDopplerEffectHandler();
                    self.showDopplerShiftRescaleScrollbar();
                }
            });

            if (!isMobile) {
                dopplerCheckboxImage.bind('mouseenter', function(event) {
                    isDopplerShiftRescaleScrollbarOnFocus = true;
                    if (checkboxEnableDopplerEffect.prop('checked')) {
                        self.showDopplerShiftRescaleScrollbar();
                    }
                });

                dopplerCheckboxImage.bind('mouseleave', function(event) {
                    isDopplerShiftRescaleScrollbarOnFocus = false;
                });
            }
        },
 
        init = function () {
            dopplerShiftRescaleSlider.slider({
                orientation: "horizontal",
                min: 0.0,
                max: 1.0,
                step: 0.01,
                value: 0.3,
                slide: function(e, ui) {
                    lastUpdateCounter = counter;
                    setDopplerShiftRescaleValue(ui.value);
                    handleDopplerShiftRescaleSlider(ui.value);
                }
            });
            $("#dopplerShiftRescaleSlider .ui-slider-handle").unbind("keydown");
            $("#dopplerShiftRescaleSlider > a").append('<span></span>');

            sliderHandle = $("#dopplerShiftRescaleSlider > a.ui-slider-handle");
            sliderHandleTextLabel = $('#dopplerShiftRescaleSlider > a > span');

            if (!isMobile) {
                dopplerShiftRescaleScrollbar.bind('mouseenter', function(event) {
                    isDopplerShiftRescaleScrollbarOnFocus = true;
                    if (isDopplerShiftRescaleScrollbarVisible) {
                        self.showDopplerShiftRescaleScrollbar(); 
                    }
                });

                dopplerShiftRescaleScrollbar.bind('mouseleave', function(event) {
                    isDopplerShiftRescaleScrollbarOnFocus = false;
                });
            }

            setDopplerShiftRescaleValue(0.3);

            bindDopplerCheckboxEvents();

            self.update();
        };
    

    self.setWidgetScaleRatio = function (ratio) {
        widgetScaleRatio = ratio;
    };

    self.getDopplerShiftRescaleValue = function () {
        return dopplerShiftRescaleSlider.slider("value");
    };

    self.showDopplerShiftRescaleScrollbar = function () {
        counter = 0;
        lastUpdateCounter = 0;

        if (!isDopplerShiftRescaleScrollbarVisible) {
            dopplerShiftRescaleScrollbar.fadeIn();
        }
        isDopplerShiftRescaleScrollbarVisible = true;
    };

    self.hideDopplerShiftRescaleScrollbar = function () {
        dopplerShiftRescaleScrollbar.fadeOut();
        isDopplerShiftRescaleScrollbarVisible = false;
    };

    self.hideDopplerShiftRescaleScrollbarIfNecessary = function () {
        if (isDopplerShiftRescaleScrollbarVisible && 
            !isDopplerShiftRescaleScrollbarOnFocus) {
            counter++;
        }

        if (counter - lastUpdateCounter > 50) {
            self.hideDopplerShiftRescaleScrollbar();
        }
    };

    self.update = function () {
        var fontSize = widgetScaleRatio * 14,
            dopplerCheckboxImageSize = widgetScaleRatio * 28,
            sliderWidth = widgetScaleRatio * 150,
            sliderHeight = widgetScaleRatio * 9,
            sliderMarginTop = 0.5*(dopplerCheckboxImageSize - sliderHeight),
            sliderHandleHeight = 3.5*sliderHeight,
            sliderHandleTop = -0.8*sliderHeight,
            sliderHandleTextLabelTop = 0.8*sliderHandleHeight,
            sliderLabelMarginTop = Math.max(0, 0.5*(dopplerCheckboxImageSize - fontSize)),
            sliderScrollbarTitleTop = -3.7*sliderHeight;

        dopplerTitle.css("font-size", fontSize.toFixed(0) + "px");

        sliderBoundaryTextLabels.css("font-size", fontSize.toFixed(0) + "px");
        sliderBoundaryTextLabels.css("margin-top", sliderLabelMarginTop.toFixed(0) + "px");

        dopplerCheckboxImage.css("width", dopplerCheckboxImageSize.toFixed(0) + "px");
        dopplerCheckboxImage.css("height", dopplerCheckboxImageSize.toFixed(0) + "px");

        dopplerShiftRescaleSlider.css("width", sliderWidth.toFixed(0) + "px");
        dopplerShiftRescaleSlider.css("height", sliderHeight.toFixed(0) + "px");
        dopplerShiftRescaleSlider.css("margin-top", sliderMarginTop.toFixed(0) + "px");
        
        sliderScrollbarTitle.css("top", sliderScrollbarTitleTop.toFixed(0) + "px");

        sliderHandle.css("height", sliderHandleHeight.toFixed(0) + "px");
        sliderHandle.css("top", sliderHandleTop.toFixed(0) + "px");

        sliderHandleTextLabel.css("font-size", fontSize.toFixed(0) + "px");
        sliderHandleTextLabel.css("top", sliderHandleTextLabelTop.toFixed(0) + "px");
    };

    init();
}
