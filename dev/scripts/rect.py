__all__ = ['Rect']


class Rect(object):
    """Represent a rectangle in the BinPack tree."""
    def __init__(self, x1, y1, x2, y2):
        self.x1 = x1
        self.y1 = y1  # bottom
        self.x2 = x2
        self.y2 = y2  # top

    def get_width(self):
        return abs(self.x2 - self.x1)

    def set_width(self, w):
        self.x2 = self.x1 + w

    def get_height(self):
        return abs(self.y2 - self.y1)

    def set_height(self, h):
        self.y2 = self.y1 + h

    def get_left(self):
        return self.x1

    def set_left(self, l):
        w = self.get_width()
        self.x1 = l
        self.x2 = l + w

    def get_top(self):
        return self.y2

    def set_top(self, t):
        h = self.get_height()
        self.y2 = t
        self.y1 = t - h

    def get_right(self):
        return self.x2

    def get_bottom(self):
        return self.y1

    def set_bottom(self, y1):
        h = self.get_height()
        self.y1 = y1
        self.y2 = self.y1 + h

    def offset(self, x, y):
        self.left = self.left + x
        self.top = self.top + y
        return self

    def inset(self, d):
        """return a rect which is this rect inset by d in each direction"""
        return Rect(self.x1 + d, self.y1 + d,
                    self.x2 - d, self.y2 - d)

    def inside(self, r):
        """return true if this rectangle is inside r"""
        return self.x1 >= r.x1 and self.x2 <= r.x2\
               and self.y1 >= r.y1 and self.y2 <= r.y2

    width = property(fget=get_width, fset=set_width)
    height = property(fget=get_height, fset=set_height)
    left = property(fget=get_left, fset=set_left)
    top = property(fget=get_top, fset=set_top)
    right = property(fget=get_right)
    bottom = property(fget=get_bottom, fset=set_bottom)

    def __str__(self):
        return "[%f, %f, %f, %f]" % (self.x1, self.y1, self.x2, self.y2)

    def __repr__(self):
        return "Rect[%s]" % str(self)
