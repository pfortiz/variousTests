#!/usr/bin/perl

use strict;
use List::Util qw( min max );
use Time::Local;
use Date::Parse;
use Math::Trig;
use CGI;
use POSIX;
use List::MoreUtils qw( minmax );

my $baseDir = "/Users/Shared/ufloTables";

# Get the basic site data from a table for the time being.
my $sitesTable = "$baseDir/sensors.csv";

# At the very least, tables should have a date attached to them
my $dataTable = "$baseDir/nominalData.csv";

# This needs to change in the future (or not).

my (@siteID, @pureSiteID, @siteLon, @siteLat, @siteZ);
my (@siteTimeName, @siteComponents);
my ($fid, %siteField);
my ($sid, $slon, $slat, $sz);

my ($i, $j, $c);
my (%data, %ldata, @dparts);
open(D, "< $dataTable");
$_ = <D>;
chop;
$_ =~ s/#//;
my @dhp = split(/,/);
my $ncols = $#dhp + 1;

while(<D>){
    chop;
    @dparts = split(/,/);
    for($i = 0; $i < $ncols; $i++){
        $ldata{$dhp[$i]} = $dparts[$i];
    }
    $c = $dparts[0] . "_" . $dhp[1];
    $j = "${c}_base";
    if($data{$c} eq ""){
        $data{$j} = $dparts[1];
#        $data{$c} = $dparts[1];
        $data{$c} = $dparts[1] - $data{$j};
    } else {
#        $data{$c} .= ", " . $dparts[1];
        $data{$c} .= ", " . ($dparts[1] - $data{$j});
    }
    for($i = 2; $i < $ncols; $i++){
        $c = $dparts[0] . "_" . $dhp[$i];
        if($data{$c} eq ""){
            $data{$c} = $dparts[$i];
        } else {
            $data{$c} .= ", " . $dparts[$i];
        }

#        $c = $dparts[0] . "_" . $dhp[$i]. "_" . $dhp[1];
#        $j = "${c}_base";
#        if($data{$c} eq ""){
#            $data{$j} = $dparts[1];
##            $data{$c} = $dparts[1];
#            $data{$c} = $dparts[1] - $data{$j};
#        } else {
##            $data{$c} .= ", " . $dparts[1];
#            $data{$c} .= ", " . ($dparts[1] - $data{$j});
#        }
    }
    
}
close(D);

open(F, "< $sitesTable");
$_ = <F>;
chop;
$_ =~ s/#//;
my @fields = split(/,/);

$fid = 0;
foreach $_ (@fields){
    $siteField{$_} = $fid;
    $fid++;
}
my ($flon, $flat, $jsGeolocation);
$jsGeolocation = "";
while(<F>){
    chop;
    @fields = split(/,/);
#    ($sid, $slat, $slon, $sz) = split(/,/);
    $sid = $fields[$siteField{"siteID"}];
    push @siteID, "\"$sid\"";
    push @pureSiteID, $sid;
    $flon = $fields[$siteField{"lon"}];
    $flat = $fields[$siteField{"lat"}];
    $jsGeolocation .= "siteGeoLoc[\"${sid}_lon\"] = $flon;\n";
    $jsGeolocation .= "siteGeoLoc[\"${sid}_lat\"] = $flat;\n";
#    $siteLatLon{$sid} = "$flat, $flon";
#    $siteLatLon{"${sid}_lon"} = "$flon";
#    $siteLatLon{"${sid}_lat"} = "$flat";
    push @siteLon, $flon; # $fields[$siteField{"lon"}];
    push @siteLat, $flat; # $fields[$siteField{"lat"}];
    push @siteZ, $fields[$siteField{"zlevel"}];
    push @siteTimeName, $fields[$siteField{"timeName"}];
    push @siteComponents, $fields[$siteField{"variables-measured"}];
}
close(F);

#foreach $_ (sort keys %siteLatLon){ print STDERR "$_ $siteLatLon{$_}\n"; }
#print STDERR "Geolocation: $jsGeolocation\n";

my $siteIDlist = join(",", @siteID);
my $siteLonlist = join(",", @siteLon);
my $siteLatlist = join(",", @siteLat);
my $nSites = $#siteLon + 1;
$slon = 0.0;
$slat = 0.0;
for( my $i = 0; $i < $nSites; $i++){
    $slon += $siteLon[$i];
    $slat += $siteLat[$i];
}
$slon /= $nSites;
$slat /= $nSites;

my ($minLat, $maxLat) = minmax @siteLat;
my ($minLon, $maxLon) = minmax @siteLon;

my $latDR = $maxLat - $minLat;
my $lonDR = $maxLon - $minLon;

#print STDERR @siteLon;
#print STDERR @siteLat;
#print STDERR @siteTimeName;
#print STDERR @siteComponents;
#print STDERR "$nSites $minLat $maxLat $minLon $maxLon\n";
my $scaleLat = $latDR / 18.0;
my $scaleLon = $lonDR / 18.0;
#print STDERR "$scaleLat $scaleLon\n";
#my $mapScaling = 0.00011;
my $mapScaling; # = 0.00011;
if ($scaleLat > $scaleLon){
    $mapScaling = $scaleLat;
} else {
    $mapScaling = $scaleLon;
}

my $mapZoom;
if ($latDR > $lonDR){
    $mapZoom = floor($latDR/$mapScaling);
} else {
    $mapZoom = floor($lonDR/$mapScaling);
}

