/*
  _____                                           _       _   _         ____           _           
 | ____|  _ __     ___   _ __    __ _   _   _    | |     (_) | |__     | __ )    ___  | |_    __ _ 
 |  _|   | '_ \   / _ \ | '__|  / _` | | | | |   | |     | | | '_ \    |  _ \   / _ \ | __|  / _` |
 | |___  | | | | |  __/ | |    | (_| | | |_| |   | |___  | | | |_) |   | |_) | |  __/ | |_  | (_| |
 |_____| |_| |_|  \___| |_|     \__, |  \__, |   |_____| |_| |_.__/    |____/   \___|  \__|  \__,_|
                                |___/   |___/                                                      
*/

var libconfig = new Config(FileTools.workdir + "config-EnergyLibCore.json");

libconfig.checkAndRestore({
    performance: {
        lazy_web_rebuild: false
    },
    util: {
        logger_tag: "ENERGY_LIB"
    }
});

var LOGGER_TAG = libconfig.access("util.logger_tag");

if (getCoreAPILevel() >= 8) {
    Logger.Log("API Level check successful", LOGGER_TAG);
}
else {
    Logger.Log("API Level check failed: required=8 current=" + getCoreAPILevel(), LOGGER_TAG);
}

Translation.addTranslation("Energy", {ru: "Энергия"});



var EnergyLibCore = {
    getConfig: function() {
        return libconfig;
    }
}




function EnergyType(name) {
    this.name = name;
    
    this.value = 1;
    
    this.wireIds = {};
    
    this.getWireSpecialType = function() {
        return null; // method is no longer supported
    }
    
    this.registerWire = function(id) {
        this.wireIds[id] = true;
        EnergyTypeRegistry.wireIds[id] = true;
    }
    
    this.toString = function() {
        return "[EnergyType name=" + this.name + " value=" + this.value + " wire=" + this.wireId + "]";
    }
}

var EnergyTypeRegistry = {
    energyTypes: {},
    
    /**
     * name - name of this energy type
     * value - value of one unit in [Eu] (Industrial Energy)
    */
    createEnergyType: function(name, value, wireParams) {
        if (this.energyTypes[name]) {
            alert("WARNING: dublicate energy types for name: " + name + "!");
            Logger.Log("dublicate energy types for name: " + name + "!", "ERROR");
        }
        
        var energyType = new EnergyType(name);
        energyType.value = value || 1;
    
        this.energyTypes[name] = energyType;
        
        return energyType;
    },
    
    assureEnergyType: function(name, value, wireParams) {
        if (this.getEnergyType(name)) {
            return this.getEnergyType(name);
        }
        else {
            return this.createEnergyType(name, value, wireParams);
        }
    },
    
    getEnergyType: function(name) {
        return this.energyTypes[name];
    },
    
    getValueRatio: function(name1, name2) {
        var type1 = this.getEnergyType(name1);
        var type2 = this.getEnergyType(name2);
        
        if (type1 && type2) {
            return type1.value / type2.value;
        }
        else {
            Logger.Log("get energy value ratio failed: some of this 2 energy types is not defiled: " + [name1, name2], "ERROR");
            return -1;
        }
    },
    
    
    
    wireIds: {},
    
    isWire: function(id, data) {
        return this.wireIds[id];
    },
    
    onWirePlaced: function() {
        EnergyWebBuilder.postWebRebuild();
    },
    
    onWireDestroyed: function() {
        EnergyWebBuilder.postWebRebuild();
    },
    
    registerWirePlaced: function() {
        this.onWirePlaced();
    }
}

Callback.addCallback("ItemUse", function(coords, item, block) {
    if (EnergyTypeRegistry.isWire(item.id, item.data)) {
        EnergyTypeRegistry.onWirePlaced();
    }
});

Callback.addCallback("DestroyBlock", function(coords, block) {
    if (EnergyTypeRegistry.isWire(block.id, block.data)) {
        EnergyTypeRegistry.onWireDestroyed();
    }
});


