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