document.addEventListener('DOMContentLoaded', () => {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;



    // Cargar el tema preferido del localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.toggle('dark-mode', savedTheme === 'dark');
    }

    // Cambiar el tema cuando se haga clic en el botón
    themeToggleButton.addEventListener('click', () => {
        const isDarkMode = body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        const inChargerElements = document.querySelectorAll('.in-charger');
        inChargerElements.forEach(inChargerDiv => {
            const handInHomeworkDiv = inChargerDiv.querySelector('.hand-in-homework');
            const bgColor = handInHomeworkDiv && handInHomeworkDiv.style.display === 'block'
                ? (isDarkMode ? '#111111' : '#e0e0e0')
                : '';
            inChargerDiv.style.backgroundColor = bgColor;
        });
    });
});