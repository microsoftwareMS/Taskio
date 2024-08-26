let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
let chargers = JSON.parse(localStorage.getItem('chargers')) || [];
let checkInterval = 1000; // Intervalo de verificación por defecto
let checkIntervalId; // ID del intervalo para poder detenerlo

// Detecta el tema actual
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

// Aplica el tema actual al documento
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
    subjects.forEach((subject, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);

        const deleteOption = option.cloneNode(true);
        deleteSubjectSelect.appendChild(deleteOption);
    });
}

function updateTaskSelect(subjectIndex) {
    const taskSelect = document.getElementById('taskSelect');
    taskSelect.innerHTML = '<option value="">Selecciona una tarea</option>';
    if (subjectIndex !== "") {
        subjects[subjectIndex].tasks.forEach((task, index) => {
            const option = document.createElement('option');
            option.value = `${subjectIndex}-${index}`;
            option.textContent = task.name;
            taskSelect.appendChild(option);
        });
    }
}

function updateChargerSelect() {
    const chargerSelect = document.getElementById('chargerSelect');
    const deleteChargerSelect = document.getElementById('deleteChargerSelect');
    chargerSelect.innerHTML = deleteChargerSelect.innerHTML = '<option value="">Selecciona un integrante</option>';
    chargers.forEach((charger, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = charger;
        chargerSelect.appendChild(option);

        const deleteOption = option.cloneNode(true);
        deleteChargerSelect.appendChild(deleteOption);
    });
}

function addSubject() {
    const subjectName = document.getElementById('subjectName').value;
    if (subjectName) {
        subjects.push({ name: subjectName, tasks: [] });
        document.getElementById('subjectName').value = '';
        updateSubjectSelect();
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }
}

function addTask() {
    const subjectIndex = document.getElementById('subjectSelect').value;
    const taskName = document.getElementById('taskName').value;
    const dueDate = document.getElementById('dueDate').value;

    if (subjectIndex && taskName && dueDate) {
        const tasks = subjects[subjectIndex].tasks;

        const existingTask = tasks.find(task => task.name === taskName);

        if (existingTask) {
            alert('Ya existe una tarea con este nombre en la materia seleccionada.');
        } else {
            tasks.push({ name: taskName, dueDate: new Date(dueDate).toISOString(), inCharge: [] });
            document.getElementById('taskName').value = '';
            document.getElementById('dueDate').value = '';
            updateTaskSelect(subjectIndex);
            localStorage.setItem('subjects', JSON.stringify(subjects));

            // Inicia la verificación de tiempo solo para la nueva tarea
            startCheckInterval(subjectIndex, tasks.length - 1);
        }
    }
}

function addNewCharger() {
    const chargerName = document.getElementById('newChargerName').value;
    if (chargerName) {
        if (!chargers.includes(chargerName)) {
            chargers.push(chargerName);
            document.getElementById('newChargerName').value = '';
            updateChargerSelect();
            localStorage.setItem('chargers', JSON.stringify(chargers));
        } else {
            alert('El integrante ya está en la lista.');
        }
    }
}

function addCharger() {
    const taskSelect = document.getElementById('taskSelect').value.split('-');
    const subjectIndex = taskSelect[0];
    const taskIndex = taskSelect[1];
    const chargerIndex = document.getElementById('chargerSelect').value;
    const taskDetail = document.getElementById('taskDetail').value;

    if (subjectIndex && taskIndex && chargerIndex && taskDetail) {
        const chargerName = chargers[chargerIndex];
        const inChargeList = subjects[subjectIndex].tasks[taskIndex].inCharge;

        const existingCharger = inChargeList.find(charger => charger.name === chargerName);

        if (existingCharger) {
            existingCharger.detail = taskDetail;
            existingCharger.state = "Pendiente";
        } else {
            inChargeList.push({ name: chargerName, state: "Pendiente", detail: taskDetail });
        }

        document.getElementById('taskDetail').value = '';
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderTasks();
    }
}

function deleteSubject() {
    const subjectIndex = document.getElementById('deleteSubjectSelect').value;
    if (subjectIndex !== "") {
        subjects.splice(subjectIndex, 1);
        updateSubjectSelect();
        updateTaskSelect("");
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderTasks();
    }
}

