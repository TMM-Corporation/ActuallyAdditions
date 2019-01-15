
function AnimationBase(x, y, z) {
    this.render = null;
    Saver.registerObject(this, nonSavesObjectSaver);
    this.setPos = function (x, y, z) {
        this.coords = {x: x, y: y, z: z};
        if (this.render) {
            this.render.setPos(x, y, z);
        }
    };
    this.setPos(x, y, z);
    this.description = {};
    this.createRenderIfNeeded = function () {
        if (!this.description) {
            return;
        }
        if (!this.render) {
            if (this.description.render) {
                this.render = StaticRenderer.createStaticRenderer(this.description.render, this.coords.x, this.coords.y, this.coords.z);
            }
        }
        if (this.render) {
            if (this.description.skin) {
                this.render.setSkin(this.description.skin);
            }
            if (this.description.scale) {
                this.render.setScale(this.description.scale);
            }
            if (this.description.render) {
                this.render.setRenderer(this.description.render);
            }
        }
    };
    this.isLoaded = false;
    this.updateRender = function () {
        if (this.isLoaded) {
            this.createRenderIfNeeded();
        } else {
            if (this.render) {
                this.render.remove();
                this.render = null;
            }
        }
    };
    this.load = function () {
        this.remove = false;
        this.isLoaded = true;
        this.updateRender();
    };
    this.loadCustom = function (func) {
        this.load();
        this.update = func;
        Updatable.addUpdatable(this);
    };
    this.getAge = function () {
        return 0;
    };
    this.refresh = function () {
        this.updateRender();
    };
    this.describe = function (description) {
        for (var name in description) {
            this.description[name] = description[name];
        }
        this.updateRender();
    };
    this.getRenderAPI = function (base) {
        if (!this.description.renderAPI) {
            this.description.renderAPI = new RenderAPI(base);
        }
        return this.description.renderAPI;
    };
    this.destroy = function () {
        this.remove = true;
        this.isLoaded = false;
        this.updateRender();
    };
}
zhekasmirnov.launcher.api.NativeStaticRenderer@f81732e

function (x, y, z) {
    this.coords = {x: x, y: y, z: z};
    if (this.render) {
        this.render.setPos(x, y, z);
    }
}
[object Object]
[object Object]

function () {
    if (!this.description) {
        return;
    }
    if (!this.render) {
        if (this.description.render) {
            this.render = StaticRenderer.createStaticRenderer(this.description.render, this.coords.x, this.coords.y, this.coords.z);
        }
    }
    if (this.render) {
        if (this.description.skin) {
            this.render.setSkin(this.description.skin);
        }
        if (this.description.scale) {
            this.render.setScale(this.description.scale);
        }
        if (this.description.render) {
            this.render.setRenderer(this.description.render);
        }
    }
}
true

function () {
    if (this.isLoaded) {
        this.createRenderIfNeeded();
    } else {
        if (this.render) {
            this.render.remove();
            this.render = null;
        }
    }
}

function () {
    this.remove = false;
    this.isLoaded = true;
    this.updateRender();
}

function (func) {
    this.load();
    this.update = func;
    Updatable.addUpdatable(this);
}

function () {
    return 0;
}

function () {
    this.updateRender();
}

function (description) {
    for (var name in description) {
        this.description[name] = description[name];
    }
    this.updateRender();
}

function (base) {
    if (!this.description.renderAPI) {
        this.description.renderAPI = new RenderAPI(base);
    }
    return this.description.renderAPI;
}

function () {
    this.remove = true;
    this.isLoaded = false;
    this.updateRender();
}

function (item) {
    if (!item.size) {
        item.size = 0.5;
    }
    var stateName = "_i" + item.id + "|" + item.count + "|" + item.data + "|" + item.size + "|" + item.rotation + "|" + !item.notRandomize;
    var rotation = item.rotation;
    if (!rotation || typeof (rotation) == "string") {
        rotation = [0, 0, 0];
        if (rotation == "x") {
            rotation = [0, 0, Math.PI / 2];
        }
        if (rotation == "z") {
            rotation = [Math.PI / 2, 0, 0];
        }
    }
    var itemModel = Renderer.getItemModel(item.id, item.count, item.data, item.size, rotation[0], rotation[1], rotation[2], !item.notRandomize);
    if (itemModel != null) {
        this.describe({render: itemModel.getRenderType()});
    }
}

function (item, offset) {
    if (!item.size) {
        item.size = 0.5;
    }
    var render = new RenderAPI({empty: true});
    var stateName = "__item" + item.id + "|" + item.count + "|" + item.data + "|" + item.size + "|" + item.rotation + "|" + !item.notRandomize;
    if (offset) {
        stateName += "|" + offset.x + "|" + offset.y + "|" + offset.z;
    } else {
        offset = {x: 0, y: 0, z: 0};
    }
    if (!render.loadState(stateName)) {
        render.createBasicModel();
        var model = [];
        var size = parseInt(item.size * 16);
        var addBox = function (z, rx, ry) {
            model.push({type: "box", uv: {x: 0, y: 0}, size: {x: size, y: size, z: 0}, coords: {x: rx + offset.x * 16, y: 25 + ry - offset.y * 16, z: z - offset.z * 16}});
        };
        var fract = Math.min(64, size);
        var width = size / 16;
        for (var z = 0; z < item.count; z++) {
            var randomX = 0, randomY = 0;
            if (z > 0 && !item.notRandomize) {
                randomX = Math.random() * 5 - 2.5;
                randomY = Math.random() * 5 - 2.5;
            }
            for (var f = 0; f <= width; f += width / fract) {
                addBox((z - 0.5 - item.count / 2) * width + f, randomX, randomY);
            }
        }
        render.setPart("body", model, {width: size, height: size});
        render.saveState(stateName);
    }
    this.describe({renderAPI: render, skin: ItemIconSource.getIconName(item.id, item.data)});
}

function (item) {
    if (!item.size) {
        item.size = 0.5;
    }
    var stateName = "_i" + item.id + "|" + item.count + "|" + item.data + "|" + item.size + "|" + item.rotation + "|" + !item.notRandomize;
    var rotation = item.rotation;
    if (!rotation || typeof (rotation) == "string") {
        rotation = [0, 0, 0];
        if (rotation == "x") {
            rotation = [0, 0, Math.PI / 2];
        }
        if (rotation == "z") {
            rotation = [Math.PI / 2, 0, 0];
        }
    }
    var itemModel = Renderer.getItemModel(item.id, item.count, item.data, item.size, rotation[0], rotation[1], rotation[2], !item.notRandomize);
    if (itemModel != null) {
        this.describe({render: itemModel.getRenderType()});
    }
}

function () {
}
false




//new





[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]
[object Object]