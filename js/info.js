/*--- Constants ---*/
// Encode benchmark boundaries
const benchmarks = 4; // number of benchmarks
const bench1 = { "Feminine Wear": 2, Makeup: 2, Hygiene: 3, Shaving: 1, "Nail Care": 2, Plugging: 3, Submission: 2, Chastity: 2 }
const bench2 = { "Feminine Wear": 4, Makeup: 4, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 4, Submission: 5, Chastity: 4 }
const bench3 = { "Feminine Wear": 7, Makeup: 6, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 5, Submission: 6, Chastity: 6 }
const bench4 = { "Feminine Wear": 9, Makeup: 6, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 8, Submission: 9, Chastity: 8 }

// Encode discretion boundaries
const private_bounds = { "Feminine Wear": 5, Makeup: 4, Hygiene: 5, Shaving: 2, "Nail Care": 1, Plugging: 5, Submission: 7, Chastity: 6 }
const discrete_bounds = { "Feminine Wear": 6, Makeup: 4, Hygiene: 5, Shaving: 3, "Nail Care": 3, Plugging: 8, Submission: 8, Chastity: 7 }
const public_bounds =  { "Feminine Wear": 9, Makeup: 6, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 8, Submission: 9, Chastity: 8 }

// Lifestyle Area variables
// const areaNames = [
//     "Feminine Wear", 
//     "Makeup",       
//     "Hygiene",      
//     "Shaving",      
//     "Nail Care",    
//     "Plugging",     
//     "Submission",   
//     "Chastity"       
// ];
const areaNames = [
    "Feminine Wear", 
    "Makeup",       
    "Hygiene",      
    "Shaving",
    "Chastity",   
    "Submission",  
    "Plugging", 
    "Nail Care",      
];

const numAreas = areaNames.length; // number of lifestyle areas

/* User Data */
var userDataFlag = true;
var prog = { "Feminine Wear": 0, Makeup: 0, Hygiene: 0, Shaving: 0, "Nail Care": 0, Plugging: 0, Submission: 0, Chastity: 0 }; // progress level of each area
prog = { "Feminine Wear": 9, Makeup: 6, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 8, Submission: 9, Chastity: 8 };
var discretion = "Public";
var benchmarked = true;
var random = true;
var enabledAreas = { "Feminine Wear": true, Makeup: true, Hygiene: true, Shaving: true, "Nail Care": true, Plugging: true, Submission: true, Chastity: true};
var allocPoints = 1;

function viewHabits() {
    for (var area = 0; area < numAreas; area++) {
        if (enabledAreas[area]) {
            var habitDetails = areaNames[area];
            for (var level = 1; level <= prog[area]; level++) {
                habitDetails += "\n" + level + ". " + getTaskDetails(area, level);
            }
            setVariable("habit-details", habitDetails);
            callAction({ "type": "updateTease", "part": "text", "location": "main", "delay": "none", "text": { "ops": [{ "insert": "{habit-details}" }, { "attributes": { "align": "center" }, "insert": "\n" }] } }, true);
        }
    }

    // Provide button to return the main menu
    callAction({ "type": "updateTease", "part": "input", "inputType": "buttons", "buttons": [{ "name": "Main Menu", "action": null, "setVariable": true, "variable": "main-menu", "variableValue": true }] }, true);
    if (getVariable("main-menu")) {
        setVariable("main-menu", false);
        mainMenu();
    }
}

