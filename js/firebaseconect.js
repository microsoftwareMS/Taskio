import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
  sendEmailVerification,
  getAuth,
  setPersistence,
  browserSessionPersistence,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  get,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgKoAl5hb6lwNexib8PKsmkJpKl_0UtVo",
  authDomain: "taskio-ac3ef.firebaseapp.com",
  databaseURL: "https://taskio-ac3ef-default-rtdb.firebaseio.com",
  projectId: "taskio-ac3ef",
  storageBucket: "taskio-ac3ef.appspot.com",
  messagingSenderId: "267715237846",
  appId: "1:267715237846:web:a214aafb89c9bcf5c73677",
  measurementId: "G-08Z8ZL904Y",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
let userUID = sessionStorage.getItem("userUID");
const firestore = getFirestore(app);

let subjects = [];
let currentUserName = "";
let globalSubjectsDetails = [];

document.addEventListener("DOMContentLoaded", () => {
  const userLoginAdminUser = document.getElementById("user_login_admin_user");
  const userLoginAdminAdmin = document.getElementById("user_login_admin_admin");
  const logoutBtn = document.getElementById("logoutBtn");
  const usernameSpan = document.getElementById("username");
  const container = document.querySelector(".task-subject-container");
  const themeToggleButton = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.classList.toggle("dark-mode", savedTheme === "dark");
    themeIcon.classList.toggle("fa-moon", savedTheme === "dark");
    themeIcon.classList.toggle("fa-sun", savedTheme !== "dark");
  }

  // Handling user login as User
  if (userLoginAdminUser) {
    userLoginAdminUser.addEventListener("click", async () => {
      var email = document.getElementById("login-email").value;
      var password = document.getElementById("login-password").value;

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        const userRef = ref(database, `users/${user.uid}/roles`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const profiles = snapshot.val();
          if (profiles.user) {
            alert("Usuario logueado como Usuario");
            window.location.href = "html/home.html";
          } else {
            alert("No tienes perfil de Usuario activo.");
          }
        } else {
          alert("No se encontraron perfiles para este usuario.");
        }
      } catch (error) {
        handleError(error);
      }
    });
  }

  // Manejar inicio de sesión como administrador
  if (userLoginAdminAdmin) {
    userLoginAdminAdmin.addEventListener("click", async () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

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
            window.location.href = "html/admin.html";
          } else {
            alert("No tienes perfil de Administrador activo.");
          }
        } else {
          alert("No se encontraron perfiles para este usuario.");
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
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        alert("Has cerrado sesión.");
        window.location.href = "../index.html"; // Redirige al login o página principal
      } catch (error) {
        handleError(error);
      }
    });
  }

  // Update username on home page
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      const userRef = ref(database, `users/${user.uid}/username`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userName = snapshot.val();
          currentUserName = userName; // Guardar en variable global
          sessionStorage.setItem("userName", userName); // Guardar en sessionStorage
          if (usernameSpan) {
            usernameSpan.textContent = userName;
            console.log("Username updated:", userName);
          } else {
            console.log("Username span not found");
          }
        } else {
          console.log("No username found for this user");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    } else {
      console.log("No user is logged in");
    }
  });
});

function handleError(error) {
  const errorCode = error.code;
  if (errorCode === "auth/invalid-email") {
    alert("El correo no es válido");
  } else if (errorCode === "auth/user-disabled") {
    alert("El usuario ha sido deshabilitado");
  } else if (errorCode === "auth/user-not-found") {
    alert("El usuario no existe");
  } else if (errorCode === "auth/wrong-password") {
    alert("Contraseña incorrecta");
  } else {
    alert("Error desconocido: " + error.message);
  }
}

