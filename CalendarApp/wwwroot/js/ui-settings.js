function applyTheme(theme) {
    let final = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    document.documentElement.setAttribute('data-bs-theme', final);
}

function applyDensity(density) {
    document.documentElement.setAttribute('data-calendar-density', density);
}

// Init
const currentTheme = localStorage.getItem('themePreference') || 'system';
const currentDensity = localStorage.getItem('calendarDensity') || 'comfortable';
applyTheme(currentTheme);
applyDensity(currentDensity);

// Listeners for Preferences Page
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="inlineRadioOptions"]').forEach(r => {
        if (r.value === currentTheme) r.checked = true;
        r.onchange = (e) => { localStorage.setItem('themePreference', e.target.value); applyTheme(e.target.value); };
    });
    document.querySelectorAll('input[name="densityOption"]').forEach(r => {
        if (r.value === currentDensity) r.checked = true;
        r.onchange = (e) => { localStorage.setItem('calendarDensity', e.target.value); applyDensity(e.target.value); };
    });
});