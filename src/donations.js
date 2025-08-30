import { PHPSERVER } from "./constants.js"

function fetchDonations() {
	return fetch(`${PHPSERVER}/donations.php`, {
		method: "POST",
		body: {
			test: "Just a test"
		}
	}).then(async (response) => {
		console.debug(await response.text());
	});
}

function populateDonations() {

}

fetchDonations();
