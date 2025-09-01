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
	img.setAttribute("class", "donationImg");
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
	const contactNoSpan = document.createElement("span");
	contactNoSpan.textContent = "Contact Number: " + contactNo;
	div.appendChild(contactNoSpan);
	const descriptionSpan = document.createElement("span");
	descriptionSpan.textContent = "Description: " + description;
	div.appendChild(descriptionSpan);
	const typeSpan = document.createElement("span");
	typeSpan.textContent = "Type: " + type;
	div.appendChild(typeSpan);
	const locationSpan = document.createElement("span");
	locationSpan.textContent = "Location: " + slocation;
	div.appendChild(locationSpan);
	return div;
}

async function populateDonations() {
	const listInterface = document.body.querySelector("#donationsList");
	listInterface.replaceChildren();
	const donations = await fetchDonations([]);
	for (const key of Object.keys(donations)) {
		const donationDiv = createDonationDiv(donations[key]);
		listInterface.appendChild(donationDiv);
	}
}

function addButtonListeners() {
	var refreshDonationsBtn = document.body.querySelector("#fetchDonations");
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