#my $scaleLat = 0.01;
#my $scaleLon = 0.015;

my $dataWindow = 6 * 3600.0;  # six hour window, it may be overkill
my $currentTime = time;
my $toTime = $currentTime;
my $fromTime = $currentTime - $dataWindow;

my( $tsec, $tmin, $thour, $tmday, $tmon, $tyear, $twday, $tyday, $tisdst) = localtime($currentTime);
$tyday++;
$tyear += 1900;
$tmon++;
my $tsmon = sprintf("%02d", $tmon);
my $cyear = $tyear;

my( $fsec, $fmin, $fhour, $fmday, $fmon, $fyear, $fwday, $fyday, $fisdst) = localtime($fromTime);
my $laFromHour = $fhour + $fmin/60. + $fsec/3600.;
my $laToHour = $thour + $tmin/60. + $tsec/3600.;
$fyday++;
$fyear += 1900;
$fmon++;
my $fsmon = sprintf("%02d", $fmon);


my $lTime = sprintf("%02d:%02d:%02d", $thour, $tmin, $tsec);

# We know the current day, hence we can get the time and angle of
# sunrise/sunset

my $q = CGI->new();

my $toYear = $q->param('toYear');
my $fromYear = $q->param('toYear');
my ($lfhour, $uthour);
if ($fromYear ne ""){
    $fmday = sprintf("%02d", $q->param('fromDay'));
    $fmon = $q->param('fromMonth');
    $fyear = $toYear;
    $fsmon = sprintf("%02d", $fmon);
    $_ = $q->param('fromTod');
    my ($hhh, $mmm, $sss) = split(/:/);
    $laFromHour = $hhh + $mmm/60. + $sss/3600.;
    # Ready to recompute $fromTime, which is the Unix timestamp
    $fromTime = timelocal($sss,$mmm,$hhh,$fmday,$fmon-1,$fyear);
}
$lfhour = floor($laFromHour);

if ($toYear ne ""){
    $tmday = sprintf("%02d", $q->param('toDay'));
    $tmon = $q->param('toMonth');
    $tyear = $toYear;
    $tsmon = sprintf("%02d", $tmon);
    $_ = $q->param('toTod');
    my ($hhh, $mmm, $sss) = split(/:/);
    $laToHour = $hhh + $mmm/60. + $sss/3600.;
    # Ready to recompute $toTime, which is the Unix timestamp
    $toTime = timelocal($sss,$mmm,$hhh,$tmday,$tmon-1,$tyear);
}
$uthour = ceil($laToHour);

my $ifile = "$baseDir/$tyear/$tsmon/$tmday/solar.dat";
my $fyOptions = ""; #"<option value="$_">$_</option>";
my $fmOptions = "";
my $fdOptions = "";
my $tyOptions = ""; #"<option value="$_">$_</option>";
my $tmOptions = "";
my $tdOptions = "";
my $hOptionsF = "";
my $hOptionsT = "";
my $selected;
my $chour;
for($_= 0; $_ < 24; $_++){
    $chour = sprintf("%02d:00:00", $_);
    if($_ == $lfhour){ $selected = " selected"; }
    else {$selected = "";}
    $hOptionsF .= "<option value=\"$chour\" $selected>$chour</option>\n";
    if($_ == $uthour){ $selected = " selected"; }
    else {$selected = "";}
    $hOptionsT .= "<option value=\"$chour\" $selected>$chour</option>\n";
}

for($_= 1; $_ <= 31; $_++){
    if($_ == $fmday){ $selected = " selected"; }
    else {$selected = "";}
    $fdOptions .= "<option value=\"$_\" $selected>$_</option>\n";
    if($_ == $tmday){ $selected = " selected"; }
    else {$selected = "";}
    $tdOptions .= "<option value=\"$_\" $selected>$_</option>\n";
}

for($_= 1; $_ <= 12; $_++){
    if($_ == $fmon){ $selected = " selected"; }
    else {$selected = "";}
    $fmOptions .= "<option value=\"$_\" $selected>$_</option>\n";
    if($_ == $tmon){ $selected = " selected"; }
    else {$selected = "";}
    $tmOptions .= "<option value=\"$_\" $selected>$_</option>\n";
}

for($_= 2016; $_ <= $cyear; $_++){
    if($_ == $fyear){ $selected= " selected";}
    else { $selected = ""; }
    $fyOptions .= "<option value=\"$_\" $selected>$_</option>\n";
    if($_ == $tyear){ $selected= " selected";}
    else { $selected = ""; }
    $tyOptions .= "<option value=\"$_\" $selected>$_</option>\n";
}

open(SS, "<$ifile");
$_ = <SS>;
close(SS);
my ($cday, $srt, $sraz, $sst, $ssaz, $dlen, @other) = split(/,/);


my $xsr = 75. + 50.*sin(deg2rad($sraz));
my $ysr = 75. - 50.*cos(deg2rad($sraz));
my $xss = 75. + 50.*sin(deg2rad($ssaz));
my $yss = 75. - 50.*cos(deg2rad($ssaz));
my $xssCorr = $xss - 25;


print <<"HEADER";
Content-type: text/html


<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
<meta name="description" content="">
<meta name="author" content="">
<title>Urban Flows Sheffield 001</title>
<!-- Bootstrap core CSS -->
<link href="../ufloStyles/bootstrap.min.css" rel="stylesheet">

