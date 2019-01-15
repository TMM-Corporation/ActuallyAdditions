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
