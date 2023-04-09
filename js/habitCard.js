function generateHabitCards() {
    //const habitRoot = ReactDOM.createRoot(document.getElementById("habits"));
    
    var habitCards = []
    for (var area = 0; area < numAreas; area++) {
        if (enabledAreas[areaNames[area]]) {
            habitCards.push(React.createElement(
                habitCard, {area: areaNames[area], prog: prog[areaNames[area]]} 
            ))
        }
    }

    ReactDOM.render(habitCards, document.getElementById("habits"), function() {
        msnry.reloadItems();
        msnry.layout();
    });
    //habitRoot.render(habitCards);

}

function habitCard({ area, prog }) {
    var areaCode = areaCoding(area)

    var habits = habitList({ area: area, prog: prog })

    var alloc;
    if (!random && isAllocTime() && getAvailableAreas().includes(area)) {
        alloc = (
            React.createElement(
                'div',
                { class: "card-footer text-center border-" + areaCode },
                React.createElement(
                    'button',
                    {
                        class: "btn fs-4 btn-" + areaCode,
                        onClick: () => { allocatePoint(area); }
                    },
                    "Allocate Point"
                )
            )
        )
    }

    return (
        React.createElement(
            'div',
            { class: "col-xxl-3 col-xl-4 col-sm-6 col-12" }, 
            React.createElement(
                'div',
                { class: "card mb-3 border-" + areaCode },
                React.createElement(
                    'h3',
                    { class: "card-title card-header text-center border-" + areaCode + " text-bg-" + areaCode },
                    area
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
    var areaCode = areaCoding(area);
    var benches = [bench1, bench2, bench3, bench4]
    var allBounds = []

    // Add discretion boundaries
    var discretionNames = ["Private", "Discrete", "Public"]
    for (var i = 0; i < disc_bounds.length; i++) {
        allBounds.push({
            type: discretionNames[i],
            bound: disc_bounds[i][area]
        })
    }

    // Add benchmark boundaries
    if (benchmarked) {
        for (var i = 0; i < benches.length-1; i++) {
            if (benches[i][area] == benches[i+1][area]) {
                break;
            }
    
            allBounds.push({
                type: "Benchmark #" + (i + 1),
                bound: benches[i][area]
            })
        }
    }
    
    // Sort boundaries
    allBounds = allBounds.sort((a, b) => {
        return a.bound - b.bound;
     });
    // Build habit list with groups separated by boundaries
    var habitList = [];
    var habit = 1;
    var currBound = 0;
    var currDisc = "private";
    while (habit <= prog) {
        var habitGroup = []

        if (allBounds[currBound].type == "Discrete") {
            currDisc = "discrete";
        } else if (allBounds[currBound].type == "Public") {
            currDisc = "public";
        }
        
        for (habit; habit <= allBounds[currBound].bound && habit <= prog; habit++) {
            habitGroup.push(
                React.createElement(
                    'li',
                    { class: "list-group-item border-" + currDisc },
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

        while (currBound < allBounds.length && habit - 1 == allBounds[currBound].bound) {
            habitList.push(React.createElement(
                'div',
                {class: "separator fs-4 text-" + boundCoding(allBounds[currBound].type)},
                allBounds[currBound].type
            ))
            currBound++;
        }
        
    }
    
    return habitList;
}
