/*
 *  Set of functions to work in the Sheffield rendition of the 
 *  UKCIRC's Urban Flows Observatory
 *
 *  Author: Patricio F. Ortiz
 *  Affiliation: ACSE, University of Sheffield
 *  Date created: 7 November 2017
 */

var gOffsetX;

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
    /*
    var zlat = siteGeoLoc[siteID+"_lat"];
    var zlon = siteGeoLoc[siteID+"_lon"];
    */
    var zlat = siteInfo[siteID].lat;
    var zlon = siteInfo[siteID].lon;
    var leSite = new google.maps.LatLng(zlat, zlon );
    var coordInfoWindow = new google.maps.InfoWindow();
//    coordInfoWindow.setContent(createInfoWindowContent(chicago, map.getZoom()));
    coordInfoWindow.setContent(createInfoWindowContent(evento, siteID, zlat, zlon));
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
    var as = "a";
    var content = "";
    gOffsetX = 50;
//    col25 = tempScale(25);
//    console.info("Colour for 25C: " + col25 + " siteID: " + siteID);
    qq = "nature=click;scaling=1";
    content = "Data for " + siteID + " ";
    content += "<input type='button' class='blueButton' onClick='makePlots(this, qq, event)' name='" +siteID+ "' value='Plot all'><br>";
    content += "<small><table>";
    /*
    slat = siteInfo[siteID].lat;
    slon = siteInfo[siteID].lon;
    */
    content += "<tr><td>Latitude: </td><td>" + slat + "</td><td></td></tr>";
    content += "<tr><td>Longitude: </td><td>" + slon + "</td><td></td></tr>";
    var dataContent = siteContent[siteID];
    console.info("dataContent: " + dataContent);
    /*
    console.info("pixels x: "+ eventu.clientX + " y: " + eventu.clientY );
    primeS = "_" + eventu.screenX + "_" + eventu.screenY;
    prime = "_" + eventu.clientX + "_" + eventu.clientY;
    console.info("prime: " + prime);
    */
    for(i = 0; i < dataContent.length; i++){
        q = dataContent[i];
        k = siteID + "_" + q;
        u = siteUnits[siteID][i];
        uzi = mdata[k].ucd;
//        kPrime = k + prime;
        kPrime = k;
        len = data[k].length -1;
        qq = "nature=click;scaling=1";

//        content += "<tr><td><input type='checkbox' onClick='(function(t,s,q,e,k){ makePlot1(t,s,q,e,k);})(this,1,qq,event,kapsule)' name='" +kPrime+ "' value=' '><span>" + q + "</span></td><td>" + data[k][len] + " [" + u + "]</td>";
        content += "<tr><td><input type='checkbox' onClick='makePlot1(this,qq,event)' name='" +kPrime+ "' value=' '><span>" + q + "</span></td><td>" + data[k][len] + " [" + u + "]</td>";
        content += "<td><span onClick='markMe(this)' id='" +k + "'>&nbsp;&nbsp;&nbsp;Add</span></td></tr>";
    }
//onMouseOver="changeLabel('the Update')">
    content += "</table></small>";
    return content;
}


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
    delete activeCanvas[divId];
    console.info("Removed: " + divId + " remaining: " +
                    Object.keys(activeCanvas));
}

function goLive()
{
    console.info("Hello browser my old friend");
    active = Object.keys(activeCanvas);
    nac = active.length;
    longValue = "";
    for (c = 0; c < nac; c++){
        ac = active[c];
//        console.info("active: " + ac + " has: " + activeCanvas[ac]);
        var did = document.getElementById(ac);
        xpos = did.style.left.replace("px","");
        ypos = did.style.top.replace("px","");
        zindx = did.style.zIndex;
 //       console.info("active Position: " + xpos + ", " + ypos);
        act = activeCanvas[ac];
        pact = act.split(":");
        pName = pact[0];
        toPass = "nature=alive;xPos=" +  xpos + ";yPos=" + ypos+";zx="+ zindx +
            ";"+activeCanvas[ac];
//        toPass = "nature=alive;xPos=" activeCanvas[ac] + ":" +  xpos + ":" + ypos+":"+ zindx ;
//        console.info("Passing: " + toPass);
        if(longValue.length > 0){
            longValue += "|" + toPass;
        } else {
            longValue = toPass;
        }
    }
    input = document.getElementById("plots2do");
    input.value = longValue;
    zoomy = document.getElementById("actualZoom");
    zoomy.value = map.getZoom();
    cLatLon = map.getCenter();

//    console.info("current map central geoloc : " + cLatLon);
//    console.dir(cLatLon);
    document.getElementById("midLat").value = cLatLon.lat();
    document.getElementById("midLon").value = cLatLon.lng();
    document.getElementById("alive").value = 1;
    console.info("Attempting to pass: " + longValue);
    document.redo.submit();
}

function raiseMe(divId)
{
    var did = document.getElementById(divId);
    did.style.zIndex = zindex;
    zindex++;
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



function changeLabel(message){
 var zoom = map.getZoom();
// var zoom = "default";
// var dvd = document.getElementById("mdiv");
// dvd.innerHTML = message + " " + zoom;
 document.getElementById("mdiv").innerHTML = message + " current-zoom " + zoom;

}

function setMarkersCallBack(map, theMarkers) {
  // Adds markers to the map.
  // Marker sizes are expressed as a Size of X,Y where the origin of the image
  // (0,0) is located in the top left of the image.
  // Origins, anchor positions and coordinates of the marker increase in the X
  // direction to the right and in the Y direction down.
  // Shapes define the clickable region of the icon. The type defines an HTML
  // <area> element 'poly' which traces out a polygon as a series of X,Y points.
  // The final coordinate closes the poly by connecting to the first coordinate.

    var localMarkers = [];
  var image = {
    url: '../ufloFigs/ufloLogo003.jpg',
    size: new google.maps.Size(25, 35),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32)
  };

  for (var i = 0; i < nSites; i++) {
    var alat = g_siteLat[i];
    var alon = g_siteLon[i];
    var asid = g_siteID[i];
    var marker = (function(xlat, xlon, xsid, image, mrkrs){
            myCreateMarker(xlat, xlon, xsid, image, mrkrs);
        })(alat, alon, asid, image, theMarkers);
//    localMarkers.push(theMarker[i]);
/*
    console.info("The markers: " + theMarkers);
//    theMarkers.push(marker);
    var marker = myCreateMarker(i, image);
    sid = siteID[i];
    var marker = new google.maps.Marker({
      position: {lat: siteLat[i], lng: siteLon[i]},
      map: map,
      icon: image,
      shape: shape,
      label: sid,
    });
    marker.addListener('click', function(){alerta(event, sid)} );
*/
  }
    return(theMarkers);
}

/*
 *  Trying to create a callback method so that each marker get different entries
 */
function myCreateMarker(mlat, mlon, msid, image, tmark){
    return function(err){
        var marker = new google.maps.Marker({
            position: {lat: mlat, lng: mlon },
            map: map,
            icon: image,
//      shape: shape,
            label: msid
        });
        marker.addListener('click', function(){alerta(event, msid);} );
//        console.info("marker: " + marker);
        tmark.push(marker);
        return(marker);
    }(mlat, mlon, msid, image, image, tmark);
}

function textSize(text) {
    if (!d3) return({ width: 0, height: 0} );
    var container = d3.select('body').append('svg');
    container.append('text')
                .attr("x", -99999)
                .attr("y", -99999)
                .attr("font-size", "12px")
                .text(text);
    var size = container.node().getBBox();
    container.remove();
    return ({ width: size.width, height: size.height });
}


