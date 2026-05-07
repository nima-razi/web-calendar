const AppNotifications = {
    _upcomingNotified: new Set(), // Track 15-minute warnings
    _startedNotified: new Set(),  // Track "Started Now" alerts

    /**
     * 1. Initialize & Request Permissions
     */
    init: async function () {
        if (!("Notification" in window)) {
            console.error("This browser does not support desktop notifications.");
            return;
        }

        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            await Notification.requestPermission();
        }

        // Start the heartbeat if we have permission
        if (Notification.permission === "granted") {
            this.startHeartbeat();
        }
    },

    /**
     * 2. The Heartbeat: Checks for upcoming events every 60 seconds
     */
    startHeartbeat: function () {
        // Run once immediately, then every minute
        this.checkUpcomingEvents();
        setInterval(() => this.checkUpcomingEvents(), 60000);
    },

    checkUpcomingEvents: function () {
        const events = EventStorage.getAll();
        const now = new Date();

        events.forEach(event => {
            const startTime = new Date(event.start);
            const timeDiffMs = startTime - now;
            const timeDiffMins = timeDiffMs / (1000 * 60);

            // 1. "STARTING NOW" NOTIFICATION
            // Trigger if the event started in the last 60 seconds or is about to start
            if (timeDiffMins <= 0 && timeDiffMins > -1) {
                if (!this._startedNotified.has(event.uid)) {
                    this.show(`🚀 Starting Now: ${event.title}`, "Click to view event details.");
                    this._startedNotified.add(event.uid);

                    // Cleanup: if we alerted "started", we don't need the "upcoming" flag anymore
                    this._upcomingNotified.add(event.uid);
                }
            }

            // 2. "UPCOMING" WARNING (e.g., 15 minutes before)
            else if (timeDiffMins > 0 && timeDiffMins <= 15) {
                if (!this._upcomingNotified.has(event.uid)) {
                    this.show(`🔔 Upcoming: ${event.title}`, `Starting in ${Math.round(timeDiffMins)} minutes.`);
                    this._upcomingNotified.add(event.uid);
                }
            }
        });

        // 3. OPTIONAL: CLEANUP
        // If an event ended more than an hour ago, remove from Sets to keep memory lean
        this.cleanupNotifiedSets(now);
    },

    cleanupNotifiedSets: function (now) {
        // (Optional logic to loop through sets and remove UIDs for old events)
    },

    show: function (title, body) {
        if (Notification.permission === "granted") {
            new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                tag: 'calendar-event' // Replaces previous notification so they don't stack up too high
            });
        }
    }
};

// Start the engine
AppNotifications.init();