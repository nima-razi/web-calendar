document.addEventListener('DOMContentLoaded', function () {
    renderDashboard();

    const heroBtn = document.getElementById('hero-add-event-btn');
    if (heroBtn) {
        heroBtn.addEventListener('click', function () {
            const eventForm = document.getElementById('eventForm');
            if (eventForm) {
                eventForm.reset();
                document.getElementById('edit-uid').value = "";
                document.querySelector('.modal-title').innerText = "Add Event";

                const today = new Date().toISOString().split('T')[0];
                document.getElementById('start-date').value = today;
                document.getElementById('end-date').value = today;
                document.getElementById('end-date').min = today;

                const myModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal'));
                myModal.show();
            }
        });
    }

    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            const uid = document.getElementById('delete-index-field').value;
            EventStorage.remove(uid);

            const modalEl = document.getElementById('deleteModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            renderDashboard();
        });
    }
});

window.renderDashboard = function () {
    const events = EventStorage.getAll();
    const now = new Date();

    // 1. Get all three containers
    const upcomingContainer = document.getElementById('upcoming-events-container');
    const ongoingContainer = document.getElementById('ongoing-events-container');
    const previousContainer = document.getElementById('previous-events-container');

    if (!upcomingContainer || !ongoingContainer || !previousContainer) return;

    // Clear all containers
    upcomingContainer.innerHTML = '';
    ongoingContainer.innerHTML = '';
    previousContainer.innerHTML = '';

    events.forEach((event) => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const cardHtml = createEventCard(event, event.uid);

        /**
         * 2. Logic for Three Categories:
         * - Upcoming: Start date is in the future.
         * - Ongoing: Start date has passed, but end date is still in the future.
         * - Previous: End date has already passed.
         */
        if (startDate > now) {
            upcomingContainer.innerHTML += cardHtml;
        }
        else if (startDate <= now && endDate >= now) {
            ongoingContainer.innerHTML += cardHtml;
        }
        else {
            previousContainer.innerHTML += cardHtml;
        }
    });

    attachCardListeners();

    // 3. Handle empty states
    if (upcomingContainer.innerHTML === '') upcomingContainer.innerHTML = '<p class="text-muted small">No upcoming events.</p>';
    if (ongoingContainer.innerHTML === '') ongoingContainer.innerHTML = '<p class="text-muted small">No events currently in progress.</p>';
    if (previousContainer.innerHTML === '') previousContainer.innerHTML = '<p class="text-muted small">No past events.</p>';
};

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
            <div class="d-flex flex-wrap text-body-secondary small">
                <div class="me-3 mb-1 d-flex align-items-center">
                    <i class="bi bi-calendar-week-fill me-1"></i><span>${start.d} - ${end.d}</span>
                </div>
                 <div class="mb-1 d-flex align-items-center">
                    <i class="bi bi-clock-fill me-1"></i><span>${start.t} - ${end.t}</span>
                 </div>
            </div>
            <p class="card-text text-truncate">${event.extendedProps?.details || 'No details provided.'}</p>
    
            <!-- Wrapper to align buttons to the end -->
            <div class="d-flex justify-content-end">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-primary" data-role="edit-trigger" data-uid="${event.uid}">
                        <i class="bi bi-pencil-fill"></i> Edit
                    </button>
                    <button type="button" class="btn btn-danger" data-role="delete-trigger">
                        <i class="bi bi-trash-fill"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function attachCardListeners() {
    document.querySelectorAll('[data-role="edit-trigger"]').forEach(btn => {
        btn.onclick = function () {
            const index = this.getAttribute('data-uid');
            openModalForEdit(index);
        };
    });

    document.querySelectorAll('[data-role="delete-trigger"]').forEach(btn => {
        btn.onclick = function () {
            const index = this.closest('.event-item').querySelector('[data-role="edit-trigger"]').getAttribute('data-uid');
            document.getElementById('delete-index-field').value = index;

            const modalEl = document.getElementById('deleteModal');
            let modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
        };
    });
}