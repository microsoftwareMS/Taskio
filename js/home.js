document.addEventListener('DOMContentLoaded', () => {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;



    // Cargar el tema preferido del localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.toggle('dark-mode', savedTheme === 'dark');
    }
});
