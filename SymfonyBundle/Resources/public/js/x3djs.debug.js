X3d = function () {
};

X3d.transformObjectByMatrix = function(object, transformationMatrix) {
    if (object instanceof THREE.Object3D) {
        object.applyMatrix(transformationMatrix);

        if (object instanceof THREE.SpotLight) {
            object.target.position.applyMatrix4(transformationMatrix);
        }
    }
};
X3d.Node = function(node) {
    this.node = node;
};

X3d.Node.getInstance = function(node) {
    var tagName = node.prop('tagName'),
        nodeInstance = null;

    switch (tagName) {
        case "NavigationInfo":
            nodeInstance = new X3d.NavigationInfoNode(node);
            break;
        case "Background":
            nodeInstance = new X3d.BackgroundNode(node);
            break;
        case "Scene":
            nodeInstance = new X3d.SceneNode(node);
            break;
        case "Transform":
            nodeInstance = new X3d.TransformNode(node);
            break;
        case "Group":
            nodeInstance = new X3d.GroupNode(node);
            break;
        case "Shape":
            nodeInstance = new X3d.ShapeNode(node);
            break;
        case "DirectionalLight":
            nodeInstance = new X3d.DirectionalLightNode(node);
            break;
        case "PointLight":
            nodeInstance = new X3d.PointLightNode(node);
            break;
        case "SpotLight":
            nodeInstance = new X3d.SpotLightNode(node);
            break;
        case "Viewpoint":
            nodeInstance = new X3d.ViewpointNode(node);
            break;
        case "Appearance":
            nodeInstance = new X3d.AppearanceNode(node);
            break;
        case "Material":
            nodeInstance = new X3d.MaterialNode(node);
            break;
        case "LineProperties":
            nodeInstance = new X3d.LinePropertiesNode(node);
            break;
        case "ImageTexture":
            nodeInstance = new X3d.ImageTextureNode(node);
            break;
        case "TextureTransform":
            nodeInstance = new X3d.TextureTransformNode(node);
            break;
        case "IndexedFaceSet":
            nodeInstance = new X3d.IndexedFaceSetNode(node);
            break;
        case "IndexedLineSet":
            nodeInstance = new X3d.IndexedLineSetNode(node);
            break;
        case "Coordinate":
            nodeInstance = new X3d.CoordinateNode(node);
            break;
        case "TextureCoordinate":
            nodeInstance = new X3d.TextureCoordinateNode(node);
            break;
        case "Color":
            nodeInstance = new X3d.ColorNode(node);
            break;
        default:
            throw new X3d.UnknownNodeException(tagName);
    }

    return nodeInstance;
};

X3d.Node.prototype.parseArray = function(str, fcn) {
    var trimmedStr, 
        splitStr;

    trimmedStr = str.replace(/\s+/g, ' ');
    trimmedStr = trimmedStr.replace(/^\s+/, '');
    trimmedStr = trimmedStr.replace(/\s+$/, '');

    splitStr = trimmedStr.split(' ');

    return splitStr.map(fcn);
};

X3d.Node.prototype.parseIntArray = function(str) {
    return this.parseArray(str, function(x) {
        return parseInt(x);
    });
};

X3d.Node.prototype.parseFloatArray = function(str) {
    return this.parseArray(str, function(x) {
        return parseFloat(x);
    });
};

X3d.Node.prototype.parseVector2 = function(str) {
    var coordinates = this.parseFloatArray(str);

    return new THREE.Vector2(coordinates[0], coordinates[1]);
};

X3d.Node.prototype.parseVector2Array = function(str) {
    var coordinates = this.parseFloatArray(str),
        n = coordinates.length,
        vectors = [],
        i = 0;

    while (i < n) {
        vectors.push(new THREE.Vector2(coordinates[i], coordinates[i + 1]));
        i = i + 2;
    }

    return vectors;
};

X3d.Node.prototype.parseVector3 = function(str) {
    var coordinates = this.parseFloatArray(str);

    return new THREE.Vector3(coordinates[0], coordinates[1], coordinates[2]);
};

X3d.Node.prototype.parseVector3Array = function(str) {
    var coordinates = this.parseFloatArray(str),
        n = coordinates.length,
        vectors = [],
        i = 0;

    while (i < n) {
        vectors.push(new THREE.Vector3(coordinates[i], coordinates[i + 1], coordinates[i + 2]));
        i = i + 3;
    }

    return vectors;
};
X3d.SceneLoader = function () {
    this.x3dSceneNode = null;
    this.cachedNodes = {};
    this.background = {};
    this.scene = null;
    this.sceneCamera = null;
    this.lights = [];
    this.textureTree = new X3d.TextureTree();
    this.createMaterial = this.createMaterialDefaultHandler;

    this.deferred = null;
    this.promise = null;
};

X3d.SceneLoader.prototype.loadSceneFromX3d = function(x3dFile) {
    var self = this;

    self.deferred = new $.Deferred();
    self.promise = self.deferred.promise();

    self.cachedNodes = {};
    self.background = {};
    self.sceneCamera = null;
    self.lights = [];

    $.when(self.textureTree.getPromise()).then(function () {
        return $.ajax({
            url: x3dFile,
            type: 'GET',
            data: {}
        });
    }).done(function(x3dResponse) {
        try {
            self.x3dSceneNode = $(x3dResponse).find("Scene");

            self.scene = self.parseX3dNode(self.x3dSceneNode);

            self.lights.forEach(function(light) {
                self.scene.add(light);
            });

            self.textureTree.evaluateCallbacks();
            self.deferred.resolve(self.scene);
        } catch (e) {
            self.deferred.reject(e.message);
        }
    }).fail(function(response) {
        self.deferred.reject(response);
    });

    return self.promise;
};

