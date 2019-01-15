/* Этот код получается слишком кривым. Возможно, в светлом будущем он станет лучше. */


// High-Voltage Transformator
IDRegistry.genBlockID("hvTransformator");
Block.createBlock("hvTransformator", [
	{name: "High-Voltage Transformator", texture: [["std_bottom", 0], ["std_top", 0], ["hv_transformator", 0], ["hv_transformator", 0], ["hv_transformator", 0], ["hv_transformator", 0]], inCreative: true}
]);
ICRender.getGroup("ic-transformator").add(BlockID.hvTransformator, -1);

TileEntity.registerPrototype(BlockID.hvTransformator, {
	defaultValues: {
		transmitter: false,
		energy: 0,
		consumers: [],
		nodes: []
	},

	click: function(id, count, data){
		if(id == BlockID.hvConnector) return true;
		this.data.transmitter = !this.data.transmitter;
		if(this.data.transmitter){
			Game.message("Transmitter");
			this.updateConsumers();
		} else {
			Game.message("Reciever");
		}
		return true;
	},

	created: function(){
		let coords = {x: this.x, y: this.y, z: this.z};
		let sideCoords = getSideCoords(coords);
		let transmitters = [];
		for(var i in sideCoords){
			if(World.getBlockID(sideCoords[i].x, sideCoords[i].y, sideCoords[i].z) == BlockID.hvConnector){
				WireApi.getTransmitters(sideCoords[i], transmitters);
			}
		}
		for(var i in transmitters){
			let coords = transmitters[i];
			let transmitter = World.getTileEntity(coords.x, coords.y, coords.z);
			transmitter.updateConsumers();
		}
	},

	energyTick: function(type, src){
		if(this.data.transmitter){
			let amount = src.amount();
			for(var i in this.data.consumers) {
				let coords = this.data.consumers[i];
				let consumer = World.getTileEntity(coords.x, coords.y, coords.z);
				if(consumer) {
					let energy = Math.min(1000 - consumer.data.energy, Math.min(1000, amount));
					consumer.data.energy += src.get(energy);
					amount = src.amount();
				}
				else {
					this.updateConsumers();
					break;
				}
			}
		} else {
			this.data.energy = src.add(this.data.energy);
		}
	},

	updateConsumers: function(){
		let coords = {x: this.x, y: this.y, z: this.z};
		let sideCoords = getSideCoords(coords);
		this.data.consumers = [];
		for(var i in sideCoords){
			if(World.getBlockID(sideCoords[i].x, sideCoords[i].y, sideCoords[i].z) == BlockID.hvConnector){
				WireApi.getConsumers(sideCoords[i], this.data.consumers);
			}
		}
	},

	isGenerator: function() {return !this.data.transmitter;}
});

EnergyTileRegistry.addEnergyTypeForId(BlockID.hvTransformator, EU);

Callback.addCallback("ItemUse", function(coords, item, block){
	let x = coords.relative.x;
	let y = coords.relative.y;
	let z = coords.relative.z;
	if(block.id == BlockID.hvTransformator && item.id == BlockID.hvConnector){
		World.setBlock(x, y, z, BlockID.hvConnector, 0);
	}
});




// High-Voltage Connector
IDRegistry.genBlockID("hvConnector");
Block.createBlock("hvConnector", [
	{name: "High-Voltage Connector", texture: [["hv_connector", 0]], inCreative: true}
]);
RenderTools.setupConnectorRender(BlockID.hvConnector);

Callback.addCallback("DestroyBlock", function(coords, block, player){
	if(block.id == BlockID.hvConnector){
		// Get transmitters
		let transmitters = [];
		WireApi.getTransmitters(coords, transmitters);

		// Remove animations
		WireApi.wires = WireApi.wires.filter(function(wire){
			let wc1 = wire.coords[0];
			let wc2 = wire.coords[1];
			if((wc1.x == coords.x && wc1.y == coords.y && wc1.z == coords.z)
					|| (wc2.x == coords.x && wc2.y == coords.y && wc2.z == coords.z)){
				// Remove wire from array and remove animation of the returned item;
				wire.animation.destroy();
				World.drop(coords.x, coords.y, coords.z, ItemID.wireCoil, 1, 0);
				return false;
			}
			return true;
		});

		for(var i in transmitters){
			let coords = transmitters[i];
			let transmitter = World.getTileEntity(coords.x, coords.y, coords.z);
			transmitter.updateConsumers();
		}
	}
});



IDRegistry.genItemID("wireCoil");
Item.createItem("wireCoil", "Wire coil", {name: "wire_coil", meta: 0}, {});