//function multiPlot(qtty, scaling, oldCanvas){
function multiPlot(jason ){
//    console.log("multiplot-arg: ", jason);
    caps = toObject(jason);
    scaling = caps.scaling;
    qtty = caps.quantity;
    nature = caps.nature;
    cName = "multiPlot_" + qtty;
//    mindex++;
    var location = createDivIfNeeded(cName);
    switch(nature){
        case "click":
            xLoc = fullBoxX;
            yLoc = fullBoxY;
            fullBoxX += 50;
            fullBoxY += 50;
            caps["zx"] = zindex;
            zindex++;
            break;
        case "zoom":
            xLoc = location.xPos;
            yLoc = location.yPos;
            caps["zx"] = location.zindex;
            break;
        case "alive":
            xLoc = caps.xPos;
            yLoc = caps.yPos;
            break;
    }
    /*
    can = document.getElementById(cName);
    if ( can !== null){
        d3.select("#" + cName).remove();
        delete activeCanvas[cName];
    }
    */
//    things = Object.keys(wishList);
    nmrkrs = theMarkers.length;
    /*
    myMarkers = theMarkers;
    console.info("N markers: "+ myMarkers.length);
    console.dir(map);
    console.info("Is it in? " + map.getBounds());
    console.dir(map.getBounds());
    */
    var inside = [];
    for(var km = 0 ; km < nmrkrs; km++){
        mrkr = theMarkers[km];
//        console.info("Marker " + mrkr.label + " Pos: " + mrkr.getPosition());
        combo = mrkr.label + "_" + qtty;
        if(map.getBounds().contains(mrkr.getPosition()) ){
            if( hamlet[combo] == 1){
                inside.push(combo);
            }
        }
    }
    /*
    things = varsByCont[qtty];
    console.info("wishList to plot: "+ things );
    console.info("realList to plot: "+ inside );
    */
    things = inside;
    var qToPlot = {};
    var siteColour = {};
//    console.info("N things: "+ things.length + "  " + things);
    for(var i = 0; i < things.length; i++){
        parts = things[i].split("_");
//        console.info("Dealing with: " + things[i] + " " + parts);
//        qToPlot[parts[i]] += things[i] + " ";
        if( qToPlot[parts[1]] == null){
            qToPlot[parts[1]] = parts[0];
        } else {
            text = " " + parts[0];
            qToPlot[parts[1]] += text;
        }
        siteColour[parts[0]] = 1;
    }
    content = Object.keys(qToPlot);
    sites = Object.keys(siteColour);
    /*
    for(var i = 0; i < content.length; i++){
        cle = content[i];
//        console.info("For " + cle + " I need: " + qToPlot[cle]);
    }
    */
    nPlots = content.length;
//    console.info("Number of plots needed: " + nPlots);
    var minTime = [];
    var maxTime = [];
    var siteTime = {};
    nAllSites = sites.length;
    frac = 1.0/(nAllSites+0);
    for(i = 0; i < sites.length; i++){
        site = sites[i];
//        console.info("Site: "+  site);
        siteColour[site] = d3.interpolateRainbow( i* frac);
//        console.info("Colour: " + site + " " + siteColour[site] + " " +(i*frac));
        tName = site + "_Time";
        tbName = site + "_Time_base";
        timeOffset = Number(data[tbName]);

        var timex = new Array(data[tName].length);
        for(var t = 0; t < timex.length; t++){
           timex[t] = (data[tName][t] + timeOffset) * 1000.0;
        }
        siteTime[site] = timex;
        minTime.push( d3.min(timex) );
        maxTime.push( d3.max(timex) );
    }
    mint = d3.min(minTime);
    maxt = d3.max(maxTime);
    var location = createDivIfNeeded(cName);
//    console.info(cName + " Plots_Requested: " + content);

//    console.info("Pallete: " + siteColour);
//    console.info("Time range: " + mint + " to " + maxt);
    xpadding = (maxt - mint)/20.0;
    minDate = new Date(1.0* (mint-xpadding));
    maxDate = new Date(1.0* (maxt+xpadding));
    var mdao = new Date((maxt+mint)/2.0);
    midDate = mdao.getDate()  + " / " + (mdao.getMonth()+1) +  " / " + mdao.getFullYear();
//    console.info("Date range: " + minDate + ", " + maxDate);
//    console.info("Mean date: " + mdao + " " + midDate);


    frameColour = "brown";
    cWidth = 400 * scaling;
    cHeight = (80 + nPlots * 120 + nAllSites*10) * scaling;
    canvas = document.getElementById(cName);
    canvas.style.left = xLoc + "px";
    canvas.style.top  = yLoc + "px";
    canvas.style.position = "absolute";
    canvas.style.visibility = "visible";
    canvas.style.border= "2px solid " + frameColour;
    canvas.style.height = cHeight + "px";
    canvas.style.width = cWidth + "px";
    canvas.style.zIndex = caps["zx"];
    canvas.style.backgroundColor = "#ffeeee";
    geo1 = plotGeometry(nPlots, cWidth, cHeight, 0);
//    zindex++;


//    console.info("things: "+ nPlots + " " + content);

// console.info("Time offset: ", timeOffset);
//
// content = siteContent[leName];
//
//
// console.info("X limits-1: " + timex[0] + " " + timex[timex.length-1] );
// console.info("X limits: " + mint + " " + maxt + " " + xpadding);

    canvas.innerHTML = "";
    var svg = d3.select("#"+cName)
                .append("svg")
                .attr("width", cWidth)
                .attr("height", cHeight);

    var xscale = d3.scaleTime()
                    .domain([minDate, maxDate])
                    .range([geo1[0].xLeft, geo1[0].xRight]);

    var xmargin = 0.0;
    nPm1 = nPlots -1;
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", cWidth/2)
       .attr("y", 0).attr("dy","1.5em")
       .attr("font-size", "14px")
       .attr("text-anchor", "middle")
       .text("Customised Charts for " + midDate);
    origScaling = scaling;
    if(scaling == 1){
        face = "+";
        scaling = maxScale;
    } else {
        face = "-";
        scaling = 1;
    }
    pTop = cHeight - 24;
    pLeft = cWidth - 24;
    pMidX = cWidth -12;
    pMidY = cHeight -12;
    svg.append("rect").attr("x", pLeft).attr("y", 0)
        .attr("width","20").attr("height","20")
        .attr("onclick", "hideMe('" + cName +  "')")
        .attr("fill",frameColour);
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("onclick", "hideMe('" + cName +  "')")
       .attr("x", pMidX).attr("y", "12").attr("dy","+0.25em")
       .attr("font-size", "16px").attr("text-anchor", "middle")
       .attr("fill", "white").text("X");

    arg = "nature=zoom;quantity="+qtty+";scaling="+scaling;
    svg.append("rect")
        .attr("x", pLeft)
        .attr("y", pTop)
        .attr("width","20")
        .attr("height","20")
        .attr("onclick", "multiPlot('" + arg +  "')")
//        .attr("onclick", "multiPlot('" +qtty + "','" + scaling + "','" + cName +  "')")
        .attr("fill",frameColour);

    svg.append("text")
       .attr("transform", "translate(0,0)")
        .attr("onclick", "multiPlot('" + arg + "')")
//       .attr("onclick", "multiPlot('" +qtty + "','" + scaling + "','" + cName +  "')")
       .attr("x", pMidX) // .attr("dx", "-0.5em")
       .attr("y", pMidY).attr("dy","+0.25em")
       .attr("font-size", "16px")
       .attr("text-anchor", "middle")
       .attr("fill", "white")
       .text(face);

    tlabel = sites[0];
    var nSitesPerLine = [];
    maxWidth = geo1[0].width;
    accountedSites = 0;
    for(var x = 1; x < nAllSites; x++){
        site = sites[x];
        try1 = tlabel + " " + site;
//        console.info("tlabel:" + tlabel + " try: " + try1);
        tw = textSize(try1);
//        console.info("width(" + try1 + ") = " + tw.width +"/" + maxWidth);
        if(tw.width > maxWidth){
//            console.info("Oops, it doesn't fit. do use " + tlabel);
            nsitios =  tlabel.split(" ").length ;
            nSitesPerLine.push( nsitios );
            accountedSites += nsitios;
            tlabel = site;
        } else {
//            console.info("AOK for " + try1);
            tlabel = try1;
        }
    }
    if(accountedSites < nAllSites){
        nSitesPerLine.push( nAllSites - accountedSites ) ;
    }
    sid = 0;
    dyval = 3.0;
    nspl = nSitesPerLine.length;
    geo = plotGeometry(nPlots, cWidth, cHeight, nspl*15);
    for(var l =0; l < nspl; l++){
        npl = nSitesPerLine[l];
//        console.info("putting " + npl + " sites in line " + l);
        xStep = geo[0].width/npl;
        dy = dyval + "em";
        dyval += 1.2;
        for(var spl = 0; spl < npl; spl++){
            xLoc = geo[0].xLeft + spl * xStep;
            site = sites[sid];
            color = siteColour[site];
            svg.append("text")
               .style("fill", color)
               .attr("transform", "translate(0,0)")
               .attr("x", xLoc)
               .attr("y", 0).attr("dy", dy)
               .attr("font-size", "12px")
               .attr("text-anchor", "start")
               .text(site);
            sid++;
        }
    }

    var theContent = [];
    for (var c = 0; c < nPlots ; c++){
        gu = geo[c];
        cont = content[c];
        parts = qToPlot[cont].split(" ");
        nSites = parts.length;
//        console.info("For " + cont + " I need: " + nSites + " " + parts);
        minVal = [];
        maxVal = [];
        for (var z = 0; z < nSites ; z++){
            dName = parts[z] + "_" + cont;
            theContent.push(dName);
//            console.info("addressing: " + dName);
            minVal.push( d3.min(data[dName]) );
            maxVal.push( d3.max(data[dName]) );
        }
        miny = d3.min(minVal);
        maxy = d3.max(maxVal);
//        console.info("Extreme for : " + cont + " " + miny + " , " + maxy);

        // In conditions to draw the frame after defining the scales
        ypadding = (maxy - miny)/20.0;
//        console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
        var yscale = d3.scaleLinear()
                .domain([miny-ypadding, maxy+ypadding])
                .range([gu.yBot, gu.yTop]);
        var x_axis;
        var x_axisT;
        if(nPlots == 1){
            x_axis = d3.axisBottom().scale(xscale).tickSize(-5.0);
            x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0);
        } else {
            if( c === 0 ){
                x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
                x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0);
            } else {
                if (c == nPm1){
                    x_axis = d3.axisBottom().scale(xscale).tickSize(-5.0);
                    x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
                } else {
                    x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
                    x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
                }
            }
        }

        var y_axis = d3.axisLeft()
            .scale(yscale)
            .ticks(5)
            .tickSize(-5,0);
        var y_axisR = d3.axisRight()
            .ticks(5).scale(yscale).tickSize(-5,0);
            //.tickFormat("");
    
        svg.append("g")
           .attr("transform", "translate(" + gu.xLeft + ", "+ 0.0 + ")")
           .call(y_axis);
    
        svg.append("g")
           .attr("transform", "translate(" + gu.xRight + ", "+ 0.0 + ")")
           .call(y_axisR);
    
        svg.append("g")
                .attr("transform", "translate("+ xmargin +", " + gu.yBot  +")")
                .call(x_axis);
    
        svg.append("g")
           .attr("transform", "translate("+xmargin+", " + gu.yTop + ")")
           .call(x_axisT);
    
