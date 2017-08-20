import sys
import os.path
import math
import numpy as np
import pylab as pl
from pylab import arange, exp, randn, convolve
from PIL import Image
from optparse import OptionParser


def blackbody(wavelength, temperature):
    # wavelength [nm]
    # temperature [K]

    c = 299792458.0         # speed of light [m/s]
    k = 1.3806488e-23       # Boltzmann constant [J/K]
    h = 6.62606957e-34      # Planck constant [J*s]

    wl = 1.0e-9*wavelength  # [m]
    return 2*h*c*c/(wl*wl*wl*wl*wl) * 1.0/(math.exp(h*c/(wl*k*temperature))-1.0)


def get_integrated_channel_value(wavelengths, response, temperature):
    # wavelengths: array of wavelengths [nm]
    # response: response function of the given color channel
    # temperature [K]

    n = len(wavelengths)

    ret = 0.0
    i = 1
    while i < n:
        mean_wavelength = 0.5 * (wavelengths[i] + wavelengths[i-1])
        ret = ret + response[i] * blackbody(mean_wavelength, temperature) * (wavelengths[i] - wavelengths[i-1])
        i = i + 1

    return ret


def get_rgb(wavelengths, responses, temperature):
    # wavelengths: array of wavelengths [nm]
    # responses: RGB response functions
    # temperature [K]

    r = get_integrated_channel_value(wavelengths, responses[0], temperature)
    g = get_integrated_channel_value(wavelengths, responses[1], temperature)
    b = get_integrated_channel_value(wavelengths, responses[2], temperature)

    return r, g, b


if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-r", "--response-functions", dest="response_functions_filename", help="response functions", metavar="FILE")
    parser.add_option("-o", "--output-dir", dest="output_dir", help="output directory", metavar="DIRECTORY")

    (options, args) = parser.parse_args()

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    if options.response_functions_filename is None or len(options.response_functions_filename) == 0:
        parser.error("File with respone functions is missing, use --response-functions")

    if options.output_dir is not None:
        output_dir = options.output_dir
    else:
        output_dir = os.getcwd()

    print("writing files to folder %s" % (output_dir,))

    pl.close("all")

    wavelengths = np.linspace(10.0, 3000.0, 100)
    blackbody_at_T3000 = np.array([blackbody(wavelength, 3000.0) for wavelength in wavelengths])
    blackbody_at_T4000 = np.array([blackbody(wavelength, 4000.0) for wavelength in wavelengths])
    blackbody_at_T5000 = np.array([blackbody(wavelength, 5000.0) for wavelength in wavelengths])

    pl.figure(figsize=(8, 6), dpi=80)
    pl.plot(wavelengths, blackbody_at_T3000, color="red", linewidth=1.0, linestyle="-", label="T=3000K")
    pl.plot(wavelengths, blackbody_at_T4000, color="green", linewidth=1.0, linestyle="-", label="T=4000K")
    pl.plot(wavelengths, blackbody_at_T5000, color="blue", linewidth=1.0, linestyle="-", label="T=5000K")
    pl.title('Blackbody Distributions for different Temperatures')
    pl.xlabel('Wavelength [nm]')
    pl.ylabel('Spectral Radiance [J/m^3]')
    pl.legend(loc='upper right')
    pl.savefig(os.path.join(output_dir, 'blackbody_distributions.png'))


    data = np.loadtxt(options.response_functions_filename);    
    dlambda = 5
    wavelengths = data[:,0]
    responses = data[:,1:4].T
    data_size = len(wavelengths)

    temperatures = np.linspace(1000.0, 8000.0, 100) # [K]
    rgbs = np.zeros(shape=(3, 100))
    i = 1
    while i < 100:
        r, g, b = get_rgb(wavelengths, responses, temperatures[i])
        rgbs[0, i] = r
        rgbs[1, i] = g
        rgbs[2, i] = b

        i = i + 1

    rgbs_max = np.amax(rgbs, axis=0)

    pl.figure(figsize=(8, 6), dpi=80)
    ax1 = pl.subplot(111)
    pl.axis([1000,8000,-1.0e15,2.5e15])
    bbox1 = ax1.get_position()
    print "bbox1: x0=%lf,y0=%lf,x1=%lf,y1=%lf" % (bbox1.x0, bbox1.y0, bbox1.x1, bbox1.y1)    
    pl.plot(temperatures, rgbs[0], color="red", linewidth=1.0, linestyle="-", label="red")
    pl.plot(temperatures, rgbs[1], color="green", linewidth=1.0, linestyle="-", label="green")
    pl.plot(temperatures, rgbs[2], color="blue", linewidth=1.0, linestyle="-", label="blue")
    pl.title('RGB values due to blackbody radiation dependent on the temperature', y=1.05)
    pl.xlabel('Temperature [K]')
    pl.ylabel('Color Channel')
    pl.legend(loc='upper left')
    pl.show()

    image_data = np.zeros(shape=(20, 100, 3), dtype=np.uint8)
    i = 1
    while i < 100:
        r = int(255*rgbs[0, i]/rgbs_max[i])
        g = int(255*rgbs[1, i]/rgbs_max[i])
        b = int(255*rgbs[2, i]/rgbs_max[i])
        image_data[:, i] = [r, g, b]
 
        i = i + 1
    
    pl.axes([bbox1.x0, bbox1.y0, bbox1.x1 - bbox1.x0, .2], axisbg='y')
    pl.imshow(image_data, interpolation='nearest', aspect='auto')
    pl.xticks([])
    pl.yticks([])

    print pl.gca().get_position()
    pl.show()

    pl.savefig(os.path.join(output_dir, 'blackbody_rgb.png'))

