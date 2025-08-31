<?php

require_once "constants.php";

class DonationsClass {
	private $donations = "";
	private $mysqli;

	function __construct() {
		global $mysqli;
		$this->mysqli = $mysqli;
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
		$count = count($filters);
		
		$result;
		if ($count == 0) {
			$result = $this->mysqli->query("SELECT * FROM donations");
		} else {
			$data = $this->findInSetString($count);
			$stmt = $this->mysqli->prepare("SELECT * FROM donations {$data}");
			MySQLClass::dynamicBindParams($stmt, $filters);
			$stmt->execute();
			$result = $stmt->get_result();
		}

		if ($result == false) {
			header("HTTP/1.1 521 Query failed", true);
			header("Status: 521 Query failed", true);
			die();
		}
		$this->donations = $result->fetch_all();
		return $this->donations;
	}
}

$data = json_decode(file_get_contents("php://input"), true);

$donationsClass = new DonationsClass();
$donations;
if (!array_key_exists("filters", $data)) {
	$donations = $donationsClass->getDonations([]);
} else {
	$donations = $donationsClass->getDonations($data["filters"]);
}
exit(json_encode($donations));

?>
