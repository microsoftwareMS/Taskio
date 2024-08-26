let subjects = [];
console.log(Array.isArray(subjects));
let chargers = [];
let adminUsername = '';

import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import {sendEmailVerification, getAuth, setPersistence, browserSessionPersistence, signInWithPopup, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,  
    onAuthStateChanged, signOut, deleteUser } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getDatabase, ref, set, get, child, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const userUID = sessionStorage.getItem("userUID");
const firestore = getFirestore(app);
const logoutBtn = document.getElementById('logoutBtn');

document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones que necesiten iniciar la recarga automática
    const buttons = document.querySelectorAll('#addSubjectButton, #deleteSubjectBtn, #addTaskButton, #addChargerBtn, #register_save');
    let reloadInterval;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Verifica si ya existe un intervalo de recarga
            if (reloadInterval) {
                clearInterval(reloadInterval); // Detén cualquier intervalo existente
            }

            // Configura el nuevo intervalo para recargar la página cada 60 segundos (60000 ms)
            reloadInterval = setInterval(() => {
                location.reload();
            }, 1000); // Ajusta el intervalo según tus necesidades
        });
    });
});



register_save.addEventListener('click', async (e) => {
    e.preventDefault(); // Evita el comportamiento por defecto del botón

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const username = document.getElementById('register-username').value;

    const isUser = document.getElementById('role-user').checked;
    const isAdmin = document.getElementById('role-admin').checked;

    const roles = {
        user: isUser,
        admin: isAdmin
    };

    try {
        // Crear un nuevo usuario
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = cred.user;

        // Guardar datos adicionales en Realtime Database usando UID
        await set(ref(database, 'users/' + newUser.uid), {
            username: username,
            email: email,
            roles: roles
        });

        alert("Usuario creado exitosamente");
        console.log('Datos de usuario guardados en Realtime Database');

    } catch (error) {
        const errorCode = error.code;
        if (errorCode === 'auth/email-already-in-use')
            alert('El correo ya está en uso');
        else if (errorCode === 'auth/invalid-email')
            alert('El correo no es válido');
        else if (errorCode === 'auth/weak-password')
            alert('La contraseña debe tener al menos 6 caracteres');
        else
            console.error('Error al registrar el usuario:', error);
    }

    // Limpiar los campos de texto
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    
    // Restablecer los checkbox a su estado original
    document.getElementById('role-user').checked = true;
    document.getElementById('role-admin').checked = false;
});

if (userUID) {
    const userRef = ref(database, 'users/' + userUID);

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userName = snapshot.val().username;
            // Muestra el nombre del usuario en la página
            document.getElementById("username").textContent = userName;
        } else {
            console.error("No se encontró información del usuario.");
        }
    }).catch((error) => {
        console.error("Error al obtener datos del usuario:", error);
    });
} else {
    // Si no hay UID, redirige a la página de inicio de sesión
    window.location.href = "../index.html";
}

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

function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

