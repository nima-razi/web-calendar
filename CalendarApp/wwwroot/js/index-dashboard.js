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
            const index = document.getElementById('delete-index-field').value;

            EventStorage.remove(index);

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
    const upcomingContainer = document.getElementById('upcoming-events-container');
    const previousContainer = document.getElementById('previous-events-container');

    if (!upcomingContainer || !previousContainer) return;

    upcomingContainer.innerHTML = '';
    previousContainer.innerHTML = '';

    events.forEach((event, index) => {
        const eventDate = new Date(event.start);
        const cardHtml = createEventCard(event, event.uid);

        if (eventDate >= now) {
            upcomingContainer.innerHTML += cardHtml;
        } else {
            previousContainer.innerHTML += cardHtml;
        }
    });

    attachCardListeners();

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