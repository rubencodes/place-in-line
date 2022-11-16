var s = document.createElement("script");
s.src = chrome.runtime.getURL("src/injected.js");
s.onload = function () {
	this.remove();
};
(document.head || document.documentElement).appendChild(s);