function applyTheme() {
    const theme = getCurrentTheme();
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function updateSubjectSelect() {
    const subjectSelect = document.getElementById('subjectSelect');
    const deleteSubjectSelect = document.getElementById('deleteSubjectSelect');
    subjectSelect.innerHTML = deleteSubjectSelect.innerHTML = '<option value="">Selecciona una materia</option>';
    
    if (subjects && typeof subjects === 'object') {
        Object.keys(subjects).forEach((key) => {
            const subject = subjects[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);

            const deleteOption = option.cloneNode(true);
            deleteSubjectSelect.appendChild(deleteOption);
        });
    } else {
        console.error('Subjects no es un objeto válido:', subjects);
    }
}

function updateTaskSelect(subjectIndex) {
    const taskSelect = document.getElementById('taskSelect');
    const database = getDatabase();

    if (subjectIndex) {
        const tasksRef = ref(database, `subjects/${subjectIndex}/tasks`);

        get(tasksRef).then((snapshot) => {
            if (snapshot.exists()) {
                const tasks = snapshot.val();
                taskSelect.innerHTML = '<option value="">Selecciona una tarea</option>'; // Limpia el select

                // Itera sobre las tareas obtenidas y añade las opciones al select
                Object.keys(tasks).forEach((taskId) => {
                    const task = tasks[taskId];
                    const option = document.createElement('option');
                    option.value = taskId;
                    option.textContent = task.name;
                    taskSelect.appendChild(option);
                });
            } else {
                console.warn('No se encontraron tareas para la materia:', subjectIndex);
                taskSelect.innerHTML = '<option value="">Selecciona una tarea</option>'; // Limpia el select en caso de no haber tareas
            }
        }).catch((error) => {
            console.error('Error al obtener tareas de Firebase:', error);
            taskSelect.innerHTML = '<option value="">Selecciona una tarea</option>'; // Limpia el select en caso de error
        });
    } else {
        console.error('Materia no encontrada o index inválido:', subjectIndex);
        taskSelect.innerHTML = '<option value="">Selecciona una tarea</option>'; // Limpia el select en caso de error
    }
}

function updateChargerSelect() {
    const chargerSelect = document.getElementById('chargerSelect');
    
    chargerSelect.innerHTML = '<option value="">Selecciona un integrante</option>';

    const usersRef = ref(database, 'users');
    
    // Escuchar cambios en la referencia 'users'
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        if (users && typeof users === 'object') {
            Object.keys(users).forEach((key) => {
                const user = users[key];
                const option = document.createElement('option');
                option.value = key; // Usa el UID del usuario como valor
                option.textContent = user.username; // Nombre del usuario
                chargerSelect.appendChild(option);

                const deleteOption = option.cloneNode(true);
            });
        } else {
            console.error('Users no es un objeto válido:', users);
        }
    }, (error) => {
        console.error('Error al cargar los usuarios:', error);
    });
}