X3d.SceneLoader.prototype.parseX3dNode = function(node) {
    var self = this,
        identifier = node.attr('DEF') || node.attr('USE'),
        nodeToParse,
        nodeInstance,
        parsedNode;

    if (identifier && self.cachedNodes[identifier]) {
        parsedNode = self.cachedNodes[identifier];
        // console.log('cached node: ' + identifier);
    } else {
        if (node.attr('USE')) {
            nodeToParse = self.x3dSceneNode.find('[DEF="' + node.attr('USE') + '"]');
        } else {
            nodeToParse = node;
        }

        nodeInstance = X3d.Node.getInstance(nodeToParse);
        parsedNode = nodeInstance.parse(self);

        if (identifier) {
            self.cachedNodes[identifier] = parsedNode;
        }
    }

    return parsedNode;
};

X3d.SceneLoader.prototype.getPromise = function () {
    return this.promise;
};

X3d.SceneLoader.prototype.loadTextureTreeFromXml = function(xmlFile) {
    var self = this;

    self.textureTree.loadFromXml(xmlFile);

    return self.textureTree.getPromise();
};

X3d.SceneLoader.prototype.unloadTextureTree = function () {
    this.textureTree = new X3d.TextureTree();
};

X3d.SceneLoader.prototype.getPromise = function () {
    return this.deferred.promise();
};

X3d.SceneLoader.prototype.setCreateMaterialHandler = function(createMaterialHandler) {
    this.createMaterial = createMaterialHandler;
};

X3d.SceneLoader.prototype.createMaterialDefaultHandler = function(properties) {
    return new THREE.MeshLambertMaterial(properties);
}

X3d.SceneLoader.prototype.getScene = function () {
    return this.scene;
};

X3d.SceneLoader.prototype.getCamera = function () {
    return this.sceneCamera;
};

X3d.SceneLoader.prototype.getLights = function () {
    return this.lights;
};

X3d.SceneLoader.prototype.hasNode = function(identifier) {
    return (this.cachedNodes[identifier] !== null);
};

X3d.SceneLoader.prototype.getNode = function(identifier) {
    return this.cachedNodes[identifier];
};
        X3d.TextureTree = function () {
    this.textures = {};

    this.deferred = new $.Deferred();
    this.deferred.resolve();
    this.promise = this.deferred.promise();
};

X3d.TextureTree.getTextureIdByName = function(textureName) {
    return textureName.replace('.', '_');
};

X3d.TextureTree.prototype.getPromise = function () {
    return this.promise;  
};

X3d.TextureTree.prototype.loadFromXml = function(xmlFile) {
    var self = this;

    self.deferred = new $.Deferred();
    self.promise = self.deferred.promise();

    $.when($.ajax({
        url: xmlFile,
        type: 'GET',
        data: {}
    })).done(function(xmlResponse) {
        var texturesNode = $(xmlResponse).find("textures");

        try {
            self.textures = {};
            texturesNode.children().each(function () {
                self.parseTextureNode(self, $(this), null);
            });

            self.deferred.resolve();
        } catch (e) {
            self.deferred.reject(e.message);
        }
    }).fail(function(response) {
        self.deferred.reject(response);
    });

    return self.promise;
};

X3d.TextureTree.prototype.parseTextureNode = function(self, textureNode, parentId) {
    var attribute,
        textureId,
        texture = {},
        parentTexture;

    attribute = textureNode.attr('name');
    if (!attribute) {
        throw new X3d.InvalidTextureException('Attribute name is mandatory');
    }
    texture.name = attribute;

    textureId = X3d.TextureTree.getTextureIdByName(texture.name);

    attribute = textureNode.attr('url');
    if (!parentId && !attribute) {
        throw new X3d.InvalidTextureException('Attribute url is mandatory for root level textures');
    }
    texture.url = attribute;

    attribute = textureNode.attr('width');
    if (!attribute) {
        throw new X3d.InvalidTextureException('Attribute width is mandatory');
    }
    texture.width = parseInt(attribute);

    attribute = textureNode.attr('height');
    if (!attribute) {
        throw new X3d.InvalidTextureException('Attribute height is mandatory');
    }
    texture.height = parseInt(attribute);

    attribute = textureNode.attr('left');
    if (attribute) {
        texture.left = parseInt(attribute);
    }

    attribute = textureNode.attr('top');
    if (attribute) {
        texture.top = parseInt(attribute);
    }

    if (parentId) {
        texture.parentId = parentId;
        parentTexture = self.textures[parentId];
        if (parentTexture.parentId) {
            throw new X3d.Exception("Texture tree can only have hierarchy depth <= 2!");
        }

        texture.ub = texture.left/parentTexture.width;
        texture.ua = texture.width/parentTexture.width;
        // => u0 = ua*u + ub

        texture.vb = 1.0 - (texture.height + texture.top)/parentTexture.height;
        texture.va = texture.height/parentTexture.height;
        // => v0 = va*v + vb
    } else {
        texture.callbacks = [];
    }

    self.textures[textureId] = texture;

    textureNode.children().each(function () {
        self.parseTextureNode(self, $(this), textureId);
    });
};

