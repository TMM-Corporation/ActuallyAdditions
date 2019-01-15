
var setAnim = function(tile, item){
  //Game.message("(x: " + tile.x + ", y: " + tile.y + ", z: " + tile.z + ")");
  item.id && tile.anim.describeItem({
	id: item.id,
	data: item.data,
	count: 1,
	size: 0.5,
	rotation: [0, tile.data.time, 0],
  });
  tile.anim.load();
};