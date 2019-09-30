module.exports = function(grunt) {
	"use strict";

	grunt.registerTask("update", function() {
		this.requires("check");

		var folder = grunt.config.get("vars.folder"),
			files = grunt.config.get("vars.files"),
			cheerio = grunt.config.get("vars.cheerio"),
			SL = require("../assets/standard_linking.js"),
			htmlcodes = require("../assets/htmlcodes.js"),
			baseUrl = "${baseUrl}", baseUrlSec = "${baseUrlSecure}",
			hpDate = folder.substring(0, 4) + "." + folder.substring(4, 6) + "." + folder.substring(6, 8),
			line, lines, newlines, i, j, map, row, $, $this0, cm_re, temp, $this1, href, alt, sym, cm, newHref;

		if(grunt.config.get("relink")) {
			newlines = lines = grunt.file.read(folder + files.hp2).split("\n");
			i = lines.length;

			while(i--) {
				if(/^\s*<area.*linkmissing/.test(lines[i])) {
					if(/href_missing/.test(lines[i])) continue;

					j = i;
					while(j--) {
						if(/^\s*<map/.test(lines[j])) {
							$ = cheerio.load(lines[j]);
							map = $("map").attr("name");
							row = $("map").data("row-num");
							break;
						}
					}

					$ = cheerio.load(lines[i]);
					$this1 = $("area");
					cm_re = "cm_re=" + hpDate + "-_-HOMEPAGE_INCLUDE_1_" + (row || "sideAd") + "-_-CATEGORY%20--%205125%20--%20";
					href = $this1.attr("href").trim();
					alt = $this1.attr("alt");

					delegate();

					$this1.attr("href", newHref).removeClass("linkmissing");
					if($this1.attr("class") === "") $this1.removeAttr("class");

					line = htmlcodes.reduce(function(memo, curr) {
						return memo.replace(new RegExp(curr.code, "g"), curr.charac);
					}, $.html());
					line = /(?!\/>)$/.test(line) ? line.replace(/>\s*$/, "/>") : line;

					newlines[i] = line;
				}
			}
			grunt.file.write(folder + files.hp2, newlines.join("\n"));
		} else {
			$ = cheerio.load(grunt.file.read(folder + files.hp1));
			$("map").each(function() {
				$this0 = $(this);
				map = $this0.attr("name");
				cm_re = "cm_re=" + hpDate + "-_-HOMEPAGE_INCLUDE_1_" + ($this0.data("row-num") || "sideAd") + "-_-CATEGORY%20--%205125%20--%20";

				$this0.children().each(function() {
					$this1 = $(this);
					href = $this1.attr("href");
					alt = $this1.attr("alt");

					if(typeof href === "undefined" || href === "#" || href === "") {
						grunt.log.writeln("Warning: 'href' empty. Added 'href_missing'. Map : " ["yellow"] + map + " Area : " ["yellow"] + $this1.attr("coords"));
						$this1.attr("href", "href_missing");
						$this1.addClass("linkmissing");
						return true;
					}

					if(href === "javascript:void();") return true;
					href = href.trim();

					delegate();

					$this1.attr("href", newHref);
				});
			});
			grunt.config.set("vars.$", $);
		}

		function delegate() {
			if(typeof alt === "undefined" || alt === "") {
				grunt.log.writeln("Warning: 'alt' empty. Added 'alt_missing'. Map : " ["yellow"] + map + " Area : " ["yellow"] + $this1.attr("coords"));
				$this1.attr("alt", "alt_missing");
				return true;
			}

			alt = alt.replace(/[^\w\s]/g, "");
			cm = cm_re + ":" + alt;
			sym = ~href.indexOf("?") ? "&" : "?";

			if(/^\d+$/.test(href)) { // all digits
				var hrefStr = href.toString(),
					hrefLen = hrefStr.length,
					hrefInt = parseInt(href);

				if(hrefLen === 6 && hrefInt > 500000) newHref = "javascript:pop('" + baseUrl + "/popup.ognc?popupID=" + hrefStr + "&" + cm + "','myDynaPop','scrollbars=yes,width=365,height=600')";

				else newHref = SL[(hrefLen <= 6 ? "catUrl" : "prodUrl")] + href + "&" + cm_re + hrefStr + ":" + alt;
			}

			else if(/^\//.test(href)) newHref = hasHash(1) || baseUrl + href + sym + cm; // begins with /

			else if(href === "standard") {
				if(!(temp = SL[alt.toLowerCase()])) {
					grunt.log.writeln("Warning: No standard link found for 'alt' : " ["yellow"] + alt ["red"] + " Map : " ["yellow"] + map + " Area : " ["yellow"] + $this1.attr("coords"));
					return true;
				}
				newHref = /^\d+$/.test(temp) ? SL.catUrl + temp + "&" + cm_re + temp + ":" + alt : temp + cm;
			}

			else if(/www(1)?.macys.com/.test(href)) {
				if(~href.indexOf("https")) newHref = hasHash(2, true) || baseUrlSec + href.substring(href.indexOf(".com") + 4) + sym + cm;
				else newHref = hasHash(2) || baseUrl + href.substring(href.indexOf(".com") + 4) + sym + cm;
			}

			else {
				//add target=_blank if href == appdownload OR href != macys.com
				(~href.indexOf("appdownload.macys.com") || !~href.indexOf("macys.com")) && $this1.attr("target", "_blank");

				//add http protocol if needed
				!/^http(s)?:\/\//.test(href) && (href = "http://" + href);

				//add core metrics only if macys.com link
				newHref = ~href.indexOf("macys.com") ? hasHash(3) || href + sym + cm : href;
			}
		}

		function hasHash(id, isSec) {
			var hashIndex, queIndex, index;

			if(~(hashIndex = href.indexOf("#"))) {
				if(~(queIndex = href.indexOf("?"))) {
					index = queIndex + 1;
					temp = cm + "&";
				} else {
					index = hashIndex;
					temp = "?" + cm;
				}
				temp += href.substring(index);
				switch(id) {
					case 1 : return baseUrl + href.substring(0, index) + temp;
					case 2 : return (typeof isSec !== "undefined" ? baseUrlSec : baseUrl) + href.substring(href.indexOf(".com") + 4, index) + temp;
					case 3 : return href.substring(0, index) + temp;
				}
			} else {
				return false;
			}
		}
	});
};