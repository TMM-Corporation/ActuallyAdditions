empLib = {
	getEnergy: function(x, y, z, amount){
		var tile = World.getTileEntity(x, y, z);
		if(tile.getEnergy){
			tile.getEnergy(amount);
			return amount;
		}
	},
	getItem: function(x, y, z, item){
		var tile = World.getTileEntity(x, y, z);
		if(tile.getItem){
			tile.getItem(item);
			return item;
		}
	}
};