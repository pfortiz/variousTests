#! /usr/bin/env python

# Script to deal with the definition of assets (sites and sensors) in the
# Urban Flows Observatory, Sheffield.
#
# This code should help to build the database (command line oriented)
# It should also be capable to retrieve the state of all the assets at a
# certain time. This is the information which shall be fed to the
# web-interface for any particular point in the time-line.


# variables:
# siteId (char array)
# sensorId (integer)
# timeStamp (integer)
# Carbon Monoxide
# Nitric Oxide
# Nitrogen Dioxide
# Relative Humidity
# Temperature
# Battery
# Noise

# string timestamp not incorporated into binary file.
#
#UoS_AJ_702 100702 2016/10/30T00:05:08 1477782308 0.61 1.43 30.04 81.70 12.60 3.55 57.00
# as well as trying to get the content of an url into a file using urllib
from numpy import array
import numpy as np
import os
import sys
import time
import json
#import urllib
import csv

#
# This script is meant to be in the examples repository. 
#
# The next statement needs to be changed if it is copied somewhere else and
# the correct path to plotopy has to be provided.

plotopyPath = os.environ['PLOTOPY']
sys.path.append(plotopyPath)


import timeXtras  as tx

#print plotopyPath
import time
import datetime

ctime =  time.time()

#print ctime
alora = str(datetime.datetime.now())
dt = alora.split()
laDate = int(dt[0].replace("-", ""))
hms = dt[1].split(":")
leTime = int(hms[0])/24.0 + float(hms[1])/1440. + float(hms[2])/86400;
#print "date", dt[0], laDate, " time ", dt[1], " fod", leTime
stamp = "{:.6f}".format(laDate + leTime)
#print "Stampo : ", stamp
epoch = datetime.datetime(1970, 1, 1)
#print "epoch = " , epoch
assetsFile = "/Users/Shared/ufloTables/assets.db"

def histoire(hstamp, action, key, value):
    hist = {}
#    hist["hrStamp"] = hstamp
    # hist["stamp"] = stime2utime(hstamp)
    if not hstamp is None:
        hist["stamp"] = time.mktime(datetime.datetime.strptime(hstamp, "%d/%m/%Y").timetuple())
    hist["logTime"] = time.time()
#    hist["hrLogTime"] = str(datetime.datetime.now())
    hist["action"] = action
    hist[key] = value
    return hist

handles = {
        "siteid" : "site ID",
        "address" : "Street Address",
        "lon" : "longitude [deg]",
        "lat" : "latitude [deg]",
        "hag" : "Height above ground [m]",
        "hasl" : "height above sea level [m]",
        "zip" : "Postal Code",
        "city" : "City",
        "country" : "Country",
        "firstdate" : "Start Date DD/MM/YYYY",
        "operator" : "Operated by",
        "sensorid" : "Sensor ID",

        "provider" : "Sensor provider name",
        "nquantities" : "Number of quantities measured",
        "qname" : "Quantity measured",
        "qunits" : "Quantity units",
        "quncertainty" : "Quantity uncertainty",
        "qucd" : "Quantity associated UCD",
        "serialnumber" : "Sensor serial number",

        "ifilename" : "Input file name",
}



actions = ["addSite", "addSitesFromFile",
            "addSensor", "addSensorsFromFile",
            "attachSensorToSite", "detachSensorFromSite",
            "examineSensorSite",
            "addMaintenance", "terminate"];

actionsHelp = {
    "addSite": "\n\t Add a site by hand",
    "addSitesFromFile": "<filename>\n\t Add a list of sites from a file",
    "addSensor": "\n\t Add a sensor by hand",
    "addSensorsFromFile": "<filename> \n\t Add a list of sensors from a file",
    "attachSensorToSite": "<sensorID> <siteID> <date> : \n\tPair a sensor to a site at a given date",
    "detachSensorFromSite": "<sensorID> <siteID> <date>: \n\tDettach a sensor from a site at a given date.",
    "addMaintenance": "<sensorID> \n\t interactive task. Add maintenance records to a sensor",
    "showOperational": "<date> \n\t Show all operational sites/sensors at a given date",
    "showDictionary": "\n\tShow all entries into this database",
    "showHelp": "[<action>]\n\tShow help for an action or in general.",
    "getInputTemplate": "<addsite|addsensor>\n\tCreate a template (in stdout) to enter sensor(site) data from files",
    "examineSensorSite": "<sensorID> <siteID> <date> : \n\t examine information and status for a sensor/site pair at a given date",

    };

arguments = {
    "addsite" : [
        "siteid", "address", "city", "country", "zip", "lon", "lat",
        "hag", "hasl", "firstdate", "operator", "sensorid"
        ],
    "addsitesfromfile" : [
        "ifilename"
        ],
    "addsensorsfromfile" : [
        "ifilename"
        ],
    "addsensor" : [
        "sensorid", "provider",  "firstdate",
        "serialnumber", "siteid", "nquantities", 
        ],
    "quantity" : [
        "qname", "qunits", "quncertainty", "qucd"
        ],
    "showdictionary" : [
        "qname", 
        ],
    "getinputtemplate" : [
        "qname", "qunits", "quncertainty", "qucd"
        ],
    "attachsensortosite" : [ "qucd" ],
    "detachsensorfromsite" : [ "qucd" ],
    "examinesensorsite" : [ "qucd" ],
}

def stime2utime(stime):
    return time.mktime(datetime.datetime.strptime(stime, "%d/%m/%Y").timetuple())

def do_showHelp(fields, gDict, args):
    """
    Function to show help about a given command
    """
    pass

def showSite(site, gDict):
    print "Data for site: ", site
    for k in sorted(gDict["sites"][site].keys()):
        print " {}.{}= {}".format(site, k, gDict["sites"][site][k])

def showSensor(sensor, gDict):
    leSensor = gDict["sensors"][sensor]
    print "Data for sensor: ", sensor 
    for k in sorted(leSensor.keys()): # gDict["sites"][site].keys()):
        if "detectors" in k:
            continue
        if k == "provider":
#            print leSensor[k]
            p = sorted(leSensor[k].keys())
            for e in p:
                f = leSensor[k][e]
                print " {}.{}.{} = {}".format(sensor, k, e, f)
            pass
        else:
            print " {}.{}= {}".format(sensor, k, leSensor[k])
    for ms in leSensor["listOfDetectors"]:
        qtty = leSensor["detectors"][ms]
        print sensor, ms, qtty['unit'], qtty['ucd']

def do_showDictionary(fields, gDict, args):
    """
    Function to show the dictionary content
    """
#    dumpclean(gDict)
    if "listOfSites" in gDict:
        sites = gDict["listOfSites"]
        print "List of sites: ", sites
        for site in sites:
            showSite(site, gDict)
        
    if "listOfSensors" in gDict:
        sensors = gDict["listOfSensors"]
        print "List of sensors: ", sensors
        for sensor in sensors:
            showSensor(sensor, gDict)
    pass

def dumpclean(obj):
    if type(obj) == dict:
        for k, v in obj.items():
            if hasattr(v, '__iter__'):
                print k
                dumpclean(v)
            else:
                print '%s : %s' % (k, v)
    elif type(obj) == list:
        print obj
        for v in obj:
            if hasattr(v, '__iter__'):
                dumpclean(v)
            else:
                print v
    else:
        print obj



