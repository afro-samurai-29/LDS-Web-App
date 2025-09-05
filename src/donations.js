import { PHPSERVER, DONATIONLOCATIONS, FILTERINGOPTIONS } from "./constants.js";

let donationList = document.body.querySelector("section#donation-list");
let categoryFilter = document.body.querySelector("section.white-strip.filtering .filter-controls select#category-filter");
const activeFilters = document.body.querySelector("section.white-strip.filtering .active-filters");
const fetchBtns = [
	document.body.querySelector("#fetch-donations"),
	document.body.querySelector("#fetch-made-donations"),
	document.body.querySelector("#fetch-claimed-donations")
];
let LOCK = Promise.resolve(true);

let refreshWorker;
refreshWorker = new Worker("../donationsWorker.js", { type: "module" });
refreshWorker.onmessage = (e) => {
	console.debug(e.data);
	switch (e.data.status) {
		case 560:
			refreshWorker.terminate();
			return;
			break;
	}
	switch (e.data.type) {
		case "fetch-filters":
			refreshWorker.postMessage({
				"type": "filters",
				filters: [...activeFilters.querySelectorAll("button")].map(e => e.value),
				"fetch-type": fetchBtns.find(e => e.style.color === "#4ecdc4")?.id
			});
			break;
	}
};
refreshWorker.onerror = (e) => {
	console.error("Worker error: ", e.message, e);
}
refreshWorker.onmessageerror = (e) => {
	console.error("Worker error: ", e.message, e);
}


function fetchDonations(type) {
	const filters = [...activeFilters.querySelectorAll("button")].map((e) => {
		return e.value;
	})
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
	}).then(async (response) => {
		if (response.status != 200) {
			return null;
		}
		response = await response.text();
		return JSON.parse(response);
	});
}

function fetchImage(donationId) {
	return fetch(`${PHPSERVER}/donations.php`, {
		method: "POST",
		body: JSON.stringify({
			"type": "fetch-image",
			"donationId": donationId
		}),
		credentials: "include"
	}).then(async (response) => {
		if (response.status != 200) {
			return null;
		}
		response = await response.text();
		return response;
	});
}

function claimDonation(donationId) {
	return fetch(`${PHPSERVER}/donations.php`, {
		method: "POST",
		body: JSON.stringify({
			"type": "claim-donation",
			"donationId": donationId
		}),
		credentials: "include"
	}).then(async (response) => {
		if (response.status != 200) {
			return null;
		}
		alert("Claimed donation.")
		LOCK.then(() => { return populateDonations(); });
		return response;
	});
}

function removeDonations() {
	donationList.replaceChildren();
}

function addLoader() {
	removeLoader();
	categoryFilter.disabled = true;
	const loader = document.createElement("div");
	loader.setAttribute("class", "loader");
	loader.setAttribute("aria-label", "Loading donations");
	donationList.appendChild(loader);
}

function removeLoader() {
	const loader = donationList.querySelector("div.loader");
	if (loader) {
		loader.remove();
	}
}

async function createDonationDiv(donation, type = "fetch-donations") {
	const donationId = donation[0], contactNo = donation[1], description = donation[2], category = donation[3], slocation = donation[4];
	const imgResource = await fetchImage(donationId);
	const div = document.createElement("div");
	div.setAttribute("class", "donation");
	div.setAttribute("id", donationId);
	div.innerHTML = `
		<img src="${imgResource || 'no-image-icon50.png'}" alt="${category}" class="donation-img">
		<div class="info">
			<strong>${FILTERINGOPTIONS[category]}</strong>
			<strong>Donation Location:</strong>
			${DONATIONLOCATIONS[slocation]}
			<strong>Donation Category:</strong>
			${FILTERINGOPTIONS[category]}
			<strong>Contact Number:</strong>
			${contactNo}
			<p>${description}</p>
		</div>
	`
	if (type == "fetch-donations") {
		div.innerHTML += `
			<button id="claim-donation">Claim</button>
		`;
		div.querySelector("#claim-donation").addEventListener("click", (ev) => {
			claimDonation(ev.target.parentElement.id);
		});
	} else {
		div.innerHTML += `
			<button id="donation-chat" onclick="window.open(window.location.href.replace(/donations.html/g, 'chats.html?id=${donationId}'), '_top')">Chat</button>
		`;
	}
	return div;
}

async function populateDonations(type = "fetch-donations") {
	removeDonations();
	addLoader();
	return fetchDonations(type).then(async (donations) => {
		removeDonations();
		if (donations == null || Object.keys(donations).length == 0) {
			donationList.innerHTML = `<div class="no-results">No donations match your filters.</div>`;
			categoryFilter.disabled = false;
			return;
		}
		addLoader();
		for (const donation of Object.values(donations)) {
			const div = await createDonationDiv(donation, type);
			donationList.appendChild(div);
		}
		removeLoader();
		categoryFilter.disabled = false;
	});
}

function addFilteringOption(parentElement, optionValue) {
	var optionSelect = document.createElement("option");
	optionSelect.setAttribute("value", optionValue);
	optionSelect.textContent = FILTERINGOPTIONS[optionValue];
	parentElement.appendChild(optionSelect);
}

function addActiveFilter(option) {
	if (activeFilters.querySelector(`[value="${option.value}"]`)) { return; }
	const optionBtn = document.createElement("button");
	optionBtn.setAttribute("class", "item");
	optionBtn.setAttribute("title", "Click on the relevant button to remove a filtering option from those selected.");
	optionBtn.setAttribute("value", option.value);
	optionBtn.textContent = FILTERINGOPTIONS[option.value];
	optionBtn.addEventListener("click", (ev) => {
		option.selected = false;
		ev.target.remove();
		LOCK.then(() => { return populateDonations(); });
	});
	activeFilters.appendChild(optionBtn);
	LOCK.then(() => { return populateDonations(); });
}

function removeActiveFilters() {
	activeFilters.replaceChildren();
	LOCK.then(() => { return populateDonations(); });
}

async function addFilteringOptions() {
	for (const optionValue of Object.keys(FILTERINGOPTIONS)) {
		addFilteringOption(categoryFilter, optionValue);
	}
	categoryFilter.addEventListener("change", (ev) => {
		const options = [...ev.target.querySelectorAll(`option`)];
		for (const option of options) {
			if (option.selected) {
				addActiveFilter(option);
			}
		}
	});
}

function highlightButton(highlightBtn) {
	for (const btn of fetchBtns) {
		btn.style.color = "#333";
	}
	highlightBtn.style.color = "#4ecdc4";
}

function addButtonListeners() {
	const clearFiltersBtn = document.getElementById("clear-filters");
	fetchBtns[0].style.color = "#4ecdc4"
	for (const btn of fetchBtns) {
		if (!btn) {
			console.error(`Could not find a button.`);
			return;
		} else {
			btn.addEventListener("click", (ev) => {
				highlightButton(btn);
				LOCK.then(() => { return populateDonations(ev.target.id); });
			});
		}
	}
	if (!clearFiltersBtn) {
		console.error(`Could not find "clear-filters" button.`);
		return;
	} else {
		clearFiltersBtn.addEventListener("click", () => {
			removeActiveFilters();
		});
	}
}

window.addEventListener("load", () => {
	addButtonListeners();
	addFilteringOptions();
	LOCK.then(() => { return populateDonations(); });
});
