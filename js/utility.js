/**
* Parameters: numeric min, numeric max, boolean integer
* Return: random numeric between min and max. Reduced to int if (integer == true)
**/
function randRange(min, max, integer) {
    if (integer) {
        return Math.floor(Math.random() * ((max - min) + 1) + min);
    } else {
        return Math.random() * ((max - min) + 1) + min;
    }
}

function saveLocal() {
    localStorage["SHTracker-localSave"] = true;
    localStorage["SHTracker-prog"] = JSON.stringify(prog);
    localStorage["SHTracker-discretion"] = discretion;
    localStorage["SHTracker-benchmarked"] = benchmarked;
    localStorage["SHTracker-random"] = random;
    localStorage["SHTracker-previews"] = previews;
    localStorage["SHTracker-enabledAreas"] = JSON.stringify(enabledAreas);
    localStorage["SHTracker-allocPoints"] = allocPoints;
    localStorage["SHTracker-allocInterval"] = allocInterval;
    localStorage["SHTracker-lastAlloc"] = lastAlloc;
    localStorage["SHTracker-allocsRemaining"] = allocsRemaining;
    localStorage["SHTracker-constantTrackers"] = JSON.stringify(constantTrackers);
    localStorage["SHTracker-dailyTrackers"] = JSON.stringify(dailyTrackers);
    localStorage["SHTracker-periodicTrackers"] = JSON.stringify(periodicTrackers);
    localStorage["SHTracker-dailyResetTime"] = dailyResetTime;
    localStorage["SHTracker-nextReset"] = nextReset;
    localStorage['SHTracker-skipped'] = JSON.stringify(skipped)
    localStorage['SHTracker-areaDiscretion'] = JSON.stringify(areaDiscretion)
}

function loadLocal() {
    if (localStorage["SHTracker-localSave"] == "true") {
        prog = JSON.parse(localStorage["SHTracker-prog"]);
        discretion = localStorage["SHTracker-discretion"];
        benchmarked = JSON.parse(localStorage["SHTracker-benchmarked"]);
        random = JSON.parse(localStorage["SHTracker-random"]);
        previews = JSON.parse(localStorage["SHTracker-previews"]);
        enabledAreas = JSON.parse(localStorage["SHTracker-enabledAreas"]);
        allocPoints = JSON.parse(localStorage["SHTracker-allocPoints"]);
        allocInterval = JSON.parse(localStorage["SHTracker-allocInterval"]);
        lastAlloc = JSON.parse(localStorage["SHTracker-lastAlloc"]);
        allocsRemaining = JSON.parse(localStorage["SHTracker-allocsRemaining"]);
        constantTrackers = JSON.parse(localStorage["SHTracker-constantTrackers"])
        dailyTrackers = JSON.parse(localStorage["SHTracker-dailyTrackers"])
        periodicTrackers = JSON.parse(localStorage["SHTracker-periodicTrackers"])
        dailyResetTime = JSON.parse(localStorage["SHTracker-dailyResetTime"])
        if (localStorage["SHTracker-nextReset"] != "null") { nextReset = new Date(localStorage["SHTracker-nextReset"])}
        skipped = JSON.parse(localStorage["SHTracker-skipped"])
        areaDiscretion = JSON.parse(localStorage["SHTracker-areaDiscretion"])
    } else {
        userDataFlag = false;
        saveLocal(); // Create fresh save using defaults
    }
}

function assimilateSave() {
    if (Object.keys(prog).length != Object.keys(initProg).length) {
        prog = {...prog, ...initProg};
        localStorage["SHTracker-prog"] = JSON.stringify(prog);

        enabledAreas = {...enabledAreas, ...initEnabledAreas};
        localStorage["SHTracker-enabledAreas"] = JSON.stringify(enabledAreas);
    }
}

function clearSaveConfirm(src) {
    if (src.checked) { // first click
        src.labels[0].innerText = "Confirm"
    } else { // second click
        src.labels[0].innerText = "Clear Save"
        clearSave()
    }
}

