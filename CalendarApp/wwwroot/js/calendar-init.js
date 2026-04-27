document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const eventForm = document.getElementById('eventForm');

    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        themeSystem: 'bootstrap5',
        height: 'auto',
        initialView: 'dayGridMonth',
        selectable: true,

        validRange: {
            start: new Date().toISOString().split('T')[0]
        },

        events: function (fetchInfo, successCallback, failureCallback) {
            const events = EventStorage.getAll().map(event => ({
                ...event,
                id: event.uid
            }));
            successCallback(events);
        },

        eventClick: function (info) {
            const uid = info.event.id; 
            if (uid) {
                openModalForEdit(uid);
            }
        },

        dateClick: function (info) {
            if (!eventForm) return;

            eventForm.reset();
            document.getElementById('edit-uid').value = "";
            document.querySelector('.modal-title').innerText = "Add Event";

            document.getElementById('start-date').value = info.dateStr;
            document.getElementById('end-date').value = info.dateStr;
            document.getElementById('end-date').min = info.dateStr;

            $("#myModal").modal("show");
        }
    });

    calendar.render();

    window.myFullCalendar = calendar;
});