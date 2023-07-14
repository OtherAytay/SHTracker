function initializeTrackers() {
    if (nextReset == null) { newReset() }

    for (const [area, areaProg] of Object.entries(prog)) {
        var p = areaProg
        if (enabledAreas[area]) {
            for (const skip of skipped[area]) {
                if (p >= skip) { p++ }
            }
            for (const habit of Constant.filter((i) => i.area == area && i.prog <= p)) {
                if (skipped[area].includes(habit.prog)) { continue }
                
                channel = habit.channel || 1
                if (habit.nullify) {
                    delete constantTrackers[id]
                    continue
                }

                id = areaCodeMapping[area] + '_' + channel
                constantTrackers[id] = constantTrackers[id] || { 'habit': habit }
                if (!('elapsed' in constantTrackers[id]) || constantTrackers[id]['habit']['prog'] < habit.prog) {
                    constantTrackers[id]['elapsed'] = 0
                    constantTrackers[id]['habit'] = habit
                    constantTrackers[id]['active'] = false
                } else if (nextReset < (new Date()) && constantTrackers[id]['start'] < nextReset) {
                    if (constantTrackers[id]['active']) {
                        constantTrackers[id]['elapsed'] = (new Date()).getTime() - nextReset.getTime()
                    } else {
                        constantTrackers[id]['elapsed'] = 0
                    }
                    constantTrackers[id]['start'] = new Date()
                }
            }
            for (const habit of Daily.filter((i) => i.area == area && i.prog <= p)) {
                if (skipped[area].includes(habit.prog)) { continue }

                channel = habit.channel || 1
                if (habit.nullify) {
                    delete dailyTrackers[id]
                    continue
                }

                id = areaCodeMapping[area] + '_' + channel
                dailyTrackers[id] = dailyTrackers[id] || { 'habit': habit }
                if (habit.type == 'timer') {
                    if (!('time' in dailyTrackers[id]) || dailyTrackers[id]['habit']['prog'] < habit.prog || nextReset < (new Date())) {
                        dailyTrackers[id]['time'] = habit.duration * 60 * 60 * 1000
                        dailyTrackers[id]['remaining'] = habit.duration * 60 * 60 * 1000
                        dailyTrackers[id]['habit'] = habit
                        dailyTrackers[id]['active'] = false
                    }
                } else if (!('complete' in dailyTrackers[id]) || dailyTrackers[id]['habit']['prog'] < habit.prog || nextReset < (new Date())) {
                    dailyTrackers[id]['complete'] = false
                    dailyTrackers[id]['habit'] = habit
                }
            }
            for (const habit of Periodic.filter((i) => i.area == area && i.prog <= p)) {
                if (skipped[area].includes(habit.prog)) { continue }

                channel = habit.channel || 1
                if (habit.nullify) {
                    delete dailyTrackers[id]
                    continue
                }
                id = areaCodeMapping[area] + '_' + channel

                periodicTrackers[id] = periodicTrackers[id] || { 'habit': habit }
                if (!('ready' in periodicTrackers[id]) || periodicTrackers[id]['habit']['prog'] < habit.prog) {
                    periodicTrackers[id]['ready'] = []
                    periodicTrackers[id]['recharge'] = []
                    for (var i = 0; i < habit.charges; i++) {
                        periodicTrackers[id]['ready'].push(true)
                        periodicTrackers[id]['recharge'].push(0)
                    }
                    periodicTrackers[id]['lastCharge'] = null
                    periodicTrackers[id]['habit'] = habit
                } else if (nextReset < (new Date())) {
                    resets = calcResetsSince(nextReset)
                    for (var i = 0; i < habit.charges; i++) {
                        if (periodicTrackers[id]['recharge'][i] > 0) {
                            periodicTrackers[id]['recharge'][i] = Math.max(periodicTrackers[id]['recharge'][i] - resets, 0);
                            if (periodicTrackers[id]['recharge'][i] == 0) {
                                periodicTrackers[id]['ready'][i] = true
                            }
                        }
                    }
                }
            }
        }
    }
    if (nextReset < (new Date())) {
        newReset()
    }

    localStorage['SHTracker-constantTrackers'] = JSON.stringify(constantTrackers)
    localStorage['SHTracker-dailyTrackers'] = JSON.stringify(dailyTrackers)
    localStorage['SHTracker-periodicTrackers'] = JSON.stringify(periodicTrackers)
}

