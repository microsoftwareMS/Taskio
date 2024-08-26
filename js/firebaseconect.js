import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import {sendEmailVerification, getAuth, setPersistence, browserSessionPersistence, signInWithPopup, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,  
    onAuthStateChanged, signOut, deleteUser } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getDatabase, ref, set, get, child, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js';
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAgKoAl5hb6lwNexib8PKsmkJpKl_0UtVo",
    authDomain: "taskio-ac3ef.firebaseapp.com",
    databaseURL: "https://taskio-ac3ef-default-rtdb.firebaseio.com",
    projectId: "taskio-ac3ef",
    storageBucket: "taskio-ac3ef.appspot.com",
    messagingSenderId: "267715237846",
    appId: "1:267715237846:web:a214aafb89c9bcf5c73677",
    measurementId: "G-08Z8ZL904Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const userUID = sessionStorage.getItem("userUID");
const firestore = getFirestore(app);

let subjects = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchSubjectsTasksAndChargers();
    const userLoginAdminUser = document.getElementById('user_login_admin_user');
    const userLoginAdminAdmin = document.getElementById('user_login_admin_admin');
    const logoutBtn = document.getElementById('logoutBtn');
    const usernameSpan = document.getElementById('username');
    const container = document.querySelector('.task-subject-container');
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    // Cargar el tema preferido del localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.toggle('dark-mode', savedTheme === 'dark');
        themeIcon.classList.toggle('fa-moon', savedTheme === 'dark');
        themeIcon.classList.toggle('fa-sun', savedTheme !== 'dark');
    }

    // Cambiar el tema cuando se haga clic en el botón
    themeToggleButton.addEventListener('click', () => {
        const isDarkMode = body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        themeIcon.classList.toggle('fa-moon', isDarkMode);
        themeIcon.classList.toggle('fa-sun', !isDarkMode);

        // Actualizar el fondo de los elementos 'in-charger'
        const inChargerElements = document.querySelectorAll('.in-charger');
        inChargerElements.forEach(inChargerDiv => {
            const handInHomeworkDiv = inChargerDiv.querySelector('.hand-in-homework');
            const bgColor = handInHomeworkDiv && handInHomeworkDiv.style.display === 'block'
                ? (isDarkMode ? '#111111' : '#e0e0e0')
                : '';
            inChargerDiv.style.backgroundColor = bgColor;
        });
    });
    

    // Handling user login as User
    if (userLoginAdminUser) {
        userLoginAdminUser.addEventListener('click', async () => {
            var email = document.getElementById('login-email').value;
            var password = document.getElementById('login-password').value;

            try {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                const user = cred.user;
                const userRef = ref(database, `users/${user.uid}/roles`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const profiles = snapshot.val();
                    if (profiles.user) {
                        alert("Usuario logueado como Usuario");
                        window.location.href = 'html/home.html';
                    } else {
                        alert('No tienes perfil de Usuario activo.');
                    }
                } else {
                    alert('No se encontraron perfiles para este usuario.');
                }
            } catch (error) {
                handleError(error);
            }
        });
    }

    // Manejar inicio de sesión como administrador
    if (userLoginAdminAdmin) {
        userLoginAdminAdmin.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                const user = cred.user;
                const userRef = ref(database, `users/${user.uid}/roles`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists()) {
                    const profiles = snapshot.val();
                    if (profiles.admin) {
                        alert("Usuario logueado como Administrador");
                        sessionStorage.setItem("userUID", user.uid);
                        window.location.href = 'html/admin.html';
                    } else {
                        alert('No tienes perfil de Administrador activo.');
                    }
                } else {
                    alert('No se encontraron perfiles para este usuario.');
                }
            } catch (error) {
                console.error("Error al iniciar sesión:", error.message);
                // Manejo de errores
                handleError(error);
            }
        });
    }

    // Handling logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                alert('Has cerrado sesión.');
                window.location.href = '../index.html'; // Redirige al login o página principal
            } catch (error) {
                handleError(error);
            }
        });
    }

    // Update username on home page
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User is logged in:', user.uid);
            const userRef = ref(database, `users/${user.uid}/username`);
            try {
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const userName = snapshot.val();
                    if (usernameSpan) {
                        usernameSpan.textContent = userName;
                        console.log('Username updated:', userName);
                    } else {
                        console.log('Username span not found');
                    }
                } else {
                    console.log('No username found for this user');
                }
            } catch (error) {
                console.error('Error fetching username:', error);
            }
        } else {
            console.log('No user is logged in');
        }
    });

    // Mostrar/ocultar contenido y cambiar íconos en subject
    container.addEventListener('click', (event) => {
        const subjectDiv = event.target.closest('.subject');
        const newTaskDiv = event.target.closest('.new-task');
        const contentDiv = event.target.closest('.content');

        if (subjectDiv) {
            const tasksContainer = subjectDiv.nextElementSibling;
            const chevronIcon = subjectDiv.querySelector('.fas.fa-chevron-down');

            tasksContainer.style.display = tasksContainer.style.display === 'none' || tasksContainer.style.display === '' ? 'block' : 'none';
            chevronIcon.classList.toggle('rotate-up', tasksContainer.style.display === 'block');
        }

        if (newTaskDiv) {
            const inChargerContainer = newTaskDiv.nextElementSibling;
            const chevronIcon = newTaskDiv.querySelector('.fas.fa-chevron-down');

            inChargerContainer.style.display = inChargerContainer.style.display === 'none' || inChargerContainer.style.display === '' ? 'block' : 'none';
            chevronIcon.classList.toggle('rotate-up', inChargerContainer.style.display === 'block');
        }

        if (contentDiv) {
            // Solo proceder si el contenido es clickeable
            if (contentDiv.style.pointerEvents === 'none') return; // Si pointerEvents es none, no hacer nada

            const handInHomeworkDiv = contentDiv.nextElementSibling;
            const chevronIcon = contentDiv.querySelector('.fas.fa-chevron-down');
            const inChargerDiv = contentDiv.parentElement;

            handInHomeworkDiv.style.display = handInHomeworkDiv.style.display === 'none' || handInHomeworkDiv.style.display === '' ? 'block' : 'none';
            chevronIcon.classList.toggle('rotate-up', handInHomeworkDiv.style.display === 'block');
            // Cambiar el color de fondo según el tema
            const isDarkMode = body.classList.contains('dark-mode');
            const bgColor = handInHomeworkDiv.style.display === 'block'
                ? (isDarkMode ? '#111111' : '#e0e0e0') // Gris oscuro en modo oscuro, gris claro en modo claro
                : '';

            inChargerDiv.style.backgroundColor = bgColor;
        }
    });
});

