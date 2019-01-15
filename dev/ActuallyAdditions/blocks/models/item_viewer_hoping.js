var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(0, 10, 0, 16, 11, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(0, 11, 0, 2, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(14, 11, 0, 16, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 0, 14, 16, 2, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 14, 14, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(4, 4, 4, 12, 10, 12, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(6, 0, 6, 10, 4, 10, [["block_item_viewer_hopping_outside", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_item_viewer, 0, render);

//side

var render = new ICRender.Model();
var model = BlockRenderer.createModel();
	model.addBox(0, 10, 0, 16, 11, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(0, 11, 0, 2, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(14, 11, 0, 16, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 0, 14, 16, 2, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(2, 11, 14, 14, 16, 16, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(4, 4, 4, 12, 10, 12, [["block_item_viewer_hopping_outside", 0]]);
	model.addBox(6, 4, 0, 10, 8, 4, [["block_item_viewer_hopping_outside", 0]]);
render.addEntry(model);
BlockRenderer.setStaticICRender(BlockID.block_item_viewer, 0, render);
