function generateHabitCards() {
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
        if (skipped[area].includes(habit)) {
            if (prog + 1 <= public_bounds[area]) prog++
            continue
        }
        if (areaDiscretion[area] == "Default") {
            disc = discretion
        } else {
            disc = areaDiscretion[area]
        }

        habitContent = []

        // Habit Index
        habitContent.push(React.createElement(
            'span',
            { class: "me-2 badge bg-info" },
            habit + "/" + public_bounds[area]
        ))

        // Discretion bounds
        if (habit <= public_bounds[area]) {
            currDisc = 'public'
        }
        if (habit <= discrete_bounds[area]) {
            currDisc = 'discrete'
        }
        if (habit <= private_bounds[area]) {
            currDisc = 'private'
        }
        if ((currDisc == 'public' && disc != "Public") || (currDisc == 'discrete' && disc == 'Private')) {
            continue
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
        } else {
            var benches = [bench1, bench2, bench3, bench4]
            benchLoop:
            for (var bench = 0; bench < benches.length; bench++) {
                //var currBench = null
                for (var i = benches[bench][area]; i <= habit; i++) {
                    if (i == habit) {
                        currBench = "Benchmark #" + (bench + 1)
                        // break benchLoop
                    } else if (!skipped[area].includes(i)) {
                        break
                    }
                }
            }
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
    var preview = null
    makePreview:
    if (previews && prog < public_bounds[area]) {
        var habit = prog + 1
        while (skipped[area].includes(habit)) {
            if (habit + 1 <= public_bounds[area]) habit++
            continue
        }
        // Don't preview outside of discretion
        if (habit <= public_bounds[area]) {
            currDisc = 'public'
        }
        if (habit <= discrete_bounds[area]) {
            currDisc = 'discrete'
        }
        if (habit <= private_bounds[area]) {
            currDisc = 'private'
        }
        if ((currDisc == 'public' && disc != "Public") || (currDisc == 'discrete' && disc == 'Private')) {
            break makePreview
        }
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
        if (habit <= public_bounds[area]) {
            currDisc = 'public'
        }
        if (habit <= discrete_bounds[area]) {
            currDisc = 'discrete'
        }
        if (habit <= private_bounds[area]) {
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
            { class: 'list-group' },
            React.createElement(
                'li',
                { class: "list-group-item border-secondary" },
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