function handleError(error) {
    const errorCode = error.code;
    if (errorCode === 'auth/invalid-email') {
        alert('El correo no es válido');
    } else if (errorCode === 'auth/user-disabled') {
        alert('El usuario ha sido deshabilitado');
    } else if (errorCode === 'auth/user-not-found') {
        alert('El usuario no existe');
    } else if (errorCode === 'auth/wrong-password') {
        alert('Contraseña incorrecta');
    } else {
        alert('Error desconocido: ' + error.message);
    }
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}`;
}

async function updateDivColor() {
    // Obtener todos los elementos con la clase 'content'
    const contentDivs = document.querySelectorAll('.content');

    // Obtener el estado del tema actual (oscuro o claro)
    const isDarkMode = document.body.classList.contains('dark-mode');

    contentDivs.forEach(div => {
        // Obtener el estado del encargado desde el texto del div (ajusta si el estado está en otro elemento)
        const state = div.querySelector('.state-color') ? div.querySelector('.state-color').textContent.trim() : '';

        // Obtener los íconos
        const icon = div.querySelector('.fas.fa-check-circle');
        const icon2 = div.querySelector('.fas.fa-times-circle');

        // Establecer el color de fondo basado en el estado y el tema
        let color;
        let disabled = false;
        
        switch (state) {
            case 'Entregado':
                color = isDarkMode ? '#009929' : '#009929'; // Verde
                // Mostrar el ícono y deshabilitar el div
                if (icon) icon.style.display = 'inline';
                if (icon2) icon2.style.display = 'none';
                disabled = true;
                break;
            case 'No Entregado':
                color = isDarkMode ? '#ff0000' : '#ff0000'; // Rojo
                // Ocultar el ícono y deshabilitar el div
                if (icon) icon.style.display = 'none';
                if (icon2) icon2.style.display = 'inline';
                disabled = true;
                break;
            case 'Pendiente':
                color = isDarkMode ? '' : ''; // Amarillo
                // Ocultar los íconos
                if (icon) icon.style.display = 'none';
                if (icon2) icon2.style.display = 'none';
                disabled = false;
                break;
            case 'Necesita Corrección':
                color = isDarkMode ? '#FFC300' : '#FFC300'; // Naranja
                // Mostrar el ícono
                if (icon) icon.style.display = 'inline';
                if (icon2) icon2.style.display = 'none';
                disabled = false;
                break;
            default:
                color = ''; // Sin color
                // Ocultar los íconos
                if (icon) icon.style.display = 'none';
                if (icon2) icon2.style.display = 'none';
                disabled = false;
                break;
        }

        div.style.backgroundColor = color;

        // Aplicar o quitar la clase 'disabled'
        if (disabled) {
            div.classList.add('disabled');
        } else {
            div.classList.remove('disabled');
        }
    });
}

async function updateTaskStatsColors() {
    await new Promise(resolve => setTimeout(resolve, 100));

    // Selecciona todos los divs que tienen la clase 'new-task'
    const taskDivs = document.querySelectorAll('.new-task');

    taskDivs.forEach(taskDiv => {
        // Obtén los elementos de conteo específicos dentro de cada div 'new-task'
        const totalEncargadosElement = taskDiv.querySelector('#count-charger');
        const totalEntregadosElement = taskDiv.querySelector('#count-charger-en');
        const totalNoEntregadosElement = taskDiv.querySelector('#count-charger-noen');
        const checkIcon = taskDiv.querySelector('.fa-check-circle'); // Selecciona el ícono de check dentro del div

        // Obtén los valores de texto y conviértelos en enteros
        const totalEncargados = totalEncargadosElement ? parseInt(totalEncargadosElement.textContent.trim(), 10) : 0;
        const totalEntregados = totalEntregadosElement ? parseInt(totalEntregadosElement.textContent.trim(), 10) : 0;
        const totalNoEntregados = totalNoEntregadosElement ? parseInt(totalNoEntregadosElement.textContent.trim(), 10) : 0;

        // Define el color de fondo basado en las condiciones
        let backgroundColor = '';
        let showCheckIcon = false; // Variable para controlar la visibilidad del ícono

        if (totalEncargados === totalEntregados) {
            backgroundColor = 'green';
            showCheckIcon = true; // Mostrar el ícono cuando todos han entregado
        } else if (totalEncargados === (totalEntregados + totalNoEntregados)) {
            backgroundColor = '#FFC300';
            showCheckIcon = true; // Mostrar el ícono cuando todos han entregado o no entregado
        } else {
            backgroundColor = ''; // Mantén el color actual si no se cumple ninguna condición
            showCheckIcon = false; // Ocultar el ícono en otras condiciones
        }

        // Aplica el color de fondo al div 'new-task'
        taskDiv.style.backgroundColor = backgroundColor;

        // Controla la visibilidad del ícono
        if (checkIcon) {
            checkIcon.style.display = showCheckIcon ? 'inline' : 'none';
        }
    });
}


async function renderSubjects() {
    try {
        const subjectsRef = ref(database, 'subjects');
        const subjectsSnapshot = await get(subjectsRef);

        if (subjectsSnapshot.exists()) {
            const subjects = subjectsSnapshot.val();
            const container = document.querySelector('.task-subject-container');
            container.innerHTML = '';

            if (!subjects || Object.keys(subjects).length === 0) {
                container.innerHTML = '<p>No hay materias disponibles.</p>';
                return;
            }

            // Obtén el nombre del usuario que inició sesión
            const loggedInUserName = document.getElementById('username').textContent.trim();

            Object.keys(subjects).forEach((subjectId) => {
                const subject = subjects[subjectId];
                const totalTasks = subject.tasks ? Object.keys(subject.tasks).length : 0;

                const subjectHTML = `
                    <div class="subject-container">
                        <div class="subject">
                            <h3>${subject.name}</h3>
                            <div class="subject-stats">
                                <p>Tareas: ${totalTasks}</p>
                            </div>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="tasks-container" style="display: none;">
                            ${!subject.tasks || Object.keys(subject.tasks).length === 0 ? 
                                '<p class="msg">No hay tareas agregadas.</p>' :
                                subject.tasks ? Object.keys(subject.tasks).map((taskId) => {
                                const task = subject.tasks[taskId];
                                return `
                                    <div class="new-task-container">
                                        <div class="new-task" data-subject-id="${subjectId}" data-task-id="${taskId}">
                                            <i class="fas fa-check-circle" style="display: none;"></i>
                                            <h3>${task.name}</h3>
                                            <div class="task-stats" style="display: none;">
                                                <p id="count-charger">${task.inCharge.length}</p>
                                                <p id="count-charger-en">${task.inCharge.filter(charger => charger.state === 'Entregado').length}</p>
                                                <p id="count-charger-noen">${task.inCharge.filter(charger => charger.state === 'No Entregado').length}</p>
                                                <p id="count-charger-pe">${task.inCharge.filter(charger => charger.state === 'Pendiente').length}</p>
                                                <p id="count-charger-ne">${task.inCharge.filter(charger => charger.state === 'Necesita Corrección').length}</p>
                                            </div>
                                            <label class="txt-date">Fecha de Entrega:<span id="date">${formatDateTime(task.dueDate)}</span></label>
                                            <i class="fas fa-chevron-down"></i>
                                        </div>
                                        <div class="in-charger-container" style="display: none;">
                                            ${task.inCharge.map((charger, chargerIndex) => {
                                                const isCurrentUser = charger.name === loggedInUserName;
                                                return `
                                                    <div class="in-charger">
                                                        <div class="content" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-id="${chargerIndex}">
                                                            <i class="fas fa-check-circle"></i>
                                                            <i class="fas fa-times-circle"></i>
                                                            <h3>${charger.name}</h3>
                                                            <span class="state-color" id="state">${charger.state}</span>
                                                            <i class="fas fa-chevron-down"></i>
                                                        </div>
                                                        <div class="hand-in-homework" style="display: none;">
                                                            <div class="task-detail">
                                                                <h4>Parte a realizar:</h4>
                                                                <p>${charger.detail.replace(/\n/g, '<br>')}</p>
                                                                <h4>Comentario:</h4>
                                                                <p>${charger.comment ? charger.comment.replace(/\n/g, '<br>') : 'No hay comentario.'}</p>
                                                            </div>
                                                            <div class="upload-task" id="unique-upload-task-${subjectId}-${taskId}-${chargerIndex}" style="${isCurrentUser ? 'display: flex;' : 'display: none;'}">
                                                                <label for="fileInput-${subjectId}-${taskId}-${chargerIndex}" class="custom-file-upload">
                                                                    <i class="fas fa-upload"></i> Subir Archivo
                                                                </label>
                                                                <input type="file" id="fileInput-${subjectId}-${taskId}-${chargerIndex}" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-id="${chargerIndex}" accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx">
                                                                <div id="fileDetails-${subjectId}-${taskId}-${chargerIndex}" class="file-details"></div>
                                                                <div class="button-group">
                                                                    <button type="submit" id="uploadButton-${subjectId}-${taskId}-${chargerIndex}" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-id="${chargerIndex}">Entregar</button>
                                                                    <button id="cancelButton-${subjectId}-${taskId}-${chargerIndex}">Cancelar</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('') : ''}
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', subjectHTML);
            });

            // Event listeners for file upload buttons
            document.querySelectorAll('button[id^="uploadButton"]').forEach(button => {
                button.addEventListener('click', async function(event) {
                    event.preventDefault(); // Evita la recarga de la página
            
                    // Obtén los IDs de la materia, tarea, y encargado desde los atributos data
                    const subjectId = button.dataset.subjectId;
                    const taskId = button.dataset.taskId;
                    const chargerId = button.dataset.chargerId;
            
                    // Construir el ID para el file input
                    const fileInputId = `fileInput-${subjectId}-${taskId}-${chargerId}`;
                    const fileInput = document.getElementById(fileInputId);
                    if (!fileInput) {
                        console.error(`No se encontró el elemento fileInput con el ID ${fileInputId}.`);
                        return;
                    }
            
                    const file = fileInput.files[0];
                    if (!file) {
                        alert('Por favor, seleccione un archivo para subir.');
                        return;
                    }
            
                    // Reemplazar caracteres especiales en el nombre del archivo para evitar problemas con Firebase Storage
                    const sanitizedFileName = file.name.replace(/[#$[\]]/g, '_');
            
                    try {
                        // Construir la referencia del archivo en Firebase Storage con el nombre del archivo
                        const fileStorageRef = storageRef(storage, `documents/${subjectId}/tasks/${taskId}/inCharger/${sanitizedFileName}`);
            
                        // Subir el archivo
                        await uploadBytes(fileStorageRef, file);
                        const downloadURL = await getDownloadURL(fileStorageRef);
            
                        // Crear referencia para los detalles del archivo en Firebase Realtime Database
                        const fileDetailsRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerId}/file`);
                        await set(fileDetailsRef, {
                            fileName: file.name,
                            fileSize: file.size,
                            fileURL: downloadURL
                        });
            
                        // Actualizar el estado del encargado a 'Entregado' después de subir el archivo
                        const chargerRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerId}`);
                        await update(chargerRef, {
                            state: 'Entregado'
                        });
            
                        alert('Archivo subido y estado del encargado actualizado exitosamente.');
                    } catch (error) {
                        console.error('Error al subir el archivo:', error);
                        alert('Ocurrió un error al subir el archivo. Por favor, inténtelo de nuevo.');
                    }
                });
            });
            
            updateDivColor();
            updateTaskStatsColors();

            // Manejo del evento de cambio en los inputs de archivo
            // Añadir el listener para los cambios en los inputs de archivo
            document.querySelectorAll('input[type="file"]').forEach(input => {
                input.addEventListener('change', function(event) {
                    const inputId = event.target.id;
                    const fileDetailsId = `fileDetails-${input.dataset.subjectId}-${input.dataset.taskId}-${input.dataset.chargerId}`;
                    const fileDetailsDiv = document.getElementById(fileDetailsId);

                    if (fileDetailsDiv) {
                        const file = event.target.files[0];
                        if (file) {
                            const fileName = file.name;
                            const fileSize = (file.size / 1024).toFixed(2); // Tamaño en KB
                            const fileType = file.type;

                            // Obtener la extensión del archivo
                            const fileExtension = fileName.split('.').pop().toLowerCase();
                            let fileIcon;

                            // Asignar ícono basado en la extensión del archivo
                            switch (fileExtension) {
                                case 'pdf':
                                    fileIcon = '../img/pdf.png';
                                    break;
                                case 'doc':
                                case 'docx':
                                    fileIcon = '../img/doc.png';
                                    break;
                                case 'xls':
                                case 'xlsx':
                                    fileIcon = '../img/xls.png';
                                    break;
                                case 'ppt':
                                case 'pptx':
                                    fileIcon = '../img/ppt.png';
                                    break;
                                default:
                                    fileIcon = '../img/txt.png'; // Ícono para otros tipos de archivos
                                    break;
                            }

                            // Mostrar detalles del archivo
                            fileDetailsDiv.innerHTML = `
                                <img src="${fileIcon}" alt="File Icon">
                                <div class="file-info">
                                    <p><strong>Nombre:</strong> ${fileName}</p>
                                    <p><strong>Tamaño:</strong> ${fileSize} KB</p>
                                    <p><strong>Tipo:</strong> .${fileExtension}</p>
                                </div>
                            `;
                        } else {
                            fileDetailsDiv.innerHTML = '';
                        }
                    }
                });
            });

        }
    } catch (error) {
        console.error('Error al obtener materias desde Firebase:', error);
    }
}


