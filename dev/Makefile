../lightrider.min.js: lightrider.debug.js
	rm -f ../lightrider.min.js
	java -jar ../../../js/yuicompressor.jar lightrider.debug.js -o ../lightrider.min.js

lightrider.debug.js: src/*.js
	./concat.sh > lightrider.debug.js.temp
	./filterJs.pl lightrider.debug.js.temp > lightrider.debug.js
	rm lightrider.debug.js.temp
#	./mergeWithLibs.sh lightrider.debug.js > lightrider.debug.js.temp
#	mv lightrider.debug.js.temp lightrider.debug.js


