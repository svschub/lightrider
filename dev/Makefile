LIB=../../../js

all: ../lightrider.min.js ../Three.js ../Detector.js

../lightrider.min.js: lightrider.debug.js
	rm -f ../lightrider.min.js
	java -jar $(LIB)/yuicompressor.jar lightrider.debug.js -o ../lightrider.min.js
#	java -jar $(LIB)/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js lightrider.debug.js --externs $(LIB)/jquery.externs.js --js_output_file ../lightrider.min.js

lightrider.debug.js: src/*.js
	./concat.sh > lightrider.debug.js.temp
	./filterJs.pl lightrider.debug.js.temp > lightrider.debug.js
	rm lightrider.debug.js.temp
#	./mergeWithLibs.sh lightrider.debug.js > lightrider.debug.js.temp
#	mv lightrider.debug.js.temp lightrider.debug.js

../Three.js: $(LIB)/three/Three.js
	cp $(LIB)/three/Three.js ..

../Detector.js: $(LIB)/webgl/Detector.js
	cp $(LIB)/webgl/Detector.js ..


