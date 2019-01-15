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