var EnergyTileRegistry = {
    /**
     * adds energy type for tile entity prototype
    */
    addEnergyType: function(Prototype, energyType) {
        if (!Prototype.__EnergyLibCoreInit) {
            this.setupInitialParams(Prototype);
        }
        
        Prototype.__energyTypes[energyType.name] = energyType;
    },
    
    /**
     * same as addEnergyType, but works on already created prototypes, accessing them by id
    */
    addEnergyTypeForId: function(id, energyType) {
        var Prototype = TileEntity.getPrototype(id);
        if (Prototype) {
            this.addEnergyType(Prototype, energyType);
        }
        else {
            Logger.Log("cannot add energy type no prototype defined for id " + id, "ERROR");
        }
    },
    
    setupInitialParams: function(Prototype) {
        Prototype.__EnergyLibCoreInit = true;
        
        Prototype.__energyWebs = {};
        Prototype.__energyTypes = {}; 
        
        if (!Prototype.energyReceive) {
            Prototype.energyReceive = function(type, src) {
                // called before energy tick, if some energy of this type exists in the web
            }
        }
        
        if (!Prototype.energyTick) {
            Prototype.energyTick = function(type, src) {
                // called for each energy web
            }
        } 
        
        Prototype.__init = Prototype.init || function() {};
        Prototype.__destroy = Prototype.destroy || function() {};
        Prototype.__tick = Prototype.tick || function() {};
        
        Prototype.isGenerator = Prototype.isGenerator || function() {
            return false;
        };
        
        Prototype.init = function() {
            EnergyTileRegistry.addMacineAccessAtCoords(this.x, this.y, this.z, this);
            
            this.__energyWebs = {};
            
            this.__init();
        }
        
        Prototype.destroy = function() {
            EnergyTileRegistry.removeMachineAccessAtCoords(this.x, this.y, this.z);
        
            EnergyWebBuilder.postWebRebuild();
            
            this.__destroy();
        }
        
        if (libconfig.access("performance.lazy_web_rebuild")) {
            Prototype.tick = function() {
                if (World.getThreadTime() % 30 == 0) {
                    for (var name in this.__energyTypes) {
                        var web = this.__energyWebs[name];
                        if (!web) {
                            web = EnergyWebBuilder.buildFor(this, this.__energyTypes[name]);
                        }
                    }
                }
                
                for (var name in this.__energyTypes) {
                    var web = this.__energyWebs[name];
                    if (!web) {
                        continue;
                    }
                    var src = web.source;
                    if (src.any()) {
                        this.energyReceive(name, src);
                    }
                    this.energyTick(name, src);
                }
                
                this.__tick();
            }
        }
        else {
            Prototype.tick = function() {
                for (var name in this.__energyTypes) {
                    var web = this.__energyWebs[name];
                    if (!web) {
                        web = EnergyWebBuilder.buildFor(this, this.__energyTypes[name]);
                    }
                    var src = web.source;
                    if (src.any()) {
                        this.energyReceive(name, src);
                    }
                    this.energyTick(name, src);
                }
                
                this.__tick();
            }
        }
    },



    /* machine is tile entity, that uses energy */
    machineIDs: {},
    
    isMachine: function(id){
        return this.machineIDs[id];
    },
    
    quickCoordAccess: {},
    
    addMacineAccessAtCoords: function(x, y, z, machine){
        this.quickCoordAccess[x + ":" + y + ":" + z] = machine;
    },
    
    removeMachineAccessAtCoords: function(x, y, z){
        delete this.quickCoordAccess[x + ":" + y + ":" + z];
    },
    
    accessMachineAtCoords: function(x, y, z){
        return this.quickCoordAccess[x + ":" + y + ":" + z];
    },
    
    executeForAll: function(func){
        for (var key in this.quickCoordAccess){
            var mech = this.quickCoordAccess[key];
            if (mech){
                func(mech);
            }
        }
    },
};

Callback.addCallback("LevelLoaded", function(){
    EnergyTileRegistry.quickCoordAccess = {};
});


