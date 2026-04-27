/**
 * index-dashboard.js
 * Strictly handles the UI rendering for the Index/Dashboard page.
 */

document.addEventListener('DOMContentLoaded', function () {
    // Initial render
    renderDashboard();

    // Index-Specific: Hero "Add Event" button
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

    // Index-Specific: Confirm Delete inside the Delete Modal
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            const index = document.getElementById('delete-index-field').value;

            // Use the shared storage logic
            EventStorage.remove(index);

            // Close modal and refresh UI
            const modalEl = document.getElementById('deleteModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            renderDashboard();
        });
    }
});

// Make this global so event-core.js can call it after a form save
window.renderDashboard = function () {
    const events = EventStorage.getAll();
    const now = new Date();
    const upcomingContainer = document.getElementById('upcoming-events-container');
    const previousContainer = document.getElementById('previous-events-container');

    if (!upcomingContainer || !previousContainer) return;

    upcomingContainer.innerHTML = '';
    previousContainer.innerHTML = '';

    events.forEach((event, index) => {
        const eventDate = new Date(event.start);
        const cardHtml = createEventCard(event, event.uid);

        // Logic to split between upcoming and past
        if (eventDate >= now) {
            upcomingContainer.innerHTML += cardHtml;
        } else {
            previousContainer.innerHTML += cardHtml;
        }
    });

    // Re-attach listeners to the new HTML buttons
    attachCardListeners();

    // Handle empty states
    if (upcomingContainer.innerHTML === '') upcomingContainer.innerHTML = '<p class="text-muted">No upcoming events.</p>';
    if (previousContainer.innerHTML === '') previousContainer.innerHTML = '<p class="text-muted">No past events.</p>';
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
            <h6 class="card-subtitle mb-2 text-body-secondary">
                <i class="bi bi-calendar3"></i> ${start.d} - ${end.d} <span class="mx-1">|</span> <i class="bi bi-clock"></i> ${start.t} - ${end.t}
            </h6>
            <p class="card-text text-truncate" style="max-width: 100%;">
                ${event.extendedProps?.details || 'No details provided.'}
            </p>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-primary" data-role="edit-trigger" data-uid="${event.uid}">
                    <i class="bi bi-pencil-fill"></i> Edit
                </button>
                <button type="button" class="btn btn-sm btn-danger" data-role="delete-trigger">
                    <i class="bi bi-trash-fill"></i> Delete
                </button>
            </div>
        </div>
    `;
}

function attachCardListeners() {
    // Edit trigger
    document.querySelectorAll('[data-role="edit-trigger"]').forEach(btn => {
        btn.onclick = function () {
            const index = this.getAttribute('data-uid');
            // This function is defined in event-core.js
            openModalForEdit(index);
        };
    });

    // Delete trigger (opens the delete confirmation modal)
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