//        console.info(" trace after painting axes for : " + cont );
        svg.append("text")
           .attr("transform", "translate("+geo[0].xLeft/3+","+ gu.midY +")rotate(-90)")
           .attr("font-size", "12px")
           .attr("text-anchor", "middle")
           .text(cont );
//           .text(cont + " [" + unit + "]");
//        console.info("double check nSites: " + nSites );
        for (z = 0; z < nSites ; z++){
            site = parts[z];
            color = siteColour[site];
            dName = site + "_" + cont;
//            console.info("Plotting: " + dName + " colour: " + color);
            yData = data[dName];
            timex = siteTime[site];
            nPoints = timex.length;
            for(var j=0; j < nPoints; j++){
                svg.append("g").append("circle")
                .attr("cx", xscale(timex[j]) )
                .attr("cy", yscale(yData[j]) )
                .attr("r", 2)
                .attr("fill", color);
//                .attr("fill", laScale(yData[j]));
    //          .attr("fill", "red");
            }
        }
    }
    activeCanvas[cName] = "code=multiPlot;quantity="+qtty+";scaling=" + origScaling+";content="+theContent;
    return;
}

function markClick(obj, e){
    console.info("ClickClient: " + e.clientX + ", " + e.clientY);
    console.info("ClickScreen: " + e.screenX + ", " + e.screenY);
    console.dir(obj);
}

function zoom_in(e){
    console.info("DragStart: " + e.clientX + ", " + e.clientY);
    console.info("DragStart: " + e.screenX + ", " + e.screenY);
//    console.dir(obj);
}

