import { PHPSERVER, DONATIONLOCATIONS, FILTERINGOPTIONS } from "./constants.js";

const fileTypes = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp"
];
var sending = false;

function validFileType(file) {
	return fileTypes.includes(file.type);
}

function sendDonation(image, contactNo, description, type, slocation) {
	return fetch(`${PHPSERVER}/donate.php`, {
		method: "POST",
		body: JSON.stringify({
			"image": image,
			"contactNo": contactNo,
			"description": description,
			"type": type,
			"location": slocation
		}),
		headers: {
			"Content-Type": "application/json; charset=UTF-8"
		},
		credentials: "include"
	}).then(async (response) => {
		if (response.status != 200) {
			alert("Failed to send donation.")
			console.error(`Failed to add donation.`);
			return null;
		}
		response = await response.text();
		alert("Successfully sent donation.")
		return response;
	});
}

function getFileDataURL(file) {
	return new Promise((resolve) => {
		let dataURL = "";
		const reader = new FileReader();
		reader.onerror = () => {
			console.error(`Something went wrong while trying to read the file.`);
			resolve(null);
		}
		reader.onload = (ev) => {
			dataURL += ev.target.result;
		}
		reader.onloadend = (ev) => {
			if (ev.loaded == ev.total) {
				resolve(dataURL);
			}
		}
		reader.readAsDataURL(file);
	});
}

async function getImage() {
	var input = document.body.querySelector("div#info input#donation-img");
	var imgFile = input.files[0];
	if (!imgFile || !validFileType(imgFile)) {
		console.error(`Please only submit images of type "jpeg", "jpg", "png", or "webp".`);
		input.value = "";
		return null;
	}
	const dataURL = await getFileDataURL(imgFile);
	if (dataURL == null) {
		input.value = "";
		return null;
	}
	return dataURL;
}

function getDetails() {
	var contactNo = document.body.querySelector("div#info input#contact-no");
	if (contactNo && contactNo.checkValidity()) {
		contactNo = contactNo.value
	} else {
		contactNo = null
	}
	var description = document.body.querySelector("div#info textarea#description");
	if (description && description.checkValidity()) {
		description = description.value
	} else {
		description = null
	}
	var donationType = [...document.body.querySelectorAll("div#info fieldset div.donation-type input")].filter((e) => {
		return e.checked;
	});
	if (donationType.length >= 1) {
		donationType = donationType[0].value;
	} else {
		donationType = null
	}
	var donationLocation = [...document.body.querySelectorAll("div#info fieldset div.donation-location input")].filter((e) => {
		return e.checked;
	});
	if (donationLocation.length >= 1) {
		donationLocation = donationLocation[0].value;
	} else {
		donationLocation = null
	}
	return [contactNo, description, donationType, donationLocation];
}

async function donate() {
	const img = await getImage();
	if (img == null || img.length == 0) {
		alert("Failed (Something is wrong with the image you submitted).")
		return;
	}
	const details = getDetails();
	if (details.includes(null)) {
		console.error("Please fill in the whole form.");
		alert("Failed to send donation.")
		sending = false;
		return;
	}
	sendDonation(img, details[0], details[1], details[2], details[3]);
}

function addOptions() {
	const categoryList = document.body.querySelector("#info .category fieldset");
	for (const key of Object.keys(FILTERINGOPTIONS)) {
		categoryList.innerHTML += `
			<div class="donation-type">
				<input type="radio" class="donation-type item" name="type" value="${key}" checked/>
				<label for="${key}">${FILTERINGOPTIONS[key]}</label>
			</div>
		`;
	}
	const locationsList = document.body.querySelector("#info .location fieldset");
	for (const key of Object.keys(DONATIONLOCATIONS)) {
		locationsList.innerHTML += `
			<div class="donation-location">
				<input type="radio" class="donation-location item" name="location" value="${key}" checked/>
				<label for="${key}">${DONATIONLOCATIONS[key]}</label>
			</div>
		`;
	}
}

function addButtonListeners() {
	var donateBtn = document.body.querySelector("div.buttons button#donate");
	if (!donateBtn) {
		console.error(`Could not find "donate" button.`);
		return;
	}
	donateBtn.addEventListener("click", () => {
		sending = true;
		donate();
	});
}

window.addEventListener("load", () => {
	addButtonListeners();
	addOptions();
});
