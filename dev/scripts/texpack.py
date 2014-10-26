#!/usr/bin/env python
import argparse
import Image
import logging
import os
import xml.etree.cElementTree as ET
from xml.etree import ElementTree
from xml.dom import minidom
from copy import copy
from os.path import join
from glob import glob

from rect import Rect

log = logging.getLogger(__name__)


class BinPackNode(object):
    """A Node in a tree of recursively smaller areas within which images can be placed."""
    def __init__(self, area):
        """Create a binpack node
        @param area a Rect describing the area the node covers in texture coorinates
        """
        #the area that I take up in the image.
        self.area = area
        # if I've been subdivided then I always have a left/right child
        self.leftchild = None
        self.rightchild = None
        #I'm a leaf node and an image would be placed here, I can't be suddivided.
        self.filled = False

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, str(self.area))

    def insert(self, newarea):
        """Insert the newarea in to my area.
        @param newarea a Rect to insert in to me by subdividing myself up
        @return the area filled or None if the newarea couldn't be accomodated within this
            node tree
        """
        #if I've been subdivided already then get my child trees to insert the image.
        if self.leftchild and self.rightchild:
            return self.leftchild.insert(newarea) or self.rightchild.insert(newarea)

        #If my area has been used (filled) or the area requested is bigger then my
        # area return None. I can't help you.
        if self.filled or newarea.width > self.area.width or newarea.height > self.area.height:
            return None

        #if the image fits exactly in me then yep, the are has been filled
        if self.area.width == newarea.width and self.area.height == newarea.height:
            self.filled = True
            return self.area

        #I am going to subdivide myself, copy my area in to the two children
        # and then massage them to be useful sizes for placing the newarea.
        leftarea = copy(self.area)
        rightarea = copy(self.area)

        widthdifference = self.area.width - newarea.width
        heightdifference = self.area.height - newarea.height

        if widthdifference > heightdifference:
            leftarea.width = newarea.width
            rightarea.left = rightarea.left + newarea.width
            rightarea.width = rightarea.width - newarea.width
        else:
            leftarea.height = newarea.height
            rightarea.top = rightarea.top + newarea.height
            rightarea.height = rightarea.height - newarea.height

        #create my children and then insert it in to the left child which
        #was carefully crafted about to fit in one dimension.
        self.leftchild = BinPackNode(leftarea)
        self.rightchild = BinPackNode(rightarea)
        return self.leftchild.insert(newarea)


def _imagesize(i):
    return i.size[0] * i.size[1]

#table of heuristics to sort the list of images by before placing
# them in the BinPack Tree NOTE that they are compared backwards
# as we want to go from big to small (r2->r1 as opposed to r1->r2)
sort_heuristics = {
    "maxarea": lambda r1, r2:  cmp(_imagesize(r2[1]), _imagesize(r1[1])),
    "maxwidth": lambda r1, r2: cmp(r2[1].size[0], r1[1].size[0]),
    "maxheight": lambda r1, r2: cmp(r2[1].size[1], r1[1].size[1]),
}


