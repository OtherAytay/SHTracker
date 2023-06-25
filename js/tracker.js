function initializeTrackers() {
    if (nextReset == null) { newReset() }
        
    for (const [area, p] of Object.entries(prog)) {
        if (enabledAreas[area]) {
            for (const habit of Daily.filter((i) => i.area == area && i.prog <= p)) {
                channel = habit.channel || 1

                id = areaCodeMapping[area] + '_' + channel
                dailyTrackers[id] = dailyTrackers[id] || { 'habit': habit }
                if (habit.type == 'timer') {
                    if (!('time' in dailyTrackers[id]) || dailyTrackers[id]['habit']['prog'] < habit.prog || nextReset < (new Date())) {
                        dailyTrackers[id]['time'] = habit.duration * 60 * 60 * 1000
                        dailyTrackers[id]['remaining'] = habit.duration * 60 * 60 * 1000
                        dailyTrackers[id]['habit'] = habit
                        dailyTrackers[id]['active'] = false
                    }
                } else {
                    dailyTrackers[id]['complete'] = dailyTrackers[id]['complete'] || false
                }
            }
            for (const habit of Periodic.filter((i) => i.area == area && i.prog <= p)) {
                channel = habit.channel || 1
                id = areaCodeMapping[area] + '_' + channel

                periodicTrackers[id] = {}

                // charge based stuff
                // periodicTrackers[id]['']
            }
        }
    }
    localStorage['SHTracker-dailyTrackers'] = JSON.stringify(dailyTrackers)
    localStorage['SHTracker-periodicTrackers'] = JSON.stringify(periodicTrackers)
}

function generateTrackers() {
    initializeTrackers()

    habitElements = []
    for (const [id, tracker] of Object.entries(dailyTrackers)) {
        habitElements.push(habitTracker(id, tracker))
    }

    ReactDOM.render(habitElements, document.getElementById("daily-habits"), function () {
        for (const completion of document.querySelectorAll('input.btn-check')) {
            id = completion.id.match(/button_(\w+)/)[1]
            label = document.querySelector('#button_' + id + ' + label')

            if (!dailyTrackers[id]['complete']) {
                label.classList.add('btn-outline-danger')
                label.classList.remove('btn-outline-success')
                label.innerHTML = "<i class='bi bi-x'></i>"
            } else {
                completion.checked = true
                label.classList.remove('btn-outline-danger')
                label.classList.add('btn-outline-success')
                label.innerHTML = "<i class='bi bi-check'></i>"
            }
        }

        for (const id of Object.keys(dailyTrackers).filter((key) => dailyTrackers[key].active)) {
            dailyTrackers[id]['intervalID'] = setInterval(updateTimer, 1000, id, dailyTrackers[id])
        }
    })
}

function habitTracker(id, tracker) {
    habit = tracker.habit

    tracking = null
    if (habit.type == 'timer') {
        tracking = timer(id, tracker)
    } else if (habit.type == 'completion') {
        tracking = completion(id, tracker)
    } else {
        tracking = null
    }

    return React.createElement(
        'ul',
        { class: 'list-group list-group-horizontal-sm mt-2 w-100' },
        React.createElement(
            'li',
            { class: 'list-group-item col-sm-6 col-12 border-' + areaCoding(habit.area) },
            React.createElement(
                'span',
                { class: 'me-2 fs-6 badge bg-' + areaCoding(habit.area) },
                habit.area
            ),
            React.createElement('br'),
            habit.habit
        ),
        tracking
    )
}

