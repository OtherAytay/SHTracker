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
    localStorage["SHTracker-enabledAreas"] = JSON.stringify(enabledAreas);
    localStorage["SHTracker-allocPoints"] = allocPoints;
    localStorage["SHTracker-allocInterval"] = allocInterval;
    localStorage["SHTracker-lastAlloc"] = lastAlloc;
    localStorage["SHTracker-allocsRemaining"] = allocsRemaining;
    localStorage["SHTracker-dailyTrackers"] = JSON.stringify(dailyTrackers);
    localStorage["SHTracker-periodicTrackers"] = JSON.stringify(periodicTrackers);
}

function loadLocal() {
    if (localStorage["SHTracker-localSave"] == "true") {
        prog = JSON.parse(localStorage["SHTracker-prog"]);
        discretion = localStorage["SHTracker-discretion"];
        benchmarked = JSON.parse(localStorage["SHTracker-benchmarked"]);
        random = JSON.parse(localStorage["SHTracker-random"]);
        enabledAreas = JSON.parse(localStorage["SHTracker-enabledAreas"]);
        allocPoints = JSON.parse(localStorage["SHTracker-allocPoints"]);
        allocInterval = JSON.parse(localStorage["SHTracker-allocInterval"]);
        lastAlloc = JSON.parse(localStorage["SHTracker-lastAlloc"]);
        allocsRemaining = JSON.parse(localStorage["SHTracker-allocsRemaining"]);
        dailyTrackers = JSON.parse(localStorage['SHTracker-dailyTrackers'])
        periodicTrackers = JSON.parse(localStorage['SHTracker-periodicTrackers'])
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

    // Reset to defaults
    prog = { "Feminine Wear": 0, Makeup: 0, Hygiene: 0, Shaving: 0, "Nail Care": 0, Plugging: 0, Submission: 0, Chastity: 0, Exercise: 0, Diet: 0 };
    discretion = "Public";
    benchmarked = true;
    random = true;
    enabledAreas = { "Feminine Wear": true, Makeup: true, Hygiene: true, Shaving: true, "Nail Care": true, Plugging: true, Submission: true, Chastity: true, Exercise: true, Diet: true};
    allocPoints = 1;
    allocInterval = 1; // 1: 1 day, 2: 2 days, 3: 3 days, 4: 7 days, 5: 14 days
    lastAlloc = false;
    allocsRemaining = allocPoints;
    updateOptionElements();
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
        discretion = "Public";
    } else if (document.getElementById('discretion-discrete').checked) {
        discretion = "Discrete";
    } else {
        discretion = "Public";
    }
    random = document.getElementById('allocation-random').checked;
    benchmarked = document.getElementById('benchmarks-enabled').checked;
    var oldAllocPoints = allocPoints;
    allocPoints = JSON.parse(document.getElementById('point-range').value);
    // new allocsRemaining will be the new allocPoints - points used already.
    allocsRemaining = Math.max(0, allocPoints - (oldAllocPoints - allocsRemaining));  
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
    document.getElementById('point-range').value = allocPoints;
    document.getElementById('alloc-interval-range').value = allocInterval;

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

// returns boolean for whether enough time has passed to allocate points.
function isAllocTime() {
    if (allocInterval == 0) {
        return true;
    }
    
    time = new Date()

    interval = 24 * 60 * 60 * 1000;
    switch (allocInterval) {
        case 1: break;
        case 2: interval *= 2; break;
        case 3: interval *= 3; break;
        case 4: interval *= 7; break;
        case 5: interval *= 14; break;
    }

    return lastAlloc + interval <= time.getTime();
}

function setAllocState() {
    if (!allocAvailable()) {
        return;
    }
    if (!isAllocTime()) {
        if (random) {
            document.getElementById("alloc-button").disabled = true;
        }

        var interval = 24 * 60 * 60 * 1000;
        switch (allocInterval) {
            case 1: break;
            case 2: interval *= 2; break;
            case 3: interval *= 3; break;
            case 4: interval *= 7; break;
            case 5: interval *= 14; break;
        }
        var nextAlloc = new Date(lastAlloc + interval)
        nextAlloc = nextAlloc.toISOString().slice(0, 10) + " " + nextAlloc.toTimeString().slice(0, 8)
        document.getElementById("alloc-areas").innerHTML = "Your next allocation becomes available: " + nextAlloc;
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