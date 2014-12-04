 <?php

require_once 'rdio.php';

$rdio = new Rdio(array("ppebg64vtgcxat45rhrven46", "9YT2zjhE63"));

// $ian = $rdio->call("findUser", array("vanityName" => "ian"));
// if ($ian->status == "ok") {
//   print $ian->result->firstName." ".$ian->result->lastName."\n";
// } else {
//   print "ERROR: ".$ian->message."\n";
// }

$ian = $rdio->call("getPlaybackToken","www.recordrehab.com");

echo "IAN: {$ian}<br>";

echo "KEY: {$ian->result->results[0]->key}<br>";
echo "Name: {$ian->result->results[0]->name}<br>";
echo "Artist: {$ian->result->results[0]->artist}<br>";
  ?>