SYMFONY_JS=../website/html/src/LightriderBundle/Resources/public/js
SYMFONY_DATA=../website/html/src/LightriderBundle/Resources/data

JS_TARGETS=$(SYMFONY_JS)/lightrider.min.js $(SYMFONY_JS)/lightrider.debug.js $(SYMFONY_JS)/three.min.js $(SYMFONY_JS)/Detector.js $(SYMFONY_JS)/jquery.ui.touch-punch.js
DATA_TARGETS=$(SYMFONY_DATA)/scene/cockpit.x3d $(SYMFONY_DATA)/scene/world.x3d $(SYMFONY_DATA)/scene/mobileDevice.x3d $(SYMFONY_DATA)/textures/textures.xml $(SYMFONY_DATA)/shaders/covariantLambert.vs $(SYMFONY_DATA)/shaders/covariantLambert.fs $(SYMFONY_DATA)/shaders/covariantHorizon.vs

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

all: $(JS_TARGETS) $(DATA_TARGETS)

$(SYMFONY_JS)/lightrider.min.js: $(SYMFONY_JS)/lightrider.debug.js
	rm -f $@
	yuicompressor.sh $< -o $@

$(SYMFONY_JS)/lightrider.debug.js: $(JS_SOURCES)
	scripts/merge_js.py $^ > $@

$(SYMFONY_JS)/three.min.js: lib/three.min.js
	cp $< $@

$(SYMFONY_JS)/Detector.js: lib/Detector.js
	cp $< $@

$(SYMFONY_JS)/jquery.ui.touch-punch.js: lib/jquery.ui.touch-punch.js
	cp $< $@


$(SYMFONY_DATA)/scene/cockpit.x3d: data/cockpit.x3d
	htmlcompressor.sh $< > $@

$(SYMFONY_DATA)/scene/world.x3d: data/world.x3d
	htmlcompressor.sh $< > $@

$(SYMFONY_DATA)/scene/mobileDevice.x3d: data/mobileDevice.x3d
	htmlcompressor.sh $< > $@

$(SYMFONY_DATA)/textures/textures.xml: data/textures.xml
	htmlcompressor.sh $< > $@


$(SYMFONY_DATA)/shaders/covariantLambert.vs: data/covariantLambert.vs
	cat $< > $@

$(SYMFONY_DATA)/shaders/covariantLambert.fs: data/covariantLambert.fs
	cat $< > $@

$(SYMFONY_DATA)/shaders/covariantHorizon.vs: data/covariantHorizon.vs
	cat $< > $@
