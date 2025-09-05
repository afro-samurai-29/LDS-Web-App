import { PHPSERVER } from "./constants.js"

let donationId;

async function syncChat() {
	if (donationId == null) {
		setTimeout(syncChat, 1000); // repeat every 5s
		return;
	}
	try {
		let response = await fetchChat();
		if (response.status != 200) {
			postMessage({status: response.status});
		} else {
			let data = await response.json();
			postMessage({status: 200, data}); // send result back to main thread
		}
	} catch (e) {
		postMessage({ status: "500", error: e.message });
	}
	setTimeout(syncChat, 1000); // repeat every 5s
}

function fetchChat() {
	return fetch(`${PHPSERVER}/chats.php`, {
		method: "POST",
		body: JSON.stringify({
			"type": "fetch-chat",
			"donationId": donationId
		}),
		credentials: "include"
	});
}

onmessage = (e) => {
	if (e.data.donationId) {
		donationId = e.data.donationId;
	}
}

syncChat();