var EnergyWebBuilder = {
    
    buildFor: function(tileEntity, type){
        var web = new EnergyWeb(type);
        
        this.rebuildRecursive(web, type.wireIds, tileEntity.x, tileEntity.y, tileEntity.z, {});
        
        this.addEnergyWeb(web);
        return web;
    },
    
    energyWebs: [],
    addEnergyWeb: function(web) {
        this.energyWebs.push(web);
    },
    
    removeEnergyWeb: function(web) {
        for (var i in this.energyWebs) {
            if (this.energyWebs[i] == web) {
                this.energyWebs.splice(i--, 1);
            }
        }
    },
    
    tickEnergyWebs: function() {
        for (var i in this.energyWebs) {
            this.energyWebs[i].tick();
        }
    },
    
    rebuildRecursive: function(web, wireIds, x, y, z, explored){
        var coordKey = x + ":" + y + ":" + z;
        if (explored[coordKey]){
            return;
        }
        else{
            explored[coordKey] = true;
        }
        
        var tileEntity = EnergyTileRegistry.accessMachineAtCoords(x, y, z);
        if (tileEntity && tileEntity.__energyTypes[web.energyName]){
            web.addTileEntity(tileEntity);
            this.rebuildFor6Sides(web, wireIds, x, y, z, explored);
        }
        else {
            var tile = World.getBlockID(x, y, z);
            if (wireIds[tile]){
                this.rebuildFor6Sides(web, wireIds, x, y, z, explored);
            }
            else {
                return;
            }
        }
    },
    
    rebuildFor6Sides: function(web, wireIds, x, y, z, explored){
        this.rebuildRecursive(web, wireIds, x - 1, y, z, explored);
        this.rebuildRecursive(web, wireIds, x + 1, y, z, explored);
        this.rebuildRecursive(web, wireIds, x, y - 1, z, explored);
        this.rebuildRecursive(web, wireIds, x, y + 1, z, explored);
        this.rebuildRecursive(web, wireIds, x, y, z - 1, explored);
        this.rebuildRecursive(web, wireIds, x, y, z + 1, explored);
    },
    
    postedRebuildTimer: 0,
    
    clearWebData: function(){
        for (var i in this.energyWebs) {
            this.energyWebs[i].remove = true;
        }
        this.energyWebs = [];
        EnergyTileRegistry.executeForAll(function(tileEntity){
            tileEntity.__energyWebs = {};
        });
    },
    
    postWebRebuild: function(delay){
        this.postedRebuildTimer = delay || 60;
    }
}

Callback.addCallback("LevelLoaded", function() {
    EnergyWebBuilder.energyWebs = [];
});

Callback.addCallback("tick", function(){
    if (EnergyWebBuilder.postedRebuildTimer > 0){
        EnergyWebBuilder.postedRebuildTimer--;
        if (EnergyWebBuilder.postedRebuildTimer <= 0){
            EnergyWebBuilder.clearWebData();
        }
    }
    EnergyWebBuilder.tickEnergyWebs();
});


var GLOBAL_WEB_ID = 0;

