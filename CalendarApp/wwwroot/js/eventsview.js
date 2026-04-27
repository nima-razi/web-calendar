const STORAGE_KEY = 'calendar_events_data';

function loadEvents() {
    const savedEvents = localStorage.getItem(STORAGE_KEY);
    return savedEvents ? JSON.parse(savedEvents) : [];
}

document.addEventListener('DOMContentLoaded', function () {
    renderDashboard();

    // Logic for Hero "Add Event" button
    const heroBtn = document.getElementById('hero-add-event-btn');
    if (heroBtn) {
        heroBtn.addEventListener('click', function () {
            const eventForm = document.getElementById('eventForm');
            eventForm.reset();
            document.getElementById('edit-index').value = "";
            document.querySelector('.modal-title').innerText = "Add Event";

            const today = new Date().toISOString().split('T')[0];
            document.getElementById('start-date').value = today;
            document.getElementById('end-date').value = today;
            document.getElementById('end-date').min = today;

            const myModal = new bootstrap.Modal(document.getElementById('myModal'));
            myModal.show();
        });
    }

    // --- FIX: Move the "Confirm Delete" listener HERE (Outside renderDashboard) ---
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            const index = document.getElementById('delete-index-field').value;

            // Perform the actual deletion
            EventStorage.remove(index);

            // Close the modal
            const modalEl = document.getElementById('deleteModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            // Refresh the dashboard
            renderDashboard();
        });
    }
});

function renderDashboard() {
    const events = EventStorage.getAll();
    const now = new Date();
    const upcomingContainer = document.getElementById('upcoming-events-container');
    const previousContainer = document.getElementById('previous-events-container');

    if (!upcomingContainer || !previousContainer) return;

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

    // Handle Edit buttons
    document.querySelectorAll('[data-role="edit-trigger"]').forEach(btn => {
        btn.onclick = function () {
            const index = this.getAttribute('data-index');
            openModalForEdit(index);
        };
    });

    // Handle Trash buttons
    document.querySelectorAll('[data-role="delete-trigger"]').forEach(btn => {
        btn.onclick = function () {
            // Find the index by looking for the sibling trigger that has the data-index
            const index = this.closest('.event-item').querySelector('[data-role="edit-trigger"]').getAttribute('data-index');
            document.getElementById('delete-index-field').value = index;

            const modalEl = document.getElementById('deleteModal');
            let modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
        };
    });

    if (upcomingContainer.innerHTML === '') upcomingContainer.innerHTML = '<p class="text-muted">No upcoming events.</p>';
    if (previousContainer.innerHTML === '') previousContainer.innerHTML = '<p class="text-muted">No past events.</p>';
}

function createEventCard(event, index) {
    const format = (dateStr) => {
        if (!dateStr) return { d: '--/--/----', t: '--:--' };
        const dt = new Date(dateStr);
        return {
            d: dt.toLocaleDateString('en-GB'),
            t: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const start = format(event.start);
    const end = format(event.end);

    return `
        <div class="event-item mb-3">
            <h5 class="card-title">${event.title}</h5>
            <h6 class="card-subtitle mb-2 text-body-secondary">
                <i class="bi bi-calendar3"></i> ${start.d} - ${end.d} <span class="mx-1">|</span> <i class="bi bi-clock"></i> ${start.t} - ${end.t}
            </h6>
            <p class="card-text text-truncate" style="max-width: 100%;">
                ${event.extendedProps?.details || 'No details provided.'}
            </p>
            <div class="btn-group" role="group" aria-label="Event actions">
                <button type="button" class="btn btn-primary" data-role="edit-trigger" data-index="${index}"><i class="bi bi-pencil-fill"></i> Edit</button>
                <button type="button" class="btn btn-danger" data-role="delete-trigger"><i class="bi bi-trash-fill"></i> Delete</button>
            </div>
        </div>
    `;
}

// Ensure eventForm is defined before adding listener
const eventForm = document.getElementById('eventForm');
if (eventForm) {
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
            EventStorage.add(eventData);
        } else {
            EventStorage.update(index, eventData);
        }

        $("#myModal").modal("hide");

        if (typeof renderDashboard === "function") renderDashboard();
        if (typeof calendar !== "undefined") {
            calendar.getEvents().forEach(el => el.remove());
            calendar.addEventSource(EventStorage.getAll());
        }
    });
}