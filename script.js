document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.sing-in-form');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const usernameInput = document.getElementById('login-email'); // Cambiado a 'login-email'
    const passwordInput = document.getElementById('login-password'); // Cambiado a 'login-password'
    const rememberMeCheckbox = document.getElementById('remember-me');
    const submitBtn = document.querySelector('.btn.solid');
    const floatingDiv = document.getElementById('floating-div');
    const floatingShadow = document.querySelector('.floating-shadow'); // Selecciona el div flotante con la clase floating-shadow

    // Verifica el tema guardado en el localStorage
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        body.classList.remove('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }

    // Maneja el cambio del tema
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        }
    });

    // Cargar datos guardados si existen
    if (localStorage.getItem('rememberMe') === 'true') {
        usernameInput.value = localStorage.getItem('username');
        passwordInput.value = localStorage.getItem('password');
        rememberMeCheckbox.checked = true;
    }

    // Manejar el envío del formulario
    submitBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Evita el envío del formulario
        console.log('Botón de envío clickeado'); // Verifica que esto se muestre en la consola
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
    
        if (!username || !password) {
            alert('Por favor, ingrese tanto un nombre de usuario como una contraseña.');
        } else {
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('username', username);
                localStorage.setItem('password', password);
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('username');
                localStorage.removeItem('password');
                localStorage.setItem('rememberMe', 'false');
            }
    
            // Muestra el div con clase floating-shadow
            floatingShadow.style.display = 'flex';
        }
    });
    
    // Añadir clase para animación al hacer clic en el botón de envío
    submitBtn.addEventListener('click', () => {
        submitBtn.classList.add('clicked');
        setTimeout(() => {
            submitBtn.classList.remove('clicked');
        }, 300); // Duración de la animación
    });

    // Ocultar el div floating-shadow cuando se haga clic en él
    floatingShadow.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que el clic se propague al floating-div
        floatingShadow.style.display = 'none';
    });

    // Evitar que el clic en floating-div oculte el floating-shadow
    floatingDiv.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que el clic en floating-div cierre el floating-shadow
    });

    // Añadir una entrada al historial
    history.pushState(null, null, location.href);

    // Manejar el evento de retroceso
    window.onpopstate = function() {
        history.go(1); // Avanzar una página en el historial
    };
});
