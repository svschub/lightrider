#!/usr/bin/env python

import sys
import re

if __name__ == "__main__":

    print("(function ($) {")
    print("    'use strict';\n");

    regex = re.compile(r"\,([\s\t\r\n]*[\)\}\]])", re.MULTILINE)
    for arg in sys.argv[1:]:
        src_file = arg

        with open(src_file, 'r') as f:
            src = f.read()
            print("%s" % (regex.sub(r"\1", src),))

    print("\n}(jQuery));");
