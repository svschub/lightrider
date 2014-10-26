import numpy as np
import pylab as pl
from scipy import linalg


if __name__ == "__main__":
    data = np.loadtxt("rgb31.txt");    

    dlambda = 5
    wavelengths = data[:,0]
    responses = data[:,1:4].T

    pl.close("all")

    pl.figure(figsize=(8, 6), dpi=80)
    pl.plot(wavelengths, responses[0], color="red", linewidth=1.0, linestyle="-", label="red")
    pl.plot(wavelengths, responses[1], color="green", linewidth=1.0, linestyle="-", label="green")
    pl.plot(wavelengths, responses[2], color="blue", linewidth=1.0, linestyle="-", label="blue")
    pl.title('RGB Color Matching Functions')
    pl.xlabel('Wavelength [nm]')
    pl.ylabel('Response')
    pl.legend(loc='upper right')
    pl.show()
    pl.savefig('rgb_color_matching_functions.png')

    mat = dlambda*responses.dot(responses.T)
    invmat = linalg.inv(mat)
    print "inverse response matrix:", invmat
