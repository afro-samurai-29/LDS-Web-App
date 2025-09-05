import { PHPSERVER } from "./constants.js"

let sendBtn, micBtn;
let mediaRecorder;
const messages = [];
const chatMessages = document.getElementById("chatMessages");
const donationId = URL.parse(location.href).searchParams.get("id");
let refreshWorker;
let lastTimeStamp = 0;
if (donationId) {
	refreshWorker = new Worker("../worker.js", { type: "module" });
	refreshWorker.postMessage({ donationId });
	refreshWorker.onmessage = (e) => {
		if (e.data.status != 200) {
			switch (e.data.status) {
				case 560:
					refreshWorker.terminate();
					alert("Your donation claim period expired.");
					window.open(window.location.href.replace(/chats\.html.*/g, "donations.html"), "_top");
					break;
			}
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

function refreshMessages(chatsObject) {
	let chats = chatsObject["data"];
	console.debug(chats);
	for (let i = 0, j = 0; i < chats.length; i++) {	
		if (chats[i]["timestamp"] <= lastTimeStamp) {
			continue;
		}
		lastTimeStamp = chats[i]["timestamp"]
		let classDef = "received";
		if (chats[i]["sender"] == "You") {
			classDef = "sent";
		}
		let message = "";
		if (/^data:audio/g.test(chats[i]["message"])) {
			message = `
				<div class="${classDef} chat-message voice-note">
					<audio controls src="${chats[i]["message"]}"></audio>
				</div>
			`;
		} else {
			message = `
				<div class="${classDef} chat-message">${chats[i]["message"]}</div>
			`;
		}
		chatMessages.innerHTML += message;
		chatMessages.scrollTop = chatMessages.scrollHeight;
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
	chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll
	await sendMessageToServer(messageText);
	input.value = "";
	sendBtn.disabled = false;
}

// Blob -> data URI (includes mime type; can go straight to <audio src>)
function blobToDataURI(blob) {
	const reader = new FileReader();
	return new Promise((resolve, reject) => {
		reader.onerror = reject;
		reader.onload = () => resolve(reader.result); // "data:audio/...,base64,...."
		reader.readAsDataURL(blob);
	});
}

async function sendVoiceNote() {
	// Voice note feature

	if (!mediaRecorder || mediaRecorder.state === "inactive") {
		// Start recording
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		let audioChunks = [];

		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				audioChunks.push(event.data);
			}
		};

		mediaRecorder.onstop = async () => {
			const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
			const dataURI = await blobToDataURI(audioBlob);
			chatMessages.scrollTop = chatMessages.scrollHeight;
			await sendMessageToServer(dataURI);
		};

		mediaRecorder.start();
		micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
	} else {
		// Stop recording
		mediaRecorder.stop();
		micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
	}
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
	micBtn = document.getElementById("micBtn");
	if (micBtn) {
		micBtn.onclick = () => {
			sendVoiceNote();
		}
	}
});


