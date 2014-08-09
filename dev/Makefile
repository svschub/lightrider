LIB=lib
SYMFONY_JS=../SymfonyBundle/Resources/public/js

all: $(SYMFONY_JS)/lightrider.min.js $(SYMFONY_JS)/lightrider.debug.js $(SYMFONY_JS)/Three.js $(SYMFONY_JS)/Detector.js $(SYMFONY_JS)/jquery.ui.touch-punch.js

$(SYMFONY_JS)/lightrider.min.js: $(SYMFONY_JS)/lightrider.debug.js
	rm -f $(SYMFONY_JS)/lightrider.min.js
	yuicompressor.sh $(SYMFONY_JS)/lightrider.debug.js -o $@

$(SYMFONY_JS)/lightrider.debug.js: Makefile src/*.js
	./concat.sh > lightrider.debug.js.temp
	./filterJs.pl lightrider.debug.js.temp > $@
	rm lightrider.debug.js.temp

$(SYMFONY_JS)/Three.js: $(LIB)/three/build/three.min.js
	cp $(LIB)/three/build/three.min.js $(SYMFONY_JS)/Three.js

$(SYMFONY_JS)/Detector.js: $(LIB)/Detector.js
	cp $(LIB)/Detector.js $(SYMFONY_JS)

$(SYMFONY_JS)/jquery.ui.touch-punch.js: $(LIB)/jquery/ui/jquery.ui.touch-punch.js
	cp $(LIB)/jquery/ui/jquery.ui.touch-punch.js $(SYMFONY_JS)