function addSubject() {
    const subjectName = document.getElementById('subjectName').value;
    if (subjectName) {
        const user = auth.currentUser; // Obtén el usuario actual
        if (user) {
            const subjectRef = ref(database, 'subjects/' + Date.now()); // Usa una clave única para cada materia
            set(subjectRef, { name: subjectName, tasks: [] })
                .then(() => {
                    document.getElementById('subjectName').value = '';
                    updateSubjectSelect();
                    alert('Materia agregada.');
                })
                .catch((error) => {
                    console.error('Error al agregar la materia:', error);
                });
        } else {
            alert('Debes iniciar sesión.');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addSubjectButton').addEventListener('click', addSubject);
});

async function loadSubjects() {
    const subjectSelect = document.getElementById('subjectSelect');
    const deleteSubjectSelect = document.getElementById('deleteSubjectSelect');
    const subjectsRef = ref(database, 'subjects');

    subjectSelect.innerHTML = '<option value="">Selecciona una materia</option>';
    deleteSubjectSelect.innerHTML = '<option value="">Selecciona una materia</option>';

    try {
        const snapshot = await get(subjectsRef);
        subjects = snapshot.val() || {}; // Asigna el objeto de materias a la variable global
        if (subjects) {
            Object.keys(subjects).forEach(key => {
                const subject = subjects[key];
                const option = document.createElement('option');
                option.value = key; // Usa el ID de la materia
                option.textContent = subject.name;
                subjectSelect.appendChild(option);

                const deleteOption = option.cloneNode(true);
                deleteSubjectSelect.appendChild(deleteOption);
            });
        }
    } catch (error) {
        console.error('Error al cargar las materias:', error);
    }
}

function addTask() {
    const subjectId = document.getElementById('subjectSelect').value;
    const taskName = document.getElementById('taskName').value;
    const dueDate = document.getElementById('dueDate').value;

    if (subjectId && taskName && dueDate) {
        const taskRef = ref(database, 'subjects/' + subjectId + '/tasks'); // Referencia a la ubicación de las tareas

        // Verifica si la tarea ya existe
        get(taskRef).then(snapshot => {
            // Asegúrate de que tasks sea un array
            const tasks = snapshot.val() || [];
            const tasksArray = Array.isArray(tasks) ? tasks : [];

            const existingTask = tasksArray.find(task => task.name === taskName);

            if (existingTask) {
                alert('Ya existe una tarea con este nombre en la materia seleccionada.');
            } else {
                // Agrega la nueva tarea
                const newTaskRef = ref(database, 'subjects/' + subjectId + '/tasks/' + Date.now()); // Usa una clave única para cada tarea
                set(newTaskRef, { name: taskName, dueDate: new Date(dueDate).toISOString(), inCharge: [] })
                    .then(() => {
                        document.getElementById('taskName').value = '';
                        document.getElementById('dueDate').value = '';
                        updateTaskSelect(subjectId); // Actualiza el select de tareas
                        renderTasks(); // Volver a renderizar para actualizar la vista
                    })
                    .catch((error) => {
                        console.error('Error al agregar la tarea:', error);
                    });
            }
        }).catch((error) => {
            console.error('Error al obtener las tareas:', error);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addTaskButton').addEventListener('click', addTask);
});

document.addEventListener('DOMContentLoaded', loadSubjects);

async function addCharger() {
    const taskSelectValue = document.getElementById('taskSelect').value;
    const subjectSelect = document.getElementById('subjectSelect').value;
    const taskDetail = document.getElementById('taskDetail').value;
    const chargerSelectValue = document.getElementById('chargerSelect').value;

    if (subjectSelect && taskSelectValue && chargerSelectValue && taskDetail) {
        // Referencia a la base de datos de usuarios
        const userRef = ref(database, `users/${chargerSelectValue}`);

        try {
            // Obtener el nombre de usuario desde Firebase Realtime Database
            const userSnapshot = await get(userRef);
            if (!userSnapshot.exists()) {
                throw new Error('Usuario no encontrado en la base de datos.');
            }

            const userData = userSnapshot.val();
            const chargerName = userData.username; // Suponiendo que el nombre de usuario está en la propiedad 'username'

            if (!chargerName) {
                throw new Error('Nombre del usuario no encontrado.');
            }

            const taskRef = ref(database, `subjects/${subjectSelect}/tasks/${taskSelectValue}/inCharge`);

            // Obtener la lista actual de encargados
            const taskSnapshot = await get(taskRef);
            let inChargeList = taskSnapshot.exists() ? taskSnapshot.val() : [];

            // Asegurarse de que inChargeList es un array
            if (!Array.isArray(inChargeList)) {
                console.warn('inChargeList no es un array, inicializando como array vacío.');
                inChargeList = [];
            }

            // Verificar si el encargado ya existe en la lista
            const existingCharger = inChargeList.find(charger => charger.id === chargerSelectValue);

            if (existingCharger) {
                existingCharger.detail = taskDetail;
                existingCharger.state = "Pendiente";
            } else {
                inChargeList.push({ id: chargerSelectValue, name: chargerName, state: "Pendiente", detail: taskDetail });
            }

            // Guardar la lista actualizada en Firebase
            await set(taskRef, inChargeList);

            // Limpiar el campo de detalles
            document.getElementById('taskDetail').value = '';
            alert('Encargado añadido correctamente.');
        } catch (error) {
            console.error('Error al añadir el encargado:', error);
        }
    } else {
        alert('Por favor, complete todos los campos.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addChargerBtn').addEventListener('click', addCharger);
});

// Función para eliminar una materia
async function deleteSubject() {
    const subjectSelect = document.getElementById('deleteSubjectSelect');
    const subjectId = subjectSelect.value;

    if (subjectId !== "") {
        const subjectRef = ref(database, `subjects/${subjectId}`);

        try {
            // Eliminar la materia y todo lo que contiene
            await remove(subjectRef);

            // Actualizar la lista de materias localmente
            delete subjects[subjectId]; // Elimina la materia del objeto subjects
            updateSubjectSelect(); // Actualiza el select de materias
            updateTaskSelect(""); // Limpiar las tareas asociadas
            /*renderTasks(); // Renderizar tareas si es necesario*/

            alert('Materia eliminada correctamente.');
        } catch (error) {
            console.error('Error al eliminar la materia:', error);
        }
    } else {
        alert('Por favor, seleccione una materia para eliminar.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('deleteSubjectBtn').addEventListener('click', deleteSubject);
});

document.addEventListener('DOMContentLoaded', () => {
    
    applyTheme(); // Aplica el tema actual al cargar
    updateSubjectSelect();
    updateChargerSelect();
    fetchSubjectsTasksAndChargers();
    document.getElementById('subjectSelect').addEventListener('change', (event) => {
        const subjectIndex = event.target.value;
        updateTaskSelect(subjectIndex);
    });

    renderTasks();
});

function saveVisibilityState() {
    const visibleContainers = [];
    const visibleChargerDetails = [];
    const visibleChargerContainers = [];
    
    // Guardar el estado de visibilidad de los contenedores de tareas
    document.querySelectorAll('.task-container').forEach(container => {
        if (container.style.display !== 'none') {
            visibleContainers.push(container.id);
        }
    });

    // Guardar el estado de visibilidad de los elementos charger-details
    document.querySelectorAll('.charger-details').forEach(chargerDetail => {
        if (chargerDetail.style.display !== 'none') {
            visibleChargerDetails.push(chargerDetail.id);
        }
    });

    // Guardar el estado de visibilidad de los elementos charger-container
    document.querySelectorAll('.charger-container').forEach(chargerContainer => {
        if (chargerContainer.style.display !== 'none') {
            visibleChargerContainers.push(chargerContainer.id);
        }
    });

    localStorage.setItem('visibleContainers', JSON.stringify(visibleContainers));
    localStorage.setItem('visibleChargerDetails', JSON.stringify(visibleChargerDetails));
    localStorage.setItem('visibleChargerContainers', JSON.stringify(visibleChargerContainers));
}

function restoreVisibilityState() {
    const visibleContainers = JSON.parse(localStorage.getItem('visibleContainers')) || [];
    const visibleChargerDetails = JSON.parse(localStorage.getItem('visibleChargerDetails')) || [];
    const visibleChargerContainers = JSON.parse(localStorage.getItem('visibleChargerContainers')) || [];
    
    visibleContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.style.display = 'block';
        }
    });

    visibleChargerDetails.forEach(id => {
        const chargerDetail = document.getElementById(id);
        if (chargerDetail) {
            chargerDetail.style.display = 'block';
        }
    });

    visibleChargerContainers.forEach(id => {
        const chargerContainer = document.getElementById(id);
        if (chargerContainer) {
            chargerContainer.style.display = 'block';
        }
    });
}

async function fetchSubjectsTasksAndChargers() {
    try {
        const subjectsRef = ref(database, 'subjects');
        const subjectsSnapshot = await get(subjectsRef);

        if (subjectsSnapshot.exists()) {
            const subjects = subjectsSnapshot.val();
            renderTasks(subjects); // Asegúrate de que esta función maneje correctamente los datos renderizados
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
                                console.log(`Encargado: ${charger.name}, Detalle: ${charger.detail}, Estado: ${charger.state}`);

                                // Si el encargado tiene un archivo, imprime sus detalles
                                if (charger.file) {
                                    const fileName = charger.file.fileName;
                                    const fileSize = charger.file.fileSize;
                                    const fileURL = charger.file.fileURL;

                                    console.log(`      Nombre del archivo: ${fileName}`);
                                    console.log(`      Tamaño del archivo: ${(fileSize / 1024).toFixed(2)} KB`);
                                    console.log(`      URL del archivo: ${fileURL}`);
                                } else {
                                    console.log('      No se ha subido ningún archivo.');
                                }
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

function renderTasks(subjects) {
    saveVisibilityState(); // Guardar el estado actual de visibilidad
    const listContainer = document.querySelector('.list-container');
    listContainer.innerHTML = '';

    if (!subjects || Object.keys(subjects).length === 0) {
        listContainer.innerHTML = '<p>No hay materias disponibles.</p>';
        return;
    }

    Object.keys(subjects).forEach((subjectId) => {
        const subject = subjects[subjectId];
        let subjectHTML = `
            <div class="subject-container">
                <div class="subject-title-container" id="subject-title-container" data-subject-id="${subjectId}")">
                    <h3>${subject.name}</h3>
                    <i class="fas fa-chevron-down" id="chevron-task-${subjectId}"></i>
                </div>
                <div class="task-container" id="task-container-${subjectId}" style="display: none;">
                    ${!subject.tasks || Object.keys(subject.tasks).length === 0 ? 
                        '<p>No hay tareas agregadas.</p>' : 
                        Object.keys(subject.tasks).map((taskId) => {
                            const task = subject.tasks[taskId];
                            const inCharge = Array.isArray(task.inCharge) ? task.inCharge : []; // Verifica que inCharge sea un array
                            return `
                                <div class="task-item">
                                    <div class="uptate-container-date">
                                        <div class="click-updateDate" data-subject-id="${subjectId}" data-task-id="${taskId}">
                                            <i class="fas fa-check-circle" style="display: none;"></i>
                                            <h4>${task.name} - Fecha de entrega: <span class="due-date">${new Date(task.dueDate).toLocaleString()}</span></h4>
                                            <i class="fas fa-chevron-down" id="chevron-charger-${subjectId}-${taskId}"></i>
                                        </div>
                                        <button class="showUpdateDateForm" id="showUpdateDateForm-${subjectId}-${taskId}" data-subject-id="${subjectId}" data-task-id="${taskId}">Actualizar Fecha</button>
                                        <button class="deleteTask" data-subject-id="${subjectId}" data-task-id="${taskId}">Eliminar Tarea</button>
                                    </div>
                                    <div id="updateDateForm-${subjectId}-${taskId}" class="update-date-form" style="display: none;">
                                        <label for="newDueDate-${subjectId}-${taskId}">Nueva Fecha y Hora:</label>
                                        <input type="datetime-local" id="newDueDate-${subjectId}-${taskId}" value="${new Date(task.dueDate).toISOString().slice(0, -1)}">
                                        <button class="updateDueDate" id="updateDueDate-${subjectId}-${taskId}" onclick="updateDueDate('${subjectId}', '${taskId}')">Guardar</button>
                                        <button class="hideUpdateDateForm" data-subject-id="${subjectId}" data-task-id="${taskId}">Cancelar</button>
                                    </div>
                                    <div class="charger-container" id="charger-container-${subjectId}-${taskId}" style="display: none;">
                                        ${inCharge.length === 0 ? 
                                            '<p>No hay encargados asignados a esta tarea.</p>' : 
                                            inCharge.map((charger, chargerIndex) => `
                                                <div class="charger-details" id="charger-details-${subjectId}-${taskId}-${chargerIndex}" style="display: block;">
                                                    <div class="info-container">
                                                        <div class="charger-new">
                                                            <h5>Encargado: ${charger.name}</h5>
                                                            <p>Estado: ${charger.state}</p>
                                                            ${charger.file ? `
                                                                <div class="file-info">
                                                                    <p><strong>Nombre del archivo:</strong> ${charger.file.fileName}</p>
                                                                    <p><strong>Tamaño:</strong> ${(charger.file.fileSize / 1024).toFixed(2)} KB</p>
                                                                </div>
                                                            ` : `<p>No se ha subido ningún archivo.</p>`}
                                                        </div>

                                                        ${charger.file ? `
                                                            <div class="download-button">
                                                                <button onclick="downloadFile('${charger.file.fileName}', '${charger.file.fileURL}')">Descargar</button>
                                                            </div>
                                                        ` : ''}

                                                        <div class="button-container" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-index="${chargerIndex}">
                                                            <button class="btn-1" id="btn-1" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-index="${chargerIndex}">Corrección</button>
                                                            <button class="btn-2" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-index="${chargerIndex}" type="sumit">No Entregado</button>
                                                            <button class="btn-3" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-index="${chargerIndex}" type="sumit">Pendiente</button>
                                                            <button class="btn-4" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-index="${chargerIndex}" type="sumit">Entregado</button>
                                                        </div>
                                                        <div id="correction-form-${subjectId}-${taskId}-${chargerIndex}" class="correction-form" style="display: none;">
                                                            <textarea id="comment-${subjectId}-${taskId}-${chargerIndex}" placeholder="Escribe tu comentario aquí"></textarea>
                                                            <button class="submitCorrectionComment" data-subject-id="${subjectId}" data-task-id="${taskId}" data-charger-index="${chargerIndex}" type="sumit">Enviar Comentario</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', subjectHTML);
    });

    restoreVisibilityState(); // Restaurar estado de visibilidad después de renderizar
}

document.addEventListener('DOMContentLoaded', function() {
    function toggleTaskContainer(subjectIndex) {
        const taskContainer = document.getElementById(`task-container-${subjectIndex}`);
        const chevronIcon = document.getElementById(`chevron-task-${subjectIndex}`);
        
        if (!taskContainer || !chevronIcon) {
            console.error(`No se encontró el contenedor de tareas o el ícono para subjectIndex: ${subjectIndex}`);
            return;
        }
        
        if (taskContainer.style.display === 'none' || taskContainer.style.display === '') {
            taskContainer.style.display = 'block';
            chevronIcon.classList.add('rotated');
        } else {
            taskContainer.style.display = 'none';
            chevronIcon.classList.remove('rotated');
        }
    }

    // Delegar eventos a los elementos con data-subject-id
    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.subject-title-container');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            toggleTaskContainer(subjectId);
        }
    });

    // Función para alternar la visibilidad del contenedor de encargados y rotar los íconos
    function toggleChargerContainer(subjectId, taskId) {
        const chargerContainer = document.getElementById(`charger-container-${subjectId}-${taskId}`);
        const chevronIcon = document.getElementById(`chevron-charger-${subjectId}-${taskId}`);
        
        if (!chargerContainer || !chevronIcon) {
            console.error(`No se encontró el contenedor de encargados o el ícono para subjectId: ${subjectId} y taskId: ${taskId}`);
            return;
        }
        
        if (chargerContainer.style.display === 'none' || chargerContainer.style.display === '') {
            chargerContainer.style.display = 'block';
            chevronIcon.classList.add('rotated');
        } else {
            chargerContainer.style.display = 'none';
            chevronIcon.classList.remove('rotated');
        }
    }


    // Delegar eventos a los elementos con data-subject-id y data-task-id
    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.click-updateDate');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            toggleChargerContainer(subjectId, taskId);
        }
    });

    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.showUpdateDateForm');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            showUpdateDateForm(subjectId, taskId);
        }
    
        const cancelButton = event.target.closest('.hideUpdateDateForm');
        if (cancelButton) {
            const subjectId = cancelButton.getAttribute('data-subject-id');
            const taskId = cancelButton.getAttribute('data-task-id');
            hideUpdateDateForm(subjectId, taskId);
        }
    });
});

function deleteTask(subjectId, taskId) {
    console.log('Intentando eliminar tarea con subjectId:', subjectId, 'y taskId:', taskId);
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        const taskRef = ref(database, `subjects/${subjectId}/tasks/${taskId}`);
        remove(taskRef).then(() => {
            console.log('Tarea eliminada correctamente en Firebase');
            renderTasks();
        }).catch((error) => {
            console.error('Error al eliminar la tarea en Firebase:', error);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.deleteTask');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            console.log('Eliminar tarea con subjectId:', subjectId, 'y taskId:', taskId);
            deleteTask(subjectId, taskId);
        }
    });
});

function showCorrectionForm(subjectIndex, taskIndex, chargerIndex) {
    // Muestra el formulario de corrección
    const form = document.getElementById(`correction-form-${subjectIndex}-${taskIndex}-${chargerIndex}`);
    if (form) {  
        form.style.display = 'block'; // Mostrar el formulario de corrección
        form.style.width = '50%'; // Ajustar el ancho al 100% del contenedor padre
    } else {
        console.error(`No se encontró el formulario de corrección para subjectIndex: ${subjectIndex}, taskIndex: ${taskIndex}, chargerIndex: ${chargerIndex}`);
    }
    
    // Oculta el contenedor de botones
    const buttonContainer = document.querySelector(`.button-container[data-subject-id="${subjectIndex}"][data-task-id="${taskIndex}"][data-charger-index="${chargerIndex}"]`);
    if (buttonContainer) {
        buttonContainer.style.display = 'none'; // Ocultar el contenedor de botones
    } else {
        console.error(`No se encontró el contenedor de botones para subjectIndex: ${subjectIndex}, taskIndex: ${taskIndex}, chargerIndex: ${chargerIndex}`);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.btn-1');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            const chargerIndex = target.getAttribute('data-charger-index');
            showCorrectionForm(subjectId, taskId, chargerIndex);
        }
    });
});

async function markForCorrection(subjectId, taskId, chargerIndex) {
    const chargerRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerIndex}/state`);
    const commentRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerIndex}/comment`);

    console.log('Actualizando:', { subjectId, taskId, chargerIndex, ref: chargerRef });

    // Obtener el comentario del formulario de corrección
    const comment = document.getElementById(`comment-${subjectId}-${taskId}-${chargerIndex}`).value;

    try {
        // Actualizar el estado en la base de datos
        await set(chargerRef, 'Necesita Corrección');
        
        // Actualizar el comentario en la base de datos si existe
        if (comment) {
            await set(commentRef, comment);
        }
        
        console.log('Estado y comentario actualizados correctamente.');

        // Oculta el formulario de corrección
        const form = document.getElementById(`correction-form-${subjectId}-${taskId}-${chargerIndex}`);
        if (form) {  
            form.style.display = 'none'; // Ocultar el formulario de corrección
        } else {
            console.error(`No se encontró el formulario de corrección para subjectId: ${subjectId}, taskId: ${taskId}, chargerIndex: ${chargerIndex}`);
        }
        
        // Muestra el contenedor de botones
        const buttonContainer = document.querySelector(`.button-container[data-subject-id="${subjectId}"][data-task-id="${taskId}"][data-charger-index="${chargerIndex}"]`);
        if (buttonContainer) {
            buttonContainer.style.display = 'block'; // Mostrar el contenedor de botones
        } else {
            console.error(`No se encontró el contenedor de botones para subjectId: ${subjectId}, taskId: ${taskId}, chargerIndex: ${chargerIndex}`);
        }

        // Vuelve a renderizar las tareas
        renderTasks();
    } catch (error) {
        console.error('Error al actualizar el estado y el comentario del encargado:', error);
    }
}

async function markAsNotDelivered(subjectId, taskId, chargerIndex) {
    const chargerRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerIndex}/state`);

    console.log('Actualizando:', { subjectId, taskId, chargerIndex, ref: chargerRef });

    try {
        await set(chargerRef, 'No Entregado');
        console.log('Estado actualizado correctamente.');
        renderTasks();
    } catch (error) {
        console.error('Error al actualizar el estado del encargado:', error);
    }
}

async function markAsPending(subjectId, taskId, chargerIndex) {
    const chargerRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerIndex}/state`);

    console.log('Actualizando:', { subjectId, taskId, chargerIndex, ref: chargerRef });

    try {
        await set(chargerRef, 'Pendiente');
        console.log('Estado actualizado correctamente.');
        renderTasks();
    } catch (error) {
        console.error('Error al actualizar el estado del encargado:', error);
    }
}

async function markAsDelivered(subjectId, taskId, chargerIndex) {
    const chargerRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerIndex}/state`);
    
    console.log('Actualizando:', { subjectId, taskId, chargerIndex, ref: chargerRef });

    try {
        await set(chargerRef, 'Entregado');
        console.log('Estado actualizado correctamente.');
        renderTasks();
    } catch (error) {
        console.error('Error al actualizar el estado del encargado:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.btn-4');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            const chargerIndex = target.getAttribute('data-charger-index');
            markAsDelivered(subjectId, taskId, chargerIndex);
        }
    });

    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.btn-3');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            const chargerIndex = target.getAttribute('data-charger-index');
            markAsPending(subjectId, taskId, chargerIndex);
        }
    });

    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.btn-2');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            const chargerIndex = target.getAttribute('data-charger-index');
            markAsNotDelivered(subjectId, taskId, chargerIndex);
        }
    });

    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.submitCorrectionComment');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            const chargerIndex = target.getAttribute('data-charger-index');
            markForCorrection(subjectId, taskId, chargerIndex);
        }
    });
});