function allocatePoints() {
    // Show instructions text
    callAction({ "type": "updateTease", "part": "text", "location": "main", "delay": "none", "text": { "ops": [{ "insert": "You have chosen to allocate your next {points} points. If your points are being allocated randomly, your new point allocations will show below. If you are choosing your points, use the buttons that will appear below. The areas that points can be allocated to are determined according to benchmarks (if enabled) and discretion." }, { "attributes": { "align": "center" }, "insert": "\n\n" }] }, "clear": true }, true);

    var areasAllocated = [];

    if (getVariable("progress-method") == "Choice") {
        areasAllocated = choiceAllocation(getVariable("points"));
    } else { // Progress method is random
        areasAllocated = randomAllocation(getVariable("points"));
    }

    if (areasAllocated != null) {
        areasAllocated.sort();
    } else {
        // Provide button to return the main menu
        callAction({ "type": "updateTease", "part": "input", "inputType": "buttons", "buttons": [{ "name": "Main Menu", "action": null, "setVariable": true, "variable": "main-menu", "variableValue": true }] }, true);
        if (getVariable("main-menu")) {
            setVariable("main-menu", false);
            mainMenu();
        }
        return;
    }

    var allocationDetails = "";

    var currArea = -1;
    var areaPoints = 0;
    for (var i = 0; i < areasAllocated.length; i++) {
        if (areasAllocated[i] != currArea) {
            if (currArea != -1) {
                allocationDetails += areaNames[currArea] + " +" + areaPoints + ", ";
            }

            currArea = areasAllocated[i];
            areaPoints = 1;

            // If last in list
            if (i + 1 == areasAllocated.length && currArea != -1) {
                allocationDetails += areaNames[currArea] + " +" + areaPoints;
            }
        } else {
            areaPoints++;
        }
    }
    // Show allocation details text
    setVariable("allocation-details", allocationDetails);
    callAction({ "type": "updateTease", "part": "text", "location": "main", "delay": "none", "text": { "ops": [{ "insert": "Your points have been allocated as follows: {allocation-details}" }, { "attributes": { "align": "center" }, "insert": "\n" }] } }, true);

    encodeSave(); // sets the Xtoys variable automatically
    callAction({ "type": "updateTease", "part": "text", "location": "main", "delay": "none", "text": { "ops": [{ "insert": "Your updated save string is: {save-string}. Keep this somewhere safe!" }, { "attributes": { "align": "center" }, "insert": "\n" }] } }, true);

    // Provide button to return the main menu
    callAction({ "type": "updateTease", "part": "input", "inputType": "buttons", "buttons": [{ "name": "Main Menu", "action": null, "setVariable": true, "variable": "main-menu", "variableValue": true }] }, true);
    if (getVariable("main-menu")) {
        setVariable("main-menu", false);
        mainMenu();
    }
}

function choiceAllocation(points) {
    var availableAreas = getAvailableAreas();
    var areasAllocated = [];

    if (availableAreas.length == 0) {
        callAction({ "type": "updateTease", "part": "text", "location": "main", "delay": "none", "text": { "ops": [{ "insert": "You have completed all possible habits available based on your settings!" }, { "attributes": { "align": "center" }, "insert": "\n" }] } }, true);
        return [-1];
    }

    // Set meta variables for Xtoys
    setVariable("femwear-available", availableAreas.indexOf(0) >= 0);
    setVariable("makeup-available", availableAreas.indexOf(1) >= 0);
    setVariable("hygiene-available", availableAreas.indexOf(2) >= 0);
    setVariable("shaving-available", availableAreas.indexOf(3) >= 0);
    setVariable("nails-available", availableAreas.indexOf(4) >= 0);
    setVariable("plugging-available", availableAreas.indexOf(5) >= 0);
    setVariable("submission-available", availableAreas.indexOf(6) >= 0);
    setVariable("chastity-available", availableAreas.indexOf(7) >= 0);

    // Present choice buttons to user
    callAction({ "type": "updateTease", "part": "input", "inputType": "buttons", "buttons": [{ "name": "Feminine Wear", "action": null, "setVariable": true, "goToPage": null, "canHide": true, "showIf": "{femwear-available}", "variable": "allocation-area", "variableValue": "0" }, { "name": "Makeup", "action": null, "setVariable": true, "canHide": true, "variable": "allocation-area", "variableValue": "1", "showIf": "{makeup-available}" }, { "name": "Hygiene", "action": null, "setVariable": true, "variable": "allocation-area", "variableValue": "2", "canHide": true, "showIf": "{hygiene-available}" }, { "name": "Shaving", "action": null, "setVariable": true, "variable": "allocation-area", "variableValue": "3", "canHide": true, "showIf": "{shaving-available}" }, { "name": "Nail Care", "action": null, "setVariable": true, "canHide": true, "variable": "allocation-area", "variableValue": "4", "showIf": "{nails-available}" }, { "name": "Plugging", "action": null, "setVariable": true, "variable": "allocation-area", "variableValue": "5", "canHide": true, "showIf": "{plugging-available}" }, { "name": "Submission", "action": null, "setVariable": true, "variable": "allocation-area", "variableValue": "6", "canHide": true, "showIf": "{submission-available}" }, { "name": "Chastity", "action": null, "setVariable": true, "canHide": true, "variable": "allocation-area", "variableValue": "7", "showIf": "{chastity-available}" }] }, true);

    // Allocate point to the chosen area
    prog[getVariable("allocation-area")] += 1;
    areasAllocated.push(getVariable("allocation-area"));

    // If there are still points to allocate, go again.
    if (points - 1 > 0) {
        return areasAllocated.concat(choiceAllocation(points - 1));
    }
    return areasAllocated;
}