function plotSelected(jason){
    caps = toObject(jason);
    scaling = caps.scaling;
    natura = caps.nature;
    oldCanvas = caps.oldCanvas;
//    console.info("canvas name: " + caps.oldCanvas);
    switch(natura){
        case ("click"):
//            console.info("case click: " +name.name + " " +  parts[0] + "  " + parts[1]);
//            siteID = name.name;
//            xPos = eve.clientX + gOffsetX;
//            yPos = eve.clientY;
            xLoc = fullBoxX;
            yLoc = fullBoxY;
            fullBoxX += 10;
            fullBoxY += 10;
            caps["zx"] = zindex;
            zindex++;
            things = Object.keys(wishList);
            canvasName = "plotSelected_" + mindex;
            mindex++;
//    console.info("wishList to plot: "+ things );
            if(things === 0){
                return;
            }
            break;
        case ("zoom"):
//            console.info("zomm-cnvs: " + oldCanvas);
            can = document.getElementById(oldCanvas);
            xPos = can.style.left;
            yPos = can.style.top;
            d3.select("#" + oldCanvas).remove();
//            delete activeCanvas[oldCanvas];
            canvasName = oldCanvas;
            xLoc = xPos.replace("px","");
            yLoc = yPos.replace("px","");
            zindex = can.style.zIndex;
            things = Object.keys(wishList);
/*
            parts = caps["cName"].split("_");
            parts.shift();
            console.info("case zoom: " + caps.cName + " " +  parts[0] + "  " + p
arts[1]);
            msiteID = parts[0];
            mcomp = parts[1];
//            obi["dName"] = parts[0] + "_" + parts[1];
*/
            break;
        case ("alive"):
            siteID = caps.siteID;
//            console.info("case alive siteID= " + siteID);
//            cont = caps.content.split(",");
//            parts = cont[0].split("_");
//            msiteID = parts[0];
//            mcomp = parts[1];
            xLoc = caps["xPos"];
            yLoc = caps["yPos"];
            things = caps.content.split(",");
            zindex = caps["zx"];
            /*
            ok = Object.keys(caps);
            for(p = 0 ; p < ok.length; p++){
                ko = ok[p];
                console.info("Alive["+ko+ "] = " + caps[ko]);
            }
            */
            canvasName = "plotSelected_" + mindex;
            mindex++;
            break;
    }

// var zoom = map.getZoom();
    /*
    can = document.getElementById(oldCanvas);
    if ( can !== null){
    }
    things = Object.keys(wishList);
//    console.info("wishList to plot: "+ things );
    if(things === 0){
        return;
    }
    */


    var qToPlot = {};
    var siteColour = {};
    for(var i = 0; i < things.length; i++){
        parts = things[i].split("_");
//        console.info("Dealing with: " + things[i] + " " + parts);
//        qToPlot[parts[i]] += things[i] + " ";
        if( qToPlot[parts[1]] == null){
            qToPlot[parts[1]] = parts[0];
        } else {
            text = " " + parts[0];
            qToPlot[parts[1]] += text;
        }
        siteColour[parts[0]] = 1;
    }
    content = Object.keys(qToPlot);
    sites = Object.keys(siteColour);
    for(i = 0; i < content.length; i++){
        cle = content[i];
//        console.info("For " + cle + " I need: " + qToPlot[cle]);
    }
    nPlots = content.length;
//    console.info("Number of plots needed: " + nPlots);
    var minTime = [];
    var maxTime = [];
    var siteTime = {};
    nAllSites = sites.length;
    frac = 1.0/(nAllSites+0);
    for(i = 0; i < sites.length; i++){
        site = sites[i];
//        console.info("Site: "+  site);
        siteColour[site] = d3.interpolateRainbow( i* frac);
//        console.info("Colour: " + site + " " + siteColour[site] + " " +(i*frac));
        tName = site + "_Time";
        tbName = site + "_Time_base";
        timeOffset = Number(data[tbName]);

        var timex = new Array(data[tName].length);
        for(var t = 0; t < timex.length; t++){
           timex[t] = (data[tName][t] + timeOffset) * 1000.0;
        }
        siteTime[site] = timex;
        minTime.push( d3.min(timex) );
        maxTime.push( d3.max(timex) );
    }
    mint = d3.min(minTime);
    maxt = d3.max(maxTime);
    cName = canvasName;
    var location = createDivIfNeeded(cName);
//    console.info("Pallete: " + siteColour);
//    console.info("Time range: " + mint + " to " + maxt);
    xpadding = (maxt - mint)/20.0;
    minDate = new Date(1.0* (mint-xpadding));
    maxDate = new Date(1.0* (maxt+xpadding));
    var mdao = new Date((maxt+mint)/2.0);
    midDate = mdao.getDate()  + " / " + (mdao.getMonth()+1) +  " / " + mdao.getFullYear();
//    console.info("Date range: " + minDate + ", " + maxDate);
//    console.info("Mean date: " + mdao + " " + midDate);


    frameColour = "green";
    cWidth = 400 * scaling;
    cHeight = (80 + nPlots * 120 + nAllSites*10) * scaling;
    canvas = document.getElementById(cName);
    canvas.style.left = xLoc + "px";
    canvas.style.top  = yLoc + "px";
    canvas.style.position = "absolute";
    canvas.style.visibility = "visible";
    canvas.style.border= "2px solid " + frameColour;
    canvas.style.height = cHeight + "px";
    canvas.style.width = cWidth + "px";
    canvas.style.zIndex = zindex;
    canvas.style.backgroundColor = "#eeffee";

    geo1 = plotGeometry(nPlots, cWidth, cHeight, 0);


//    console.info("nPlots: "+ nPlots + " Geo0: " + geo1[0]);


    canvas.innerHTML = "";
    var svg = d3.select("#"+cName)
                .append("svg")
                .attr("onclick", "markClick(this,event)")
                .attr("width", cWidth)
                .attr("height", cHeight);

    var xscale = d3.scaleTime()
                    .domain([minDate, maxDate])
                    .range([geo1[0].xLeft, geo1[0].xRight]);

    var xmargin = 0.0;
    nPm1 = nPlots -1;
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", cWidth/2)
       .attr("y", 0).attr("dy","1.5em")
       .attr("font-size", "14px")
       .attr("text-anchor", "middle")
       .text("Customised Charts for " + midDate);
    origScaling = scaling;
    if(scaling == 1){
        face = "+";
        scaling = maxScale;
    } else {
        face = "-";
        scaling = 1;
    }
    pTop = cHeight - 24;
    pLeft = cWidth - 24;
    pMidX = cWidth -12;
    pMidY = cHeight -12;
    svg.append("rect").attr("x", pLeft).attr("y", 0)
        .attr("width","20").attr("height","20")
        .attr("onclick", "hideMe('" + cName +  "')")
        .attr("fill",frameColour);
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("onclick", "hideMe('" + cName +  "')")
       .attr("x", pMidX).attr("y", "12").attr("dy","+0.25em")
       .attr("font-size", "16px").attr("text-anchor", "middle")
       .attr("fill", "white").text("X");
    msg = "nature=zoom;scaling=" + scaling + ";oldCanvas=" + cName;
    svg.append("rect")
        .attr("x", pLeft)
        .attr("y", pTop)
        .attr("width","20")
        .attr("height","20")
        .attr("onclick", "plotSelected('" + msg +  "')")
//        .attr("stroke-opacity","0.5");
        .attr("fill",frameColour);

    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("onclick", "plotSelected('" + msg +  "')")
       .attr("x", pMidX) // .attr("dx", "-0.5em")
       .attr("y", pMidY).attr("dy","+0.25em")
       .attr("font-size", "16px")
       .attr("text-anchor", "middle")
       .attr("fill", "white")
       .text(face);

    tlabel = sites[0];
    var nSitesPerLine = [];
    maxWidth = geo1[0].width;
    accountedSites = 0;
    for(var x = 1; x < nAllSites; x++){
        site = sites[x];
        try1 = tlabel + " " + site;
//        console.info("tlabel:" + tlabel + " try: " + try1);
        tw = textSize(try1);
//        console.info("width(" + try1 + ") = " + tw.width +"/" + maxWidth);
        if(tw.width > maxWidth){
//            console.info("Oops, it doesn't fit. do use " + tlabel);
            nsitios =  tlabel.split(" ").length ;
            nSitesPerLine.push( nsitios );
            accountedSites += nsitios;
            tlabel = site;
        } else {
//            console.info("AOK for " + try1);
            tlabel = try1;
        }
    }
    if(accountedSites < nAllSites){
        nSitesPerLine.push( nAllSites - accountedSites ) ;
    }
    sid = 0;
    dyval = 3.0;
    nspl = nSitesPerLine.length;
    geo = plotGeometry(nPlots, cWidth, cHeight, nspl*15);
    for(var l =0; l < nspl; l++){
        npl = nSitesPerLine[l];
//        console.info("putting " + npl + " sites in line " + l);
        xStep = geo[0].width/npl;
        dy = dyval + "em";
        dyval += 1.2;
        for(var spl = 0; spl < npl; spl++){
            xLoc = geo[0].xLeft + spl * xStep;
            site = sites[sid];
            color = siteColour[site];
            svg.append("text")
               .style("fill", color)
               .attr("transform", "translate(0,0)")
               .attr("x", xLoc)
               .attr("y", 0).attr("dy", dy)
               .attr("font-size", "12px")
               .attr("text-anchor", "start")
               .text(site);
            sid++;
        }
    }
//    dyval = -1.0;
//    for(var x = 0; x < nAllSites; x++){
//        site = sites[x];
//        dy = dyval + "em";
//        color = siteColour[site];
//        svg.append("text")
//           .style("fill", color)
//           .attr("transform", "translate(0,0)")
//           .attr("x", cWidth/2)
//           .attr("y", cHeight).attr("dy", dy)
////           .attr("y", cHeight).attr("dy","-0.7em")
//           .attr("font-size", "12px")
//           .attr("text-anchor", "middle")
//           .text(site);
//       dyval -= 1.2;
//    }

    var theContent = [];
    for (var c = 0; c < nPlots ; c++){
        gu = geo[c];
        cont = content[c];
        parts = qToPlot[cont].split(" ");
        nSites = parts.length;
//        console.info("For " + cont + " I need: " + nSites + " " + parts);
        minVal = [];
        maxVal = [];
        for (var z = 0; z < nSites ; z++){
            dName = parts[z] + "_" + cont;
            theContent.push(dName);
//            console.info("addressing: " + dName);
            minVal.push( d3.min(data[dName]) );
            maxVal.push( d3.max(data[dName]) );
        }
        miny = d3.min(minVal);
        maxy = d3.max(maxVal);
//        console.info("Extreme for : " + cont + " " + miny + " , " + maxy);

        // In conditions to draw the frame after defining the scales
        ypadding = (maxy - miny)/20.0;
//        console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
        var yscale = d3.scaleLinear()
                .domain([miny-ypadding, maxy+ypadding])
                .range([gu.yBot, gu.yTop]);
        var x_axis;
        var x_axisT;
        if(nPlots == 1){
            x_axis = d3.axisBottom().scale(xscale).tickSize(-5.0);
            x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0);
        } else {
            if( c === 0 ){
                x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
                x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0);
            } else {
                if (c == nPm1){
                    x_axis = d3.axisBottom().scale(xscale).tickSize(-5.0);
                    x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
                } else {
                    x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
                    x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
                }
            }
        }

        var y_axis = d3.axisLeft()
            .scale(yscale)
            .ticks(5)
            .tickSize(-5,0);
        var y_axisR = d3.axisRight()
            .ticks(5).scale(yscale).tickSize(-5,0);
            //.tickFormat("");
    
        svg.append("g")
           .attr("transform", "translate(" + gu.xLeft + ", "+ 0.0 + ")")
           .call(y_axis);
    
        svg.append("g")
           .attr("transform", "translate(" + gu.xRight + ", "+ 0.0 + ")")
           .call(y_axisR);
    
        svg.append("g")
                .attr("transform", "translate("+ xmargin +", " + gu.yBot  +")")
                .call(x_axis);
    
        svg.append("g")
           .attr("transform", "translate("+xmargin+", " + gu.yTop + ")")
           .call(x_axisT);
    
