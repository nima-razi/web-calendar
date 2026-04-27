document.addEventListener('DOMContentLoaded', () => {
    // 1. Helper Function: Needs to be in the outer scope
    const downloadFile = (content, fileName, contentType) => {
        const file = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
    };

    // 2. Import Logic
    const importInput = document.getElementById('input-import-json');
    if (importInput) {
        importInput.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);

                    // 1. Sanitize and Handle Events
                    // Extract events from the import (handle array or object wrapper)
                    const rawEvents = Array.isArray(importedData) ? importedData : (importedData.events || []);

                    // Ensure every event has a UID. If it's an old file without UIDs, generate them.
                    const sanitizedEvents = rawEvents.map(ev => ({
                        ...ev,
                        uid: ev.uid || generateUUID()
                    }));

                    // Merge with existing events
                    const existingEvents = EventStorage.getAll();
                    const mergedEvents = [...existingEvents, ...sanitizedEvents];

                    // Save the clean, unique set
                    EventStorage._persist(mergedEvents);

                    // 2. Handle Settings
                    if (importedData.density) {
                        localStorage.setItem('calendarDensity', importedData.density);
                        if (typeof applyDensity === 'function') applyDensity(importedData.density);
                    }

                    if (importedData.theme) {
                        localStorage.setItem('themePreference', importedData.theme);
                        if (typeof applyTheme === 'function') applyTheme(importedData.theme);
                    }

                    alert("Import successful! Your events have been updated.");
                    importInput.value = ''; // Reset input
                } catch (err) {
                    console.error("Import Error:", err);
                    alert("Invalid JSON file. Please check the format.");
                }
            };
            reader.readAsText(file);
        };
    }

    // 3. Delete All Logic
    const confirmClear = document.getElementById('confirm-delete-btn');
    if (confirmClear) {
        confirmClear.onclick = () => { localStorage.clear(); window.location.reload(); };
    }

    // 4. Export Logic (The missing part)
    const btnJson = document.getElementById('btn-export-json');
    const btnCsv = document.getElementById('btn-export-csv');

    if (btnJson) {
        btnJson.addEventListener('click', (e) => {
            e.preventDefault();
            const backupBundle = {
                events: EventStorage.getAll(),
                density: localStorage.getItem('calendarDensity') || 'comfortable',
                theme: localStorage.getItem('themePreference') || 'system'
            };
            downloadFile(JSON.stringify(backupBundle, null, 2), 'calendar-full-backup.json', 'application/json');
        });
    }

    if (btnCsv) {
        btnCsv.addEventListener('click', (e) => {
            e.preventDefault();
            const data = EventStorage.getAll();
            if (!data || data.length === 0) { alert("No events to export."); return; }

            const headers = ["title", "start", "end", "url"];
            const csvRows = [headers.join(','), ...data.map(row =>
                headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
            )];

            downloadFile(csvRows.join('\r\n'), 'calendar-events.csv', 'text/csv');
        });
    }
});