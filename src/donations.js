import { PHPSERVER } from "./constants.js"

function fetchDonations() {
	return fetch(`${PHPSERVER}/donations.php`, {
		method: "POST",
		body: {
			test: "Just a test"
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
		img.setAttribute("src", "../../icons/no-image-icon100.png")
	}
	return img;
}

function createDonationDiv(donation) {
	console.debug(donation);
	const imgSource = donation[0], contactNo = donation[1], description = donation[2];
	const div = document.createElement("div");
	div.setAttribute("class", "donation");
	div.appendChild(createImgElement(imgSource));
	const contactNoSpan = document.createElement("span");
	contactNoSpan.textContent = "Contact Number: " + contactNo;
	div.appendChild(contactNoSpan);
	const descriptionSpan = document.createElement("span");
	descriptionSpan.textContent = "Description: " + description;
	div.appendChild(descriptionSpan);
	return div;
}

async function populateDonations() {
	const listInterface = document.body.querySelector("#donationsList");
	const donations = await fetchDonations();
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