X3d.TextureTree.prototype.loadTexture = function(textureProperties, onLoadCallback) {
    var textureId = X3d.TextureTree.getTextureIdByName(textureProperties.name),
        parentTextureId,
        texture,
        loadedTexture = null;

    if (this.textures[textureId]) {
        /**
         * Texture already exists within the tree.
         * Check if it is a root level texture.
         */

        if (this.textures[textureId].parentId) {
            // Texture has a parent texture. Redirect to the parent texture.
            parentTextureId = this.textures[textureId].parentId;
            if (this.textures[parentTextureId]) {
                texture = this.textures[parentTextureId];
                // console.log('texture ' + textureId + ' found in tree, loading parent url ' + texture.url);
            }
        } else {
            // This texture is a root level texture:
            texture = this.textures[textureId];
            // console.log('root level texture ' + textureId + ' found in tree, loading url ' + texture.url);
        }
    } else {
        /**
         * This texture does not exist within the tree.
         * Create a new root level texture with this ID.
         */

        this.textures[textureId] = {
            name: textureProperties.name,
            url: textureProperties.url,
            callbacks: []
        }

        texture = this.textures[textureId];
        // console.log('texture ' + textureId + ' not found in tree, loading ' + texture.url);
    }

    if (texture.url && !texture.parentId) {
        if (!texture.data) {
            texture.data = new THREE.Texture(undefined, THREE.UVMapping);
            texture.data.sourceFile = texture.url;
        }

        // register callbacks only root level textures:
        texture.callbacks.push(onLoadCallback);
    }

    return texture.data;
};

X3d.TextureTree.prototype.evaluateCallbacks = function () {
    var self = this,
        texture;

    for (var textureId in self.textures) {
        (function(id) {
            var texture = self.textures[id],
                loader = new THREE.ImageLoader();

            if (!texture.parentId && texture.callbacks.length > 0) {
                loader.load(texture.url, function(image) {
                    texture.data.image = image;
                    texture.data.needsUpdate = true;
                    texture.callbacks.forEach(function(callback) {
                        callback(texture.data);
                    });
                });
            }
        }(textureId));
    }
};

X3d.TextureTree.prototype.getAbsoluteCoordinates = function(textureName, coordinates) {
    var textureId = X3d.TextureTree.getTextureIdByName(textureName),
        texture,
        u, v,
        absCoordinates = [];

//    console.log('texture UVs: ' + JSON.stringify(coordinates));

    if (this.textures[textureId] && this.textures[textureId].parentId) {
        // console.log('texture ' + textureName + '(id=' + textureId + ') has parent with id=' + this.textures[textureId].parentId);
        texture = this.textures[textureId];

        coordinates.forEach(function(uv) {
            u = texture.ua*uv.x + texture.ub;
            if (u < 0.0) { u = 0.0; }
            if (u > 1.0) { u = 1.0; }

            v = texture.va*uv.y + texture.vb;
            if (v < 0.0) { v = 0.0; }
            if (v > 1.0) { v = 1.0; }

            absCoordinates.push(new THREE.Vector2(u, v));
        });
    } else {
        // console.log('texture ' + textureName + ' (id=' + textureId + ') has no parent');
        absCoordinates = coordinates;
    }

//    console.log('absolute UVs: ' + JSON.stringify(absCoordinates));
    return absCoordinates;
};

X3d.Exception = function(details) {
    this.name = "Exception";
    this.message = details;
}

X3d.Exception.prototype.getMessage = function () {
    return this.message;
};


X3d.InvalidTextureException = function(details) {
    X3d.Exception.call(this, details);

    this.name = "X3dInvalidTextureException";

    this.message = "Invalid texture";
    if (details) {
        this.message = this.message + ": " + details;
    }
}

X3d.InvalidTextureException.prototype = Object.create(X3d.Exception.prototype);

X3d.UnknownNodeException = function(details) {
    X3d.Exception.call(this, details);

    this.name = "X3dUnknownNodeException";

    this.message = "Unknown X3D node";
    if (details) {
        this.message = this.message + ": " + details;
    }
}

X3d.UnknownNodeException.prototype = Object.create(X3d.Exception.prototype);
X3d.GeometryNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.GeometryNode.prototype = Object.create(X3d.Node.prototype);

X3d.GeometryNode.prototype.createMesh = function(appearance, sceneLoader) {
};
X3d.LightNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.LightNode.prototype = Object.create(X3d.Node.prototype);

X3d.LightNode.prototype.parseBasicLightProperties = function(sceneLoader) {
    var attribute,
        values, 
        ambientIntensity,
        ambientColor;

    // console.log('parsing X3D light');

    attribute = this.node.attr('on');
    if (attribute) {
        this.on = (attribute == "TRUE"); 
    } else {
        this.on = true;
    }

    this.color = new THREE.Color();
    attribute = this.node.attr('color');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        this.color.setRGB(values[0], values[1], values[2]);
    } else {
        this.color.setRGB(1.0, 1.0, 1.0);
    }

    attribute = this.node.attr('intensity');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        this.intensity = values[0];
    } else {
        this.intensity = 1.0;
    }

    attribute = this.node.attr('ambientIntensity');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        ambientIntensity = values[0];
        if (ambientIntensity > 0.0) {
            // console.log('adding ambient light component with intensity ' + ambientIntensity);
            ambientColor = new THREE.Color();
            ambientColor.copy(this.color);
            ambientColor.multiplyScalar(ambientIntensity);
            sceneLoader.lights.push(new THREE.AmbientLight(ambientColor.getHex()));
        }
    }
};
X3d.AppearanceNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.AppearanceNode.prototype = Object.create(X3d.Node.prototype);

