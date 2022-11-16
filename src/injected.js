function updatePlaceInLine(responseBody) {
	const placeInLineID = "placeInLine";
	let placeInLineEl = document.getElementById(placeInLineID);
	if (!placeInLineEl) {
		placeInLineEl = document.createElement("div");
		placeInLineEl.id = placeInLineID;
		placeInLineEl.style.position = "fixed";
		placeInLineEl.style.top = "0";
		placeInLineEl.style.right = "0";
		placeInLineEl.style.padding = "10px 14px";
		placeInLineEl.style.margin = "10px 14px";
		placeInLineEl.style.backdropFilter = "blur(10px)";
		placeInLineEl.style.borderRadius = "3px";
		placeInLineEl.style.border = "1px solid white";
		placeInLineEl.style.color = "white";
		placeInLineEl.style.fontFamily = "Helvetica, Arial, sans-serif";
		placeInLineEl.style.fontSize = "20px";
		placeInLineEl.style.zIndex = 100000000;
		document.body.appendChild(placeInLineEl);
	}

	const placeInLine = (() => {
		try {
			const formatter = Intl.NumberFormat("en-US");
			const usersInLineAheadOfYou = responseBody?.ticket?.usersInLineAheadOfYou;
			const parsedUsersInLineAheadOfYou = parseInt(
				usersInLineAheadOfYou ?? "0",
				10
			);
			return `${formatter.format(parsedUsersInLineAheadOfYou + 1)}`;
		} catch {
			return "Unknown";
		}
	})();
	placeInLineEl.innerText = `Place in line: ${placeInLine}`;
}

function swizzleXHR(xhr, onRequestCompleted) {
	const XHR = xhr.prototype;
	const open = XHR.open;
	const send = XHR.send;
	const setRequestHeader = XHR.setRequestHeader;

	let method;
	let url;
	let headers;

	XHR.open = function (_method, _url) {
		method = _method;
		url = _url;
		headers = {};

		return open.apply(this, arguments);
	};

	XHR.setRequestHeader = function (_header, _value) {
		headers[_header] = _value;
		return setRequestHeader.apply(this, arguments);
	};

	XHR.send = function () {
		this.addEventListener("load", function () {
			onRequestCompleted({
				method,
				url,
				requestHeaders: headers,
				type: this.responseType,
				body: this.responseText,
			});
		});

		return send.apply(this, arguments);
	};
}

swizzleXHR(XMLHttpRequest, ({ url, type, body }) => {
	// Intercept status requests *only*.
	const isStatusUrl =
		url.toLowerCase().startsWith("/spa-api/queue/ticketmaster/") &&
		url.toLowerCase().includes("/status?");
	if (!isStatusUrl) {
		return;
	}

	try {
		updatePlaceInLine(JSON.parse(body));
	} catch (err) {
		console.log("Error in request interception.");
		console.log(err);
	}
});
