function generateHabitCards() {
    const habitRoot = ReactDOM.createRoot(document.getElementById("habits"));
    
    var habitCards = []
    for (var area = 0; area < numAreas; area++) {
        habitCards.push(React.createElement(
            habitCard, {area: area, prog: prog[areaNames[area]]} 
        ))
    }

    habitRoot.render(habitCards);
}

function habitCard({ area, prog }) {
    var areaCode = areaCoding(area)

    var habits = habitList({ area: area, prog: prog })

    var alloc;
    if (!random && getAvailableAreas().includes(area)) {
        alloc = (
            React.createElement(
                'div',
                { class: "card-footer text-center border-" + areaCode },
                React.createElement(
                    'button',
                    {
                        class: "btn fs-4 btn-" + areaCode,
                        onClick: () => { console.log(area) }
                    },
                    "Allocate Point"
                )
            )
        )
    }

    return (
        React.createElement(
            'div',
            { class: "col-xl-3 col-lg-4 col-md-6 col-sm-12" },
            React.createElement(
                'div',
                { class: "card mb-3 border-" + areaCode },
                React.createElement(
                    'h3',
                    { class: "card-title card-header text-center border-" + areaCode + " text-bg-" + areaCode },
                    areaNames[area]
                ),
                React.createElement(
                    'div',
                    { class: "card-body" },
                    habits
                ),
                alloc
            )
        )
    )
}

function habitList({ area, prog }) {
    var disc_bounds = getAllDiscretionBoundaries();
    var areaCode = areaCoding(area)
    var benches = [bench1, bench2, bench3, bench4]
    var allBounds = [
        {
            type: "Benchmark #1",
            bound: bench1[areaNames[area]]
        }
    ]

    // Add discretion boundaries
    var discretionNames = ["Private", "Discrete", "Public"]
    for (var i = 0; i < disc_bounds.length; i++) {
        allBounds.push({
            type: discretionNames[i],
            bound: disc_bounds[i][areaNames[area]]
        })
    }

    // Add benchmark boundaries
    if (benchmarked) {
        for (var i = 1; i < benches.length; i++) {
            if (benches[i - 1][areaNames[area]] == benches[i][areaNames[area]]) {
                break;
            }
    
            allBounds.push({
                type: "Benchmark #" + (i + 1),
                bound: benches[i][areaNames[area]]
            })
        }
    }
    
    // Sort boundaries
    allBounds = allBounds.sort((a, b) => {
        return a.bound - b.bound;
     });

    // Build habit list with groups separated by boundaries
    var habitList = []
    var habit = 1
    var currBound = 0
    while (habit <= prog) {
        var habitGroup = []
        for (habit; habit <= allBounds[currBound].bound; habit++) {
            habitGroup.push(
                React.createElement(
                    'li',
                    { class: "list-group-item border-" + areaCode },
                    getHabit(area, habit)
                )
            )
        }
        
        habitList.push(React.createElement(
            'ul',
            { class: "list-group" },
            habitGroup
            )
        )

        habitList.push(React.createElement(
            'div',
            {class: "separator fs-4 text-" + boundCoding(allBounds[currBound].type)},
            allBounds[currBound].type
        ))
        currBound++;
    }
    
    return habitList;
}

function getHabit(area, level) {
    switch (area) {
        case areaNames.indexOf("Feminine Wear"): return getFemWear(level);
        case areaNames.indexOf("Makeup"): return getMakeup(level);
        case areaNames.indexOf("Hygiene"): return getHygiene(level);
        case areaNames.indexOf("Shaving"): return getShaving(level);
        case areaNames.indexOf("Nail Care"): return getNails(level);
        case areaNames.indexOf("Plugging"): return getPlugging(level);
        case areaNames.indexOf("Submission"): return getSubmission(level);
        case areaNames.indexOf("Chastity"): return getChastity(level);
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
