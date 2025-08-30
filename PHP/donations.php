<?php

require_once "constants.php";

class DonationsClass {
	public $donations = "Test";

	public function fetchDonations() {
		var_dump($this->donations);
	}
}

$donations = new DonationsClass();
$donations->fetchDonations();

?>