def do_addSite(fields, gDict, args):
    """
    Function to collect data about a site from stdin
    """
    site = {}
#    print "addSite - Things to extract ", fields
    for f in fields:
        while  True:
            fname = raw_input("\t" + handles[f] + ": ")
            if len(fname) > 0:
                site[f] = fname
                break
#    print "\n\n"
#    print site
    appendSite(site)


def appendSite(site):
    if site["firstdate"] == "today":
        site["firstdate"] =  time.strftime("%d/%m/%Y")
        pass

    sepoch = time.mktime(datetime.datetime.strptime(site["firstdate"], "%d/%m/%Y").timetuple())
    sdft =  site["firstdate"]
#    sdu = str(datetime.datetime(int(sd[2]), int(sd[1]), int(sd[0])))
    sdu = stime2utime(sdft)
#    print "sdu = ", sdu, " utime: ", sepoch
    site["epoch.f"] = sepoch
    site["date.l"] = "01/01/3000"
#    fd =  site["date.l"].split("/")
#    fdu = str(datetime.datetime(int(fd[2]), int(fd[1]), int(fd[0])))
    fdu = stime2utime(site["date.l"])
    site["epoch.l"] = fdu
    site["history"] = []
    stamp = [ sdu , sdft, "activated"]
    site["history"].append(stamp)
    if "operator" in site:
        operator = site["operator"]
        if "|" in operator:
            parts = operator.split("|")
            obi = {}
            for p in parts:
                kv = p.split(":")
                obi[kv[0]] = kv[1]
            site["operator"] = obi
        else:
            site["operator"] = { "id" : operator}
        
    if "sensorid" in site:
        if site["sensorid"] != "-":
            sensors = site["sensorid"].split("|")
            site["sensorid"] = sensors
            site["history"].append([sdu, sdft, "pairedWith", site["sensorid"] ])
#    print site

    sid = site["siteid"]
    if "sites" not in gDict:
        gDict["sites"] = {}
    if "listOfSites" not in gDict:
        gDict["listOfSites"] = []
    if sid in gDict["sites"]:
        msg = "overwriteSite"
    else:
        gDict["listOfSites"].append(sid)
        msg = "addSite"

    gDict["sites"][sid] = site
#    event = [ time.time(), str(datetime.datetime.now()), msg, [sid] ]
    event = histoire(None, msg, "id", sid)
    gDict["log"].append(event)
    print "{} site {}".format(msg,sid)

def do_addSitesFromFile(fields, gDict, args):
    """
    Function to collect data about a site from stdin
    """

    fileName = args[0]
    if not os.path.isfile(fileName):
        print fileName, " does not exist. Quiting"
        sys.exit()


    dfile = open(fileName,"r")
    lines = dfile.read().splitlines()
    dfile.close()
#    print "Number of lines: ", len(lines)
    site = {}
    for line in lines:
        if line != "addsite":
            kv = line.split("=")
            if kv[0] != "sensorid":
                site[kv[0]] = kv[1]
        else:
#            print "Line to split: ", line
#            print "Adding new site"
#            print site
            appendSite(site)

            site = {}

def do_createTemplate(fields, gDict, args):
    """
    Function to create input templates for sensors and sites
    """
    kind = args.pop(0)
    fields = arguments[kind]
#    print "# template for ", kind
    examples = {
        "operator" : "id:xx|contact:xx|tel:xxxyyyyzzz|email:xxx@yyy",
        "provider" : "id:xx|contact:xx|tel:xxxyyyyzzz|email:xxx@yyy",
        "firstdate": "DD/MM/YYYY",
    }
    for f in fields:
        if f == "nquantities":
            for i in range(0,5):
                print "measure=name:xxx|unit:UU|epsilon:x.xx|ucd:ZZ"
            break
        if f in examples:
            print "{}={}".format(f, examples[f])
        else:
            print "{}=".format(f)
    print kind
    sys.exit()

def do_addSensor(fields, gDict, args):
    """
    Function to collect data about a sensor from stdin
    """
    sensor = {}
#    print "addSite - Things to extract ", fields
    for f in fields:
        while  True:
            fname = raw_input("\t" + handles[f] + ": ")
            if len(fname) > 0:
                sensor[f] = fname
                break
    nq = int(sensor["nquantities"])
    quant = {}
    lquant  = []
    print "Enter measured quantities as: name|units|uncertainty|UCD"
    for i in range(0,nq):
        qtty = raw_input("\t quantity" + str(i) + ": ")
        qs = qtty.split("|")
        qN = qs[0]
        qU = qs[1]
        qE = qs[2]
        qZ = qs[3]
        lquant.append(qN)
        obi = { "units" : qU , "uncertainty": qE, "UCD" : qZ, "history": []}

        quant[qN] = obi
        
#    print "\n\n"
#    print sensor

    sensor["detectors"] = quant
    sensor["listOfDetectors"] = lquant
    appendSensor(sensor)

def appendSensor(sensor):
    if sensor["firstdate"] == "today":
        sensor["firstdate"] =  time.strftime("%d/%m/%Y")
        pass

    sepoch = time.mktime(datetime.datetime.strptime(sensor["firstdate"], "%d/%m/%Y").timetuple())
    sdft =  sensor["firstdate"]
#    sdu = str(datetime.datetime(int(sd[2]), int(sd[1]), int(sd[0])))
    sdu = stime2utime(sdft)
#    print "sdu = ", sdu, " utime: ", sepoch
    sensor["epoch.f"] = sepoch
    sensor["date.l"] = "01/01/3000"
#    fd =  sensor["date.l"].split("/")
#    fdu = str(datetime.datetime(int(fd[2]), int(fd[1]), int(fd[0])))
    fdu = stime2utime(sensor["date.l"])
    sensor["epoch.l"] = fdu
    sensor["history"] = []
    stamp = [ sdu , "activated"]
    sensor["history"].append(stamp)

#    if(sensor["siteid"] != "-"):
#    if "siteid" in sensor:
#        if sensor["siteid"] != "-":
#            sensor["history"].append([sdu, sdft, "pairedWith", sensor["siteid"] ])

#    for det in sensor["listOfDetectors"]:
#        print "LOD", type(det), det
#    print "sensor: ", sensor
    lesDetectors = sensor["detectors"]
    for det in sorted(sensor["detectors"].keys()):
#        print type(det), det, lesDetectors[det]
        lesDetectors[det]["history"] = []
#    sys.exit()

    if "provider" in sensor:
        provider = sensor["provider"]
        if "|" in provider:
            parts = provider.split("|")
            obi = {}
            for p in parts:
                kv = p.split(":")
                obi[kv[0]] = kv[1]
            sensor["provider"] = obi
        else:
            sensor["provider"] = { "id" : provider}
#    print sensor

    sid = sensor["sensorid"]
    if "sensors" not in gDict:
        gDict["sensors"] = {}
    if "listOfSensors" not in gDict:
        gDict["listOfSensors"] = []
    if sid in gDict["sensors"]:
        msg = "overwriteSensor"
    else:
        gDict["listOfSensors"].append(sid)
        msg = "addSensor"
    gDict["sensors"][sid] = sensor
