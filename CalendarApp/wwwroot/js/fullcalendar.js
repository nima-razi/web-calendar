document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var currentTheme = localStorage.getItem('bsTheme') || 'dark';
    var eventForm = document.getElementById('eventForm');

    // Check if elements exist to prevent errors
    if (!calendarEl || !eventForm) return;

    // Input Selectors
    var startDateInput = document.getElementById('start-date');
    var startTimeInput = document.getElementById('start-time');
    var endDateInput = document.getElementById('end-date');
    var endTimeInput = document.getElementById('end-time');
    var eventTitleInput = document.getElementById('event-title');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        themeSystem: 'bootstrap5',
        height: 'auto',
        initialView: 'dayGridMonth',
        selectable: true,
        // Prevent clicking dates before today
        validRange: { start: new Date().toISOString().split('T')[0] },
        // Use the centralized storage from site.js
        events: EventStorage.getAll().map((event, index) => ({
            ...event,
            id: index.toString()
        })),
        eventClick: function (info) {
            // info.event.id is now our array index!
            const index = info.event.id;

            if (index !== undefined) {
                openModalForEdit(index);
            }
        },
        dateClick: function (info) {
            eventForm.reset();
            document.getElementById('edit-index').value = ""; // CLEAR THE INDEX
            document.querySelector('.modal-title').innerText = "Add Event"; // Reset Title

            startDateInput.value = info.dateStr;
            endDateInput.value = info.dateStr;
            endDateInput.min = info.dateStr;

            $("#myModal").modal("show");
        }
    });
    calendar.render();

    // Handle Form Submission
    eventForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!eventForm.checkValidity()) {
            eventForm.classList.add('was-validated');
            return;
        }

        const index = document.getElementById('edit-index').value;
        const eventData = {
            title: document.getElementById('event-title').value,
            start: `${document.getElementById('start-date').value}T${document.getElementById('start-time').value}`,
            end: `${document.getElementById('end-date').value}T${document.getElementById('end-time').value}`,
            url: document.getElementById('event-url').value,
            extendedProps: {
                details: document.getElementById('event-details').value
            }
        };

        if (index === "") {
            // ADD NEW
            EventStorage.add(eventData);
        } else {
            // UPDATE EXISTING
            EventStorage.update(index, eventData);
        }

        $("#myModal").modal("hide");

        // REFRESH THE CALENDAR DATA
        calendar.removeAllEvents();
        calendar.addEventSource(EventStorage.getAll().map((event, idx) => ({
            ...event,
            id: idx.toString()
        })));
    });

    // Dynamic "Ending Date" restriction
    startDateInput.addEventListener('change', function () {
        endDateInput.min = this.value;
        if (endDateInput.value < this.value) {
            endDateInput.value = this.value;
        }
    });
});