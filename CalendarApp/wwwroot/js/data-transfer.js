document.addEventListener('DOMContentLoaded', () => {
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

    const importInput = document.getElementById('input-import-json');
    if (importInput) {
        importInput.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    const rawEvents = Array.isArray(importedData) ? importedData : (importedData.events || []);
                    const sanitizedEvents = rawEvents.map(ev => ({
                        ...ev,
                        uid: ev.uid || generateUUID()
                    }));

                    const existingEvents = EventStorage.getAll();
                    const mergedEvents = [...existingEvents, ...sanitizedEvents];

                    EventStorage._persist(mergedEvents);

                    if (importedData.density) {
                        localStorage.setItem('calendarDensity', importedData.density);
                        if (typeof applyDensity === 'function') applyDensity(importedData.density);
                    }

                    if (importedData.theme) {
                        localStorage.setItem('themePreference', importedData.theme);
                        if (typeof applyTheme === 'function') applyTheme(importedData.theme);
                    }

                    alert("Import successful! Your events have been updated.");
                    importInput.value = '';
                } catch (err) {
                    console.error("Import Error:", err);
                    alert("Invalid JSON file. Please check the format.");
                }
            };
            reader.readAsText(file);
        };
    }

    const confirmClear = document.getElementById('confirm-delete-btn');
    if (confirmClear) {
        confirmClear.onclick = () => { localStorage.clear(); window.location.reload(); };
    }

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