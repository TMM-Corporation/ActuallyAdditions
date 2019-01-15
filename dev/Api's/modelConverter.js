var code = ;


console.log("var render = new ICRender.Model();\nvar model = BlockRenderer.createModel();");
search: for(var i in code.elements){
	for(var u in code.textures){
		if(u === code.elements[i].faces.east.texture){
			var texture = code.textures[u];
			console.log("model.addBox(" + code.elements[i].from+ ", " + code.elements[i].to + ", [[\"" + texture.replace("actuallyadditions:blocks/", "") + "\", 0]]);");
			break;
		}
	}
}
console.log("render.addEntry(model);\nBlockRenderer.setStaticICRender(BlockID.block_, 0, render);");