function clearSave() {
    localStorage.removeItem("SHTracker-localSave");
    localStorage.removeItem("SHTracker-prog");
    localStorage.removeItem("SHTracker-discretion");
    localStorage.removeItem("SHTracker-benchmarked");
    localStorage.removeItem("SHTracker-random");
    localStorage.removeItem("SHTracker-enabledAreas");
    localStorage.removeItem("SHTracker-allocPoints");
    localStorage.removeItem("SHTracker-allocInterval");
    localStorage.removeItem("SHTracker-lastAlloc");
    localStorage.removeItem("SHTracker-allocsRemaining");
    localStorage.removeItem("SHTracker-constantTrackers");
    localStorage.removeItem("SHTracker-dailyTrackers");
    localStorage.removeItem("SHTracker-periodicTrackers");
    localStorage.removeItem("SHTracker-dailyResetTime");
    localStorage.removeItem("SHTracker-nextReset");
    localStorage.removeItem("SHTracker-areaDiscretion");

    // Reset to defaults
    prog = initProg;
    discretion = "Private";
    benchmarked = true;
    random = false;
    enabledAreas = initEnabledAreas;
    allocPoints = 1;
    allocInterval = 1; // 1: 1 day, 2: 2 days, 3: 3 days, 4: 7 days, 5: 14 days
    lastAlloc = false;
    allocsRemaining = allocPoints;
    constantTrackers = {};
    dailyTrackers = {};
    periodicTrackers = {};
    dailyResetTime = 24;
    newReset();
    updateOptionElements();
    skipped = initSkipped;
    areaDiscretion = initAreaDiscretion;
}

function exportSave() {
    var saveDate = new Date()
    saveDate = saveDate.toISOString().slice(0, 10) + " " + saveDate.toTimeString().slice(0, 8).replaceAll(":", "-");

    let saveName = 'SHTracker - ' + saveDate;

    let saveData = new Blob([JSON.stringify(localStorage)], {
        type: 'application/json',
        name: saveName
    });

    saveAs(saveData, saveName);
}

function areaCoding(area) {
    switch (area) {
        case "Feminine Wear":
        case "Makeup":
        case "Nail Care":
            return "feminization";
        case "Exercise":
        case "Diet":
        case "Hygiene":
        case "Shaving":
            return "physique"
        case "Plugging":
        case "Submission":
        case "Chastity":
            return "sexuality";
    }
}

function newReset() {
    reset = (new Date()); reset.setHours(dailyResetTime); reset.setMinutes(0); reset.setSeconds(0);
    
    // Push back a day if it is currently after that time today
    if (reset < (new Date())) { 
        nextDay = new Date(reset)
        nextDay.setDate(nextDay.getDate() + 1)
        reset = nextDay
    }
    nextReset = reset;

    localStorage['SHTracker-nextReset'] = nextReset
}

