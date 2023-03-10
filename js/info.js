/*--- Constants ---*/
// Encode benchmark boundaries
const benchmarks = 4; // number of benchmarks
const bench1 = { "Feminine Wear": 2, Makeup: 2, Hygiene: 3, Shaving: 1, "Nail Care": 2, Plugging: 3, Submission: 2, Chastity: 2, Exercise: 2, Diet: 2 };
const bench2 = { "Feminine Wear": 4, Makeup: 4, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 4, Submission: 5, Chastity: 4, Exercise: 4, Diet: 4 };
const bench3 = { "Feminine Wear": 7, Makeup: 6, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 5, Submission: 6, Chastity: 6, Exercise: 6, Diet: 6 };
const bench4 = { "Feminine Wear": 9, Makeup: 6, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 8, Submission: 9, Chastity: 8, Exercise: 8, Diet: 8 };

// Encode discretion boundaries
const private_bounds = { "Feminine Wear": 5, Makeup: 4, Hygiene: 5, Shaving: 2, "Nail Care": 1, Plugging: 5, Submission: 7, Chastity: 6, Exercise: 8, Diet: 8 };
const discrete_bounds = { "Feminine Wear": 6, Makeup: 4, Hygiene: 5, Shaving: 3, "Nail Care": 3, Plugging: 8, Submission: 8, Chastity: 7, Exercise: 8, Diet: 8 };
const public_bounds = { "Feminine Wear": 9, Makeup: 6, Hygiene: 5, Shaving: 4, "Nail Care": 4, Plugging: 8, Submission: 9, Chastity: 8, Exercise: 8, Diet: 8 };

const areaNames = [
    "Feminine Wear", 
    "Makeup",       
    "Hygiene",      
    "Shaving",
    "Chastity",   
    "Submission",  
    "Plugging", 
    "Nail Care",
    "Exercise",
    "Diet"      
];
const numAreas = areaNames.length; // number of lifestyle areas

/* User Data */
var userDataFlag = true;
var prog = { "Feminine Wear": 0, Makeup: 0, Hygiene: 0, Shaving: 0, "Nail Care": 0, Plugging: 0, Submission: 0, Chastity: 0, Exercise: 0, Diet: 0 }; // progress level of each area
var discretion = "Private";
var benchmarked = true;
var random = true;
var enabledAreas = { "Feminine Wear": true, Makeup: true, Hygiene: true, Shaving: true, "Nail Care": true, Plugging: true, Submission: true, Chastity: true, Exercise: true, Diet: true};
var allocPoints = 1;
var allocInterval = 1; // 1: 1 day, 2: 2 days, 3: 3 days, 4: 7 days, 5: 14 days
var lastAlloc = false;
var allocsRemaining = allocPoints;

function allocatePoint(area) {
    // Allocate point to the chosen area
    prog[area] += 1;
    generateHabitCards();
    if (--allocsRemaining == 0) {
        lastAlloc = (new Date()).getTime();
        setAllocState();
        allocsRemaining = allocPoints;
    }
    saveLocal();
}

function randomAllocation(points) {
    var availableAreas = getAvailableAreas();
    var areasAllocated = [];

    if (!allocAvailable()) {
        return;
    }

    while (availableAreas.length > 0 && points > 0) {
        var chosenIdx = randRange(0, availableAreas.length - 1, true);
        var chosenArea = availableAreas[chosenIdx];
        areasAllocated.push(chosenArea);
        prog[chosenArea] += 1;
        points--;
        availableAreas.splice(chosenIdx, 1); // remove that area from the list once
    }

    lastAlloc = (new Date()).getTime();
    setAllocState();

    allocText = areasAllocated[0];
    for (var i = 1; i < areasAllocated.length; i++) {
        allocText += ", " + areasAllocated[i];
    }

    document.getElementById("alloc-areas").innerHTML = allocText;
    generateHabitCards();
    saveLocal();

    // Available areas exhausted before points, boundary reached - run again.
    if (points > 0) {
        return areasAllocated.concat(randomAllocation(points - availableAreas.length));
    }
}

function allocAvailable() {
    if (getAvailableAreas().length == 0) {
        document.getElementById("alloc-areas").innerHTML = "No more points can be assigned!";
        document.getElementById("alloc-button").disabled = true; 
        generateHabitCards();
        return false;
    } else {
        return true;
    }
}

