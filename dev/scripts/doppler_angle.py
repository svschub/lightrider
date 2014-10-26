import argparse
import math
import numpy as np
import pylab as pl


def rad(deg):
    return np.pi*deg / 180.0


def deg(rad):
    return 180.0*rad / np.pi


def getGamma(beta):
    return 1 / math.sqrt(1 - beta*beta)


def getBoostedAngle(angle, beta):
    # angle: inside the moving system
    # boostedAngle: inside the reference system
    gamma = getGamma(beta)
    boostedAngle = math.atan(math.sin(angle) / (gamma*(math.cos(angle) - beta)) )
    if boostedAngle < 0.0: 
        boostedAngle += np.pi

    return boostedAngle


def getShift(angle, beta):
    gamma = getGamma(beta)
    tanAngleRef = math.sin(angle) / (gamma*(math.cos(angle) - beta))
    cosAngleRef = 1.0 / math.sqrt(tanAngleRef*tanAngleRef + 1.0)
    
    if (tanAngleRef < 0):
        cosAngleRef = -cosAngleRef
    
    return gamma*(1.0 - beta*cosAngleRef)


def getWavelengthShift(angle, beta):
    gamma = getGamma(beta)
    tanAngle = math.tan(angle)
    cosAngle = 1.0/math.sqrt(1.0 + tanAngle*tanAngle)
    tanAngleRef = tanAngle*cosAngle / (gamma*(cosAngle - beta))
    cosAngleRef = 1.0/math.sqrt(tanAngleRef*tanAngleRef + 1.0);
    
    if (tanAngleRef < 0):
        cosAngleRef = -cosAngleRef
    
    return gamma*(1.0 - beta*cosAngleRef)


if __name__ == "__main__":
    _description = """Show how the angle in the reference frame depends on the angle in the observer frame"""

    _epilog = " example: doppler_angle.py --beta 0.95"

    parser = argparse.ArgumentParser(description=_description, epilog=_epilog)
    parser.add_argument("-beta", type=float, required=True, help="beta parameter")

    args = parser.parse_args()

    beta = args.beta
    gamma = getGamma(beta)

    pl.close("all")

    observer_angles = np.linspace(0., 90., 100)
    reference_angles = np.array([deg(getBoostedAngle(rad(angle), beta)) for angle in observer_angles])

    pl.figure(figsize=(8, 6), dpi=80)
    pl.plot(observer_angles, reference_angles, linestyle="-")
    pl.title('Angle Dependency between Observer and Reference Frame at beta=' + str(beta))
    pl.xlabel('Angle in the Observer Frame')
    pl.ylabel('Angle in the Reference Frame')
    pl.show()
    pl.savefig('angles_observer_reference.png')


    wavelength_shifts = np.array([getWavelengthShift(rad(angle), beta) for angle in observer_angles])

    pl.figure(figsize=(8, 6), dpi=80)
    pl.plot(observer_angles, wavelength_shifts, linestyle="-")
    pl.title('Wavelength Shift dependent on the Observer Angle at beta=' + str(beta))
    pl.xlabel('Angle in the Observer Frame')
    pl.ylabel('Wavelength Shift Factor')
    pl.show()
    pl.savefig('wavelength_shifts.png')