<!-- Custom styles for this template 
<link href="../ufloStyles/dashboard.css" rel="stylesheet">
-->

<!-- refresh for latest mote data, every 10 minutes -->
<!--
<meta http-equiv="refresh" content="900">
-->

<style>
  #map {
  height: 600px;
  width: 100%;
  border: 1px solid skyblue;
  }
</style>

<script src="https://d3js.org/d3.v4.min.js"></script>

</head>

<!-- pfo has introduced the JS functions at this level -->
<script>
<!-- pfo has introduced the necessary data at this level -->
var bsize = {
  width: window.innerWidth || document.body.clientWidth,
  height: window.innerHeight || document.body.clientHeight
}

console.info("Hallo, browser size: " +  bsize.width + " x " + bsize.height);
var siteID = [$siteIDlist];
var siteLat = [$siteLatlist];
var siteLon = [$siteLonlist];
var zindex = 1000;
var siteGeoLoc = {};
$jsGeolocation

var nSites = $nSites;
var siteContent = {};
var siteUnits = {};
var data = {};
var map;
var markers = [];
var offsetX = {};
var offsetY = {};
HEADER

#my @components = qw(Temp RH BP DB NO NO2 SO);
my (@components, $cid);
my $senid = "";
my $canvases = "";
$i = 0;
my $divMC = "black";
my $divH = 300;
my $divW = 450;
my ($z, $u, $measUnit);
my %allContents;
foreach $_ (@pureSiteID){
    @components = split(/\|/,$siteComponents[$i]);
    $j = 0;
    foreach $z (@components){
        if ($z =~/:/){
            ($c, $u) = split(/:/,$z);
        } else {
            $c = $z;
            $u = "";
        }
        $allContents{$c} = 1;
        if($j == 0){
            $senid = "\"$c\"";
            $measUnit = "\"$u\"";

        } else {
            $senid .= ", \"$c\"";
            $measUnit .= ", \"$u\"";
        }
        $cid = "canvas_${_}_$c";
        $c = "<div id=\"$cid\" draggable=\"true\" ";
#        $c .= "style=\"border:2px solid $divMC;height:${divH}px;width:${divW}px;background-color: #eeeeee; visibility:hidden\"\n";
        $c .= "ondragstart=\"drag_start(event)\" onclick=\"hideMe('$cid')\"></div>\n";
#        $c .= "</div>\n";
        $canvases .= $c;
#        $canvases .= "<div id=\"$cid\" draggable=\"true\" ></div>\n";
        $j++;
    }
    print <<"SENSORE";
siteContent["$_"] = [$senid];
siteUnits["$_"] = [$measUnit];
SENSORE
#    print STDERR "$senid\n";
    $i++;
}

$i = 0;
$j = 0;
foreach $_ (sort keys %allContents){
    print "offsetX[\"$_\"] = $i;\n";
    print "offsetY[\"$_\"] = $j;\n";
    $i+= 5;
    $j+= 10;
}

foreach $_ (sort keys %data){
    print "data[\"$_\"] = [$data{$_}];\n";
}

print <<"HEADER";

function showDiv(divId)
{
    var did = document.getElementById(divId);
    did.style.visibility = "visible";
}

function hideMe(divId)
{
//    console.info("Hallo, hiding: " +  divId);
    var did = document.getElementById(divId);
    did.style.visibility = "hidden";
}


function drag_start(event) 
{
    var style = window.getComputedStyle(event.target, null);
    var str = (parseInt(style.getPropertyValue("left")) - event.clientX) +
',' + (parseInt(style.getPropertyValue("top")) - event.clientY)+ ',' +
event.target.id;
    event.dataTransfer.setData("Text",str);
} 

function dropit(event) 
{
   var offset = event.dataTransfer.getData("Text").split(',');
   var dm = document.getElementById(offset[2]);
   dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px';
   dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px';
   event.preventDefault();
   return false;
}

function drag_over(event)
{
  event.preventDefault();
  return false;
}

function loadDiv(did)
{
    var dvd = document.getElementById(did);
    divi.style.left = "50px";
    divi.style.top = "50px";
    divi.style.visibility = "hidden";
    divi.style.position = "relative";
}

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
          zoom: $mapZoom,
          center: {lat: $slat, lng: $slon}
    });

    setMarkers(map);
}

var TILE_SIZE = 256;

var shape = {
  coords: [1, 1, 1, 32, 25, 32, 25, 1],
  type: 'poly'
};