function setOptions() {
    enabledAreas["Feminine Wear"] = document.getElementById('femwear-enabled').checked
    enabledAreas["Makeup"] = document.getElementById('makeup-enabled').checked
    enabledAreas["Hygiene"] = document.getElementById('hygiene-enabled').checked
    enabledAreas["Shaving"] = document.getElementById('shaving-enabled').checked
    enabledAreas["Nail Care"] = document.getElementById('nails-enabled').checked
    enabledAreas["Plugging"] = document.getElementById('plugging-enabled').checked
    enabledAreas["Submission"] = document.getElementById('submission-enabled').checked
    enabledAreas["Chastity"] = document.getElementById('chastity-enabled').checked
    enabledAreas["Exercise"] = document.getElementById('exercise-enabled').checked
    enabledAreas["Diet"] = document.getElementById('diet-enabled').checked

    if (document.getElementById('discretion-private').checked) {
        discretion = "Private";
    } else if (document.getElementById('discretion-discrete').checked) {
        discretion = "Discrete";
    } else {
        discretion = "Public";
    }
    random = document.getElementById('allocation-random').checked;
    benchmarked = document.getElementById('benchmarks-enabled').checked;
    previews = document.getElementById('previews-enabled').checked;
    var oldAllocPoints = allocPoints;
    allocPoints = JSON.parse(document.getElementById('point-range').value);
    // new allocsRemaining will be the new allocPoints - points used already.
    allocsRemaining = Math.max(0, allocPoints - (oldAllocPoints - allocsRemaining)); 

    dailyResetTime = 24 + JSON.parse(document.getElementById('daily-reset-range').value);
    newReset()

    var timeTarget = dailyResetTime % 12
    resetTimeString = (timeTarget == 0 ? '12' : timeTarget) + (dailyResetTime >= 24 ? ' AM' : ' PM')
    document.getElementById('daily-reset-time').innerHTML = resetTimeString;

    document.getElementById('points').innerHTML = document.getElementById('point-range').value;

    intText = "";
    allocInterval = JSON.parse(document.getElementById('alloc-interval-range').value);
    switch (allocInterval) {
        case 0: intText = "Open"; break;
        case 1: intText = "1 Day"; break;
        case 2: intText = "2 Days"; break;
        case 3: intText = "3 Days"; break;
        case 4: intText = "7 Days"; break;
        case 5: intText = "14 Days"; break;
    }

    document.getElementById('alloc-interval').innerHTML = intText;
    saveLocal();
}

function setAreaOptions(area) {
    skipped[area] = []
    for (var i = 1; i <= public_bounds[area]; i++) {
        if (document.getElementById('skip' + i).checked) {
            skipped[area].push(i)
        }
    }

    if (document.getElementById('area-default').checked) {
        areaDiscretion[area] = "Default";
    } else if (document.getElementById('area-private').checked) {
        areaDiscretion[area] = "Private";
    } else if (document.getElementById('area-discrete').checked) {
        areaDiscretion[area] = "Discrete";
    } else {
        areaDiscretion[area] = "Public";
    }
    
    ReactDOM.render(habitList({area: area, prog: public_bounds[area]}), document.getElementById('optionsHabitPreview'))

    localStorage['SHTracker-skipped'] = JSON.stringify(skipped)
    localStorage['SHTracker-areaDiscretion'] = JSON.stringify(areaDiscretion)
}

function updateOptionElements() {
    document.getElementById('femwear-enabled').checked = enabledAreas["Feminine Wear"];
    document.getElementById('makeup-enabled').checked = enabledAreas["Makeup"];
    document.getElementById('hygiene-enabled').checked = enabledAreas["Hygiene"];
    document.getElementById('shaving-enabled').checked = enabledAreas["Shaving"];
    document.getElementById('nails-enabled').checked = enabledAreas["Nail Care"];
    document.getElementById('plugging-enabled').checked = enabledAreas["Plugging"];
    document.getElementById('submission-enabled').checked = enabledAreas["Submission"];
    document.getElementById('chastity-enabled').checked = enabledAreas["Chastity"];
    document.getElementById('exercise-enabled').checked = enabledAreas["Exercise"];
    document.getElementById('diet-enabled').checked = enabledAreas["Diet"];

    if (discretion == "Private") {
        document.getElementById('discretion-private').checked = true;
    } else if (discretion == "Discrete") {
        document.getElementById('discretion-discrete').checked = true;
    } else {
        document.getElementById('discretion-public').checked = true;
    }

    document.getElementById('allocation-random').checked = random;
    document.getElementById('benchmarks-enabled').checked = benchmarked;
    document.getElementById('previews-enabled').checked = previews;
    document.getElementById('daily-reset-range').value = dailyResetTime - 24
    document.getElementById('point-range').value = allocPoints;
    document.getElementById('alloc-interval-range').value = allocInterval;

    var timeTarget = dailyResetTime % 12
    resetTimeString = (timeTarget == 0 ? '12' : timeTarget) + (dailyResetTime >= 24 ? ' AM' : ' PM')
    document.getElementById('daily-reset-time').innerHTML = resetTimeString;

    document.getElementById('points').innerHTML = document.getElementById('point-range').value;

    intText = "";
    allocInterval = JSON.parse(document.getElementById('alloc-interval-range').value);
    switch (allocInterval) {
        case 0: intText = "Open"; break;
        case 1: intText = "1 Day"; break;
        case 2: intText = "2 Days"; break;
        case 3: intText = "3 Days"; break;
        case 4: intText = "7 Days"; break;
        case 5: intText = "14 Days"; break;
    }

    document.getElementById('alloc-interval').innerHTML = intText;
}