async function fetchSubjectsTasksAndChargers() {
    try {
        const subjectsRef = ref(database, 'subjects');
        const subjectsSnapshot = await get(subjectsRef);

        if (subjectsSnapshot.exists()) {
            const subjects = subjectsSnapshot.val();
            renderSubjects();
            for (const subjectId in subjects) {
                const subject = subjects[subjectId];
                console.log(`Materia: ${subject.name}`);

                if (subject.tasks) {
                    for (const taskId in subject.tasks) {
                        const task = subject.tasks[taskId];
                        console.log(`  Tarea: ${task.name}, Fecha: ${task.dueDate}`);

                        // Verifica que task.inCharge sea un array
                        if (Array.isArray(task.inCharge)) {
                            for (const charger of task.inCharge) {
                                console.log(`    Encargado: ${charger.name}, Detalle: ${charger.detail}, Estado: ${charger.state}, Comentario: ${charger.comment}`);
                            }
                        } else {
                            console.log('    No hay encargados asignados a esta tarea o inCharge no es un array.');
                        }
                    }
                } else {
                    console.log('  No hay tareas en esta materia.');
                }
            }
        } else {
            console.log('No se encontraron materias en la base de datos.');
        }
    } catch (error) {
        console.error('Error al obtener materias, tareas y encargados:', error);
    }
}
