/* Data Structures */
var cities = new Map();
var cityGraph = new Map(); // Adjacency List representation

/* User Data */
var userCities = {};
var userDataFlag = true;
var followers = [0, 0, 0, 0, 0] // General, Oral, Anal, Sissy, Bondage
var currentCity = "Paris";
var currentRolls = [0, 0, 0, 0]; // Oral, Anal, Sissy, Bondage rolls
var perfView = 0 // 0: Oral, 1: Anal - corresponds to currentRolls idx
var augView = 2 // 2: Sissy, 3: Bondage - corresponds to currentRolls idx
var activeAug = null // 2: Sissy, 3: Bondage - corresponds to currentRolls idx
var fusionView = false;

/* Constants */
const contractTypes = ["Oral", "Anal", "Sissy", "Bondage"]
const premiumTravel = 500; // large dotted line cost
const standardTravel = 300; // small dotted line cost
const marketTax = 100; // Tax paid to transfer regional markets
const citySpecBonus = 0.25; // 25% yield increase
const citySpecPenalty = 0.25; // 25% yield decrease

function initializeGame() {
    loadLocal();
    generateCities();
    generateConnections();
    generateMapNodes();
    
    if (!userDataFlag) {
        newCity();
    }

    generateCityPanel();
}

function newCity() {
    currentRolls = [
        randRange(1, 10, true),
        randRange(1, 10, true),
        randRange(1, 10, true),
        randRange(1, 10, true)
    ]
    localStorage["currentRolls"] = JSON.stringify(currentRolls);
}

function getYieldMods(city) {
    var yieldMods = [1, 1, 1, 1];

    if (city.special.includes("Oral") && city.market != "Northern") {
        yieldMods[0] += 0.25;
    } else {
        yieldMods[0] -= 0.25;
    }

    if (city.special.includes("Anal") && city.market != "Northern") {
        yieldMods[1] += 0.25;
    } else {
        yieldMods[1] -= 0.25;
    }

    if (city.special.includes("Sissy") && city.market != "Northern") {
        yieldMods[2] += 0.25;
    } else {
        yieldMods[2] -= 0.25;
    }

    if (city.special.includes("Bondage") && city.market != "Northern") {
        yieldMods[3] += 0.25;
    } else {
        yieldMods[3] -= 0.25;
    }

    yieldMods[0] += getRegionalMarketModifier(city.market, "Oral", activeAug != null);
    yieldMods[1] += getRegionalMarketModifier(city.market, "Anal", activeAug != null);
    yieldMods[2] += getRegionalMarketModifier(city.market, "Sissy", true);
    yieldMods[3] += getRegionalMarketModifier(city.market, "Bondage", true);
    
    return yieldMods;
}

function calculateStandardFollowerYield(city, cat, roll) {
    var followerYields = [0, 0, 0, 0, 0]; // General, Oral, Anal, Sissy, Bondage
    
    var yield = (10 + 2 * roll) * getDiminishingReturnModifier(userCities[city].posts);
    var yieldMods = getYieldMods(cities.get(city));

    if (cat == "Oral") {
        yield *= yieldMods[0];
        followerYields[1] = Math.ceil(yield / 2);
    } else if (cat == "Anal") {
        yield *= yieldMods[1];
        followerYields[2] = Math.ceil(yield / 2);
    } else if (cat == "Sissy") {
        yield *= yieldMods[2];
        followerYields[3] = Math.ceil(yield / 2);
    } else {
        yield *= yieldMods[3];
        followerYields[4] = Math.ceil(yield / 2);
    }
    followerYields[0] = Math.floor(yield / 2);

    return followerYields;
}

function completeStandardPost(perfCat, perfRoll, augCat, augRoll) {
    var perfYields = calculateStandardFollowerYield(currentCity, perfCat, perfRoll)
    if (augCat != null) {
        var augYields = calculateStandardFollowerYield(currentCity, augCat, augRoll)
    }
    
    for (var i = 0; i < followers.length; i++) {
        followers[i] += perfYields[i] + augYields[i]
    }

    currentRolls[contractTypes.indexOf(perfCat)] = randRange(1, 10, true);
    currentRolls[contractTypes.indexOf(augCat)] = randRange(1, 10, true);
    activeAug = null;
    userCities[currentCity]["posts"] += 1;

    localStorage["userCities"] = JSON.stringify(userCities);
    localStorage["followers"] = JSON.stringify(followers);
    localStorage["currentRolls"] = JSON.stringify(currentRolls);
    localStorage["activeAug"] = activeAug;
    
    generateCityPanel();
}

function completeFusionPost(city) {
    var followerYield = [0, 0, 0, 0, 0];
    switch (city) {
        case "London":
            followerYield[1] = 50;
            followerYield[3] = 50;
            break;
        case "Madrid":
            followerYield[2] = 50;
            followerYield[3] = 50;
            break;
        case "Paris":
            followerYield[1] = 50;
            followerYield[2] = 50;
            break;
        case "Berlin":
            followerYield[2] = 50;
            followerYield[4] = 50;
            break;
        case "Rome":
            followerYield[1] = 50;
            followerYield[4] = 50;
            break;
        case "Budapest":
            followerYield[3] = 50;
            followerYield[4] = 50;
            break;
    }

    for (var i = 0; i < followers.length; i++) {
        followers[i] += followerYield[i];
    }

    userCities[currentCity]["posts"] += 1;
    userCities[currentCity]["fusionAvailable"] = false;
    fusionView = false;

    localStorage["userCities"] = JSON.stringify(userCities);
    localStorage["followers"] = JSON.stringify(followers);
    localStorage["fusionView"] = fusionView
    generateCityPanel();
}

function getDiminishingReturnModifier(posts) {
    switch (posts) {
        case 0: return 1;
        case 1: return 0.9;
        case 2: return 0.5;
        case 3: return 0.25;
        default: return 0.1;
    }
}

function getRegionalMarketModifier(market, category, hasAug) {
    // Northern market has been omitted as it will be considered when item modifiers are evaluated.
    switch (market) {
        case "Anglo":
            if (category == "Oral") {
                return 2;
            } break;
        case "Iberian":
            if (category == "Sissy") {
                return 2;
            } break;
        case "French":
            if (category == "Oral" || category == "Anal") {
                return 0.5;
            } break;
        case "Germanic":
            if (category == "Anal") {
                return 2;
            } break;
        case "Greco-Roman":
            if (category == "Bondage") {
                return 2;
            } break;
        case "Eastern":
            if (hasAug) {
                return 1;
            } else {
                return -0.5;
            } break;
        default:
            return 0;
    }
    return 0;
}

