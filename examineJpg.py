#! /usr/bin/env python
# Simple script to extract RGB pixel values from a jpeg file.
# It is also used to test how to import packages in several systems
# Testing that numpy and netCDF4 are available

import numpy as np
from netCDF4 import Dataset

# loading PIL, which deals with reading a jpg file and extract pixel RGB
# values.
from PIL import Image


im = Image.open("dead_parrot.jpg") #Can be many different formats.
pix = im.load()
print  im.size #Get the width and hight of the image for iterating over
x = 25
y = 75
print pix[x,y] #Get the RGBA Value of the a pixel of an image
#pix[x,y] = value # Set the RGBA Value of the image (tuple)
#im.save("alive_parrot.png") # Save the modified pixels as png
