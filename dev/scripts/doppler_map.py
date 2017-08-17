#!/usr/bin/env python

import sys
import os.path
import csv
import math
import numpy as np
import pylab as pl
from scipy import linalg
from PIL import Image
from optparse import OptionParser


def save_dist(filename, dist):    
    n_ext = len(dist[0])
    dist_saved = np.zeros(shape=(n_ext,2))
    dist_saved[:,0] = dist[0]
    dist_saved[:,1] = dist[1]
    np.savetxt(filename, dist_saved) 


def get_extended_distribution(dist, shift):
    x = dist[0]
    y = dist[1]
    n = len(x)

    x_shifted = x*shift
    dist_extended = np.zeros(shape=(2,2*n))

    j = 0
    k = 0
    while j < n and x_shifted[j] < x[0]:
        dist_extended[0, k] = x_shifted[j]
        dist_extended[1, k] = 0.0
        j = j + 1
        k = k + 1

    dist_extended[0, k] = x[0]
    dist_extended[1, k] = y[0]
    k = k + 1

    i = 1
    while i < n:
        while j < n and x_shifted[j] < x[i]:
            delta = (x_shifted[j] - x[i-1])/(x[i] - x[i-1])

            dist_extended[0, k] = x_shifted[j]
            dist_extended[1, k] = (1-delta)*y[i-1] + delta*y[i];

            j = j + 1
            k = k + 1

        if j >= n or x_shifted[j] > x[i]:
            dist_extended[0, k] = x[i]
            dist_extended[1, k] = y[i]
            k = k + 1

        i = i + 1

    while j < n:
        dist_extended[0, k] = x_shifted[j]
        dist_extended[1, k] = 0.0
        j = j + 1
        k = k + 1

    return dist_extended[:,0:k]


def integrate(response_dist, dist):
    wavelength = response_dist[0]
    n = len(wavelength)

    ret = 0.0
    i = 1
    while i < n:
        ret = ret + response_dist[1, i] * dist[1, i] * (wavelength[i] - wavelength[i-1])
        i = i + 1

    return ret


def get_shifted(wavelengths, responses, dist, shift, verbose=False, output_dir=''):
    n = len(wavelengths)

    dist_shifted = np.zeros(shape=(2,n))
    dist_shifted[0] = wavelengths*shift
    dist_shifted[1] = dist
    dist_ext = get_extended_distribution(dist_shifted, 1/shift) 
    if verbose:
        save_dist(os.path.join(output_dir, 'test_ext_dist.lst'), dist_ext)

    response_dist = np.zeros(shape=(2,n))
    response_dist[0] = wavelengths

    response_dist[1] = responses[0]
    response_dist_ext = get_extended_distribution(response_dist, shift)
    r = integrate(response_dist_ext, dist_ext)
    if verbose:
        save_dist(os.path.join(output_dir, 'test_ext_r.lst'), response_dist_ext)

    response_dist[1] = responses[1]
    response_dist_ext = get_extended_distribution(response_dist, shift)
    g = integrate(response_dist_ext, dist_ext)
    if verbose:
        save_dist(os.path.join(output_dir, 'test_ext_g.lst'), response_dist_ext)

    response_dist[1] = responses[2]
    response_dist_ext = get_extended_distribution(response_dist, shift)
    b = integrate(response_dist_ext, dist_ext)
    if verbose:
        save_dist(os.path.join(output_dir, 'test_ext_b.lst'), response_dist_ext)

    return r, g, b


def rescale(value, minval, maxval):
    rescaled_value = 255 * (value - minval) / (maxval - minval)
    
    if rescaled_value < 0:
        rescaled_value = 0
    if rescaled_value > 255:
        rescaled_value = 255
    
    return math.floor(rescaled_value)


