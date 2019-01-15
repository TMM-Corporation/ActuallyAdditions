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
