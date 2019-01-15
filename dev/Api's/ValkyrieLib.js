/*
 * __	 __	_ _			   _	  _	 _ _
 * \ \   / /_ _| | | ___   _ _ __(_) ___| |   (_) |__
 *  \ \ / / _` | | |/ / | | | '__| |/ _ \ |   | | '_ \
 *   \ V / (_| | |   <| |_| | |  | |  __/ |___| | |_) |
 *	\_/ \__,_|_|_|\_\\__, |_|  |_|\___|_____|_|_.__/
 *					 |___/
 */
//modLogger.Logger.Log("test");
const ValkyrieLib = {
	/*itemRegistry: function(itemid, itemname, itemtexture, stacks){
		IDRegistry.genItemID(itemid);
		Item.createItem(itemid, itemname, {name: itemtexture, meta: 0}, {stack: stacks});
	},
	blockRegistry: function(blockid, blockname, bottom, top, sides, visible, type){
		let t1 = bottom;
		let t2 = top;
		let t3 = sides;
		IDRegistry.genBlockID(blockid);
		if(type != ""){
			Block.createBlock(blockid, [
				{name: blockname texture: [[t1, 0], [t2, 0], [t3, 0]], inCreative: visible}
			], type);
		}else{
			Block.createBlock(blockid, [
				{name: blockname texture: [[t1, 0], [t2, 0], [t3, 0]], inCreative: visible}
			]);
		}
	},*/
	addRuTranslation: function(name, newname){
		Translation.addTranslation(name, {ru: " "+newname+" "});
	},
	addDrop: function(block, isItem, drop, count){
		Block.registerDropFunction(block, function(coords, blockID, blockData, level){
			return [[drop, count, 0]];
		});
	},
	lens_creator: function(type, dyedata){
		var itemid = "lens_"+type;
		var itemname = "Lens "+type;
		var itemtexture = itemid;
		var blockid = "laser_"+itemid;
		var blockname = "Laser "+itemname;
		var texture1 = "lens_"+type+"_top_bottom";
		var texture2 = "lens_"+type+"_side";
		IDRegistry.genItemID(itemid);
		Item.createItem(itemid, itemname, {name: itemtexture, meta: 0}, {stack: 64});

		IDRegistry.genBlockID(blockid);
		Block.createBlock(blockid, [{name: blockname, texture: [[texture1, 0], [texture1, 0], [texture2, 0]], inCreative: false}], opacity_block_envtech);
		Block.registerDropFunction(blockid, function(coords, blockID, blockData){
				return [[ItemID[itemid], 1, 0]]
		});

		Item.registerUseFunction(itemid, function(coords, item, block){
		var place = coords.relative;
			if(GenerationUtils.isTransparentBlock(World.getBlockID(place.x, place.y, place.z))){
				World.setBlock(place.x, place.y, place.z, BlockID[blockid]);
				Player.setCarriedItem(item.id, item.count - 1, item.data);
			}
		});
		Callback.addCallback("PostLoaded", function(){
			if(dyedata == 16){
				Recipes.addShaped({id: ItemID[itemid], count: 1, data: 0}, [
					"b b",
					"bbb",
					"b b"], [
						'b', 20, 0]);
			}else if(dyedata == 17){
				Recipes.addShaped({id: ItemID[itemid], count: 1, data: 0}, [
					"b b",
					"bab",
					"b b"], [
						'a', BlockID.normal_block_erodium, -1,
						'b', 20, 0]);
			}else{
				Recipes.addShaped({id: ItemID[itemid], count: 1, data: 0}, [
					"ab",
					"",
					""], [
						'a', ItemID.lens_clear, 0,
						'b', 351, dyedata]);
			}
		});


		var render = new ICRender.Model();
		var model = BlockRenderer.createModel();
		var t2 = texture1;
		var t1 = texture2;

		model.addBox(3/16, 6/16, 3/16, 13/16, 7/16, 13/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(3/16, 9/16, 3/16, 13/16, 10/16, 13/16, [[t2, 0], [t2, 0], [t1, 0]]);

		model.addBox(4/16, 7/16, 2/16, 12/16, 9/16, 3/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(4/16, 7/16, 13/16, 12/16, 9/16, 14/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(2/16, 7/16, 4/16, 3/16, 9/16, 12/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(13/16, 7/16, 4/16, 14/16, 9/16, 12/16, [[t2, 0], [t2, 0], [t1, 0]]);

		model.addBox(2/16, 0/16, 3/16, 3/16, 16/16, 4/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(3/16, 0/16, 2/16, 4/16, 16/16, 3/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(12/16, 0/16, 2/16, 13/16, 16/16, 3/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(13/16, 0/16, 3/16, 14/16, 16/16, 4/16, [[t2, 0], [t2, 0], [t1, 0]]);

		model.addBox(2/16, 0/16, 12/16, 3/16, 16/16, 13/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(3/16, 0/16, 13/16, 4/16, 16/16, 14/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(13/16, 0/16, 12/16, 14/16, 16/16, 13/16, [[t2, 0], [t2, 0], [t1, 0]]);
		model.addBox(12/16, 0/16, 13/16, 13/16, 16/16, 14/16, [[t2, 0], [t2, 0], [t1, 0]]);

		render.addEntry(model);
		BlockRenderer.setStaticICRender(BlockID[blockid], 0, render);
		Block.setBlockShape(BlockID[blockid], {x: 3/16, y: 0, z: 3/16}, {x: 14/16, y: 1, z: 14/16});
	},
	beaconModel: function(tier){
		var render = new ICRender.Model();
		var model = BlockRenderer.createModel();
		var t1 = "pnbbct"+tier+"_sides";
		var t2 = "pnbbct"+tier+"_top";
		var block = "pnbbct"+tier;
		var base = "st_p";
		var core = "laser_core";
		var anim = "cont_tier";
		/*
		 *t1 все
		 *t2 верх
		 */
		if(tier == "1"){
			for(let i in t1_nb){
				let a = t1_nb[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "2"){
			for(let i in t2_nb){
				let a = t2_nb[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "3"){
			for(let i in t3_nb){
				let a = t3_nb[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "4"){
			for(let i in t4_nb){
				let a = t4_nb[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "5"){
			for(let i in t5_nb){
				let a = t5_nb[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "6"){
			for(let i in t6_nb){
				let a = t6_nb[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}
		model.addBox(0/16, 4/16, 0/16, 1/16, 16/16, 1/16, [[t1, 0]]);//стойка 1
		model.addBox(0/16, 4/16, 15/16, 1/16, 16/16, 16/16, [[t2, 0]]);//стойка 2
		model.addBox(15/16, 4/16, 15/16, 16/16, 16/16, 16/16, [[t2, 0]]);//стойка 3
		model.addBox(15/16, 4/16, 0/16, 16/16, 16/16, 1/16, [[t1, 0]]);//стойка 4

		model.addBox(1/16, 15/16, 0/16, 15/16, 16/16, 1/16, [[t2, 0]]);//полоска 1
		model.addBox(1/16, 15/16, 15/16, 15/16, 16/16, 16/16, [[t2, 0]]);//полоска 2
		model.addBox(0/16, 15/16, 1/16, 1/16, 16/16, 15/16, [[t2, 0]]);//полоска 3
		model.addBox(15/16, 15/16, 1/16, 16/16, 16/16, 15/16, [[t2, 0]]);//полоска 4

		model.addBox(0/16, 0/16, 0/16, 16/16, 4/16, 16/16, [[base, 0]]);//низ

		model.addBox(2/16, 4/16, 2/16, 14/16, 7/16, 14/16, [[core, 0]]);//ядро низ
		model.addBox(3/16, 7/16, 3/16, 13/16, 11/16, 13/16, [[anim, 0]]);//анимация
		model.addBox(2/16, 11/16, 2/16, 14/16, 14/16, 14/16, [[core, 0]]);//ядро верх

		render.addEntry(model);
		BlockRenderer.setStaticICRender(BlockID[block], 0, render);
		//Block.setBlockShape(BlockID[block], {x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1});
	},
	minerModel: function(tier, type){
		var render = new ICRender.Model();
		var model = BlockRenderer.createModel();
		var block = "v"+type+"mct"+tier;
		var t1 = "vmct_bottom";
		var t2 = block+"_top";
		var t3 = "v"+type+"m_panel";
		/*
		 *t1 низ
		 *t2 верх
		 *t3 панельки
		 */


		if(tier == "1"){
			for(let i in vm1_structure){
				let a = vm1_structure[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "2"){
			for(let i in vm2_structure){
				let a = vm2_structure[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "3"){
			for(let i in vm3_structure){
				let a = vm3_structure[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "4"){
			for(let i in vm4_structure){
				let a = vm4_structure[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "5"){
			for(let i in vm5_structure){
				let a = vm5_structure[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "6"){
			for(let i in vm6_structure){
				let a = vm6_structure[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}

		model.addBox(0/16, 4/16, 0/16, 1/16, 16/16, 1/16, [[t2, 0]]);//стойка 1
		model.addBox(0/16, 4/16, 15/16, 1/16, 16/16, 16/16, [[t2, 0]]);//стойка 2
		model.addBox(15/16, 4/16, 15/16, 16/16, 16/16, 16/16, [[t2, 0]]);//стойка 3
		model.addBox(15/16, 4/16, 0/16, 16/16, 16/16, 1/16, [[t2, 0]]);//стойка 4

		model.addBox(1/16, 15/16, 0/16, 15/16, 16/16, 1/16, [[t2, 0]]);//полоска 1
		model.addBox(1/16, 15/16, 15/16, 15/16, 16/16, 16/16, [[t2, 0]]);//полоска 2
		model.addBox(0/16, 15/16, 1/16, 1/16, 16/16, 15/16, [[t2, 0]]);//полоска 3
		model.addBox(15/16, 15/16, 1/16, 16/16, 16/16, 15/16, [[t2, 0]]);//полоска 4

		model.addBox(6/16, 4/16, 0/16, 10/16, 15/16, 4/16, [[t3, 0]]);//панель 1
		model.addBox(6/16, 4/16, 12/16, 10/16, 15/16, 16/16, [[t3, 0]]);//панель 2
		model.addBox(12/16, 4/16, 6/16, 16/16, 15/16, 10/16, [[t3, 0]]);//панель 3
		model.addBox(0/16, 4/16, 6/16, 4/16, 15/16, 10/16, [[t3, 0]]);//панель 4

		model.addBox(0/16, 0/16, 0/16, 16/16, 4/16, 16/16, [[t1, 0]]);//низ

		model.addBox(1/16, 15/16, 6/16, 15/16, 16/16, 10/16, [[t3, 0]]);//верхняя панель 1
		model.addBox(6/16, 15/16, 1/16, 10/16, 16/16, 6/16, [[t3, 0]]);//верхняя панель 2
		model.addBox(6/16, 15/16, 10/16, 10/16, 16/16, 15/16, [[t3, 0]]);//верхняя панель 3

		model.addBox(4/16, 4/16, 4/16, 12/16, 9/16, 12/16, [[t1, 0]]);//лазерное ядро


		render.addEntry(model);
		BlockRenderer.setStaticICRender(BlockID[block], 0, render);
		Block.setBlockShape(BlockID[block], {x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1});
	},
	solarModel: function(tier){
		var render = new ICRender.Model();
		var model = BlockRenderer.createModel();
		var block = "sact" + tier;
		var t1 = block+"_bottom";
		var t2 = "st_p";
		var t3 = block+"_sides";
		/*
		 *t1 низ
		 *t2 верх
		 *t3 стороны
		 */

		if(tier == "1"){
			for(let i in t1_solar){
				let a = t1_solar[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "2"){
			for(let i in t2_solar){
				let a = t2_solar[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "3"){
			for(let i in t3_solar){
				let a = t3_solar[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "4"){
			for(let i in t4_solar){
				let a = t4_solar[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "5"){
			for(let i in t5_solar){
				let a = t5_solar[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}else
		if(tier == "6"){
			for(let i in t6_solar){
				let a = t6_solar[i];
				model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
			}
		}

		model.addBox(0/16, 12/16, 0/16, 16/16, 16/16, 16/16, [[t2, 0], [t2, 0], [t2, 0]]);//верх

		model.addBox(0/16, 0/16, 0/16, 1/16, 12/16, 1/16, [[t1, 0]]);//стойка 1
		model.addBox(0/16, 0/16, 15/16, 1/16, 12/16, 16/16, [[t1, 0]]);//стойка 2
		model.addBox(15/16, 0/16, 0/16, 16/16, 12/16, 1/16, [[t1, 0]]);//стойка 3
		model.addBox(15/16, 0/16, 15/16, 16/16, 12/16, 16/16, [[t1, 0]]);//стойка 4

		model.addBox(1/16, 0/16, 0/16, 15/16, 1/16, 1/16, [[t1, 0]]);//полоса 1
		model.addBox(1/16, 0/16, 15/16, 15/16, 1/16, 16/16, [[t1, 0]]);//полоса 2
		model.addBox(0/16, 0/16, 1/16, 1/16, 1/16, 15/16, [[t1, 0]]);//полоса 3
		model.addBox(15/16, 0/16, 1/16, 16/16, 1/16, 15/16, [[t1, 0]]);//полоса 4

		model.addBox(2/16, 2/16, 2/16, 14/16, 12/16, 14/16, [[t1, 0], [t1, 0], [t3, 0]]);//мозг

		render.addEntry(model);
		BlockRenderer.setStaticICRender(BlockID[block], 0, render);
		Block.setBlockShape(BlockID[block], {x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1});
	},
	lightningModel: function(tier){
		var render = new ICRender.Model();
		var model = BlockRenderer.createModel();
		var block = "lct" + tier;
		var t1 = block+"_bottom";
		var t2 = "st_p";
		var t3 = block+"_sides";
		/*
		 *t1 низ
		 *t2 верх
		 *t3 стороны
		 */

		if(tier == "1"){
			for(let i in lightning1){
				let a = lightning1[i];
				if(a.id === BlockID.i_l_r){
					model.addBox(a.x+0/16, a.y+0.1/16, a.z+0/16, a.x+16/16, a.y+15.9/16, a.z+16/16, 20, 0);
					model.addBox(a.x+3/16, a.y+0/16, a.z+3/16, a.x+13/16, a.y+16/16, a.z+13/16, 42, 0);
				}else
				if(a.id === BlockID.l_r){
					model.addBox(a.x+5/16, a.y+0/16, a.z+5/16, a.x+11/16, a.y+16/16, a.z+11/16, 42, 0);
				}else{
					model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
				}
			}
		}else
		if(tier == "2"){
			for(let i in lightning2){
				let a = lightning2[i];
				if(a.id === BlockID.i_l_r){
					model.addBox(a.x+0/16, a.y+0.1/16, a.z+0/16, a.x+16/16, a.y+15.9/16, a.z+16/16, 20, 0);
					model.addBox(a.x+3/16, a.y+0/16, a.z+3/16, a.x+13/16, a.y+16/16, a.z+13/16, 42, 0);
				}else
				if(a.id === BlockID.l_r){
					model.addBox(a.x+5/16, a.y+0/16, a.z+5/16, a.x+11/16, a.y+16/16, a.z+11/16, 42, 0);
				}else{
					model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
				}
			}
		}else
		if(tier == "3"){
			for(let i in lightning3){
				let a = lightning3[i];
				if(a.id === BlockID.i_l_r){
					model.addBox(a.x+0/16, a.y+0.1/16, a.z+0/16, a.x+16/16, a.y+15.9/16, a.z+16/16, 20, 0);
					model.addBox(a.x+3/16, a.y+0/16, a.z+3/16, a.x+13/16, a.y+16/16, a.z+13/16, 42, 0);
				}else
				if(a.id === BlockID.l_r){
					model.addBox(a.x+5/16, a.y+0/16, a.z+5/16, a.x+11/16, a.y+16/16, a.z+11/16, 42, 0);
				}else{
					model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
				}
			}
		}else
		if(tier == "4"){
			for(let i in lightning4){
				let a = lightning4[i];
				if(a.id === BlockID.i_l_r){
					model.addBox(a.x+0/16, a.y+0.1/16, a.z+0/16, a.x+16/16, a.y+15.9/16, a.z+16/16, 20, 0);
					model.addBox(a.x+3/16, a.y+0/16, a.z+3/16, a.x+13/16, a.y+16/16, a.z+13/16, 42, 0);
				}else
				if(a.id === BlockID.l_r){
					model.addBox(a.x+5/16, a.y+0/16, a.z+5/16, a.x+11/16, a.y+16/16, a.z+11/16, 42, 0);
				}else{
					model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
				}
			}
		}else
		if(tier == "5"){
			for(let i in lightning5){
				let a = lightning5[i];
				if(a.id === BlockID.i_l_r){
					model.addBox(a.x+0/16, a.y+0.1/16, a.z+0/16, a.x+16/16, a.y+15.9/16, a.z+16/16, 20, 0);
					model.addBox(a.x+3/16, a.y+0/16, a.z+3/16, a.x+13/16, a.y+16/16, a.z+13/16, 42, 0);
				}else
				if(a.id === BlockID.l_r){
					model.addBox(a.x+5/16, a.y+0/16, a.z+5/16, a.x+11/16, a.y+16/16, a.z+11/16, 42, 0);
				}else{
					model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
				}
			}
		}else
		if(tier == "6"){
			for(let i in lightning6){
				let a = lightning6[i];
				if(a.id === BlockID.i_l_r){
					model.addBox(a.x+0/16, a.y+0.1/16, a.z+0/16, a.x+16/16, a.y+15.9/16, a.z+16/16, 20, 0);
					model.addBox(a.x+3/16, a.y+0/16, a.z+3/16, a.x+13/16, a.y+16/16, a.z+13/16, 42, 0);
				}else
				if(a.id === BlockID.l_r){
					model.addBox(a.x+5/16, a.y+0/16, a.z+5/16, a.x+11/16, a.y+16/16, a.z+11/16, 42, 0);
				}else{
					model.addBox(a.x+2/16, a.y+2/16, a.z+2/16, a.x+14/16, a.y+14/16, a.z+14/16, a.id, 0);
				}
			}
		}

		model.addBox(0/16, 12/16, 0/16, 16/16, 16/16, 16/16, [[t2, 0], [t2, 0], [t2, 0]]);//верх

		model.addBox(0/16, 0/16, 0/16, 1/16, 12/16, 1/16, [[t1, 0]]);//стойка 1
		model.addBox(0/16, 0/16, 15/16, 1/16, 12/16, 16/16, [[t1, 0]]);//стойка 2
		model.addBox(15/16, 0/16, 0/16, 16/16, 12/16, 1/16, [[t1, 0]]);//стойка 3
		model.addBox(15/16, 0/16, 15/16, 16/16, 12/16, 16/16, [[t1, 0]]);//стойка 4

		model.addBox(1/16, 0/16, 0/16, 15/16, 1/16, 1/16, [[t1, 0]]);//полоса 1
		model.addBox(1/16, 0/16, 15/16, 15/16, 1/16, 16/16, [[t1, 0]]);//полоса 2
		model.addBox(0/16, 0/16, 1/16, 1/16, 1/16, 15/16, [[t1, 0]]);//полоса 3
		model.addBox(15/16, 0/16, 1/16, 16/16, 1/16, 15/16, [[t1, 0]]);//полоса 4

		model.addBox(2/16, 6/16, 2/16, 14/16, 12/16, 14/16, [[t1, 0], [t1, 0], [t3, 0]]);//верхняя часть

		model.addBox(5/16, 1/16, 4/16, 11/16, 6/16, 5/16, [[t1, 0], [t1, 0], [t3, 0]]);//боковины
		model.addBox(5/16, 1/16, 11/16, 11/16, 6/16, 12/16, [[t1, 0], [t1, 0], [t3, 0]]);//боковины
		model.addBox(11/16, 1/16, 5/16, 12/16, 6/16, 11/16, [[t1, 0], [t1, 0], [t3, 0]]);//боковины
		model.addBox(4/16, 1/16, 5/16, 5/16, 6/16, 1/16, [[t1, 0], [t1, 0], [t3, 0]]);//боковины

		model.addBox(5/16, 0/16, 5/16, 11/16, 1/16, 11/16, [[t1, 0], [t1, 0], [t1, 0]]);//низ
		model.addBox(5.5/16, 0.5/16, 5.5/16, 11.5/16, 1.5/16, 11.5/16, [[t1, 0], [t1, 0], [t1, 0]]);//низ

		render.addEntry(model);
		BlockRenderer.setStaticICRender(BlockID[block], 0, render);
		Block.setBlockShape(BlockID[block], {x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1});
	},
	getStructure: function(cx, cy, cz, structure){
		let t=0;
		for(let i in structure){
			var block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === structure[i].id;
			if(!block){return false; t=0;}
			if(structure.length == t){return true;}
			//Game.message(block);
			t++;
		}
	},
	getModdedStructure: function(cx, cy, cz, structure){
		let t=0;
		var isValid = false;
		bl: for(let i in structure){
			var list = modifierAugmentApi.getList();
			var block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === structure[i].id;
			if(structure[i].id === BlockID.null_modifier){
				for(let i in list){
					block = World.getBlock(cx + structure[i].x, cy + structure[i].y, cz + structure[i].z).id === list[i];
					if(!block && i == list.length){break bl; isValid = false; t=0;}
				}
			}

			if(!block){return isValid; t=0;}
			if(structure.length == t){isValid = true; return isValid;}
			//Game.message(block);
			t++;
		}
		return isValid;
	},
	setStructure: function(coords, structure){
		let c = coords;
		let p = 0;
		str: for(let i in structure){
			if(World.getBlock(c.x + structure[i].x, c.y + structure[i].y, c.z + structure[i].z).id !== structure[i].id){
			for(let u = 9; u<45; u++){
				let item = Player.getInventorySlot(u);
				if(item.id === structure[i].id){
					Player.setInventorySlot(u, structure[i].id, item.count-1, 0);
					World.setBlock(c.x + structure[i].x, c.y + structure[i].y, c.z + structure[i].z, structure[i].id, 0);
					//break str;
				}else if(u==45){p=1; Game.message("Not Enough (> "+structure[i].id+" <) for assemble structure"); break str;}
			}
			}
			if(i==structure.length){if(p == 0){Game.message("Structure Assembler finished work");}else if(p == 1){Game.message("Structure Assembler finished work with error");}}
		}
	},
	breakStructure: function(coords, structure){
		let c = coords;
		//modifierApi.getModifier(structure, c);
		for(let i in structure){
			for(let u = 9; u<45; u++){
				let item = Player.getInventorySlot(u);
				if(item.id === structure[i].id){
					if(item.count<64){
						Player.setInventorySlot(u, structure[i].id, item.count+1, 0); World.setBlock(structure[i].x+c.x, structure[i].y+c.y, structure[i].z+c.z, 0); break;}
					}else if(item.id == 0){Player.setInventorySlot(u, structure[i].id, item.count+1, 0); World.setBlock(structure[i].x+c.x, structure[i].y+c.y, structure[i].z+c.z, 0); break;
				}else if(u==45){World.drop(c.x, c.y+1, c.z, structure[i].id, 1, 0); World.setBlock(structure[i].x+c.x, structure[i].y+c.y, structure[i].z+c.z, 0);}
			}
		}
	},
	structureAssembler: function(structure, coords){
		let c = coords;
		let destroy = false;
		destroy = ValkyrieLib.getStructure(c.x, c.y, c.z, structure);
		//Game.message(destroy);
		if(destroy){
			Game.message("Structure Destroyed");
			ValkyrieLib.breakStructure(c, structure);
		}else{
			ValkyrieLib.setStructure(coords, structure);
		}
	},
}
let slots = 0;
