import { PHPSERVER } from "./constants.js"

function fetchDonations(filters = ["food"]) {
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
	const donations = await fetchDonations([]);
	for (const key of Object.keys(donations)) {
		const donationDiv = createDonationDiv(donations[key]);
		listInterface.appendChild(donationDiv);
	}
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
});
