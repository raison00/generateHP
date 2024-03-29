module.exports = function(grunt) {
	"use strict";

	var folder, files, temp, htmlcodes, $;

	grunt.registerTask("prepare", function() {
		this.requires("update");

		$ = grunt.config.get("vars.$");
		files = grunt.config.get("vars.files");
		folder = grunt.config.get("vars.folder");
		htmlcodes = require("../assets/htmlcodes.js");

		grunt.task.run("jsp", "extract", "clean");
	});

	grunt.registerTask("jsp", function() {
		this.requires("prepare");

		var jsp = '<jsp:directive.include file="/web20/global/tagLibs.jsp" />',
			content = $("head").html(),
			hpAssets = "${baseUrlAssets}/dyn_img/homepage/" + folder.substring(0, 4) + "/" + folder.substring(4, 6) + "/" + folder.substring(6);

		content = content.replace(/<link.*/, "").replace(/.*jquery.*\n.*/, "");

		$("img").each(function() {
			temp = $(this).attr("src");
			$(this).attr("src", hpAssets + temp.substring(temp.indexOf("/")));
		});
		content = jsp.concat(content.trim(), $("body").html(), "<%-- Grunt Task Ran Successfully --%>");
		// if domestic, add homePageHorizontalProsPanel div
		if (folder.toLowerCase().indexOf("intl") == -1) {
			content += '<div id="homePageHorizontalProsPanel"></div>';
		}

		// if file exists, copy it to backup
		if (grunt.file.exists(folder + files.hp2)) {
			grunt.file.copy(folder+files.hp2, folder+"/"+Date.now().toString()+".bak")
		}
		grunt.file.write(folder + files.hp2, content);
		grunt.config.set("prettify_files", {
			src: folder + files.hp2,
			dest: folder + files.hp2
		});
		grunt.loadNpmTasks('grunt-prettify');
		grunt.task.run('prettify');
	});

	grunt.registerTask("extract", function() {
		this.requires("jsp");

		var imgAlt = "", areaAlt = "";

		$("img").each(function() {
			imgAlt += $(this).attr("alt") + "\n";
		});
		$("area").each(function() {
			areaAlt += $(this).attr("alt") + "\n";
		});
		grunt.file.write(folder + files.alt, imgAlt + areaAlt);
	});

	grunt.registerTask("clean", function() {
		this.requires("extract");

		var file = grunt.file.read(folder + files.hp2),
			newlines = [], lines, line, i;

		file = htmlcodes.reduce(function(memo, curr) {
			return memo.replace(new RegExp(curr.code, "g"), curr.charac);
		}, file);

		lines = file.split("\n");
		i = lines.length;

		while(i--) {
			temp = lines[i];
			line = /^(<img|<area).*(?!\/>)$/.test(temp.trim()) ? temp.replace(/>$/, "/>") : temp;
			newlines[i] = line;
		}
		grunt.file.write(folder + files.hp2, newlines.join("\n"));
	});
};