X3d.AppearanceNode.prototype.parse = function(sceneLoader) {
    var self = this;

    // console.log('parsing X3D appearance');

    self.node.children().each(function() {
        var child, childNode = $(this);

        try {
            child = sceneLoader.parseX3dNode(childNode);

            if (child instanceof X3d.MaterialNode) {
                self.material = child;
            } else if (child instanceof X3d.LinePropertiesNode) {
                self.lineProperties = child;
            } else if (child instanceof X3d.ImageTextureNode) {
                self.texture = child;
            } else if (child instanceof X3d.TextureTransformNode) {
                self.textureTransform = child;
            }
        } catch (e) {
            throw e;
        }
    });

    return self;
};

X3d.AppearanceNode.prototype.getMaterialProperties = function(sceneLoader) {
    var self = this,
        properties = {},
        texture,
        isTransparent = (self.material.transparency && self.material.transparency > 0.0);

    properties.shading = THREE.SmoothShading;
 
    properties.vertexColors = THREE.VertexColors;

    if (self.material.solid) {
        properties.side = THREE.FrontSide;
    } else {
        properties.side = THREE.DoubleSide;
    }

    if (self.texture && self.texture.name) {
        texture = sceneLoader.textureTree.loadTexture(self.texture, function(loadedTexture) {
            texture.needsUpdate = true;
        });

        properties.map = texture;
    }

    if (isTransparent) {
        properties.transparent = isTransparent;
        properties.opacity = 1.0 - self.material.transparency;
    }

    return properties;
};
X3d.BackgroundNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.BackgroundNode.prototype = Object.create(X3d.Node.prototype);

X3d.BackgroundNode.prototype.parse = function(sceneLoader) {
    var background = {},
        attribute,
        values;

    // console.log('parsing X3D background');

    background.groundColor = new THREE.Color();
    attribute = this.node.attr('groundColor');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        background.groundColor.setRGB(values[0], values[1], values[2]);
    } else {
        background.groundColor.setRGB(0, 0, 0);
    }

    background.skyColor = new THREE.Color();
    attribute = this.node.attr('skyColor');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        background.skyColor.setRGB(values[0], values[1], values[2]);
    } else {
        background.skyColor.setRGB(0, 0, 0);
    }

    X3d.background = background;

//    console.log('background: ' + JSON.stringify(background));

    return null;
};
X3d.ColorNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.ColorNode.prototype = Object.create(X3d.Node.prototype);

X3d.ColorNode.prototype.parse = function(sceneLoader) {
    var self = this,
        attribute,
        vectors,
        color;

    self.colors = [];

    // console.log('parsing X3D color');

    attribute = this.node.attr('color');
    if (attribute) {
        vectors = this.parseVector3Array(attribute);
        vectors.forEach(function(vector) {
            color = new THREE.Color();
            color.setRGB(vector.x, vector.y, vector.z);
            self.colors.push(color);
        });
    }

    return self;
};
X3d.CoordinateNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.CoordinateNode.prototype = Object.create(X3d.Node.prototype);

X3d.CoordinateNode.prototype.parse = function(sceneLoader) {
    var self = this,
        attribute;

    // console.log('parsing X3D coordinate');

    attribute = this.node.attr('point');
    if (attribute) {
        self.coordinates = this.parseVector3Array(attribute);
    } else {
        self.coordinates = [];
    }

    return self;
};
X3d.DirectionalLightNode = function(node) {
    X3d.LightNode.call(this, node);
};

X3d.DirectionalLightNode.prototype = Object.create(X3d.LightNode.prototype);

X3d.DirectionalLightNode.prototype.parse = function(sceneLoader) {
    var attribute,
        values,
        light;

    // console.log('parsing X3D directional light');

    this.parseBasicLightProperties(sceneLoader);

    attribute = this.node.attr('direction');
    if (attribute) {
        this.direction = this.parseVector3(attribute);
    }

    light = new THREE.DirectionalLight(this.color.getHex(), this.intensity);
    light.position = this.direction;
    light.position.negate();

    return light;
};
X3d.GroupNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.GroupNode.prototype = Object.create(X3d.Node.prototype);

X3d.GroupNode.prototype.parse = function(sceneLoader) {
    var object3d = new THREE.Object3D(),
        child;

    // console.log('parsing X3D group ' + this.node.attr('DEF'));

    this.node.children().each(function() {
        try {
            child = sceneLoader.parseX3dNode($(this));
            object3d.add(child);
        } catch (e) {
            throw e;
        }
    });

    return object3d;
};
X3d.ImageTextureNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.ImageTextureNode.prototype = Object.create(X3d.Node.prototype);

