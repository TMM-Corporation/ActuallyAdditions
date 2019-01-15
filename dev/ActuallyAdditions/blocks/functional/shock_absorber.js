Callback.addCallback("Explosion", function (coords, params) {
	let c = coords;
	let p = params;
	c.x = Math.floor(c.x);
	c.y = Math.floor(c.y);
	c.z = Math.floor(c.z);
	//Game.message("x: "+c.x+", y: "+c.y+", z: "+c.z);
   // Game.message("power: "+p.power);
  //  Game.message("entity: "+p.entity);
 //   Game.message("onFire: "+p.onFire);
//	Game.message("someBool: "+p.someBool);
	finder: for(let xx= -5; xx<5; xx++){
		 for(let yy= -5; yy<5; yy++){
			for(let zz= -5; zz<5; zz++){
				let block = World.getBlock(c.x+xx, c.y+yy, c.z+zz).id === BlockID.block_shock_absorber;
				if(block && p.power===4){
					Game.prevent();
					break finder;
				}
			}
		}
	}
});