//        console.info(" trace after painting axes for : " + cont );
        svg.append("text")
           .attr("transform", "translate("+geo[0].xLeft/3+","+ gu.midY +")rotate(-90)")
           .attr("font-size", "12px")
           .attr("text-anchor", "middle")
           .text(cont );
//           .text(cont + " [" + unit + "]");
//        console.info("double check nSites: " + nSites );
        for (z = 0; z < nSites ; z++){
            site = parts[z];
            color = siteColour[site];
            dName = site + "_" + cont;
//            console.info("Plotting: " + dName + " colour: " + color);
            yData = data[dName];
            timex = siteTime[site];
            nPoints = timex.length;
            for(var j=0; j < nPoints; j++){
                svg.append("g").append("circle")
                .attr("cx", xscale(timex[j]) )
                .attr("cy", yscale(yData[j]) )
                .attr("r", 2)
                .attr("fill", color);
//                .attr("fill", laScale(yData[j]));
    //          .attr("fill", "red");
            }
        }
    }
    activeCanvas[cName] = "code=plotSelected;scaling=" + origScaling+";content="+theContent;
 return;
}

function clearSelected(){
    toGo = Object.keys(wishList);
    nTogo = toGo.length;
    for(var i = 0 ; i < nTogo; i++){
        wlname = toGo[i];
        document.getElementById(toGo[i]).innerHTML = "&nbsp;&nbsp;&nbsp;Add";
    }
    wishList = {};
    console.info("current  wishList: "+ Object.keys(wishList) );
}

function markMe(name){
    leName = name.id;
    but = document.getElementById(leName);
    document.getElementById("wishes").style.visibility = "visible";
    if( wishList[leName] == null){
        console.info("marking LeName "+ leName  + " " + but);
        but.innerHTML = "&nbsp;&nbsp;&nbsp;Del";
        wishList[leName] = 1;
    } else {
//        console.info("removing "+ leName + " from wishList");
        delete wishList[leName];
        but.innerHTML = "&nbsp;&nbsp;&nbsp;Add";
    }
//    console.info("current  wishList "+ Object.keys(wishList) );
}


function drawAllPlots(leMarkers){
//    console.info("About to do: " + toDo + " nMark: " + leMarkers.length);
    if(toDo == "nothing"){
        return;
    }
    preq = toDo.split("|");
    for(i = 0; i < preq.length; i++){
        obt = toObject(preq[i], null, null);
//        console.info("Trying to generate: " + preq[i]);
//        console.info("Code = ", obt.code);
        switch(obt.code){
            case "makePlot1":
//                console.info(obt.code + " operational");
                makePlot1(null, preq[i], null);
                break;
            case "makePlots":
 //               console.info(obt.code + " operational");
                makePlots(null, preq[i], null);
                break;
            case "plotSelected":
//                console.info(obt.code + " operational");
                plotSelected(preq[i]);
                break;
            case "multiPlot":
                multiPlot(preq[i] );
                break;
            default:
                console.info(obt.code + " not implemented yet");
                break;
        }
    }
}

/*
 *  This function should not depend on the event or the input-id. 
 *  This should be left to each of the plotting routines to decide what to do
 *  with the inforation.
function toObject(ss, nam, eva){
 */
function toObject(jason){
    pairs = jason.split(";");
    var obi = {};
    for(var p = 0; p < pairs.length; p++){
        kv = pairs[p].split("=");
        obi[kv[0]] = kv[1];
    }
    /*
    switch(obi.nature){
        case ("click"):
            parts = nam.name.split("_");
            console.info("case click: " +nam.name + " " +  parts[0] + "  " + parts[1]);
            obi["siteID"] = parts[0];
            obi["mcomp"] = parts[1];
            obi["cName"] = nam.name;
            obi["dName"] = nam.name;
            obi["xPos"] = eva.clientX + gOffsetX;
            obi["yPos"] = eva.clientY;
            obi["zx"] = zindex;
            zindex++;
            gOffsetX += 20;
            break;
        case ("zoom"):
            parts = obi["cName"].split("_");
            parts.shift();
            console.info("case zoom: " + obi.cName + " " +  parts[0] + "  " + parts[1]);
            obi["siteID"] = parts[0];
            obi["mcomp"] = parts[1];
            obi["dName"] = parts[0] + "_" + parts[1];
//            obi["zx"] 
            break;
        case ("alive"):
            console.info("case alive");
            cont = obi.content.split(",");
            parts = cont[0].split("_");
            obi["siteID"] = parts[0];
            obi["mcomp"] = parts[1];
            obi["dName"] = parts[0] + "_" + parts[1];
            ok = Object.keys(obi);
            for(p = 0 ; p < ok.length; p++){
                ko = ok[p];
                console.info("Alive["+ko+ "] = " + obi[ko]);
            }
            break;
    }
    */
    return(obi);
}

