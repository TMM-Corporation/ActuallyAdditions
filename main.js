/*
BUILD INFO:
  dir: dev
  target: main.js
  files: 39
*/



// file: core.js

IMPORT("flags");
IMPORT("ToolType");
IMPORT("energylib");
IMPORT("ChargeItem");
IMPORT("MachineRender");

var EU = EnergyTypeRegistry.assureEnergyType("Eu", 1);

var st_block = Block.createSpecialType({
 lightopacity: 15,
 destroytime: 3
});
var sdcard = android.os.Environment.getExternalStorageDirectory();

var sides = [{x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0}, {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0}, {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1}];
var animations = __config__.access("animations");
//IC2 Methods
Player.getArmorSlot = ModAPI.requireGlobal("Player.getArmorSlot");
Player.setArmorSlot = ModAPI.requireGlobal("Player.setArmorSlot");
var nativeDropItem = ModAPI.requireGlobal("Level.dropItem");
var MobEffect = Native.PotionEffect;
var Enchantment = Native.Enchantment;
var BlockSide = Native.BlockSide;
var EntityType = Native.EntityType;

// energy (Eu)
var EU = EnergyTypeRegistry.assureEnergyType("Eu", 1);

// API
var player;
Callback.addCallback("LevelLoaded", function(){
	debugMode = __config__.getBool("debug_mode");
	player = Player.get();
});

