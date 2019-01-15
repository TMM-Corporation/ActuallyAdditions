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