function randomAllocation(points) {
    var availableAreas = getAvailableAreas();
    var areasAllocated = [];

    if (availableAreas.length == 0) {
        return [-1];
    }

    while (availableAreas.length > 0 && points > 0) {
        var chosenIdx = randRange(0, availableAreas.length - 1, true);
        var chosenArea = availableAreas[chosenIdx];
        areasAllocated.push(chosenArea);
        prog[chosenArea] += 1;
        points--;
        availableAreas.splice(chosenIdx, 1); // remove that area from the list once
    }

    // Available areas exhausted before points, boundary reached - run again.
    if (points > 0) {
        return areasAllocated.concat(randomAllocation(points - availableAreas.length));
    }
    return areasAllocated;
}

function getAvailableAreas() {
    // Determine current boundaries
    var boundaries = getDiscretionBoundaries().slice();

    // If all areas are at the discretion boundary
    if (prog == boundaries) {

    }

    // Merge discretion and benchmark boundaries, if relevant
    if (benchmarked) {
        var currentBench = determineBenchmark();
        for (var i = 0; i < numAreas; i++) {
            boundaries[i] = Math.min(boundaries[i], currentBench[i]);
        }
    }

    // Determine which areas that can be allocated to
    var availableAreas = [];
    for (var i = 0; i < numAreas; i++) {
        if (enabledAreas[i] && prog[i] < boundaries[i]) {
            // Add the area once for every level it is below a boundary.
            // This allows for multiple point allocations in a cycle.
            for (var j = prog[i]; j < boundaries[i]; j++) {
                availableAreas.push(i);
            }
        }
    }
    return availableAreas;
}

/* --- Helper Functions --- */

function getDiscretionBoundaries() {
    if (discretion == "Private") {
        return private_bounds;
    } else if (discretion == "Discrete") {
        return discrete_bounds;
    } else { // discretion is public
        return public_bounds;
    }
}

function determineBenchmark() {
    var discretionBoundaries = getDiscretionBoundaries();
    // Determine current benchmark by stepping up at benchmark divisions
    var benches = [bench1, bench2, bench3, bench4]

    benchIdx = 0;
    var stepUp = true;
    while (stepUp == true && benchIdx < 4) {
        var targetBench = benches[benchIdx]
        for (var i = 0; i < numAreas; i++) {
            if (enabledAreas[i] && prog[i] != discretionBoundaries[i] && prog[i] < targetBench[i]) {
                stepUp = false;
                break;
            }
        }
        benchIdx++;

    }
    return targetBench;
}

function randRange(min, max, integer) {
    if (integer) {
        return Math.floor(Math.random() * ((max - min) + 1) + min);
    } else {
        return Math.random() * ((max - min) + 1) + min;
    }
}

/* Data Retrieval */

function getTaskDetails(area, level) {
    switch (area) {
        case 0:
            return getFemWear(level);
        case 1:
            return getMakeup(level);
        case 2:
            return getHygiene(level);
        case 3:
            return getShaving(level);
        case 4:
            return getNails(level);
        case 5:
            return getPlugging(level);
        case 6:
            return getSubmission(level);
        case 7:
            return getChastity(level);
    }
}

function getFemWear(level) {
    switch (level) {
        case 1:
            return "Wear panties at all times in private.";
            break;
        case 2:
            return "Wear a bra at all times in private.";
            break;
        case 3:
            return "Wear a feminine top and bottom at all times in private.";
            break;
        case 4:
            return "Wear women's jewelry at all times in private.";
            break;
        case 5:
            return "Wear a matching lingerie set during sexual activities.";
            break;
        case 6:
            return "Wear panties at all times. Optional: Get your ears pierced and wear earrings.";
            break;
        case 7:
            return "Wear a bra at all times.";
            break;
        case 8:
            return "Wear women's jewelry at all times.";
            break;
        case 9:
            return "Wear a feminine top and bottom at all times.";
            break;
    }
}