function makePlot1(name, jason, eve){
// console.info("firstArg "+ name );
//    console.info("makePlot1's jason: "+ jason );
    caps = toObject(jason);
    scaling = caps.scaling;
//    console.dir(caps);

    natura = caps.nature;
    switch(natura){
        case ("click"):
            parts = name.name.split("_");
//            console.info("markPlot1 click: " +name.name + " " +  parts[0] + "  " + parts[1]);
            msiteID = parts[0];
            mcomp = parts[1];
            xPos = eve.clientX + gOffsetX;
            yPos = eve.clientY;
            caps["zx"] = zindex;
            zindex++;
            gOffsetX += 20;
            break;
        case ("zoom"):
            parts = caps["cName"].split("_");
            parts.shift();
//            console.info("markPlot1 zoom: " + caps.cName + " " +  parts[0] + "  " + parts[1]);
            msiteID = parts[0];
            mcomp = parts[1];
            zindex = caps["zx"];
            break;
        case ("alive"):
//            console.info("markPlot1 alive");
            cont = caps.content.split(",");
            parts = cont[0].split("_");
            msiteID = parts[0];
            mcomp = parts[1];
            xPos = caps["xPos"];
            yPos = caps["yPos"];
            zindex = caps["zx"];
            break;
    }
//    console.info("mkPlot1 parts: " + parts);
    dName = msiteID + "_"+ mcomp;
    cName = "makePlot1_"+dName;
//    console.info("Canvas open: : " + cName);
    var location = createDivIfNeeded(cName);
    if(natura === "zoom"){
        xLoc = location.xPos;
        yLoc = location.yPos;
    } else {
        xLoc = xPos;
        yLoc = yPos;
    }
    activeCanvas[cName] = "code=makePlot1;scaling=" + scaling+";content="+dName;
// activeCanvas[cName] = "makePlot1:" + scaling + ":" + dName;
// console.info("Location: " + location.active +  " x: " + location.xPos + " y: " + location.yPos);
    
    tName = msiteID +"_Time";
    tbName = msiteID +"_Time_base";
    timeOffset = Number(data[tbName]);


    uName = mdata[dName].unit;
    uUcd = mdata[dName].ucd;

    cwidth = defWidth * (scaling);
    cheight = defHeight * (scaling);
    frameColour = "black";
 canvas = document.getElementById(cName);
 canvas.style.left = xLoc + "px";
 canvas.style.top  = yLoc + "px";
 canvas.style.position = "absolute";
 canvas.style.visibility = "visible";
    canvas.style.border= "2px solid " + frameColour;
 canvas.style.height = cheight + "px";
 canvas.style.width = cwidth + "px";
 canvas.style.zIndex = caps.zx;
 canvas.style.backgroundColor = "#eeeeee";

 var timex = new Array(data[tName].length);
 for(var i = 0; i < timex.length; i++){
    timex[i] = (data[tName][i] + timeOffset) * 1000.0;
 }

 generateScatter(cName, parts[0], parts[1], uName, uUcd, data[dName], timex, scaling);
}

//    qq = "nature=click;scaling=1";

function makePlots(name, jason, eve){
    caps = toObject(jason);
    scaling = caps.scaling;
// var zoom = map.getZoom();
    natura = caps.nature;
    switch(natura){
        case ("click"):
//            console.info("case click: " +name.name + " " +  parts[0] + "  " + parts[1]);
            siteID = name.name;
            xPos = eve.clientX + gOffsetX;
            yPos = eve.clientY;
            caps["zx"] = zindex;
            zindex++;
            gOffsetX += 20;
            break;
        case ("zoom"):
            siteID = caps.siteID;
            xPos = caps["xPos"];
            yPos = caps["yPos"];
            zindex = caps["zx"];
/*
            parts = caps["cName"].split("_");
            parts.shift();
            console.info("case zoom: " + caps.cName + " " +  parts[0] + "  " + p
arts[1]);
            msiteID = parts[0];
            mcomp = parts[1];
//            obi["dName"] = parts[0] + "_" + parts[1];
*/
            break;
        case ("alive"):
            siteID = caps.siteID;
//            console.info("markPlots alive siteID= " + siteID);
            cont = caps.content.split(",");
            parts = cont[0].split("_");
            msiteID = parts[0];
            mcomp = parts[1];
            xPos = caps["xPos"];
            yPos = caps["yPos"];
            zindex = caps["zx"];
            break;
    }

//    siteID = name.name;
    /*
    console.info("MakePlots LeName "+ siteID + " scaling: " + scaling );
    if(typeof siteID === "undefined"){
//        console.info("LeName "+ alt + " Scaling: " + scaling);
//        parts = alt.replace("canvas_","").split("_");
        leName = alt;
 }
 */

    cName = "makePlots_"+siteID;
    var location = createDivIfNeeded(cName);

    tName = siteID + "_Time";
    tbName = siteID + "_Time_base";
    timeOffset = Number(data[tbName]);

    content = siteContent[siteID];
    units = siteUnits[siteID];
    ucds = siteUCD[siteID];
    nPlots = content.length;
// console.info("Time offset: ", timeOffset);
// console.info("things: "+ nPlots + " " + content);

    if(natura == "zoom"){
//        console.info("natura = " + natura);
        xLoc = location.xPos;
        yLoc = location.yPos;
        yLoc = yPos;
//        console.info("natura = " + natura +  " loc: " + xLoc + ", " + yLoc + " scaling: " + scaling);
    } else {
        xLoc = xPos;
        yLoc = yPos;
//        console.info("natura = " + natura +  " loc: " + xLoc + ", " + yLoc + " scaling: " + scaling);
    }
    /*
 if( location.active === 0){
    xLoc = fullBoxX;
    yLoc = fullBoxY;
 } else {
    xLoc = location.xPos;
    yLoc = location.yPos;
 }
    */

    cWidth = 400 * scaling;
    cHeight = nPlots * 100 * scaling;
    frameColour = "blue";
    canvas = document.getElementById(cName);
    canvas.style.left = xLoc + "px";
    canvas.style.top  = yLoc + "px";
    canvas.style.position = "absolute";
    canvas.style.visibility = "visible";
    canvas.style.border= "2px solid " + frameColour;
    canvas.style.height = cHeight + "px";
    canvas.style.width = cWidth + "px";
    canvas.style.zIndex = zindex;
    canvas.style.backgroundColor = "#eeeeff";
// alert(name.name);

    zindex++;
// canvas.innerHTML = parts[0] + " " +parts[1] + " " + cName + "/"+ tName + " " + data[dName] + "<br>" + data[tName];

// tx = data[tName];
    var timex = new Array(data[tName].length);
    for(var i = 0; i < timex.length; i++){
        timex[i] = (data[tName][i] + timeOffset) * 1000.0;
//    console.info("Time: " + i + ": " + data[tName][i] + ", " + timex[i]);
    }

 geo = plotGeometry(nPlots, cWidth, cHeight, 0);
 mint = d3.min(timex);
 maxt = d3.max(timex);
 xpadding = (maxt - mint)/20.0;
// console.info("X limits-1: " + timex[0] + " " + timex[timex.length-1] );
// console.info("X limits: " + mint + " " + maxt + " " + xpadding);
 canvas.innerHTML = "";
 var svg = d3.select("#"+cName)
                .append("svg")
                .attr("width", cWidth )
                .attr("height", cHeight );
  minDate = new Date(1.0* (mint-xpadding));
  maxDate = new Date(1.0* (maxt+xpadding));
  var mdao = new Date((maxt+mint)/2.0);
  midDate = mdao.getDate()  + "/" + (mdao.getMonth()+1) +  "/" + mdao.getFullYear();
//  console.info("Date range: " + minDate + ", " + maxDate);
//  console.info("Mean date: " + mdao + " " + midDate);

  var xscale = d3.scaleTime()
                    .domain([minDate, maxDate])
                    .range([geo[0].xLeft, geo[0].xRight]);

 nPm1 = nPlots -1;
 nPoints = timex.length;
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", cWidth/2)
       .attr("y", geo[0].yTop).attr("dy","-1.5em")
       .attr("font-size", "14px")
       .attr("text-anchor", "middle")
       .text(siteID);

    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", cWidth/2)
       .attr("y", cHeight).attr("dy","-0.7em")
       .attr("font-size", "12px")
       .attr("text-anchor", "middle")
       .text(midDate);

    origScaling = scaling;
    if(scaling == 1){
        face = "+";
        scaling = maxScale;
    } else {
        face = "-";
        scaling = 1;
    }
    var any = {};
    any.name = siteID;
    any.id = siteID;
//    console.info("Creating any (not amy): "+ any + " " + any.name);
    pTop = height - 24;
    pLeft = width - 24;
    pMidX = width -12;
    pMidY = height -12;
    var capsule = "nature=zoom;scaling=" + scaling + ";siteID=" +siteID;
    svg.append("rect").attr("x", pLeft).attr("y", 0)
        .attr("width","20").attr("height","20")
        .attr("onclick", "hideMe('" + cName +  "')")
        .attr("fill",frameColour);
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("onclick", "hideMe('" + cName +  "')")
       .attr("x", pMidX).attr("y", "12").attr("dy","+0.25em")
       .attr("font-size", "16px").attr("text-anchor", "middle")
       .attr("fill", "white").text("X");
    svg.append("rect")
        .attr("x", pLeft)
        .attr("y", pTop)
        .attr("width","20")
        .attr("height","20")
//        .attr("onclick", "makePlots('" + any + "','" + scaling + "','" + leName + "')")
        .attr("onclick", "makePlots('" + null + "','" + capsule + "','" + null + "')")
        .attr("fill",frameColour);

    svg.append("text")
       .attr("transform", "translate(0,0)")
        .attr("onclick", "makePlots('" + null + "','" + capsule + "','" + null + "')")
//       .attr("onclick", "makePlots('" + any + "','" + scaling + "','" + leName + "')")
       .attr("x", pMidX) // .attr("dx", "-0.5em")
       .attr("y", pMidY).attr("dy","+0.25em")
       .attr("font-size", "16px")
       .attr("text-anchor", "middle")
       .attr("fill", "white")
       .text(face);

 var laScale;
 var theContent = [];
 for (i = 0; i < nPlots ; i++){
    cont = content[i];
    dName = siteID + "_" + cont;
    theContent.push(dName);
    unit = units[i];
    laScale = cScales[ucds[i]];
    gu = geo[i];
//    console.info("Plot " +dName + " " + unit + " " + i + " " +  gu.yTop +  " " +  gu.yBot);
    yData = data[dName];
    miny = d3.min(yData);
    maxy = d3.max(yData);
    ypadding = (maxy - miny)/20.0;
//    console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
    var yscale = d3.scaleLinear()
                   .domain([miny-ypadding, maxy+ypadding])
                   .range([gu.yBot, gu.yTop]);
    var x_axis;
    var x_axisT;
    if( i === 0 ){
        x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
        x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0);
    } else if (i == nPm1){
        x_axis = d3.axisBottom().scale(xscale);
        x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
    } else {
        x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
        x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
    }

    var y_axis = d3.axisLeft()
        .scale(yscale)
        .ticks(5)
        .tickSize(-5,0);
    var y_axisR = d3.axisRight()
        .ticks(5).scale(yscale).tickSize(-5,0);
        //.tickFormat("");
//    var effWidth = width - margin;

    svg.append("g")
       .attr("transform", "translate(" + gu.xLeft + ", "+ 0.0 + ")")
       .call(y_axis);

    svg.append("g")
       .attr("transform", "translate(" + gu.xRight + ", "+ 0.0 + ")")
       .call(y_axisR);

    var xmargin = 0.0;
    svg.append("g")
            .attr("transform", "translate("+ xmargin +", " + gu.yBot  +")")
            .call(x_axis);

    svg.append("g")
       .attr("transform", "translate("+xmargin+", " + gu.yTop + ")")
       .call(x_axisT);

    svg.append("text")
       .attr("transform", "translate("+geo[0].xLeft/3+","+ geo[i].midY +")rotate(-90)")
       .attr("font-size", "12px")
       .attr("text-anchor", "middle")
       .text(cont + " [" + unit + "]");


    for(var j=0; j < nPoints; j++){
        svg.append("g").append("circle")
         .attr("cx", xscale(timex[j]) )
         .attr("cy", yscale(yData[j]) )
         .attr("r", 2)
         .attr("fill", laScale(yData[j]));
//         .attr("fill", "red");
  }
 }
    activeCanvas[cName] = "code=makePlots;scaling=" + origScaling+";siteID="+siteID + ";content="+theContent;
 fullBoxX += 10;
 fullBoxY += 10;

 return;
}