function EnergyWeb(energyType) {
    this.energyType = energyType;
    this.energyName = energyType.name;
    
    this.releaseAmount = 0;
    this.receivedAmount = 0;
    this.retreivedAmount = 0;
    
    this.avaibleAmount = 0;
    this.lastInAmount = 0;
    this.lastOutAmount = 0;
    
    this.currPotentialInAmount = 0;
    this.lastPotentialInAmount = 0;
    this.currPotentialOutAmount = 0;
    this.lastPotentialOutAmount = 0;
    
    this.webId = GLOBAL_WEB_ID++;
    
    this.minTransportAmount = 16;
    
    var self = this;
    this.source = {
        parent: function() {
            return self;
        },
        
        amount: function() {
            return self.releaseAmount;
        },
        
        any: function() {
            return self.releaseAmount > 0;
        },
        
        get: function(amount, doNotRegister) {
            var got = Math.min(self.releaseAmount, Math.min(self.avaibleAmount / Math.max(self.consumerCount, 1), amount));
            self.releaseAmount -= got;
            self.retreivedAmount += got;
            if (!doNotRegister) {
                self.currPotentialOutAmount += amount;
            }
            return got;
        },
        
        getAll: function(amount, doNotRegister) {
            var got = Math.min(self.releaseAmount, amount);
            self.releaseAmount -= got;
            self.retreivedAmount += got;
            if (!doNotRegister) {
                self.currPotentialOutAmount += amount;
            }
            return got;
        },
        
        add: function(amount, doNotRegister) {
            var add = Math.min(amount, this.free());
            self.receivedAmount += add;
            if (!doNotRegister) {
                self.currPotentialInAmount += amount;
            }
            return amount - add;
        },
        
        addAll: function(amount, doNotRegister) {
            var lastMinAmount = self.minTransportAmount;
            self.minTransportAmount = amount;
            var left = this.add(amount, doNotRegister);
            self.minTransportAmount = lastMinAmount;
            return left;
        },
        
        storage: function(amountReceive, amountRetreive) {
            if (self.lastPotentialInAmount > self.lastPotentialOutAmount) {
                var got = this.getAll(Math.min(amountReceive, self.lastPotentialInAmount - self.lastPotentialOutAmount), true);
                return got;
            }
            else {
                var left = this.add(amountRetreive, true);
                return left - amountRetreive;
            }
            
            return 0;
        },
        
        free: function() {
            return Math.max((self.lastOutAmount + self.minTransportAmount) - (self.receivedAmount + self.releaseAmount), 0);
        }
    }
    
    this.consumerCount = 0;
    this.generatorCount = 0;
    this.calcAmount = function() {
        this.consumerCount = 0;
        this.generatorCount = 0;
    
        for (var i in this.tileEntities) {
            var tileEntity = this.tileEntities[i];
            if (tileEntity.isGenerator()) {
                this.generatorCount++;
            }
            else {
                this.consumerCount++;
            }
        }
    }
    
    this.tileEntities = [];
    this.addTileEntity = function(tileEntity) {
        if (!tileEntity.__energyWebs) {
            tileEntity.__energyWebs = {};
        }
        if (tileEntity.__energyWebs[this.energyName]) {
            tileEntity.__energyWebs[this.energyName].removeTileEntity(tileEntity);
        }
        
        this.tileEntities.push(tileEntity);
        tileEntity.__energyWebs[this.energyName] = this;
        
        if (tileEntity.isGenerator()) {
            this.generatorCount++;
        }
        else {
            this.consumerCount++;
        }
    }
    
    this.removeTileEntity = function(tileEntity) {
        for (var i in this.tileEntities) {
            if (this.tileEntities[i] == tileEntity) {
                tileEntity.__energyWebs[this.energyName] = null;
                this.tileEntities.splice(i--, 1);
            }
        }
        
        this.calcAmount();
    }
    
    
    this.toString = function() {
        var r = function(x) {return Math.round(x * 10) / 10};
        return "[EnergyWeb id=" + this.webId + " type=" + this.energyName + " units=" + this.tileEntities.length + " | stored=" + r(this.releaseAmount) + " in=" + r(this.lastInAmount) + "(" + r(this.lastPotentialInAmount) + ")" + " out=" + r(this.lastOutAmount)  + "(" + r(this.lastPotentialOutAmount) + ")" + "]";
    }
    
    
    
    this.tick = function() {
        if (this.tileEntities.length == 0) {
            EnergyWebBuilder.removeEnergyWeb(this);
            return;
        }
        
        this.isOverfilling = this.releaseAmount > 0;
        
        this.lastInAmount = this.receivedAmount;
        this.lastOutAmount = this.retreivedAmount;
        this.lastPotentialInAmount = this.currPotentialInAmount;
        this.lastPotentialOutAmount = this.currPotentialOutAmount;
        this.currPotentialInAmount = 0;
        this.currPotentialOutAmount = 0;
        
        this.releaseAmount += this.receivedAmount;
        this.avaibleAmount = this.releaseAmount;
        this.receivedAmount = 0;
        this.retreivedAmount = 0;
    }
}

var Flags = {
	allFlags: {},
	
	addFlag: function(name) {
		if (this.allFlags[name]) {
			return true;
		}
		else {
			this.allFlags[name] = true;
			return false;
		}
	},
	
	getFlag: function(name) {
		return this.allFlags[name] ? true : false;
	},
	
	addUniqueAction: function(name, action) {
		if (!this.addFlag(name)) {
			action();
		}
	},
	
	assertFlag: function(name) {
		if (!this.getFlag(name)) {
			Logger.Log("Assertion failed: flag '" + name + "' does not exist", "ERROR");
		}
	}
};

