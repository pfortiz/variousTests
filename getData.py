#!/usr/bin/python
import numpy as np
from netCDF4 import Dataset
import csv
import cgi
import json
import sys
import cgitb; cgitb.enable() # Optional; for debugging only

uamDatozPath = "/home/uflo/src/datoz18/tools"

sys.path.append(uamDatozPath)

import uamObj
import timeXtras as timex

import uamDefs as ud
import datOz18IO as dzio
io = dzio.methods()

# definitions dealing with where uam data are located:
assetsPath = "/home/uflo/data/assets"

basePath = "/home/uflo/data/datoz18.dbs"

selectable = {}
selectableLc = {}

def pickDataToExtract(args, plots2do):
    kind = args["kind"]
    action = args["action"]
    content = plots2do[0]["content"]
    plotos = []
    axes = {}
    for cont in content:
        parts = cont.split("_")
        nParts = len(parts)
        site = parts[0]
        if nParts == 3:
            xaxis = parts[1]
            yaxis = parts[2]
            axes[yaxis] = 1
            axes[xaxis] = 1
        elif nParts == 2:
            yaxis = parts[1]
            xaxis = "tempura"
            axes[yaxis] = 1
#            axes[xaxis] = 1
        else:
            xaxis = None
            yaxis = None
        polot = { "site": site, "xaxis":xaxis, "yaxis":yaxis };
        plotos.append(polot)
    print "axes: ",  axes.keys()
    if kind == "multiPlot":
        select = plots2do[0]["quantity"]
    else:
        select = " ".join(x for x in selectableLc[db])
    select = " ".join(x for x in axes.keys() )
    return select, plotos

uamaf = assetsPath + "/assets.db"

print "Content-type: text/html\n\n"
print "Hello Pythony World!<p>\nIncluding cgi and netCDF4 and csv\n"

print "<pre>"

#print __name__
if __name__ == "__main__":
    print "This is main"
    print uamDatozPath
    print uamaf
    arguments = cgi.FieldStorage()
    myargs = {}
    #print "type of argumentos: ", type(arguments.keys())
    for i in sorted(arguments.keys()):
        print i, "=", arguments[i].value, "=", i,  type(i)
        myargs[i] = arguments[i].value
    
    #print arguments["fromYear"].value
    tfrom = "{}-{:02d}-{:02d}T{}".format( myargs["fromYear"],
            int(myargs["fromMonth"]), int(myargs["fromDay"]), myargs["fromTod"]) 
    tto = "{}-{:02d}-{:02d}T{}".format( myargs["toYear"],
            int(myargs["toMonth"]), int(myargs["toDay"]), myargs["toTod"]) 
    
    timeString = "{}:{}".format(tfrom, tto)
    print "from: ", tfrom
    print "to: ", tto
    
    #uamO = uamObj.uamObj(uamaf, None, None, None)
    uamO = uamObj.uamObj(uamaf, None, tfrom, tto)
    print "Extracting plots2do"
    p2do = None
    kind = None
    if "plots2do" in arguments.keys():
        plots2do = arguments["plots2do"].value.replace("'",'"')
        print "plots2do:", plots2do
    
        p2do = json.loads(str(plots2do))
        print "todo: ", p2do
    
    if "kind" in myargs.keys():
        kind = myargs["kind"]
    
    # All elements we got in the query string allow us to extract the necesary
    # information from the database
    # However, from the database we extract by sensorID, not siteID, ergo, we
    
    # require to use uam in order to understand, on a daily basis, which
    # sensors need to be attached to a given site during that time. This is not
    # a functionality which exists in uam at the moment, so it would be quite
    # good to be able to develop it.
    
    # The other desirable feature would be to convert uam into a
    # pack/library so that we could call things up from this script instead of
    # having to issue a system call, and so, recover information in arrays and
    # dictionaries rather than having to decode strings.
    
    # print "\nSITES: ", ud.SITES
    print ud.time_offset
    print ud.apocalypse
    print uamO.gDict
    print uamO.lcDict
    
    import uam_m as uamm
    
    #uamm.get_Dict(uamO.gDict)
    pairs =  uamO.gDict["pairs"]
    sensors =  uamO.gDict["sensors"]
    for pair in pairs.keys():
        print "Pair: ", pair, pairs[pair]
        aktive = uamm.getPairActivity(pairs[pair][ud.HISTORY], pair)
        print "pairActivity: ", aktive
    
    time1 = uamO.limits[0][0] - uamO.tOffset
    time2 = uamO.limits[0][1] - uamO.tOffset
    print "Unix period of interest:", time1 , time2
    windows = [ [time1, time2], [time1+86400*7, time2+86400*7] ]
    windows = [ [time1, time2] ]
    
    pairActivity = {}
    siteActivity = {}
    uamm.getActivity(pairs, windows, pairActivity, siteActivity)
    
    for key in pairActivity.keys():
        dbhandle = sensors[key][ud.DBHANDLE]
        if dbhandle not in selectable.keys():
            selectable[dbhandle] = {}
            selectableLc[dbhandle] = {}
        for detector in sensors[key][ud.LISTOFDETECTORZ]:
            selectable[dbhandle][detector] = 1
            selectableLc[dbhandle][detector.lower()] = 1
        print key, pairActivity[key], sensors[key][ud.DBHANDLE], sensors[key][ud.LISTOFDETECTORZ]

    for key in siteActivity.keys():
#        dbhandle = sensors[key][ud.DBHANDLE]
#        if dbhandle not in selectable.keys():
#            selectable[dbhandle] = {}
#            selectableLc[dbhandle] = {}
#        for detector in sensors[key][ud.LISTOFDETECTORZ]:
#            selectable[dbhandle][detector] = 1
#            selectableLc[dbhandle][detector.lower()] = 1
        print key, siteActivity[key]
    
    print "Selectable: ", selectable
    print "SelectableLc: ", selectableLc
    
    registry = io.getRegistry(basePath)
    
    print "Registry:", registry
    for family in registry["databases"]:
        print "Familien:", family, registry[family]
    
    datozVars = {}
    tempura = {}
    idMain = {}
    queries = []
    for db in selectable:
        av = registry[db]["allVariableNames"]
        lesVars = registry[db]["theVars"]
        for fk in registry[db].keys():
            print "Famiglia: ", db, fk
        print "Familia: ", db, lesVars
        print "Familie: ", db, av
        nuid = 0
        for var in lesVars.keys():
            ucd = lesVars[var]["UCD"]
            if ucd == "ID_MAIN":
                idMain[db] = var
                mainId = var
                print "Variable for mainId: ", var, ucd
                nuid += 1
    
        kronos = registry[db]["database.time-stamp-name"]
        tempura[db] = kronos
        datozVars[db] = [x.lower() for x in av]
        select, plots2gen = pickDataToExtract(myargs, p2do)
        # select = " ".join(x for x in selectableLc[db])
        
        print "Ready to launch data recovery for ", db
        query = "from {} select {} {} {} where {} in {}".format(db, mainId,
                    kronos, select, kronos, timeString)
        queries.append(query)
        print "Query", query
    
    print "Familia: ", datozVars
    print "Tempura: ", tempura
    print "mainId: ", idMain
    print "Queries", queries
    print "Plots2gen: ", kind
    for p2g in plots2gen:
        print p2g
#    for table in 
