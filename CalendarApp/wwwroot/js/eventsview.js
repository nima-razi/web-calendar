const STORAGE_KEY = 'calendar_events_data';

function loadEvents() {
    const savedEvents = localStorage.getItem(STORAGE_KEY);
    return savedEvents ? JSON.parse(savedEvents) : [];
}

document.addEventListener('DOMContentLoaded', function () {
    renderDashboard();

    // Logic for Hero "Add Event" button
    document.getElementById('hero-add-event-btn').addEventListener('click', function () {
        const eventForm = document.getElementById('eventForm');
        eventForm.reset();

        // Clear hidden index for NEW event
        document.getElementById('edit-index').value = "";
        document.querySelector('.modal-title').innerText = "Add Event";

        // Set start/end to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('start-date').value = today;
        document.getElementById('end-date').value = today;
        document.getElementById('end-date').min = today;

        // Show the modal
        const myModal = new bootstrap.Modal(document.getElementById('myModal'));
        myModal.show();
    });
});

function renderDashboard() {
    const events = EventStorage.getAll();
    const now = new Date();
    const upcomingContainer = document.getElementById('upcoming-events-container');
    const previousContainer = document.getElementById('previous-events-container');

    // Clear containers first
    upcomingContainer.innerHTML = '';
    previousContainer.innerHTML = '';

    events.forEach((event, index) => {
        const eventDate = new Date(event.start);
        const cardHtml = createEventCard(event, index);

        if (eventDate >= now) {
            upcomingContainer.innerHTML += cardHtml;
        } else {
            previousContainer.innerHTML += cardHtml;
        }
    });

    // Add click listeners to all Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            openModalForEdit(index);
        });
    });

    document.querySelectorAll('.bi-trash-fill').forEach((icon) => {
        const btn = icon.closest('button');
        btn.addEventListener('click', function () {
            // Get index from the edit button next to the trash button
            const index = this.closest('.event-item').querySelector('.edit-btn').getAttribute('data-index');

            // 1. Set the hidden field in the modal
            document.getElementById('delete-index-field').value = index;

            // 2. Show the modal
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
            deleteModal.show();
        });
    });

    // Handle the "Delete" confirmation inside the modal
    document.getElementById('confirm-delete-btn').addEventListener('click', function () {
        const index = document.getElementById('delete-index-field').value;

        // Perform the actual deletion via your site.js EventStorage
        EventStorage.remove(index);

        // Close the modal
        const modalEl = document.getElementById('deleteModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Refresh the dashboard
        renderDashboard();
    });

    // Handle empty states
    if (upcomingContainer.innerHTML === '') upcomingContainer.innerHTML = '<p class="text-muted">No upcoming events.</p>';
    if (previousContainer.innerHTML === '') previousContainer.innerHTML = '<p class="text-muted">No past events.</p>';
}

function createEventCard(event, index) {
    // Helper to format Date objects
    const format = (dateStr) => {
        if (!dateStr) return { d: '--/--/----', t: '--:--' };
        const dt = new Date(dateStr);
        return {
            d: dt.toLocaleDateString('en-GB'), // DD/MM/YYYY
            t: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // HH:mm
        };
    };

    const start = format(event.start);
    const end = format(event.end);

    return `
        <div class="event-item mb-3">
            <h5 class="card-title">${event.title}</h5>
            <h6 class="card-subtitle mb-2 text-body-secondary">
                <i class="bi bi-calendar3"></i> ${start.d} - ${end.d} <span class="mx-1">-</span> <i class="bi bi-clock"></i> ${start.t} - ${end.t}
            </h6>
            <p class="card-text text-truncate" style="max-width: 100%;">
                ${event.extendedProps?.details || 'No details provided.'}
            </p>
            <div class="btn-group" role="group" aria-label="Event actions">
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-index="${index}"><i class="bi bi-pencil-fill"></i></button>
                <button type="button" class="btn btn-sm btn-danger"><i class="bi bi-trash-fill"></i></button>
            </div>
        </div>
    `;
}

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

    // Refresh the view
    if (typeof renderDashboard === "function") renderDashboard();
    if (typeof calendar !== "undefined") {
        calendar.getEvents().forEach(el => el.remove()); // Clear calendar
        calendar.addEventSource(EventStorage.getAll()); // Reload calendar
    }
});