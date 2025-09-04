<?php

require_once "constants.php";

class DonateClass {
	private $mysqli;
	private $attributes = [
		"0" => "contactNo",
		"1" => "description",
		"2" => "type",
		"3" => "location"
	];

	function __construct() {
		global $mysqli;
		$this->mysqli = $mysqli;
	}

	private function generateUuid($length = 16) {
		return random_bytes($length);
	}

	# Source (Modified to account for gibberish that has little to no spaces): "https://codereview.stackexchange.com/questions/868/calculating-entropy-of-a-string/926#926"
	private function entropyCheck($string) {
		$characterDictionary = [];
		$spaceCount = 0;
		forEach(str_split(strtolower($string)) as $no => $char) {
			if ($char == " ") {
				$spaceCount++;
				continue;
			}
			if (!array_key_exists($char, $characterDictionary)) {
				$characterDictionary[$char] = 0;
			}
			$characterDictionary[$char] += 1;
		}
		$penalty = $spaceCount > 0 ? 1.0/(1 + log( 1 + strlen($string)/($spaceCount+1) )) : 1.0/strlen($string);
		$penalty = max(0.3, $penalty);
		$frequencyTotal = 0;
		forEach($characterDictionary as $char => $count) {
			$frequency = $count/strlen($string);
			$frequency = -1 * $frequency * log($frequency, 2);
			$frequencyTotal += $frequency;
		}
		$frequencyTotal *= $penalty;
		// echo $string . "\n";
		// echo "Entropy Check: " . $frequencyTotal . "\n";
		if ($frequencyTotal < 0.6) {
			header("HTTP/1.1 533 Insertion failed", true);
			header("Status: 533 Insertion failed", true);
			die();
		}
		return $frequencyTotal;
	}

	private function validateData($data) {
		forEach ($data as $key => $value) {
			if ($key == "images" && count($value) == 0) {
				continue;
			} else if ($key != "images" && ($value == "" || ! in_array($key, $this->attributes))) {
				header("HTTP/1.1 531 Post failed", true);
				header("Status: 531 Post failed", true);
				die();
			} else if ($key == "description") { 
				$this->entropyCheck($value);
			}
		}
		forEach ($this->attributes as $key => $value) {
			if (array_key_exists($value, $data)) {
				return 0;
			}
		}
		header("HTTP/1.1 532 Post failed", true);
		header("Status: 532 Post failed", true);
		die();
	}

	public function addDonation($data) {
		$data["description"] = str_replace("  ", " ", trim($data["description"]));
		$this->validateData($data);
		$uuid;
		if (isset($_COOKIE["session-id"])) {
			$uuid = hex2bin(trim($_COOKIE["session-id"]));
		} else {
	    		$uuid = $this->generateUuid();
		}
		$img = $data["images"];
		$img = json_encode($img);
		$params = [
			"0" => $uuid,
			"1" => $img,
			"2" => $data["contactNo"],
			"3" => $data["description"],
			"4" => $data["type"],
			"5" => $data["location"]
		];
		$stmt = $this->mysqli->prepare("INSERT INTO donations (uuid, donationImages, contactNumber, donationDescription, donationType, donationLocation) VALUES(?, ?, ?, ?, ?, ?)");
		MySQLClass::dynamicBindParams($stmt, $params);
		if ($stmt->execute()) {
			setcookie("session-id", bin2hex($params["0"]), [
				'expires'  => time() + 86400,	// 1 day
				'path'     => '/',
				'secure'   => true,	// only over HTTPS
				'httponly' => true,
				'samesite' => 'Strict'
			]);
			exit();
		} else {
			header("HTTP/1.1 534 Failed to register donation", true);
			header("Status: 534 Failed to register donation", true);
			die();
		}
	}
}

$data = json_decode(file_get_contents("php://input"), true);
$donateClass = new DonateClass();
$donateClass->addDonation($data);

?>
