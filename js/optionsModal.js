function displayModal(area) {
    modalElem = document.getElementById('areaOptionsModal')
    ReactDOM.render(areaOptionsModal(area), modalElem, function () {
        for (var i = 1; i <= public_bounds[area]; i++) {
            document.getElementById('skip' + i).checked = skipped[area].includes(i)
        }
    })
    modal = new bootstrap.Modal(modalElem)
    modal.show() 
}

function areaOptionsModal(area) {
    areaCode = areaCoding(area)

    skips = []
    for (var i = 1; i <= public_bounds[area]; i++) {
        skips.push(
            React.createElement(
                'input',
                {
                    id: 'skip' + i,
                    class: 'btn-check',
                    type: 'checkbox',
                    onChange: () => {setAreaOptions(area)}
                }
            ),
            React.createElement(
                'label',
                {
                    for: 'skip' + i,
                    class: 'btn btn-outline-danger'
                },
                i
            ))
    }

    return React.createElement(
        'div',
        { class: 'modal-dialog modal-xl' },
        React.createElement(
            'div',
            { class: 'modal-content border-' + areaCode },
            React.createElement(
                'div',
                { class: 'modal-header bg-' + areaCode },
                React.createElement(
                    'h1',
                    { class: 'modal-title fs-4 fw-bold w-100 text-white text-center' },
                    area + " Options"
                ),
                React.createElement(
                    'button',
                    {
                        type: "button",
                        class: "btn-close",
                        'data-bs-dismiss': "modal"
                    }
                )
            ),
            React.createElement(
                'div',
                { class: 'modal-body' },
                React.createElement('div', { class: 'row' },
                    React.createElement('div', { class: 'col-lg-6 order-lg-0 col-12 order-1', id: 'optionsHabitPreview' },
                        habitList({ area: area, prog: public_bounds[area] })
                    ),
                    React.createElement('div', { class: 'col-lg-6 order-lg-1 col-12 order-0 text-center mb-2' },
                        React.createElement('h3', { class: 'text-center fs-5 mb-0' }, "Skipped Habits"),
                        React.createElement('small', null, "Skip habits that you can not or do not want to complete."),
                        React.createElement(
                            'div',
                            { class: 'btn-group', role: 'group' },
                            skips
                        )
                    )
                )
            ),
        )
    )
}