function project(latLng) {
    var siny = Math.sin(latLng.lat() * Math.PI / 180);

    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    return new google.maps.Point(
        TILE_SIZE * (0.5 + latLng.lng() / 360),
        TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
}

function alerta(evento, siteID){
//    window.alert('Something was moved over ' + siteID);
//    var chicago = new google.maps.LatLng(41.850, -87.650);
    var slat = siteGeoLoc[siteID+"_lat"];
    var slon = siteGeoLoc[siteID+"_lon"];
    var leSite = new google.maps.LatLng(slat, slon );
    var coordInfoWindow = new google.maps.InfoWindow();
//    coordInfoWindow.setContent(createInfoWindowContent(chicago, map.getZoom()));
    coordInfoWindow.setContent(createInfoWindowContent(evento, siteID, slat, slon));
//    coordInfoWindow.setContent("Data for "+siteID);
    coordInfoWindow.setPosition(leSite);
    coordInfoWindow.open(map);
}

function createInfoWindowContent(eventu, siteID, slat, slon){
//    var worldCoordinate = project(latLng);
//    var scale = 1 << map.getZoom();

//    var pixelCoordinate = new google.maps.Point(
//            Math.floor(worldCoordinate.x * scale),
//            Math.floor(worldCoordinate.y * scale));
    var content = "";
    content = "Data for " + siteID + "<br>";
    content += "<small><table>";
    content += "<tr><td>Latitude: </td><td>" + slat + "</td></tr>";
    content += "<tr><td>Longitude: </td><td>" + slon + "</td></tr>";
    var dataContent = siteContent[siteID];
    console.info("pixels x: "+ eventu.clientX + " y: " + eventu.clientY );
    prime = "_" + eventu.clientX + "_" + eventu.clientY;
    for(i = 0; i < dataContent.length; i++){
        q = dataContent[i];
        u = siteUnits[siteID][i];
        k = siteID + "_" + q;
        kPrime = k + "_" + u + prime;
        len = data[k].length -1;

        content += "<tr><td><input type='checkbox' onClick='makePlot1(this, event)' name='" +kPrime+ "' value=' '><span>" + q + "</span></td><td>" + data[k][len] + " [" + u + "]</td></tr>";
    }
//onMouseOver="changeLabel('the Update')">
    content += "</table></small>";
    return content;
}

function setMarkers(map) {
  // Adds markers to the map.
  // Marker sizes are expressed as a Size of X,Y where the origin of the image
  // (0,0) is located in the top left of the image.
  // Origins, anchor positions and coordinates of the marker increase in the X
  // direction to the right and in the Y direction down.
  // Shapes define the clickable region of the icon. The type defines an HTML
  // <area> element 'poly' which traces out a polygon as a series of X,Y points.
  // The final coordinate closes the poly by connecting to the first coordinate.

  var image = {
    url: '../ufloFigs/metAQ25x32.png',
    size: new google.maps.Size(25, 32),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32)
  };

HEADER

#        mmsg = [siteID,q];
#        thing = {sensor:siteID, measurement:q};
#//        functionName = "plot" + i;
#//        console.info("Hallo "+ functionName + " " + k);
#// None of the lines below work
#//        content += "<tr><td><span id=\''+functionName+'\' onMouseOver='(function(siteID, q){ return function(){ makePlot2(siteID, q); } })(siteID,q);'>" + q + "</span> </td><td>" + data[siteID+"_"+q][len] + " [" + u + "]</td></tr>";
#//        content += "<tr><td><span onMouseOver='(function(){makePlot(thing)})'>" + q + "</span> </td><td>" + data[siteID+"_"+q][len] + " [" + u + "]</td></tr>";
#//        content += "<tr><td><span onMouseOver='(function(){makePlot(\''+ thing + '\')})'>" + q + "</span> </td><td>" + data[siteID+"_"+q][len] + " [" + u + "]</td></tr>";
#//        content += "<tr><td><span onMouseOver='function(){makePlot(mmsg)}'>" + q + "</span> </td><td>" + data[siteID+"_"+q][len] + " [" + u + "]</td></tr>";
#
#
#// The lines below works
#//        content += "<tr><td><span onMouseOver='\''+functionName+'\'(thing)'>" + q + "</span></td><td>" + data[k][len] + " [" + u + "]</td></tr>";
#
#//        content += "<tr><td><span onMouseOver='makePlot(thing)'>" + q + "</span></td><td>" + data[k][len] + " [" + u + "]</td></tr>";
#//        content += "<tr><td><span>" + q + "</span></td><td>" + data[k][len] + " [" + u + "]</td></tr>";
#//        content += "<tr><td onMouseOver='makePlot(mmsg)'>" + q + " </td><td>" + data[k][len] + " [" + u + "]</td></tr>";
#//        content += "<tr><td onMouseOver='makePlot( \'' + mmsg + '\')'>" + q + " </td><td>" + data[siteID+"_"+q][len] + " [" + u + "]</td></tr>";

for($i = 0; $i < $nSites; $i++){
    $sid =  $siteID[$i];
    print <<"MARKER";
    var marker$i = new google.maps.Marker({
      position: {lat: $siteLat[$i], lng: $siteLon[$i]},
      map: map,
      icon: image,
//      shape: shape,
      label: $siteID[$i],
//      title: siteID[i],
      //zIndex: acsesites[i][3]
    });
//    var msg = siteID[i];
//    marker$i.addListener('mouseover', function(){alerta($sid)} );
    marker$i.addListener('click', function(){alerta(event, $sid)} );
MARKER
}

#// This could be generated by perls instead...
#  for (var i = 0; i < nSites; i++) {
#//    var marker = new google.maps.Marker({
#    markers[i] = new google.maps.Marker({
#      position: {lat: siteLat[i], lng: siteLon[i]},
#      map: map,
#      icon: image,
#      shape: shape,
#      label: siteID[i],
#//      title: siteID[i],
#      //zIndex: acsesites[i][3]
#    });
#//    var fname = "alerta"+i;
#    var msg = siteID[i];
#    markers[i].addListener('mouseover', function(){alerta([msg])} );
#  }
#<body>

print <<"HEADER2";
}


</script>

<body ondragover="drag_over(event)" ondrop="dropit(event)">
<table border="1px" width="95%">
<tr valign="top">
<td> 