function showUpdateDateForm(subjectIndex, taskIndex) {
    document.getElementById(`updateDateForm-${subjectIndex}-${taskIndex}`).style.display = 'block';
    /*stopCheckInterval(); // Detener el intervalo cuando se muestra el formulario*/
}

function hideUpdateDateForm(subjectIndex, taskIndex) {
    document.getElementById(`updateDateForm-${subjectIndex}-${taskIndex}`).style.display = 'none';
    /*resumeCheckInterval(); // Reanudar el intervalo cuando se oculta el formulario*/
}

window.updateDueDate = function(subjectId, taskId) {
    const newDueDateInput = document.getElementById(`newDueDate-${subjectId}-${taskId}`);
    const newDueDate = newDueDateInput ? newDueDateInput.value : null;

    if (!newDueDate) {
        return;
    }

    // Obtén una referencia a Firebase Realtime Database
    const db = getDatabase(); // Asegúrate de haber importado y configurado Firebase
    const taskRef = ref(db, `subjects/${subjectId}/tasks/${taskId}`);

    update(taskRef, {
        dueDate: newDueDate
    }).then(() => {
        alert('Fecha actualizada correctamente.');
        console.log('Fecha actualizada correctamente en Firebase');
        // Vuelve a renderizar las tareas para actualizar la vista
        // (Puedes obtener nuevamente las tareas desde Firebase y renderizarlas aquí)
    }).catch((error) => {
        console.error('Error al actualizar la fecha en Firebase:', error);
    });

    // Oculta el formulario de actualización de fecha
    hideUpdateDateForm(subjectId, taskId);
};

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.list-container').addEventListener('click', function(event) {
        const target = event.target.closest('.updateDueDate');
        if (target) {
            const subjectId = target.getAttribute('data-subject-id');
            const taskId = target.getAttribute('data-task-id');
            updateDueDate(subjectId, taskId);
        }
    });
});