X3d.ImageTextureNode.prototype.parse = function(sceneLoader) {
    var self = this,
        attribute,
        matches;

    // console.log('parsing X3D image texture');

    attribute = this.node.attr('url');
    if (attribute) {
        matches = /(\"|\')([^\s]+)(?:\1)\s+(\"|\')([^\s]+)(?:\3)/.exec(attribute);
        self.url = matches[2];
        self.name = matches[4];
    }

    return self;
};
X3d.IndexedFaceSetNode = function(node) {
    X3d.GeometryNode.call(this, node);
};

X3d.IndexedFaceSetNode.prototype = Object.create(X3d.GeometryNode.prototype);

X3d.IndexedFaceSetNode.prototype.parse = function(sceneLoader) {
    var self = this,
        child,
        attribute,
        creaseAngle,
        results;

    // console.log('parsing X3D indexed face set');

    attribute = self.node.attr('solid');
    if (attribute) {
        self.solid = (attribute === "true");
    } else {
        self.solid = false;
    }

    attribute = self.node.attr('creaseAngle');
    if (attribute) {
        results = self.parseFloatArray(attribute);
        self.creaseAngle = results[0];
    } else {
        self.creaseAngle = 0.0;
    }

    attribute = self.node.attr('coordIndex');
    if (attribute) {
        self.coordIndex = self.parseIntArray(attribute);
    }

    attribute = self.node.attr('texCoordIndex');
    if (attribute) {
        self.texCoordIndex = self.parseIntArray(attribute);
    }

    self.node.children().each(function() {
        var childNode = $(this);

        try {
            child = sceneLoader.parseX3dNode(childNode);
            
            if (child instanceof X3d.CoordinateNode) {
                self.vertexCoordinates = child.coordinates;
            } else if (child instanceof X3d.TextureCoordinateNode) {
                self.textureCoordinates = child.coordinates;
            }
        } catch (e) {
            throw e;
        }
    });

    return self;
};

X3d.IndexedFaceSetNode.prototype.createMesh = function(appearance, sceneLoader) {
    var self = this,

        geometry = new THREE.Geometry(),
        vertices = [],
        faceVertices = [0, 0, 0],
        face,
        vertexCounter = 0,
        vertexColor,

        adjustNormalsMutuallyIfNecessary = function(face1, normal1, face2, normal2, cosCreaseAngle) {
            var cosAngle = face1.normal.dot(face2.normal) / (face1.normal.length() * face2.normal.length());

            if (cosAngle >= cosCreaseAngle) {
                face1.vertexNormals[normal1].add(face2.normal);
                face2.vertexNormals[normal2].add(face1.normal);
            }
        },

        createUvVectors = function(geometry, texCoordIndex, textureCoordinates, texture) {
            var absTextureCoordinates = sceneLoader.textureTree.getAbsoluteCoordinates(texture.name, textureCoordinates),
                faceVertices = [0, 0, 0],
                vertexCounter = 0;

//            console.log('creating UV coordinates: ' + JSON.stringify(texCoordIndex) + ', ' + JSON.stringify(textureCoordinates));

            texCoordIndex.forEach(function(index) {
                if (index >= 0) {
                    if (vertexCounter < 3) {
                        faceVertices[vertexCounter] = index;
                        vertexCounter++;
                    }

                    if (vertexCounter == 3) {
                        geometry.faceVertexUvs[0].push([
                            new THREE.Vector2(absTextureCoordinates[faceVertices[0]].x, absTextureCoordinates[faceVertices[0]].y),
                            new THREE.Vector2(absTextureCoordinates[faceVertices[1]].x, absTextureCoordinates[faceVertices[1]].y),
                            new THREE.Vector2(absTextureCoordinates[faceVertices[2]].x, absTextureCoordinates[faceVertices[2]].y)
                        ]);

                        faceVertices[1] = index;
                        vertexCounter = 2;
                    }
                } else {
                    vertexCounter = 0;
                }
            });
        },

        computeVertexNormals = function(faces, cosCreaseAngle) {
            var vertices = {},
                faceIndex,
                indexedFaces,
                faceVertices,
                nConnectedFaces,
                face1, face2;

//            console.log('computing vertex normals ...');

            faceIndex = 0;
            faces.forEach(function(face) {
                if (!(face.a in vertices)) {
                    vertices[face.a] = {};
                }
                vertices[face.a][faceIndex] = 0;

                if (!(face.b in vertices)) {
                    vertices[face.b] = {};
                }
                vertices[face.b][faceIndex] = 1;

                if (!(face.c in vertices)) {
                    vertices[face.c] = {};
                }
                vertices[face.c][faceIndex] = 2;

                faceIndex++;
            });

            for (var vertex in vertices) {
                faceVertices = vertices[vertex];

                indexedFaces = [];
                for (var face in faceVertices) {
                    indexedFaces.push(face);
                }

                nConnectedFaces = indexedFaces.length;
                for (var i = 0; i < nConnectedFaces; i++) {
                    for (var j = i + 1; j < nConnectedFaces; j++) {
                        face1 = indexedFaces[i];
                        face2 = indexedFaces[j];
                        adjustNormalsMutuallyIfNecessary(
                            faces[face1], faceVertices[face1],
                            faces[face2], faceVertices[face2],
                            cosCreaseAngle
                        );
                    }
                }
            }

            faces.forEach(function(face) {
                face.vertexNormals.forEach(function(vertexNormal) {
                    vertexNormal.normalize();
                });
            });
        },

        createGeometryVertices = function(geometry, vertices) {
            var vertexMap = {},
                vertexMapSize = 0,
                vertexIndex;

            geometry.faces.forEach(function(face) {
                vertexMap[face.a] = 0;
                vertexMap[face.b] = 0;
                vertexMap[face.c] = 0;
            });

            for (var vertex in vertexMap) {
                vertexMapSize++;
            }

            geometry.vertices = [];
            if (vertexMapSize < vertices.length) {
                vertexIndex = 0;
                for (var vertex in vertexMap) {
                    geometry.vertices.push(vertices[vertex].clone());
                    vertexMap[vertex] = vertexIndex;
                    vertexIndex++;
                }

                geometry.faces.forEach(function(face) {
                    face.a = vertexMap[face.a];
                    face.b = vertexMap[face.b];
                    face.c = vertexMap[face.c];
                });

//                console.log('creating geometry vertices: reduced: ' + vertexMapSize + ' of ' + vertices.length);
//                console.log(JSON.stringify(vertexMap));
            } else {
//                console.log('creating geometry vertices: all: ' + vertices.length);
                vertices.forEach(function(vertex) {
                    geometry.vertices.push(vertex.clone());
                });
            }
        };

    // console.log("creating face geometry...");

    if (typeof appearance.material === "undefined") {
        // console.log('no material found, adding standard material');
        appearance.material = {
            diffuseColor: new THREE.Color()
        };

        appearance.material.diffuseColor.setRGB(1.0, 1.0, 1.0);
    }

    if (appearance.material.diffuseColor) {
        vertexColor = appearance.material.diffuseColor;
    } else {
        vertexColor = appearance.material.emissiveColor;
    }

    appearance.material.solid = self.solid;

    geometry.faces = [];
    self.coordIndex.forEach(function(index) {
        if (index >= 0) {
            if (vertexCounter < 3) {
                faceVertices[vertexCounter] = index;
                vertexCounter++;
            }

            if (vertexCounter === 3) {
                face = new THREE.Face3(faceVertices[0], faceVertices[1], faceVertices[2]);
                geometry.faces.push(face);
                faceVertices[1] = index;
                vertexCounter = 2;
            }
        } else {
            vertexCounter = 0;
        }
    });

    self.vertexCoordinates.forEach(function(vertex) {
        vertices.push(vertex.clone());
    });

    createGeometryVertices(geometry, vertices);

    geometry.faceVertexUvs[0] = [];

    geometry.computeFaceNormals();
    geometry.computeCentroids();

    geometry.faces.forEach(function(face) {
        face.vertexNormals = [
            face.normal.clone(),
            face.normal.clone(),
            face.normal.clone()
        ];

        face.vertexColors = [
            vertexColor.clone(),
            vertexColor.clone(),
            vertexColor.clone()
        ];
    });

    if (self.creaseAngle > 0.0) {
        computeVertexNormals(geometry.faces, Math.cos(self.creaseAngle));
    }

    if (appearance.texture &&
        self.textureCoordinates.length > 0 &&
        self.texCoordIndex.length > 0) {

        createUvVectors(
            geometry, 
            self.texCoordIndex, 
            self.textureCoordinates,
            appearance.texture
        );
    }

    return new THREE.Mesh(
        geometry,
        sceneLoader.createMaterial(appearance.getMaterialProperties(sceneLoader))
    );
};
X3d.IndexedLineSetNode = function(node) {
    X3d.GeometryNode.call(this, node);
};

X3d.IndexedLineSetNode.prototype = Object.create(X3d.GeometryNode.prototype);

X3d.IndexedLineSetNode.prototype.parse = function(sceneLoader) {
    var self = this,
        child,
        attribute;

    // console.log('parsing X3D indexed line set');

    attribute = self.node.attr('coordIndex');
    if (attribute) {
        self.coordIndex = self.parseIntArray(attribute);
    }

    attribute = this.node.attr('colorIndex');
    if (attribute) {
        self.colorIndex = self.parseIntArray(attribute);
    }

    self.node.children().each(function() {
        var childNode = $(this);

        try {
            child = sceneLoader.parseX3dNode(childNode);

            if (child instanceof X3d.CoordinateNode) {
                self.vertexCoordinates = child.coordinates;
            } else if (child instanceof X3d.ColorNode) {
                self.vertexColors = child.colors;
            }
        } catch (e) {
            throw e;
        }
    });

    return self;
};


X3d.IndexedLineSetNode.prototype.createMesh = function(appearance, sceneLoader) {
    var self = this,
        lines = new THREE.Object3D(),
        lineStripGeometry,
        lineStripLength = 0,
        lineStripCounter = 0,
        indexCounter = 0,
        colorIndex,
        materialProperties = {},
        finalizeLineStrip = function() {
            lines.add(new THREE.Line(
                lineStripGeometry,
                new THREE.LineBasicMaterial(materialProperties)
            ));

            lineStripLength = 0;
            lineStripCounter++;
        };

    // console.log("creating line strips...");


    if (self.colorIndex && self.vertexColors) {
        materialProperties.vertexColors = THREE.VertexColors;
    } else if (appearance.material && appearance.material.emissiveColor) {
        materialProperties.color = appearance.material.emissiveColor.getHex();
    } else {
        materialProperties.color = 0xffffff;
    }

    if (appearance.lineProperties && appearance.lineProperties.lineWidth) {
        materialProperties.linewidth = appearance.lineProperties.lineWidth;
    } else {
        materialProperties.linewidth = 1.0;
    }

    if (appearance.material &&
        appearance.material.transparency &&
        appearance.material.transparency > 0.0) {

        materialProperties.transparent = true;
        materialProperties.opacity = 1.0 - appearance.material.transparency;
    }


    self.coordIndex.forEach(function(index) {
        var vertexColor;

        if (index >= 0) {
            if (lineStripLength == 0) {
                lineStripGeometry = new THREE.Geometry();
                lineStripGeometry.vertices = [];
                lineStripGeometry.colors = [];
//              lineStripGeometry.colorsNeedUpdate = true;
            }

            lineStripGeometry.vertices.push(new THREE.Vector3(
                self.vertexCoordinates[index].x,
                self.vertexCoordinates[index].y,
                self.vertexCoordinates[index].z
            ));

            if (self.colorIndex && self.vertexColors) {
                colorIndex = self.colorIndex[indexCounter];

                vertexColor = new THREE.Color();
                vertexColor.setRGB(
                    self.vertexColors[colorIndex].r,
                    self.vertexColors[colorIndex].g,
                    self.vertexColors[colorIndex].b
                );

                lineStripGeometry.colors.push(vertexColor);
            }

            lineStripLength++;
        } else {
            if (lineStripLength > 0) {
                finalizeLineStrip();
            }
        }

        indexCounter++;
    });

    if (lineStripLength > 0) {
        finalizeLineStrip();
    }

    return lines;
};
X3d.LinePropertiesNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.LinePropertiesNode.prototype = Object.create(X3d.Node.prototype);

X3d.LinePropertiesNode.prototype.parse = function(sceneLoader) {
    var self = this,
        attribute,
        values;

    // console.log('parsing X3D line properties');

    attribute = this.node.attr('applied');
    if (attribute) {
        self.applied = (attribute == "TRUE");
    } else {
        self.applied = false;
    }

    attribute = this.node.attr('linetype');
    if (attribute) {
        values = this.parseIntArray(attribute);
        self.lineType = values[0];
    } else {
        self.lineType = 1;
    }

    attribute = this.node.attr('linewidthScaleFactor');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.lineWidth = Math.max(1.0, values[0]);
    } else {
        self.lineWidth = 1.0;
    }

    return self;
};
X3d.MaterialNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.MaterialNode.prototype = Object.create(X3d.Node.prototype);