// return the next reset given a time and interval
function calcReset(last, interval, start=lastAlloc) {
    var lastReset = new Date(last); lastReset.setHours(dailyResetTime); lastReset.setMinutes(0); lastReset.setSeconds(0)

    var nextReset = new Date(lastReset)
    if (start < lastReset) { // last allocation occured before the reset on its day
        interval--
    }
    nextReset.setDate(nextReset.getDate() + interval )
    return nextReset
}

function calcResetsSince(last) {
    var lastReset = new Date(last); lastReset.setHours(dailyResetTime); lastReset.setMinutes(0); lastReset.setSeconds(0)
    var todayReset = new Date(); todayReset.setHours(dailyResetTime); todayReset.setMinutes(0); todayReset.setSeconds(0)

    var interval = (todayReset.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    if ((new Date()) < todayReset) { // currently before reset
        interval--
    }
    return Math.floor(Math.max(interval, 0))
}

// returns boolean for whether enough time has passed to allocate points.
function isAllocTime() {
    if (allocInterval == 0) {
        return true;
    }

    interval = 1 // 24 * 60 * 60 * 1000;
    switch (allocInterval) {
        case 1: break;
        case 2: interval *= 2; break;
        case 3: interval *= 3; break;
        case 4: interval *= 7; break;
        case 5: interval *= 14; break;
    }
    nextAlloc = calcReset(lastAlloc, interval)

    return nextAlloc <= (new Date());
}

function setAllocState() {
    if (!allocAvailable()) {
        return;
    }
    if (!isAllocTime()) {
        if (random) {
            document.getElementById("alloc-button").disabled = true;
        }

        interval = 1 // 24 * 60 * 60 * 1000;
        switch (allocInterval) {
            case 1: break;
            case 2: interval *= 2; break;
            case 3: interval *= 3; break;
            case 4: interval *= 7; break;
            case 5: interval *= 14; break;
        }
        nextAlloc = calcReset(lastAlloc, interval)
    
        document.getElementById("alloc-areas").innerHTML = "Your next allocation becomes available: " + nextAlloc.toLocaleString();
    }
}

/** 
 * Use this function as a script in the options HTML file to detect uploaded save files.
*/
function fileUpload() {
    const inputElement = document.getElementById("import-save");
    inputElement.addEventListener("change", importSave, false);
}

function importSave() {
    const save = this.files[0];
    fr = new FileReader()
    fr.readAsText(save);
    fr.onload = function () {
        saveData = JSON.parse(fr.result);
        for (const [key, value] of Object.entries(saveData)) {
            if (key.startsWith("SHTracker")) {
                localStorage[key] = value;
            }
        }
        loadLocal();
        assimilateSave();
        updateOptionElements();
    }
}

function saveAs(content, fileName) {
    const a = document.createElement("a");
    const isBlob = content.toString().indexOf("Blob") > -1;
    let url = content;
    if (isBlob) {
        url = window.URL.createObjectURL(content);
    }
    a.href = url;
    a.download = fileName;
    a.click();
    if (isBlob) {
        window.URL.revokeObjectURL(url);
    }
}

function objsEqual(obj1, obj2) {
    for (const key of Object.keys(obj1)) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}