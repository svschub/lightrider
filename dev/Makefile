
../lightrider.min.js: lightrider.debug.js
	rm -f ../lightrider.min.js
	java -jar ../../../js/yuicompressor.jar lightrider.debug.js -o ../lightrider.min.js

lightrider.debug.js: 
	./concat.sh lightrider.debug.js
