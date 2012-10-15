#!/bin/bash

echo "(function ($) {";
echo "    'use strict';";
echo;

for file in `cat jsSourceFiles.lst`
do
    cat src/$file
	echo
done
  
echo;
echo "}(jQuery));";