function timer(id, tracker) {
    habit = tracker.habit

    return React.createElement(
        'li',
        {
            id: 'timer_' + id,
            class: 'list-group-item col-sm-6 col-12 text-center border-' + areaCoding(habit.area)
        },
        React.createElement(
            'p',
            {
                id: 'time_' + id,
                class: 'text-center fw-semibold fs-4 mb-1'
            },
            tracker['remaining'] > 0 ? formatTime(tracker['remaining']) : 'Complete'
        ),
        React.createElement(
            'button',
            {
                id: 'button_' + id,
                class: 'text-white fw-semibold btn btn-' + areaCoding(habit.area),
                hidden: tracker['active'],
                onClick: () => { manageTimer(id, tracker) }
            },
            React.createElement('i', { class: 'bi bi-play-fill' }),
            'Start'
        ),
        React.createElement(
            'div',
            {
                class: 'align-items-center ' + (tracker['active'] ? 'd-flex' : ''),
                hidden: !tracker['active']
            },
            React.createElement(
                'div',
                {
                    class: 'progress flex-fill me-2',
                    role: 'progressbar',
                    style: { height: '2rem' }
                },
                React.createElement(
                    'div',
                    {
                        id: 'progress_' + id,
                        class: 'progress-bar progress-bar-striped progress-bar-animated bg-' + areaCoding(habit.area),
                        style: { width: (tracker['remaining'] / tracker['time']) * 100 + '%' }
                    }
                )
            ),
            React.createElement(
                'button',
                {
                    id: 'button_' + id,
                    class: 'fw-semibold btn btn-outline-' + areaCoding(habit.area),
                    onClick: () => { manageTimer(id, tracker) }
                },
                React.createElement('i', { class: 'bi bi-pause-fill' }),
            ),
        )
    )
}

function manageTimer(id, tracker) {
    button = document.getElementById('button_' + id)
    progress = document.getElementById('progress_' + id);

    if (tracker['remaining'] <= 0) {
        tracker['intervalID'] = clearInterval(tracker['intervalID'])
        tracker['active'] = false
        progress.parentElement.parentElement.hidden = true;
        progress.parentElement.parentElement.classList.remove('d-flex');
        button.hidden = true;
    }

    if (progress.parentElement.parentElement.hidden) { // start timer
        tracker['start'] = (new Date()).getTime()
        tracker['active'] = true
        tracker['intervalID'] = setInterval(updateTimer, 1000, id, tracker)
        progress.parentElement.parentElement.classList.add('d-flex');
        progress.parentElement.parentElement.hidden = false;
        button.hidden = true;
    } else { // pause timer
        tracker['remaining'] -= (new Date()).getTime() - tracker['start']
        tracker['active'] = false
        progress.parentElement.parentElement.hidden = true;
        progress.parentElement.parentElement.classList.remove('d-flex');
        button.hidden = false;
        tracker['intervalID'] = clearInterval(tracker['intervalID']);
    }
    localStorage['SHTracker-dailyTrackers'] = JSON.stringify(dailyTrackers)
}

function updateTimer(id, tracker) {
    tracker['remaining'] -= (new Date()).getTime() - tracker['start']
    tracker['start'] = (new Date()).getTime()
    time = document.getElementById('time_' + id);
    if (tracker['remaining'] <= 0) {
        manageTimer(id, tracker)
    } else {
        time.innerText = formatTime(tracker['remaining']);
    }

    progress = document.getElementById('progress_' + id);
    progress.style.width = (tracker['remaining'] / tracker['time']) * 100 + '%'
    localStorage['SHTracker-dailyTrackers'] = JSON.stringify(dailyTrackers)
}

function formatTime(timeMS) {
    // timeD = Math.floor(timeS / (1000 * 60 * 60 * 24))
    timeH = Math.floor((timeMS / (1000 * 60 * 60)) % 24)
    timeM = Math.floor((timeMS / (1000 * 60)) % 60)
    timeS = Math.floor((timeMS / 1000) % 60)

    return timeH + ':' + timeM.toString().padStart(2, 0) + ':' + timeS.toString().padStart(2, 0)
}

function charge(charges, recharge, cooldown) {

}

function completion(id, tracker) {
    habit = tracker.habit

    return React.createElement(
        'li',
        {
            id: 'timer_' + id,
            class: 'list-group-item col-sm-6 col-12 d-flex border-' + areaCoding(habit.area)
        },
        React.createElement(
            'input',
            {
                id: 'button_' + id,
                type: 'checkbox',
                class: 'btn-check',
                onChange: () => { manageCompletion(id, tracker) }
            }
        ),
        React.createElement(
            'label',
            {
                class: 'fw-bold fs-2 my-auto mx-auto btn btn-outline-danger',
                for: 'button_' + id,
            },
            React.createElement('i', { class: 'bi bi-x' })
        )
    )
}