<nav class="navbar navbar-dark bg-inverse">
<!--
<a class="navbar-brand" href="#">
The Urban Flows Observatory Sheffield
<img src="../ufloFigs/ufloLogo.png" height="50" opacity="0.5" /> 
</a>
-->
<ul class="nav navbar-nav float-sm-left">
<li class="nav-item active">
<img src="../ufloFigs/ufloLogo.png" height="50" style="opacity:1.0" /> 
</li>
<li class="nav-item active"> filler </li>
<li class="nav-item active"> filler </li>
<li class="nav-item active">
<a class="navbar-brand" href="#">
The Urban Flows Observatory &nbsp;&nbsp;&nbsp; Sheffield
</a>
</li>
</ul>
</nav>
Data for $tmday/$tsmon/$tyear  zoom = $mapZoom $slon $slat
<br>
<div id="map"></div>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD8Lq5FuZylrN-pO73Fv5_UU-Lg83N_vMY&callback=initMap">
</script>
<div id="mdiv"></div>
$canvases



<div id="resubmit">
<form action="uflo001.pl" method="post">
<small>
Change the period of observations: 
&nbsp; &nbsp;
From:
<select name="fromYear">
$fyOptions
</select>
<select name="fromMonth">
$fmOptions
</select>
<select name="fromDay">
$fdOptions
</select>
<select name="fromTod">
$hOptionsF
</select>
&nbsp; &nbsp;
To:
&nbsp; &nbsp;
<select name="toYear">
$tyOptions
</select>
<select name="toMonth">
$tmOptions
</select>
<select name="toDay">
$tdOptions
</select>
<select name="toTod">
$hOptionsT
</select>
&nbsp; &nbsp;
<input name="altZoom" type="submit" value="Update"
onMouseOver="changeLabel('the Update')">
</small>
</form>
</div>
</td>
<td align="center" width="150px">
Current time
<br>
$lTime

<br>
$tmday/$tsmon/$tyear
<br>
<span id="whatever" onMouseOver="changeLabel('the Span')">Span</span>
<br>

<svg id="sunCircle" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg"
onMouseOver="changeLabel('the SVG')">
  <circle cx="75" cy="75" r="50" style="fill: white; stroke: yellow; stroke-width: 2"/>
  <text x="73" y="35" font-family="Verdana" font-size="8">N </text>
  <text x="73" y="120" font-family="Verdana" font-size="8">S </text>
  <text x="117" y="80" font-family="Verdana" font-size="8">E </text>
  <text x="27" y="80" font-family="Verdana" font-size="8">W </text>
  <text x="41" y="22" font-family="Verdana" font-size="8">Sunset / Sunrise </text>
  <line x1="75" y1 = "75" x2="$xss" y2="$yss" stroke="black"/>
  <line x1="75" y1 = "75" x2="$xsr" y2="$ysr" stroke="black"/>

  <text x="$xssCorr" y="$yss" font-family="Verdana" font-size="8"> $sst</text>
  <text x="$xsr" y="$ysr" font-family="Verdana" font-size="8"> $srt</text>

</svg>

<br/>
<br/>
<br/>

</td>
</table>
<script>

//document.getElementById("sunCircle").addEventListener("mouseover", changeLabel);

function changeLabel(message){
 var zoom = map.getZoom();
// var zoom = "default";
// var dvd = document.getElementById("mdiv");
// dvd.innerHTML = message + " " + zoom;
 document.getElementById("mdiv").innerHTML = message + " current-zoom " + zoom;

}


function makePlot1(name, eventual){
 var zoom = map.getZoom();
 leName = name.name;
 console.info("LeName "+ leName );
 parts = leName.split("_");

 cName = "canvas_"+parts[0]+"_"+parts[1];
 dName = parts[0]+"_"+parts[1];
 tName = parts[0]+"_Time";
 uName = parts[2];
 xLoc = Number(parts[3]) + offsetX[ parts[1] ] + 30;
 yLoc = Number(parts[4]) + offsetY[ parts[1] ] - $divH - 30;

// xLoc = eventual.clietX + 30;
// yLoc = eventual.clietY - $divH - 30;

 canvas = document.getElementById(cName);
 canvas.style.left = xLoc + "px";
 canvas.style.top  = yLoc + "px";
 canvas.style.position = "absolute";
 canvas.style.visibility = "visible";
 canvas.style.border= "2px solid black";
 canvas.style.height = "300px";
 canvas.style.width = "450px";
 canvas.style.zIndex = zindex;
 canvas.style.backgroundColor = "#eeeeee";
// alert(name.name);

    zindex++;
// canvas.innerHTML = parts[0] + " " +parts[1] + " " + cName + "/"+ tName + " " + data[dName] + "<br>" + data[tName];

 generateScatter(cName, parts[0], parts[1], uName, data[dName], data[tName]);
}