function getAvailableAreas() {
    // Determine current boundaries
    var boundaries = JSON.parse(JSON.stringify(getDiscretionBoundaries())); // creates a shallow copy of the boundary

    // If all areas are at the discretion boundary


    // Merge discretion and benchmark boundaries, if relevant
    if (benchmarked) {
        var currentBench = determineBenchmark();
        for (var i = 0; i < numAreas; i++) {
            area = areaNames[i]
            boundaries[area] = Math.min(boundaries[area], currentBench[area]);
        }
    }

    if (objsEqual(prog, boundaries)) {
        
    }

    // Determine which areas that can be allocated to
    var availableAreas = [];
    for (var i = 0; i < numAreas; i++) {
        area = areaNames[i]
        if (enabledAreas[area] && prog[area] < boundaries[area]) {
            // Add the area once for every level it is below a boundary.
            // This allows for multiple point allocations in a cycle.
            for (var j = prog[area]; j < boundaries[area]; j++) {
                availableAreas.push(area);
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
    // Determine current benchmark by stepping up at benchmark divisions
    var benches = [bench1, bench2, bench3, bench4]

    benchIdx = 0;
    var stepUp = true;
    while (stepUp == true && benchIdx < 4) {
        var targetBench = benches[benchIdx]
        for (var i = 0; i < numAreas; i++) {
            area = areaNames[i]
            if (enabledAreas[area] && prog[area] < targetBench[area]) {
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


function getHabit(area, level) {
    switch (area) {
        case "Feminine Wear": return getFemWear(level);
        case "Makeup": return getMakeup(level);
        case "Hygiene": return getHygiene(level);
        case "Shaving": return getShaving(level);
        case "Nail Care": return getNails(level);
        case "Plugging": return getPlugging(level);
        case "Submission": return getSubmission(level);
        case "Chastity": return getChastity(level);
        case "Exercise": return getExercise(level);
        case "Diet": return getDiet(level);
    }
}

function getAllDiscretionBoundaries() {
    var disc_bounds = []
    if (discretion == "Private") {
        disc_bounds.push(private_bounds);
    } else if (discretion == "Discrete") {
        disc_bounds.push(private_bounds);
        disc_bounds.push(discrete_bounds);
    } else {
        disc_bounds.push(private_bounds);
        disc_bounds.push(discrete_bounds);
        disc_bounds.push(public_bounds);
    }
    return disc_bounds;
}

function boundCoding(boundType) {
    if (boundType.startsWith("Benchmark")) {
        return "benchmark";
    } else if (boundType == "Private") {
        return "private";
    } else if (boundType == "Discrete") {
        return "discrete";
    } else if (boundType == "Public") {
        return "public";
    }
}

/* Data Retrieval */

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
            return "Apply eye primer, eyeshadow, eye liner and mascara for 3 hours each day in private and during sexual activities.";
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
            return "Stay in chastity for 1 hour each day in private. Max 4 orgasms per week. Orgasm from anal does not count against your restrictions for all habits in this area!";
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

function getExercise(level) {
    switch (level) {
        case 1:
            return "Do 120 minutes of cardio per week.";
            break;
        case 2:
            return "Complete 2 sets of 3 different butt popping exercises.";
            break;
        case 3:
            return "Do 150 minutes of cardio workout per week.";
            break;
        case 4:
            return "Complete 3 sets of 3 different butt popping exercises. ";
            break;
        case 5:
            return "Do 180 minutes of cardio per week.";
            break;
        case 6:
            return "Complete 3 sets of 4 different butt popping exercises. "
            break;
        case 7:
            return "Do 240 minutes of cardio per week."
            break;
        case 8:
            return "Complete 3 sets of 5 different butt popping exercises. "
            break;
    }
}

function getDiet(level) {
    switch (level) {
        case 1:
            return "Limit sweets and sugary beverages to 4 times per week each.";
            break;
        case 2:
            return "Eat only vegetarian meals 2 days per week.";
            break;
        case 3:
            return "Limit sweets and sugary beverages to 2 times per week each.";
            break;
        case 4:
            return "Change all unhealthy snacks for healthier alternatives (such as fruits or vegetables).";
            break;
        case 5:
            return "Limit sweets and sugary beverages to 1 time per week each.";
            break;
        case 6:
            return "Limit red meat to 1 meal per week."
            break;
        case 7:
            return "Do not eat between dinner / dessert and breakfast."
            break;
        case 8:
            return "Cut out sugary beverages and alcohol, drink only water or seltzer."
            break;
    }
}