if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-r", "--response-functions", dest="response_functions_filename", help="response functions", metavar="FILE")
    parser.add_option("-d", "--doppler-map", dest="doppler_map_filename", help="Doppler map", metavar="FILE")
    parser.add_option("-v", "--verbose", action="store_true", dest="verbose", default=False, help="print distributions to files")

    (options, args) = parser.parse_args()

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    if options.response_functions_filename is None or len(options.response_functions_filename) == 0:
        parser.error("File with respone functions is missing, use --response-functions")

    if options.doppler_map_filename is None or len(options.doppler_map_filename) == 0:
        parser.error("Filename for the generated Doppler map is missing, use --doppler_map")

    output_dir = os.path.dirname(os.path.abspath(options.doppler_map_filename))
    print("writing output to %s" % (output_dir,))

    data = np.loadtxt(options.response_functions_filename);    
    dlambda = 5
    wavelengths = data[:,0]
    responses = data[:,1:4].T
    data_size = len(wavelengths)

    mat = dlambda*responses.dot(responses.T)
    invmat = linalg.inv(mat)
    print "inverse RGB response matrix:\n", invmat

    pl.close("all")

    distributions = invmat.dot(responses)

    pl.figure(figsize=(8, 6), dpi=80)
    pl.plot(wavelengths, distributions[0], color="red", linewidth=1.0, linestyle="-", label="red")
    pl.plot(wavelengths, distributions[1], color="green", linewidth=1.0, linestyle="-", label="green")
    pl.plot(wavelengths, distributions[2], color="blue", linewidth=1.0, linestyle="-", label="blue")
    pl.title('RGB Base Distributions')
    pl.xlabel('Wavelength [nm]')
    pl.ylabel('Base Distribution')
    pl.legend(loc='upper right')

    if options.verbose:
        pl.savefig(os.path.join(output_dir, 'rgb_base_distributions.png'))

    dist = np.zeros(shape=(len(wavelengths),4))
    dist[:,0] = wavelengths
    dist[:,1] = distributions[0]
    dist[:,2] = distributions[1]
    dist[:,3] = distributions[2]

    if options.verbose:
        np.savetxt(os.path.join(output_dir, 'rgb_base_distributions.lst'), dist)

    n = 512
    lambda_min = 380.0
    lambda_max = 780.0
    shift_min = lambda_min / lambda_max
    shift_max = lambda_max / lambda_min

    shifts = np.zeros(shape=(n))
    shifted_dist = np.zeros(shape=(3,n,3))

    i = 0
    while (i < n):
        shifts[i] = shift_min + i * (shift_max - shift_min) / (n - 1)
        i = i + 1

    rgb_names = ["r", "g", "b"]
    rgb_index = 0
    while rgb_index < 3:
        print "calculating RGB shifts for", rgb_names[rgb_index], "..." 
 
        i = 0
        while (i < n):
            r, g, b = get_shifted(wavelengths, responses, distributions[rgb_index], shifts[i], verbose=options.verbose, output_dir=output_dir)
     
            shifted_dist[rgb_index, i,0] = r
            shifted_dist[rgb_index, i,1] = g
            shifted_dist[rgb_index, i,2] = b
             
            i = i + 1
 
        pl.figure(figsize=(8, 6), dpi=80)
        pl.plot(shifts, shifted_dist[rgb_index, :,0], color="red", linewidth=1.0, linestyle="-", label="red")
        pl.plot(shifts, shifted_dist[rgb_index, :,1], color="green", linewidth=1.0, linestyle="-", label="green")
        pl.plot(shifts, shifted_dist[rgb_index, :,2], color="blue", linewidth=1.0, linestyle="-", label="blue")
        pl.title('Shifted RGB values due to wavelength shift')
        pl.xlabel('wavelength shift')
        pl.ylabel('shifted RGB values')
        pl.legend(loc='upper right')

        if options.verbose:
            pl.savefig(os.path.join(output_dir, "shifted_%s.png" % (rgb_names[rgb_index],)))
        
        saved_xy = np.zeros(shape=(n,4))
        saved_xy[:,0] = shifts   
        saved_xy[:,1] = shifted_dist[rgb_index, :,0]   
        saved_xy[:,2] = shifted_dist[rgb_index, :,1]   
        saved_xy[:,3] = shifted_dist[rgb_index, :,2]   

        if options.verbose:
            np.savetxt(os.path.join(output_dir, "shifted_%s.lst" % (rgb_names[rgb_index],)), saved_xy)

        rgb_index = rgb_index + 1
 
 
    shifted_dist_transposed = np.transpose(shifted_dist)
    minmax = shifted_dist_transposed.reshape((3,3*n))
    rgbminmax = zip(np.amin(minmax, axis=1), np.amax(minmax, axis=1)) 
    r_min, r_max = rgbminmax[0]
    g_min, g_max = rgbminmax[1]
    b_min, b_max = rgbminmax[2]
 
    print "r between", (r_min, r_max), "range:", r_max - r_min    
    print "g between", (g_min, g_max), "range:", g_max - g_min     
    print "b between", (b_min, b_max), "range:", b_max - b_min     
 
    with open(os.path.join(output_dir, 'rgb_minmax.csv'), 'wb') as csvfile:
        rgb_channels_minmax = [
            ['r', r_min, r_max, r_max - r_min],
            ['g', g_min, g_max, g_max - g_min],
            ['b', b_min, b_max, b_max - b_min],
        ]

        minmaxwriter = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)
        minmaxwriter.writerow(['channel', 'min', 'max', 'range'])
        for channel_minmax in rgb_channels_minmax:
            minmaxwriter.writerow(channel_minmax)

 
    width = n
    unit_height = 16
 
    data = np.zeros((unit_height*3,width,3), dtype=np.uint8)
    rgb_index = 0
    while rgb_index < 3:
        saved_xy = np.zeros(shape=(n,3), dtype=np.uint8)

        x = 0
        while x < width:
            data[unit_height*rgb_index:unit_height*(rgb_index+1)-1,x] = [
                int(rescale(shifted_dist[rgb_index, x,0], r_min, r_max)),
                int(rescale(shifted_dist[rgb_index, x,1], g_min, g_max)),
                int(rescale(shifted_dist[rgb_index, x,2], b_min, b_max))
            ]
            saved_xy[x,0] = int(rescale(shifted_dist[rgb_index, x,0], r_min, r_max))   
            saved_xy[x,1] = int(rescale(shifted_dist[rgb_index, x,1], g_min, g_max))  
            saved_xy[x,2] = int(rescale(shifted_dist[rgb_index, x,2], b_min, b_max))
            x = x + 1
            
        if options.verbose:
            np.savetxt(os.path.join(output_dir, "test_img_%s.lst" % (rgb_names[rgb_index],)), saved_xy)
 
        rgb_index = rgb_index + 1
 
    img = Image.fromarray(data, 'RGB')
    img.save(options.doppler_map_filename)
