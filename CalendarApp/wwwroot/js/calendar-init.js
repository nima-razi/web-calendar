document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const eventForm = document.getElementById('eventForm');

    // If there's no calendar on this page, stop here
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        themeSystem: 'bootstrap5',
        height: 'auto',
        initialView: 'dayGridMonth',
        selectable: true,

        // Prevent clicking/adding dates before today
        validRange: {
            start: new Date().toISOString().split('T')[0]
        },

        // Map events from EventStorage (defined in event-core.js)
        events: function (fetchInfo, successCallback, failureCallback) {
            const events = EventStorage.getAll().map(event => ({
                ...event,
                id: event.uid // USE UID, NOT INDEX
            }));
            successCallback(events);
        },

        eventClick: function (info) {
            const uid = info.event.id; // This will now be the UID string
            if (uid) {
                openModalForEdit(uid);
            }
        },

        // When an empty date slot is clicked
        dateClick: function (info) {
            if (!eventForm) return;

            eventForm.reset();
            document.getElementById('edit-uid').value = "";
            document.querySelector('.modal-title').innerText = "Add Event";

            // Set the dates based on where the user clicked
            document.getElementById('start-date').value = info.dateStr;
            document.getElementById('end-date').value = info.dateStr;
            document.getElementById('end-date').min = info.dateStr;

            $("#myModal").modal("show");
        }
    });

    calendar.render();

    window.myFullCalendar = calendar;
});