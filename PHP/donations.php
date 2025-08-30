<?php

require_once "constants.php";

class DonationsClass {
	private $donations = "Test";

	function __construct() {
		global $mysqli;
		$result = $mysqli->query("SELECT * FROM donations");
		if ($result == false) {
			header("HTTP/1.1 521 Query failed", true);
			header('Status: 521 Query failed', true);
			die();
		}
		$this->donations = $result->fetch_all();
	}

	public function getDonations() {
		return $this->donations;
	}
}

$donationsClass = new DonationsClass();
var_dump($donationsClass->getDonations());

?>
