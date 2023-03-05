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
    localStorage["prog"] = JSON.stringify(prog);
    localStorage["discretion"] = discretion;
    localStorage["benchmarked"] = benchmarked;
    localStorage["random"] = random;
    localStorage["enabledAreas"] = JSON.stringify(enabledAreas);
    localStorage["allocPoints"] = allocPoints;
}

function loadLocal() {
    if (localStorage.length >= 6) {
        prog = JSON.parse(localStorage["prog"]);
        discretion = localStorage["discretion"];
        benchmarked = JSON.parse(localStorage["benchmarked"]);
        random = JSON.parse(localStorage["random"]);
        enabledAreas = JSON.parse(localStorage["enabledAreas"]);
        allocPoints = JSON.parse(localStorage["allocPoints"]);
    } else {
        userDataFlag = false;
        saveLocal(); // Create fresh save using defaults
    }
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
        case areaNames.indexOf("Feminine Wear"):
        case areaNames.indexOf("Makeup"):
        case areaNames.indexOf("Hygiene"):
        case areaNames.indexOf("Shaving"):
        case areaNames.indexOf("Nail Care"):
            return "feminization";
        case areaNames.indexOf("Plugging"):
        case areaNames.indexOf("Submission"):
        case areaNames.indexOf("Chastity"):
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

    if (document.getElementById('discretion-private').checked) {
        discretion = "Public";
    } else if (document.getElementById('discretion-discrete').checked) {
        discretion = "Discrete";
    } else {
        discretion = "Public";
    }
    random = document.getElementById('allocation-random').checked;
    benchmarked = document.getElementById('benchmarks-enabled').checked;
    allocPoints = document.getElementById('point-range').value;
    changePoints();
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
    changePoints();
}

function changePoints() {
    document.getElementById('points').innerHTML = document.getElementById('point-range').value;
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
            localStorage[key] = value;
        }
        loadLocal();
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