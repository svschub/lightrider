LIB=../../../js
SYMFONY_JS=../SymfonyBundle/Resources/public/js

all: $(SYMFONY_JS)/lightrider.min.js $(SYMFONY_JS)/lightrider.debug.js $(SYMFONY_JS)/Three.js $(SYMFONY_JS)/Detector.js

$(SYMFONY_JS)/lightrider.min.js: $(SYMFONY_JS)/lightrider.debug.js
	rm -f $(SYMFONY_JS)/lightrider.min.js
	java -jar $(LIB)/yuicompressor.jar $(SYMFONY_JS)/lightrider.debug.js -o $(SYMFONY_JS)/lightrider.min.js
#	java -jar $(LIB)/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js lightrider.debug.js ../THREE.js ../Detector.js --externs $(LIB)/jquery/jquery.externs.js --js_output_file ../lightrider.min.js

$(SYMFONY_JS)/lightrider.debug.js: Makefile src/*.js
	./concat.sh > lightrider.debug.js.temp
	./filterJs.pl lightrider.debug.js.temp > $(SYMFONY_JS)/lightrider.debug.js
	rm lightrider.debug.js.temp
#	./mergeWithLibs.sh lightrider.debug.js > lightrider.debug.js.temp
#	mv lightrider.debug.js.temp lightrider.debug.js

$(SYMFONY_JS)/Three.js: $(LIB)/three/build/three.min.js
	cp $(LIB)/three/build/three.min.js $(SYMFONY_JS)/Three.js

$(SYMFONY_JS)/Detector.js: $(LIB)/Detector.js
	cp $(LIB)/Detector.js $(SYMFONY_JS)


