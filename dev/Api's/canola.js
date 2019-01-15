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
