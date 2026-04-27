(function () {
    const pref = localStorage.getItem('themePreference') || 'system';
    let theme = pref;

    if (pref === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-bs-theme', theme);
})();