function manageCompletion(id, tracker) {
    button = document.querySelector('#button_' + id)
    label = document.querySelector('#button_' + id + ' + label')

    if (!button.checked) {
        label.classList.add('btn-outline-danger')
        label.classList.remove('btn-outline-success')
        label.innerHTML = "<i class='bi bi-x'></i>"
        tracker['complete'] = false
    } else {
        label.classList.remove('btn-outline-danger')
        label.classList.add('btn-outline-success')
        label.innerHTML = "<i class='bi bi-check'></i>"
        tracker['complete'] = true
    }
    localStorage['SHTracker-dailyTrackers'] = JSON.stringify(dailyTrackers)
}

const Daily = [
    // Makeup
    {
        'area': 'Makeup',
        'prog': 1,
        'habit': 'Apply lip makeup for 3 hours',
        'type': 'timer',
        'duration': 3,
    },
    {
        'area': 'Makeup',
        'prog': 2,
        'habit': 'Apply lip and eye makeup for 3 hours',
        'type': 'timer',
        'duration': 3,
    },
    {
        'area': 'Makeup',
        'prog': 3,
        'habit': 'Apply lip, eye, and face makeup for 3 hours',
        'type': 'timer',
        'duration': 3,
    },
    // Hygiene
    {
        'area': 'Hygiene',
        'prog': 1,
        'habit': 'Use facial cleanser',
        'type': 'completion',
    },
    {
        'area': 'Hygiene',
        'prog': 2,
        'habit': 'Use face and hand moisturizer',
        'type': 'completion',
        'channel': 2,
    },
    {
        'area': 'Hygiene',
        'prog': 5,
        'habit': 'Use eye cream',
        'type': 'completion',
        'channel': 3,
    },

    // Plugging
    {
        'area': 'Plugging',
        'prog': 1,
        'habit': 'Stay plugged for 1 hour',
        'type': 'timer',
        'duration': 1,
    },
    {
        'area': 'Plugging',
        'prog': 2,
        'habit': 'Stay plugged for 2 hours',
        'type': 'timer',
        'duration': 2,
    },
    {
        'area': 'Plugging',
        'prog': 3,
        'habit': 'Stay plugged for 4 hours',
        'type': 'timer',
        'duration': 4,
    },
    {
        'area': 'Plugging',
        'prog': 4,
        'habit': 'Stay plugged for 8 hours',
        'type': 'timer',
        'duration': 8,
    },

    // Chastity
    {
        'area': 'Chastity',
        'prog': 1,
        'habit': 'Stay in chastity for 1 hour',
        'type': 'timer',
        'duration': 1,
    },
    {
        'area': 'Chastity',
        'prog': 2,
        'habit': 'Stay in chastity for 2 hours',
        'type': 'timer',
        'duration': 2,
    },
    {
        'area': 'Chastity',
        'prog': 3,
        'habit': 'Stay in chastity for 4 hours',
        'type': 'timer',
        'duration': 4,
    },
    {
        'area': 'Chastity',
        'prog': 4,
        'habit': 'Stay in chastity for 8 hours',
        'type': 'timer',
        'duration': 8,
    },
]

/* Prototype Periodic Tracker Entry
{
  'area': lifestyle area
  'prog': min progress in area to unlock this task
  'habit': abridged habit text to display
  'period': (periodic only) time to replenish a charge
  'charges': (periodic only) max # of charges
  'cooldown': (periodic only) min amount of time between charge uses
  'channel': order to list habits if multiple need to be listed for 1 area
}
*/

