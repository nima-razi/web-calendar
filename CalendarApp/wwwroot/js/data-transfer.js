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
    // Inside data-transfer.js
    if (importInput) {
        importInput.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return; // User cancelled

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    let eventsToProcess = [];

                    if (file.name.endsWith('.json')) {
                        let rawData = JSON.parse(event.target.result);
                        eventsToProcess = Array.isArray(rawData) ? rawData : (rawData.events || []);
                    } else if (file.name.endsWith('.csv')) {
                        eventsToProcess = ExternalImportParsers.parseCSV(event.target.result);
                    }

                    const finalized = eventsToProcess.map(ev => {
                        const title = ev.title || ev.summary || ev.subject || "Untitled Event";
                        const start = ev.start || ev.start_time || ev.startDate;
                        const end = ev.end || ev.end_time || ev.endDate;
                        const details = ev.extendedProps?.details || ev.description || ev.notes || "";

                        return {
                            uid: ev.uid || generateUUID(),
                            title: title,
                            start: start,
                            end: end,
                            url: ev.url || "",
                            extendedProps: { details: details }
                        };
                    });

                    const validEvents = finalized.filter(ev => ev.start && ev.start !== "undefinedTundefined");

                    if (validEvents.length === 0) {
                        alert("Could not find valid dates or titles in the file.");
                        return;
                    }

                    // Save data
                    const existing = EventStorage.getAll();
                    EventStorage._persist([...existing, ...validEvents]);

                    // --- NEW MODAL LOGIC ---

                    // 1. Find the modal element
                    const modalEl = document.getElementById('importResultModal'); // Ensure this ID matches your _ImportModal.cshtml
                    if (modalEl) {
                        // 2. Optional: Update a span inside the modal to show the count
                        const countSpan = modalEl.querySelector('#import-count');
                        if (countSpan) countSpan.innerText = validEvents.length;

                        // 3. Initialize and Show the Bootstrap Modal
                        const bsImportModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                        bsImportModal.show();

                        // 4. Reload the page ONLY after the user closes the modal
                        modalEl.addEventListener('hidden.bs.modal', function () {
                            window.location.reload();
                        }, { once: true }); // 'once' ensures it doesn't stack listeners
                    } else {
                        // Fallback if modal ID is wrong
                        alert(`Successfully imported ${validEvents.length} events!`);
                        window.location.reload();
                    }

                    importInput.value = '';

                } catch (err) {
                    console.error("Import Error:", err);
                    alert("Failed to parse file. Ensure the format is correct.");
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

    const ExternalImportParsers = {
        // Parse CSV from Google/Outlook
        parseCSV: (csvText) => {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            return lines.slice(1).filter(line => line.trim()).map(line => {
                const values = line.split(',').map(v => v.replace(/"/g, '').trim());

                // Attempt to find data by common column names
                const getVal = (possibleNames) => {
                    const colIndex = headers.findIndex(h => possibleNames.includes(h));
                    return colIndex !== -1 ? values[colIndex] : null;
                };

                const title = getVal(['subject', 'title', 'event', 'summary']);
                const startDate = getVal(['start date', 'start_date']);
                const startTime = getVal(['start time', 'start_time']) || '00:00';
                const endDate = getVal(['end date', 'end_date']);
                const endTime = getVal(['end time', 'end_time']) || '00:00';

                return {
                    title: title || "Untitled Event",
                    start: `${startDate}T${startTime}`,
                    end: `${endDate}T${endTime}`,
                    extendedProps: { details: getVal(['description', 'details', 'notes']) || '' }
                };
            });
        }
    };
});