var ToolType = {
	sword: {
		isWeapon: true,
		enchantType: Native.EnchantType.weapon,
		damage: 4,
		blockTypes: ["fibre", "plant"],
		onAttack: function(item){
			if(item.data > Item.getMaxDamage(item.id)){
				item.id = item.data = item.count = 0;
			}
		},
		calcDestroyTime: function(item, coords, block, params, destroyTime, enchant){
			if(block.id==30){return 0.08;}
			if(block.id==35){return 0.05;}
			var material = ToolAPI.getBlockMaterial(block.id) || {};
			if(material.name=="fibre" || material.name=="plant"){
				return params.base/1.5;
			}
			return destroyTime;
		}
	},
	
	shovel: {
		enchantType: Native.EnchantType.shovel,
		damage: 2,
		blockTypes: ["dirt"],
		onAttack: function(item){
			if(item.data > Item.getMaxDamage(item.id)){
				item.id = item.data = item.count = 0;
			}
		},
		useItem: function(coords, item, block){
			if(block.id==2&&coords.side==1){ 
				World.setBlock(coords.x, coords.y, coords.z, 198);
				World.playSoundAtEntity(Player.get(), "step.grass", 0.5, 0.75);
				ToolAPI.breakCarriedTool(1);
			}
		}
	},
	
	pickaxe: {
		enchantType: Native.EnchantType.pickaxe,
		damage: 2,
		blockTypes: ["stone"],
		onAttack: function(item){
			if(item.data > Item.getMaxDamage(item.id)){
				item.id = item.data = item.count = 0;
			}
		}
	},
	
	axe: {
		enchantType: Native.EnchantType.axe,
		damage: 3,
		blockTypes: ["wood"],
		onAttack: function(item){
			if(item.data > Item.getMaxDamage(item.id)){
				item.id = item.data = item.count = 0;
			}
		}
	},
	
	hoe: {
		useItem: function(coords, item, block){
			if((block.id==2 || block.id==3) && coords.side==1){ 
				World.setBlock(coords.x, coords.y, coords.z, 60);
				World.playSoundAtEntity(Player.get(), "step.grass", 0.5, 0.75);
				ToolAPI.breakCarriedTool(1);
			}
		}
	}
}

Player.getCarriedItem = ModAPI.requireGlobal("Player.getCarriedItem");

ToolAPI.breakCarriedTool = function(damage){
	var item = Player.getCarriedItem(true);
	item.data += damage;
	if(item.data > Item.getMaxDamage(item.id)){
		item.id = 0;
	}
	Player.setCarriedItem(item.id, item.count, item.data, item.enchant);
}

ToolAPI.setTool = function(id, toolMaterial, toolType, brokenId){
	Item.setToolRender(id, true);
	toolMaterial = ToolAPI.toolMaterials[toolMaterial] || toolMaterial;
	if(toolType.blockTypes){
		toolProperties = {brokenId: brokenId || 0};
		for(var i in toolType){
		toolProperties[i] = toolType[i];}
		if(!toolMaterial.durability){
			var maxDmg = Item.getMaxDamage(id)
			toolMaterial.durability = maxDmg;
		}
		ToolAPI.registerTool(id, toolMaterial, toolType.blockTypes, toolProperties);
	}
	else{
		Item.setMaxDamage(id, toolMaterial.durability);
	}
	if(toolType.enchantType){
		Item.setEnchantType(id, toolType.enchantType, toolMaterial.enchantability);
	}
	if(toolType.useItem){
		Item.registerUseFunctionForID(id, toolType.useItem);
	}
	if(toolType.destroyBlock){
		Callback.addCallback("DestroyBlock", function(coords, block, player){
			var item = Player.getCarriedItem();
			if(item.id == id){
				toolType.destroyBlock(coords, coords.side, item, block);
			}
		});
	}
}

var MachineRenderer = {
	data: {},
	
	setStandartModel: function(id, texture, rotation){
		if(rotation){
			var textures = [
				[texture[0], texture[1], texture[2], texture[3], texture[4], texture[5]],
				[texture[0], texture[1], texture[3], texture[2], texture[5], texture[4]],
				[texture[0], texture[1], texture[5], texture[4], texture[2], texture[3]],
				[texture[0], texture[1], texture[4], texture[5], texture[3], texture[2]]
			]
			for(var i = 0; i < 4; i++){
				var render = new ICRender.Model();
				var model = BlockRenderer.createTexturedBlock(textures[i]);
				render.addEntry(model);
				BlockRenderer.enableCoordMapping(id, i, render);
			}
		}else{
			var render = new ICRender.Model();
			var model = BlockRenderer.createTexturedBlock(texture);
			render.addEntry(model);
			BlockRenderer.enableCoordMapping(id, -1, render);
		}
	},
	
	registerRenderModel: function(id, data, texture){
		var render = new ICRender.Model();
		var model = BlockRenderer.createTexturedBlock(texture);
		render.addEntry(model);
		this.data[id] = {};
		this.data[id][data] = render;
	},
	
	registerModelWithRotation: function(id, texture){
		this.data[id] = {};
		var textures = [
			[texture[0], texture[1], texture[2], texture[3], texture[4], texture[5]],
			[texture[0], texture[1], texture[3], texture[2], texture[5], texture[4]],
			[texture[0], texture[1], texture[5], texture[4], texture[2], texture[3]],
			[texture[0], texture[1], texture[4], texture[5], texture[3], texture[2]]
		]
		for(var i = 0; i < 4; i++){
			this.registerRenderModel(id, i, textures[i])
		}
	},
	
	getRenderModel: function(id, data){
		var models = this.data[id];
		if(models){
			return models[data];
		}
		return 0;
	},
	
	mapAtCoords: function(x, y, z, id, data){
		var model = this.getRenderModel(id, data);
		if(model){
			BlockRenderer.mapAtCoords(x, y, z, model);
		}
	}
}
var EU = EnergyTypeRegistry.assureEnergyType("Eu", 1);

