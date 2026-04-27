// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
// site.js - Centralized Data Manager
const CALENDAR_STORAGE_KEY = 'calendar_events_data';

const EventStorage = {
    // 1. Fetch all events
    getAll: function () {
        const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // 2. Save the entire array (private helper)
    _persist: function (events) {
        localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
    },

    // 3. Add a new event
    add: function (event) {
        const events = this.getAll();
        events.push(event);
        this._persist(events);
    },

    // 4. Update an existing event by index
    update: function (index, updatedEvent) {
        const events = this.getAll();
        events[index] = updatedEvent;
        this._persist(events);
    },

    // 5. Delete an event by index
    remove: function (index) {
        const events = this.getAll();
        events.splice(index, 1);
        this._persist(events);
    }
};

function openModalForEdit(index) {
    const events = EventStorage.getAll();
    const event = events[index];
    if (!event) return;

    // Set the hidden index field
    const indexField = document.getElementById('edit-index');
    if (indexField) indexField.value = index;

    // Populate fields
    document.getElementById('event-title').value = event.title || '';

    if (event.start) {
        const startParts = event.start.split('T');
        document.getElementById('start-date').value = startParts[0];
        document.getElementById('start-time').value = startParts[1] ? startParts[1].substring(0, 5) : '';
    }

    if (event.end) {
        const endParts = event.end.split('T');
        document.getElementById('end-date').value = endParts[0];
        document.getElementById('end-time').value = endParts[1] ? endParts[1].substring(0, 5) : '';
    }

    document.getElementById('event-url').value = event.url || '';
    document.getElementById('event-details').value = event.extendedProps?.details || '';

    // Trigger the constraints check so the end-time/date min values are set correctly
    const startDateInput = document.getElementById('start-date');
    const startTimeInput = document.getElementById('start-time');
    const endDateInput = document.getElementById('end-date');
    const endTimeInput = document.getElementById('end-time');

    endDateInput.min = startDateInput.value;
    if (startDateInput.value === endDateInput.value) {
        endTimeInput.min = startTimeInput.value;
    }

    // Update Modal UI
    document.querySelector('.modal-title').innerText = "Edit Event";
    $("#myModal").modal("show");
}

// Global initialization: Runs on every page load
const savedTheme = localStorage.getItem('themePreference') || 'system';
applyTheme(savedTheme);

document.addEventListener('DOMContentLoaded', () => {
    const radios = document.querySelectorAll('input[name="inlineRadioOptions"]');

    if (radios.length > 0) {
        // Set the correct radio button based on the stored value
        radios.forEach(radio => {
            if (radio.value === savedTheme) {
                radio.checked = true;
            }

            radio.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                localStorage.setItem('themePreference', newTheme);
                applyTheme(newTheme);
            });
        });
    }
});

const densityRadios = document.querySelectorAll('input[name="densityOption"]');

// 1. Set the initial state of the radio buttons on page load
const currentDensity = localStorage.getItem('calendarDensity') || 'comfortable';
const activeDensityRadio = document.querySelector(`input[name="densityOption"][value="${currentDensity}"]`);
if (activeDensityRadio) activeDensityRadio.checked = true;

// 2. Listen for changes
densityRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const uniqueEvents = Array.from(new Set(mergedEvents.map(JSON.stringify))).map(JSON.parse);
        localStorage.setItem('calendar_events_data', JSON.stringify(uniqueEvents));
        localStorage.setItem('calendarDensity', e.target.value);
        // Apply it immediately if we are on the calendar page
        applyDensity(e.target.value);
    });
});

// 3. Helper to apply the class to the body or calendar container
function applyDensity(density) {
    document.documentElement.setAttribute('data-calendar-density', density);
}

// Initial application on load
applyDensity(currentDensity);

