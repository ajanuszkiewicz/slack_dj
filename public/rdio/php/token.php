 <?php

require_once 'rdio.php';

$rdio = new Rdio(array("ppebg64vtgcxat45rhrven46", "9YT2zjhE63"));

// $ian = $rdio->call("findUser", array("vanityName" => "ian"));
// if ($ian->status == "ok") {
//   print $ian->result->firstName." ".$ian->result->lastName."\n";
// } else {
//   print "ERROR: ".$ian->message."\n";
// }

$ian = $rdio->call("getPlaybackToken", array("domain" => "www.recordrehab.com"));

echo $ian->result;
  ?>