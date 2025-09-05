import { PHPSERVER } from "./constants.js"
let currentFilters = [], 
let currentType = null;

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
		setTimeout(() => {
			resolve(syncDonations());
		}, 1 * 1000);
	}
	try {
		let response = await fetchDonations(currentType, currentFilters);
		if (response.status != 200) {
			postMessage({status: response.status});
		} else {
			let data = await response.json();
			postMessage({status: 200, data}); // send result back to main thread
		}
	} catch (e) {
		postMessage({ status: "500", error: e.message });
	}
	setTimeout(() => {
		syncDonations();
	}, 1 * 1000);
}

onmessage = (e) => {
	if (e.data.type == "filters") { 
		currentFilters = e.data.filters;
		currentType = e.data["filter-type"];
	}
}
syncDonations();