var MachineRegistry = {
	machineIDs: {},

	isMachine: function(id){
		return this.machineIDs[id];
	},

	registerPrototype: function(id, Prototype, notUseEU){
		// register ID
		this.machineIDs[id] = true;
		/*
		Prototype.click = function(id, count, data, coords){
			if(id==ItemID.wrench || id==ItemID.electricWrench){
				return true;
			}
		}
		*/
		if(!notUseEU){
			// wire connection
			ICRender.getGroup("ic-wire").add(id, -1);
			// setup energy value
			if (Prototype.defaultValues){
				Prototype.defaultValues.energy = 0;
			}
			else{
				Prototype.defaultValues = {
					energy: 0
				};
			}
			// copy functions
			if(!Prototype.getEnergyStorage){
				Prototype.getEnergyStorage = function(){
					return 0;
				};
			}
		}
		ToolAPI.registerBlockMaterial(id, "stone", 1);
		Block.setDestroyTime(id, 3);
		TileEntity.registerPrototype(id, Prototype);
		
		if(!notUseEU){
			// register for energy net
			EnergyTileRegistry.addEnergyTypeForId(id, EU);
		}
	},

	// standart functions
	getMachineDrop: function(coords, blockID, level, standartDrop){
		BlockRenderer.unmapAtCoords(coords.x, coords.y, coords.z);
		var item = Player.getCarriedItem();
		if(item.id==ItemID.wrench){
			ToolAPI.breakCarriedTool(10);
			World.setBlock(coords.x, coords.y, coords.z, 0);
			if(Math.random() < 0.8){return [[blockID, 1, 0]];}
			return [[standartDrop || blockID, 1, 0]];
		}
		if(item.id==ItemID.electricWrench && item.data + 500 <= Item.getMaxDamage(item.id)){
			Player.setCarriedItem(item.id, 1, item.data + 500);
			World.setBlock(coords.x, coords.y, coords.z, 0);
			return [[blockID, 1, 0]];
		}
		if(level >= ToolAPI.getBlockDestroyLevel(blockID)){
			return [[standartDrop || blockID, 1, 0]];
		}
		return [];
	},
	/*
	create6sidesRender: function(id, texture){
		this.data[id] = {};
		if(texture.length == 2){
			var textures = [
				[texture[1], texture[0], texture[0], texture[0], texture[0], texture[0]],
				[texture[0], texture[1], texture[0], texture[0], texture[0], texture[0]],
				[texture[0], texture[0], texture[1], texture[0], texture[0], texture[0]],
				[texture[0], texture[0], texture[0], texture[1], texture[0], texture[0]],
				[texture[0], texture[0], texture[0], texture[0], texture[1], texture[0]],
				[texture[0], texture[0], texture[0], texture[0], texture[0], texture[1]]
			]
		}
		for(var i = 0; i < 5; i++){
			this.registerRenderModel(id, i, textures[i])
		}
	},
	*/
	initModel: function(){
		if(this.data.isActive){
			var block = World.getBlock(this.x, this.y, this.z);
			MachineRenderer.mapAtCoords(this.x, this.y, this.z, block.id, block.data);
		}
	},
	
	activateMachine: function(){
		if(!this.data.isActive){
			this.data.isActive = true;
			var block = World.getBlock(this.x, this.y, this.z);
			MachineRenderer.mapAtCoords(this.x, this.y, this.z, block.id, block.data);
		}
	},
	
	deactivateMachine: function(){
		if(this.data.isActive){
			this.data.isActive = false;
			BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
		}
	},
	
	basicEnergyReceiveFunc: function(type, src){
		var energyNeed = this.getEnergyStorage() - this.data.energy;
		this.data.energy += src.getAll(energyNeed);
	},
	
	isValidEUItem: function(id, count, data, container){
		var level = container.tileEntity.data.power_tier || 0;
		return ChargeItemRegistry.isValidItem(id, "Eu",  level);
	},
	
	isValidEUStorage: function(id, count, data, container){
		var level = container.tileEntity.data.power_tier || 0;
		return ChargeItemRegistry.isValidStorage(id, "Eu",  level);
	},
}

