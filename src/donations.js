import { PHPSERVER, FILTERINGOPTIONS } from "./constants.js"

function fetchDonations(filters = []) {
	return fetch(`${PHPSERVER}/donations.php`, {
		method: "POST",
		body: JSON.stringify({
			"filters": filters
		}),
		headers: {
			"Content-Type": "application/json; charset=UTF-8"
		}
	}).then(async (response) => {
		response = await response.text();
		return JSON.parse(response);
	});
}

function createImgElement(imgSource) {
	const img = document.createElement("img");
	img.setAttribute("class", "donation-img");
	if (imgSource == null) {
		img.setAttribute("src", "../../icons/no-image-icon100.png");
	} else {
		img.setAttribute("src", imgSource);
	}
	return img;
}

function createDonationDiv(donation) {
	const imgSources = JSON.parse(donation[0]), contactNo = donation[1], description = donation[2], type = donation[3], slocation = donation[4];
	const div = document.createElement("div");
	div.setAttribute("class", "donation");
	if (imgSources == null) {
			div.appendChild(createImgElement(imgSources));
	} else {
		for (const imgSource of imgSources) {
			div.appendChild(createImgElement(imgSource));
		}
	}

	const infoDiv = document.createElement("div");
	infoDiv.setAttribute("class", "info");
	const contactNoSpan = document.createElement("div");
	contactNoSpan.textContent = "Contact Number: " + contactNo;
	infoDiv.appendChild(contactNoSpan);
	const descriptionSpan = document.createElement("div");
	descriptionSpan.textContent = "Description: " + description;
	infoDiv.appendChild(descriptionSpan);
	const typeSpan = document.createElement("div");
	typeSpan.textContent = "Type: " + type;
	infoDiv.appendChild(typeSpan);
	const locationSpan = document.createElement("div");
	locationSpan.textContent = "Location: " + slocation;
	infoDiv.appendChild(locationSpan);
	div.appendChild(infoDiv);

	return div;
}

async function populateDonations() {
	const listInterface = document.body.querySelector("section#donation-list");
	listInterface.replaceChildren();
	const loader = document.createElement("div");
	loader.setAttribute("class", "loader");
	listInterface.appendChild(loader);
	const filters = [...document.body.querySelectorAll(`.white-strip.filtering .filtered-items .item`)].map((e) => {
		return e.value;
	});
	const donations = await fetchDonations(filters);
	listInterface.removeChild(loader);
	for (const key of Object.keys(donations)) {
		const donationDiv = createDonationDiv(donations[key]);
		listInterface.appendChild(donationDiv);
	}
}

function addFilteringOption(parentElement, optionValue) {
	var optionSelect = document.createElement("option");
	optionSelect.setAttribute("value", optionValue);
	optionSelect.textContent = FILTERINGOPTIONS[optionValue];
	parentElement.appendChild(optionSelect);
}

function addToFiltered(filteredList, option) {
	if (filteredList.querySelector(`[value="${option.value}"]`)) { return; }
	const optionBtn = document.createElement("button");
	optionBtn.setAttribute("class", "item");
	optionBtn.setAttribute("value", option.value);
	optionBtn.textContent = FILTERINGOPTIONS[option.value];
	optionBtn.addEventListener("click", (ev) => {
		option.selected = false;
		ev.target.remove();
	});
	filteredList.appendChild(optionBtn);
}

async function addFilteringOptions() {
	const filteringStrip = document.body.querySelector(".white-strip .filtering-items");
	const filteredList = document.body.querySelector(".white-strip .filtered-items");
	for (const optionValue of Object.keys(FILTERINGOPTIONS)) {
		addFilteringOption(filteringStrip, optionValue);
	}
	filteringStrip.addEventListener("change", (ev) => {
		const options = [...ev.target.querySelectorAll(`option`)];
		for (const option of options) {
			if (option.selected && option.value != "") {
				addToFiltered(filteredList, option);
			}
		}
	});
}

function addButtonListeners() {
	var refreshDonationsBtn = document.body.querySelector("#fetch-donations");
	if (!refreshDonationsBtn) {
		console.error(`Could not find "fetchDonations" button.`);
		return;
	}
	refreshDonationsBtn.addEventListener("click", () => {
		populateDonations();
	});
}

window.addEventListener("load", () => {
	addButtonListeners();
	populateDonations();
	addFilteringOptions();
});
