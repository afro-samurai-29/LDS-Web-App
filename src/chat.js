
function sendMessage() {
  const input = document.getElementById("messageInput");
  const messageText = input.value.trim();
  if (messageText === "") return;

  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message", "sent");
  messageContainer.textContent = messageText;

  const chatMessages = document.getElementById("chatMessages");
  chatMessages.appendChild(messageContainer);

  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll

  input.value = "";

  // Simulate a reply
  setTimeout(() => {
    const reply = document.createElement("div");
    reply.classList.add("message", "received");
    reply.textContent = "Got it!";
    chatMessages.appendChild(reply);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 1000);
}
