#!/bin/bash

# echo "(function ($) {" >> $outfiletemp;
# echo "    'use strict';" >> $outfiletemp;
# echo >> $outfiletemp;

for file in `cat jsSourceFiles.lst`
do
    cat src/$file
	echo
done
  
# echo >> $outfiletemp;
# echo "}(jQuery));" >> $outfiletemp;
