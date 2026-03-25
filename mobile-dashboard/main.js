const container = document.getElementById("cards");
const refreshBtn = document.getElementById("refreshBtn");
const statusMessage = document.getElementById("statusMessage");

const DB_NAME = "dashboardDB";
const DB_VERSION = 1;
const STORE_NAME = "cards";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject("Erreur lors de l'ouverture de la base IndexedDB !");
    };
  });
}

async function clearCards() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject("Erreur lors de la suppression des anciennes données.");
  });
}

async function saveCardsToIndexedDB(data) {
  const db = await openDB();

  await clearCards();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    data.forEach((item, index) => {
      store.put({
        id: index + 1,
        title: item.title,
        content: item.content
      });
    });

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject("Erreur lors de l'enregistrement des données dans IndexedDB !");
    };
  });
}

async function getCardsFromIndexedDB() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll(); 

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject("Erreur lors de la lecture des données depuis IndexedDB !");
    };
  });
}

function createCard(title, content) {
  return `
    <div class="card">
      <div class="card-top">
        <h2>${title}</h2>
      </div>
      <div class="card-bottom">
        <p>${content}</p>
      </div>
    </div>
  `;
}

function renderCards(data) {
  if (!data || data.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; color:#6b7280;">
        Aucune donnée disponible.
      </p>
    `;
    return;
  }

  container.innerHTML = data
    .map((item) => createCard(item.title, item.content))
    .join("");
}

function updateStatus(message, type = "normal") {
  statusMessage.textContent = message;

  switch (type) {
    case "success":
      statusMessage.style.color = "green";
      break;
    case "warning":
      statusMessage.style.color = "orange";
      break;
    case "error":
      statusMessage.style.color = "red";
      break;
    default:
      statusMessage.style.color = "#374151";
  }
}

async function fetchData() {
  try {
    updateStatus("Chargement des données...", "normal");
    container.innerHTML = `
      <p style="text-align:center; color:#6b7280;">Chargement...</p>
    `;

    const res = await fetch("http://localhost:3000/api/data");

    if (!res.ok) {
      throw new Error("Erreur lors de la récupération des données.");
    }

    const data = await res.json();

    renderCards(data);

    await saveCardsToIndexedDB(data);

    updateStatus("Données chargées depuis l'API et sauvegardées dans IndexedDB.", "success");
  } catch (error) {
    console.error("Erreur API :", error);

    container.innerHTML = `
      <p style="text-align:center; color:red;">
        Impossible de charger les données depuis l'API.
      </p>
    `;

    updateStatus("Erreur lors du chargement des données.", "error");
  }
}

refreshBtn.addEventListener("click", fetchData);

fetchData();
