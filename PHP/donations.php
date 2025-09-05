<?php

require_once "constants.php";

class DonationsClass {
	private $donations = "";
	private $mysqli;
	private $uuid;

	function __construct() {
		global $mysqli;
		global $uuid;
		$this->mysqli = $mysqli;
		$this->uuid = $uuid;
	}

	private function findInSetString($count) {
		$data = "";
		for ($i = 0; $i < $count; $i++) {
			if ($i == 0) {
				$data = "WHERE donationType in (?";
			} else {
				$data = $data . ", ?";
			}
		}
		if ($data != "") {
			$data = $data . ")";
		}
		return $data;
	}

	public function getDonations($filters) {
		global $data;
		$count = count($filters);
		$hexUuid = bin2hex($this->uuid);
		
		switch ($data["type"]) {
			case "fetch-donations":
				if ($count == 0) {
					$stmt = $this->mysqli->prepare("SELECT * FROM donations WHERE claimStatus = 0 AND ( donorUuid != UNHEX(?) OR recipientUuid != UNHEX(?) )");
					$stmt->bind_param("ss", $hexUuid, $hexUuid);
				} else {
					$data = $this->findInSetString($count);
					$stmt = $this->mysqli->prepare("SELECT * FROM donations {$data} AND claimStatus = 0 AND ( donorUuid != UNHEX(?)  OR recipientUuid != UNHEX(?) )");
					$filters[] = $hexUuid;
					$filters[] = $hexUuid;
					MySQLClass::dynamicBindParams($stmt, $filters);
				}
				break;
			case "fetch-made-donations":
				$stmt = $this->mysqli->prepare("SELECT * FROM donations WHERE donorUuid = UNHEX(?)");
				$stmt->bind_param("s", $hexUuid);
				break;
			case "fetch-claimed-donations":
				$stmt = $this->mysqli->prepare("SELECT * FROM donations WHERE claimStatus = 1 AND recipientUuid = UNHEX(?) ");
				$stmt->bind_param("s", $hexUuid);
				break;
		}
		$stmt->execute();
		$result = $stmt->get_result();

		if ($result == false) {
			header("HTTP/1.1 524 Search query failed", true);
			header("Status: 524 Search query failed", true);
			die();
		}
		$this->donations = $result->fetch_all();
		return $this->donations;
	}

	public function getImage($donationId) {
		$stmt = $this->mysqli->prepare("SELECT donationImage FROM donations WHERE donationId = ?");
		$stmt->bind_param("i", $donationId);
		$stmt->execute();
		$result = $stmt->get_result();

		if ($result == false) {
			header("HTTP/1.1 523 Image Query failed", true);
			header("Status: 523 Image Query failed", true);
			die();
		}
		return $result->fetch_all()["0"]["0"];
	}

	public function getClaimStatus($donationId) {
		$stmt = $this->mysqli->prepare("SELECT claimStatus FROM donations WHERE donationId = ?");
		$stmt->bind_param("i", $donationId);
		$stmt->execute();
		$result = $stmt->get_result();

		if ($result == false) {
			header("HTTP/1.1 523 Status Query failed", true);
			header("Status: 523 Status Query failed", true);
			die();
		}
		return $result->fetch_all()["0"];
	}

	public function claimDonation($donationId) {
		$stmt = $this->mysqli->prepare("UPDATE donations SET claimStatus = 1, recipientUuid = ? WHERE donationId = ?");
		$stmt->bind_param("si", $this->uuid, $donationId);
		$result = $stmt->execute();

		if ($result == false) {
			header("HTTP/1.1 522 Claim failed", true);
			header("Status: 522 Claim failed", true);
			die();
		}
		return $result;
	}

	public function deleteDonation($donationId) {
		$hexUuid = bin2hex($this->uuid);
		$stmt = $this->mysqli->prepare("DELETE FROM donations WHERE donorUuid = UNHEX(?) AND donationId = ?");
		$stmt->bind_param("si", $hexUuid, $donationId);
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

$donationsClass = new DonationsClass();
if (!array_key_exists("type", $data)) {
	header("HTTP/1.1 521 Query failed", true);
	header("Status: 521 Query failed", true);
	die();
}
$fetchTypes = [
	"0" => "fetch-donations",
	"1" => "fetch-made-donations",
	"2" => "fetch-claimed-donations"
];
if (in_array($data["type"], $fetchTypes)) {
	if (!array_key_exists("filters", $data)) {
		$donations = $donationsClass->getDonations([]);
	} else {
		$donations = $donationsClass->getDonations($data["filters"]);
	}
	exit(json_encode($donations));
} else if ($data["type"] == "fetch-image") {
	if (array_key_exists("donationId", $data)) {
		$img = $donationsClass->getImage($data["donationId"]);
	} else {
		header("HTTP/1.1 521 Query failed", true);
		header("Status: 521 Query failed", true);
		die();
	}
	exit($img);
} else if ($data["type"] == "claim-donation") {
	if (array_key_exists("donationId", $data)) {
		$result = $donationsClass->claimDonation($data["donationId"]);
	} else {
		header("HTTP/1.1 521 Query failed", true);
		header("Status: 521 Query failed", true);
		die();
	}
	exit($result);
} else if ($data["type"] == "claimed-donation") {
	if (array_key_exists("donationId", $data)) {
		$result = $donationsClass->deleteDonation($data["donationId"]);
	} else {
		header("HTTP/1.1 521 Query failed", true);
		header("Status: 521 Query failed", true);
		die();
	}
	exit($result);
} else if ($data["type"] == "fetch-status") {
	if (array_key_exists("donationId", $data)) {
		$status = $donationsClass->getClaimStatus($data["donationId"]);
	} else {
		header("HTTP/1.1 521 Query failed", true);
		header("Status: 521 Query failed", true);
		die();
	}
	exit(json_encode($status));
}

?>
