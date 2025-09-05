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
		$hexUuid = bin2hex($this->uuid);
		$stmt = $this->mysqli->prepare("SELECT chats.chats FROM chats JOIN donations as d ON chats.donationId = d.donationId WHERE chats.donationId = ? AND d.claimStatus = 1 AND ( d.donorUuid = UNHEX(?) OR d.recipientUuid = UNHEX(?) )");
		$stmt->bind_param("iss", $data["donationId"], $hexUuid, $hexUuid);
		$stmt->execute();
		$result = $stmt->get_result();
		if ($result == false) {
			header("HTTP/1.1 523 Image Query failed", true);
			header("Status: 523 Image Query failed", true);
			die();
		}
		if ($result->num_rows == 0) {
			header("HTTP/1.1 560 No donation room", true);
			header("Status: 560 No donation room", true);
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
		$stmt = $this->mysqli->prepare("UPDATE chats as c JOIN donations as d ON c.donationId = d.donationId SET c.chats = ? WHERE c.donationId = ? AND d.claimStatus = 1 AND ( d.donorUuid = UNHEX(?) OR d.recipientUuid = UNHEX(?) )");
		$stmt->bind_param("siss", $chats, $data["donationId"], $sender, $sender);
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