function getMakeup(level) {
    switch (level) {
        case 1:
            return "Apply lipstick & lip gloss for 3 hours each day in private and during sexual activities.";
            break;
        case 2:
            return "Apply eye primer, eyeshadow, eye liner and mascara for 3 hours each day in private and during sexual activities. (Benchmark #1)";
            break;
        case 3:
            return "Apply foundation, concealer, and blush for 3 hours each day in private and during sexual activities.";
            break;
        case 4:
            return "Apply makeup at all times in private.";
            break;
        case 5:
            return "Apply light, natural makeup in public.";
            break;
        case 6:
            return "Apply heavy, beautifying makeup in public.";
            break;
    }
}

function getHygiene(level) {
    switch (level) {
        case 1:
            return "Use facial cleanser once per day. Recommended at end of or after shower.";
            break;
        case 2:
            return "Use moisturizer once per day. Recommended at end of or after shower.";
            break;
        case 3:
            return "Use face exfoliating scrub twice per week. Recommended at end of or after shower.";
            break;
        case 4:
            return "Use eye cream once per day. Recommended at night before going to bed.";
            break;
        case 5:
            return "Use facemask once per week. Recommended at night before going to bed.";
            break;
    }
}

function getShaving(level) {
    switch (level) {
        case 1:
            return "Shave groin and butt three times per week.";
            break;
        case 2:
            return "Shave chest and back twice per week.";
            break;
        case 3:
            return "Shave facial hair every day.";
            break;
        case 4:
            return "Shave arms & legs once per week.";
            break;
    }
}

function getNails(level) {
    switch (level) {
        case 1:
            return "Grow nails out to fingertips and file them round.";
            break;
        case 2:
            return "Apply clear polish.";
            break;
        case 3:
            return "Apply colored polish.";
            break;
        case 4:
            return "Apply only traditionally feminine colored polish.";
            break;
    }
}

function getPlugging(level) {
    switch (level) {
        case 1:
            return "Stay plugged for 1 hour each day in private.";
            break;
        case 2:
            return "Stay plugged for 2 hours each day in private.";
            break;
        case 3:
            return "Stay plugged for 4 hours each day in private.";
            break;
        case 4:
            return "Stay plugged for 8 hours each day in private.";
            break;
        case 5:
            return "Stay plugged while not sleeping in private.";
            break;
        case 6:
            return "Stay plugged at all times in private.";
            break;
        case 7:
            return "Stay plugged for short outings (e.g. brief errands).";
            break;
        case 8:
            return "Stay plugged at all times. Be sure to pack lube, wipes, and a ziploc!";
            break;
    }
}

function getSubmission(level) {
    switch (level) {
        case 1:
            return "Wear a light collar at all times in private.";
            break;
        case 2:
            return "Wear light wrist and ankle cuffs at all times in private.";
            break;
        case 3:
            return "Bind yourself in a tight body harness (on torso and crotch) during sexual activities.";
            break;
        case 4:
            return "Use a mouth gag and nipple clamps as appropriate during sexual activities.";
            break;
        case 5:
            return "Wear a heavy collar at all times in private.";
            break;
        case 6:
            return "Wear heavy wrist and ankle cuffs at all times in private.";
            break;
        case 7:
            return "Bind your wrists together and ankles together with a short rope or chain at night.";
            break;
        case 8:
            return "Wear a day collar at all times. A day collar is a tight-fitting choker or necklace that looks like normal jewelry.";
            break;
        case 9:
            return "Wear a light collar at all times.";
            break;
    }
}

function getChastity(level) {
    switch (level) {
        case 1:
            return "Stay in chastity for 1 hour each day in private. Max 4 orgasms per week. Orgasm from anal does not count against your restrictions for all chastity tasks in this area!";
            break;
        case 2:
            return "Stay in chastity for 2 hours each day in private. Max 2 orgasms per week.";
            break;
        case 3:
            return "Stay in chastity for 4 hours each day in private. Max 1 orgasm per week.";
            break;
        case 4:
            return "Stay in chastity for 8 hours each day in private. Max 1 orgasm per 2 weeks.";
            break;
        case 5:
            return "Stay in chastity while not sleeping in private. Max 1 orgasm per 2 weeks.";
            break;
        case 6:
            return "Stay in chastity at all times while in private. Max 1 orgasm per month."
            break;
        case 7:
            return "Stay in chastity for short outings (e.g. brief errands). Max 1 orgasm per month."
            break;
        case 8:
            return "Stay in chastity at all times. No non-anal orgasms allowed."
            break;
    }
}