function generateScatter(canvasID, sensorID, qID, qUnit, yData, timex){
 canvas = document.getElementById(cName);
 console.info("Canvas ID: " + canvasID);
 width = canvas.style.width.replace("px","");
 height = canvas.style.height.replace("px","");
 console.info("Canvas height " + height);
 miny = d3.min(yData);
 maxy = d3.max(yData);
 mint = d3.min(timex);
 maxt = d3.max(timex);
 ypadding = (maxy - miny)/20.;
 xpadding = (maxt - mint)/20.;
 console.info("X limits: " + mint, maxt, xpadding);
 console.info("Y limits: " + miny, maxy, ypadding);
// canvas.innerHTML = sensorID + " " + qID + " " + yData + "<br>" + timex;
 canvas.innerHTML = "";
 var svg = d3.select("#"+canvasID)
                .append("svg")
                .attr("width", width)
                .attr("height", height);
  var margin = 40;

  var xscale = d3.scaleLinear()
                   .domain([mint-xpadding, maxt+xpadding])
                   .range([margin, width - margin]);

  var yscale = d3.scaleLinear()
                   .domain([miny-ypadding, maxy+ypadding])
//                   .range([height , margin]);
                   .range([height - margin, margin]);

  var x_axis = d3.axisBottom().scale(xscale);
  var x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");

  var y_axis = d3.axisLeft().scale(yscale).tickSize(-5,0);
  var y_axisR = d3.axisRight().scale(yscale).tickSize(-5,0).tickFormat("");
  var effWidth = width - margin;

//    margin = 0.0;
  svg.append("g")
       .attr("transform", "translate(" + margin + ", "+ 0.0 + ")")
       .call(y_axis);

  svg.append("g")
       .attr("transform", "translate(" + effWidth + ", "+ 0.0 + ")")
       .call(y_axisR);

  var xAxisTranslate = height - margin;

  var xmargin = 0.;
    svg.append("g")
            .attr("transform", "translate("+xmargin+", " + xAxisTranslate  +")")
            .call(x_axis)

    svg.append("g")
       .attr("transform", "translate("+xmargin+", " + margin + ")")
       .call(x_axisT);

    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", width/2)
       .attr("y", margin).attr("dy","-0.5em")
       .attr("font-size", "14px")
       .attr("text-anchor", "middle")
       .text(qID + " v Time. " + sensorID)

    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", width/2)
       .attr("y", height).attr("dy","-0.7em")
       .attr("font-size", "12px")
       .attr("text-anchor", "middle")
       .text("Time [s]");

    svg.append("text")
//       .attr("transform", "translate(0,0)")
//       .attr("transform", "rotate(-90)")
       .attr("x", width/2)
       .attr("y", height/2.).attr("dy","-0.7em")
       .attr("font-size", "12px")
       .attr("text-anchor", "end")
       .text(qID + " [" + qUnit + "]");

  nPoints = timex.length;
  for(var i=0; i < nPoints; i++){
        svg.append("g").append("circle")
         .attr("cx", xscale(timex[i]) )
         .attr("cy", yscale(yData[i]) )
         .attr("r", 3)
         .attr("fill", "red");
  }

}

</script>
</body>
</html>
HEADER2
exit;


print <<"HEADER";
<script type="text/javascript">

function showDiv(divId)
{
    var did = document.getElementById(divId);
    did.style.visibility = "visible";
}

function hideMe(divId)
{
    var did = document.getElementById(divId);
    did.style.visibility = "hidden";
}


function drag_start(event) 
{
    var style = window.getComputedStyle(event.target, null);
    var str = (parseInt(style.getPropertyValue("left")) - event.clientX) +
',' + (parseInt(style.getPropertyValue("top")) - event.clientY)+ ',' +
event.target.id;
    event.dataTransfer.setData("Text",str);
} 

function dropit(event) 
{
   var offset = event.dataTransfer.getData("Text").split(',');
   var dm = document.getElementById(offset[2]);
   dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px';
   dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px';
   event.preventDefault();
   return false;
}

function drag_over(event)
{
  event.preventDefault();
  return false;
}

function loadDiv(did)
{
    var dvd = document.getElementById(did);
    divi.style.left = "50px";
    divi.style.top = "50px";
    divi.style.visibility = "hidden";
    divi.style.position = "relative";
}
</script>

<body ondragover="drag_over(event)" ondrop="dropit(event)">
<center> <h1>The uFlo elements ground tests</h1> </center>
HEADER

# test to handle SVG elements to become part of web page

# SVG use reverse coordinates (top to bottom)
# the idea is to use a normal scale in this script, converting internally
# to the SVG notation

my $svgH = 80;
print <<"TOPO";
<svg width="180" height="$svgH" id="met01" style="border:1px solid #000088">
TOPO

my @Tcolscale = qw(0000d9 000cdb 0019dd 0026df 0033e1 0040e4 004de6 005ae8 0067ea 0074ec 0081ee 008ef0 009bf2 00a8f5 00b5f7 00c2f9 00cffb 00dcfd 26e9d8 a8f656 fefa00 fced00 fae000 f8d300 f6c600 f3b900 f1ac00 ef9f00 ed9200 eb8500 e97900 e76c00 e55f00 e35200 e14500 df3800 dd2b00 db1e00 d81100 d60400 d40000 d20000 d00000 ce0000 cc0000 ca0000 c80000 c60000 c40000 c20000 c00000 bd0000 bb0000 b90000 b70000 b50000 b30000 b10000 af0000 320000);

my %CScales = (
    T => @Tcolscale,
);

print STDERR "Temperature scale: @Tcolscale\n";
print STDERR "Temperature scale(20C): $Tcolscale[20 +20]\n";
my %poll = (
    NO => 120.,
    NO2 => 85.,
    SO => 55.,
);
my %pollColour = (
    NO2 => "#E9977A",
    NO => "#8FBC8F",
    SO => "#FAFAD2",
    CO => "yellow",
    03 => "purple",
    PM25 => "red",
    PM10 => "cyan",
    PM1 => "magenta",
);