document.addEventListener('DOMContentLoaded', () => {
    const importInput = document.getElementById('input-import-json');
    const modalEl = document.getElementById('importResultModal');

    // Helper to show the modal with a specific message
    const showImportFeedback = (message, showReload = false) => {
        document.getElementById('import-modal-body-text').innerText = message;
        const reloadBtn = document.getElementById('import-reload-btn');

        if (showReload) {
            reloadBtn.style.display = 'block';
        } else {
            reloadBtn.style.display = 'none';
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    };

    if (importInput) {
        importInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // 1. Get existing data
                    const existingEvents = JSON.parse(localStorage.getItem('calendar_events_data') || '[]');

                    // 2. Prepare new events (handling both single object or array)
                    const newEvents = Array.isArray(importedData) ? importedData : (importedData.events || []);

                    // 3. Merge: Combine both arrays
                    const mergedEvents = [...existingEvents, ...newEvents];

                    // 4. Save the merged result
                    localStorage.setItem('calendar_events_data', JSON.stringify(mergedEvents));

                    // Handle settings (Density/Theme)
                    if (importedData.density) localStorage.setItem('calendarDensity', importedData.density);
                    if (importedData.theme) localStorage.setItem('themePreference', importedData.theme);

                    showImportFeedback("Events merged successfully! Please refresh to apply changes.", true);
                    importInput.value = '';

                } catch (err) {
                    showImportFeedback("Invalid JSON file.");
                }
            };

            reader.readAsText(file);
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const startDateInput = document.getElementById('start-date');
    const startTimeInput = document.getElementById('start-time');
    const endDateInput = document.getElementById('end-date');
    const endTimeInput = document.getElementById('end-time');

    function syncConstraints() {
        // 1. End date cannot be before start date
        endDateInput.min = startDateInput.value;

        // 2. If start and end dates are the same, end time must be after start time
        if (startDateInput.value === endDateInput.value) {
            endTimeInput.min = startTimeInput.value;

            // If current end time is now invalid (earlier than new start time), reset it
            if (endTimeInput.value < startTimeInput.value && endTimeInput.value !== "") {
                endTimeInput.value = startTimeInput.value;
            }
        } else {
            // If dates are different, there is no time restriction
            endTimeInput.min = "";
        }
    }

    // Run sync whenever any start/end field changes
    [startDateInput, startTimeInput, endDateInput].forEach(input => {
        input.addEventListener('change', syncConstraints);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Select the modal and the confirm button
    const deleteModalEl = document.getElementById('deleteDataModal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    // Only proceed if the modal exists on the current page
    if (deleteModalEl && confirmDeleteBtn) {
        // Initialize the Bootstrap Modal instance
        const deleteModal = new bootstrap.Modal(deleteModalEl);

        confirmDeleteBtn.addEventListener('click', () => {
            // 1. Perform the deletion
            localStorage.clear();

            // 2. Hide the modal
            deleteModal.hide();

            // 3. Optional: Reload to update UI
            window.location.reload();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const btnJson = document.getElementById('btn-export-json');
    const btnCsv = document.getElementById('btn-export-csv');

    const downloadFile = (content, fileName, contentType) => {
        const file = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a); // Append to body to ensure browser triggers download
        a.click();

        setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
    };

    // --- JSON EXPORT (Full App Backup) ---
    if (btnJson) {
        btnJson.addEventListener('click', (e) => {
            e.preventDefault();

            // Gather all three keys into one "Bundle" object
            const backupBundle = {
                events: JSON.parse(localStorage.getItem('calendar_events_data') || '[]'),
                density: localStorage.getItem('calendarDensity') || 'comfortable',
                theme: localStorage.getItem('themePreference') || 'system'
            };

            const formattedJson = JSON.stringify(backupBundle, null, 2);
            downloadFile(formattedJson, 'calendar-full-backup.json', 'application/json');
        });
    }

    // --- CSV EXPORT (Events Only) ---
    if (btnCsv) {
        btnCsv.addEventListener('click', (e) => {
            e.preventDefault();

            const rawData = localStorage.getItem('calendar_events_data');
            if (!rawData || rawData === '[]') {
                alert("No events found to export.");
                return;
            }

            try {
                const jsonArray = JSON.parse(rawData);
                const headers = Object.keys(jsonArray[0]);

                const csvRows = [
                    headers.join(','),
                    ...jsonArray.map(row =>
                        headers.map(fieldName => {
                            let value = row[fieldName] ?? '';
                            return `"${String(value).replace(/"/g, '""')}"`;
                        }).join(',')
                    )
                ];

                downloadFile(csvRows.join('\r\n'), 'calendar-events.csv', 'text/csv');
            } catch (err) {
                alert("Failed to parse event data for CSV.");
            }
        });
    }
});

// Keep applyTheme outside so it's available everywhere
function applyTheme(theme) {
    let finalTheme = theme;
    if (theme === 'system') {
        finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-bs-theme', finalTheme);
}