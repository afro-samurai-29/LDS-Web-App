<?php

ini_set('display_errors', true);

$username = "%placeholder%";
$database = "%placeholder";

class MySQLClass {
	public $mysqli;
	public $tables = [
		"0" => "donations"
	];

	function __construct() {
		global $username, $database;
		$this->mysqli = new mysqli("localhost", $username, $username, $database);
		if ($this->mysqli->connect_error) {
			die("Connection failed: " . $this->mysqli->connect_error);
		}
		$count = count($this->tables);
		for ($i = 0; $i < $count; $i++) {
			$this->checkExistence("{$this->tables[$i]}");
		}
	}

	function checkExistence($tableName) {
		echo "{$tableName}" . "\n";
		$results = $this->mysqli->query("SHOW TABLES LIKE '$tableName'");
		if ($results->num_rows == 0) {
			die("Connection failed: Table \"" . $tableName . "\" does not exist.");
		}
	}

}

$MySQL = new MySQLClass();

?>
