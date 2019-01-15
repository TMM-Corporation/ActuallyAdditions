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
