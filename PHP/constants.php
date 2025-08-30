<?php

ini_set('display_errors', true);

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
			header('Status: 521 Failed db connection', true);
			die();
		}
		$count = count($this->tables);
		for ($i = 0; $i < $count; $i++) {
			$this->checkExistence("{$this->tables[$i]}");
		}
	}

	function checkExistence($tableName) {
		$results = $this->mysqli->query("SHOW TABLES LIKE '$tableName'");
		if ($results->num_rows == 0) {
			header("HTTP/1.1 521 Failed to find db table.", true);
			header('Status: 521 Failed to find db table', true);
			die();
		}
	}

}

$mysqli = (new MySQLClass())->mysqli;

?>