function createDivIfNeeded(tag){
    kDoom = document.getElementById(tag);
    var lok = {};
//    console.info("No-0.5, Doom: " + kDoom);
    if ( kDoom == null){
//        console.info("No, body does not contain: " + tag);
        d3.select("body").append("div")
            .attr("id", tag)
            .attr("draggable", true)
            .attr("ondragstart", "drag_start(event)")
            .attr("onclick", "raiseMe('" + tag + "')")
            .attr("ondblclick", "hideMe('" + tag + "')");
        lok.active = 0;
        lok.xPos = -99999;
        lok.yPos = -99999;
        lok.zindex = 1000;
    } else {
//        console.info("Yes, body contains: " + tag);
        lok.active = 1;
        lok.zindex = kDoom.style.zindex;
        lefto = kDoom.style.left;
        topo = kDoom.style.top;
        lok.xPos = lefto.replace("px","");
// canvas.style.left = xLoc + "px";
// canvas.style.top  = yLoc + "px";
        lok.yPos = topo.replace("px","");
//        console.info("lok: " + location.active + " " + lok.xPos + " " + lok.yPos);
    }
    return(lok);
}

function generateScatter(canvasID, sensorID, qID, qUnit, qUcd, yData, timex, scaling){
 canvas = document.getElementById(cName);
// console.info("Canvas ID: " + canvasID);
 width = canvas.style.width.replace("px","");
 height = canvas.style.height.replace("px","");
// console.info("Canvas height " + height);
 miny = d3.min(yData);
 maxy = d3.max(yData);
 mint = d3.min(timex);
 maxt = d3.max(timex);
 ypadding = (maxy - miny)/20.0;
 xpadding = (maxt - mint)/20.0;
// console.info("X limits-1: " + timex[0] + " " + timex[timex.length-1] );
// console.info("X limits: " + mint + " " + maxt + " " + xpadding);
// console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
// canvas.innerHTML = sensorID + " " + qID + " " + yData + "<br>" + timex;
 canvas.innerHTML = "";
 var svg = d3.select("#"+canvasID)
                .append("svg")
                .attr("width", width)
                .attr("height", height);
    var margin = 40;
    w_width = Number(width) - 2 * margin
    w_height = Number(height) - 2 * margin

  minDate = new Date(1.0* (mint-xpadding));
  maxDate = new Date(1.0* (maxt+xpadding));
  var mdao = new Date((maxt+mint)/2.0);
//  console.info("Date range: " + minDate + ", " + maxDate);
//  console.info("Mean date: " + mdao );
//  var mda = mdao.split(' ');
//  midDate = mda[2] + " " + mda[1] +  " " + mda[3];
  midDate = mdao.getDate()  + "/" + (mdao.getMonth()+1) +  "/" + mdao.getFullYear();
//  console.info("Mean date: " + midDate );
//  var xscale = d3.scaleLinear()
  var xscale = d3.scaleTime()
                    .domain([minDate, maxDate])
//                   .domain([mint-xpadding, maxt+xpadding])
                    .range([margin, width - margin]);

  var yscale = d3.scaleLinear()
                   .domain([miny-ypadding, maxy+ypadding])
//                   .range([height , margin]);
                   .range([height - margin, margin]);

  var x_axis = d3.axisBottom().scale(xscale);
  var x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");

  var y_axis = d3.axisLeft().scale(yscale).ticks(5).tickSize(-5,0);
//  var y_axis = d3.axisLeft().scale(yscale).tickSize(-5,0);
  var y_axisR = d3.axisRight().scale(yscale).tickSize(-5,0).tickFormat("");
  var effWidth = width - margin;

//    margin = 0.0;
    svg.append("rect").attr("x", margin).attr("y", margin)
        .attr("width",w_width).attr("height",w_height)
        .attr("draggable", true)
        .attr("ondragstart", "zoom_in(event)")
//        .attr("onclick", "hideMe('" + cName +  "')")
        .attr("fill","white");
  svg.append("g")
       .attr("transform", "translate(" + margin + ", "+ 0.0 + ")")
       .call(y_axis);

  svg.append("g")
       .attr("transform", "translate(" + effWidth + ", "+ 0.0 + ")")
       .call(y_axisR);

  var xAxisTranslate = height - margin;

  var xmargin = 0.0;
    svg.append("g")
            .attr("transform", "translate("+xmargin+", " + xAxisTranslate  +")")
            .call(x_axis);

    svg.append("g")
       .attr("transform", "translate("+xmargin+", " + margin + ")")
       .call(x_axisT);

    svg.append("text")
       .attr("transform", "translate("+margin/3+","+ height/2 +")rotate(-90)")
       .attr("font-size", "12px")
       .attr("text-anchor", "middle")
       .text(qID + " [" + qUnit + "]");

    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", width/2)
       .attr("y", margin).attr("dy","-0.5em")
       .attr("font-size", "14px")
       .attr("text-anchor", "middle")
       .text(qID + " v Time. " + sensorID);

    if(scaling == 1){
        face = "+";
        scaling = maxScale;
    } else {
        face = "-";
        scaling = 1;
    }
    var any = {};
    any.name = canvasID;
    any.id = canvasID;
//    console.info("Creating any (not amy): "+ any + " " + any.name);
    pTop = height - 24;
    pLeft = width - 24;
    pMidX = width -12;
    pMidY = height -12;
    svg.append("rect").attr("x", pLeft).attr("y", 0)
        .attr("width","20").attr("height","20")
        .attr("onclick", "hideMe('" + cName +  "')")
        .attr("fill",frameColour);
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("onclick", "hideMe('" + cName +  "')")
       .attr("x", pMidX).attr("y", "12").attr("dy","+0.25em")
       .attr("font-size", "16px").attr("text-anchor", "middle")
       .attr("fill", "white").text("X");
    var capsule = "nature=zoom;scaling=" + scaling + ";cName=" +canvasID;
    svg.append("rect")
        .attr("x", pLeft)
        .attr("y", pTop)
        .attr("width","20")
        .attr("height","20")
//        .attr("onclick", "makePlot1('" + any + "','" + scaling + "','" + canvasID + "','" + capsule + "')")
        .attr("onclick", "makePlot1('" + any + "','" + capsule + "','" + null + "')")
        .attr("fill",frameColour);

    svg.append("text")
       .attr("transform", "translate(0,0)")
//       .attr("onclick", "makePlot1('" + any + "','" + scaling + "','" + canvasID + "','" + capsule + "')")
        .attr("onclick", "makePlot1('" + any + "','" + capsule + "','" + any + "')")
       .attr("x", pMidX) // .attr("dx", "-0.5em")
       .attr("y", pMidY).attr("dy","+0.25em")
       .attr("font-size", "16px")
       .attr("text-anchor", "middle")
       .attr("fill", "white")
       .text(face);

    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", width/2)
       .attr("y", height).attr("dy","-0.7em")
       .attr("font-size", "12px")
       .attr("text-anchor", "middle")
       .text(midDate);
//       .text("Time [s]");

  nPoints = timex.length;
//  console.info("qUcd = " + qUcd + " " + cScales[qUcd]);
  var laScale = cScales[qUcd];
  for(var i=0; i < nPoints; i++){
        svg.append("g").append("circle")
         .attr("cx", xscale(timex[i]) )
         .attr("cy", yscale(yData[i]) )
         .attr("r", 3)
         .attr("fill", laScale(yData[i]));
//         .attr("fill", cScales[qUcd](yData[i]));
//         .attr("fill", "red");
  }


}