def pack_images(imagelist, padding, sort, maxdim, dstfilename, prettify):
    """pack the images in image list in to a pow2 PNg file
    @param imagelist iterable of tuples (image name, image)
    @param padding padding to be applied to all sides of the image
    @param dstfilename the filename to save the packed image to.
    @return a list of ( rect, name, image) tuples describing where the images were placed.
    """

    log.debug("unsorted order:")
    for name, image in imagelist:
        log.debug("\t%s %dx%d" % (name, image.size[0], image.size[1]))

    #sort the images based on the heuristic passed in
    images = sorted(imagelist, cmp=sort_heuristics[sort])

    log.debug("sorted order:")
    for name, image in images:
        log.debug("\t%s %dx%d" % (name, image.size[0], image.size[1]))

    #the start dimension of the target image. this grows
    # by doubling to accomodate the images. Should start
    # on a power of two otherwise it wont end on a power
    # of two. Could possibly start this on the first pow2
    # above the largest image but this works.
    targetdim_x = 64
    targetdim_y = 64
    placement = []
    while True:
        try:
            placement = []
            tree = BinPackNode(Rect(0, 0, targetdim_x, targetdim_y))

            #insert each image into the BinPackNode area. If an image fails to insert
            # we start again with a slightly bigger target size.
            for name, img in images:
                imsize = img.size
                r = Rect(0, 0, imsize[0] + padding * 2, imsize[1] + padding * 2)
                uv = tree.insert(r)
                if uv is None:
                    #the tree couldn't accomodate the area, we'll need to start again.
                    raise ValueError('Pack size too small.')
                uv = uv.inset(padding)
                placement.append((uv, name, img))

            #if we get here we've found a place for all the images so
            # break from the while True loop
            break
        except ValueError:
            log.debug("Taget Dim [%dx%d] too small" % (targetdim_x, targetdim_y))
            if targetdim_x == targetdim_y:
                targetdim_x = targetdim_x * 2
                if targetdim_x > maxdim:
                    raise Exception("Too many textures to pack in to max texture size %dx%d\n" % (maxdim, maxdim))
            else:
                targetdim_y = targetdim_x

    #save the images to the target file packed
    log.info("Packing %d images in to %dx%d" % (len(imagelist), targetdim_x, targetdim_y))
    image = Image.new("RGBA", (targetdim_x, targetdim_y))
    for uv, name, img in placement:
        image.paste(img, (uv.x1, uv.y1))
    #image.show()
    log.info("Saving packed images to file %s" % (dstfilename))
    image.save(dstfilename, "PNG")


    xmlTextures = ET.Element("textures")
    
    xmlParentTexture = ET.SubElement(xmlTextures, "texture")
    xmlParentTexture.set('url', args.dst)
    xmlParentTexture.set("width", str(targetdim_x))
    xmlParentTexture.set("height", str(targetdim_y))

    for area, name, im in placement:
        xmlTexture = ET.SubElement(xmlParentTexture, "texture")
        xmlTexture.set("url", os.path.basename(name))
        xmlTexture.set("top", str(area.y1))
        xmlTexture.set("left", str(area.x1))
        xmlTexture.set("width", str(area.x2-area.x1))
        xmlTexture.set("height", str(area.y2-area.y1))

    treeFilename = os.path.splitext(os.path.basename(args.dst))[0] + ".xml"

    if prettify:
        log.info("Writing image tree to prettified XML file %s" % (treeFilename))
        xmlTexturesReparsed = minidom.parseString(ElementTree.tostring(xmlTextures, 'utf-8'))
        f = open(treeFilename,'w')
        f.write(xmlTexturesReparsed.toprettyxml(indent="    "))
        f.close()
    else:
        log.info("Writing image tree to XML file %s" % (treeFilename))
        tree = ET.ElementTree(xmlTextures)
        tree.write(treeFilename)

    return placement


if __name__ == "__main__":
    _description = """A utility to take a set of png images and pack them in to
    a power of two image with padding. The placements of the source images are
    written to a file as an XML texture tree
    """

    _epilog = " example: texpack.py hud/images data/hud/texturepage.png"

    parser = argparse.ArgumentParser(description=_description, epilog=_epilog)
    parser.add_argument("-v", action="store_true",
                        help="enable verbose mode",
                        default=False)
    parser.add_argument("-pad", type=int,
                        help="padding on each side of the texture (default: 2)",
                        default=2)
    parser.add_argument("-sort", type=str, default="maxarea",
                        help="sort algorithm one of %s (default: maxarea)" % ",".join(sort_heuristics.keys()))
    parser.add_argument("-maxdim", type=int, default=4096,
                        help="maximum texture size permissable.")
    parser.add_argument("--log", type=str,
                        help="Logging level (INFO, DEBUG, WARN) (default: INFO)",
                        default="INFO")
    parser.add_argument("src", type=str, help="src directory")
    parser.add_argument("dst", type=str, help="dest png file")
    parser.add_argument("-prettify", action="store_true",
                        help="prettify the XML output",
                        default=False)

    args = parser.parse_args()
    numeric_level = getattr(logging, args.log.upper(), None)
    if not isinstance(numeric_level, int):
        log.error('Invalid log level: %s' % args.log)
        exit(-1)
    logging.basicConfig(level=numeric_level)

    if args.sort not in sort_heuristics:
        log.error("Uknown sort parameter '%s'" % args.sort)
        exit(-1)

    #get a list of PNG files in the current directory
    names = glob(join(args.src, "*.png"))
    #create a list of PIL Image objects, sorted by size
    images = [(name, Image.open(name)) for name in names]

    placements = pack_images(images, args.pad, args.sort, args.maxdim, args.dst, args.prettify)
  

