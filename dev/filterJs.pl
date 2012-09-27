#!/usr/bin/perl


if (@ARGV > 0) {

    my $file;
    my $filename = $ARGV[0];

    open ($file, $filename) or die "can not open file: $filename";
    my $filesize = -s $filename;
    binmode($file);

    my ($data, $n);
    if (($n = read $file, $data, $filesize) != 0) {
        $data =~ s/\,([\s\t\r\n]*[\)\}\]])/\1\2/g;
#       $data =~ s/([A-Za-z][\w]*)[\s]*\=[\s]*function([\s]*\([\w\,]*\))/function \1\2/g;
        print "$data\n";
    }
    close($file);
}

