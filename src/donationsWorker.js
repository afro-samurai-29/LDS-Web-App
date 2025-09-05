import { PHPSERVER } from "./constants.js"
import { fetchBtns, activeFilters } from "./donations.js"
let LOCK = Promise.resolve(true);

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
	if (donationId == null) {
		return LOCK.then(() => {delay()});
	}
	const filters = [...activeFilters.querySelectorAll("button")].map((e) => {
		return e.value;
	})
	const type = fetchBtns.filter((e) => {
		return e.style.colors == "#4ecdc4";
	})[0];
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
	return LOCK.then(() => {delay()});
}

syncDonations();
