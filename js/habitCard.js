function generateHabitCards() {
    //const habitRoot = ReactDOM.createRoot(document.getElementById("habits"));

    var habitCards = []
    for (var area = 0; area < numAreas; area++) {
        if (enabledAreas[areaNames[area]]) {
            habitCards.push(React.createElement(
                habitCard, { area: areaNames[area], prog: prog[areaNames[area]] }
            ))
        }
    }

    ReactDOM.render(habitCards, document.getElementById("habits"), function () {
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
                { class: "card shadow-sm mb-3 border-" + areaCode },
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
    var habitList = []
    for (var habit = 1; habit <= prog; habit++) {
        habitContent = []

        // Habit Index
        habitContent.push(React.createElement(
            'span',
            { class: "me-2 badge bg-info" },
            habit + "/" + public_bounds[area]
        ))

        // Discretion bounds
        if (habit >= public_bounds[area]) {
            currDisc = 'public'
        } else if (habit >= discrete_bounds[area]) {
            currDisc = 'discrete'
        } else {
            currDisc = 'private'
        }
        habitContent.push(React.createElement(
            'span',
            { class: "me-2 badge bg-" + currDisc },
            currDisc.slice(0, 1).toUpperCase() + currDisc.slice(1)
        ),)

        // Benchmark bounds
        var currBench = null
        if (habit == bench1[area]) {
            currBench = 'Benchmark #1'
        } else if (habit == bench2[area]) {
            currBench = 'Benchmark #2'
        } else if (habit == bench3[area]) {
            currBench = 'Benchmark #3'
        } else if (habit == bench4[area]) {
            currBench = 'Benchmark #4'
        }
        if (currBench) {
            habitContent.push(React.createElement(
                'span',
                { class: "me-2 badge bg-benchmark" },
                currBench
            ))
        }

        // Habit Text
        habitContent.push(React.createElement('p', { class: 'mb-0' }, getHabit(area, habit)))

        // List group item
        habitList.push(React.createElement(
            'li',
            { class: "list-group-item border-" + currDisc },
            habitContent
        ))
    }

    // Next Habit Preview
    if (previews && prog < public_bounds[area]) {
        var habit = prog + 1
        habitContent = []

        // Preview Badge
        habitContent.push(React.createElement(
            'span',
            { class: "me-2 badge bg-secondary" },
            "Preview"
        ))

        // Habit Index Badge
        habitContent.push(React.createElement(
            'span',
            { class: "me-2 badge bg-info" },
            habit + "/" + public_bounds[area]
        ))

        // Discretion Badge
        if (habit >= public_bounds[area]) {
            currDisc = 'public'
        } else if (habit >= discrete_bounds[area]) {
            currDisc = 'discrete'
        } else {
            currDisc = 'private'
        }
        habitContent.push(React.createElement(
            'span',
            { class: "me-2 badge bg-" + currDisc },
            currDisc.slice(0, 1).toUpperCase() + currDisc.slice(1)
        ),)

        // Benchmark Badge
        var currBench = null;
        if (habit == bench1[area]) {
            currBench = 'Benchmark #1'
        } else if (habit == bench2[area]) {
            currBench = 'Benchmark #2'
        } else if (habit == bench3[area]) {
            currBench = 'Benchmark #3'
        } else if (habit == bench4[area]) {
            currBench = 'Benchmark #4'
        }
        if (currBench != null) {
            habitContent.push(React.createElement(
                'span',
                { class: "me-2 badge bg-benchmark" },
                currBench
            ))
        }

        // Habit Text
        habitContent.push(React.createElement('p', { class: 'mb-0' }, getHabit(area, habit)))

        // List group item
        preview = React.createElement(
            'ul',
            {class: 'list-group'},
            React.createElement(
                'li',
                { class: "list-group-item border-secondary"},
                habitContent
            )
        )
    }

    var nextHabit = null;
    if (preview != null) {
        nextHabit = React.createElement('p', { class: "text-center fs-5 mb-1" }, "Next Habit");
    }

    return [
        React.createElement(
            'ul',
            { class: 'list-group' },
            habitList
        ),
        nextHabit,
        preview
    ]
}

/*
function habitList({ area, prog }) {
    var disc_bounds = getAllDiscretionBoundaries();
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
        for (var i = 0; i < benches.length - 1; i++) {
            if (benches[i][area] == benches[i + 1][area]) {
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
    var preview;
    var habit = 1;
    var currBound = 0;
    var currDisc = "private";

    while (habit <= prog) {
        if (allBounds[currBound].type == "Discrete") {
            currDisc = "discrete";
        } else if (allBounds[currBound].type == "Public") {
            currDisc = "public";
        }

        var bench = null;
        for (var i = 0; i < allBounds.length; i++) {
            if (habit == allBounds[i].bound && allBounds[i].type.includes("Benchmark")) {
                bench = React.createElement(
                    'span',
                    { class: "me-2 badge bg-benchmark" },
                    allBounds[i].type
                )
            }
        }

        habitList.push(
            React.createElement(
                'li',
                { class: "list-group-item border-" + currDisc },
                React.createElement(
                    'span',
                    { class: "me-2 badge bg-info" },
                    habit + "/" + public_bounds[area]
                ),
                React.createElement(
                    'span',
                    { class: "me-2 badge bg-" + currDisc },
                    currDisc.slice(0, 1).toUpperCase() + currDisc.slice(1)
                ),
                bench,
                React.createElement('p', { class: 'mb-0' }, getHabit(area, habit))
            )
        )

        while (currBound < allBounds.length && habit == allBounds[currBound].bound) {
            currBound++;
        }
        habit++;
    }

    // Display preview of next habit
    if (previews && habit == prog + 1 && prog < public_bounds[area]) {
        preview = React.createElement(
            'ul',
            { class: 'list-group' },
            React.createElement(
                'li',
                { class: "list-group-item border-secondary" },
                React.createElement(
                    'span',
                    { class: "me-2 badge bg-secondary" },
                    "Preview"
                ),
                React.createElement(
                    'span',
                    { class: "me-2 badge bg-" + currDisc },
                    currDisc.slice(0, 1).toUpperCase() + currDisc.slice(1)
                ),
                bench,
                React.createElement('p', { class: 'mb-0' }, getHabit(area, habit))
            )
        )
    }

    var nextHabit = null;
    if (preview != null) {
        nextHabit = React.createElement('p', {class: "text-center fs-5 mb-1"}, "Next Habit");
    }
    
    return [
        React.createElement(
            'ul',
            { class: 'list-group' },
            habitList
        ),
        nextHabit,
        preview
    ]
}
*/