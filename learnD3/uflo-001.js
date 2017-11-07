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

function textSize(text) {
    if (!d3) return;
    var container = d3.select('body').append('svg');
    container.append('text')
                .attr("x", -99999)
                .attr("y", -99999)
                .attr("font-size", "12px")
                .text(text);
    var size = container.node().getBBox();
    container.remove();
    return { width: size.width, height: size.height };
}


function plotSelected(){
    things = Object.keys(wishList);
    console.info("wishList to plot: "+ things );
    var qToPlot = {};
    var siteColour = {};
    for(var i = 0; i < things.length; i++){
        parts = things[i].split("_");
        console.info("Dealing with: " + things[i] + " " + parts);
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
    for(var i = 0; i < content.length; i++){
        cle = content[i];
        console.info("For " + cle + " I need: " + qToPlot[cle]);
    }
    nPlots = content.length;
    console.info("Number of plots needed: " + nPlots);
    var minTime = [];
    var maxTime = [];
    var siteTime = {};
    nAllSites = sites.length;
    frac = 1./(nAllSites+0);
    for(var i = 0; i < sites.length; i++){
        site = sites[i];
        console.info("Site: "+  site);
        siteColour[site] = d3.interpolateRainbow( i* frac);
        console.info("Colour: " + site + " " + siteColour[site] + " " +(i*frac));
        tName = site + "_Time";
        tbName = site + "_Time_base";
        timeOffset = Number(data[tbName]);

        var timex = new Array(data[tName].length);
        for(var t = 0; t < timex.length; t++){
           timex[t] = (data[tName][t] + timeOffset) * 1000.;
        }
        siteTime[site] = timex;
        minTime.push( d3.min(timex) );
        maxTime.push( d3.max(timex) );
    }
    mint = d3.min(minTime);
    maxt = d3.max(maxTime);
    cName = "canvas_Multi" + mindex;
    mindex++;
    createDivIfNeeded(cName);
    console.info("Pallete: " + siteColour);
    console.info("Time range: " + mint + " to " + maxt);
    xpadding = (maxt - mint)/20.;
    minDate = new Date(1.0* (mint-xpadding));
    maxDate = new Date(1.0* (maxt+xpadding));
    var mdao = new Date((maxt+mint)/2.0);
    midDate = mdao.getDate()  + " / " + (mdao.getMonth()+1) +  " / " + mdao.getFullYear();
    console.info("Date range: " + minDate + ", " + maxDate);
    console.info("Mean date: " + mdao + " " + midDate);


    xLoc = fullBoxX;
    yLoc = fullBoxY;
    cWidth = 400;
    cHeight = 80 + nPlots * 120 + nAllSites*10;
    canvas = document.getElementById(cName);
    canvas.style.left = xLoc + "px";
    canvas.style.top  = yLoc + "px";
    canvas.style.position = "absolute";
    canvas.style.visibility = "visible";
    canvas.style.border= "2px solid green";
    canvas.style.height = cHeight + "px";
    canvas.style.width = cWidth + "px";
    canvas.style.zIndex = zindex;
    canvas.style.backgroundColor = "#eeffee";
    geo1 = plotGeometry(nPlots, cWidth, cHeight, 0);
    zindex++;


    console.info("things: "+ nPlots + " " + content);

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

    var xmargin = 0.;
    nPm1 = nPlots -1;
    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", cWidth/2)
       .attr("y", 0).attr("dy","1.5em")
       .attr("font-size", "14px")
       .attr("text-anchor", "middle")
       .text("Customised Charts for " + midDate);

    tlabel = sites[0];
    var nSitesPerLine = [];
    maxWidth = geo1[0].width;
    accountedSites = 0;
    for(var x = 1; x < nAllSites; x++){
        site = sites[x];
        try1 = tlabel + " " + site;
        console.info("tlabel:" + tlabel + " try: " + try1);
        tw = textSize(try1);
        console.info("width(" + try1 + ") = " + tw.width +"/" + maxWidth);
        if(tw.width > maxWidth){
            console.info("Oops, it doesn't fit. do use " + tlabel);
            nsitios =  tlabel.split(" ").length ;
            nSitesPerLine.push( nsitios );
            accountedSites += nsitios;
            tlabel = site;
        } else {
            console.info("AOK for " + try1);
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
        console.info("putting " + npl + " sites in line " + l);
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

    for (var c = 0; c < nPlots ; c++){
        gu = geo[c];
        cont = content[c];
        parts = qToPlot[cont].split(" ");
        nSites = parts.length;
        console.info("For " + cont + " I need: " + nSites + " " + parts);
        minVal = [];
        maxVal = [];
        for (var z = 0; z < nSites ; z++){
            dName = parts[z] + "_" + cont;
            console.info("addressing: " + dName);
            minVal.push( d3.min(data[dName]) );
            maxVal.push( d3.max(data[dName]) );
        }
        miny = d3.min(minVal);
        maxy = d3.max(maxVal);
        console.info("Extreme for : " + cont + " " + miny + " , " + maxy);

        // In conditions to draw the frame after defining the scales
        ypadding = (maxy - miny)/20.;
        console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
        var yscale = d3.scaleLinear()
                .domain([miny-ypadding, maxy+ypadding])
                .range([gu.yBot, gu.yTop]);
        var x_axis;
        var x_axisT;
        if( c == 0 ){
            x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
            x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0);
        } else if (c == nPm1){
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
    
        svg.append("g")
           .attr("transform", "translate(" + gu.xLeft + ", "+ 0.0 + ")")
           .call(y_axis);
    
        svg.append("g")
           .attr("transform", "translate(" + gu.xRight + ", "+ 0.0 + ")")
           .call(y_axisR);
    
        svg.append("g")
                .attr("transform", "translate("+ xmargin +", " + gu.yBot  +")")
                .call(x_axis)
    
        svg.append("g")
           .attr("transform", "translate("+xmargin+", " + gu.yTop + ")")
           .call(x_axisT);
    
        console.info(" trace after painting axes for : " + cont );
        svg.append("text")
           .attr("transform", "translate("+geo[0].xLeft/3+","+ gu.midY +")rotate(-90)")
           .attr("font-size", "12px")
           .attr("text-anchor", "middle")
           .text(cont );
//           .text(cont + " [" + unit + "]");
        console.info("double check nSites: " + nSites );
        for (var z = 0; z < nSites ; z++){
            site = parts[z];
            color = siteColour[site];
            dName = site + "_" + cont;
            console.info("Plotting: " + dName + " colour: " + color);
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
 return;
// var laScale;
 nPoints = timex.length;
// units = siteUnits[leName];
// ucds = siteUCD[leName];
// for (var i = 0; i < nPlots ; i++){
//    cont = content[i];
//    dName = leName + "_" + cont;
//    unit = units[i];
//    laScale = cScales[ucds[i]];
//    gu = geo[i];
//    console.info("Plot " +dName + " " + unit + " " + i + " " +  gu.yTop +  " " +  gu.yBot);
//    yData = data[dName];
//    miny = d3.min(yData);
//    maxy = d3.max(yData);
//    ypadding = (maxy - miny)/20.;
//    console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
//    var yscale = d3.scaleLinear()
//                   .domain([miny-ypadding, maxy+ypadding])
//                   .range([gu.yBot, gu.yTop]);
//    var x_axis;
//    var x_axisT;
//    if( i == 0 ){
//        x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
//        x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0);
//    } else if (i == nPm1){
//        x_axis = d3.axisBottom().scale(xscale);
//        x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
//    } else {
//        x_axis = d3.axisBottom().scale(xscale).tickSize(-5,0).tickFormat("");
//        x_axisT = d3.axisTop().scale(xscale).tickSize(-5,0).tickFormat("");
//    }
//
//    var y_axis = d3.axisLeft()
//        .scale(yscale)
//        .ticks(5)
//        .tickSize(-5,0);
//    var y_axisR = d3.axisRight()
//        .ticks(5).scale(yscale).tickSize(-5,0);
//        //.tickFormat("");
////    var effWidth = width - margin;
//
//    svg.append("g")
//       .attr("transform", "translate(" + gu.xLeft + ", "+ 0.0 + ")")
//       .call(y_axis);
//
//    svg.append("g")
//       .attr("transform", "translate(" + gu.xRight + ", "+ 0.0 + ")")
//       .call(y_axisR);
//
//    var xmargin = 0.;
//    svg.append("g")
//            .attr("transform", "translate("+ xmargin +", " + gu.yBot  +")")
//            .call(x_axis)
//
//    svg.append("g")
//       .attr("transform", "translate("+xmargin+", " + gu.yTop + ")")
//       .call(x_axisT);
//
//    svg.append("text")
//       .attr("transform", "translate("+geo[0].xLeft/3+","+ geo[i].midY +")rotate(-90)")
//       .attr("font-size", "12px")
//       .attr("text-anchor", "middle")
//       .text(cont + " [" + unit + "]");
//
//
//    for(var j=0; j < nPoints; j++){
//        svg.append("g").append("circle")
//         .attr("cx", xscale(timex[j]) )
//         .attr("cy", yscale(yData[j]) )
//         .attr("r", 2)
//         .attr("fill", laScale(yData[j]));
////         .attr("fill", "red");
//  }
// }
// fullBoxX += 10;
// fullBoxY += 10;
}

function clearSelected(){
    wishList = {};
    console.info("current  wishList: "+ Object.keys(wishList) );
}

function markMe(name, eventual){
    leName = name.name;
     document.getElementById("wishes").style.visibility = "visible";
    if( wishList[leName] == null){
        console.info("marking LeName "+ leName );
        wishList[leName] = 1;
    } else {
//        console.info("removing "+ leName + " from wishList");
        delete wishList[leName];
    }
//    console.info("current  wishList "+ Object.keys(wishList) );
}

function makePlot1(name, eventual){
 var zoom = map.getZoom();
 leName = name.name;
 console.info("LeName "+ leName );
 parts = leName.split("_");

 dName = parts[0]+"_"+parts[1];
 cName = "canvas_"+dName;
 createDivIfNeeded(cName);

 tName = parts[0]+"_Time";
 tbName = parts[0]+"_Time_base";
 timeOffset = Number(data[tbName]);
 console.info("Time offset: ", timeOffset);
// uName = parts[2];
// uUcd = parts[3];
 uName = mdata[dName].unit;
 uUcd = mdata[dName].ucd;
 xLoc = Number(parts[2]) + offsetX[ parts[1] ] + 30;
 yLoc = Number(parts[3]) + offsetY[ parts[1] ] - divH - 30;

 canvas = document.getElementById(cName);
 canvas.style.left = xLoc + "px";
 canvas.style.top  = yLoc + "px";
 canvas.style.position = "absolute";
 canvas.style.visibility = "visible";
 canvas.style.border= "2px solid black";
 canvas.style.height = "150px";
 canvas.style.width = "450px";
 canvas.style.zIndex = zindex;
 canvas.style.backgroundColor = "#eeeeee";
// alert(name.name);

    zindex++;
// canvas.innerHTML = parts[0] + " " +parts[1] + " " + cName + "/"+ tName + " " + data[dName] + "<br>" + data[tName];

// tx = data[tName];
 var timex = new Array(data[tName].length);
 for(var i = 0; i < timex.length; i++){
    timex[i] = (data[tName][i] + timeOffset) * 1000.;
//    console.info("Time: " + i + ": " + data[tName][i] + ", " + timex[i]);
 }

 geo = plotGeometry(3, 500, 200, 0);
 for (var i = 0; i < 3 ; i++){
    gu = geo[i];
    console.info("Plot " + i + " " +  gu.yTop +  " " +  gu.yBot);
 }

 generateScatter(cName, parts[0], parts[1], uName, uUcd, data[dName], timex);
}

function makePlots(name, eventual){
 var zoom = map.getZoom();
 leName = name.name;
 console.info("MakePlots LeName "+ leName );
 parts = leName.split("_");

 cName = "canvas_"+leName;
 createDivIfNeeded(cName);

 tName = leName + "_Time";
 tbName = leName + "_Time_base";
 timeOffset = Number(data[tbName]);

 content = siteContent[leName];
 units = siteUnits[leName];
 ucds = siteUCD[leName];
 nPlots = content.length;
 console.info("Time offset: ", timeOffset);
 console.info("things: "+ nPlots + " " + content);

 xLoc = fullBoxX;
 yLoc = fullBoxY;
 cWidth = 400;
 cHeight = nPlots * 100;
 canvas = document.getElementById(cName);
 canvas.style.left = xLoc + "px";
 canvas.style.top  = yLoc + "px";
 canvas.style.position = "absolute";
 canvas.style.visibility = "visible";
 canvas.style.border= "2px solid blue";
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
    timex[i] = (data[tName][i] + timeOffset) * 1000.;
//    console.info("Time: " + i + ": " + data[tName][i] + ", " + timex[i]);
 }

 geo = plotGeometry(nPlots, cWidth, cHeight, 0);
 mint = d3.min(timex);
 maxt = d3.max(timex);
 xpadding = (maxt - mint)/20.;
 console.info("X limits-1: " + timex[0] + " " + timex[timex.length-1] );
 console.info("X limits: " + mint + " " + maxt + " " + xpadding);
 canvas.innerHTML = "";
 var svg = d3.select("#"+cName)
                .append("svg")
                .attr("width", cWidth)
                .attr("height", cHeight);
  minDate = new Date(1.0* (mint-xpadding));
  maxDate = new Date(1.0* (maxt+xpadding));
  var mdao = new Date((maxt+mint)/2.0);
  midDate = mdao.getDate()  + "/" + (mdao.getMonth()+1) +  "/" + mdao.getFullYear();
  console.info("Date range: " + minDate + ", " + maxDate);
  console.info("Mean date: " + mdao + " " + midDate);

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
       .text(leName)

    svg.append("text")
       .attr("transform", "translate(0,0)")
       .attr("x", cWidth/2)
       .attr("y", cHeight).attr("dy","-0.7em")
       .attr("font-size", "12px")
       .attr("text-anchor", "middle")
       .text(midDate);
 var laScale;
 for (var i = 0; i < nPlots ; i++){
    cont = content[i];
    dName = leName + "_" + cont;
    unit = units[i];
    laScale = cScales[ucds[i]];
    gu = geo[i];
    console.info("Plot " +dName + " " + unit + " " + i + " " +  gu.yTop +  " " +  gu.yBot);
    yData = data[dName];
    miny = d3.min(yData);
    maxy = d3.max(yData);
    ypadding = (maxy - miny)/20.;
    console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
    var yscale = d3.scaleLinear()
                   .domain([miny-ypadding, maxy+ypadding])
                   .range([gu.yBot, gu.yTop]);
    var x_axis;
    var x_axisT;
    if( i == 0 ){
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

    var xmargin = 0.;
    svg.append("g")
            .attr("transform", "translate("+ xmargin +", " + gu.yBot  +")")
            .call(x_axis)

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
 fullBoxX += 10;
 fullBoxY += 10;

 return;
}

function createDivIfNeeded(tag){
    kDoom = document.getElementById(tag);
    console.info("No-0.5, Doom: " + kDoom);
    if ( kDoom == null){
        console.info("No, body does not contain: " + tag);
        d3.select("body").append("div")
            .attr("id", tag)
            .attr("draggable", true)
            .attr("ondragstart", "drag_start(event)")
            .attr("onclick", "raiseMe('" + tag + "')")
            .attr("ondblclick", "hideMe('" + tag + "')")
        kDuomo = document.getElementById(tag);
        console.info("No-1.5, Duomo: " + kDuomo);
        if ( kDuomo == null){
            console.info("No-2, body does not contain: " + tag);
        } else {
            console.info("Yes-2, body contains: " + tag);
            console.info("result-2: " + kDuomo);
        }
    } else {
        console.info("Yes, body contains: " + tag);
        console.info("result: " + kDoom);
    }
}

function generateScatter(canvasID, sensorID, qID, qUnit, qUcd, yData, timex){
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
 console.info("X limits-1: " + timex[0] + " " + timex[timex.length-1] );
 console.info("X limits: " + mint + " " + maxt + " " + xpadding);
 console.info("Y limits: " + miny + " " + maxy + " " + ypadding);
// canvas.innerHTML = sensorID + " " + qID + " " + yData + "<br>" + timex;
 canvas.innerHTML = "";
 var svg = d3.select("#"+canvasID)
                .append("svg")
                .attr("width", width)
                .attr("height", height);
  var margin = 40;

  minDate = new Date(1.0* (mint-xpadding));
  maxDate = new Date(1.0* (maxt+xpadding));
  var mdao = new Date((maxt+mint)/2.0);
  console.info("Date range: " + minDate + ", " + maxDate);
  console.info("Mean date: " + mdao );
//  var mda = mdao.split(' ');
//  midDate = mda[2] + " " + mda[1] +  " " + mda[3];
  midDate = mdao.getDate()  + "/" + (mdao.getMonth()+1) +  "/" + mdao.getFullYear();
  console.info("Mean date: " + midDate );
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
       .text(qID + " v Time. " + sensorID)

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

//  if(qID == "Temp"){
//    for(var i=0; i < nPoints; i++){
//        svg.append("g").append("circle")
//         .attr("cx", xscale(timex[i]) )
//         .attr("cy", yscale(yData[i]) )
//         .attr("r", 3)
//         .attr("fill", tempScale(yData[i]));
////         .attr("fill", "red");
//    }
//  } else {
//    for(var i=0; i < nPoints; i++){
//        svg.append("g").append("circle")
//         .attr("cx", xscale(timex[i]) )
//         .attr("cy", yscale(yData[i]) )
//         .attr("r", 3)
//         .attr("fill", "red");
//    }
//  }

}

// returns an object with nPlots objects which contain the location of each
// plot.
function plotGeometry(nPlots, swidth, sheight, xRoom){
//    console.info("plotGeo args: " + nPlots + " " + sheight  + " " + swidth);
    height = Number(sheight);
    width = Number(swidth);
    console.info("plotGeo args: " + nPlots + " " + height  + " " + width);
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
        ig.midY = (ig.yTop + ig.yBot)/2.;
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

