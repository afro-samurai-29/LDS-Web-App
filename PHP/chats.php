<?php

require_once "constants.php";

class ChatClass {
	private $mysqli;
	public $uuid;

	function __construct() {
		global $mysqli;
		global $uuid;
		$this->mysqli = $mysqli;
		$this->uuid = $uuid;
	}

	public function getMessages() {
		global $data;
		$stmt = $this->mysqli->prepare("SELECT chats.chats FROM chats WHERE chats.donationId = ?");
		$stmt->bind_param("i", $data["donationId"]);
		$stmt->execute();
		$result = $stmt->get_result();
		if ($result == false) {
			header("HTTP/1.1 523 Image Query failed", true);
			header("Status: 523 Image Query failed", true);
			die();
		}
		return $result->fetch_all()["0"]["0"];
	}

	public function sendMessage() {
		global $data;
		$chats = $this->getMessages();
		$chats = json_decode($chats, true);
		$sender = bin2hex($this->uuid);
		$chats[] = [
			"sender" => $sender,
			"message" => $data["message"]
		];
		$chats = json_encode($chats);
		$stmt = $this->mysqli->prepare("UPDATE chats SET chats.chats = ? WHERE donationId = ?");
		$stmt->bind_param("si", $chats, $data["donationId"]);
		$result = $stmt->execute();

		if ($result == false) {
			header("HTTP/1.1 522 Claim failed", true);
			header("Status: 522 Claim failed", true);
			die();
		}
		return $result;
	}
}

$data = json_decode(file_get_contents("php://input"), true);

$chatClass = new ChatClass();
if (!array_key_exists("type", $data)) {
	header("HTTP/1.1 521 Query failed", true);
	header("Status: 521 Query failed", true);
	die();
}
switch ($data["type"]) {
	case "send-message":
		if (!array_key_exists("donationId", $data) || !array_key_exists("message", $data)) {
			break;
		}
		$result = $chatClass->sendMessage();
		exit($result);
		break;
	case "fetch-chat":
		if (!array_key_exists("donationId", $data)) {
			break;
		}
		$result = $chatClass->getMessages();
		$uuidHex = bin2hex($chatClass->uuid);
		// Combine into one regex with named groups
		$combinedPattern = '/(?P<senderExact>"sender": "' . $uuidHex . '")|(?P<senderAny>"sender": "[0-9A-Fa-f]*")/';
		$result = preg_replace_callback(
			$combinedPattern,
			function ($matches) {
			// $matches[0] contains the matched substring
				if (!empty($matches['senderExact'])) {
					// matched exact UUID
					return '"sender": "You"';
				} elseif (!empty($matches['senderAny'])) {
					// matched any hex
					return '"sender": "Other"';
				}
				return $matches[0]; // fallback
			},
			$result
		);
		exit($result);
		break;
}

?>