X3d.MaterialNode.prototype.parse = function(sceneLoader) {
    var self = this,
        attribute,
        values;

    // console.log('parsing X3D material');

    attribute = this.node.attr('diffuseColor');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.diffuseColor = new THREE.Color();
        self.diffuseColor.setRGB(values[0], values[1], values[2]);
    }

    attribute = this.node.attr('specularColor');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.specularColor = new THREE.Color();
        self.specularColor.setRGB(values[0], values[1], values[2]);
    }

    attribute = this.node.attr('emissiveColor');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.emissiveColor = new THREE.Color();
        self.emissiveColor.setRGB(values[0], values[1], values[2]);
    }

    attribute = this.node.attr('ambientIntensity');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.ambientIntensity = values[0];
    }

    attribute = this.node.attr('shininess');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.shininess = values[0];
    }

    attribute = this.node.attr('transparency');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.transparency = values[0];
    }

    return self;
};
X3d.NavigationInfoNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.NavigationInfoNode.prototype = Object.create(X3d.Node.prototype);

X3d.NavigationInfoNode.prototype.parse = function(sceneLoader) {
    // @todo to be implemented
    // console.log('parsing X3D navigation info');

    return null;
};
X3d.PointLightNode = function(node) {
    X3d.LightNode.call(this, node);
};

