
$(document).ready(function(){
	$('input[type=file]').bootstrapFileInput();
	$(".asset-image").click(function(){
		$($(this).parent()).css("opacity", "0.0");
		$("#asset-preview").show(0);
		
		$("#asset-preview-img").removeAttr("style");

		var screenH = $(window).height();
		var screenW = $(window).width();
		var asset_image = $(this);

		var imgH = asset_image.height();
		var imgW = asset_image.width();

		$("#asset-preview-img").css({
			"left":asset_image.offset().left,
			"top":asset_image.offset().top,
			"width":asset_image.width()
		});
		console.log(imgW, imgH);
		console.log(screenW, screenH);
		if(imgW/screenW > imgH/imgW){
			console.log("1");
			var NimgH = $(window).height()-20;
			var NimgW = NimgH * imgW / imgH;

			console.log((screenW), (NimgW), imgH, imgW);
			$("#asset-preview-img").animate({
				"height": NimgH + "px",
				"width": NimgW + "px",
				"top":"10px",
				"left":(screenW-NimgW)/2
			});
		}else{
			console.log("2");
			var NimgW = $(window).width()-20;
			var NimgH = NimgW * imgH / imgW;
			console.log((screenH), (NimgW), imgH, imgW);
			$("#asset-preview-img").animate({
				"width": NimgW + "px",
				"height": NimgH + "px",
				"left":"10px",
				"top":(screenH-NimgH)/2
			});
		}
		$("#asset-preview-title").html($($($(this).parent()).children(".asset-title")).text());
		$("#asset-preview-img").attr("src", $(asset_image.children()[0]).attr("src"));
		$("#asset-preview-count").html($(this).attr("count"));
		var stars = "";
		for (var i = 0; i < $(this).attr("stars"); i++)
			stars += "<span class='glyphicon glyphicon-star'></span>";
		for (var i = 0; i < 5 - $(this).attr("stars"); i++)
			stars += "<span class='glyphicon glyphicon-star-empty'></span>";
		$("#asset-preview-stars").html(stars);
		$("#asset-preview-text").html($($($(this).parent()).children(".asset-description")).text());
		$("#asset-preview").css("opacity", "1.0");
	 });
	$("#asset-preview").click(function(){
		closePreview();
		return false;
	 });
	$(document).keyup(function(e){
		if(e.keyCode === 27) closePreview();
		else console.log(e.keyCode);
	});
});
var closePreview = function(){
	$("#asset-preview-img").attr("style", "");
	$("#asset-preview").attr("style", "");
	$(".asset").attr("style", "");
}