function generateTrackers() {
    initializeTrackers()

    var constant = []
    for (const [id, tracker] of Object.entries(constantTrackers)) {
        constant.push(habitTracker(id, tracker))
    }
    ReactDOM.render(constant, document.getElementById("constant-habits"))

    var daily = []
    for (const [id, tracker] of Object.entries(dailyTrackers)) {
        daily.push(habitTracker(id, tracker))
    }
    ReactDOM.render(daily, document.getElementById("daily-habits"), function () {
        for (const completion of document.querySelectorAll('input.btn-check')) {
            id = completion.id.match(/button_(\w+)/)[1]
            label = document.querySelector('#button_' + id + ' + label')

            completionTrackers = { ...constantTrackers, ...dailyTrackers }
            if (!completionTrackers[id]['complete']) {
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

        for (const id of Object.keys(constantTrackers).filter((key) => constantTrackers[key].active)) {
            constantTrackers[id]['intervalID'] = setInterval(updateConstant, 1000, id, constantTrackers[id])
        }

        for (const id of Object.keys(dailyTrackers).filter((key) => dailyTrackers[key].active)) {
            dailyTrackers[id]['intervalID'] = setInterval(updateTimer, 1000, id, dailyTrackers[id])
        }
    })

    var periodic = []
    for (const [id, tracker] of Object.entries(periodicTrackers)) {
        periodic.push(habitTracker(id, tracker))
    }
    ReactDOM.render(periodic, document.getElementById("periodic-habits"))
}

function habitTracker(id, tracker) {
    habit = tracker.habit

    if (!enabledAreas[habit.area] || skipped[habit.area].includes(habit.prog)) { return }

    tracking = null
    if (habit.type == 'constant') {
        tracking = constant(id, tracker)
    } else if (habit.type == 'timer') {
        tracking = timer(id, tracker)
    } else if (habit.type == 'completion') {
        tracking = completion(id, tracker)
    } else {
        tracking = charge(id, tracker)
    }

    return React.createElement(
        'ul',
        { class: 'list-group list-group-horizontal-sm mt-2 w-100' },
        React.createElement(
            'li',
            { class: 'list-group-item col-sm-8 col-12 border-' + areaCoding(habit.area) },
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

function constant(id, tracker) {
    habit = tracker.habit
    width = (tracker['elapsed'] / (24 * 60 * 60 * 1000)) * 100;

    return React.createElement(
        'li',
        {
            id: 'constant_' + id,
            class: 'list-group-item col-sm-4 col-12 text-center border-' + areaCoding(habit.area)
        },
        React.createElement(
            'p',
            {
                id: 'time_constant_' + id,
                class: 'text-center fw-semibold fs-4 mb-1'
            },
            formatTime(tracker['elapsed'])
        ),
        React.createElement(
            'button',
            {
                id: 'button_constant_' + id,
                class: 'text-white fw-semibold btn btn-' + areaCoding(habit.area),
                hidden: tracker['active'],
                onClick: () => { manageConstant(id, tracker) }
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
                        id: 'progress_constant_' + id,
                        class: 'progress-bar progress-bar-striped progress-bar-animated text-white fw-bold fs-6 text-end ' + 
                            (width < 50 ? 'bg-danger' : width < 80 ? 'bg-warning' : 'bg-success'),
                        style: { width: width + '%' }
                    },
                    React.createElement('span', {class: 'me-1'}, Math.floor(width) * 100 + '%'),
                    
                )
            ),
            React.createElement(
                'button',
                {
                    id: 'button_constant_' + id,
                    class: 'fw-semibold btn btn-outline-' + areaCoding(habit.area),
                    onClick: () => { manageConstant(id, tracker) }
                },
                React.createElement('i', { class: 'bi bi-pause-fill' }),
            ),
        )
    )
}

function manageConstant(id, tracker) {
    button = document.getElementById('button_constant_' + id)
    progress = document.getElementById('progress_constant_' + id);

    if (progress.parentElement.parentElement.hidden) { // start timer
        tracker['start'] = (new Date()).getTime()
        tracker['active'] = true
        tracker['intervalID'] = setInterval(updateConstant, 1000, id, tracker)
        progress.parentElement.parentElement.classList.add('d-flex');
        progress.parentElement.parentElement.hidden = false;
        button.hidden = true;
    } else { // pause timer
        tracker['elapsed'] += (new Date()).getTime() - tracker['start']
        tracker['active'] = false
        progress.parentElement.parentElement.hidden = true;
        progress.parentElement.parentElement.classList.remove('d-flex');
        button.hidden = false;
        tracker['intervalID'] = clearInterval(tracker['intervalID']);
    }

    localStorage['SHTracker-constantTrackers'] = JSON.stringify(constantTrackers)
}

function updateConstant(id, tracker) {
    tracker['elapsed'] += (new Date()).getTime() - tracker['start']
    tracker['start'] = (new Date()).getTime()
    time = document.getElementById('time_constant_' + id);
    time.innerText = formatTime(tracker['elapsed']);

    progress = document.getElementById('progress_constant_' + id);
    width = (tracker['elapsed'] / (24 * 60 * 60 * 1000)) * 100
    progress.innerHTML = "<span class='me-1'>" + Math.floor(width) + "%</span>"
    progress.style.width = width + '%'
    if (width < 50) {
        progress.classList.add('bg-danger')
        progress.classList.remove('bg-warning')
        progress.classList.remove('bg-success')
    } else if (width < 80) {
        progress.classList.remove('bg-danger')
        progress.classList.add('bg-warning')
        progress.classList.remove('bg-success')
    } else {
        progress.classList.remove('bg-danger')
        progress.classList.remove('bg-warning')
        progress.classList.add('bg-success')
    }

    localStorage['SHTracker-constantTrackers'] = JSON.stringify(constantTrackers)
}

function timer(id, tracker) {
    habit = tracker.habit

    return React.createElement(
        'li',
        {
            id: 'timer_' + id,
            class: 'list-group-item col-sm-4 col-12 text-center border-' + areaCoding(habit.area)
        },
        React.createElement(
            'p',
            {
                id: 'time_timer_' + id,
                class: 'text-center fw-semibold fs-4 mb-1'
            },
            tracker['remaining'] > 0 ? formatTime(tracker['remaining']) : 'Complete'
        ),
        React.createElement(
            'button',
            {
                id: 'button_timer_' + id,
                class: 'text-white fw-semibold btn btn-' + areaCoding(habit.area),
                hidden: tracker['active'] || tracker['remaining'] <= 0,
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
                        id: 'progress_timer_' + id,
                        class: 'progress-bar progress-bar-striped progress-bar-animated bg-' + areaCoding(habit.area),
                        style: { width: (tracker['remaining'] / tracker['time']) * 100 + '%' }
                    }
                )
            ),
            React.createElement(
                'button',
                {
                    id: 'button_timer_' + id,
                    class: 'fw-semibold btn btn-outline-' + areaCoding(habit.area),
                    onClick: () => { manageTimer(id, tracker) }
                },
                React.createElement('i', { class: 'bi bi-pause-fill' }),
            ),
        )
    )
}

function manageTimer(id, tracker) {
    button = document.getElementById('button_timer_' + id)
    progress = document.getElementById('progress_timer_' + id);

    if (tracker['remaining'] <= 0) {
        tracker['intervalID'] = clearInterval(tracker['intervalID'])
        tracker['active'] = false
        progress.parentElement.parentElement.hidden = true;
        progress.parentElement.parentElement.classList.remove('d-flex');
        button.hidden = true;
    } else {
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
    }

    localStorage['SHTracker-dailyTrackers'] = JSON.stringify(dailyTrackers)
}

function updateTimer(id, tracker) {
    tracker['remaining'] -= (new Date()).getTime() - tracker['start']
    tracker['start'] = (new Date()).getTime()
    time = document.getElementById('time_timer_' + id);
    if (tracker['remaining'] <= 0) {
        manageTimer(id, tracker)
    } else {
        time.innerText = formatTime(tracker['remaining']);
    }

    progress = document.getElementById('progress_timer_' + id);
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

function charge(id, tracker) {
    habit = tracker.habit

    return React.createElement(
        'li',
        {
            id: 'charge_' + id,
            class: 'list-group-item col-sm-4 col-12 text-center border-' + areaCoding(habit.area)
        },
        React.createElement(
            'p',
            {
                id: 'charges_' + id,
                class: 'text-center fw-semibold fs-4 mb-1'
            },
            tracker['ready'].reduce((acc, i) => i == true ? ++acc : acc, 0)
        ),
        React.createElement(
            'button',
            {
                id: 'button_charge_' + id,
                class: 'text-white fw-semibold btn btn-' + areaCoding(habit.area),
                disabled: !(tracker['ready'].reduce((acc, i) => acc || i)) || (new Date()) < calcReset(tracker['lastCharge'], tracker['habit'].cooldown, tracker['lastCharge']),
                onClick: () => { manageCharge(id, tracker) }
            },
            React.createElement('i', { class: 'bi bi-dash' }),
        )
    )
}

function manageCharge(id, tracker) {
    button = document.querySelector('#button_charge_' + id)
    charges = document.querySelector('#charges_' + id)

    usedCharge = tracker['ready'].indexOf(true)
    tracker['ready'][usedCharge] = false
    tracker['recharge'][usedCharge] = tracker['habit']['recharge']
    tracker['lastCharge'] = (new Date())

    charges.innerText = tracker['ready'].reduce((acc, i) => i == true ? ++acc : acc, 0)
    if (tracker['habit'].cooldown > 0 || !tracker['ready'].reduce((acc, i) => acc || i)) {
        button.disabled = true
    }
    localStorage['SHTracker-periodicTrackers'] = JSON.stringify(periodicTrackers)
}

function completion(id, tracker) {
    habit = tracker.habit

    return React.createElement(
        'li',
        {
            id: 'completion_' + id,
            class: 'list-group-item col-sm-4 col-12 d-flex border-' + areaCoding(habit.area)
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
    localStorage['SHTracker-constantTrackers'] = JSON.stringify(constantTrackers)
    localStorage['SHTracker-dailyTrackers'] = JSON.stringify(dailyTrackers)
}

const Constant = [
    //Feminine Wear
    {
        'area': 'Feminine Wear',
        'prog': 1,
        'habit': 'Wear panties at all times in private',
        'type': 'constant',
    },
    {
        'area': 'Feminine Wear',
        'prog': 2,
        'habit': 'Wear panties and a bra at all times in private',
        'type': 'constant',
    },
    {
        'area': 'Feminine Wear',
        'prog': 3,
        'habit': 'Wear a feminine top and bottom while not sleeping in private',
        'type': 'constant',
        'channel': 2
    },
    {
        'area': 'Feminine Wear',
        'prog': 4,
        'habit': 'Wear a feminine top and bottom, and women\'s jewelry while not sleeping in private',
        'type': 'constant',
        'channel': 2
    },
    {
        'area': 'Feminine Wear',
        'prog': 5,
        'habit': 'Wear breast forms while not sleeping in private',
        'type': 'constant',
        'channel': 3
    },
    {
        'area': 'Feminine Wear',
        'prog': 6,
        'habit': 'Wear panties at all times',
        'type': 'constant',
    },
    {
        'area': 'Feminine Wear',
        'prog': 7,
        'habit': 'Wear panties and a bra at all times in private',
        'type': 'constant',
    },
    {
        'area': 'Feminine Wear',
        'prog': 8,
        'habit': 'Wear a feminine top and bottom while not sleeping',
        'type': 'constant',
        'channel': 2
    },
    {
        'area': 'Feminine Wear',
        'prog': 9,
        'habit': 'Wear a feminine top and bottom, and women\'s jewelry while not sleeping',
        'type': 'constant',
        'channel': 2
    },
    {
        'area': 'Feminine Wear',
        'prog': 10,
        'habit': 'Wear breast forms while not sleeping',
        'type': 'constant',
        'channel': 3
    },

    // Plugging
    {
        'area': 'Plugging',
        'prog': 5,
        'habit': 'Stay plugged while not sleeping in private',
        'type': 'constant',
    },
    {
        'area': 'Plugging',
        'prog': 6,
        'habit': 'Stay plugged while not sleeping in private',
        'type': 'constant',
    },
    {
        'area': 'Plugging',
        'prog': 8,
        'habit': 'Stay plugged at all times',
        'type': 'constant',
    },

    // Submission
    {
        'area': 'Submission',
        'prog': 1,
        'habit': 'Wear a light collar at all times in private',
        'type': 'constant',
    },
    {
        'area': 'Submission',
        'prog': 2,
        'habit': 'Wear light wrist and ankle cuffs at all times in private',
        'type': 'constant',
        'channel': 2
    },
    {
        'area': 'Submission',
        'prog': 5,
        'habit': 'Wear a heavy collar at all times in private',
        'type': 'constant',
    },
    {
        'area': 'Submission',
        'prog': 6,
        'habit': 'Wear heavy wrist and ankle cuffs at all times in private',
        'type': 'constant',
    },
    {
        'area': 'Submission',
        'prog': 8,
        'habit': 'Wear a day collar at all times in public',
        'type': 'constant',
        'channel': 3
    },
    {
        'area': 'Submission',
        'prog': 9,
        'habit': 'Wear a light collar at all times in public',
        'type': 'constant',
        'channel': 3
    },

    // Chastity
    {
        'area': 'Chastity',
        'prog': 5,
        'habit': 'Stay in chastity while not sleeping in private',
        'type': 'constant',
    },
    {
        'area': 'Chastity',
        'prog': 6,
        'habit': 'Stay in chastity while not sleeping in private',
        'type': 'constant',
    },
    {
        'area': 'Chastity',
        'prog': 8,
        'habit': 'Stay in chastity at all times',
        'type': 'constant',
    },
]

/* Prototype Daily Tracker Entry
{
  'area': lifestyle area
  'prog': min progress in area to unlock this task
  'habit': abridged habit text to display
  'type': timer or completion
  'channel': order to list habits if multiple need to be listed for 1 area
  'nullify': disable trackers in this channel at this prog
}
*/

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
    {
        'area': 'Plugging',
        'prog': 5,
        'nullify': true
    },

    // Submission
    {
        'area': 'Submission',
        'prog': 4,
        'habit': 'Wear a mouth gag and nipple clamps for 15 minutes',
        'type': 'timer',
        'duration': 0.25,
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
    {
        'area': 'Chastity',
        'prog': 5,
        'nullify': true
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
    },
    {
        'area': 'Shaving',
        'prog': 2,
        'habit': 'Shave chest, groin, and butt 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 2,
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

    // Submission
    {
        'area': 'Submission',
        'prog': 3,
        'habit': 'Practice self-bondage rope body ties 3 times per week',
        'recharge': 7,
        'charges': 3,
        'cooldown': 1,
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