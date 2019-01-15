var EmpowererApi = {
	connections: [{x: 3, z: 0}, {x: -3, z: 0}, {x: 0, z: 3}, {x: 0, z: -3}],
	connect: function(c, coords, tile){
		let coord = {x: coords.x+this.connections[c].x, y: coords.y, z: coords.z+this.connections[c].z};
		let block = World.getBlock(coord.x, coord.y, coord.z).id === BlockID.block_display_stand;
		if(block){
			let tile = World.getTileEntity(coord.x, coord.y, coord.z);
			tile.connect[]=
			Game.message("Connected Block at x: "+coord.x+", y: "+coord.y+", z: "+coord.z);
		}
		if(connect != null && block)
			Game.message("Already Connected Block at x: "+coord.x+", y: "+coord.y+", z: "+coord.z);
	}
};
var DisplayStandApi = {

};
//


for(let i in connect){console.log(connect[i])};
