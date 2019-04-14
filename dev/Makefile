BUILD_DIR=build

JS_TARGETS=$(BUILD_DIR)/js/lightrider.min.js $(BUILD_DIR)/js/lightrider.debug.js $(BUILD_DIR)/js/three.min.js $(BUILD_DIR)/js/Detector.js $(BUILD_DIR)/js/jquery.ui.touch-punch.js
DATA_TARGETS=$(BUILD_DIR)/scene/cockpit.min.x3d $(BUILD_DIR)/scene/world.min.x3d $(BUILD_DIR)/scene/mobileDevice.min.x3d $(BUILD_DIR)/textures/textures.min.xml $(BUILD_DIR)/shaders/covariantLambert.min.vs $(BUILD_DIR)/shaders/covariantLambert.min.fs $(BUILD_DIR)/shaders/covariantHorizon.min.vs $(BUILD_DIR)/shaders/dopplerMap.png

WEBSITE_RESOURCES=../website/html/src/LightriderBundle/Resources

JS_SOURCES= \
  src/AsyncLoader.js \
  src/BetaSlider.js \
  src/DopplerCheckbox.js \
  src/DopplerShiftTable.js \
  src/Boost.js \
  src/CovariantMaterial.js \
  src/Horizon.js \
  src/Observer.js \
  src/Cabin.js \
  src/World.js \
  src/FlightModel.js \
  src/Renderer.js \
  src/KeyHandler.js \
  src/OrientableDevice.js \
  src/Timer.js \
  src/SettingsBox.js \
  src/main.js


.PHONY: clean buildenv install website buildenv-image

all: $(JS_TARGETS) $(DATA_TARGETS)


$(BUILD_DIR)/js/lightrider.debug.js: $(JS_SOURCES)
	mkdir -p $(BUILD_DIR)/js
	./build.sh python scripts/merge_js.py $^ > $@

$(BUILD_DIR)/js/lightrider.min.js: $(BUILD_DIR)/js/lightrider.debug.js
	mkdir -p $(BUILD_DIR)/js
	./build.sh uglifyjs $< -o $@

$(BUILD_DIR)/js/three.min.js: lib/three.min.js
	mkdir -p $(BUILD_DIR)/js
	cp $< $@

$(BUILD_DIR)/js/Detector.js: lib/Detector.js
	mkdir -p $(BUILD_DIR)/js
	cp $< $@

$(BUILD_DIR)/js/jquery.ui.touch-punch.js: lib/jquery.ui.touch-punch.js
	mkdir -p $(BUILD_DIR)/js
	cp $< $@


$(BUILD_DIR)/scene/cockpit.min.x3d: $(BUILD_DIR)/scene/cockpit.x3d data/remove_indents.xslt
	mkdir -p $(BUILD_DIR)/scene
	./build.sh saxon -s:$< -xsl:data/remove_indents.xslt > $@.tmp
	./build.sh minify-xml $@.tmp > $@
	rm -f $@.tmp

$(BUILD_DIR)/scene/cockpit.x3d: data/blender/cockpit.blend.exported.x3d data/transform_cockpit.xslt
	mkdir -p $(BUILD_DIR)/scene
	./build.sh saxon -s:$< -xsl:data/transform_cockpit.xslt > $@


$(BUILD_DIR)/scene/world.min.x3d: $(BUILD_DIR)/scene/world.x3d data/remove_indents.xslt
	mkdir -p $(BUILD_DIR)/scene
	./build.sh saxon -s:$< -xsl:data/remove_indents.xslt > $@.tmp
	./build.sh minify-xml $@.tmp > $@
	rm -f $@.tmp

$(BUILD_DIR)/scene/world.x3d: data/blender/world.blend.exported.x3d data/transform_world.xslt
	mkdir -p $(BUILD_DIR)/scene
	./build.sh saxon -s:$< -xsl:data/transform_world.xslt > $@


$(BUILD_DIR)/scene/mobileDevice.min.x3d: data/mobileDevice.x3d data/remove_indents.xslt
	mkdir -p $(BUILD_DIR)/scene
	./build.sh saxon -s:$< -xsl:data/remove_indents.xslt > $@.tmp
	./build.sh minify-xml $@.tmp > $@
	rm -f $@.tmp


$(BUILD_DIR)/textures/textures.min.xml: data/textures.xml data/remove_indents.xslt
	mkdir -p $(BUILD_DIR)/textures
	./build.sh saxon -s:$< -xsl:data/remove_indents.xslt > $@.tmp
	./build.sh minify-xml $@.tmp > $@
	rm -f $@.tmp


$(BUILD_DIR)/shaders/covariantLambert.min.vs: data/covariantLambert.vs
	mkdir -p $(BUILD_DIR)/shaders
	./build.sh bash -c 'cat $< | glslmin > $@'

$(BUILD_DIR)/shaders/covariantLambert.min.fs: data/covariantLambert.fs
	mkdir -p $(BUILD_DIR)/shaders
	./build.sh bash -c 'cat $< | glslmin > $@'

$(BUILD_DIR)/shaders/covariantHorizon.min.vs: data/covariantHorizon.vs
	mkdir -p $(BUILD_DIR)/shaders
	./build.sh bash -c 'cat $< | glslmin > $@'

$(BUILD_DIR)/shaders/dopplerMap.png: data/rgb31.txt scripts/doppler_map.py
	mkdir -p $(BUILD_DIR)/shaders
	./build.sh python scripts/doppler_map.py --response-functions $< --doppler-map $@


clean:
	rm -r $(BUILD_DIR)

buildenv-image:
	build.sh --force true

install:
	cp -r $(BUILD_DIR)/js $(WEBSITE_RESOURCES)/public/
	cp -r $(BUILD_DIR)/scene $(WEBSITE_RESOURCES)/data/
	cp -r $(BUILD_DIR)/textures $(WEBSITE_RESOURCES)/data/
	cp -r $(BUILD_DIR)/shaders $(WEBSITE_RESOURCES)/data/

website: install
	cd ../website && docker-compose build
