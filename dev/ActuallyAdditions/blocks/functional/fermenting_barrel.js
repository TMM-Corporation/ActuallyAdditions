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
