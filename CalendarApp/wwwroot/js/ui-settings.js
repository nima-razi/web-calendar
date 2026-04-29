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