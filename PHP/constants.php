<?php

ini_set("display_errors", true);

$username = "%placeholder%";
$database = "%dbplaceholder%";

class MySQLClass {
	public $mysqli;
	public $tables = [
		"0" => "donations"
	];

	function __construct() {
		global $username, $database;
		$this->mysqli = new mysqli("localhost", $username, $username, $database);
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

$mysqli = (new MySQLClass())->mysqli;

?>
