function DopplerCheckbox(properties) {
    var self = this,

        dopplerTitle = $("#dopplerTitle"),
        dopplerCheckboxImage = $("#doppler_checkbox_image"),
        dopplerShiftRescaleSlider = $('#dopplerShiftRescaleSlider'),
        dopplerShiftRescaleScrollbar = $('#doppler_shift_rescale_scrollbar'),
        checkboxEnableDopplerEffect = $('#setDopplerEffect'),
        dopplerCheckboxImage = $('#doppler_checkbox_image'),

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

            dopplerCheckboxImage.bind('mouseenter', function(event) {
                isDopplerShiftRescaleScrollbarOnFocus = true;
                if (checkboxEnableDopplerEffect.prop('checked')) {
                    self.showDopplerShiftRescaleScrollbar();
                }
            });

            dopplerCheckboxImage.bind('mouseleave', function(event) {
                isDopplerShiftRescaleScrollbarOnFocus = false;
            });
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

            dopplerShiftRescaleScrollbar.bind('mouseenter', function(event) {
                isDopplerShiftRescaleScrollbarOnFocus = true;
                if (isDopplerShiftRescaleScrollbarVisible) {
                    self.showDopplerShiftRescaleScrollbar(); 
                }
            });

            dopplerShiftRescaleScrollbar.bind('mouseleave', function(event) {
                isDopplerShiftRescaleScrollbarOnFocus = false;
            });

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

        if (counter - lastUpdateCounter > 60) {
            self.hideDopplerShiftRescaleScrollbar();
        }
    };

    self.update = function () {
        var dopperTitleSize = widgetScaleRatio * 14,
            dopplerCheckboxImageSize = widgetScaleRatio * 28;

        dopplerTitle.css("font-size", dopperTitleSize.toFixed(0) + "px");

        dopplerCheckboxImage.css("width", dopplerCheckboxImageSize.toFixed(0) + "px");
        dopplerCheckboxImage.css("height", dopplerCheckboxImageSize.toFixed(0) + "px");
    };

    init();
}