const Periodic = [
    // Nail Care
    {
        'area': 'Nail Care',
        'prog': 1,
        'habit': 'File nails round 1 time per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 6,
    },
    {
        'area': 'Nail Care',
        'prog': 2,
        'habit': 'File nails round and apply clear polish 1 time per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 6,
    },
    {
        'area': 'Nail Care',
        'prog': 3,
        'habit': 'File nails round and apply colored polish 1 time per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 6,
    },
    {
        'area': 'Nail Care',
        'prog': 4,
        'habit': 'File nails round and apply traditionally feminine-colored polish 1 time per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 6,
    },

    // Exercise
    {
        'area': 'Exercise',
        'prog': 1,
        'habit': 'Do 1 hour of cardio per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 6,
        'channel': 1,
    },
    {
        'area': 'Exercise',
        'prog': 2,
        'habit': 'Complete 2 sets of 3 different butt popping exercises 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 1,
        'channel': 2,
    },
    {
        'area': 'Exercise',
        'prog': 3,
        'habit': 'Do 2 hours of cardio per week',
        'recharge': 7,
        'charges': 2,
        'cooldown': 6,
        'channel': 1,
    },
    {
        'area': 'Exercise',
        'prog': 4,
        'habit': 'Complete 3 sets of 3 different butt popping exercises 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 1,
        'channel': 2,
    },
    {
        'area': 'Exercise',
        'prog': 5,
        'habit': 'Do 3 hours of cardio per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 6,
        'channel': 1,
    },
    {
        'area': 'Exercise',
        'prog': 6,
        'habit': 'Complete 3 sets of 4 different butt popping exercises 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 1,
        'channel': 2,
    },
    {
        'area': 'Exercise',
        'prog': 7,
        'habit': 'Do 4 hours of cardio per week',
        'recharge': 7,
        'charges': 4,
        'cooldown': 6,
        'channel': 1,
    },
    {
        'area': 'Exercise',
        'prog': 8,
        'habit': 'Complete 3 sets of 5 different butt popping exercises 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 1,
        'channel': 2,
    },

    // Diet
    {
        'area': 'Diet',
        'prog': 1,
        'habit': 'Limit sweets and sugary beverages to 4 times per week each.',
        'recharge': 7,
        'charges': 4,
        'cooldown': 1,
        'channel': 1,
    },
    {
        'area': 'Diet',
        'prog': 2,
        'habit': 'Eat only vegetarian meals 2 days per week.',
        'recharge': 7,
        'charges': 2,
        'cooldown': 1,
        'channel': 2,
    },
    {
        'area': 'Diet',
        'prog': 3,
        'habit': 'Limit sweets and sugary beverages to 2 times per week each.',
        'recharge': 7,
        'charges': 2,
        'cooldown': 1,
        'channel': 1,
    },
    {
        'area': 'Diet',
        'prog': 5,
        'habit': 'Limit sweets and sugary beverages to 1 time per week each.',
        'recharge': 7,
        'charges': 1,
        'cooldown': 1,
        'channel': 1,
    },

    // Hygiene
    {
        'area': 'Hygiene',
        'prog': 3,
        'habit': 'Use face exfoliating scrub 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 2,
        'channel': 1,
    },
    {
        'area': 'Hygiene',
        'prog': 4,
        'habit': 'Use full-body moisturizer 2 times per week',
        'recharge': 7,
        'charges': 2,
        'cooldown': 3,
        'channel': 2,
    },
    {
        'area': 'Hygiene',
        'prog': 6,
        'habit': 'Use face mask 1 time per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 1,
        'channel': 3,
    },

    // Shaving
    {
        'area': 'Shaving',
        'prog': 1,
        'habit': 'Shave groin and butt 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 2,
        'channel': 1,
    },
    {
        'area': 'Shaving',
        'prog': 2,
        'habit': 'Shave chest and back 1 time per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 1,
        'channel': 2,
    },
    {
        'area': 'Shaving',
        'prog': 4,
        'habit': 'Shave everything below the eyes 1 time per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 1,
        'channel': 2,
    },

    // Chastity
    {
        'area': 'Chastity',
        'prog': 1,
        'habit': 'Allowed at most 4 orgasms per week',
        'recharge': 7,
        'charges': 4,
        'cooldown': 1,
    },
    {
        'area': 'Chastity',
        'prog': 2,
        'habit': 'Allowed at most 2 orgasms per week',
        'recharge': 7,
        'charges': 2,
        'cooldown': 1,
    },
    {
        'area': 'Chastity',
        'prog': 3,
        'habit': 'Allowed at most 1 orgasm per week',
        'recharge': 7,
        'charges': 1,
        'cooldown': 1,
    },
    {
        'area': 'Chastity',
        'prog': 4,
        'habit': 'Allowed at most 1 orgasm per 2 weeks',
        'recharge': 14,
        'charges': 1,
        'cooldown': 1,
    },
    {
        'area': 'Chastity',
        'prog': 6,
        'habit': 'Allowed at most 1 orgasm per month',
        'recharge': 30,
        'charges': 1,
        'cooldown': 1,
    },
]