
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

