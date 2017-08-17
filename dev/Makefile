SYMFONY_JS=../website/html/src/LightriderBundle/Resources/public/js
SYMFONY_DATA=../website/html/src/LightriderBundle/Resources/data

JS_TARGETS=$(SYMFONY_JS)/lightrider.min.js $(SYMFONY_JS)/lightrider.debug.js $(SYMFONY_JS)/three.min.js $(SYMFONY_JS)/Detector.js $(SYMFONY_JS)/jquery.ui.touch-punch.js
DATA_TARGETS=$(SYMFONY_DATA)/scene/cockpit.x3d $(SYMFONY_DATA)/scene/world.x3d $(SYMFONY_DATA)/scene/mobileDevice.x3d $(SYMFONY_DATA)/textures/textures.xml $(SYMFONY_DATA)/shaders/covariantLambert.vs $(SYMFONY_DATA)/shaders/covariantLambert.fs $(SYMFONY_DATA)/shaders/covariantHorizon.vs $(SYMFONY_DATA)/shaders/dopplerMap.png


all: $(JS_TARGETS) $(DATA_TARGETS)

$(SYMFONY_JS)/lightrider.min.js: $(SYMFONY_JS)/lightrider.debug.js
	rm -f $@
	yuicompressor.sh $< -o $@

$(SYMFONY_JS)/lightrider.debug.js: Makefile jsSourceFiles.lst src/*.js
	concat.sh > /tmp/lightrider.debug.js
	filterJs.pl /tmp/lightrider.debug.js > $@
	rm /tmp/lightrider.debug.js.temp

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

$(SYMFONY_DATA)/shaders/dopplerMap.png: data/rgb31.txt
	scripts/dopper_map.py --response-functions $< --doppler-map $@