X3d.PointLightNode.prototype = Object.create(X3d.LightNode.prototype);

X3d.PointLightNode.prototype.parse = function(sceneLoader) {
    var attribute,
        values, 
        light;

    // console.log('parsing X3D point light');

    this.parseBasicLightProperties(sceneLoader);

    attribute = this.node.attr('radius');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        this.distance = values[0];
    } else {
        this.distance = 0;
    }

    light = new THREE.PointLight(this.color.getHex(), this.intensity, this.distance);

    return light;
};
X3d.SceneNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.SceneNode.prototype = Object.create(X3d.Node.prototype);

X3d.SceneNode.prototype.parse = function(sceneLoader) {
    var scene = new THREE.Scene(),
        child;

    // console.log('parsing X3D scene');

    this.node.children().each(function () {
        try {
            child = sceneLoader.parseX3dNode($(this));
            if (child !== null) {
                scene.add(child);
            }
        } catch(e) {
            throw e;
        }
    });

    return scene;
};
X3d.ShapeNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.ShapeNode.prototype = Object.create(X3d.Node.prototype);

X3d.ShapeNode.prototype.parse = function(sceneLoader) {
    var child,
        appearance = {},
        geometryNodes = [],
        mesh = null;
        

    // console.log('parsing X3D shape');

    this.node.children().each(function() {
        try {
            child = sceneLoader.parseX3dNode($(this));

            if (child instanceof X3d.AppearanceNode) {
                appearance = child;
//                console.log('appearance: ' + JSON.stringify(appearance));
            } else if (child instanceof X3d.GeometryNode) {
                geometryNodes.push(child);
//                console.log('geometry node: ' + JSON.stringify(child));
            }
        } catch (e) {
            throw e;
        }
    });

    geometryNodes.forEach(function(geometryNode) {
        mesh = geometryNode.createMesh(appearance, sceneLoader);
    });

    return mesh;
};
X3d.SpotLightNode = function(node) {
    X3d.LightNode.call(this, node);
};

