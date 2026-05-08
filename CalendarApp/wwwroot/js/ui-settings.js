function applyTheme(theme) {
    let final = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    document.documentElement.setAttribute('data-bs-theme', final);
}

function applyDensity(density) {
    document.documentElement.setAttribute('data-calendar-density', density);
}

const currentTheme = localStorage.getItem('themePreference') || 'system';
applyTheme(currentTheme);

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="inlineRadioOptions"]').forEach(r => {
        if (r.value === currentTheme) r.checked = true;
        r.onchange = (e) => { localStorage.setItem('themePreference', e.target.value); applyTheme(e.target.value); };
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const notifSwitch = document.getElementById('switchNotifications');
    const statusText = document.getElementById('notifStatusText');

    if (notifSwitch) {
        // 1. Load initial state (Default to 'true' if never set)
        const isEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
        notifSwitch.checked = isEnabled;
        statusText.innerText = isEnabled ? "ON" : "OFF";

        // 2. Handle changes
        notifSwitch.onchange = (e) => {
            const checked = e.target.checked;
            localStorage.setItem('notificationsEnabled', checked);
            statusText.innerText = checked ? "ON" : "OFF";

            // If they turn it ON, try to request permission immediately
            if (checked && Notification.permission !== "granted") {
                Notification.requestPermission();
            }
        };
    }
});