var transferByTier = {
	0: 32,
	1:  256,
	2: 2048,
	3: 8192
}

var ChargeItemRegistry = {
	chargeData: {},
	
	registerItem: function(item, energyType, capacity, level, isEnergyStorage){
		Item.setMaxDamage(item, capacity + 1);
		this.chargeData[item] = {
			type: "normal",
			energy: energyType,
			id: item,
			level: level || 0,
			maxCharge: capacity,
			maxDamage: capacity + 1,
			isEnergyStorage: isEnergyStorage
		};
	},
	getMaxCharge: function(id){
		return this.chargeData[id].maxCharge;
	},
	registerFlashItem: function(item, energyType, amount, level){
		this.chargeData[item] = {
			type: "flash",
			id: item,
			level: level || 0,
			energy: energyType,
			amount: amount,
			isEnergyStorage: true
		};
	},
	
	getItemData: function(id){
		return this.chargeData[id];
	},
	
	isFlashStorage: function(id){
		var data = this.getItemData(id);
		return (data && data.type == "flash");
	},
	
	isValidItem: function(id, energy, level){
		var data = this.getItemData(id);
		return (data && data.type == "normal" && data.energy == energy && data.level <= level || id == ItemID.debugItem);
	},
	
	isValidStorage: function(id, energy, level){
		var data = this.getItemData(id);
		return (data && data.isEnergyStorage && data.energy == energy && data.level <= level || id == ItemID.debugItem);
	},
	
	getEnergyStored: function(item, energy){
		var data = this.getItemData(item.id);
		if(!data || energy && data.energy != energy){
			return 0;
		}
		return Math.min(data.maxDamage - item.data, data.maxCharge);
	},
	
	getEnergyFrom: function(item, energyType, amount, transf, level, getFromAll){
		if(item.id==ItemID.debugItem){
			return amount;
		}
		
		level = level || 0;
		var data = this.getItemData(item.id);
		if(!data || data.energy != energyType || data.level > level || !getFromAll && !data.isEnergyStorage){
			return 0;
		}
		if(data.type == "flash"){
			if(amount < 1){
				return 0;
			}
			item.count--;
			if(item.count < 1){
				item.id = item.data = 0;
			}
			return data.amount;
		}
		
		if(item.data < 1){
			item.data = 1;
		}
		
		var energyGot = Math.min(amount, Math.min(data.maxDamage - item.data, transf));
		item.data += energyGot;
		return energyGot;
	},
	
	addEnergyTo: function(item, energyType, amount, transf, level){
		if(item.id==ItemID.debugItem){
			return amount;
		}
		
		level = level || 0;
		if(!this.isValidItem(item.id, energyType, level)){
			return 0;
		}
		
		var energyAdd = Math.min(amount, Math.min(item.data - 1, transf));
		item.data -= energyAdd;
		return energyAdd;
	},
	
	transportEnergy: function(api, field, result){
		var data = ChargeItemRegistry.getItemData(result.id);
		var amount = 0;
		for(var i in field){
			if(!ChargeItemRegistry.isFlashStorage(field[i].id)){
				amount += ChargeItemRegistry.getEnergyFrom(field[i], data.energy, data.maxCharge, data.maxCharge, 100, true);
			}
			api.decreaseFieldSlot(i);
		}
		ChargeItemRegistry.addEnergyTo(result, data.energy, amount, amount, 100);
	}
}
EXPORT("MachineRenderer", MachineRenderer);
EXPORT("ChargeItemRegistry", ChargeItemRegistry);
EXPORT("MachineRegistry", MachineRegistry);
EXPORT("ToolType", ToolType);
EXPORT("Flags", Flags);
EXPORT("EnergyLibCore", EnergyLibCore);
EXPORT("EnergyTypeRegistry", EnergyTypeRegistry);
EXPORT("EnergyTileRegistry", EnergyTileRegistry);



















