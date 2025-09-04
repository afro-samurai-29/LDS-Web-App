import { PHPSERVER } from "./constants.js"

let sendBtn;
const messages = [];
const chatMessages = document.getElementById("chatMessages");
const donationId = URL.parse(location.href).searchParams.get("id");
let refreshWorker;
if (donationId) {
	refreshWorker = new Worker("../worker.js", { type: "module" });
	refreshWorker.postMessage({ donationId });
	refreshWorker.onmessage = (e) => {
		if (e.error) {
			return;
		}
		refreshMessages(e.data);
	};
}

function getDisplayedMessages() {
	let displayedMessages = chatMessages.querySelectorAll("div") || [];
	displayedMessages = [...displayedMessages].map((e) => {
		if (e.getAttribute("class") == "message sent") {
			return {sender: "You", message: e.textContent.trim()}
		} else {
			return {sender: "Other", message: e.textContent.trim()}
		}
	});
	return displayedMessages;
}

function updateDisplayedMessages(chats) {
	chatMessages.innerHTML = "";
	for (const chat of chats) {
		let classDef = "received";
		if (chat["sender"] == "You") {
			classDef = "sent";
		}
		const message = `
			<div class="message ${classDef}">${chat["message"]}</div>
		`;
		chatMessages.innerHTML += message;
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
}

function refreshMessages(chats) {
	let displayedMessages = getDisplayedMessages();
	console.debug(chats);
	for (let i = 0, j = 0; i < chats.length && j <= displayedMessages.length; i++) {
		if (displayedMessages.length == 0) {
			let classDef = "received";
			if (chats[i]["sender"] == "You") {
				classDef = "sent";
			}
			const message = `
				<div class="message ${classDef}">${chats[i]["message"]}</div>
			`;
			chatMessages.innerHTML += message;
			chatMessages.scrollTop = chatMessages.scrollHeight;
		} else if (JSON.stringify(chats[i]) != JSON.stringify(displayedMessages[j])) {
			updateDisplayedMessages(chats);
			break;
		}
	}
}

function sendMessageToServer(messageText) {
	return fetch(`${PHPSERVER}/chats.php`, {
		method: "POST",
		body: JSON.stringify({
			"type": "send-message",
			"message": messageText,
			"donationId": donationId
		}),
		credentials: "include"
	}).then((data) => {
		return;
	});
}

async function sendMessage() {
	sendBtn.disabled = true;
	const input = document.getElementById("messageInput");
	const messageText = input.value.trim();
	if (messageText === "") return;

	const messageContainer = document.createElement("div");
	messageContainer.setAttribute("class", "message sent");
	messageContainer.textContent = messageText;

	const chatMessages = document.getElementById("chatMessages");
	chatMessages.appendChild(messageContainer);

	chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll

	input.value = "";
	await sendMessageToServer(messageText);
	sendBtn.disabled = false;
}

window.addEventListener("load", () => {
	sendBtn = document.body.querySelector("#sendBtn");
	if (sendBtn) {
		sendBtn.onclick = () => {
			sendMessage();
		}
	}
	document.addEventListener("keydown", (e) => {
		if (e.keyCode == 13 && sendBtn.disabled == false) {
			sendBtn.click();
		}
	});
});
