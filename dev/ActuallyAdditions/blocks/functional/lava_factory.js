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
