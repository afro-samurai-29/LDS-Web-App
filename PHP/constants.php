<?php

ini_set("display_errors", true);

$username = "%placeholder%";
$database = "%dbplaceholder%";

function generateUuid($length = 16) {
	return random_bytes($length);
}


class MySQLClass {
	public $mysqli;
	public $uuid;
	public $tables = [
		"0" => "donations"
	];


	function __construct() {
		global $username, $database;
		$this->mysqli = new mysqli("localhost", $username, $username, $database);
		if (isset($_COOKIE["session-id"])) {
			$this->uuid = hex2bin(trim($_COOKIE["session-id"]));
		} else {
			$this->uuid = generateUuid();
			setcookie("session-id", bin2hex($this->uuid), [
				'expires'  => time() + 86400 * 30,	// 30 day
				'path'	 => '/',
				'secure'   => true,	// only over HTTPS
				'httponly' => true,
				'samesite' => 'Strict'
			]);
		}
		
		if ($this->mysqli->connect_error) {
			header("HTTP/1.1 521 Failed db connection", true);
			header("Status: 521 Failed db connection", true);
			die();
		}
		$count = count($this->tables);
		for ($i = 0; $i < $count; $i++) {
			$this->checkExistence("{$this->tables[$i]}");
		}
	}

	function checkExistence(string $tableName) {
		$results = $this->mysqli->query("SHOW TABLES LIKE '$tableName'");
		if ($results->num_rows == 0) {
			header("HTTP/1.1 521 Failed to find db table.", true);
			header("Status: 521 Failed to find db table", true);
			die();
		}
	}

	static public function createTypeString(&$filters) {
		$types = "";
		foreach ($filters as $value) {
			if (is_int($value)) {
				$types .= "i"; // integer
			} elseif (is_float($value)) {
				$types .= "d"; // double/float
			} elseif (is_string($value) && !ctype_print($value)) {
				$types .= "s"; // binary string (contains non-printable characters)
			} elseif (is_string($value)) {
				$types .= "s"; // string
			} else {
				$types .= "b"; // blob/other
			}
		}
		return $types;
	}

	static public function createParams(&$filters) {
		$params[] = MySQLClass::createTypeString($filters);
		foreach ($filters as $key => $value) {
			$params[] = &$filters[$key];
		}
		return $params;
	}

	static public function dynamicBindParams($stmt, &$filters) {
		$params = MySQLClass::createParams($filters);	
		return call_user_func_array([$stmt, "bind_param"], $params);
	}
}

if (isset($_SERVER['HTTP_ORIGIN'])) {
	$origin = $_SERVER['HTTP_ORIGIN'];

	// optionally check against a whitelist
	$allowed = [
		"http://localhost:3000",
		"http://localhost:8080",
		"http://127.0.0.1:8080",
		"file://", // won't work in Chrome, see note below
	];

	if (in_array($origin, $allowed)) {
		header("Access-Control-Allow-Origin: $origin");
		header("Access-Control-Allow-Credentials: true");
		header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
		header("Access-Control-Allow-Headers: Content-Type, Authorization");
	}
}

// handle preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	http_response_code(200);
	exit;
}
$mysqliClass = new MySQLClass();
$mysqli = $mysqliClass->mysqli;
$uuid = $mysqliClass->uuid;

?>