X3d.SpotLightNode.prototype = Object.create(X3d.LightNode.prototype);

X3d.SpotLightNode.prototype.parse = function(sceneLoader) {
    var attribute,
        values,
        light;

    // console.log('parsing X3D spot light');

    this.parseBasicLightProperties(sceneLoader);

    attribute = this.node.attr('location');
    if (attribute) {
        this.location = this.parseVector3(attribute);
    }

    attribute = this.node.attr('direction');
    if (attribute) {
        this.direction = this.parseVector3(attribute);
    }

    attribute = this.node.attr('radius');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        this.distance = values[0];
    }

    attribute = this.node.attr('beamWidth');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        this.beamWidth = values[0];
    }

    attribute = this.node.attr('cutOffAngle');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        this.angle = values[0];
    }

    attribute = this.node.attr('attenuation');
    if (attribute) {
        this.attenuation = this.parseFloatArray(attribute);
    }

    this.exponent = 1.0;

    light = new THREE.SpotLight(
        this.color.getHex(), 
        this.intensity, 
        this.distance,
        this.angle,
        this.exponent
    );

    light.position.copy(this.location);

    light.target.position.copy(this.location);
    light.target.position.add(this.direction);

//    console.log('spotlight node: ' + JSON.stringify(this));
//    console.log('spotlight target: ' + JSON.stringify(light.target.position));

    return light;
};
X3d.TextureCoordinateNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.TextureCoordinateNode.prototype = Object.create(X3d.Node.prototype);

X3d.TextureCoordinateNode.prototype.parse = function(sceneLoader) {
    var self = this,
        attribute;

    // console.log('parsing X3D texture coordinates');

    attribute = this.node.attr('point');
    if (attribute) {
        self.coordinates = this.parseVector2Array(attribute);
    } else {
        self.coordinates = [];
    }

    return self;
};
X3d.TextureTransformNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.TextureTransformNode.prototype = Object.create(X3d.Node.prototype);

X3d.TextureTransformNode.prototype.parse = function(sceneLoader) {
    var self = this,
        attribute,
        values;

    // console.log('parsing X3D texture transform');

    attribute = this.node.attr('translation');
    if (attribute) {
        self.transform = this.parseVector2(attribute);
    }

    attribute = this.node.attr('scale');
    if (attribute) {
        self.scale = this.parseVector2(attribute);
    }

    attribute = this.node.attr('rotation');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        self.rotation = values[0];
    }

    return self;
};
X3d.TransformNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.TransformNode.prototype = Object.create(X3d.Node.prototype);

X3d.TransformNode.prototype.parse = function(sceneLoader) {
    var self = this,
        object3d = new THREE.Object3D(),
        attribute,
        result,
        position,
        scale,
        quaternion,
        transformationMatrix;

    // console.log('parsing X3D transform ' + self.node.attr('DEF'));

    transformationMatrix = new THREE.Matrix4();

    attribute = self.node.attr('rotation');
    if (attribute) {
        result = this.parseFloatArray(attribute);
        quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(
            new THREE.Vector3(result[0], result[1], result[2]),
            result[3]
        );
        transformationMatrix.makeRotationFromQuaternion(quaternion);

//        console.log('rotation: ' + JSON.stringify(quaternion) + ', raw=' + JSON.stringify(result));
    } else {
        transformationMatrix.identity();
    }

    attribute = self.node.attr('scale');
    if (attribute) {
        scale = self.parseVector3(attribute);
        transformationMatrix.scale(scale);
//        console.log('scale: ' + JSON.stringify(scale));
    }

    attribute = self.node.attr('translation');
    if (attribute) {
        position = self.parseVector3(attribute);
        transformationMatrix.setPosition(position);
//        console.log('translation: ' + JSON.stringify(position));
    }

    this.node.children().each(function() {
        var child;

        try {
            child = sceneLoader.parseX3dNode($(this));

            if (child instanceof THREE.Camera) {
                X3d.transformObjectByMatrix(child, transformationMatrix);
                sceneLoader.sceneCamera = child;
            } else if (child instanceof THREE.Light) {
                X3d.transformObjectByMatrix(child, transformationMatrix);
                sceneLoader.lights.push(child);
            } else {
                object3d.add(child);
            }
        } catch (e) {
            throw e;
        }
    });

    if (object3d.children.length > 0) {
        object3d.applyMatrix(transformationMatrix);
    } else {
        object3d = null;
    }

    return object3d;
};
X3d.ViewpointNode = function(node) {
    X3d.Node.call(this, node);
};

X3d.ViewpointNode.prototype = Object.create(X3d.Node.prototype);

X3d.ViewpointNode.prototype.parse = function(node) {
    var camera,
        attribute,
        values,
        fieldOfView;

    // console.log('parsing X3D viewpoint (camera)');

    attribute = this.node.attr('fieldOfView');
    if (attribute) {
        values = this.parseFloatArray(attribute);
        fieldOfView = 180.0 * values[0] / Math.PI;
    } else {
        fieldOfView = 45.0;
    }

    camera = new THREE.PerspectiveCamera(fieldOfView, 4 / 3, 0.1, 1000);

    return camera;
};
