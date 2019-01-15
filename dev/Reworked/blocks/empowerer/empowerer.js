MachineRegistry.registerPrototype(BlockID.block_empowerer, {
	defaultValues: {
		progress: 0,
		item: null,
		items:{
			item1: null,
			item2: null,
			item3: null,
			item4: null,
			center: null
		},
		connects: {
			connect1: null,
			connect2: null,
			connect3: null,
			connect4: null
		},
		energyTotal: 0,
		result: null,
		consumption: 0
	},
	connect: function(connect, c){
		let block = World.getBlock(c.x, c.y, c.z).id === BlockID.block_display_stand;
		if(connect === null && block){
			let tile = World.getTileEntity(c.x, c.y, c.z);
			connect = tile.connect(this);
			Game.message("Connected Block at x: "+c.x+", y: "+c.y+", z: "+c.z);
		}
		if(connect != null && block)
			Game.message("Already Connected Block at x: "+c.x+", y: "+c.y+", z: "+c.z);
	},
	recipeRitual: function(){
		var c1 = this.data.connects.connect1;
		var c2 = this.data.connects.connect2;
		var c3 = this.data.connects.connect3;
		var c4 = this.data.connects.connect4;
		this.data.consumption = 0;
		this.data.items.item1 = World.getTileEntity(c1.x, c1.y, c1.z).getID();
		this.data.items.item2 = World.getTileEntity(c2.x, c2.y, c2.z).getID();
		this.data.items.item3 = World.getTileEntity(c3.x, c3.y, c3.z).getID();
		this.data.items.item4 = World.getTileEntity(c4.x, c4.y, c4.z).getID();
		var l = 0;
		var st_rt = false;
		for(let i in ec){
			for (let y in this.data.items){
				for(let u in ec[i]){
					if(this.data.items[y]===bc[i][u]){
						if(this.data.items.center === bc[i].center){
							this.data.result=ec[i].results.item;
							this.data.consumption+=4000;
							l++;
							delete bc[i][u];
						}else{
							this.data.result=ec[i].results.block;
							this.data.consumption+=40000;
							l++;
							delete bc[i][u];
						}
						if(l==5)st_rt=true;
						break;
					}
				}
			}
		}
		bc=ec;
		if(st_rt==true && this.data.energyTotal===this.data.consumption){
			for(let i in this.data.items){
				this.data.items[i]=null;
			}
			World.getTileEntity(c1.x, c1.y, c1.z).getItem();
			World.getTileEntity(c2.x, c2.y, c2.z).getItem();
			World.getTileEntity(c3.x, c3.y, c3.z).getItem();
			World.getTileEntity(c4.x, c4.y, c4.z).getItem();

			this.data.energyTotal += World.getTileEntity(c1.x, c1.y, c1.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal += World.getTileEntity(c2.x, c2.y, c2.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal += World.getTileEntity(c3.x, c3.y, c3.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal += World.getTileEntity(c4.x, c4.y, c4.z).getEnergy(this.data.consumption/5);
			this.data.energyTotal -= this.data.consumption;
		}
	},
	click: function(id, count, data, c){
		this.connect(this.data.connects.connect1, {x: this.x-3, y: this.y, z: this.z});
		this.connect(this.data.connects.connect2, {x: this.x+3, y: this.y, z: this.z});
		this.connect(this.data.connects.connect3, {x: this.x, y: this.y, z: this.z-3});
		this.connect(this.data.connects.connect4, {x: this.x, y: this.y, z: this.z+3});
		if(id ===0)
			id = null;
			this.addAnim(id, count, data);
		//this.recipeRitual();
	},
	drop: function(){
		Player.addItemToInventory(this.data.items.center.id, 1, this.data.items.center.data); this.data.items.center=null; this.anim.destroy();
	},
	destroy: function(){
		if(this.data.items.center){
			this.drop();
		}
	},
	anim: null,
	created: function(){
		this.anim = new Animation.item(this.x+0.5, this.y+1, this.z+0.5);
	},
	init: function(){
		this.anim = new Animation.item(this.x+0.5, this.y+1, this.z+0.5);
	},
	addAnim: function(id, count, data){
		if(this.data.items.center===null || this.data.items.center===undefined || id != null){
			Player.decreaseCarriedItem(1);
			this.data.items.center = {id: id, count: 1, data: data};
			setAnim(this, this.data.items.center);
		}else{this.drop();}
	}
});