#    gDict["listOfSensors"].append(sid)
#    event = [ ctime, str(datetime.datetime.now()), msg, [sid] ]
    event = histoire(None, msg, "id", sid)
    gDict["log"].append(event)

def do_addSensorsFromFile(fields, gDict, args):
    """
    Function to collect data about sensors from a file
    """

    fileName = args[0]
    if not os.path.isfile(fileName):
        print fileName, " does not exist. Quiting"
        sys.exit()


    dfile = open(fileName,"r")
    lines = dfile.read().splitlines()
    dfile.close()
#    print "Number of lines: ", len(lines)
    sensor = {}
    lquant  = []
    quant = {}
    for line in lines:
        if line != "addsensor":
            kv = line.split("=")
            if kv[0] == "siteid":
                continue
            if kv[0] == "measure":
                qs = kv[1].split("|")
                obi = {}
                for qq in qs:
                    qt = qq.split(":")
                    obi[qt[0] ] = qt[1]
#                    print "measure split: ", qt[0], qt[1]
                qN = obi["name"]
                lquant.append(qN)
                quant[qN] = obi
            else:
                sensor[kv[0]] = kv[1]
        else:
#            print "Line to split: ", line
#            print "Adding new sensor"
#            print sensor
#            if "measure" in sensor:
#                qtty = sensor["measure"]
            if "measure" in sensor:
                del sensor["measure"]
            sensor["detectors"] = quant
            sensor["listOfDetectors"] = lquant
            appendSensor(sensor)

            sensor = {}
            lquant  = []
            quant = {}

def do_attachSensorToSite(fields, gDict, args):
    """
    Function to attach a sensor to a site
    """
    if len(args) < 3:
        print "Invalid syntax, try:"
        print execute, "attachSensorsToSite sensorID siteID DD/MM/YYYY"
        sys.exit()
    sensorid = args[0].lower()
    siteid = args[1].lower()
    date = args[2]

    sites = gDict["sites"]
    sensors = gDict["sensors"]
    siteKey = None
    sensorKey = None
    for site in sites.keys():
        sid = sites[site]["siteid"]
        if sid.lower() == siteid:
            print "site", sid, " located"
            siteKey = site
            
    for sensor in sensors.keys():
        sid = sensors[sensor]["sensorid"]
        if sid.lower() == sensorid:
            print "sensor", sid, " located"
            sensorKey = sensor
            
    if sensorKey is None:
        print "Invalid sensor: ", sensorid
    if siteKey is None:
        print "Invalid site: ", siteid
    fdu = stime2utime(date)
    if "pairs" not in gDict:
        gDict["pairs"] = {}
    pairs = gDict["pairs"]
    tag = "{}|{}".format(siteKey, sensorKey)
    print "pairing: ", sensorid, siteid, date, fdu, tag
    if tag not in pairs:
        pairs[tag] = []
    tev = histoire(date,"attach", "status", "on");
#    entry = { "action": "attach", "date": date, "epoch": fdu, "timex":tev}
#    pairs[tag].append(tev)
    insert(tev, pairs[tag])
#    stamp = [ tev["stamp"] , "attached to {}".format(siteKey)]
    gDict["sensors"][sensorKey]["history"].append(stamp)
    detectors = gDict["sensors"][sensorKey]["detectors"]
    for det in detectors.keys():
        detectors[det]["history"].append(tev)


def insert(stamp, aList):
    """
    Function to insert a time stamp defined by "histoire()" into a list of
    these elements so that the list is always time sorted
    """
    nTime = stamp["stamp"]
    lSize = len(aList)
    print "List size", lSize
    if lSize == 0:
        aList.append(stamp)
        end = histoire("01/01/3000","theEnd", "status", "dead")
        aList.append(end)
    else:
        top = lSize - 1
        for i in range(0,top):
            if nTime >= aList[i]["stamp"] and nTime < aList[i+1]["stamp"]:
                print "insertion point: " , i
                aList.insert(i+1,stamp)
                break

def do_examineSensorSite(fields, gDict, args):
    """
    Function to examine the history of a sensor/site pair
    """
    if len(args) < 3:
        print "Invalid syntax, try:"
        print execute, "detachSensorsFromSite sensorID siteID DD/MM/YYYY"
        sys.exit()
    sensorid = args[0].lower()
    siteid = args[1].lower()
    date = args[2]

    sites = gDict["sites"]
    sensors = gDict["sensors"]
    siteKey = None
    sensorKey = None
    for site in sites.keys():
        sid = sites[site]["siteid"]
        if sid.lower() == siteid:
            print "site", sid, " located"
            siteKey = site
            
    for sensor in sensors.keys():
        sid = sensors[sensor]["sensorid"]
        if sid.lower() == sensorid:
            print "sensor", sid, " located"
            sensorKey = sensor
            
    if sensorKey is None:
        print "Invalid sensor: ", sensorid
    if siteKey is None:
        print "Invalid site: ", siteid
    pairs = gDict["pairs"]
    tag = "{}|{}".format(siteKey, sensorKey)
    if tag not in pairs:
        print "Combination not in the dictionary: ", tag
        sys.exit()
    print "examining: ", sensorid, siteid, date, tag
    tev = histoire(date,"test", "status", "undef");
    status = getStatus(tev, pairs[tag])
    print tag, "@", date, status

def getStatus(eve, things):
    nThings = len(things)
    print "List size", nThings
    if nThings == 0:
#        print "Nothing to examine, sorry!"
        return "undef"
    else:
        top = nThings - 1
        nTime = eve["stamp"]
        for i in range(0,top):
            thing = things[i]
            hrTime = datetime.datetime.fromtimestamp( int(thing["stamp"])).strftime('%Y-%m-%d')
            print thing["action"], hrTime
            if nTime >= things[i]["stamp"] and nTime < things[i+1]["stamp"]:
                print "insertion point: " , i, "status: ", things[i]["status"]
                return things[i]["status"]
#                break

def do_detachSensorFromSite(fields, gDict, args):
    """
    Function to detach a sensor from a site
    """
    if len(args) < 3:
        print "Invalid syntax, try:"
        print execute, "detachSensorsFromSite sensorID siteID DD/MM/YYYY"
        sys.exit()
    sensorid = args[0].lower()
    siteid = args[1].lower()
    date = args[2]

    sites = gDict["sites"]
    sensors = gDict["sensors"]
    siteKey = None
    sensorKey = None
    for site in sites.keys():
        sid = sites[site]["siteid"]
        if sid.lower() == siteid:
            print "site", sid, " located"
            siteKey = site
            
    for sensor in sensors.keys():
        sid = sensors[sensor]["sensorid"]
        if sid.lower() == sensorid:
            print "sensor", sid, " located"
            sensorKey = sensor
            
    if sensorKey is None:
        print "Invalid sensor: ", sensorid
    if siteKey is None:
        print "Invalid site: ", siteid
    fdu = stime2utime(date)
    if "pairs" not in gDict:
        gDict["pairs"] = {}
    pairs = gDict["pairs"]
    tag = "{}|{}".format(siteKey, sensorKey)
    print "pairing: ", sensorid, siteid, date, fdu, tag
    if tag not in pairs:
        pairs[tag] = []
    tev = histoire(date,"detach", "status", "off");
    insert(tev, pairs[tag])
    # modify the sensor's general history
