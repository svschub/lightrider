LIB=lib
SYMFONY_JS=../SymfonyBundle/Resources/public/js
SYMFONY_DATA=../SymfonyBundle/Resources/data

JS_TARGETS=$(SYMFONY_JS)/lightrider.min.js $(SYMFONY_JS)/lightrider.debug.js $(SYMFONY_JS)/three.min.js $(SYMFONY_JS)/Detector.js $(SYMFONY_JS)/jquery.ui.touch-punch.js
DATA_TARGETS=$(SYMFONY_DATA)/scene/cockpit.x3d $(SYMFONY_DATA)/scene/world.x3d $(SYMFONY_DATA)/scene/mobileDevice.x3d $(SYMFONY_DATA)/textures/textures.xml $(SYMFONY_DATA)/shaders/covariantLambert.vs $(SYMFONY_DATA)/shaders/covariantLambert.fs $(SYMFONY_DATA)/shaders/covariantHorizon.vs


all: $(JS_TARGETS) $(DATA_TARGETS)

$(SYMFONY_JS)/lightrider.min.js: $(SYMFONY_JS)/lightrider.debug.js
	rm -f $@
	yuicompressor.sh $< -o $@

$(SYMFONY_JS)/lightrider.debug.js: Makefile src/*.js
	./concat.sh > lightrider.debug.js.temp
	./filterJs.pl lightrider.debug.js.temp > $@
	rm lightrider.debug.js.temp

$(SYMFONY_JS)/three.min.js: $(LIB)/three/build/three.min.js
	cp $< $@

$(SYMFONY_JS)/Detector.js: $(LIB)/Detector.js
	cp $< $@

$(SYMFONY_JS)/jquery.ui.touch-punch.js: $(LIB)/jquery/ui/jquery.ui.touch-punch.js
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