function random(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addShapelessRecipe(result, source){
	var ingredients = [];
	for(var i in source){
		var item = source[i];
		for(var n = 0; n < item.count; n++){
			ingredients.push(item);
		}
	}
	Recipes.addShapeless(result, ingredients);
}


var RARE_ITEM_NAME = function(item, name){
	return "�b" + name;
}

var ENERGY_ITEM_NAME = function(item, name){
	var energyStorage = Item.getMaxDamage(item.id) - 1;
	var energyStored = ChargeItemRegistry.getEnergyStored(item);
	if(energyStored==0){return name;}
	return name + "\n�7" + energyStored + "/" + energyStorage + " Eu";
}

var RARE_ENERGY_ITEM_NAME = function(item, name){
	var energyStorage = Item.getMaxDamage(item.id) - 1;
	var energyStored = ChargeItemRegistry.getEnergyStored(item);
	if(energyStored==0){return name;}
	return "�b" + name + "\n�7" + energyStored + "/" + energyStorage + " Eu";
}

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
		if(item.id==ItemID.wrenchBronze){
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
	
	create6sidesRender: function(id, texture){
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
			MachineRenderer.registerRenderModel(id, i, textures[i])
		}
	},
	
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




// file: empowerer_recipes.js

var ec = {
	erc: {
		item1: "redstone",
		item2: "brick",
		item3: "nether_brick",
		item4: "dye_red",
		center: "redstonia_crystal",
		block: "redstonia_crystal_block",
		results: {
			item: "empowered_redstonia_crystal",
			block: "empowered_redstonia_crystal_block"
		}
	},
	epc: {
		item1: "prismarine",
		item2: "prismarine",
		item3: "prismarine",
		item4: "dye_cyan",
		center: "palis_crystal",
		block: "palis_crystal_block",
		results: {
			item: "empowered_palis_crystal",
			block: "empowered_palis_crystal_block"
		}
	},
	edc: {
		item1: "clay",
		item2: "clay",
		item3: "clay_block",
		item4: "dye_light_blue",
		center: "diamond_crystal",
		block: "diamond_crystal_block",
		results: {
			item: "empowered_diamond_crystal",
			block: "empowered_diamond_crystal_block"
		}
	},
	eec: {
		item1: 4, //"cobblestone",
		item2: 1, //"stone",
		item3: 77, //"stone_button",
		item4: 351, //"dye_gray",
		center: ItemID.item_crystal_white,
		block: BlockID.block_crystal_white,
		results: {
			item: ItemID.item_empowered_crystal_white,
			block: BlockID.block_crystal_empowered_white
		}
	},
	evc: {
		item1: "stone",
		item2: "flint",
		item3: "dye_black",
		item4: "snowball",
		center: "void_crystal",
		block: "void_crystal_block",
		results: {
			item: "empowered_void_crystal",
			block: "empowered_void_crystal_block"
		}
	},
	ec: {
		item1: "slime_ball",
		item2: "sappling",
		item3: "grass",
		item4: "dye_lime",
		center: "emeraldic_crystal",
		block: "emeraldic_crystal_block",
		results: {
			item: "empowered_emeraldic_crystal",
			block: "empowered_emeraldic_crystal_block"
		}
	}
};

var bc = {
	erc: {
		item1: "redstone",
		item2: "brick",
		item3: "nether_brick",
		item4: "dye_red",
		center: "redstonia_crystal",
		block: "redstonia_crystal_block",
		results: {
			item: "empowered_redstonia_crystal",
			block: "empowered_redstonia_crystal_block"
		}
	},
	epc: {
		item1: "prismarine",
		item2: "prismarine",
		item3: "prismarine",
		item4: "dye_cyan",
		center: "palis_crystal",
		block: "palis_crystal_block",
		results: {
			item: "empowered_palis_crystal",
			block: "empowered_palis_crystal_block"
		}
	},
	edc: {
		item1: "clay",
		item2: "clay",
		item3: "clay_block",
		item4: "dye_light_blue",
		center: "diamond_crystal",
		block: "diamond_crystal_block",
		results: {
			item: "empowered_diamond_crystal",
			block: "empowered_diamond_crystal_block"
		}
	},
	eec: {
		item1: "cobblestone",
		item2: "stone",
		item3: "stone_button",
		item4: "dye_gray",
		center: "enori_crystal",
		block: "enori_crystal_block",
		results: {
			item: "empowered_enori_crystal",
			block: "empowered_enori_crystal_block"
		}
	},
	evc: {
		item1: "stone",
		item2: "flint",
		item3: "dye_black",
		item4: "snowball",
		center: "void_crystal",
		block: "void_crystal_block",
		results: {
			item: "empowered_void_crystal",
			block: "empowered_void_crystal_block"
		}
	},
	ec: {
		item1: "slime_ball",
		item2: "sappling",
		item3: "grass",
		item4: "dye_lime",
		center: "emeraldic_crystal",
		block: "emeraldic_crystal_block",
		results: {
			item: "empowered_emeraldic_crystal",
			block: "empowered_emeraldic_crystal_block"
		}
	}
};




// file: Api's/FileApi.js

var File = java.io.File;
var FileReader = java.io.FileReader;
var BufferedReader = java.io.BufferedReader;
var FOS = java.io.FileOutputStream;
var String = java.lang.String;
var StringBuilder = java.lang.StringBuilder;
var sdcard = android.os.Environment.getExternalStorageDirectory();
var FileAPI={
	select:function(dir,Name){
		return (new File(dir,Name));
	},
	createNewDir:function(dir, newDirName){
		return (new File(dir, newDirName).mkdir());
	},
	exists:function(file){
		return file.exist();
	},
	create:function(path, name){
		new File(path, name).createNewFile();
		return File;
	},
	deleteF:function(path){
		try{var filed = new java.io.File(path);
			if(filed.isDirectory()){
			var directoryFiles = filed.listFiles();
			for(var i in directoryFiles){
				FileAPI.deleteF(directoryFiles[i].getAbsolutePath());
			}
			filed.deleteF();
		}
			if(filed.isFile()){
			filed.deleteF();}
		}catch(e){
			print(e);
		}
	},
	read:function(selectedFile){
		var readed=(new BufferedReader(new FileReader(selectedFile)));
		var data=new StringBuilder();
		var string;
		while((string=readed.readLine())!=null){
			data.append(string);
			data.append('\n');
		}
		return data.toString();
	},
	readLine:function(selectedFile, line){
		var readT=new FileAPI.read(selectedFile);
		var lineArray=readT.split('\n');
		return lineArray[line-1];
	},
	write:function(selectedFile , text){
		FileAPI.rewrite(selectedFile,(new FileAPI.read(selectedFile)) + text);
	},
	rewrite:function(selectedFile, text){
		var writeFOS = new FOS(selectedFile);
		writeFOS.write(new String(text).getBytes());
	}
};
var context = UI.getContext();
var CurrentWindow;
var CurrentLayout;
function runAsGUI(f){
	context.runOnUiThread(new java.lang.Runnable({
		run: function(){
			try{
				f();
			}catch(e){
				alert(e);
			}
		}
	}));
}

/*
function closeAdv()
{
runAsGUI(function(){
if(CurrentWindow)
{
CurrentWindow.dismiss();
CurrentWindow = null;
}
});
}
function viewAdv()
{
runAsGUI(function()
{
CurrentLayout = new android.widget.LinearLayout(context);
CurrentLayout.setOrientation(android.widget.LinearLayout.VERTICAL);

var image = new android.widget.ImageView(context);
var sprite = android.graphics.BitmapFactory.decodeFile(__dir__+"adv.png");
image.setImageBitmap(sprite);
CurrentLayout.addView(image);
CurrentWindow = new android.widget.PopupWindow(CurrentLayout,android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT);
CurrentWindow.showAtLocation(context.getWindow().getDecorView(),android.view.Gravity.LEFT | android.view.Gravity.TOP,0,0); 
});
}*/




// file: Api's/canola.js

canolaLib = {
	addCanolaTo: function(x, y, z, amount, isOil){
		var tile = World.getTileEntity(x, y, z);
		//var getBlock = World.getBlock(x, y, z).id === block;
		var stored = this.getCanolaStored(x, y, z);
		var max = this.getMaxStored(x, y, z);
		if(tile.getCanola && amount<(max-stored)){
			tile.addCanola(amount, isOil);
			return amount;
		}else{return 0;}
	},
	getCanolaFrom: function(x, y, z, amount, isOil){
		if((this.getMaxStored(x, y, z)-this.getCanolaStored(x, y, z))>=amount)
		for(let i in sides){
			var tile = World.getTileEntity(x+sides[i].x, y+sides[i].y, z+sides[i].z);
			var getBlock = World.getBlock(x+sides[i].x, y+sides[i].y, z+sides[i].z).id === BlockID.block_canola_press;
			if(!getBlock)continue;
			var stored = this.getCanolaStored(x+sides[i].x, y+sides[i].y, z+sides[i].z);
			if(tile.getCanola && amount<=stored){
				return tile.getCanola(amount, isOil);
			}
		}
	},
	getCanolaStored: function(x, y, z){
		var tile = World.getTileEntity(x, y, z);
		if(tile.getCanolaStored){
			return tile.getCanolaStored();
		}
	},
	getMaxStored: function(x, y, z){
		var tile = World.getTileEntity(x, y, z);
		if(tile.getMaxStored){
			return tile.getMaxStored();
		}
	}
};




// file: Api's/setAnim.js


var setAnim = function(tile, item){
  //Game.message("(x: " + tile.x + ", y: " + tile.y + ", z: " + tile.z + ")");
  item.id && tile.anim.describeItem({
	id: item.id,
	data: item.data,
	count: 1,
	size: 0.5,
	rotation: [0, tile.data.time, 0],
  });
  tile.anim.load();
};




// file: ActuallyAdditions/liquid_registry.js

LiquidRegistry.registerLiquid("canola_oil", "Canola Oil", ["canola_s"]);
LiquidRegistry.registerItem("canola_oil", {id: 325, data: 0}, {id: ItemID.item_bucket_canola_oil, data: 0});

LiquidRegistry.registerLiquid("refined_canola_oil", "Regined Canola Oil", ["canola_refined_s"]);
LiquidRegistry.registerItem("refined_canola_oil", {id: 325, data: 0}, {id: ItemID.item_bucket_oil, data: 0});




// file: ActuallyAdditions/blocks/genBlockID.js

IDRegistry.genBlockID("block_atomic_reconstructor");
IDRegistry.genBlockID("block_bio_reactor");
IDRegistry.genBlockID("block_breaker");
IDRegistry.genBlockID("block_canola_press");
IDRegistry.genBlockID("block_coal_generator");
IDRegistry.genBlockID("block_crystal_black");
IDRegistry.genBlockID("block_crystal_blue");
IDRegistry.genBlockID("block_crystal_cluster");
IDRegistry.genBlockID("block_crystal_green");

IDRegistry.genBlockID("block_crystal_light_blue");
IDRegistry.genBlockID("block_crystal_red");
IDRegistry.genBlockID("block_crystal_white");
IDRegistry.genBlockID("block_directional_breaker");
IDRegistry.genBlockID("block_display_stand");
IDRegistry.genBlockID("block_dropper");
IDRegistry.genBlockID("block_empowerer");
IDRegistry.genBlockID("block_energizer");
IDRegistry.genBlockID("block_enervator");

IDRegistry.genBlockID("block_farmer");
IDRegistry.genBlockID("block_feeder");
IDRegistry.genBlockID("block_fermenting_barrel");
IDRegistry.genBlockID("block_fluid_collector");
IDRegistry.genBlockID("block_fluid_placer");
IDRegistry.genBlockID("block_furnace_double");

IDRegistry.genBlockID("block_giant_chest_large");
IDRegistry.genBlockID("block_giant_chest_medium");
IDRegistry.genBlockID("block_giant_chest");

IDRegistry.genBlockID("block_greenhouse_glass");
IDRegistry.genBlockID("block_grinder_double");
IDRegistry.genBlockID("block_grinder");
IDRegistry.genBlockID("block_heat_collector");
IDRegistry.genBlockID("block_inputter_advanced");
IDRegistry.genBlockID("block_inputter");
IDRegistry.genBlockID("block_item_distributor");
IDRegistry.genBlockID("block_item_repairer");

IDRegistry.genBlockID("block_item_viewer");
IDRegistry.genBlockID("block_lamp_powerer");
IDRegistry.genBlockID("block_lava_factory_controller");
IDRegistry.genBlockID("block_leaf_generator");
IDRegistry.genBlockID("block_miner");
IDRegistry.genBlockID("block_misc_black_quartz_chiseled");
IDRegistry.genBlockID("block_misc_black_quartz_pillar");
IDRegistry.genBlockID("block_misc_black_quartz");

IDRegistry.genBlockID("block_misc_charcoal");
IDRegistry.genBlockID("block_misc_ender_casing");
IDRegistry.genBlockID("block_misc_enderpearl");
IDRegistry.genBlockID("block_misc_iron_casing_snow");
IDRegistry.genBlockID("block_misc_iron_casing");
IDRegistry.genBlockID("block_misc_lava_factory_case");
IDRegistry.genBlockID("block_misc_wood_casing");
IDRegistry.genBlockID("block_oil_generator");

IDRegistry.genBlockID("block_phantom_breaker");
IDRegistry.genBlockID("block_phantom_energyface");
IDRegistry.genBlockID("block_phantom_liquiface");
IDRegistry.genBlockID("block_phantom_placer");
IDRegistry.genBlockID("block_phantom_redstoneface");
IDRegistry.genBlockID("block_phantomface_pumpkin");
IDRegistry.genBlockID("block_phantomface");
IDRegistry.genBlockID("block_placer");

IDRegistry.genBlockID("block_player_interface");
IDRegistry.genBlockID("block_ranged_collector");
IDRegistry.genBlockID("block_shock_absorber");
IDRegistry.genBlockID("block_treasure_chest");
IDRegistry.genBlockID("block_tiny_torch");
IDRegistry.genBlockID("block_xp_solidifier");




// file: ActuallyAdditions/blocks/createBlock.js

Block.createBlock("block_atomic_reconstructor", [{name: "Atomic Reconstructor", texture: [["block_battery_box", 0], ["block_atomic_reconstructor_top", 0], ["block_atomic_reconstructor", 0], ["block_atomic_reconstructor_front", 0], ["block_atomic_reconstructor", 0]], inCreative: true}]);
Block.createBlock("block_bio_reactor", [{name: "Bio Reactor", texture: [["block_bio_reactor", 0]], inCreative: true}], st_block);
Block.createBlock("block_breaker", [{name: "Breaker", texture: [["block_breaker_top", 0], ["block_breaker_top", 0], ["block_breaker_top", 0], ["block_breaker_front", 0], ["block_breaker", 0]], inCreative: true}], st_block);
Block.createBlock("block_canola_press", [{name: "Canola Press", texture: [["block_canola_press_top", 0], ["block_canola_press_top", 0], ["block_canola_press", 0]], inCreative: true}]);
Block.createBlock("block_coal_generator", [{name: "Coal Generator", texture: [["block_coal_generator_bottom", 0], ["block_coal_generator_top", 0], ["block_coal_generator_side", 0], ["block_coal_generator", 0], ["block_coal_generator_side", 0]], inCreative: true}]);
Block.createBlock("block_crystal_black", [{name: "Black Crystal", texture: [["block_crystal_black", 0]], inCreative: true}], st_block);
Block.createBlock("block_crystal_blue", [{name: "Blue Crystal", texture: [["block_crystal_blue", 0]], inCreative: true}], st_block);
Block.createBlock("block_crystal_cluster", [{name: "Cluster Crystal", texture: [["block_crystal_cluster", 0]], inCreative: true}], st_block);
Block.createBlock("block_crystal_green", [{name: "Green Crystal", texture: [["block_crystal_green", 0]], inCreative: true}], st_block);

Block.createBlock("block_crystal_light_blue", [{name: "Light Blue Crystal", texture: [["block_crystal_light_blue", 0]], inCreative: true}], st_block);
Block.createBlock("block_crystal_red", [{name: "Red Crystal", texture: [["block_crystal_red", 0]], inCreative: true}], st_block);
Block.createBlock("block_crystal_white", [{name: "White Crystal", texture: [["block_crystal_white", 0]], inCreative: true}], st_block);
Block.createBlock("block_directional_breaker", [{name: "Directional Breaker", texture: [["block_directional_breaker", 0], ["block_directional_breaker_top", 0], ["block_directional_breaker", 0], ["block_directional_breaker_front", 0]], inCreative: true}], st_block);
Block.createBlock("block_display_stand", [{name: "Display Stand", texture: [["block_display_stand", 0], ["block_display_stand", 0], ["block_display_stand_side", 0]], inCreative: true}]);
Block.createBlock("block_dropper", [{name: "Dropper", texture: [["block_dropper", 0], ["block_dropper_top", 0], ["block_dropper", 0], ["block_dropper_front", 0], ["block_dropper",0]], inCreative: true}], st_block);
Block.createBlock("block_empowerer", [{name: "Empowerer", texture: [["null", 0]], inCreative: true}]);
Block.createBlock("block_energizer", [{name: "Energizer", texture: [["block_energizer", 0], ["block_energizer_top", 0], ["block_energizer_side", 0]], inCreative: true}], st_block);
Block.createBlock("block_enervator", [{name: "Enervator", texture: [["block_enervator", 0], ["block_enervator_top", 0], ["block_enervator_side", 0]], inCreative: true}], st_block);

Block.createBlock("block_farmer", [{name: "Farmer", texture: [["block_farmer", 0], ["block_farmer_top", 0], ["block_farmer", 0], ["block_farmer_front", 0], ["block_farmer",0]], inCreative: true}], st_block);
Block.createBlock("block_feeder", [{name: "Feeder", texture: [["block_feeder_top", 0], ["block_feeder_top", 0], ["block_feeder", 0]], inCreative: true}], st_block);
Block.createBlock("block_fermenting_barrel", [{name: "Fermenting Barrel", texture: [["block_fermenting_barrel_top", 0], ["block_fermenting_barrel_top", 0], ["block_fermenting_barrel", 0]], inCreative: true}], st_block);
Block.createBlock("block_fluid_collector", [{name: "Fluid Collector", texture: [["block_fluid_collector_top", 0], ["block_fluid_collector_top", 0], ["block_fluid_collector_front", 0], ["block_fluid_collector", 0]], inCreative: true}], st_block);
Block.createBlock("block_fluid_placer", [{name: "Fluid Placer", texture: [["block_fluid_placer_top", 0], ["block_fluid_placer_top", 0], ["block_fluid_placer_front", 0], ["block_fluid_placer", 0]], inCreative: true}], st_block);
Block.createBlock("block_furnace_double", [{name: "Double Furnace", texture: [["block_furnace_double", 0], ["block_furnace_double_top", 0], ["block_furnace_double", 0], ["block_furnace_double_front", 0], ["block_furnace_double",0]], inCreative: true}], st_block);

Block.createBlock("block_giant_chest_large", [{name: "Giant Chest Large", texture: [["block_giant_chest_top", 0], ["block_giant_chest_top", 0], ["block_giant_chest_large", 0]], inCreative: true}]);
Block.createBlock("block_giant_chest_medium", [{name: "Giant Chest Medium", texture: [["block_giant_chest_top", 0], ["block_giant_chest_top", 0], ["block_giant_chest_medium", 0]], inCreative: true}]);
Block.createBlock("block_giant_chest", [{name: "Giant Chest", texture: [["block_giant_chest_top", 0], ["block_giant_chest_top", 0], ["block_giant_chest", 0]], inCreative: true}]);

Block.createBlock("block_greenhouse_glass", [{name: "GreenHouse Glass", texture: [["block_greenhouse_glass", 0]], inCreative: true}], st_block);
Block.createBlock("block_grinder_double", [{name: "Double Grinder", texture: [["block_grinder_bottom", 0], ["block_grinder_top", 0], ["block_grinder_double", 0]], inCreative: true}], st_block);
Block.createBlock("block_grinder", [{name: "Grinder", texture: [["block_grinder_bottom", 0], ["block_grinder_top", 0], ["block_grinder", 0]], inCreative: true}], st_block);
Block.createBlock("block_heat_collector", [{name: "Heat Collector", texture: [["block_heat_collector_bottom", 0], ["block_heat_collector_top", 0], ["block_heat_collector_side", 0]], inCreative: true}], st_block);
Block.createBlock("block_inputter_advanced", [{name: "Advanced Inputter", texture: [["block_inputter_advanced", 0]], inCreative: true}], st_block);
Block.createBlock("block_inputter", [{name: "Inputter", texture: [["block_inputter", 0]], inCreative: true}], st_block);
Block.createBlock("block_item_distributor", [{name: "Item Distributor", texture: [["block_item_distributor", 0]], inCreative: true}], st_block);
Block.createBlock("block_item_repairer", [{name: "Item Repairer", texture: [["block_item_repairer_bottom", 0], ["block_item_repairer_top", 0], ["block_item_repairer", 0]], inCreative: true}], st_block);

Block.createBlock("block_item_viewer", [{name: "Item Viewer", texture: [["block_item_viewer", 0]], inCreative: true}], st_block);
Block.createBlock("block_lamp_powerer", [{name: "Lamp Powerer", texture: [["block_lamp_powerer", 0], ["block_lamp_powerer", 0], ["block_lamp_powerer", 0], ["block_lamp_powerer_front", 0], ["block_lamp_powerer",0]], inCreative: true}], st_block);
Block.createBlock("block_lava_factory_controller", [{name: "Lava Factory Controller", texture: [["block_lava_factory_controller", 0], ["block_lava_factory_controller_top", 0], ["block_lava_factory_controller", 0]], inCreative: true}], st_block);
Block.createBlock("block_leaf_generator", [{name: "Leaf Generator", texture: [["block_leaf_generator_bottom", 0], ["block_leaf_generator_top", 0], ["block_leaf_generator", 0]], inCreative: true}], st_block);
Block.createBlock("block_miner", [{name: "Miner", texture: [["block_miner", 0], ["block_miner_top", 0], ["block_miner", 0], ["block_miner_front",0], ["block_miner",0]], inCreative: true}], st_block);
Block.createBlock("block_misc_black_quartz_chiseled", [{name: "Quartz Chiseled", texture: [["block_misc_black_quartz_chiseled", 0]], inCreative: true}], st_block);
Block.createBlock("block_misc_black_quartz_pillar", [{name: "Quartz Pillar", texture: [["block_misc_black_quartz_pillar", 0]], inCreative: true}], st_block);
Block.createBlock("block_misc_black_quartz", [{name: "Quartz", texture: [["block_misc_black_quartz", 0]], inCreative: true}], st_block);

Block.createBlock("block_misc_charcoal", [{name: "Charcoal", texture: [["block_misc_charcoal", 0]], inCreative: true}], st_block);
Block.createBlock("block_misc_ender_casing", [{name: "Ender Casing", texture: [["block_misc_ender_casing", 0]], inCreative: true}], st_block);
Block.createBlock("block_misc_enderpearl", [{name: "EnderPearl", texture: [["block_misc_enderpearl", 0]], inCreative: true}], st_block);
Block.createBlock("block_misc_iron_casing_snow", [{name: "Iron Casing Snow", texture: [["block_misc_iron_casing_snow", 0], ["block_misc_iron_casing_snow_top",0]], inCreative: false}], st_block);
Block.createBlock("block_misc_iron_casing", [{name: "Iron Casing", texture: [["block_misc_iron_casing", 0]], inCreative: true}], st_block);
Block.createBlock("block_misc_lava_factory_case", [{name: "Lava Factory Case", texture: [["block_misc_lava_factory_case", 0]], inCreative: true}], st_block);
Block.createBlock("block_misc_wood_casing", [{name: "Wood Casing", texture: [["block_misc_wood_casing", 0]], inCreative: true}], st_block);
Block.createBlock("block_oil_generator", [{name: "Oil Generator", texture: [["block_oil_generator_bottom", 0], ["block_oil_generator_top",0]], inCreative: true}]);

Block.createBlock("block_phantom_breaker", [{name: "Phantom Breaker", texture: [["block_phantom_breaker", 0]], inCreative: true}], st_block);
Block.createBlock("block_phantom_energyface", [{name: "Phantom Energyface", texture: [["block_phantom_energyface", 0]], inCreative: true}], st_block);
Block.createBlock("block_phantom_liquiface", [{name: "Phantom LiquiFace", texture: [["block_phantom_liquiface", 0]], inCreative: true}], st_block);
Block.createBlock("block_phantom_placer", [{name: "Placer", texture: [["block_phantom_placer", 0]], inCreative: true}], st_block);
Block.createBlock("block_phantom_redstoneface", [{name: "Phantom RedstoneFace", texture: [["block_phantom_redstoneface", 0]], inCreative: true}], st_block);
//Block.createBlock("block_phantomface_pumpkin", [{name: "PhantomFace Pumpkin", texture: [["block_phantomface_pumpkin", 0]], inCreative: true}], st_block);
Block.createBlock("block_phantomface", [{name: "PhantomFace", texture: [["block_phantomface", 0]], inCreative: true}], st_block);
Block.createBlock("block_placer", [{name: "Placer", texture: [["block_placer", 0]], inCreative: true}], st_block);

Block.createBlock("block_player_interface", [{name: "Player Interface", texture: [["block_player_interface", 0]], inCreative: true}], st_block);
Block.createBlock("block_ranged_collector", [{name: "Ranged Collector", texture: [["block_ranged_collector", 0]], inCreative: true}], st_block);
Block.createBlock("block_shock_absorber", [{name: "Shock Absorber", texture: [["block_shock_absorber", 0]], inCreative: true}], st_block);
Block.createBlock("block_treasure_chest", [{name: "Treasure Chest", texture: [["block_treasure_chest_bottom", 0], ["block_treasure_chest_top",0], ["block_treasure_chest",0], ["block_treasure_chest_front",0], ["block_treasure_chest",0]], inCreative: true}], st_block);
Block.createBlock("block_tiny_torch", [{name: "Tiny Torch", texture: [["block_tiny_torch", 0]], inCreative: true}], st_block);
Block.createBlock("block_xp_solidifier", [{name: "Expirence Solidifier", texture: [["block_xp_solidifier", 0], ["block_xp_solidifier_top",0], ["block_xp_solidifier",0], ["block_xp_solidifier_front",0], ["block_xp_solidifier",0]], inCreative: true}], st_block);


/*
Block.createBlock("block_energizer", [{name: "Energizer", texture: [["block_energizer", 0], ["block_energizer_top", 0], ["block_energizer_side", 0]], inCreative: true}], st_block);
Block.createBlock("block_enervator", [{name: "Enervator", texture: [["block_enervator", 0], ["block_enervator_top", 0], ["block_enervator_side", 0]], inCreative: true}], st_block);
*/




// file: ActuallyAdditions/blocks/functional/lava_factory.js

MachineRegistry.registerPrototype(BlockID.block_lava_factory_controller, {
	defaultValues: {
		energy: 0,
		timer: 0
	},
	isGenerator: function() {
		return true;
	},
	tick: function(){
		let block1 = World.getBlock(this.x-1, this.y+1, this.z).id === BlockID.block_misc_lava_factory_case;
		let block2 = World.getBlock(this.x+1, this.y+1, this.z).id === BlockID.block_misc_lava_factory_case;
		let block3 = World.getBlock(this.x, this.y+1, this.z-1).id === BlockID.block_misc_lava_factory_case;
		let block4 = World.getBlock(this.x, this.y+1, this.z+1).id === BlockID.block_misc_lava_factory_case;
		let air = World.getBlock(this.x, this.y+1, this.z).id === 0;
		if(this.data.timer>=200 && this.data.energy>=150000 && block1 && block2 && block3 && block4 && air){
			World.setBlock(this.x, this.y+1, this.z, 11, 0);
			this.data.energy-=150000;
			this.data.timer=0;
		}
		this.data.timer++;
	},
	getEnergyStorage: function(){
		return 300000;
	},
	energyTick: function (type, src) {
	  this.data.energy += src.get(300000 - this.data.energy);
	}
});




// file: ActuallyAdditions/liquid_registry.js

LiquidRegistry.registerLiquid("canola_oil", "Canola Oil", ["canola_s"]);
LiquidRegistry.registerItem("canola_oil", {id: 325, data: 0}, {id: ItemID.item_bucket_canola_oil, data: 0});

LiquidRegistry.registerLiquid("refined_canola_oil", "Regined Canola Oil", ["canola_refined_s"]);
LiquidRegistry.registerItem("refined_canola_oil", {id: 325, data: 0}, {id: ItemID.item_bucket_oil, data: 0});




// file: ActuallyAdditions/items/genItemID.js

IDRegistry.genItemID("item_axe_crystal_black");
IDRegistry.genItemID("item_axe_crystal_blue");
IDRegistry.genItemID("item_axe_crystal_green");
IDRegistry.genItemID("item_axe_crystal_light_blue");
IDRegistry.genItemID("item_axe_crystal_red");
IDRegistry.genItemID("item_axe_crystal_white");
IDRegistry.genItemID("item_axe_emerald");
IDRegistry.genItemID("item_axe_light");
IDRegistry.genItemID("item_axe_obsidian");
IDRegistry.genItemID("item_axe_quartz");

IDRegistry.genItemID("item_bag");

IDRegistry.genItemID("item_battery_double");
IDRegistry.genItemID("item_battery_quadruple");
IDRegistry.genItemID("item_battery_quintuple");
IDRegistry.genItemID("item_battery_triple");
IDRegistry.genItemID("item_battery");

IDRegistry.genItemID("item_booklet");

IDRegistry.genItemID("item_bucket_canola_oil");
IDRegistry.genItemID("item_bucket_oil");

IDRegistry.genItemID("item_chest_to_crate_upgrade");

IDRegistry.genItemID("item_coffee_beans");
IDRegistry.genItemID("item_coffee_seed");
IDRegistry.genItemID("item_coffee");

IDRegistry.genItemID("item_color_lens");
IDRegistry.genItemID("item_crafter_on_a_stick");
IDRegistry.genItemID("item_crate_keeper");
IDRegistry.genItemID("item_crate_to_crafty_upgrade");

IDRegistry.genItemID("item_chest_crystal_black");
IDRegistry.genItemID("item_chest_crystal_blue");
IDRegistry.genItemID("item_chest_crystal_empowered_black");
IDRegistry.genItemID("item_chest_crystal_empowered_blue");
IDRegistry.genItemID("item_chest_crystal_empowered_green");
IDRegistry.genItemID("item_chest_crystal_empowered_light_blue");
IDRegistry.genItemID("item_chest_crystal_empowered_red");
IDRegistry.genItemID("item_chest_crystal_empowered_white");
IDRegistry.genItemID("item_crystal_green");
IDRegistry.genItemID("item_crystal_light_blue");
IDRegistry.genItemID("item_crystal_red");
IDRegistry.genItemID("item_crystal_shard");
IDRegistry.genItemID("item_crystal_white");

IDRegistry.genItemID("item_damage_lens");
IDRegistry.genItemID("item_disenchanting_lens");


IDRegistry.genItemID("item_drill_black");
IDRegistry.genItemID("item_drill_blue");
IDRegistry.genItemID("item_drill_brown");
IDRegistry.genItemID("item_drill_cyan");
IDRegistry.genItemID("item_drill_gray");
IDRegistry.genItemID("item_drill_green");
IDRegistry.genItemID("item_drill_light_blue");
IDRegistry.genItemID("item_drill_light_gray");
IDRegistry.genItemID("item_drill_lime");
IDRegistry.genItemID("item_drill_magenta");
IDRegistry.genItemID("item_drill_orange");
IDRegistry.genItemID("item_drill_pink");
IDRegistry.genItemID("item_drill_purple");
IDRegistry.genItemID("item_drill_red");

IDRegistry.genItemID("item_drill_upgrade_block_placing");
IDRegistry.genItemID("item_drill_upgrade_five_by_five");
IDRegistry.genItemID("item_drill_upgrade_fortune");
IDRegistry.genItemID("item_drill_upgrade_silk_touch");
IDRegistry.genItemID("item_drill_upgrade_speed_ii");
IDRegistry.genItemID("item_drill_upgrade_speed_iii");
IDRegistry.genItemID("item_drill_upgrade_speed");
IDRegistry.genItemID("item_drill_upgrade_three_by_three");
IDRegistry.genItemID("item_drill_upgrade");

IDRegistry.genItemID("item_drill_white");
IDRegistry.genItemID("item_drill_yellow");

IDRegistry.genItemID("item_dust");
IDRegistry.genItemID("item_engineer_goggles_advanced");
IDRegistry.genItemID("item_engineer_goggles");
IDRegistry.genItemID("item_explosion_lens");
IDRegistry.genItemID("item_fertilizer");
IDRegistry.genItemID("item_filling_wand");
IDRegistry.genItemID("item_filter");
IDRegistry.genItemID("item_flax_seed");

IDRegistry.genItemID("item_food_bacon");
IDRegistry.genItemID("item_food_baguette");
IDRegistry.genItemID("item_food_big_cookie");
IDRegistry.genItemID("item_food_cheese");
IDRegistry.genItemID("item_food_chocolate_cake");
IDRegistry.genItemID("item_food_chocolate_toast");
IDRegistry.genItemID("item_food_chocolate");
IDRegistry.genItemID("item_food_doughnut");
IDRegistry.genItemID("item_food_fish_n_chips");
IDRegistry.genItemID("item_food_french_fries");
IDRegistry.genItemID("item_food_french_fry");
IDRegistry.genItemID("item_food_hamburger");
IDRegistry.genItemID("item_food_noodle");
IDRegistry.genItemID("item_food_pizza");
IDRegistry.genItemID("item_food_pumpkin_stew");
IDRegistry.genItemID("item_food_rice_bread");
IDRegistry.genItemID("item_food_rice");
IDRegistry.genItemID("item_food_spaghetti");
IDRegistry.genItemID("item_food_submarine_sandwich");
IDRegistry.genItemID("item_food_toast");

IDRegistry.genItemID("item_growth_ring");
IDRegistry.genItemID("item_hairy_ball");

IDRegistry.genItemID("item_hoe_crystal_black");
IDRegistry.genItemID("item_hoe_crystal_blue");
IDRegistry.genItemID("item_hoe_crystal_green");
IDRegistry.genItemID("item_hoe_crystal_light_blue");
IDRegistry.genItemID("item_hoe_crystal_red");
IDRegistry.genItemID("item_hoe_crystal_white");
IDRegistry.genItemID("item_hoe_emerald");
IDRegistry.genItemID("item_hoe_crystal_light");
IDRegistry.genItemID("item_hoe_obsidian");
IDRegistry.genItemID("item_hoe_quartz");

IDRegistry.genItemID("item_jam_overlay");
IDRegistry.genItemID("item_jam");
IDRegistry.genItemID("item_juicer");
IDRegistry.genItemID("item_knife");
IDRegistry.genItemID("item_laser_upgrade_invisibility");
IDRegistry.genItemID("item_laser_upgrade_range");
IDRegistry.genItemID("item_laser_wrench");
IDRegistry.genItemID("item_leaf_blower_advanced");
IDRegistry.genItemID("item_leaf_blower_advanced");
IDRegistry.genItemID("item_light_wand");
IDRegistry.genItemID("item_manual");
IDRegistry.genItemID("item_medium_to_large_crate_upgrade");
IDRegistry.genItemID("item_minecart_firework_box");
IDRegistry.genItemID("item_mining_lens");

IDRegistry.genItemID("item_misc_bat_wing");
IDRegistry.genItemID("item_misc_biocoal");
IDRegistry.genItemID("item_misc_biomass");
IDRegistry.genItemID("item_misc_black_dye");
IDRegistry.genItemID("item_misc_black_quartz");
IDRegistry.genItemID("item_misc_canola");
IDRegistry.genItemID("item_misc_coil_advanced");
IDRegistry.genItemID("item_misc_coil");
IDRegistry.genItemID("item_misc_crystallized_canola_seed");
IDRegistry.genItemID("item_misc_cup");
IDRegistry.genItemID("item_misc_dough");
IDRegistry.genItemID("item_misc_drill_core");
IDRegistry.genItemID("item_misc_empowered_canola_seed");
IDRegistry.genItemID("item_misc_ender_star");
IDRegistry.genItemID("item_misc_knife_blade");
IDRegistry.genItemID("item_misc_knife_handle");
IDRegistry.genItemID("item_misc_lens");
IDRegistry.genItemID("item_misc_mashed_food");
IDRegistry.genItemID("item_misc_paper_cone");
IDRegistry.genItemID("item_misc_rice_dough");
IDRegistry.genItemID("item_misc_rice_slime");
IDRegistry.genItemID("item_misc_ring");
IDRegistry.genItemID("item_misc_spawner_shard");
IDRegistry.genItemID("item_misc_tiny_charcoal");
IDRegistry.genItemID("item_misc_tiny_coal");
IDRegistry.genItemID("item_misc_youtube_icon");
IDRegistry.genItemID("item_more_damage_lens");

IDRegistry.genItemID("item_paxel_overlay");
IDRegistry.genItemID("item_paxel");
IDRegistry.genItemID("item_phantom_connector");

IDRegistry.genItemID("item_pickaxe_crystal_black");
IDRegistry.genItemID("item_pickaxe_crystal_blue");
IDRegistry.genItemID("item_pickaxe_crystal_green");
IDRegistry.genItemID("item_pickaxe_crystal_light_blue");
IDRegistry.genItemID("item_pickaxe_crystal_red");
IDRegistry.genItemID("item_pickaxe_crystal_white");
IDRegistry.genItemID("item_pickaxe_emerald");
IDRegistry.genItemID("item_pickaxe_light");
IDRegistry.genItemID("item_pickaxe_obsidian");
IDRegistry.genItemID("item_pickaxe_quartz");

IDRegistry.genItemID("item_player_probe");
IDRegistry.genItemID("item_potion_ring_advanced");
IDRegistry.genItemID("item_potion_ring");
IDRegistry.genItemID("item_rarmor_module_reconstructor");
IDRegistry.genItemID("item_resonant_rice");
IDRegistry.genItemID("item_rice_seed");
IDRegistry.genItemID("item_shears_light");

IDRegistry.genItemID("item_shovel_crystal_black");
IDRegistry.genItemID("item_shovel_crystal_blue");
IDRegistry.genItemID("item_shovel_crystal_green");
IDRegistry.genItemID("item_shovel_crystal_light_blue");
IDRegistry.genItemID("item_shovel_crystal_red");
IDRegistry.genItemID("item_shovel_crystal_white");
IDRegistry.genItemID("item_shovel_emerald");
IDRegistry.genItemID("item_shovel_light");
IDRegistry.genItemID("item_shovel_obsidian");
IDRegistry.genItemID("item_shovel_quartz");

IDRegistry.genItemID("item_small_to_medium_crate_upgrade");
IDRegistry.genItemID("item_snail");
IDRegistry.genItemID("item_solidified_experience");
IDRegistry.genItemID("item_spawner_changer");
IDRegistry.genItemID("item_suction_ring");

IDRegistry.genItemID("item_sword_crystal_black");
IDRegistry.genItemID("item_sword_crystal_blue");
IDRegistry.genItemID("item_sword_crystal_green");
IDRegistry.genItemID("item_sword_crystal_light_blue");
IDRegistry.genItemID("item_sword_crystal_red");
IDRegistry.genItemID("item_sword_crystal_white");
IDRegistry.genItemID("item_sword_emerald");
IDRegistry.genItemID("item_sword_light");
IDRegistry.genItemID("item_sword_obsidian");
IDRegistry.genItemID("item_sword_quartz");


IDRegistry.genItemID("item_tablet");
IDRegistry.genItemID("item_tele_staff");
IDRegistry.genItemID("item_upgrade_speed");
IDRegistry.genItemID("item_void_bag");
IDRegistry.genItemID("item_water_bowl");
IDRegistry.genItemID("item_water_removal_ring");
IDRegistry.genItemID("item_wings_of_the_bats");
IDRegistry.genItemID("item_worm");




// file: ActuallyAdditions/items/createItem.js

Item.createItem("item_axe_crystal_black", "axe crystal black", {name: "item_axe_crystal_black", meta: 0}, {stack: 64});
Item.createItem("item_axe_crystal_blue", "axe crystal blue", {name: "item_axe_crystal_blue", meta: 0}, {stack: 64});
Item.createItem("item_axe_crystal_green", "axe crystal green", {name: "item_axe_crystal_green", meta: 0}, {stack: 64});
Item.createItem("item_axe_crystal_light_blue", "axe crystal light blue", {name: "item_axe_crystal_light_blue", meta: 0}, {stack: 64});
Item.createItem("item_axe_crystal_red", "axe crystal red", {name: "item_axe_crystal_red", meta: 0}, {stack: 64});
Item.createItem("item_axe_crystal_white", "axe crystal white", {name: "item_axe_crystal_white", meta: 0}, {stack: 64});
Item.createItem("item_axe_emerald", "axe emerald", {name: "item_axe_emerald", meta: 0}, {stack: 64});
Item.createItem("item_axe_light", "axe light", {name: "item_axe_light", meta: 0}, {stack: 64});
Item.createItem("item_axe_obsidian", "axe obsidian", {name: "item_axe_obsidian", meta: 0}, {stack: 64});
Item.createItem("item_axe_quartz", "axe quartz", {name: "item_axe_quartz", meta: 0}, {stack: 64});
Item.createItem("item_bag", "bag", {name: "item_bag", meta: 0}, {stack: 64});
Item.createItem("item_battery_double", "battery double", {name: "item_battery_double", meta: 0}, {stack: 64});
Item.createItem("item_battery_quadruple", "battery quadruple", {name: "item_battery_quadruple", meta: 0}, {stack: 64});
Item.createItem("item_battery_quintuple", "battery quintuple", {name: "item_battery_quintuple", meta: 0}, {stack: 64});
Item.createItem("item_battery_triple", "battery triple", {name: "item_battery_triple", meta: 0}, {stack: 64});
Item.createItem("item_battery", "battery", {name: "item_battery", meta: 0}, {stack: 64});
Item.createItem("item_booklet", "booklet", {name: "item_booklet", meta: 0}, {stack: 64});
Item.createItem("item_bucket_canola_oil", "bucket canola oil", {name: "item_bucket_canola_oil", meta: 0}, {stack: 64});
Item.createItem("item_bucket_oil", "bucket oil", {name: "item_bucket_oil", meta: 0}, {stack: 64});
Item.createItem("item_chest_to_crate_upgrade", "chest to crate upgrade", {name: "item_chest_to_crate_upgrade", meta: 0}, {stack: 64});
Item.createItem("item_coffee_beans", "coffee beans", {name: "item_coffee_beans", meta: 0}, {stack: 64});
Item.createItem("item_coffee_seed", "coffee seed", {name: "item_coffee_seed", meta: 0}, {stack: 64});
Item.createItem("item_coffee", "coffee", {name: "item_coffee", meta: 0}, {stack: 64});
Item.createItem("item_color_lens", "color lens", {name: "item_color_lens", meta: 0}, {stack: 64});
Item.createItem("item_crafter_on_a_stick", "crafter on a stick", {name: "item_crafter_on_a_stick", meta: 0}, {stack: 64});
Item.createItem("item_crate_keeper", "crate keeper", {name: "item_crate_keeper", meta: 0}, {stack: 646});
Item.createItem("item_crate_to_crafty_upgrade", "crate to crafty upgrade", {name: "item_crate_to_crafty_upgrade", meta: 0}, {stack: 64});
Item.createItem("item_crystal_green", "crystal green", {name: "item_crystal_green", meta: 0}, {stack: 64});
Item.createItem("item_crystal_light_blue", "crystal light blue", {name: "item_crystal_light_blue", meta: 0}, {stack: 64});
Item.createItem("item_crystal_red", "crystal red", {name: "item_crystal_red", meta: 0}, {stack: 64});
Item.createItem("item_crystal_shard", "crystal shard", {name: "item_crystal_shard", meta: 0}, {stack: 64});
Item.createItem("item_crystal_white", "crystal white", {name: "item_crystal_white", meta: 0}, {stack: 64});
Item.createItem("item_damage_lens", "damage lens", {name: "item_damage_lens", meta: 0}, {stack: 64});
Item.createItem("item_disenchanting_lens", "disenchanting lens", {name: "item_disenchanting_lens", meta: 0}, {stack: 64});
Item.createItem("item_drill_black", "drill black", {name: "item_drill_black", meta: 0}, {stack: 64});
Item.createItem("item_drill_blue", "drill blue", {name: "item_drill_blue", meta: 0}, {stack: 64});
Item.createItem("item_drill_brown", "drill brown", {name: "item_drill_brown", meta: 0}, {stack: 64});
Item.createItem("item_drill_cyan", "drill cyan", {name: "item_drill_cyan", meta: 0}, {stack: 64});
Item.createItem("item_drill_gray", "drill gray", {name: "item_drill_gray", meta: 0}, {stack: 64});
Item.createItem("item_drill_green", "drill green", {name: "item_drill_green", meta: 0}, {stack: 64});
Item.createItem("item_drill_light_blue", "drill light blue", {name: "item_drill_light_blue", meta: 0}, {stack: 64});
Item.createItem("item_drill_light_gray", "drill light gray", {name: "item_drill_light_gray", meta: 0}, {stack: 64});
Item.createItem("item_drill_lime", "drill lime", {name: "item_drill_lime", meta: 0}, {stack: 64});
Item.createItem("item_drill_magenta", "drill magenta", {name: "item_drill_magenta", meta: 0}, {stack: 64});
Item.createItem("item_drill_orange", "drill orange", {name: "item_drill_orange", meta: 0}, {stack: 64});
Item.createItem("item_drill_pink", "drill pink", {name: "item_drill_pink", meta: 0}, {stack: 64});
Item.createItem("item_drill_purple", "drill purple", {name: "item_drill_purple", meta: 0}, {stack: 64});
Item.createItem("item_drill_red", "drill red", {name: "item_drill_red", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_block_placing", "upgrade block placing", {name: "item_drill_upgrade_block_placing", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_five_by_five", "upgrade five by five", {name: "item_drill_upgrade_five_by_five", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_fortune", "upgrade fortune", {name: "item_drill_upgrade_fortune", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_silk_touch", "upgrade silk touch", {name: "item_drill_upgrade_silk_touch", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_speed_ii", "upgrade speedIi", {name: "item_drill_upgrade_speed_ii", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_speed_iii", "upgrade speedIii", {name: "item_drill_upgrade_speed_iii", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_speed", "upgrade speed", {name: "item_drill_upgrade_speed", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade_three_by_three", "upgrade three by three", {name: "item_drill_upgrade_three_by_three", meta: 0}, {stack: 64});
Item.createItem("item_drill_upgrade", "upgrade", {name: "item_drill_upgrade", meta: 0}, {stack: 64});
Item.createItem("item_drill_white", "drill white", {name: "item_drill_white", meta: 0}, {stack: 64});
Item.createItem("item_drill_yellow", "drill yellow", {name: "item_drill_yellow", meta: 0}, {stack: 64});
Item.createItem("item_dust", "dust", {name: "item_dust", meta: 0}, {stack: 64});
Item.createItem("item_engineer_goggles_advanced", "engineer goggles advanced", {name: "item_engineer_goggles_advanced", meta: 0}, {stack: 64});
Item.createItem("item_engineer_goggles", "engineer goggles", {name: "item_engineer_goggles", meta: 0}, {stack: 64});
Item.createItem("item_explosion_lens", "explosion lens", {name: "item_explosion_lens", meta: 0}, {stack: 64});
Item.createItem("item_fertilizer", "fertilizer", {name: "item_fertilizer", meta: 0}, {stack: 64});
Item.createItem("item_filling_wand", "filling wand", {name: "item_filling_wand", meta: 0}, {stack: 64});
Item.createItem("item_filter", "filter", {name: "item_filter", meta: 0}, {stack: 64});
Item.createItem("item_flax_seed", "flax seed", {name: "item_flax_seed", meta: 0}, {stack: 64});
Item.createItem("item_food_bacon", "food bacon", {name: "item_food_bacon", meta: 0}, {stack: 64});
Item.createItem("item_food_baguette", "food baguette", {name: "item_food_baguette", meta: 0}, {stack: 64});
Item.createItem("item_food_big_cookie", "food big cookie", {name: "item_food_big_cookie", meta: 0}, {stack: 64});
Item.createItem("item_food_cheese", "food cheese", {name: "item_food_cheese", meta: 0}, {stack: 64});
Item.createItem("item_food_chocolate_cake", "food chocolate cake", {name: "item_food_chocolate_cake", meta: 0}, {stack: 64});
Item.createItem("item_food_chocolate_toast", "food chocolate toast", {name: "item_food_chocolate_toast", meta: 0}, {stack: 64});
Item.createItem("item_food_chocolate", "food chocolate", {name: "item_food_chocolate", meta: 0}, {stack: 64});
Item.createItem("item_food_doughnut", "food doughnut", {name: "item_food_doughnut", meta: 0}, {stack: 64});
Item.createItem("item_food_fish_n_chips", "food fish n chips", {name: "item_food_fish_n_chips", meta: 0}, {stack: 64});
Item.createItem("item_food_french_fries", "food french fries", {name: "item_food_french_fries", meta: 0}, {stack: 64});
Item.createItem("item_food_french_fry", "food french fry", {name: "item_food_french_fry", meta: 0}, {stack: 64});
Item.createItem("item_food_hamburger", "food hamburger", {name: "item_food_hamburger", meta: 0}, {stack: 64});
Item.createItem("item_food_noodle", "food noodle", {name: "item_food_noodle", meta: 0}, {stack: 64});
Item.createItem("item_food_pizza", "food pizza", {name: "item_food_pizza", meta: 0}, {stack: 64});
Item.createItem("item_food_pumpkin_stew", "food pumpkin stew", {name: "item_food_pumpkin_stew", meta: 0}, {stack: 64});
Item.createItem("item_food_rice_bread", "food rice bread", {name: "item_food_rice_bread", meta: 0}, {stack: 64});
Item.createItem("item_food_rice", "food rice", {name: "item_food_rice", meta: 0}, {stack: 64});
Item.createItem("item_food_spaghetti", "food spaghetti", {name: "item_food_spaghetti", meta: 0}, {stack: 64});
Item.createItem("item_food_submarine_sandwich", "food submarine sandwich", {name: "item_food_submarine_sandwich", meta: 0}, {stack: 64});
Item.createItem("item_food_toast", "food toast", {name: "item_food_toast", meta: 0}, {stack: 64});
Item.createItem("item_growth_ring", "growth ring", {name: "item_growth_ring", meta: 0}, {stack: 64});
Item.createItem("item_hairy_ball", "hairy ball", {name: "item_hairy_ball", meta: 0}, {stack: 64});
Item.createItem("item_hoe_crystal_black", "hoe crystal black", {name: "item_hoe_crystal_black", meta: 0}, {stack: 64});
Item.createItem("item_hoe_crystal_blue", "hoe crystal blue", {name: "item_hoe_crystal_blue", meta: 0}, {stack: 64});
Item.createItem("item_hoe_crystal_green", "hoe crystal green", {name: "item_hoe_crystal_green", meta: 0}, {stack: 64});
Item.createItem("item_hoe_crystal_light_blue", "hoe crystal light blue", {name: "item_hoe_crystal_light_blue", meta: 0}, {stack: 64});
Item.createItem("item_hoe_crystal_red", "hoe crystal red", {name: "item_hoe_crystal_red", meta: 0}, {stack: 64});
Item.createItem("item_hoe_crystal_white", "hoe crystal white", {name: "item_hoe_crystal_white", meta: 0}, {stack: 64});
Item.createItem("item_hoe_emerald", "hoe emerald", {name: "item_hoe_emerald", meta: 0}, {stack: 64});
Item.createItem("item_hoe_crystal_light", "hoe crystal light", {name: "item_hoe_crystal_light", meta: 0}, {stack: 64});
Item.createItem("item_hoe_obsidian", "hoe obsidian", {name: "item_hoe_obsidian", meta: 0}, {stack: 64});
Item.createItem("item_hoe_quartz", "hoe quartz", {name: "item_hoe_quartz", meta: 0}, {stack: 64});
Item.createItem("item_jam_overlay", "jam overlay", {name: "item_jam_overlay", meta: 0}, {stack: 64});
Item.createItem("item_jam", "jam", {name: "item_jam", meta: 0}, {stack: 64});
Item.createItem("item_juicer", "juicer", {name: "item_juicer", meta: 0}, {stack: 64});
Item.createItem("item_knife", "knife", {name: "item_knife", meta: 0}, {stack: 64});
Item.createItem("item_laser_upgrade_invisibility", "laser upgradeInvisibility", {name: "item_laser_upgrade_invisibility", meta: 0}, {stack: 64});
Item.createItem("item_laser_upgrade_range", "laser upgrade range", {name: "item_laser_upgrade_range", meta: 0}, {stack: 64});
Item.createItem("item_laser_wrench", "laser wrench", {name: "item_laser_wrench", meta: 0}, {stack: 64});
Item.createItem("item_leaf_blower_advanced", "leaf blower advanced", {name: "item_leaf_blower_advanced", meta: 0}, {stack: 64});
Item.createItem("item_leaf_blower_advanced", "leaf blower advanced", {name: "item_leaf_blower_advanced", meta: 0}, {stack: 64});
Item.createItem("item_light_wand", "light wand", {name: "item_light_wand", meta: 0}, {stack: 64});
Item.createItem("item_manual", "manual", {name: "item_manual", meta: 0}, {stack: 64});
Item.createItem("item_medium_to_large_crate_upgrade", "medium to large crate upgrade", {name: "item_medium_to_large_crate_upgrade", meta: 0}, {stack: 64});
Item.createItem("item_minecart_firework_box", "minecart firework box", {name: "item_minecart_firework_box", meta: 0}, {stack: 64});
Item.createItem("item_mining_lens", "mining lens", {name: "item_mining_lens", meta: 0}, {stack: 64});
Item.createItem("item_misc_bat_wing", "bat wing", {name: "item_misc_bat_wing", meta: 0}, {stack: 64});
Item.createItem("item_misc_biocoal", "biocoal", {name: "item_misc_biocoal", meta: 0}, {stack: 64});
Item.createItem("item_misc_biomass", "biomass", {name: "item_misc_biomass", meta: 0}, {stack: 64});
Item.createItem("item_misc_black_dye", "black dye", {name: "item_misc_black_dye", meta: 0}, {stack: 64});
Item.createItem("item_misc_black_quartz", "black quartz", {name: "item_misc_black_quartz", meta: 0}, {stack: 64});
Item.createItem("item_misc_canola", "canola", {name: "item_misc_canola", meta: 0}, {stack: 64});
Item.createItem("item_misc_coil_advanced", "coil advanced", {name: "item_misc_coil_advanced", meta: 0}, {stack: 64});
Item.createItem("item_misc_coil", "coil", {name: "item_misc_coil", meta: 0}, {stack: 64});
Item.createItem("item_misc_crystallized_canola_seed", "crystallized canola seed", {name: "item_misc_crystallized_canola_seed", meta: 0}, {stack: 64});
Item.createItem("item_misc_cup", "cup", {name: "item_misc_cup", meta: 0}, {stack: 64});
Item.createItem("item_misc_dough", "dough", {name: "item_misc_dough", meta: 0}, {stack: 64});
Item.createItem("item_misc_drill_core", "drill core", {name: "item_misc_drill_core", meta: 0}, {stack: 64});
Item.createItem("item_misc_empowered_canola_seed", "empowered canola seed", {name: "item_misc_empowered_canola_seed", meta: 0}, {stack: 64});
Item.createItem("item_misc_ender_star", "ender star", {name: "item_misc_ender_star", meta: 0}, {stack: 64});
Item.createItem("item_misc_knife_blade", "knife blade", {name: "item_misc_knife_blade", meta: 0}, {stack: 64});
Item.createItem("item_misc_knife_handle", "knife handle", {name: "item_misc_knife_handle", meta: 0}, {stack: 64});
Item.createItem("item_misc_lens", "lens", {name: "item_misc_lens", meta: 0}, {stack: 64});
Item.createItem("item_misc_mashed_food", "mashed food", {name: "item_misc_mashed_food", meta: 0}, {stack: 64});
Item.createItem("item_misc_paper_cone", "paper cone", {name: "item_misc_paper_cone", meta: 0}, {stack: 64});
Item.createItem("item_misc_rice_dough", "rice dough", {name: "item_misc_rice_dough", meta: 0}, {stack: 64});
Item.createItem("item_misc_rice_slime", "rice slime", {name: "item_misc_rice_slime", meta: 0}, {stack: 64});
Item.createItem("item_misc_ring", "ring", {name: "item_misc_ring", meta: 0}, {stack: 64});
Item.createItem("item_misc_spawner_shard", "spawner shard", {name: "item_misc_spawner_shard", meta: 0}, {stack: 64});
Item.createItem("item_misc_tiny_charcoal", "tiny charcoal", {name: "item_misc_tiny_charcoal", meta: 0}, {stack: 64});
Item.createItem("item_misc_tiny_coal", "tiny coal", {name: "item_misc_tiny_coal", meta: 0}, {stack: 64});
Item.createItem("item_misc_youtube_icon", "youtubeIcon", {name: "item_misc_youtube_icon", meta: 0}, {stack: 64});
Item.createItem("item_more_damage_lens", "more damage lens", {name: "item_more_damage_lens", meta: 0}, {stack: 64});
Item.createItem("item_paxel_overlay", "paxel overlay", {name: "item_paxel_overlay", meta: 0}, {stack: 64});
Item.createItem("item_paxel", "paxel", {name: "item_paxel", meta: 0}, {stack: 64});
Item.createItem("item_phantom_connector", "phantom connector", {name: "item_phantom_connector", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_crystal_black", "pickaxe crystal black", {name: "item_pickaxe_crystal_black", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_crystal_blue", "pickaxe crystal blue", {name: "item_pickaxe_crystal_blue", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_crystal_green", "pickaxe crystal green", {name: "item_pickaxe_crystal_green", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_crystal_light_blue", "pickaxe crystal light blue", {name: "item_pickaxe_crystal_light_blue", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_crystal_red", "pickaxe crystal red", {name: "item_pickaxe_crystal_red", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_crystal_white", "pickaxe crystal white", {name: "item_pickaxe_crystal_white", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_emerald", "pickaxe emerald", {name: "item_pickaxe_emerald", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_light", "pickaxe light", {name: "item_pickaxe_light", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_obsidian", "pickaxe obsidian", {name: "item_pickaxe_obsidian", meta: 0}, {stack: 64});
Item.createItem("item_pickaxe_quartz", "pickaxe quartz", {name: "item_pickaxe_quartz", meta: 0}, {stack: 64});
Item.createItem("item_player_probe", "player probe", {name: "item_player_probe", meta: 0}, {stack: 64});
Item.createItem("item_potion_ring_advanced", "potion ring advanced", {name: "item_potion_ring_advanced", meta: 0}, {stack: 64});
Item.createItem("item_potion_ring", "potion ring", {name: "item_potion_ring", meta: 0}, {stack: 64});
Item.createItem("item_rarmor_module_reconstructor", "rarmor module reconstructor", {name: "item_rarmor_module_reconstructor", meta: 0}, {stack: 64});
Item.createItem("item_resonant_rice", "resonant rice", {name: "item_resonant_rice", meta: 0}, {stack: 64});
Item.createItem("item_rice_seed", "rice seed", {name: "item_rice_seed", meta: 0}, {stack: 64});
Item.createItem("item_shears_light", "shears light", {name: "item_shears_light", meta: 0}, {stack: 64});
Item.createItem("item_shovel_crystal_black", "shovel crystal black", {name: "item_shovel_crystal_black", meta: 0}, {stack: 64});
Item.createItem("item_shovel_crystal_blue", "shovel crystal blue", {name: "item_shovel_crystal_blue", meta: 0}, {stack: 64});
Item.createItem("item_shovel_crystal_green", "shovel crystal green", {name: "item_shovel_crystal_green", meta: 0}, {stack: 64});
Item.createItem("item_shovel_crystal_light_blue", "shovel crystal light blue", {name: "item_shovel_crystal_light_blue", meta: 0}, {stack: 64});
Item.createItem("item_shovel_crystal_red", "shovel crystal red", {name: "item_shovel_crystal_red", meta: 0}, {stack: 64});
Item.createItem("item_shovel_crystal_white", "shovel crystal white", {name: "item_shovel_crystal_white", meta: 0}, {stack: 64});
Item.createItem("item_shovel_emerald", "shovel emerald", {name: "item_shovel_emerald", meta: 0}, {stack: 64});
Item.createItem("item_shovel_light", "shovel light", {name: "item_shovel_light", meta: 0}, {stack: 64});
Item.createItem("item_shovel_obsidian", "shovel obsidian", {name: "item_shovel_obsidian", meta: 0}, {stack: 64});
Item.createItem("item_shovel_quartz", "shovel quartz", {name: "item_shovel_quartz", meta: 0}, {stack: 64});
Item.createItem("item_small_to_medium_crate_upgrade", "small to medium crate upgrade", {name: "item_small_to_medium_crate_upgrade", meta: 0}, {stack: 64});
Item.createItem("item_snail", "snail", {name: "item_snail", meta: 0}, {stack: 64});
Item.createItem("item_solidified_experience", "solidified experience", {name: "item_solidified_experience", meta: 0}, {stack: 64});
Item.createItem("item_spawner_changer", "spawner changer", {name: "item_spawner_changer", meta: 0}, {stack: 64});
Item.createItem("item_suction_ring", "suction ring", {name: "item_suction_ring", meta: 0}, {stack: 64});
Item.createItem("item_sword_crystal_black", "sword crystal black", {name: "item_sword_crystal_black", meta: 0}, {stack: 64});
Item.createItem("item_sword_crystal_blue", "sword crystal blue", {name: "item_sword_crystal_blue", meta: 0}, {stack: 64});
Item.createItem("item_sword_crystal_green", "sword crystal green", {name: "item_sword_crystal_green", meta: 0}, {stack: 64});
Item.createItem("item_sword_crystal_light_blue", "sword crystal light blue", {name: "item_sword_crystal_light_blue", meta: 0}, {stack: 64});
Item.createItem("item_sword_crystal_red", "sword crystal red", {name: "item_sword_crystal_red", meta: 0}, {stack: 64});
Item.createItem("item_sword_crystal_white", "sword crystal white", {name: "item_sword_crystal_white", meta: 0}, {stack: 64});
Item.createItem("item_sword_emerald", "sword emerald", {name: "item_sword_emerald", meta: 0}, {stack: 64});
Item.createItem("item_sword_light", "sword light", {name: "item_sword_light", meta: 0}, {stack: 64});
Item.createItem("item_sword_obsidian", "sword obsidian", {name: "item_sword_obsidian", meta: 0}, {stack: 64});
Item.createItem("item_sword_quartz", "sword quartz", {name: "item_sword_quartz", meta: 0}, {stack: 64});
Item.createItem("item_tablet", "tablet", {name: "item_tablet", meta: 0}, {stack: 64});
Item.createItem("item_tele_staff", "tele staff", {name: "item_tele_staff", meta: 0}, {stack: 64});
Item.createItem("item_upgrade_speed", "upgrade speed", {name: "item_upgrade_speed", meta: 0}, {stack: 64});
Item.createItem("item_void_bag", "void bag", {name: "item_void_bag", meta: 0}, {stack: 64});
Item.createItem("item_water_bowl", "water bowl", {name: "item_water_bowl", meta: 0}, {stack: 64});
Item.createItem("item_water_removal_ring", "water removal ring", {name: "item_water_removal_ring", meta: 0}, {stack: 64});
Item.createItem("item_wings_of_the_bats", "wings of the bats", {name: "item_wings_of_the_bats", meta: 0}, {stack: 64});
Item.createItem("item_worm", "worm", {name: "item_worm", meta: 0}, {stack: 64});




// file: ActuallyAdditions/armor/genItemID.js

IDRegistry.genItemID("item_helm_crystal_black");
IDRegistry.genItemID("item_helm_crystal_blue");
IDRegistry.genItemID("item_helm_crystal_green");
IDRegistry.genItemID("item_helm_crystal_light_blue");
IDRegistry.genItemID("item_helm_crystal_red");
IDRegistry.genItemID("item_helm_crystal_white");
IDRegistry.genItemID("item_helm_emerald");
IDRegistry.genItemID("item_helm_light");
IDRegistry.genItemID("item_helm_obsidian");
IDRegistry.genItemID("item_helm_quartz");

IDRegistry.genItemID("item_chest_crystal_black");
IDRegistry.genItemID("item_chest_crystal_blue");
IDRegistry.genItemID("item_chest_crystal_green");
IDRegistry.genItemID("item_chest_crystal_light_blue");
IDRegistry.genItemID("item_chest_crystal_red");
IDRegistry.genItemID("item_chest_crystal_white");
IDRegistry.genItemID("item_chest_emerald");
IDRegistry.genItemID("item_chest_light");
IDRegistry.genItemID("item_chest_obsidian");
IDRegistry.genItemID("item_chest_quartz");

IDRegistry.genItemID("item_pants_crystal_black");
IDRegistry.genItemID("item_pants_crystal_blue");
IDRegistry.genItemID("item_pants_crystal_green");
IDRegistry.genItemID("item_pants_crystal_light_blue");
IDRegistry.genItemID("item_pants_crystal_red");
IDRegistry.genItemID("item_pants_crystal_white");
IDRegistry.genItemID("item_pants_emerald");
IDRegistry.genItemID("item_pants_light");
IDRegistry.genItemID("item_pants_obsidian");
IDRegistry.genItemID("item_pants_quartz");

IDRegistry.genItemID("item_boots_crystal_black");
IDRegistry.genItemID("item_boots_crystal_blue");
IDRegistry.genItemID("item_boots_crystal_green");
IDRegistry.genItemID("item_boots_crystal_light_blue");
IDRegistry.genItemID("item_boots_crystal_red");
IDRegistry.genItemID("item_boots_crystal_white");
IDRegistry.genItemID("item_boots_emerald");
IDRegistry.genItemID("item_boots_light");
IDRegistry.genItemID("item_boots_obsidian");
IDRegistry.genItemID("item_boots_quartz");





// file: ActuallyAdditions/armor/createItem.js

Item.createItem("item_helm_crystal_black", "helm crystal black", {name: "item_helm_crystal_black", meta: 0}, {stack: 1});
Item.createItem("item_helm_crystal_blue", "helm crystal blue", {name: "item_helm_crystal_blue", meta: 0}, {stack: 1});
Item.createItem("item_helm_crystal_green", "helm crystal green", {name: "item_helm_crystal_green", meta: 0}, {stack: 1});
Item.createItem("item_helm_crystal_light_blue", "helm crystal light blue", {name: "item_helm_crystal_light_blue", meta: 0}, {stack: 1});
Item.createItem("item_helm_crystal_red", "helm crystal red", {name: "item_helm_crystal_red", meta: 0}, {stack: 1});
Item.createItem("item_helm_crystal_white", "helm crystal white", {name: "item_helm_crystal_white", meta: 0}, {stack: 1});
Item.createItem("item_helm_emerald", "helm emerald", {name: "item_helm_emerald", meta: 0}, {stack: 1});
Item.createItem("item_helm_light", "helm light", {name: "item_helm_light", meta: 0}, {stack: 1});
Item.createItem("item_helm_obsidian", "helm obsidian", {name: "item_helm_obsidian", meta: 0}, {stack: 1});
Item.createItem("item_helm_quartz", "helm quartz", {name: "item_helm_quartz", meta: 0}, {stack: 1});

Item.createItem("item_chest_crystal_black", "chest crystal black", {name: "item_chest_crystal_black", meta: 0}, {stack: 1});
Item.createItem("item_chest_crystal_blue", "chest crystal blue", {name: "item_chest_crystal_blue", meta: 0}, {stack: 1});
Item.createItem("item_chest_crystal_green", "chest crystal green", {name: "item_chest_crystal_green", meta: 0}, {stack: 1});
Item.createItem("item_chest_crystal_light_blue", "chest crystal light blue", {name: "item_chest_crystal_light_blue", meta: 0}, {stack: 1});
Item.createItem("item_chest_crystal_red", "chest crystal red", {name: "item_chest_crystal_red", meta: 0}, {stack: 1});
Item.createItem("item_chest_crystal_white", "chest crystal white", {name: "item_chest_crystal_white", meta: 0}, {stack: 1});
Item.createItem("item_chest_emerald", "chest emerald", {name: "item_chest_emerald", meta: 0}, {stack: 1});
Item.createItem("item_chest_light", "chest light", {name: "item_chest_light", meta: 0}, {stack: 1});
Item.createItem("item_chest_obsidian", "chest obsidian", {name: "item_chest_obsidian", meta: 0}, {stack: 1});
Item.createItem("item_chest_quartz", "chest quartz", {name: "item_chest_quartz", meta: 0}, {stack: 1});

Item.createItem("item_pants_crystal_black", "pants crystal black", {name: "item_pants_crystal_black", meta: 0}, {stack: 1});
Item.createItem("item_pants_crystal_blue", "pants crystal blue", {name: "item_pants_crystal_blue", meta: 0}, {stack: 1});
Item.createItem("item_pants_crystal_green", "pants crystal green", {name: "item_pants_crystal_green", meta: 0}, {stack: 1});
Item.createItem("item_pants_crystal_light_blue", "pants crystal light blue", {name: "item_pants_crystal_light_blue", meta: 0}, {stack: 1});
Item.createItem("item_pants_crystal_red", "pants crystal red", {name: "item_pants_crystal_red", meta: 0}, {stack: 1});
Item.createItem("item_pants_crystal_white", "pants crystal white", {name: "item_pants_crystal_white", meta: 0}, {stack: 1});
Item.createItem("item_pants_emerald", "pants emerald", {name: "item_pants_emerald", meta: 0}, {stack: 1});
Item.createItem("item_pants_light", "pants light", {name: "item_pants_light", meta: 0}, {stack: 1});
Item.createItem("item_pants_obsidian", "pants obsidian", {name: "item_pants_obsidian", meta: 0}, {stack: 1});
Item.createItem("item_pants_quartz", "pants quartz", {name: "item_pants_quartz", meta: 0}, {stack: 1});

Item.createItem("item_boots_crystal_black", "boots crystal black", {name: "item_boots_crystal_black", meta: 0}, {stack: 1});
Item.createItem("item_boots_crystal_blue", "boots crystal blue", {name: "item_boots_crystal_blue", meta: 0}, {stack: 1});
Item.createItem("item_boots_crystal_green", "boots crystal green", {name: "item_boots_crystal_green", meta: 0}, {stack: 1});
Item.createItem("item_boots_crystal_light_blue", "boots crystal light blue", {name: "item_boots_crystal_light_blue", meta: 0}, {stack: 1});
Item.createItem("item_boots_crystal_red", "boots crystal red", {name: "item_boots_crystal_red", meta: 0}, {stack: 1});
Item.createItem("item_boots_crystal_white", "boots crystal white", {name: "item_boots_crystal_white", meta: 0}, {stack: 1});
Item.createItem("item_boots_emerald", "boots emerald", {name: "item_boots_emerald", meta: 0}, {stack: 1});
Item.createItem("item_boots_light", "boots light", {name: "item_boots_light", meta: 0}, {stack: 1});
Item.createItem("item_boots_obsidian", "boots obsidian", {name: "item_boots_obsidian", meta: 0}, {stack: 1});
Item.createItem("item_boots_quartz", "boots quartz", {name: "item_boots_quartz", meta: 0}, {stack: 1});




// file: ActuallyAdditions/blocks/functional/standart_gui_pos.js

var gui_bg = {type: "background", color: android.graphics.Color.rgb(179, 179, 179)};
var gui = {
	x: 470, 
	y: 130,
	s: 3.2, 
	m: 3.3,
	b: 3.4,
};




// file: ActuallyAdditions/blocks/functional/enervator.js

var enervatorUI = new UI.StandartWindow({
	standart: {
		header: {text: {text: "Enervator"}},
		inventory: {
			width: 260, // ширина окна инвентаря
			padding: 10, // паддинг окна инвентаря
		},
		background: {
			color: android.graphics.Color.rgb(179, 179, 179)
		}
	},
	params: {slot: "slot_pc", invSlot: "slot_pc",},
	drawing: [
		{type: "background", color: android.graphics.Color.rgb(179, 179, 179)},
		{type: "bitmap", x: 500, y: 130, bitmap: "gui_energizer", scale: 3.3},
		{type: "bitmap", x: 515, y: 150, bitmap: "energy_b", scale: 3.2},
	],
	elements: {
		"currentEnergy": {font: {color: android.graphics.Color.WHITE, shadow: 0.6, size: 18}, type: "text", x: 580, y: 150, width: 300, height: 40, text: "Current: "},
		"slotEnergy": {type: "slot", x: 582, y: 367, isValid: function(id){return ChargeItemRegistry.isValidItem(id, "Eu", 0);}},
		"slot": {type: "slot", x: 582, y: 266},
		"slot1": {type: "slot", x: 668, y: 188},
		"slot2": {type: "slot", x: 668, y: 248},
		"slot3": {type: "slot", x: 668, y: 308},
		"slot4": {type: "slot", x: 668, y: 368},
		"energyScale": {type: "scale", x: 515, y: 150, direction: 1, bitmap: "energy_s", scale: 3.2},
	}
});
MachineRegistry.registerPrototype(BlockID.block_enervator, {
	defaultValues: {
		energy: 0
	},
	getGuiScreen: function(){
		return enervatorUI;
	},
	isGenerator: function() {
		return true;
	},
	tick: function(){
		var item = this.container.getSlot("slotEnergy");
		if(this.data.energy<48000)
		this.data.energy += ChargeItemRegistry.getEnergyFrom(item, "Eu", 200, 32, 0, true);
		this.container.setScale("energyScale", this.data.energy / 50000);
	},
	getEnergyStorage: function(){
		return 50000;
	},
	energyTick: function (type, src) {
		var output = Math.min(32, this.data.energy);
		this.data.energy += src.add(output) - output;
	}
});




// file: ActuallyAdditions/blocks/functional/energizer.js

var energizerUI = new UI.StandartWindow({
	standart: {
		header: {text: {text: "Energizer"}},
		inventory: {
			width: 260, // ширина окна инвентаря
			padding: 10, // паддинг окна инвентаря
		},
		background: {
			color: android.graphics.Color.rgb(179, 179, 179)
		}
	},
	params: {slot: "slot_pc", invSlot: "slot_pc",},
	drawing: [
		{type: "background", color: android.graphics.Color.rgb(179, 179, 179)},
		{type: "bitmap", x: 500, y: 130, bitmap: "gui_energizer", scale: 3.3},
		{type: "bitmap", x: 515, y: 150, bitmap: "energy_b", scale: 3.2},
	],
	elements: {
		"currentEnergy": {font: {color: android.graphics.Color.WHITE, shadow: 0.6, size: 18}, type: "text", x: 580, y: 150, width: 300, height: 40, text: "Current: "},
		"slotEnergy": {type: "slot", x: 582, y: 367, isValid: function(id){return ChargeItemRegistry.isValidItem(id, "Eu", 0);}},
		"slot": {type: "slot", x: 582, y: 266},
		"slot1": {type: "slot", x: 668, y: 188},
		"slot2": {type: "slot", x: 668, y: 248},
		"slot3": {type: "slot", x: 668, y: 308},
		"slot4": {type: "slot", x: 668, y: 368},
		"energyScale": {type: "scale", x: 515, y: 150, direction: 1, bitmap: "energy_s", scale: 3.2},
	}
});
MachineRegistry.registerPrototype(BlockID.block_energizer, {
	defaultValues: {
		energy: 0
	},
	getGuiScreen: function(){
		return energizerUI;
	},
	tick: function(){
		var item = this.container.getSlot("slotEnergy");
		if(this.data.energy>200)
		this.data.energy -= ChargeItemRegistry.addEnergyTo(item, "Eu", 200, 32, 0);
		this.container.setScale("energyScale", this.data.energy / 50000);
	},
	getEnergyStorage: function(){
		return 50000;
	},
	energyTick: function (type, src) {
		this.data.energy += src.get(50000 - this.data.energy);
		this.container.setScale("energyScale", this.data.energy / 50000);
	}
});




// file: ActuallyAdditions/blocks/functional/generator.js


var generatorUI = new UI.StandartWindow({
	standart: {
		header: {text: {text: "Coal Generator"}},
		inventory: {
			width: 260, // ширина окна инвентаря
			padding: 10, // паддинг окна инвентаря
		},
		background: {
			color: android.graphics.Color.rgb(179, 179, 179)
		}
	},
	params: {slot: "slot_pc", invSlot: "slot_pc",},
	drawing: [gui_bg,
		{type: "bitmap", x: gui.x, y: gui.y, bitmap: "gui_coal_generator", scale: gui.m},
		{type: "bitmap", x: gui.x+15, y: gui.y+20, bitmap: "energy_b", scale: gui.s},
		{type: "bitmap", x: gui.x+170, y: gui.y+88, bitmap: "fire_off", scale: gui.s},
	],
	elements: {
		"energyScale": {type: "scale", x: gui.x+15, y: gui.y+20, direction: 1, value: 0.5, bitmap: "energy_s", scale: gui.s},
		"burningScale": {type: "scale", x: gui.x+170, y: gui.y+88, direction: 1, value: 0.5, bitmap: "fire", scale: gui.s},
		"slotFuel": {type: "slot", x: gui.x+162, y: gui.y+138}
	}
});
MachineRegistry.registerPrototype(BlockID.block_coal_generator, {
	defaultValues: {
		burn: 0,
		burnMax: 0,
		isActive: false
	},

	getGuiScreen: function(){
		return generatorUI;
	},
	getFuel: function(slotName){
		var fuelSlot = this.container.getSlot(slotName);
		if (fuelSlot.id > 0){
			var burn = Recipes.getFuelBurnDuration(fuelSlot.id, fuelSlot.data);
			if (burn && !LiquidRegistry.getItemLiquid(fuelSlot.id, fuelSlot.data)){
				fuelSlot.count--;
				this.container.validateSlot(slotName);
				this.activate();
				return burn;
			}
		}
		this.deactivate();
		return 0;
	},

	tick: function(){
		var energyStorage = this.getEnergyStorage();

		if(this.data.burn <= 0){
			this.data.burn = this.data.burnMax = this.getFuel("slotFuel") / 4;
		}
		if(this.data.burn > 0 && this.data.energy < energyStorage){
			this.data.energy = Math.min(this.data.energy + 10, energyStorage);
			this.data.burn--;
		}

		this.container.setScale("burningScale", this.data.burn / this.data.burnMax || 0);
		this.container.setScale("energyScale", this.data.energy / energyStorage);
	},

	isGenerator: function() {
		return true;
	},

	getEnergyStorage: function(){
		return 10000;
	},

	energyTick: function(type, src){
		var output = Math.min(32, this.data.energy);
		this.data.energy += src.add(output) - output;
	},
	activate: MachineRegistry.activateMachine,
	deactivate: MachineRegistry.deactivateMachine,
	destroy: this.deactivate
});




Block.registerPlaceFunction("block_coal_generator", function(coords, item, block){
	Game.prevent();
	var x = coords.relative.x
	var y = coords.relative.y
	var z = coords.relative.z
	block = World.getBlockID(x, y, z)
	if(GenerationUtils.isTransparentBlock(block)){
		World.setBlock(x, y, z, item.id, coords.side);
		World.addTileEntity(x, y, z);
	}
});





// file: ActuallyAdditions/blocks/functional/heat_collector.js

var hcb = [
	{x: -1, y: 0, z: 0},
	{x: +1, y: 0, z: 0},
	{x: 0, y: 0, z: -1},
	{x: 0, y: 0, z: +1},
];
MachineRegistry.registerPrototype(BlockID.block_heat_collector, {
	defaultValues: {
		energy: 0,
		timer: 0,
		time: 0
	},
	isGenerator: function() {
		return true;
	},
	tick: function(){
		var block1 = World.getBlock(this.x-1, this.y, this.z).id === 11;
		var block2 = World.getBlock(this.x+1, this.y, this.z).id === 11;
		var block3 = World.getBlock(this.x, this.y, this.z-1).id === 11;
		var block4 = World.getBlock(this.x, this.y, this.z+1).id === 11;
		if(block1 && block2 && block3 && block4 && this.data.energy<50000 && this.data.timer>=20){
			this.data.energy+=200;
			this.data.timer=0;
		}else if(this.data.timer>=20)
		this.data.timer=0;
		let rand = random(0, 4);
		if(rand === 3)
		this.data.time++;
		if(this.data.time === 60){
			let r = random(1, 2);
			if(r === 1){
				let ran = random(1, 2)
				World.setBlock(this.x+hcb[ran], this.y, this.z, 0, 0);
			}else{
				let ran = random(3, 4)
				World.setBlock(this.x, this.y, this.z+hcb[ran], 0, 0);
			}
			this.data.time=0;
		}
		
		/*
		if(this.data.timer == 100){
			
		}*/
		this.data.timer+=1;
	},
	getEnergyStorage: function(){
		return 50000;
	},
	energyTick: function (type, src) {
	  var output = Math.min(32, this.data.energy);
		this.data.energy += src.add(output) - output;
	}
});




// file: ActuallyAdditions/blocks/functional/leaf_generator.js

MachineRegistry.registerPrototype(BlockID.block_leaf_generator, {
	defaultValues: {
		energy: 0,
		timer: 0
	},
	isGenerator: function() {
		return true;
	},
	tick: function(){
		if(this.data.timer>=20 && this.data.energy<36000){
			this.data.timer=0;
			main: for(let xx=-7; xx<7; xx++){
				for(let yy=-7; yy<7; yy++){
					for(let zz=-7; zz<7; zz++){
						var b1 = World.getBlock(this.x+xx, this.y+yy, this.z+zz).id === 161;
						var b2= World.getBlock(this.x+xx, this.y+yy, this.z+zz).id === 18;
						if(b1 || b2){
							this.data.energy+=300;
							World.setBlock(this.x+xx, this.y+yy, this.z+zz, 0 ,0);
							break main;
						}
					}
				}
			}
		}
		this.data.timer++;
	},
	getEnergyStorage: function(){
		return 36000;
	},
	energyTick: function (type, src) {
	  var output = Math.min(32, this.data.energy);
		this.data.energy += src.add(output) - output;
	}
});




// file: ActuallyAdditions/blocks/functional/item_repairer.js

var item_repairerUI = new UI.StandartWindow({
	standart: {
		header: {text: {text: "Item Repairer"}},
		inventory: {
			width: 260, // ширина окна инвентаря
			padding: 10, // паддинг окна инвентаря
		},
		background: {
			color: android.graphics.Color.rgb(179, 179, 179)
		}
	},
	params: {slot: "slot_pc", invSlot: "slot_pc",},
	drawing: [gui_bg,
		{type: "bitmap", x: gui.x, y: gui.y, bitmap: "gui_repairer", scale: gui.bm},
		{type: "bitmap", x: gui.x+15, y: gui.y+20, bitmap: "energy_b", scale: gui.s},
		{type: "bitmap", x: gui.x+116, y: gui.y+476, bitmap: "arrow_off", scale: 3.2},
	],
	elements: {
		"slotRepair": {type: "slot", x: gui.x+76, y: gui.y+170},
		"slotRepaired": {type: "slot", x: gui.x+268, y: gui.y+158, bitmap: "slot_pc_big", scale: 1, size: 84},
		"energyScale": {type: "scale", x: gui.x+15, y: gui.y+20, direction: 1, bitmap: "energy_s", scale: gui.s},
		"progressScale": {type: "scale", x: gui.x+116, y: gui.y+476, direction: 0, bitmap: "arrow", scale: gui.s},
	}
});
MachineRegistry.registerPrototype(BlockID.block_item_repairer, {
	defaultValues: {
		energy: 0
	},
	getGuiScreen: function(){
		return item_repairerUI;
	},
	tick: function(){
		var item = this.container.getSlot("slotRepair");
		var maxDmg = Item.getMaxDamage(item.id);
		var cost = maxDmg*10;
		
		if(item && item.id!=0){
			if(this.data.energy>cost && item.data>0){
				this.data.energy -= cost;
				item.data--;
			}else if(item.data==0){
				let i2 = this.container.getSlot("slotRepaired");
				if(i2.id==0){
					let item1 = this.container.getSlot("slotRepair");
					i2.id = item1.id;
					i2.count = item1.count;
					i2.data = item1.data;
					this.container.clearSlot("slotRepair");
				}
			}
			this.container.setScale("progressScale", item.data / maxDmg);
		}
		this.container.setScale("energyScale", this.data.energy / 300000);
		this.container.validateAll();
	},
	getEnergyStorage: function(){
		return 300000;
	},
	energyTick: function (type, src) {
		this.data.energy += src.get(300000 - this.data.energy);
		this.container.setScale("energyScale", this.data.energy / 300000);
	}
});




// file: ActuallyAdditions/blocks/functional/lava_factory.js

MachineRegistry.registerPrototype(BlockID.block_lava_factory_controller, {
	defaultValues: {
		energy: 0,
		timer: 0
	},
	isGenerator: function() {
		return true;
	},
	tick: function(){
		let block1 = World.getBlock(this.x-1, this.y+1, this.z).id === BlockID.block_misc_lava_factory_case;
		let block2 = World.getBlock(this.x+1, this.y+1, this.z).id === BlockID.block_misc_lava_factory_case;
		let block3 = World.getBlock(this.x, this.y+1, this.z-1).id === BlockID.block_misc_lava_factory_case;
		let block4 = World.getBlock(this.x, this.y+1, this.z+1).id === BlockID.block_misc_lava_factory_case;
		let air = World.getBlock(this.x, this.y+1, this.z).id === 0;
		if(this.data.timer>=200 && this.data.energy>=150000 && block1 && block2 && block3 && block4 && air){
			World.setBlock(this.x, this.y+1, this.z, 11, 0);
			this.data.energy-=150000;
			this.data.timer=0;
		}
		this.data.timer++;
	},
	getEnergyStorage: function(){
		return 300000;
	},
	energyTick: function (type, src) {
	  this.data.energy += src.get(300000 - this.data.energy);
	}
});




// file: ActuallyAdditions/blocks/functional/canola_press.js

var canola_pressUI = new UI.StandartWindow({
	standart: {
		header: {text: {text: "Canola Press"}},
		inventory: {
			width: 260, // ширина окна инвентаря
			padding: 10, // паддинг окна инвентаря
		},
		background: {
			color: android.graphics.Color.rgb(179, 179, 179)
		}
	},
	params: {slot: "slot_pc", invSlot: "slot_pc",},
	drawing: [gui_bg,
		{type: "bitmap", x: gui.x, y: gui.y, bitmap: "gui_canola_press", scale: gui.m},
		{type: "bitmap", x: gui.x+15, y: gui.y+20, bitmap: "energy_b", scale: gui.s},
		{type: "bitmap", x: gui.x+260, y: gui.y+20, bitmap: "liquid_b", scale: gui.s},
		{type: "bitmap", x: gui.x+155, y: gui.y+98, bitmap: "bubles_off", scale: gui.s},
	],
	elements: {
		"energyScale": {type: "scale", x: gui.x+15, y: gui.y+20, direction: 1, bitmap: "energy_s", scale: gui.s},
		"progress": {type: "scale", x: gui.x+155, y: gui.y+98, direction: 3, bitmap: "bubles", scale: gui.s},
		"liquidScale": {type: "scale", x: gui.x+260, y: gui.y+20, direction: 1, bitmap: "canola_s", scale: gui.s},
		"canola": {type: "slot", x: gui.x+143, y: gui.y+30},
	}
});
MachineRegistry.registerPrototype(BlockID.block_canola_press, {
	defaultValues: {
		energy: 0,
		progress: 0,
		canola: 0
	},
	getGuiScreen: function(){
		return canola_pressUI;
	},
	getCanola: function(amount, isOil){
		if(!isOil){
			this.data.canola -= amount;
		}
	},
	getCanolaStored: function(){return this.data.canola;},
	getMaxStored: function(){return 2000;},
	tick: function(){
		var slot = this.container.getSlot("canola");
		if(slot.id === ItemID.item_misc_canola && this.data.canola <= 1920 && this.data.energy >= 1050){
			this.data.progress+= 1/40;
			if(this.data.progress >= 1){
				this.data.energy -= 1050;
				this.data.canola+=80;
				slot.count--;
				this.container.validateAll();
				this.data.progress=0;
			}
		}
		this.container.setScale("liquidScale", this.data.canola / 2000);
		this.container.setScale("progress", this.data.progress / 1);
		this.container.setScale("energyScale", this.data.energy / 50000);
	},
	getEnergyStorage: function(){
		return 50000;
	},
	energyTick: function (type, src) {
		this.data.energy += src.get(50000 - this.data.energy);
		this.container.setScale("energyScale", this.data.energy / 50000);
	}
});




// file: ActuallyAdditions/blocks/functional/shock_absorber.js

Callback.addCallback("Explosion", function (coords, params) {
	let c = coords;
	let p = params;
	c.x = Math.floor(c.x);
	c.y = Math.floor(c.y);
	c.z = Math.floor(c.z);
	//Game.message("x: "+c.x+", y: "+c.y+", z: "+c.z);
   // Game.message("power: "+p.power);
  //  Game.message("entity: "+p.entity);
 //   Game.message("onFire: "+p.onFire);
//	Game.message("someBool: "+p.someBool);
	finder: for(let xx= -5; xx<5; xx++){
		 for(let yy= -5; yy<5; yy++){
			for(let zz= -5; zz<5; zz++){
				let block = World.getBlock(c.x+xx, c.y+yy, c.z+zz).id === BlockID.block_shock_absorber;
				if(block && p.power===4){
					Game.prevent();
					break finder;
				}
			}
		}
	}
});




// file: ActuallyAdditions/blocks/functional/fermenting_barrel.js

MachineRegistry.registerPrototype(BlockID.block_fermenting_barrel, {
	defaultValues: {
		progress: 0,
		canola: 0,
		oil: 0,
		timer: 0
	},
	getCanola: function(amount, isOil){if(isOil){this.data.oil-=amount;}},
	addCanola: function(amount){
		if(amount != undefined)
		this.data.canola += amount;
	},
	getCanolaStored: function(){return this.data.canola;},
	getMaxStored: function(){return 2000;},
	tick: function(){
		this.addCanola(canolaLib.getCanolaFrom(this.x, this.y, this.z, 80, false));
		if(this.data.timer >= 100){
			if(this.data.canola>=80 && this.data.oil<2000-80){
				this.data.oil+=80;
				this.data.canola-=80;
				this.data.progress=0;
			}
			this.data.timer=0;
		}
		this.container.setScale("progress", this.data.progress / 1);
		this.container.setScale("energyScale", this.data.energy / 50000);
		if(this.data.canola>=80)
		this.data.timer++;
		this.data.progress=this.data.timer/100;
	}
});




// file: ActuallyAdditions/blocks/functional/oil_generator.js

MachineRegistry.registerPrototype(BlockID.block_oil_generator, {
	defaultValues: {
		energy: 0,
		progress: 0,
		canola: 0,
		oil: 0,
		timer: 0
	},
	getGuiScreen: function(){
		return canola_pressUI;
	},
	getCanola: function(amount, isOil){
	},
	addCanola: function(amount, isOil){
		if(amount != undefined)
		if(isOil){
			this.data.oil+=amount;
		}else{
			this.data.canola+=amount;
		}
	},
	getCanolaStored: function(){return this.data.canola;},
	getMaxStored: function(){return 2000;},
	tick: function(){
		this.addCanola(canolaLib.getCanolaFrom(this.x, this.y, this.z, 50, true), true);
		if(this.data.oil>0){
			this.addCanola(canolaLib.getCanolaFrom(this.x, this.y, this.z, 50, true), true);
			if(this.data.oil>=50){
				this.data.timer++;
				this.data.energy+=40;
				if(this.data.timer>=120)
				this.data.oil-=50;
			}
		}else{
			this.addCanola(canolaLib.getCanolaFrom(this.x, this.y, this.z, 50, false));
			if(this.data.canola>=50){
				this.data.timer++;
				this.data.energy+=40;
				if(this.data.timer>=120)
				this.data.canola-=50;
			}
		}
		
		this.container.setScale("liquidScale", this.data.canola / 2000);
		this.container.setScale("progress", this.data.progress / 1);
		this.container.setScale("energyScale", this.data.energy / 50000);
	},
	getEnergyStorage: function(){
		return 50000;
	},
	energyTick: function (type, src) {
		var output = Math.min(32, this.data.energy);
		this.data.energy += src.add(output) - output;
		this.container.setScale("energyScale", this.data.energy / 50000);
	}
});




// file: ActuallyAdditions/blocks/functional/empowerer.js

MachineRegistry.registerPrototype(BlockID.block_empowerer, {
	defaultValues: {
		progress: 0,
		item: null,
		items:{
			item1: null,
			item2: null,
			item3: null,
			item4: null,
			center: null
		},
		connects: {
			connect1: null,
			connect2: null,
			connect3: null,
			connect4: null
		},
		energyTotal: 0,
		result: null,
		consumption: 0
	},
	connect: function(connect, c){
		let block = World.getBlock(c.x, c.y, c.z).id === BlockID.block_display_stand; 
		if(connect === null && block){
			let tile = World.getTileEntity(c.x, c.y, c.z);
			connect = tile.connect(this);
			Game.message("Connected Block at x: "+c.x+", y: "+c.y+", z: "+c.z);
		}
		if(connect != null && block)
			Game.message("Already Connected Block at x: "+c.x+", y: "+c.y+", z: "+c.z);
	},
	recipeRitual: function(){
		var c1 = this.data.connects.connect1;
		var c2 = this.data.connects.connect2;
		var c3 = this.data.connects.connect3;
		var c4 = this.data.connects.connect4;
		this.data.consumption = 0;
		this.data.items.item1 = World.getTileEntity(c1.x, c1.y, c1.z).getID();
		this.data.items.item2 = World.getTileEntity(c2.x, c2.y, c2.z).getID();
		this.data.items.item3 = World.getTileEntity(c3.x, c3.y, c3.z).getID();
		this.data.items.item4 = World.getTileEntity(c4.x, c4.y, c4.z).getID();
		var l = 0;
		var st_rt = false;
		for(let i in ec){
			for (let y in this.data.items){
				for(let u in ec[i]){
					if(this.data.items[y]===bc[i][u]){
						if(this.data.items.center === bc[i].center){
							this.data.result=ec[i].results.item;
							this.data.consumption+=4000;
							l++;
							delete bc[i][u];
						}else{
							this.data.result=ec[i].results.block;
							this.data.consumption+=40000;
							l++;
							delete bc[i][u];
						}
						if(l==5)st_rt=true;
						break;
					}
				}
			}
		}
		bc=ec;
		if(st_rt==true && this.data.energyTotal===this.data.consumption){
			for(let i in this.data.items){
				this.data.items[i]=null;
			}
			World.getTileEntity(c1.x, c1.y, c1.z).getItem();
			World.getTileEntity(c2.x, c2.y, c2.z).getItem();
			World.getTileEntity(c3.x, c3.y, c3.z).getItem();
			World.getTileEntity(c4.x, c4.y, c4.z).getItem();
	
			this.data.energyTotal += World.getTileEntity(c1.x, c1.y, c1.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal += World.getTileEntity(c2.x, c2.y, c2.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal += World.getTileEntity(c3.x, c3.y, c3.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal += World.getTileEntity(c4.x, c4.y, c4.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal -= this.data.consumption;
		}
	},
	click: function(id, count, data, c){
		this.connect(this.data.connects.connect1, {x: this.x-3, y: this.y, z: this.z});
		this.connect(this.data.connects.connect2, {x: this.x+3, y: this.y, z: this.z});
		this.connect(this.data.connects.connect3, {x: this.x, y: this.y, z: this.z-3});
		this.connect(this.data.connects.connect4, {x: this.x, y: this.y, z: this.z+3});
		if(id ===0)
			id = null;
			this.addAnim(id, count, data);
		//this.recipeRitual();
	},
	drop: function(){
		Player.addItemToInventory(this.data.items.center.id, 1, this.data.items.center.data); this.data.items.center=null; this.anim.destroy();
	},
	destroy: function(){
		if(this.data.items.center){
			this.drop();
		}
	},
	anim: null,
	created: function(){
		this.anim = new Animation.item(this.x+0.5, this.y+1, this.z+0.5);
	},
	init: function(){
		this.anim = new Animation.item(this.x+0.5, this.y+1, this.z+0.5);
	},
	addAnim: function(id, count, data){
		if(this.data.items.center===null || this.data.items.center===undefined || id != null){
			Player.decreaseCarriedItem(1);
			this.data.items.center = {id: id, count: 1, data: data};
			setAnim(this, this.data.items.center);
		}else{this.drop();}
	}
});

MachineRegistry.registerPrototype(BlockID.block_display_stand, {
	defaultValues: {
		energy: 0,
		item: null,
		time: 0,
		connect: null
	},
	checkConnect: function(){
		var coord = this.data.connect; 
		var getBlock = World.getBlock(coord.x, coord.y, coord.z).id === BlockID.block_empowerer; 
		if(!getBlock){
			this.data.connect=null;
			return null;
		}else{
			return true;
		}
	},
	connect: function(c){
		if(this.data.connect === null ||this.data.connect === undefined){
			this.data.connect={x: c.x, y: c.y, z: c.z};
			return true;
		}else{
			return this.checkConnect();
		}
	},
	drop: function(){
		Player.addItemToInventory(this.data.item.id, 1, this.data.item.data); this.data.item=null; this.anim.destroy();
	},
	getID: function(){
		return this.data.item;
	},
	getItem: function(){if(this.data.item!=null){return this.data.item; this.data.item=null; this.anim.destroy();}},
	click: function(id, count, data, c){
		if(id ===0)
			id = null;
			this.addAnim(id, count, data);
			
	},
	getEnergy: function(amount){
		if(this.data.energy>=amount){
			this.data.energy-=amount;
			return amount;
		}
	},
	tick: function(){
		if(this.data.item != null && animations==true){
			for(let i=0; i<1; i+=0.05){
				this.data.time+=0.01;
				setAnim(this, this.data.item);
			}
		}
	},
	destroy: function(){
		if(this.data.item){
			this.drop();
		}
	},
	anim: null,
	created: function(){
		this.anim = new Animation.item(this.x+0.5, this.y+1, this.z+0.5);
	},
	init: function(){
		this.anim = new Animation.item(this.x+0.5, this.y+1, this.z+0.5);
	},
	addAnim: function(id, count, data){
		if(this.data.item===null || this.data.item===undefined || id != null){
			Player.decreaseCarriedItem(1);
			this.data.item= {id: id, count: 1, data: data};
			setAnim(this, this.data.item);
		}else{this.drop();}
	}
});




// file: ActuallyAdditions/blocks/models/atomic_reconstructor.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(1/16, 1/16, 0/16, 15/16, 15/16, 15/16, [["block_atomic_reconstructor", 0]]);
	model.addBox(0/16, 0/16, 15/16, 16/16, 1/16, 16/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(0/16, 0/16, 0/16, 16/16, 1/16, 1/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(15/16, 0/16, 1/16, 16/16, 1/16, 15/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(0/16, 0/16, 1/16, 1/16, 1/16, 15/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(0/16, 15/16, 15/16, 16/16, 16/16, 16/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(0/16, 15/16, 0/16, 16/16, 16/16, 1/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(15/16, 15/16, 1/16, 16/16, 16/16, 15/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(0/16, 15/16, 1/16, 1/16, 16/16, 15/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(0/16, 1/16, 0/16, 1/16, 15/16, 1/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(15/16, 1/16, 0/16, 16/16, 15/16, 1/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(15/16, 1/16, 15/16, 16/16, 15/16, 16/16, [["block_atomic_reconstructor_front", 0]]);
	model.addBox(0/16, 1/16, 15/16, 1/16, 15/16, 16/16, [["block_atomic_reconstructor_front", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_atomic_reconstructor, 0, render);




// file: ActuallyAdditions/blocks/models/canola_press.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(13/16, 0/16, 0/16, 16/16, 16/16, 3/16, [["block_canola_press", 0]]);
	model.addBox(0/16, 0/16, 0/16, 3/16, 16/16, 3/16, [["block_canola_press", 0]]);
	model.addBox(0/16, 0/16, 13/16, 3/16, 16/16, 16/16, [["block_canola_press", 0]]);
	model.addBox(13/16, 0/16, 13/16, 16/16, 16/16, 16/16, [["block_canola_press", 0]]);
	model.addBox(1/16, 1/16, 1/16, 15/16, 7/16, 15/16, [["block_canola_press", 0]]);
	model.addBox(1/16, 9/16, 1/16, 15/16, 15/16, 15/16, [["block_canola_press", 0]]);
	model.addBox(2/16, 7/16, 2/16, 14/16, 9/16, 14/16, [["block_canola_press", 0]]);
	model.addBox(13/16, 0/16, 3/16, 15/16, 1/16, 13/16, [["block_canola_press_top", 0]]);
	model.addBox(3/16, 0/16, 2/16, 13/16, 1/16, 14/16, [["block_canola_press_top", 0]]);
	model.addBox(1/16, 0/16, 3/16, 3/16, 1/16, 13/16, [["block_canola_press_top", 0]]);
	model.addBox(3/16, 0/16, 1/16, 13/16, 1/16, 2/16, [["block_canola_press_top", 0]]);
	model.addBox(3/16, 0/16, 14/16, 13/16, 1/16, 15/16, [["block_canola_press_top", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_canola_press, 0, render);




// file: ActuallyAdditions/blocks/models/display_stand.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(0/16, 0/16, 0/16, 16/16, 1/16, 16/16, [["block_display_stand", 0]]);
	model.addBox(1/16, 1/16, 1/16, 15/16, 7/16, 15/16, [["block_giant_chest_top", 0]]);
	model.addBox(0/16, 1/16, 3/16, 16/16, 2/16, 13/16, [["block_display_stand_side", 0]]);
	model.addBox(3/16, 1/16, 0/16, 13/16, 2/16, 16/16, [["block_display_stand_side", 0]]);
	model.addBox(0/16, 2/16, 5/16, 16/16, 3/16, 11/16, [["block_display_stand_side", 0]]);
	model.addBox(5/16, 2/16, 0/16, 11/16, 3/16, 16/16, [["block_display_stand_side", 0]]);
	model.addBox(5/16, 5/16, 0/16, 11/16, 6/16, 16/16, [["block_display_stand_side", 0]]);
	model.addBox(0/16, 5/16, 5/16, 16/16, 6/16, 11/16, [["block_display_stand_side", 0]]);
	model.addBox(3/16, 6/16, 0/16, 13/16, 7/16, 16/16, [["block_display_stand_side", 0]]);
	model.addBox(0/16, 6/16, 3/16, 16/16, 7/16, 13/16, [["block_display_stand_side", 0]]);
	model.addBox(0/16, 7/16, 0/16, 16/16, 8/16, 16/16, [["block_display_stand", 0]]);
	model.addBox(6/16, 8/16, 6/16, 10/16, 9/16, 10/16, [["block_display_stand", 0]]);
	model.addBox(4/16, 8/16, 6/16, 6/16, 9/16, 10/16, [["block_display_stand", 0]]);
	model.addBox(10/16, 8/16, 6/16, 12/16, 9/16, 10/16, [["block_display_stand", 0]]);
	model.addBox(6/16, 8/16, 10/16, 10/16, 9/16, 12/16, [["block_display_stand", 0]]);
	model.addBox(6/16, 8/16, 4/16, 10/16, 9/16, 6/16, [["block_display_stand", 0]]);
	model.addBox(0/16, 6/16, 0/16, 1/16, 9/16, 1/16, [["block_display_stand", 0]]);
	model.addBox(15/16, 6/16, 0/16, 16/16, 9/16, 1/16, [["block_display_stand", 0]]);
	model.addBox(15/16, 6/16, 15/16, 16/16, 9/16, 16/16, [["block_display_stand", 0]]);
	model.addBox(0/16, 6/16, 15/16, 1/16, 9/16, 16/16, [["block_display_stand", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_display_stand, 0, render);
Block.setBlockShape(BlockID.block_display_stand, {x: 0, y: 0, z: 0}, {x: 1, y: 9/16, z: 1});




// file: ActuallyAdditions/blocks/models/empowerer.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(0/16, 0/16, 0/16, 16/16, 1/16, 16/16, [["block_coal_generator_side", 0]]);
	model.addBox(2/16, 1/16, 2/16, 14/16, 2/16, 14/16, [["block_misc_iron_casing", 0]]);
	model.addBox(1/16, 1/16, 4/16, 15/16, 2/16, 12/16, [["block_coal_generator_side", 0]]);
	model.addBox(4/16, 1/16, 1/16, 12/16, 2/16, 15/16, [["block_coal_generator_side", 0]]);
	model.addBox(2/16, 2/16, 2/16, 14/16, 3/16, 14/16, [["block_misc_iron_casing", 0]]);
	model.addBox(6/16, 3/16, 6/16, 10/16, 6/16, 10/16, [["block_misc_iron_casing", 0]]);
	model.addBox(2/16, 6/16, 0/16, 14/16, 7/16, 16/16, [["block_misc_iron_casing", 0]]);
	model.addBox(0/16, 6/16, 2/16, 16/16, 7/16, 14/16, [["block_misc_iron_casing", 0]]);
	model.addBox(1/16, 7/16, 1/16, 15/16, 8/16, 15/16, [["block_empowerer", 0]]);
	model.addBox(0/16, 7/16, 0/16, 16/16, 8/16, 1/16, [["block_coal_generator_side", 0]]);
	model.addBox(0/16, 7/16, 15/16, 16/16, 8/16, 16/16, [["block_coal_generator_side", 0]]);
	model.addBox(0/16, 7/16, 1/16, 1/16, 8/16, 15/16, [["block_coal_generator_side", 0]]);
	model.addBox(15/16, 7/16, 1/16, 16/16, 8/16, 15/16, [["block_coal_generator_side", 0]]);
	model.addBox(3/16, 8/16, 5/16, 5/16, 9/16, 11/16, [["block_misc_iron_casing", 0]]);
	model.addBox(11/16, 8/16, 5/16, 13/16, 9/16, 11/16, [["block_misc_iron_casing", 0]]);
	model.addBox(5/16, 8/16, 3/16, 11/16, 9/16, 5/16, [["block_misc_iron_casing", 0]]);
	model.addBox(5/16, 8/16, 11/16, 11/16, 9/16, 13/16, [["block_misc_iron_casing", 0]]);
	model.addBox(5/16, 8/16, 5/16, 11/16, 9/16, 11/16, [["block_misc_iron_casing", 0]]);
	model.addBox(0/16, 6/16, 0/16, 1/16, 9/16, 1/16, [["block_coal_generator_side", 0]]);
	model.addBox(15/16, 6/16, 0/16, 16/16, 9/16, 1/16, [["block_coal_generator_side", 0]]);
	model.addBox(15/16, 6/16, 15/16, 16/16, 9/16, 16/16, [["block_coal_generator_side", 0]]);
	model.addBox(0/16, 6/16, 15/16, 1/16, 9/16, 16/16, [["block_coal_generator_side", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_empowerer, 0, render);
Block.setBlockShape(BlockID.block_empowerer, {x: 0, y: 0, z: 0}, {x: 1, y: 9/16, z: 1});




// file: ActuallyAdditions/blocks/models/fermenting_barrel.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(1/16, 0/16, 1/16, 15/16, 15/16, 15/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 2/16, 15/16, 16/16, 4/16, 16/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 7/16, 15/16, 16/16, 9/16, 16/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 12/16, 15/16, 16/16, 14/16, 16/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 12/16, 0/16, 16/16, 14/16, 1/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 2/16, 0/16, 16/16, 4/16, 1/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 7/16, 0/16, 16/16, 9/16, 1/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 2/16, 0/16, 16/16, 4/16, 1/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 2/16, 1/16, 1/16, 4/16, 15/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 7/16, 1/16, 1/16, 9/16, 15/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0/16, 12/16, 1/16, 1/16, 14/16, 15/16, [["block_fermenting_barrel", 0]]);
	model.addBox(15/16, 12/16, 1/16, 16/16, 14/16, 15/16, [["block_fermenting_barrel", 0]]);
	model.addBox(15/16, 7/16, 1/16, 16/16, 9/16, 15/16, [["block_fermenting_barrel", 0]]);
	model.addBox(15/16, 2/16, 1/16, 16/16, 4/16, 15/16, [["block_fermenting_barrel", 0]]);
	model.addBox(7/16, 0/16, 0.5/16, 9/16, 16/16, 1.5/16, [["block_fermenting_barrel", 0]]);
	model.addBox(11/16, 0/16, 14.5/16, 14/16, 16/16, 15.5/16, [["block_fermenting_barrel", 0]]);
	model.addBox(14.5/16, 0/16, 11/16, 15.5/16, 16/16, 14/16, [["block_fermenting_barrel", 0]]);
	model.addBox(2/16, 0/16, 14.5/16, 5/16, 16/16, 15.5/16, [["block_fermenting_barrel", 0]]);
	model.addBox(14.5/16, 0/16, 7/16, 15.5/16, 16/16, 9/16, [["block_fermenting_barrel", 0]]);
	model.addBox(14.5/16, 0/16, 2/16, 15.5/16, 16/16, 5/16, [["block_fermenting_barrel", 0]]);
	model.addBox(2/16, 0/16, 0.5/16, 5/16, 16/16, 1.5/16, [["block_fermenting_barrel", 0]]);
	model.addBox(7/16, 0/16, 14.5/16, 9/16, 16/16, 15.5/16, [["block_fermenting_barrel", 0]]);
	model.addBox(11/16, 0/16, 0.5/16, 14/16, 16/16, 1.5/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0.5/16, 0/16, 11/16, 1.5/16, 16/16, 14/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0.5/16, 0/16, 7/16, 1.5/16, 16/16, 9/16, [["block_fermenting_barrel", 0]]);
	model.addBox(0.5/16, 0/16, 2/16, 1.5/16, 16/16, 5/16, [["block_fermenting_barrel", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_fermenting_barrel, 0, render);




// file: ActuallyAdditions/blocks/models/generator.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(15/16, 15/16, 1/16, 16/16, 16/16, 15/16, [["block_coal_generator_top", 0]]);
	model.addBox(0/16, 15/16, 15/16, 16/16, 16/16, 16/16, [["block_coal_generator_top", 0]]);
	model.addBox(0/16, 15/16, 1/16, 1/16, 16/16, 15/16, [["block_coal_generator_top", 0]]);
	model.addBox(0/16, 15/16, 0/16, 16/16, 16/16, 1/16, [["block_coal_generator_top", 0]]);
	model.addBox(0/16, 0/16, 15/16, 1/16, 15/16, 16/16, [["block_coal_generator_top", 0]]);
	model.addBox(0/16, 0/16, 0/16, 1/16, 15/16, 1/16, [["block_coal_generator_top", 0]]);
	model.addBox(15/16, 0/16, 0/16, 16/16, 15/16, 1/16, [["block_coal_generator_top", 0]]);
	model.addBox(15/16, 0/16, 15/16, 16/16, 15/16, 16/16, [["block_coal_generator_top", 0]]);
	model.addBox(1/16, 1/16, 1/16, 15/16, 15/16, 15/16, [["block_coal_generator", 0]]);
	model.addBox(0.5/16, 0/16, 1/16, 1.5/16, 15.5/16, 15/16, [["block_coal_generator_bottom", 0]]);
	model.addBox(14.5/16, 0/16, 1/16, 15.5/16, 15.5/16, 15/16, [["block_coal_generator_side", 0]]);
	model.addBox(1/16, 0/16, 14.5/16, 15/16, 15.5/16, 15.5/16, [["block_coal_generator_side", 0]]);
	model.addBox(1/16, 13/16, 0.5/16, 15/16, 15.5/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(10/16, 14.5/16, 1.5/16, 14.5/16, 15.5/16, 14.5/16, [["block_coal_generator_top", 0]]);
	model.addBox(1.5/16, 14.5/16, 1.5/16, 6/16, 15.5/16, 14.5/16, [["block_coal_generator_top", 0]]);
	model.addBox(6/16, 14.5/16, 1.5/16, 10/16, 15.5/16, 6/16, [["block_coal_generator_top", 0]]);
	model.addBox(6/16, 14.5/16, 10/16, 10/16, 15.5/16, 14.5/16, [["block_coal_generator_top", 0]]);
	model.addBox(1/16, 0/16, 0.5/16, 15/16, 3/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(4/16, 12/16, 0.5/16, 6/16, 13/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(1/16, 4/16, 0.5/16, 15/16, 8/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(12/16, 8/16, 0.5/16, 15/16, 13/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(1/16, 8/16, 0.5/16, 4/16, 13/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(9/16, 3/16, 0.5/16, 10/16, 4/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(12/16, 3/16, 0.5/16, 15/16, 4/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(10/16, 12/16, 0.5/16, 12/16, 13/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(1/16, 3/16, 0.5/16, 4/16, 4/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(6/16, 3/16, 0.5/16, 7/16, 4/16, 1.5/16, [["block_coal_generator", 0]]);
	model.addBox(1.5/16, 0/16, 1.5/16, 14.5/16, 1/16, 14.5/16, [["block_coal_generator_bottom", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_coal_generator, 0, render);




// file: ActuallyAdditions/blocks/models/giant_chest_large.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(1/16, 1/16, 1/16, 15/16, 15/16, 15/16, [["block_giant_chest_large", 0]]);
	model.addBox(0/16, 0/16, 10/16, 1/16, 16/16, 13/16, [["block_giant_chest_large", 0]]);
	model.addBox(0/16, 8/16, 1/16, 1/16, 10/16, 10/16, [["block_giant_chest_large", 0]]);
	model.addBox(15/16, 8/16, 6/16, 16/16, 10/16, 15/16, [["block_giant_chest_large", 0]]);
	model.addBox(6/16, 8/16, 0/16, 15/16, 10/16, 1/16, [["block_giant_chest_large", 0]]);
	model.addBox(1/16, 8/16, 15/16, 10/16, 10/16, 16/16, [["block_giant_chest_large", 0]]);
	model.addBox(0/16, 8/16, 13/16, 1/16, 10/16, 15/16, [["block_giant_chest_large", 0]]);
	model.addBox(15/16, 8/16, 1/16, 16/16, 10/16, 3/16, [["block_giant_chest_large", 0]]);
	model.addBox(13/16, 8/16, 15/16, 15/16, 10/16, 16/16, [["block_giant_chest_large", 0]]);
	model.addBox(1/16, 8/16, 0/16, 3/16, 10/16, 1/16, [["block_giant_chest_large", 0]]);
	model.addBox(15/16, 0/16, 3/16, 16/16, 16/16, 6/16, [["block_giant_chest_large", 0]]);
	model.addBox(10/16, 0/16, 15/16, 13/16, 16/16, 16/16, [["block_giant_chest_large", 0]]);
	model.addBox(3/16, 0/16, 0/16, 6/16, 16/16, 1/16, [["block_giant_chest_large", 0]]);
	model.addBox(1/16, 15/16, 1/16, 15/16, 16/16, 15/16, [["block_giant_chest_top", 0]]);
	model.addBox(1/16, 0/16, 1/16, 15/16, 1/16, 15/16, [["block_giant_chest_top", 0]]);
	model.addBox(0/16, 8/16, 0/16, 1/16, 10/16, 1/16, [["block_giant_chest_large", 0]]);
	model.addBox(0/16, 8/16, 15/16, 1/16, 10/16, 16/16, [["block_giant_chest_large", 0]]);
	model.addBox(15/16, 8/16, 15/16, 16/16, 10/16, 16/16, [["block_giant_chest_large", 0]]);
	model.addBox(15/16, 8/16, 0/16, 16/16, 10/16, 1/16, [["block_giant_chest_large", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_giant_chest_large, 0, render);




// file: ActuallyAdditions/blocks/models/giant_chest_medium.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
model.addBox(1/16, 1/16, 1/16, 15/16, 15/16, 15/16, [["block_giant_chest_medium", 0]]);
model.addBox(0/16, 0/16, 10/16, 1/16, 16/16, 13/16, [["block_giant_chest_medium", 0]]);
model.addBox(0/16, 8/16, 1/16, 1/16, 10/16, 10/16, [["block_giant_chest_medium", 0]]);
model.addBox(15/16, 8/16, 6/16, 16/16, 10/16, 15/16, [["block_giant_chest_medium", 0]]);
model.addBox(6/16, 8/16, 0/16, 15/16, 10/16, 1/16, [["block_giant_chest_medium", 0]]);
model.addBox(1/16, 8/16, 15/16, 10/16, 10/16, 16/16, [["block_giant_chest_medium", 0]]);
model.addBox(0/16, 8/16, 13/16, 1/16, 10/16, 15/16, [["block_giant_chest_medium", 0]]);
model.addBox(15/16, 8/16, 1/16, 16/16, 10/16, 3/16, [["block_giant_chest_medium", 0]]);
model.addBox(13/16, 8/16, 15/16, 15/16, 10/16, 16/16, [["block_giant_chest_medium", 0]]);
model.addBox(1/16, 8/16, 0/16, 3/16, 10/16, 1/16, [["block_giant_chest_medium", 0]]);
model.addBox(15/16, 0/16, 3/16, 16/16, 16/16, 6/16, [["block_giant_chest_medium", 0]]);
model.addBox(10/16, 0/16, 15/16, 13/16, 16/16, 16/16, [["block_giant_chest_medium", 0]]);
model.addBox(3/16, 0/16, 0/16, 6/16, 16/16, 1/16, [["block_giant_chest_medium", 0]]);
model.addBox(1/16, 15/16, 1/16, 15/16, 16/16, 15/16, [["block_giant_chest_top", 0]]);
model.addBox(1/16, 0/16, 1/16, 15/16, 1/16, 15/16, [["block_giant_chest_top", 0]]);
model.addBox(0/16, 8/16, 0/16, 1/16, 10/16, 1/16, [["block_giant_chest_medium", 0]]);
model.addBox(0/16, 8/16, 15/16, 1/16, 10/16, 16/16, [["block_giant_chest_medium", 0]]);
model.addBox(15/16, 8/16, 15/16, 16/16, 10/16, 16/16, [["block_giant_chest_medium", 0]]);
model.addBox(15/16, 8/16, 0/16, 16/16, 10/16, 1/16, [["block_giant_chest_medium", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_giant_chest_medium, 0, render);




// file: ActuallyAdditions/blocks/models/giant_chest.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
model.addBox(1/16, 1/16, 1/16, 15/16, 15/16, 15/16, [["block_giant_chest_top", 0]]);
model.addBox(0/16, 0/16, 10/16, 1/16, 16/16, 13/16, [["block_giant_chest_large", 0]]);
model.addBox(15/16, 0/16, 3/16, 16/16, 16/16, 6/16, [["block_giant_chest_large", 0]]);
model.addBox(10/16, 0/16, 15/16, 13/16, 16/16, 16/16, [["block_giant_chest_large", 0]]);
model.addBox(3/16, 0/16, 0/16, 6/16, 16/16, 1/16, [["block_giant_chest_large", 0]]);
model.addBox(1/16, 15/16, 1/16, 15/16, 16/16, 15/16, [["block_giant_chest_top", 0]]);
model.addBox(1/16, 0/16, 1/16, 15/16, 1/16, 15/16, [["block_giant_chest_top", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_giant_chest, 0, render);




// file: ActuallyAdditions/blocks/models/item_viewer_hoping.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(0, 10, 0, 16, 11, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(0, 11, 0, 2, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(14, 11, 0, 16, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 0, 14, 16, 2, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 14, 14, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(4, 4, 4, 12, 10, 12, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(6, 0, 6, 10, 4, 10, [["block_item_viewer_hopping_outside", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_item_viewer, 0, render);

//side

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(0, 10, 0, 16, 11, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(0, 11, 0, 2, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(14, 11, 0, 16, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 0, 14, 16, 2, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 14, 14, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(4, 4, 4, 12, 10, 12, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(6, 4, 0, 10, 8, 4, [["block_item_viewer_hopping_outside", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_item_viewer, 0, render);




// file: ActuallyAdditions/blocks/models/oil_generator.js

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(15/16, 15/16, 1/16, 16/16, 16/16, 15/16, [["block_oil_generator_top", 0]]);
	model.addBox(0/16, 15/16, 15/16, 16/16, 16/16, 16/16, [["block_oil_generator_top", 0]]);
	model.addBox(0/16, 15/16, 1/16, 1/16, 16/16, 15/16, [["block_oil_generator_top", 0]]);
	model.addBox(0/16, 15/16, 0/16, 16/16, 16/16, 1/16, [["block_oil_generator_top", 0]]);
	model.addBox(0/16, 0/16, 15/16, 1/16, 15/16, 16/16, [["block_oil_generator_top", 0]]);
	model.addBox(0/16, 0/16, 0/16, 1/16, 15/16, 1/16, [["block_oil_generator_top", 0]]);
	model.addBox(15/16, 0/16, 0/16, 16/16, 15/16, 1/16, [["block_oil_generator_top", 0]]);
	model.addBox(15/16, 0/16, 15/16, 16/16, 15/16, 16/16, [["block_oil_generator_top", 0]]);
	model.addBox(0.5, 0/16, 1/16, 1.5, 15.5, 15/16, [["block_coal_generator_bottom", 0]]);
	model.addBox(14.5, 0/16, 1/16, 15.5, 15.5, 15/16, [["block_coal_generator_side", 0]]);
	model.addBox(1/16, 0/16, 14.5, 15/16, 15.5, 15.5, [["block_coal_generator_side", 0]]);
	model.addBox(1/16, 13/16, 0.5, 15/16, 15.5, 1.5, [["block_oil_generator", 0]]);
	model.addBox(10/16, 14.5, 1.5, 14.5, 15.5, 14.5, [["block_oil_generator_top", 0]]);
	model.addBox(1.5, 14.5, 1.5, 6/16, 15.5, 14.5, [["block_oil_generator_top", 0]]);
	model.addBox(6/16, 14.5, 1.5, 10/16, 15.5, 6/16, [["block_oil_generator_top", 0]]);
	model.addBox(6/16, 14.5, 10/16, 10/16, 15.5, 14.5, [["block_oil_generator_top", 0]]);
	model.addBox(1/16, 0/16, 0.5, 15/16, 3/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(4/16, 12/16, 0.5, 6/16, 13/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(1/16, 4/16, 0.5, 15/16, 8/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(12/16, 8/16, 0.5, 15/16, 13/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(1/16, 8/16, 0.5, 4/16, 13/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(9/16, 3/16, 0.5, 10/16, 4/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(12/16, 3/16, 0.5, 15/16, 4/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(10/16, 12/16, 0.5, 12/16, 13/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(1/16, 3/16, 0.5, 4/16, 4/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(6/16, 3/16, 0.5, 7/16, 4/16, 1.5, [["block_oil_generator", 0]]);
	model.addBox(1.5, 0/16, 1.5, 14.5, 1/16, 14.5, [["block_coal_generator_bottom", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_oil_generator, 0, render);




// file: testOpenGui.js

var testOpen = new UI.Container();
Callback.addCallback("PostLoaded", function () {
	testOpen.openAs(generatorUI);
});