#    stamp = [ tev["stamp"] , "detached from {}".format(siteKey)]
    gDict["sensors"][sensorKey]["history"].append(stamp)
    detectors = gDict["sensors"][sensorKey]["detectors"]
    for det in detectors.keys():
        detectors[det]["history"].append(tev)


#  End of the function definitions
#  main code starts here

if os.path.isfile(assetsFile):
    dfile = open(assetsFile,"r")
    jsonString = dfile.readline().rstrip('\n')
#    print jsonString
    gDict = json.loads(jsonString)
#    gDict = json.load(dfile.read())
    dfile.close()
else:
    gDict = {}
#    gDict["listOfSites"] = []
#    gDict["sites"] = {}
#    gDict["listOfSensors"] = []
#    gDict["sensors"] = {}
    gDict["log"] = []


functions = {}
functions["addsite"] = do_addSite;
functions["addsensor"] = do_addSensor;
functions["addsitesfromfile"] = do_addSitesFromFile;
functions["addsensorsfromfile"] = do_addSensorsFromFile;
functions["showdictionary"] = do_showDictionary;
functions["showhelp"] = do_showHelp;
functions["getinputtemplate"] = do_createTemplate;
functions["attachsensortosite"] = do_attachSensorToSite;
functions["detachsensorfromsite"] = do_detachSensorFromSite;
functions["examinesensorsite"] = do_examineSensorSite;

args = sys.argv
executable = args.pop(0)
ex = executable.split("/")
execute = ex.pop()
nargs = len(args)

if nargs == 0:
    print "Usage: assetInventory.py action args"
    print "  where action can be any of:"
    for a in sorted(actionsHelp):
        b = a.lower()
        if b in functions:
            mark = ""
        else:
            mark = "[TODO]"
        print "   ", mark, a, actionsHelp[a]
    sys.exit()

laAction = args[0]
args.pop(0)
#print "dealing with action", laAction
lcname = laAction.lower()
#print "the action is: ", laAction , " --> ", lcname

functions[lcname](arguments[lcname], gDict, args)

#sys.exit()
#
#while True:
#    print actions
#    name = raw_input("Action to perform: ")
#    lcname = name.lower()
#    print "the action is: ", name , " --> ", lcname
#    if lcname == "terminate":
#        break
#    functions[lcname](arguments[lcname], gDict)


#print "gDict next"
#print gDict


assetsLog = open(assetsFile,'w')
assetsLog.write(json.dumps(gDict))
assetsLog.close()

backup = "{}_{}".format(assetsFile, stamp)
assetsBU = open(backup,'w')
assetsBU.write(json.dumps(gDict))
assetsBU.close()


sys.exit()

#extractData(name, entries, gDict)


# The idea would be to have a system to generate functions to gather data
# based on the "action" requested rather than having code split in
# different actions.
# At return point, these functions should put the data in the global object 

# Let's give it a try to this