document.getElementById('openRegister').addEventListener('click', function() {
    document.getElementById('form-register').classList.toggle('form-register');
});

document.getElementById('register_cancel').addEventListener('click', function() {
    document.getElementById('form-register').classList.add('form-register');
    // Limpiar los campos de texto
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    
    // Restablecer los checkbox a su estado original
    document.getElementById('role-user').checked = true;
    document.getElementById('role-admin').checked = false;
});

// Configura el intervalo para verificar las fechas y actualizar el estado
setInterval(checkTaskDueDates, 1000); // Verifica cada segundo (1000 ms), ajusta según tus necesidades

// Función para comprobar las fechas y actualizar el estado
async function checkTaskDueDates() {
    const now = new Date(); // Obtén la fecha y hora actuales
    const subjectsRef = ref(database, 'subjects');

    try {
        // Obtén todos los sujetos
        const snapshot = await get(subjectsRef);
        if (snapshot.exists()) {
            const subjects = snapshot.val();
            for (const subjectId in subjects) {
                const tasks = subjects[subjectId].tasks;
                for (const taskId in tasks) {
                    const task = tasks[taskId];
                    const dueDate = new Date(task.dueDate); // Obtén la fecha y hora límite

                    // Compara la fecha actual con la fecha límite
                    console.log(`Fecha actual: ${now}`);
                    console.log(`Fecha límite: ${dueDate}`);
                    if (now > dueDate) {
                        // Recorre todos los encargados para la tarea
                        const inCharge = task.inCharge;
                        for (const chargerIndex in inCharge) {
                            const chargerRef = ref(database, `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerIndex}`);
                            const chargerSnapshot = await get(chargerRef);

                            if (chargerSnapshot.exists()) {
                                const charger = chargerSnapshot.val();
                                console.log(`Estado actual del encargado ${chargerIndex}: ${charger.state}`);
                                // Solo actualiza el estado si el estado actual es 'Pendiente'
                                if (charger.state === 'Pendiente') {
                                    await update(chargerRef, { state: 'No Entregado' });
                                    console.log(`Estado de la tarea ${taskId} para el encargado ${chargerIndex} actualizado a 'No Entregado'.`);
                                }
                            } else {
                                console.log(`No se encontró el encargado ${chargerIndex} para la tarea ${taskId}.`);
                            }
                        }
                    }
                }
            }
        } else {
            console.log('No se encontraron sujetos en la base de datos.');
        }
    } catch (error) {
        console.error('Error al comprobar las fechas de las tareas:', error);
    }
}