// returns an object with nPlots objects which contain the location of each
// plot.
function plotGeometry(nPlots, swidth, sheight, xRoom){
//    console.info("plotGeo args: " + nPlots + " " + sheight  + " " + swidth);
    height = Number(sheight);
    width = Number(swidth);
//    console.info("plotGeo args: " + nPlots + " " + height  + " " + width);
    var xmargin = width * 0.08;
    if(xmargin < 40){ xmargin = 40; }
    ymarginTop = height*0.08;
    if(ymarginTop < 40){ ymarginTop = 40; }
    ymarginBottom = ymarginTop;
    ymarginTop += xRoom;
    spacing = ymarginTop/5;
    availableRoom = height - ymarginTop - ymarginBottom - (nPlots-1)*spacing;
    plotHeight = Math.floor(availableRoom/nPlots);
    xLeft = xmargin;
    xRight = width - xmargin;
    xWidth = width - xmargin - xmargin;

    firstYtop = ymarginTop;
    firstYbot = firstYtop + plotHeight;
    var geometry = [];
    for (var i = 0; i < nPlots; i++){
        var ig = {};
        ig.xLeft = xLeft;
        ig.xRight = xRight;
        ig.width = xWidth;
        ig.yTop = firstYtop;
        ig.yBot = firstYbot;
        ig.midY = (ig.yTop + ig.yBot)/2.0;
        geometry.push(ig);
        firstYtop = firstYbot + spacing;
        firstYbot = firstYtop + plotHeight;
    }
    return(geometry);
}

var temperatureScale = d3.scaleLinear()
                   .domain([-20.0, 40.0])
                   .range([1.0, 0.0]);

var relativeHumidityScale = d3.scaleLinear()
                   .domain([0.0, 100.0])
                   .range([0.0, 1.0]);

var noiseScale = d3.scaleLinear()
                   .domain([45.0, 80.0])
                   .range([0.0, 1.0]);

var noScale = d3.scaleLinear()
                   .domain([0.0, 200.0])
                   .range([0.4, 1.0]);

var no2Scale = d3.scaleLinear()
                   .domain([0.0, 70.0])
                   .range([0.0, 1.0]);

var defScale = d3.scaleLinear()
                   .domain([0.0, 200.0])
                   .range([0.0, 1.0]);

function tempScale(temp) {
    ct = d3.interpolateRainbow( temperatureScale(temp));
    return (ct);
}

function relHumScale(rh) {
    ct =  d3.interpolateSpectral( relativeHumidityScale(rh) ) ;
    return ( ct );
}

function defaultScale(val) {
    ct = d3.interpolateGreys( defScale(val) );
    return ( ct );
}

function noisyScale(val) {
    ct =  d3.interpolateReds( noiseScale(val) );
    return ( ct );
}

function no_Scale(val) {
    return ( d3.interpolateBuPu( noScale(val) ) );
}

function no2_Scale(val) {
    return ( d3.interpolateYlOrBr( no2Scale(val) ) );
}

var coScale = d3.scaleLinear()
                   .domain([0.0, 0.8])
                   .range([0.2, 1.0]);

function co_Scale(val) {
    return ( d3.interpolateYlGn( coScale(val) ) );
}

var cScales = {};
cScales.METxTEMP = tempScale;
cScales.METxRH = relHumScale;
cScales.AQxNOISE = noisyScale;
cScales.AQxNO = no_Scale;
cScales.AQxNO2 = no2_Scale;
cScales.AQxCO = co_Scale;