function deleteCharger() {
    const chargerIndex = document.getElementById('deleteChargerSelect').value;
    if (chargerIndex !== "") {
        const removedCharger = chargers.splice(chargerIndex, 1)[0];
        updateChargerSelect();
        localStorage.setItem('chargers', JSON.stringify(chargers));

        subjects.forEach(subject => {
            subject.tasks.forEach(task => {
                task.inCharge = task.inCharge.filter(charger => charger.name !== removedCharger);
            });
        });
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderTasks();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); // Aplica el tema actual al cargar
    updateSubjectSelect();
    updateChargerSelect();

    document.getElementById('subjectSelect').addEventListener('change', (event) => {
        const subjectIndex = event.target.value;
        updateTaskSelect(subjectIndex);
    });

    renderTasks();

    // Elimina la llamada a startCheckInterval aquí para que no inicie el intervalo al cargar la página.
    // startCheckInterval();
    subjects.forEach((subject, subjectIndex) => {
        subject.tasks.forEach((task, taskIndex) => {
            checkTime(subjectIndex, taskIndex);
        });
    });

    startCheckInterval();
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            applyTheme();
        });
    }
});

function startCheckInterval() {
    checkIntervalId = setInterval(() => {
        subjects.forEach((subject, subjectIndex) => {
            subject.tasks.forEach((task, taskIndex) => {
                checkTime(subjectIndex, taskIndex);
            });
        });
    }, checkInterval);
}

function stopCheckInterval() {
    console.log('Stopping check interval');
    clearInterval(checkIntervalId);
}

function resumeCheckInterval() {
    console.log('Resuming check interval');
    startCheckInterval();
}

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



