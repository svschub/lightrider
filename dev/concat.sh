#!/bin/bash

if [ "$1" != "" ]
then
   outfile=$1
else
   outfile="out.js"
fi

rm -f $outfile
touch $outfile

outfiletemp=$outfile.temp
rm -f $outfiletemp
touch $outfiletemp


# echo "(function ($) {" >> $outfiletemp;
# echo "    'use strict';" >> $outfiletemp;
# echo >> $outfiletemp;

for file in `cat jsSourceFiles.lst`
do
    cat src/$file >> $outfiletemp
	echo >> $outfiletemp
done
  
# echo >> $outfiletemp;
# echo "}(jQuery));" >> $outfiletemp;


mv $outfiletemp $outfile