#p = '%Y-%m-%dT%H:%M:%S.%fZ'
#p2 = '%Y-%m-%dT%H:%M:%SZ'
#utcf = '%Y-%m-%dT%H:%M:%S'
#
#
#def stringArray(origList):
#    """
#        Routine to return an array of numpy characters of shape
#        (len(list), maxLen) as well as the number of elements in the list
#        and the maximum length of the strings in the list
#    """
#    maxlen = 0
#    for s in origList:
#        if len(s) > maxlen:
#            maxlen = len(s)
#    listLen = len(origList)
#    charMatrix = np.empty((listLen, maxlen), dtype='a1')
#    charMatrix.fill(" ")
#
#    i = 0
#    for s in origList:
#        sarray = np.array(list(s), dtype='a1')
#        sLen = len(s)
#        charMatrix[i,0:sLen] = sarray[:]
##        if sLen < maxlen:
##            charMatrix[i,sLen] = 0
##        if sLen+1 < maxlen:
##        charMatrix[i,sLen:-1] = " "
#        i += 1
#
#    return charMatrix, listLen, maxlen
#
##def extractStrings(cMatrix, indices):
##    """
##        Routine to return an subset of the lines stored in the cMatrix
##        array. Details in of the incoming matrix need to be extracted at
##        run-time rather than passed (just in case)
##    """
##    nXelements = len(indices)
##    print "Elements to extract: ", nXelements
##    print cMatrix.shape
##    return
##    maxlen = 0
##    for s in origList:
##        if len(s) > maxlen:
##            maxlen = len(s)
##    listLen = len(origList)
##    charMatrix = np.empty((listLen, maxlen), dtype='a1')
##    charMatrix.fill(" ")
##
##    i = 0
##    for s in origList:
##        sarray = np.array(list(s), dtype='a1')
##        sLen = len(s)
##        charMatrix[i,0:sLen] = sarray[:]
##        i += 1
##
##    return charMatrix, listLen, maxlen
#
## get arguments from the command line to avoid having to edit this program
## all the time!
#nargs = len(sys.argv)
#if nargs < 1:
#    print "Usage: ", sys.argv[0], " csv-file [-validate]"
#    sys.exit()
#
#print "Nargs ", nargs
#
#mytime = "2017-03-08T00:27:31.807Z"
#epoch = datetime(1970, 1, 1)
##print((datetime.strptime(mytime, p) - epoch).total_seconds())
#
#csvFile = sys.argv[1]
#validate = False
#if nargs == 3 and sys.argv[2] == "-validate":
#    validate = True
#
#fileDate = csvFile.replace(".csv","")
##ncdfFile = "../binary/" + csvFile.replace("csv","nc")
#ncdfFile = csvFile.replace("csv","nc")
#
##column = int(sys.argv[2])
##msd = {'co': 0, 'pm25': 1, 'pm10': 2, 'so2': 3, 'bc': 4,
##'o3': 5 , 'no2': 6}
#msd = {}
#places = {}
#stdPlaces = []
#internal_place_id = {}
#measured = {}
#qperplace = {}
#qpertime = {}
#compo = {}
#invalid = {}
#skip = []
#skip.append(0)
#uniqueSiteTime = {}
#sitesWithWrongUnits = {}
#pollutants = {}
#d_epoque = {}
#d_siteInternal = {}
#meta_sites = {}
#meta_city = []
#meta_country = []
#meta_longitude = []
#meta_latitude = []
#meta_attributes = []
#meta_dtz = []
#meta_site = []
#good_lines = []
##meta_city = []
#mainId = []
#
#lSiteId = []
#lSensorId = []
#lTimeStamp = []
#lCO = []
#lNO = []
#lNO2 = []
#lRH = []
#lTemp = []
#lBat = []
#lNoise = []
#lDate = []
#dayDict = {}
#monDict = {}
#
#file = open(csvFile, 'r') 
#nLines = 0
#for row in file:
## siteId (char array)
## sensorId (integer)
## timeStamp (integer)
## Carbon Monoxide
## Nitric Oxide
## Nitrogen Dioxide
## Relative Humidity
## Temperature
## Battery
## Noise
#
##    print row
#
#    siteId, sensorId, tstamp, uxTime, co, no, no2, rhum, temp, bat, noise = row.rstrip().split()
#    lSiteId.append(siteId)
#    lSensorId.append(int(sensorId))
#    lTimeStamp.append(int(uxTime))
#    lCO.append(float(co))
#    lNO.append(float(no))
#    lNO2.append(float(no2))
#    lRH.append(float(rhum))
#    lTemp.append(float(temp))
#    lBat.append(float(bat))
#    lNoise.append(float(noise))
#    date, hour = tstamp.split("T")
#    year, month, day = date.split("/")
#    mond = '{}/{}'.format(year, month)
#    lDate.append(tstamp)
#    dayDict[date] = 1
#    monDict[mond] = 1
#    nLines += 1
##    print siteId, sensorId, tstamp
#
#print "Number of lines: ", nLines
#novalue = -32768
#
## data is already ingested, so it is time to create the big datafile.
#sarrSiteId, nst, lenSites = stringArray(lSiteId)
#print "Number of lines: ", nst, lenSites
#
#print "first site: ", sarrSiteId[0]
#print "Months found: ", monDict.keys()
##print "Days found: ", dayDict.keys()
#
#for bino in sorted(monDict.keys()):
#    dino = bino.replace("/", "-")
##    indices = np.where(bino in lDate)
#    print "Selecting: ", bino, " / ", dino, " "
#    indices = [i for i,s in enumerate(lDate) if bino in s]
#
##    print indices
##    sDate = [lDate[i] for i in indices]
##    break
#    leFile = "{}.nc".format(dino)
#    dbFile = Dataset(leFile, 'w', format='NETCDF4_CLASSIC')
#    dbFile.createDimension('data_nDataPoints', len(indices))
#    dbFile.createDimension('md_sitesLen', lenSites)
#    
#    dsiteId = dbFile.createVariable('siteId', 'S1', ('data_nDataPoints','md_sitesLen'), zlib=True)
#    dsiteId.comment = 'Site Identifier'
#    
#    
#    dataEpoch = dbFile.createVariable('dataEpoch', 'i4', ('data_nDataPoints',),zlib=True)
#    dataEpoch.comment = "Unix Epoch for each observation to the second"
#    dataEpoch.units = 'seconds since 1970, Jan 1, 00:00:00 UTC'
#    
#    # By using an internal integer index we're supposed to speed things up in
#    # the searching. There is really no need to have a long string as the key
#    # if an integer will do!
#    dataSensorId = dbFile.createVariable('dataSensorId', 'i4', ('data_nDataPoints',),zlib=True)
#    dataSensorId.comment = "Sensor-id. ID associated with the sensor, not where it is located"
#    
#    # Now we must define the variables associated to the particles, this is
#    # goint to be dynamic
#    
#    xcompo = ["co", "no", "no2", "RelativeHumidity", "Temperature",
#        "battery", "NoiseLevel"]
#    
#    data_co = dbFile.createVariable("CO", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_co.comment = "Air concentration of Carbon Monoxide"
#    data_co.unit = "micro-grams per cubic meter [mu-g/m^3]"
#    
#    data_no = dbFile.createVariable("NO", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_no.comment = "Air concentration of Nitric Oxide"
#    data_no.unit = "micro-grams per cubic meter [mu-g/m^3]"
#    
#    data_no2 = dbFile.createVariable("NO2", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_no2.comment = "Air concentration of Nitrogen Dioxide"
#    data_no2.unit = "micro-grams per cubic meter [mu-g/m^3]"
#    
#    xcompo = ["co", "no", "no2", "RelativeHumidity", "Temperature",
#        "battery", "NoiseLevel"]
#    
#    data_rhum = dbFile.createVariable("RelativeHumidity", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_rhum.comment = "Air Relative Humidity"
#    data_rhum.unit = "Percentage (%)"
#    
#    data_temp = dbFile.createVariable("AirTemperature", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_temp.comment = "Air Relative Humidity"
#    data_temp.unit = "Celcius (C)"
#    
#    data_battery = dbFile.createVariable("Battery", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_battery.comment = "Battery level"
#    data_battery.unit = "Volt"
#    
#    data_noise = dbFile.createVariable("NoiseLevel", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_noise.comment = "Noise Level"
#    data_noise.unit = "Decibels"
#    
##    sDate = [lDate[i] for i in indices]
#    dataSensorId[:] = [lSensorId[i] for i in indices]
#    dataEpoch[:] =    [lTimeStamp[i] for i in indices]
#    data_co[:] =      [lCO[i] for i in indices]
#    data_no[:] =      [lNO[i] for i in indices]
#    data_no2[:] =     [lNO2[i] for i in indices]
#    data_rhum[:] =    [lRH[i] for i in indices]
#    data_temp[:] =    [lTemp[i] for i in indices]
#    data_battery[:] = [lBat[i] for i in indices]
#    data_noise[:] =   [lNoise[i] for i in indices]
#    dsiteId[:] = [sarrSiteId[i] for i in indices]
##    dsiteId[:] = extractStrings(sarrSiteId, indices)
#    
#    dbFile.close()
#    print leFile, " created"
#
#for bino in sorted(dayDict.keys()):
#    dino = bino.replace("/", "-")
##    indices = np.where(bino in lDate)
#    print "Selecting: ", bino, " / ", dino, " "
#    indices = [i for i,s in enumerate(lDate) if bino in s]
#
##    print indices
##    sDate = [lDate[i] for i in indices]
##    break
#    leFile = "{}.nc".format(dino)
#    dbFile = Dataset(leFile, 'w', format='NETCDF4_CLASSIC')
#    dbFile.createDimension('data_nDataPoints', len(indices))
#    dbFile.createDimension('md_sitesLen', lenSites)
#    
#    dsiteId = dbFile.createVariable('siteId', 'S1', ('data_nDataPoints','md_sitesLen'), zlib=True)
#    dsiteId.comment = 'Site Identifier'
#    
#    
#    dataEpoch = dbFile.createVariable('dataEpoch', 'i4', ('data_nDataPoints',),zlib=True)
#    dataEpoch.comment = "Unix Epoch for each observation to the second"
#    dataEpoch.units = 'seconds since 1970, Jan 1, 00:00:00 UTC'
#    
#    # By using an internal integer index we're supposed to speed things up in
#    # the searching. There is really no need to have a long string as the key
#    # if an integer will do!
#    dataSensorId = dbFile.createVariable('dataSensorId', 'i4', ('data_nDataPoints',),zlib=True)
#    dataSensorId.comment = "Sensor-id. ID associated with the sensor, not where it is located"
#    
#    # Now we must define the variables associated to the particles, this is
#    # goint to be dynamic
#    
#    xcompo = ["co", "no", "no2", "RelativeHumidity", "Temperature",
#        "battery", "NoiseLevel"]
#    
#    data_co = dbFile.createVariable("CO", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_co.comment = "Air concentration of Carbon Monoxide"
#    data_co.unit = "micro-grams per cubic meter [mu-g/m^3]"
#    
#    data_no = dbFile.createVariable("NO", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_no.comment = "Air concentration of Nitric Oxide"
#    data_no.unit = "micro-grams per cubic meter [mu-g/m^3]"
#    
#    data_no2 = dbFile.createVariable("NO2", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_no2.comment = "Air concentration of Nitrogen Dioxide"
#    data_no2.unit = "micro-grams per cubic meter [mu-g/m^3]"
#    
#    xcompo = ["co", "no", "no2", "RelativeHumidity", "Temperature",
#        "battery", "NoiseLevel"]
#    
#    data_rhum = dbFile.createVariable("RelativeHumidity", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_rhum.comment = "Air Relative Humidity"
#    data_rhum.unit = "Percentage (%)"
#    
#    data_temp = dbFile.createVariable("AirTemperature", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_temp.comment = "Air Relative Humidity"
#    data_temp.unit = "Celcius (C)"
#    
#    data_battery = dbFile.createVariable("Battery", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_battery.comment = "Battery level"
#    data_battery.unit = "Volt"
#    
#    data_noise = dbFile.createVariable("NoiseLevel", 'f4',
#        ('data_nDataPoints',),zlib=True, fill_value=novalue)
#    data_noise.comment = "Noise Level"
#    data_noise.unit = "Decibels"
#    
##    sDate = [lDate[i] for i in indices]
#    dataSensorId[:] = [lSensorId[i] for i in indices]
#    dataEpoch[:] =    [lTimeStamp[i] for i in indices]
#    data_co[:] =      [lCO[i] for i in indices]
#    data_no[:] =      [lNO[i] for i in indices]
#    data_no2[:] =     [lNO2[i] for i in indices]
#    data_rhum[:] =    [lRH[i] for i in indices]
#    data_temp[:] =    [lTemp[i] for i in indices]
#    data_battery[:] = [lBat[i] for i in indices]
#    data_noise[:] =   [lNoise[i] for i in indices]
#    dsiteId[:] = [sarrSiteId[i] for i in indices]
##    dsiteId[:] = extractStrings(sarrSiteId, indices)
#    
#    dbFile.close()
#    print leFile, " created"
#
#sys.exit()
#print "Creating netcdf file: ", ncdfFile
#
#
#dbFile = Dataset(ncdfFile, 'w', format='NETCDF4_CLASSIC')
#dbFile.createDimension('data_nDataPoints', nLines)
#dbFile.createDimension('md_sitesLen', lenSites)
#
#dsiteId = dbFile.createVariable('siteId', 'S1', ('data_nDataPoints','md_sitesLen'), zlib=True)
#dsiteId.comment = 'Site Identifier'
#
#
#dataEpoch = dbFile.createVariable('dataEpoch', 'i4', ('data_nDataPoints',),zlib=True)
#dataEpoch.comment = "Unix Epoch for each observation to the second"
#dataEpoch.units = 'seconds since 1970, Jan 1, 00:00:00 UTC'
#
## By using an internal integer index we're supposed to speed things up in
## the searching. There is really no need to have a long string as the key
## if an integer will do!
#dataSensorId = dbFile.createVariable('dataSensorId', 'i4', ('data_nDataPoints',),zlib=True)
#dataSensorId.comment = "Sensor-id. ID associated with the sensor, not where it is located"
#
## Now we must define the variables associated to the particles, this is
## goint to be dynamic
#
#xcompo = ["co", "no", "no2", "RelativeHumidity", "Temperature",
#    "battery", "NoiseLevel"]
#
#data_co = dbFile.createVariable("CO", 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue)
#data_co.comment = "Air concentration of Carbon Monoxide"
#data_co.unit = "micro-grams per cubic meter [mu-g/m^3]"
#
#data_no = dbFile.createVariable("NO", 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue)
#data_no.comment = "Air concentration of Nitric Oxide"
#data_no.unit = "micro-grams per cubic meter [mu-g/m^3]"
#
#data_no2 = dbFile.createVariable("NO2", 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue)
#data_no2.comment = "Air concentration of Nitrogen Dioxide"
#data_no2.unit = "micro-grams per cubic meter [mu-g/m^3]"
#
#xcompo = ["co", "no", "no2", "RelativeHumidity", "Temperature",
#    "battery", "NoiseLevel"]
#
#data_rhum = dbFile.createVariable("RelativeHumidity", 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue)
#data_rhum.comment = "Air Relative Humidity"
#data_rhum.unit = "Percentage (%)"
#
#data_temp = dbFile.createVariable("AirTemperature", 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue)
#data_temp.comment = "Air Relative Humidity"
#data_temp.unit = "Celcius (C)"
#
#data_battery = dbFile.createVariable("Battery", 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue)
#data_battery.comment = "Battery level"
#data_battery.unit = "Volt"
#
#data_noise = dbFile.createVariable("NoiseLevel", 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue)
#data_noise.comment = "Noise Level"
#data_noise.unit = "Decibels"
#
#dsiteId[:] = sarrSiteId
#dataSensorId[:] =     lSensorId
#dataEpoch[:] =     lTimeStamp
#data_co[:] =     lCO
#data_no[:] =     lNO
#data_no2[:] =     lNO2
#data_rhum[:] =     lRH
#data_temp[:] =     lTemp
#data_battery[:] =     lBat
#data_noise[:] =     lNoise
#
#dbFile.close()
#
#sys.exit()
#
#with open(csvFile, mode='r') as infile:
#    reader = csv.reader(infile)
#    lesRows = list(reader)
#    nrows = len(lesRows)
#    print nrows, len(lesRows)
#
#    for row in lesRows:
## siteId (char array)
## sensorId (integer)
## timeStamp (integer)
## Carbon Monoxide
## Nitric Oxide
## Nitrogen Dioxide
## Relative Humidity
## Temperature
## Battery
## Noise
#        print row
#        siteId, sensorId, tstamp, uxTime, co, no, no2, rhum, temp, bat, noise = row[0].split()
#        print siteId, sensorId
#    sys.exit()
#
##    dmat = np.zeros( (nrows ,8), np.float )
##    dmat.fill(-32768)
##    print dmat
#    nrows = 0
#    nWrongDate = 0
#    nWrongUnit = 0
##    for row in reader:
#    duplicated = {}
#    duplicatedValue = {}
#    siteCounter = 0
#    for row in lesRows:
## siteId (char array)
## sensorId (integer)
## timeStamp (integer)
## Carbon Monoxide
## Nitric Oxide
## Nitrogen Dioxide
## Relative Humidity
## Temperature
## Battery
## Noise
#        siteId, sensorId, tstamp, uxTime, co, no, no2, rhum, temp, bat, noise = row[:]
#        if nrows > 0:
#            # form a key with lat/lon + location-city-country
##            print row[8], row[9]
#            # ignore entries without lat/lon data
#            site, city, country, zulu, loct, comp, vcomp, unit, lat, lon, ass = row[:]
##            print site, city, country, zulu, loct, comp, vcomp, unit, lat, lon, ass , row
##            siteId =  "{:s}|{:s}|{:s}".format( site, city, country)
#            siteId =  "{:s}|{:s}|{:s}".format( country.lower(),
#                    city.rstrip().lower(), site.rstrip().lower())
##            dkey = "{:s} {:s} {:s} {:s}".format(lat, lon, zulu  ,comp)
#            epoque = (datetime.strptime(zulu, p) - epoch).total_seconds()
#            uniqueSiteTS = "{} {}".format(epoque  ,siteId)
#            dkey = "{} {} {}".format(siteId, epoque  ,comp)
#            if (lat == "" or lon == "") or \
#               (float(lat) == 0.0 or float(lon) == 0.0):
##                print "Invalid row: ", row
#                invalid[siteId] = 1
#                skip.append(nrows)
#            elif dkey in duplicated:
#                duplicated[dkey] += 1
#                duplicatedValue[dkey].append(row[6])
#                skip.append(nrows)
#            elif "ppm" in unit:
#                nWrongUnit += 1
#                sitesWithWrongUnits[site] = "{} {} {} {}".format(site,
#                                            city, country, unit)
#                skip.append(nrows)
#            elif fileDate not in zulu:
##                print uniqueSiteTS, zulu
#                nWrongDate += 1
#                skip.append(nrows)
#            else:
#                duplicated[dkey] = 1
#                duplicatedValue[dkey] = []
#                duplicatedValue[dkey].append(row[6])
#                compo[comp] = 1
#                uniqueSiteTime[uniqueSiteTS] = 1
#                # and to do the on-spot validation instead of using another
#                # script:
#
#                good_lines.append(row)
#
#                # ready to store data so that we can retrieve it to form
#                # both the metadata and the data of the netcdf file
#
#                # this is the metadata part...
#                if siteId not in meta_sites:
#                    meta_sites[siteId] = siteCounter
#                    mainId.append(siteCounter)
#                    meta_site.append( site)
#                    meta_city.append( city)
#                    meta_country.append( country)
#                    meta_longitude.append( float(lon))
#                    meta_latitude.append( float(lat))
#                    meta_attributes.append( ass)
#                    sdtime = loct[19:]
#                    hours, minutes = sdtime.split(":")
#                    dtime = float(hours)
#                    if "-" in hours:
#                        dtime -= float(minutes)/60.
#                    else:
#                        dtime += float(minutes)/60.
#                    meta_dtz.append( dtime)
#                    siteCounter += 1
#
#                # this is the data part...
#                if comp not in pollutants:
#                    pollutants[comp] = {}
#                pollutants[comp][uniqueSiteTS] = vcomp
#                d_epoque[uniqueSiteTS] = epoque
#                d_siteInternal[uniqueSiteTS] = meta_sites[siteId]
#        nrows += 1
#
#    xcompo = sorted(compo.keys())
#    print "dict of particles: ", compo
#    print "List of particles: ", xcompo
#    peq = 0
#    for com in xcompo:
#        msd[com] = peq
#        peq += 1
#    print "new dict of particles: ", msd
#
#    print "Sites without Lon/lat", len(invalid.keys())
##    for site in sorted(invalid.keys()):
##        print "Invalid Lat/Lon: ", site
#
#    print "sites with ppm as unit:", len(sitesWithWrongUnits.keys())
##    for site in sorted(sitesWithWrongUnits.keys()):
##        print "wrong Unit site: ", site, sitesWithWrongUnits[site]
#
#    for dup in duplicated.keys():
#        if duplicated[dup] > 1:
#            print "Duplicated entry: ", dup, duplicated[dup], duplicatedValue[dup]
#
#    # to see if the first part is OK
#    print "Rows to skip: ", len(skip), nrows
#    print "NRows with wrong date: ", nWrongDate, nrows
#    print "NRows with wrong units: ", nWrongUnit, nrows
#nDataPoints =  len(uniqueSiteTime.keys())
#print "Nummer of unique site/time combos: ", len(uniqueSiteTime.keys())
#
#novalue = -32768
#
#pdict = {}  # the data dictionary, keys are pollutants, values are numpy arrays
#            # initialised to novalue
#
#sortedUniqueEntries = sorted(uniqueSiteTime.keys())
#
#pos = 0
#dEpoque = np.zeros( (nDataPoints ), np.int )
#dSiteId =  np.zeros( (nDataPoints ), np.int )
#dEpoque.fill(-32768)
#dSiteId.fill(-32768)
#
## initialise the pollutants arrays
#for pol in xcompo:
#    pdict[pol] = np.zeros( (nDataPoints ), np.float )
#    pdict[pol].fill(-32768)
#
#for sue in sortedUniqueEntries:
#    dSiteId[pos] = d_siteInternal[sue]
#    dEpoque[pos] = d_epoque[sue]
#    for pol in xcompo:
#        if sue in pollutants[pol]:
#                pdict[pol][pos] = pollutants[pol][sue]
#    pos += 1
#
#
##print meta_site
#print "Number of cities: ", len(meta_site)
#
## we should be able to put everything into arrays and then pass it onto
## the file writer.
#
##                    meta_site.append( site)
##                    meta_city.append( city)
##                    meta_country.append( country)
##                    meta_attributes.append( ass)
##                    sdtime = loct[19:]
##                    hours, minutes = sdtime.split(":")
##                    dtime = float(hours)
##                    if "-" in hours:
##                        dtime -= float(minutes)/60.
##                    else:
##                        dtime += float(minutes)/60.
##                    meta_dtz.append( dtime)
##                    meta_longitude.append( float(lon))
##                    meta_latitude.append( float(lat))
#print "Sanity check for id: ", len(mainId), len(meta_site)
##sarrMainKey, nStations, lenMainKey = stringArray(mainKey)
#sarrSites, nStations, lenSites = stringArray(meta_site)
#sarrCities, nst, lenCities = stringArray(meta_city)
#sarrCountries, nst, lenCountries = stringArray(meta_country)
#sarrAttributes, nst, lenAttributes = stringArray(meta_attributes)
##sarrSiteKey, nPoints, maxSiteLen = stringArray(siteKey)
##sarrSiteId, nPoints, maxSiteIdLen = stringArray(leSiteId)
#
##sarrCites = np.empty((nst, 40), dtype='a1')
##
##i = 0
##for s in cities:
##        sarray = np.array(list(s), dtype='a1')
###        sLen = len(s)
##        sarrCites[i,0:len(s)] = sarray[:]
##        sarrCites[i,len(s):-1] = " "
##        i += 1
#
#print "NsiteKeys: ", len(mainId)
#print "N-Stations: ", nStations, nst
#print "N-datapoints: ", nDataPoints
#print "Max len cities: ", lenCities
#print "Max sites len: ", lenSites
#print "Max attributes len: ", lenAttributes
#
#
#print "Creating netcdf file: ", ncdfFile
#dbFile = Dataset(ncdfFile, 'w', format='NETCDF4_CLASSIC')
#dbFile.createDimension('md_nStations', nStations)
#dbFile.createDimension('data_nDataPoints', nDataPoints)
##dbFile.createDimension('md_keyLen', lenMainKey)
#dbFile.createDimension('md_sitesLen', lenSites)
#dbFile.createDimension('md_cityLen', lenCities)
#dbFile.createDimension('md_countryLen', lenCountries)
#dbFile.createDimension('md_attributeLen', lenAttributes)
#dsite = dbFile.createVariable('md_site', 'S1', ('md_nStations','md_sitesLen'), zlib=True)
#dsite.comment = 'Site name, as provided in the original data-files'
#
##dsiteKey = dbFile.createVariable('md_siteKey', 'S1', ('md_nStations','md_keyLen'), zlib=True)
##dsiteKey.comment = 'Site key, common for both tables'
#
#dsiteid = dbFile.createVariable('md_siteId', 'i4', ('md_nStations'), zlib=True)
#dsiteid.comment = 'Internal site ID for this file only'
#
#latitude = dbFile.createVariable('md_latitude', 'f4', ('md_nStations',), zlib=True)
#latitude.units = 'degree_north'
#latitude.comment = 'Latitude as given in the original data'
#
#longitude = dbFile.createVariable('md_longitude', 'f4', ('md_nStations',), zlib=True)
#longitude.units = 'degree_east'
#longitude.comment = 'Longitude as given in the original data'
#
#dtimez = dbFile.createVariable('md_TZ-ZULU', 'f4', ('md_nStations',), zlib=True)
#dtimez.comment = 'Difference of local time respect to GMT'
#dtimez.units = "Decimal hours"
#
#dcityKey = dbFile.createVariable('md_city', 'S1', ('md_nStations','md_cityLen'), zlib=True)
#dcityKey.comment = 'City name (but it could be province, state, or other'
#
#dcountry = dbFile.createVariable('md_country', 'S1', ('md_nStations','md_countryLen'), zlib=True)
#dcountry.comment = 'Two letter country code'
#
##sarrAttributes, nst, lenAttributes = stringArray(attributes)
#datts = dbFile.createVariable('md_attributes', 'S1', ('md_nStations','md_attributeLen'), zlib=True)
#datts.comment = 'Attributes as given by data provider'
#
## Define now the data variables
##datasiteKey = dbFile.createVariable('data_siteKey', 'S1', ('data_nDataPoints','md_keyLen'), zlib=True)
##datasiteKey.comment = 'Site key, values are common for both tables'
#
#dataEpoch = dbFile.createVariable('dataEpoch', 'i4', ('data_nDataPoints',),zlib=True)
#dataEpoch.comment = "Unix Epoch for each observation to the second"
#dataEpoch.units = 'seconds since 1970, Jan 1, 00:00:00 UTC'
#
## By using an internal integer index we're supposed to speed things up in
## the searching. There is really no need to have a long string as the key
## if an integer will do!
#dataSiteId = dbFile.createVariable('dataSiteId', 'i4', ('data_nDataPoints',),zlib=True)
#dataSiteId.comment = "site-id internal index, valid for this file only"
#
## Now we must define the variables associated to the particles, this is
## goint to be dynamic
#
#peq = 0
#cvars = []
#for com in xcompo:
#    cvars.append(dbFile.createVariable(com, 'f4',
#    ('data_nDataPoints',),zlib=True, fill_value=novalue))
#    cvars[-1].comment = "Air concentration of {:s}".format(com)
#    cvars[-1].unit = "micro-grams per cubic meter [mu-g/m^3]"
##    peq += 1
#
#
##dsiteKey = dbFile.createVariable('siteKeyMD', 'S1', ('keyLen', 'nStations'), zlib=True)
##latitude = dbFile.createVariable('latitude', 'f4', ('nStations',))
##longitude = dbFile.createVariable('longitude', 'f4', ('nStations',))
#dsite[:] = sarrSites
##                    meta_dtz.append( dtime)
##                    meta_longitude.append( float(lon))
##                    meta_latitude.append( float(lat))
#latitude[:] = meta_latitude
#longitude[:] = meta_longitude
#dtimez[:] = meta_dtz
##dsiteKey[:] = sarrMainKey
#dsiteid[:] = mainId
#dcityKey[:] = sarrCities
##dcityKey[:] = sarrCites
#dcountry[:] = sarrCountries 
#datts[:] = sarrAttributes
#
#dataEpoch[:] = dEpoque
#dataSiteId[:] = dSiteId
#
## closing before data are rearranged and written:
#
#col = 0
#for com in xcompo:
##    cvars[col][:] = dmat[:,col]
##    aa = dmat[:,col]
#    cvars[col][:] = pdict[com]
#    col += 1
#
#dbFile.close()
#
#
## we may want to do an immediate data verification, and for that we saved
## the participating lines and we will read the file one more time
#if not validate:
#    print "No validation/consistency/sanity-check will be performed now"
#    sys.exit()
#
## Let's open the file and then try to get the information we need...
#verFile = Dataset(ncdfFile, 'r')
#vdEpoch = verFile.variables["dataEpoch"][:]
#vdSiteId = verFile.variables['dataSiteId'][:]
#md_siteId = verFile.variables['md_siteId'][:]
#md_site = verFile.variables['md_site'][:]
#md_city = verFile.variables['md_city'][:]
#md_country = verFile.variables['md_country'][:]
#
#nsta = len(md_siteId)
#print "From the recently open file, nStations: ", nsta
#siteEquiv = {}
#for i in range(0, nsta):
#    site = ''.join(md_site[i]).rstrip()
#    city = ''.join(md_city[i]).rstrip()
#    country = ''.join(md_country[i]).rstrip()
#    key = '{:s}|{:s}|{:s}'.format(site, city, country)
#    siteEquiv[key] = md_siteId[i]
##    print "SCHK1", i, site, key, siteEquiv[key]
#
##sys.exit()
#
#print "About to validate the recently created file"
#nerrors = 0
#for row in good_lines:
#    site, city, country, zulu, loct, comp, vcomp, unit, lat, lon, ass = row[:]
#    epoque = (datetime.strptime(zulu, p) - epoch).total_seconds()
#    siteId =  "{:s}|{:s}|{:s}".format( site.rstrip(), city.rstrip(), country)
#    xsid = siteEquiv[siteId]
#    o_indx = np.where(np.logical_and(vdEpoch == epoque, vdSiteId == xsid))[0]
#    dcomp = verFile.variables[comp][o_indx[0]]
#    fcomp = float(vcomp)
##    if fcomp != dcomp:
#    dval = fcomp - dcomp
#    if abs(dval) > 1e-4:
#        parts = vcomp.split('.')
#        fmt = '{:.'+'{}'.format(len(parts[-1]))+'f}'
##        print parts, fmt
#        stPol = fmt.format(dcomp)
#        if stPol != vcomp:
#            print "ISOT: ", siteId, site, o_indx, comp, vcomp, stPol, dcomp, fcomp, dval
#            nerrors += 1
#
#print "Number of errors: ", nerrors
#sys.exit()
#
## These are pure data, and I'd like to arrange each of them according to
## sorted epoch, after all, we are dealing with a time based database, and
## time series extracted from the data as a per station, should have their
## timestamps sorted, and every data involved with it as well.
#
#nepoch = np.array(lepoch)
#sortInd = nepoch.argsort()
##sortedEpochIndices = np.array([i[0] for i in sorted(enumerate(lepoch), key=lambda x:x[1])])
#print "SortaInd: ", sortInd
#print min(lepoch) #, nepoch[sortInd[0]]
#print "Type(lepoch): ", type(lepoch)
#print "Type(nepoch): ", type(nepoch)
#
#sepoch = nepoch[sortInd]
#sid = np.array(leSiteId)
#print min(lepoch), max(lepoch)
#print sepoch
#
##dataEpoch[:] = lepoch
##dataSiteId[:] = leSiteId
#
##print "About shapes: "
##print "sortInd: ", np.shape(sortInd)
##print "cvars: ", np.shape(cvars)
##print "Going for the assignments "
#
#
#
#col = 0
#for com in xcompo:
##    cvars[col][:] = dmat[:,col]
#    aa = dmat[:,col]
#    cvars[col][:] = aa[sortInd]
#    col += 1
#dbFile.close()
#
#