function renderTasks() {
    saveVisibilityState(); // Guardar el estado actual de visibilidad
    const listContainer = document.querySelector('.list-container');
    listContainer.innerHTML = '';

    if (subjects.length === 0) {
        listContainer.innerHTML = '<p>No hay materias disponibles.</p>';
        return;
    }

    subjects.forEach((subject, subjectIndex) => {
        let subjectHTML = `
            <div class="subject-container">
                <div class="subject-title-container" onclick="toggleTaskContainer(${subjectIndex})">
                    <h3>${subject.name}</h3>
                    <i class="fas fa-chevron-down" id="chevron-task-${subjectIndex}"></i>
                </div>
                <div class="task-container" id="task-container-${subjectIndex}" style="display: none;">
                    ${subject.tasks.length === 0 ? 
                        '<p>No hay tareas agregadas.</p>' : 
                        subject.tasks.map((task, taskIndex) => `
                            <div class="task-item">
                                <div class="uptate-container-date" onclick="toggleChargerContainer(${subjectIndex}, ${taskIndex})">
                                    <i class="fas fa-check-circle" style="display: none;"></i>
                                    <h4>${task.name} - Fecha de entrega: <span class="due-date">${new Date(task.dueDate).toLocaleString()}</span></h4>
                                    <i class="fas fa-chevron-down" id="chevron-charger-${subjectIndex}-${taskIndex}"></i>
                                    <button onclick="showUpdateDateForm(${subjectIndex}, ${taskIndex})">Actualizar Fecha</button>
                                    <button onclick="deleteTask(${subjectIndex}, ${taskIndex})">Eliminar Tarea</button> <!-- Botón para eliminar -->
                                </div>
                                <div id="updateDateForm-${subjectIndex}-${taskIndex}" class="update-date-form" style="display: none;">
                                    <label for="newDueDate-${subjectIndex}-${taskIndex}">Nueva Fecha y Hora:</label>
                                    <input type="datetime-local" id="newDueDate-${subjectIndex}-${taskIndex}" value="${new Date(task.dueDate).toISOString().slice(0, -1)}">
                                    <button onclick="updateDueDate(${subjectIndex}, ${taskIndex})">Guardar</button>
                                    <button onclick="hideUpdateDateForm(${subjectIndex}, ${taskIndex})">Cancelar</button>
                                </div>
                                <div class="charger-container" id="charger-container-${subjectIndex}-${taskIndex}" style="display: none;">
                                    ${task.inCharge.length === 0 ? 
                                        '<p>No hay encargados asignados a esta tarea.</p>' : 
                                        task.inCharge.map((charger, chargerIndex) => `
                                            <div class="charger-details" id="charger-details-${subjectIndex}-${taskIndex}-${chargerIndex}" style="display: block;">
                                                <div class="info-container">
                                                    <div class="charger-new">
                                                        <h5>Encargado: ${charger.name}</h5>
                                                        <p>Estado: ${charger.state}</p>
                                                        ${charger.file ? `
                                                            <div class="file-info">
                                                                <p><strong>Nombre del archivo:</strong> ${charger.file.name}</p>
                                                                <p><strong>Tamaño:</strong> ${(charger.file.size / 1024).toFixed(2)} KB</p>
                                                            </div>
                                                        ` : `<p>No se ha subido ningún archivo.</p>`}
                                                    </div>

                                                    ${charger.file ? `
                                                        <div class="download-button">
                                                            <button onclick="downloadFile('${charger.file.name}', '${charger.file.content}')">Descargar</button>
                                                        </div>
                                                    ` : ''}

                                                    <div class="button-container">
                                                        <button class="btn-1" onclick="showCorrectionForm(${subjectIndex}, ${taskIndex}, ${chargerIndex})">Corrección</button>
                                                        <button class="btn-2" onclick="markAsNotDelivered(${subjectIndex}, ${taskIndex}, ${chargerIndex})">No Entregado</button>
                                                        <button class="btn-3" onclick="markAsPending(${subjectIndex}, ${taskIndex}, ${chargerIndex})">Pendiente</button>
                                                        <button class="btn-4" onclick="markAsDelivered(${subjectIndex}, ${taskIndex}, ${chargerIndex})">Entregado</button>
                                                    </div>
                                                    <div id="correction-form-${subjectIndex}-${taskIndex}-${chargerIndex}" class="correction-form" style="display: none;">
                                                        <textarea id="comment-${subjectIndex}-${taskIndex}-${chargerIndex}" placeholder="Escribe tu comentario aquí"></textarea>
                                                        <button onclick="submitCorrectionComment(${subjectIndex}, ${taskIndex}, ${chargerIndex})">Enviar Comentario</button>
                                                    </div>
                                                </div>
                                            </div>

                                        `).join('')}
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', subjectHTML);
    });

    restoreVisibilityState(); // Restaurar estado de visibilidad después de renderizar
}



// Funciones para alternar la visibilidad de los contenedores y rotar los íconos
function toggleTaskContainer(subjectIndex) {
    const taskContainer = document.getElementById(`task-container-${subjectIndex}`);
    const chevronIcon = document.getElementById(`chevron-task-${subjectIndex}`);
    
    // Alterna la visibilidad del contenedor
    if (taskContainer.style.display === 'none') {
        taskContainer.style.display = 'block';
        chevronIcon.classList.add('rotated'); // Rota el ícono al mostrar el contenedor
    } else {
        taskContainer.style.display = 'none';
        chevronIcon.classList.remove('rotated'); // Restaura el ícono al ocultar el contenedor
    }
}



function toggleChargerContainer(subjectIndex, taskIndex) {
    const chargerContainer = document.getElementById(`charger-container-${subjectIndex}-${taskIndex}`);
    const chevronIcon = document.getElementById(`chevron-charger-${subjectIndex}-${taskIndex}`);
    
    // Alterna la visibilidad del contenedor
    if (chargerContainer.style.display === 'none') {
        chargerContainer.style.display = 'block';
        chevronIcon.classList.add('rotated'); // Rota el ícono al mostrar el contenedor
    } else {
        chargerContainer.style.display = 'none';
        chevronIcon.classList.remove('rotated'); // Restaura el ícono al ocultar el contenedor
    }
}



function deleteTask(subjectIndex, taskIndex) {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        subjects[subjectIndex].tasks.splice(taskIndex, 1);
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderTasks(); // Volver a renderizar para actualizar la vista
    }
}


