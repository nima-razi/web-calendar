const CALENDAR_STORAGE_KEY = 'calendar_events_data';

function generateUUID() {
    return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

const EventStorage = {
    getAll: () => JSON.parse(localStorage.getItem(CALENDAR_STORAGE_KEY) || '[]'),

    _persist: (events) => localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events)),

    add: function (event) {
        const events = this.getAll();
        event.uid = generateUUID();
        events.push(event);
        this._persist(events);
    },

    update: function (uid, updatedEvent) {
        const events = this.getAll();
        const index = events.findIndex(e => e.uid === uid);
        if (index !== -1) {
            updatedEvent.uid = uid;
            events[index] = updatedEvent;
            this._persist(events);
        }
    },

    remove: function (uid) {
        const events = this.getAll().filter(e => e.uid !== uid);
        this._persist(events);
    }
};

function openModalForEdit(uid) {
    const events = EventStorage.getAll();
    const event = events.find(e => e.uid === uid);

    if (!event) {
        console.error("Event not found with UID:", uid);
        return;
    }

    const uidField = document.getElementById('edit-uid');
    if (uidField) {
        uidField.value = uid;
    }

    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-url').value = event.url || '';
    document.getElementById('event-details').value = event.extendedProps?.details || '';

    if (event.start) {
        const [startDate, startTime] = event.start.split('T');
        document.getElementById('start-date').value = startDate;
        document.getElementById('start-time').value = startTime?.substring(0, 5) || '';
    }

    if (event.end) {
        const [endDate, endTime] = event.end.split('T');
        document.getElementById('end-date').value = endDate;
        document.getElementById('end-time').value = endTime?.substring(0, 5) || '';
    }

    document.querySelector('.modal-title').innerText = "Edit Event";

    const myModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal'));
    myModal.show();
}

document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('eventForm');
    if (!eventForm) return;

    eventForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!eventForm.checkValidity()) {
            eventForm.classList.add('was-validated');
            return;
        }

        const uid = document.getElementById('edit-uid').value;
        const eventData = {
            title: document.getElementById('event-title').value,
            start: `${document.getElementById('start-date').value}T${document.getElementById('start-time').value}`,
            end: `${document.getElementById('end-date').value}T${document.getElementById('end-time').value}`,
            url: document.getElementById('event-url').value,
            extendedProps: { details: document.getElementById('event-details').value }
        };

        if (uid === "") {
            EventStorage.add(eventData);
        } else {
            EventStorage.update(uid, eventData);
        }

        $("#myModal").modal("hide");

        if (typeof renderDashboard === "function") renderDashboard();
        if (window.myFullCalendar) {
            window.myFullCalendar.refetchEvents(); 
        }
    });
});