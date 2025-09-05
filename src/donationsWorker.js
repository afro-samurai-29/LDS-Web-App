import { PHPSERVER } from "./constants.js"
let LOCK = Promise.resolve(true);
let currentFilters = [], 
let currentType = null;

function delay(time = 1) {
	return new Promise((resolve) => {
		setTimeout(() => {
			syncDonations();
			resolve(true);
		}, time * 1000);
	});
}

function fetchDonations(type, filters) {
	return fetch(`${PHPSERVER}/donations.php`, {
		method: "POST",
		body: JSON.stringify({
			"type": type,
			"filters": filters
		}),
		headers: {
			"Content-Type": "application/json; charset=UTF-8"
		},
		credentials: "include"
	});
}

async function syncDonations() {
	postMessage({"type": "fetch-filters"});
	if (currentType == null) { 
		LOCK = LOCK.then(() => { return delay(); });
		return LOCK;
	}
	let filters = currentFilters, type = currentType;
	try {
		let response = await fetchDonations(type, filters);
		if (response.status != 200) {
			postMessage({status: response.status});
		} else {
			let data = await response.json();
			postMessage({status: 200, data}); // send result back to main thread
		}
	} catch (e) {
		postMessage({ status: "500", error: e.message });
	}
	LOCK = LOCK.then(() => { return delay(); });
	return LOCK;
}

postMessage({"hi": test});
onmessage = (e) => {
	if (e.data.type == "filters") { 
		currentFilters = e.data.filters;
		currentType = e.data["filter-type"] || null;
	}
}
syncDonations();
