import { PHPSERVER } from "./constants.js"

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

function sendDonation(images, contactNo, description, type, slocation) {
	return fetch(`${PHPSERVER}/donate.php`, {
		method: "POST",
		body: JSON.stringify({
			"images": images,
			"contactNo": contactNo,
			"description": description,
			"type": type,
			"location": slocation
		}),
		headers: {
			"Content-Type": "application/json; charset=UTF-8"
		}
	}).then(async (response) => {
		response = await response.text();
		sending = false;
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

async function getImages() {
	var input = document.body.querySelector("div#info input#donation-img");
	var imgFiles = input.files;
	const imgs = [];
	for (const file of imgFiles) {
		if (!validFileType(file)) {
			console.error(`Please only submit images of type "jpeg", "jpg", "png", or "webp".`);
			input.value = "";
			return null;
		}
		const dataURL = await getFileDataURL(file);
		if (dataURL == null) {
			input.value = "";
			return null;
		}
		imgs.push(dataURL);
	}
	return imgs;
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
	const imgs = await getImages();
	if (imgs == null) {
		return;
	}
	const details = getDetails();
	if (details.includes(null)) {
		console.error("Please fill in the whole form.");
		sending = false;
		return;
	}
	sendDonation(imgs, details[0], details[1], details[2], details[3]);
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
});