my %pollLimit = (
    NO => 150.,
    NO2 => 120.,
    SO => 50.,
    CO => 150.,
    03 => 42.,
    PM25 => 180.,
    PM10 => 120.,
    PM1 => 80.,
);

#$poll{"NO"} = 120.;
#$poll{"NO2"} = 85.;
#$poll{"SO"} = 55.;

my @allMet = qw(T RH ATMP NOISE WSPEED);

my %metUnit = (
    T => "C",
    RH => "%",
    ATMP => "Kp",
    NOISE => "dB",
    WSPEED => "km/h",
);

my %met;
$met{"T"} = 35;
$met{"RH"} = 70;
$met{"NOISE"} = 67;
$met{"ATMP"} = 1001;

my %metCol = (
    T => $Tcolscale[ $met{"T"} + 20],
    RH => "FFFFFF",
    NOISE => "FFFFFF",
    ATMP => "FFFFCC",
);

$met{"RH"} = 70;
$met{"NOISE"} = 67;
$met{"ATMP"} = 1001;

my $divCode = "";
my $divScript = "";

my $barwidth = 15;
my $barSep = 8 + $barwidth;

my $firstX = 5;
&drawbar($firstX, 0, 70, "lime", "CO");

$firstX += $barSep;
&drawbar($firstX, 0, 50, "#00FF88", "NO");

$firstX += $barSep;
&drawbar($firstX, 0, 75, "orange", "NO2");


print "</svg>\n";

# Geometry definitions
my $pollHeight = 16;
my $meteoHeight = 16;
my $meteoSkip = int( $meteoHeight / 2 );
my $meteoWidth = 40;
my $divH = 200;
my $divW = 300;


# The subroutine addLocScript, which creates a dedicated <script> is not
# necessary  for chrome and safari.
# Other browsers need to be tested

my $xpos = "400";
my $ypos = "200";

&createSVG("met02", $xpos, $ypos, \%poll, \%met);
&addLocScript("met01", "100px", "20px");
#&addLocScript("met02", "100px", "10px");

print "$divCode\n";
print "<script type=\"text/javascript\">\n$divScript\n</script>\n";

print "</body>\n</html>\n";

sub createSVG(){
    my $id = shift; # the HTML id of this element. It should be a sensorID
    my $svgLeft = shift;
    my $svgTop = shift;
    my %poll = %{@_[0]}; # Dictionary with pollutants
    my %meteo = %{@_[1]}; # Dictionary with meteo + other data

    my @kpol = keys %poll;
    my $nkpol = $#kpol + 1;
    my @kmet = keys %meteo;
    my $nkmet = $#kmet + 1;
    my $svgWidth = $nkmet*$meteoWidth;
#    my $svgHeight = ($nkpol+1)*16 + 1;
    my $svgHeight = $nkpol * $pollHeight + $meteoHeight + 1;
    my $barheight = $pollHeight - 1;
    my ($p, $pc, $ymin, $xloc, $divLeft, $divTop);
    my (%pwidth, $barwidth, $maxPol, $xThresh, $scale, $yMet, $svgCol);

    $yMet = $svgHeight - 1 - $meteoHeight;

#    print STDERR "Number of pollutants: $nkpol\n";
#    print STDERR "Number of meteo: $nkmet\n";
    $ymin = 1;
    $maxPol = -10.0;
    foreach $p (sort keys %poll){
        $pwidth{$p} = $poll{$p} / $pollLimit{$p};
        if($pwidth{$p} > $maxPol){
            $maxPol = $pwidth{$p};
        }
    }
#    print STDERR "maxPol: $maxPol\n";
    my $bwidth;
    if($maxPol > 1.0){
        $svgCol = "#CC0000";
        $bwidth = "2px";
    } else {
        $svgCol = "#000000";
        $bwidth = "1px";
    }
    print <<"TOPO";
<svg width="$svgWidth" height="$svgHeight" id="$id" style="border:$bwidth
solid $svgCol;left:$svgLeft;top:$svgTop;position:absolute">
TOPO
    if($maxPol < 1.2){ $maxPol = 1.2;}

    my $scale = $svgWidth/$maxPol;
    $xThresh = int($scale);

#    print STDERR "scale : $scale :: width: $svgWidth :: maxPol $maxPol\n";
    my $divId;

    # as we know the location of the svg, we can also pass the values of
    # the 'div' locations
    $divLeft = int($svgLeft + $svgWidth * 1.2);
    foreach $p (sort keys %poll){
#        print STDERR "for $p: $poll{$p}, $pollColour{$p}\n";
        $pc = $pollColour{$p};
        $divId = "$id$p";
        $divCode .= &drawAssDiv("$divId", $pc);
        $barwidth = $scale * $pwidth{$p};
        &drawBox($barwidth, $barheight, 0, $ymin, "$p", "$pc", "$divId");
        $ymin += 16;
        $divTop = $ymin + $svgTop;
        $divScript .= &addDivScript($divId, $divLeft, $divTop);
    }

    print <<"TRESHOLD_LINE";
<line x1="$xThresh" y1="0" x2="$xThresh" y2="$yMet" style="stroke:rgb(255,0,0);stroke-width:2" />
TRESHOLD_LINE

    # Now, let's do the pseudo-meteo quantities
    # Temperature to the left followed by RH, ATMP, NOISE, WINDSPEED
    $xloc = 0;
    my @CS;
    my $nm = 0;
    foreach $_ (@allMet){
        $p = "$meteo{$_} $metUnit{$_}";
        $pc = "#".$metCol{$_};
        if($pc eq ""){
            $pc = "white";
        }
        print STDERR "$p $_:  $pc \n";
        if($meteo{$_} ne ""){
#            print STDERR "Displaying $_\n";
            $divId = "$id$_";
            $divCode .= &drawAssDiv("$divId");
#            $divScript .= &addDivScript("$divId");
            $divLeft = int($svgLeft + ($nm + 0.5) * $meteoWidth);
            $divTop = $svgTop + $svgHeight + $nm * $meteoSkip + $meteoHeight;
            $divScript .= &addDivScript($divId, $divLeft, $divTop);
            &drawBox($meteoWidth, $barheight, $xloc, $ymin, "$p", "$pc", "$divId");
            $xloc += $meteoWidth;
            $nm ++;
        }
    }

    print "</svg>";
}

