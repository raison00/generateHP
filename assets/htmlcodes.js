//code must be a valid regex string
module.exports = [
	{ charac: "&", code: "&amp;" },
	{ charac: "'", code: "(&apos;|&quot;|&#x2019;)" },
	{ charac: " ", code: "&#xA0;" },
	{ charac: "-", code: "&#x2014;" },
	{ charac: "&af_", code: "&#x2061;" }
];