// Función para actualizar el nombre del usuario al iniciar sesión
function updateUsername() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}/username`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userName = snapshot.val();
          userUID = user.uid; // Aquí es donde reasignas userUID
          sessionStorage.setItem("userName", userName); // Guarda el nombre del usuario en sessionStorage
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    }
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Los meses empiezan desde 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

async function printTaskStatusByUser(userIdOrName) {
  const database = getDatabase();
  const subjectsRef = ref(database, "subjects");

  try {
    const snapshot = await get(subjectsRef);

    if (snapshot.exists()) {
      const subjectsData = snapshot.val();
      const subjectContainer = document.querySelector(".subject-container");
      subjectContainer.innerHTML = "";

      Object.keys(subjectsData).forEach((subjectId) => {
        const subjectData = subjectsData[subjectId];
        const tasks = subjectData.tasks ? Object.values(subjectData.tasks) : [];

        // Ordenar las tareas por fecha de entrega (de la más reciente a la más antigua)
        tasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

        let tasksHTML = "";

        tasks.forEach((task) => {
          const taskEncargados = task.inCharge
            ? Object.values(task.inCharge)
            : [];
          const userTask = taskEncargados.find((inCharger) => {
            return (
              inCharger.id === userIdOrName || inCharger.name === userIdOrName
            );
          });

          if (userTask) {
            const formattedDate = task.dueDate
              ? formatDate(task.dueDate)
              : "Fecha no disponible";

            tasksHTML += `
              <div class="task-item task-item--${
                userTask.state === "Pendiente" ? "new" : "completed"
              }">
                <div class="task-details">
                  <h4 class="task-title">${
                    task.name || "Nombre de tarea no disponible"
                  }</h4>
                  <span class="task-deadline-label">Fecha de Entrega</span>
                  <time class="task-deadline" datetime="${
                    task.dueDate || "0000-00-00T00:00"
                  }">
                    ${formattedDate}
                  </time>
                </div>
                <div class="task-status">
                  <span class="task-status-label">${getTaskState(
                    userTask.state
                  )}</span>
                  <button class="task-details-button" 
                          data-subject-name="${subjectData.name}"
                          data-task-name="${
                            task.name || "Nombre de tarea no disponible"
                          }">
                    Ver Detalles
                  </button>
                </div>
              </div>
            `;
          }
        });

        if (tasksHTML) {
          const subjectHTML = `
            <div class="subject-content">
              <div class="subject">
                <h3 id="subject-name">${subjectData.name}</h3>
                <span>${tasks.length} Tareas</span>
              </div>
              <div class="tasks-container">
                ${tasksHTML}
              </div>
            </div>
          `;
          subjectContainer.innerHTML += subjectHTML;
        }
      });

      // Después de generar el HTML, selecciona los elementos de estado y cambia su color
      const statusElements = document.querySelectorAll(".task-status-label");

      statusElements.forEach((statusElement) => {
        const statusText = statusElement.textContent;

        // Cambia el color de fondo según el texto del estado
        if (statusText === "Entregada") {
          statusElement.style.backgroundColor = "green";
          statusElement.style.color = "white"; // Opcional: color del texto
        } else if (statusText === "No Entregada") {
          statusElement.style.backgroundColor = "red";
          statusElement.style.color = "white"; // Opcional: color del texto
        } else if (statusText === "Pendiente") {
          statusElement.style.backgroundColor = "#18181b";
          statusElement.style.color = "white"; // Opcional: color del texto
        } else if (statusText === "Corrección") {
          statusElement.style.backgroundColor = "orange";
          statusElement.style.color = "white"; // Opcional: color del texto
        } else {
          statusElement.style.backgroundColor = "gray"; // Color por defecto si el estado no es reconocido
          statusElement.style.color = "white";
        }
      });

      // Después de actualizar el HTML, agregar event listeners a los botones
      addTaskDetailsEventListeners();
    } else {
      console.log("No se encontraron materias en la base de datos.");
    }
  } catch (error) {
    console.error("Error al obtener el estado de las tareas:", error);
  }
}

const companionsContainer = document.getElementById("companions-container");
async function addTaskDetailsEventListeners() {
  const divSubContainer = document.getElementById("idSubject__details");
  const taskDetailButtons = document.querySelectorAll(".task-details-button");

  // Añadir el manejador de eventos para los botones de detalles de la tarea
  taskDetailButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const subjectName = event.currentTarget.getAttribute("data-subject-name");
      const taskName = event.currentTarget.getAttribute("data-task-name");
      const detailsContent = document.querySelector(
        ".subjects-details__content"
      );

      divSubContainer.style.display = "flex";

      const database = getDatabase();
      const subjectsRef = ref(database, "subjects");

      try {
        const snapshot = await get(subjectsRef);

        if (snapshot.exists()) {
          const subjectsData = snapshot.val();

          // Buscar la materia
          const subjectId = Object.keys(subjectsData).find(
            (id) => subjectsData[id].name === subjectName
          );

          if (subjectId) {
            const subjectData = subjectsData[subjectId];
            const task = Object.values(subjectData.tasks || {}).find(
              (t) => t.name === taskName
            );

            if (task) {
              const taskEncargados = task.inCharge
                ? Object.values(task.inCharge)
                : [];
              const userTask = taskEncargados.find(
                (inCharger) =>
                  inCharger.id === userIdOrName ||
                  inCharger.name === userIdOrName
              );

              let taskDetail = "Descripción no disponible";

              if (userTask) {
                if (userTask.state === "Necesita Corrección") {
                  taskDetail = userTask.comment || taskDetail;
                } else {
                  taskDetail = userTask.detail || taskDetail;
                }
              }

              // Actualiza el contenido de `subjects-details__content`
              detailsContent.innerHTML = `
                <div class="subjects-details__info">
                  <h1>${taskName}</h1>
                  <span>${subjectName}</span>
                  <i class="material-symbols-rounded closDetSubj" id="close-details_subjects">close</i>
                </div>
                <h2 class="subjects-details-description__text">Descripción de la Tarea:</h2>
                <div class="subjects-details__description">
                  <p>${taskDetail}</p>
                </div>
                <span class="subjects-details__date">
                  Fecha de Entrega: <time datetime="${
                    task.dueDate
                  }">${formatDate(task.dueDate)}</time>
                </span>
                <span class="subjects-details__state">${getTaskState(
                  userTask.state
                )}</span>
                <h2 class="subject-correction__text">Entregar Tarea:</h2>
                <div class="correction-task-item__file" style="display: none;">
                  <i class="bi bi-file-earmark" id="fileIcon"></i>
                  <div id="content-datail-document">
                    <span class="name-file">${task.fileName || "N/A"}</span>
                    <p>
                      <span class="size-file">${task.fileSize || "N/A"}</span> -
                      <time datetime="${
                        task.fileDate || new Date().toISOString()
                      }">${formatDate(task.fileDate || new Date())}</time>
                    </p>
                  </div>
                </div>
                <div class="subject-container__button">
                  <button class="attach-file__button">
                    Adjuntar archivo
                    <label for="btn-file"></label>
                    <input type="file" id="btn-file" />
                  </button>
                  <button class="view_subject__companions" data-subject-name="${subjectName}" data-task-name="${taskName}">Ver compañeros</button>
                </div>
                <button class="subject-details__button" id="submit-task-button">Entregar Tarea</button>
              `;

              const stateElement = detailsContent.querySelector(
                ".subjects-details__state"
              );
              const button_block = document.querySelector(
                ".subject-details__button"
              );
              const button_upload1 = document.querySelector(
                ".attach-file__button"
              );
              const textDescription = document.querySelector(
                ".subjects-details-description__text"
              );
              const textCorrection = document.querySelector(
                ".subject-correction__text"
              );

              // Cambia el color de fondo según el estado
              if (userTask.state === "Entregado") {
                stateElement.style.backgroundColor = "green";
                stateElement.style.color = "white"; // Opcional: color del texto
                button_block.disabled = false;
                button_upload1.disabled = false;
                textCorrection.textContent = "Actualizar Tarea Entregada";
                button_block.textContent = "Actualizar Tarea";
              } else if (userTask.state === "Necesita Corrección") {
                stateElement.style.backgroundColor = "orange";
                stateElement.style.color = "white"; // Opcional: color del texto
                textDescription.textContent = "Comentario:";
                textCorrection.textContent = "Entregar Tarea Corregida";
                button_block.textContent = "Actualizar Tarea";
              } else if (userTask.state === "No Entregado") {
                stateElement.style.backgroundColor = "red";
                stateElement.style.color = "white"; // Opcional: color del texto
                button_block.style.display = "none";
                button_upload1.style.display = "none";
                button_block.disabled = true;
                button_upload1.disabled = true;
              } else if (userTask.state === "Pendiente") {
                stateElement.style.backgroundColor = "#18181b";
                stateElement.style.color = "white"; // Opcional: color del texto
              } else {
                stateElement.style.backgroundColor = "gray"; // Color por defecto si el estado no es reconocido
                stateElement.style.color = "white";
              }

              async function getTaskAndChargerIdsAutomatically(
                subjectName,
                taskName,
                userIdOrName
              ) {
                const database = getDatabase();
                const subjectsRef = ref(database, "subjects");

                try {
                  const snapshot = await get(subjectsRef);

                  if (snapshot.exists()) {
                    const subjectsData = snapshot.val();

                    // Buscar la materia
                    const subjectId = Object.keys(subjectsData).find(
                      (id) => subjectsData[id].name === subjectName
                    );

                    if (subjectId) {
                      const subjectData = subjectsData[subjectId];
                      const taskId = Object.keys(subjectData.tasks || {}).find(
                        (id) => subjectData.tasks[id].name === taskName
                      );

                      if (taskId) {
                        const taskData = subjectData.tasks[taskId];
                        const chargerId = Object.keys(
                          taskData.inCharge || {}
                        ).find(
                          (id) =>
                            taskData.inCharge[id].id === userIdOrName ||
                            taskData.inCharge[id].name === userIdOrName
                        );

                        if (chargerId) {
                          return {
                            subjectId,
                            taskId,
                            chargerId,
                          };
                        } else {
                          throw new Error("Encargado no encontrado");
                        }
                      } else {
                        throw new Error("Tarea no encontrada");
                      }
                    } else {
                      throw new Error("Materia no encontrada");
                    }
                  } else {
                    throw new Error("No hay datos en la base de datos");
                  }
                } catch (error) {
                  console.error("Error al obtener las IDs:", error);
                }
              }

              getTaskAndChargerIdsAutomatically(
                subjectName,
                taskName,
                userIdOrName
              )
                .then((result) => {
                  if (result) {
                    const { subjectId, taskId, chargerId } = result;

                    // Obtener elementos
                    const fileInput = document.getElementById("btn-file");
                    const fileLabel = document.querySelector(
                      'label[for="btn-file"]'
                    );

                    if (fileInput) {
                      // Asignar nuevo ID al input
                      fileInput.id = `btn-file-${subjectId}-${taskId}-${chargerId}`;
                      console.log("Nuevo ID del input:", fileInput.id);
                    } else {
                      console.error(
                        "No se encontró el elemento input con ID btn-file."
                      );
                    }

                    if (fileLabel) {
                      // Actualizar el atributo for del label
                      fileLabel.setAttribute(
                        "for",
                        `btn-file-${subjectId}-${taskId}-${chargerId}`
                      );
                      console.log(
                        "Nuevo atributo for del label:",
                        fileLabel.getAttribute("for")
                      );
                    } else {
                      console.error(
                        "No se encontró el elemento label para el input."
                      );
                    }

                    // También puedes actualizar el botón de entregar tarea
                    const submitButton =
                      document.getElementById("submit-task-button");
                    if (submitButton) {
                      submitButton.setAttribute("data-subject-id", subjectId);
                      submitButton.setAttribute("data-task-id", taskId);
                      submitButton.setAttribute("data-incharger-id", chargerId);
                    } else {
                      console.error(
                        "No se encontró el botón submit-task-button."
                      );
                    }
                  }
                })
                .catch((error) => {
                  console.error("Error:", error);
                });

              // Añadir evento al botón de entregar tarea
              document
                .querySelector(".subject-details__button")
                .addEventListener("click", async () => {
                  const subjectId = document
                    .querySelector(".subject-details__button")
                    .getAttribute("data-subject-id");
                  const taskId = document
                    .querySelector(".subject-details__button")
                    .getAttribute("data-task-id");
                  const chargerId = document
                    .querySelector(".subject-details__button")
                    .getAttribute("data-incharger-id");

                  // Aquí iría la lógica para guardar los datos usando las IDs
                  console.log("Entregar tarea con:", {
                    subjectId,
                    taskId,
                    chargerId,
                  });

                  // Llama a la función para guardar los datos en la base de datos
                  await uploadTaskFile(subjectId, taskId, chargerId);
                });

              // Añadir manejador de eventos para el input de archivo si no se ha añadido antes
              const fileInput = document.getElementById("btn-file");
              if (fileInput) {
                fileInput.removeEventListener("change", handleFileUpload); // Para evitar múltiples registros del mismo evento
                fileInput.addEventListener("change", handleFileUpload);
              }

              // Maneja la subida del archivo y actualiza la vista
              function handleFileUpload(event) {
                const fileInput = event.target;
                const file = fileInput.files[0];

                if (file) {
                  const fileName = file.name;
                  const fileSize = formatFileSize(file.size);
                  const fileDate = new Date().toISOString();

                  // Actualiza el contenedor con la información del archivo subido
                  const fileContainer = document.querySelector(
                    ".correction-task-item__file"
                  );
                  if (fileContainer) {
                    fileContainer.querySelector(".name-file").textContent =
                      fileName;
                    fileContainer.querySelector(".size-file").textContent =
                      fileSize;
                    fileContainer
                      .querySelector("time")
                      .setAttribute("datetime", fileDate);
                    fileContainer.querySelector("time").textContent =
                      formatDate(fileDate);

                    // Hacer visible el contenedor de archivo
                    fileContainer.style.display = "flex";
                  } else {
                    console.error(
                      "Contenedor de archivo no encontrado en el DOM."
                    );
                  }
                }
              }

              // Función para formatear el tamaño del archivo
              function formatFileSize(size) {
                if (size < 1024) return `${size} bytes`;
                else if (size < 1048576)
                  return `${(size / 1024).toFixed(2)} KB`;
                else return `${(size / 1048576).toFixed(2)} MB`;
              }

              document
                .getElementById("btn-file")
                .addEventListener("change", function (event) {
                  const file = event.target.files[0];
                  if (file) {
                    const fileName = file.name;
                    const fileExtension = fileName
                      .split(".")
                      .pop()
                      .toLowerCase();

                    const fileIcon = document.getElementById("fileIcon");
                    const documentDetails = document.getElementById(
                      "content-datail-document"
                    );

                    if (fileExtension === "pdf") {
                      fileIcon.className = "bi bi-file-earmark-pdf";
                      fileIcon.style.color = "#FF0000";
                      documentDetails.style.borderLeft = "2px solid #FF0000";
                    } else if (
                      fileExtension === "doc" ||
                      fileExtension === "docx"
                    ) {
                      fileIcon.className = "bi bi-file-earmark-word";
                      fileIcon.style.color = "#2B579A";
                      documentDetails.style.borderLeft = "2px solid #2B579A";
                    } else if (
                      fileExtension === "xls" ||
                      fileExtension === "xlsx"
                    ) {
                      fileIcon.className = "bi bi-file-earmark-excel";
                      fileIcon.style.color = "#217346";
                      documentDetails.style.borderLeft = "2px solid #217346";
                    } else if (
                      fileExtension === "ppt" ||
                      fileExtension === "pptx"
                    ) {
                      fileIcon.className = "bi bi-file-earmark-ppt";
                      fileIcon.style.color = "#D24726";
                      documentDetails.style.borderLeft = "2px solid #D24726";
                    } else {
                      fileIcon.className = "bi bi-file-earmark";
                      fileIcon.style.color = ""; // Restablece el color al valor por defecto
                    }

                    console.log(`Extensión del archivo: ${fileExtension}`);
                  }
                });

              // Variable global para almacenar los datos de materias, tareas y encargados
              let subjectsData = {};

              // Función para obtener materias, tareas y encargados
              async function fetchSubjectsTasksAndChargers() {
                try {
                  const subjectsRef = ref(database, "subjects");
                  const subjectsSnapshot = await get(subjectsRef);

                  if (subjectsSnapshot.exists()) {
                    const subjects = subjectsSnapshot.val();
                    subjectsData = {};

                    for (const subjectId in subjects) {
                      const subject = subjects[subjectId];
                      subjectsData[subjectId] = {
                        name: subject.name,
                        tasks: {},
                      };

                      if (subject.tasks) {
                        for (const taskId in subject.tasks) {
                          const task = subject.tasks[taskId];
                          subjectsData[subjectId].tasks[taskId] = {
                            name: task.name,
                            dueDate: task.dueDate,
                            inChargers: {},
                          };

                          if (task.inCharge) {
                            for (const chargerId in task.inCharge) {
                              const charger = task.inCharge[chargerId];
                              subjectsData[subjectId].tasks[taskId].inChargers[
                                chargerId
                              ] = {
                                name: charger.name || "N/A",
                                detail: charger.detail || "N/A",
                                state: charger.state || "N/A",
                                comment: charger.comment || "N/A",
                              };
                            }
                          }
                        }
                      }
                    }
                    setupEventListeners(); // Configura los manejadores de eventos después de obtener los datos
                  } else {
                    console.log(
                      "No se encontraron materias en la base de datos."
                    );
                  }
                } catch (error) {
                  console.error(
                    "Error al obtener materias, tareas y encargados:",
                    error
                  );
                }
              }

              // Función para configurar los manejadores de eventos
              function setupEventListeners() {
                // Añadir el manejador de eventos al botón "Ver compañeros"
                const viewCompanionsButton = document.querySelector(
                  ".view_subject__companions"
                );

                viewCompanionsButton.addEventListener("click", (event) => {
                  const subjectName =
                    event.currentTarget.getAttribute("data-subject-name");
                  const taskName =
                    event.currentTarget.getAttribute("data-task-name");

                  console.log(
                    `Botón 'Ver compañeros' clickeado para la tarea: "${taskName}" en la materia: "${subjectName}"`
                  );

                  // Obtener los datos correspondientes de subjectsData
                  const subjectId = Object.keys(subjectsData).find(
                    (id) => subjectsData[id].name === subjectName
                  );

                  if (subjectId) {
                    const taskId = Object.keys(
                      subjectsData[subjectId].tasks
                    ).find(
                      (id) =>
                        subjectsData[subjectId].tasks[id].name === taskName
                    );
                    if (taskId) {
                      const task = subjectsData[subjectId].tasks[taskId];
                      const inChargers = task.inChargers;

                      // Configurar el contenedor de compañeros
                      companionsContainer.style.display = "flex";

                      // Crear el contenido dinámico basado en los datos, omitiendo al usuario con el nombre `userIdOrName`
                      let companionsContent = "";
                      for (const chargerId in inChargers) {
                        const charger = inChargers[chargerId];
                        if (charger.name !== userIdOrName) {
                          companionsContent += `
                            <div class="companions-task__item">
                              <div class="companions-task__header">
                                <div class="companions-task__info">
                                  <h2>${charger.name}</h2>
                                </div>
                                <span class="companions-task-status">${charger.state}</span>
                              </div>
                              <h3>Descripción:</h3>
                              <div class="companions-task-description">
                                <p>${charger.detail}</p>
                              </div>
                            </div>
                          `;
                        }
                      }

                      // Insertar el contenido dinámico en el contenedor
                      document.getElementById(
                        "companions-task-content"
                      ).innerHTML = companionsContent;

                      // Seleccionar todos los elementos que contienen el estado de los compañeros
                      const stateElements = document.querySelectorAll(
                        ".companions-task-status"
                      );

                      // Cambiar el color de fondo según el estado
                      stateElements.forEach((stateElement) => {
                        const stateText = stateElement.textContent;

                        if (stateText === "Entregado") {
                          stateElement.style.backgroundColor = "green";
                          stateElement.style.color = "white"; // Opcional: color del texto
                        } else if (stateText === "Necesita Corrección") {
                          stateElement.style.backgroundColor = "orange";
                          stateElement.style.color = "white"; // Opcional: color del texto
                        } else if (stateText === "No Entregado") {
                          stateElement.style.backgroundColor = "red";
                          stateElement.style.color = "white"; // Opcional: color del texto
                        } else if (stateText === "Pendiente") {
                          stateElement.style.backgroundColor = "#18181b";
                          stateElement.style.color = "white"; // Opcional: color del texto
                        } else {
                          stateElement.style.backgroundColor = "gray"; // Color por defecto si el estado no es reconocido
                          stateElement.style.color = "white";
                        }
                      });
                    }
                  }
                });
              }

              // Inicializa la aplicación
              fetchSubjectsTasksAndChargers().then(() => {
                console.log("Datos cargados y eventos configurados.");
              });
            } else {
              console.log(
                "No se encontró la tarea en la materia especificada."
              );
              detailsContent.innerHTML = `<p>No se encontró la tarea en la materia especificada.</p>`;
            }
          } else {
            console.log("No se encontró la materia en la base de datos.");
            detailsContent.innerHTML = `<p>No se encontró la materia en la base de datos.</p>`;
          }
        } else {
          console.log("No se encontraron materias en la base de datos.");
          detailsContent.innerHTML = `<p>No se encontraron materias en la base de datos.</p>`;
        }
      } catch (error) {
        console.error("Error al obtener la descripción del encargado:", error);
        detailsContent.innerHTML = `<p>Error al obtener la descripción del encargado.</p>`;
      }
    });
  });

  // Añadir el manejador de eventos para el ícono de cierre
  document.addEventListener("click", (event) => {
    if (event.target && event.target.id === "close-details_subjects") {
      divSubContainer.style.display = "none"; // Oculta el contenedor de detalles
      companionsContainer.style.display = "none";
    } else if (event.target && event.target.id === "close-companions__task") {
      companionsContainer.style.display = "none";
    }
  });
}

// Función para convertir el estado en una cadena legible
function getTaskState(state) {
  switch (state) {
    case "Entregado":
      return "Entregada";
    case "Pendiente":
      return "Pendiente";
    case "No Entregado":
      return "No Entregada";
    case "Necesita Corrección":
      return "Corrección";
    default:
      return "Estado desconocido";
  }
}

// Ejemplo de uso de la función
const userIdOrName = currentUserName || sessionStorage.getItem("userName");
printTaskStatusByUser(userIdOrName);

async function uploadTaskFile(subjectId, taskId, chargerId) {
  const fileInputId = `btn-file-${subjectId}-${taskId}-${chargerId}`;
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput) {
    console.error(
      `No se encontró el elemento fileInput con el ID ${fileInputId}.`
    );
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    alert("Por favor, seleccione un archivo para subir.");
    return;
  }

  const sanitizedFileName = file.name.replace(/[#$[\]]/g, "_");
  const storage = getStorage();
  const database = getDatabase();

  try {
    const fileStorageRef = storageRef(
      storage,
      `documents/${subjectId}/tasks/${taskId}/inCharger/${sanitizedFileName}`
    );

    await uploadBytes(fileStorageRef, file);
    const downloadURL = await getDownloadURL(fileStorageRef);

    const fileDetailsRef = ref(
      database,
      `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerId}/file`
    );
    await set(fileDetailsRef, {
      fileName: file.name,
      fileSize: file.size,
      fileDate: new Date().toISOString(),
      fileURL: downloadURL,
    });

    const chargerRef = ref(
      database,
      `subjects/${subjectId}/tasks/${taskId}/inCharge/${chargerId}`
    );
    await update(chargerRef, {
      state: "Entregado",
    });

    if (!localStorage.getItem("pageReloaded")) {
      localStorage.setItem("pageReloaded", "true");
      alert("Archivo subido y estado del encargado actualizado exitosamente.");
      location.reload();
    } else {
      alert("Archivo subido y estado del encargado actualizado exitosamente.");
    }
  } catch (error) {
    console.error("Error al subir el archivo:", error);
    alert(
      "Ocurrió un error al subir el archivo. Por favor, inténtelo de nuevo."
    );
  }
}