var WireApi = {
	connector1: undefined,

	wires: [],

	setupWire: function(pos1, pos2){
		let distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) + Math.pow(pos1.z - pos2.z, 2));
		if(distance == 0 || distance > 32) {
			return false;
		}
		for(var i in WireApi.wires){
			if(WireApi.equal(WireApi.wires[i].coords, [pos1, pos2])){
				return false;
			}
		}
		let animation = WireApi.addWire(pos1, pos2, distance);
		WireApi.wires.push({animation: animation, coords: [pos1, pos2]});
		return true;
	},

	equal: function(coords1, coords2){
		let a1 = coords1[0];
		let a2 = coords1[1];
		let b1 = coords2[0];
		let b2 = coords2[1];
		return (a1.x == b1.x && a1.y == b1.y && a1.z == b1.z
			 && a2.x == b2.x && a2.y == b2.y && a2.z == b2.z)
			|| (a1.x == b2.x && a1.y == b2.y && a1.z == b2.z
			 && a2.x == b1.x && a2.y == b1.y && a2.z == b1.z);

	},

	addWire: function(pos1, pos2, distance){
		pos1 = {x: pos1.x + 0.5, y: pos1.y - 1, z: pos1.z + 0.5};
		pos2 = {x: pos2.x + 0.5, y: pos2.y - 1, z: pos2.z + 0.5};
		let center = {x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2, z: (pos1.z + pos2.z) / 2}

		var animationWire = new Animation.Base(center.x, center.y, center.z);

		var render = new Render({skin: "mob/wire.png"});
		var partWire = render.getPart("body").addPart("wire");

		var angleX = (pos2.y == pos1.y)? Math.PI / 2: Math.atan((pos2.y - pos1.y) / (pos1.z - pos2.z));
		var angleY = (pos2.x == pos1.x)? Math.PI / 2: Math.atan((pos1.z - pos2.z) / (pos1.x - pos2.x));
		var angleZ = (pos1.x == pos2.x)? 0: Math.atan((pos2.y - pos1.y) / (pos1.x - pos2.x));

		//let vec = {x: center.x - pos1.x, y: center.y - pos1.y, z: center.z - pos1.z};
		//let veclen = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2) + Math.pow(vec.z, 2));
		//let nX = vec.x / veclen;
		//let nY = vec.y / veclen;
		//let nZ = vec.z / veclen;


		if(!distance) {
			distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) + Math.pow(pos1.z - pos2.z, 2));
		}

		//let pitch = Math.asin(nY);
		//let yaw = pitch == 0? 0: nZ / Math.cos(pitch);

		partWire.setRotation(angleX, angleY, angleZ);
		//partWire.setRotation(0, yaw, pitch);
		render.setPart("wire", [{
				type: "box",
				coords: { x: 0, y: 0, z: 0 },
				size: { x: distance * 16, y: 1, z: 1 }
			},], {});

		animationWire.describe({render: render.getId()});
		animationWire.load();

		return animationWire;
	},

	getTransmitters: function(coords, transmitters){
		let checked = [];
		//y = -1 grants that this point won't be used in the game
		let pointEmpty = {x: 0, y: -1, z: 0};
		WireApi.getNodesRecursive(coords, pointEmpty, transmitters, checked, true);
	},

	getConsumers: function(coords, consumers){
		let checked = [];
		//y = -1 grants that this point won't be used in the game
		let pointEmpty = {x: 0, y: -1, z: 0};
		WireApi.getNodesRecursive(coords, pointEmpty, consumers, checked, false);
	},

	getNodesRecursive: function(coords, prev, consumers, checked, transmitter){
		for(var i in checked){
			if(checked[i].x == coords.x && checked[i].y == coords.y && checked[i].z == coords.z){
				return;
			}
		}
		checked.push(coords);

		let sideCoords = getSideCoords(coords);
		for(var i in sideCoords){
			let x = sideCoords[i].x;
			let y = sideCoords[i].y;
			let z = sideCoords[i].z;
			let tileEntity = World.getTileEntity(x, y, z);
			let block = World.getBlockID(x, y, z);
			if(tileEntity != null && block == BlockID.hvTransformator && transmitter == tileEntity.data.transmitter){
				consumers.push({x: x, y: y, z: z});
			}
		}

		for(var i in WireApi.wires){
			if(WireApi.equal(WireApi.wires[i].coords, [coords, prev])){
				continue;
			}
			let wc1 = WireApi.wires[i].coords[0];
			let wc2 = WireApi.wires[i].coords[1];
			Logger.Log(JSON.stringify(wc1));
			Logger.Log(JSON.stringify(wc2));
			Logger.Log(JSON.stringify(coords));
			if(wc1.x == coords.x && wc1.y == coords.y && wc1.z == coords.z){
				WireApi.getNodesRecursive(wc2, wc1, consumers, checked, transmitter);
			} else if(wc2.x == coords.x && wc2.y == coords.y && wc2.z == coords.z){
				WireApi.getNodesRecursive(wc1, wc2, consumers, checked, transmitter);
			}
		}
		return consumers;
	}
}

Saver.addSavesScope("wires",
	function read(scope){
		WireApi.wires = [];
		for(var i in scope.wires){
			let pos1 = scope.wires[i][0];
			let pos2 = scope.wires[i][1];
			let animation = WireApi.addWire(pos1, pos2);
			WireApi.wires.push({animation: animation, coords : [pos1, pos2]});
		}
	},

	function save(){
		var scope = [];
		for(var i in WireApi.wires){
			scope.push(WireApi.wires[i].coords);
		}
		return {wires: scope};
	}
);

Item.registerUseFunction("wireCoil", function (coords, item, block) {
	if(block.id != BlockID.hvConnector)
		return;
	if(!WireApi.connector1){
		WireApi.connector1 = {x: coords.x, y: coords.y, z: coords.z};
	} else {
		let connector2 = {x: coords.x, y: coords.y, z: coords.z};
		if(WireApi.setupWire(WireApi.connector1, connector2)){
			let transmitters = [];
			WireApi.getTransmitters(connector2, transmitters);
			for(var i in transmitters){
				let coords = transmitters[i];
				let transmitter = World.getTileEntity(coords.x, coords.y, coords.z);
				transmitter.updateConsumers();
			}
			Player.decreaseCarriedItem();
			WireApi.connector1 = null;
		}
	}
});