# Subroutine to draw a generic box. It does not have to know anything about
# what it is representing
sub drawBox(){
    my $width  = shift;
    my $height = shift;
    my $xloc   = shift;
    my $yloc   = shift; # in "svg coordinates", 0 at top
    my $text   = shift;
    my $colour = shift;
    my $divId  = shift;

    my $xlast = $xloc + $width;
    my $yMin = $yloc + $height;
    my $yMax = $yloc;

print <<"POLLY";
  <polygon points="$xloc,$yMin $xloc,$yMax $xlast,$yMax $xlast,$yMin"
    style="fill:$colour;stroke:black;stroke-width:1"
    onclick="showDiv('$divId')"/>
POLLY
    if($text ne ""){
        my $tcolour = &getTextColour($colour);
        my $xtext = $xloc + 3; # + 0.5*$barwidth;
        my $ytext = $yMin - 2;
        my $fontSize = $height -3;
        if ($fontSize > 10){
            $fontSize = 10;
        }
#  <text x="$xtext" y="$ytext" fill="black"  >$text</text>
        print <<"TEXTO";
  <text x="$xtext" y="$ytext" fill="$tcolour" style="font-size:${fontSize}px"
  onclick="showDiv('$divId')">
  $text
  </text>
TEXTO
    }
}

sub getTextColour(){
    my $col = shift;
    $col =~ s/#//;
    my @colr = split(//,$col);
    my @iCol;
#    my $red = 255 - eval "0x".$colr[0].$colr[1];
#    my $grn =  255 -eval "0x".$colr[2].$colr[3];
#    my $blu =  255 -eval "0x".$colr[4].$colr[5];
#    my $tcol = sprintf("#%02X%02X%02X", $red, $grn, $blu);
#    print STDERR "$col -> $tcol\n";
#    return $tcol;
    $iCol[0] = eval "0x".$colr[0].$colr[1];
    $iCol[1] = eval "0x".$colr[2].$colr[3];
    $iCol[2] = eval "0x".$colr[4].$colr[5];
    my $maxC = max @iCol;
#    print STDERR "Box Colour: $col RGB: $iCol[0] $iCol[1] $iCol[2] max: $maxC\n";
    if($maxC > 190){
        return "#000000";
    } else {
        return "#FFFFFF";
    }
}

sub drawAssDiv(){
    my $divid = shift;
    my $divMC = shift;
    my $code= "";
    $code .= "<div id=\"$divid\" draggable=\"true\" \"\n";
    $code .= "style=\"border:2px solid $divMC;height:${divH}px;width:${divW}px;background-color: #eeeeee;\"\n";
    $code .= "ondragstart=\"drag_start(event)\" onclick=\"hideMe('$divid')\">\n";
    $code .= "Plot for $divid\n";
    $code .= "</div>\n";
    return $code;
}

sub addDivScript(){
    my $divid = shift;
    my $divlft = shift;
    my $divtop = shift;
    my $script = "";
    $script .= "var dvd = document.getElementById(\"$divid\");\n";
    $script .= "dvd.style.left = \"${divlft}px\";\n";
    $script .= "dvd.style.top = \"${divtop}px\";\n";
    $script .= "dvd.style.visibility = \"hidden\";\n";
    $script .= "dvd.style.position = \"absolute\";\n";
    return $script;
}

sub drawbar(){
    my $xloc = shift;
    my $ybase = shift;
    my $yheight = shift;
    my $colour = shift;
    my $text = shift;
    my $xlast = $xloc + $barwidth;
    my $yMin = $svgH;
    my $yMax = $svgH - $yheight;

print <<"POLLY";
  <polygon points="$xloc,$yMin $xloc,$yMax $xlast,$yMax $xlast,$yMin"
    style="fill:$colour;stroke:black;stroke-width:1" />
POLLY
    if($text ne ""){
        my $xtext = $xloc; # + 0.5*$barwidth;
        my $ytext = 75;
        print <<"TEXTO";
  <text x="$xtext" y="$ytext" fill="black" style="font-size:10px">$text</text>
TEXTO
    }
}

# scripts must go after the definition of the elements into the document,
# which do make a lot of sense :-)

sub addLocScript(){
    my $id = shift;
    my $xloc = shift;
    my $yloc = shift;

    print <<"SCRIPTS";

<script type="text/javascript">

var met01 = document.getElementById("$id");
met01.style.left = "$xloc";
met01.style.top = "$yloc";
met01.style.position = "absolute";
</script>

SCRIPTS
}