function showCorrectionForm(subjectIndex, taskIndex, chargerIndex) {
    const form = document.getElementById(`correction-form-${subjectIndex}-${taskIndex}-${chargerIndex}`);
    form.style.display = 'block'; // Mostrar el formulario de corrección
    stopCheckInterval();
}

function submitCorrectionComment(subjectIndex, taskIndex, chargerIndex) {
    const comment = document.getElementById(`comment-${subjectIndex}-${taskIndex}-${chargerIndex}`).value;
    if (comment) {
        // Actualizar el estado y agregar comentario
        subjects[subjectIndex].tasks[taskIndex].inCharge[chargerIndex].state = 'Necesita Corrección';
        subjects[subjectIndex].tasks[taskIndex].inCharge[chargerIndex].comment = comment;
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderTasks(); // Volver a renderizar para actualizar la vista
        
        // Ocultar el formulario después de enviar el comentario
        const form = document.getElementById(`correction-form-${subjectIndex}-${taskIndex}-${chargerIndex}`);
        form.style.display = 'none';
    }
    resumeCheckInterval();
}


function downloadFile(fileName, fileContent) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([fileContent], { type: 'application/octet-stream' }));
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

function markForCorrection(subjectIndex, taskIndex, chargerIndex) {
    subjects[subjectIndex].tasks[taskIndex].inCharge[chargerIndex].state = 'Necesita Corrección';
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderTasks(); // Volver a renderizar para actualizar la vista
}

function markAsNotDelivered(subjectIndex, taskIndex, chargerIndex) {
    subjects[subjectIndex].tasks[taskIndex].inCharge[chargerIndex].state = 'No Entregado';
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderTasks(); // Volver a renderizar para actualizar la vista
}

function markAsPending(subjectIndex, taskIndex, chargerIndex) {
    subjects[subjectIndex].tasks[taskIndex].inCharge[chargerIndex].state = 'Pendiente';
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderTasks(); // Volver a renderizar para actualizar la vista
}

function markAsDelivered(subjectIndex, taskIndex, chargerIndex) {
    subjects[subjectIndex].tasks[taskIndex].inCharge[chargerIndex].state = 'Entregado';
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderTasks(); // Volver a renderizar para actualizar la vista
}

// Función para verificar la fecha límite de una tarea y actualizar su estado si ha pasado
function checkTime(subjectIndex, taskIndex) {
    const now = new Date();
    const task = subjects[subjectIndex].tasks[taskIndex];
    const taskDueDate = new Date(task.dueDate);

    if (taskDueDate < now) {
        const inChargeList = task.inCharge;
        inChargeList.forEach(charger => {
            if (charger.state === "Pendiente") {
                charger.state = "No Entregado";
            }
        });
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderTasks(); // Actualiza la vista para reflejar el cambio de estado
    }
}



// Mostrar el formulario para actualizar la fecha y hora de entrega
function showUpdateDateForm(subjectIndex, taskIndex) {
    document.getElementById(`updateDateForm-${subjectIndex}-${taskIndex}`).style.display = 'block';
    stopCheckInterval(); // Detener el intervalo cuando se muestra el formulario
}

// Ocultar el formulario de actualización
function hideUpdateDateForm(subjectIndex, taskIndex) {
    document.getElementById(`updateDateForm-${subjectIndex}-${taskIndex}`).style.display = 'none';
    resumeCheckInterval(); // Reanudar el intervalo cuando se oculta el formulario
}

// Actualizar la fecha y hora de entrega
function updateDueDate(subjectIndex, taskIndex) {
    const newDueDate = document.getElementById(`newDueDate-${subjectIndex}-${taskIndex}`).value;
    if (newDueDate) {
        subjects[subjectIndex].tasks[taskIndex].dueDate = new Date(newDueDate).toISOString();
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderTasks(); // Volver a renderizar para actualizar la vista
        
        // Reinicia la verificación de tiempo para esta tarea con la nueva fecha
        stopCheckInterval(); // Detén cualquier intervalo previo
        startCheckInterval(subjectIndex, taskIndex);
        
        hideUpdateDateForm(subjectIndex, taskIndex); // Ocultar el formulario después de guardar
    }
}
