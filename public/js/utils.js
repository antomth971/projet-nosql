// Utilitaires généraux

/**
 * Affiche un message à l'utilisateur
 */
function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;

  // Insérer au début du container
  const container = document.querySelector(".container");
  const header = container.querySelector("header");
  container.insertBefore(messageDiv, header.nextSibling);

  // Supprimer après 5 secondes
  setTimeout(() => {
    messageDiv.remove();
  }, CONFIG.MESSAGE_DURATION);
}

/**
 * Affiche un état de chargement sur un bouton
 */
function showLoading(button) {
  const originalText = button.textContent;
  button.textContent = "Chargement...";
  button.disabled = true;

  return () => {
    button.textContent = originalText;
    button.disabled = false;
  };
}

/**
 * Effectue une requête API avec gestion d'erreurs
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (window.authToken) {
    defaultOptions.headers["Authorization"] = `Bearer ${window.authToken}`;
  }

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, finalOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur API:", error);
    throw error;
  }
}

/**
 * Sauvegarde l'état de session
 */
function saveSession(user, token) {
  localStorage.setItem(CONFIG.CACHE_KEYS.USER, user);
  localStorage.setItem(CONFIG.CACHE_KEYS.TOKEN, token);
}

/**
 * Restaure l'état de session
 */
function restoreSession() {
  const savedUser = localStorage.getItem(CONFIG.CACHE_KEYS.USER);
  const savedToken = localStorage.getItem(CONFIG.CACHE_KEYS.TOKEN);

  return { user: savedUser, token: savedToken };
}

/**
 * Efface la session
 */
function clearSession() {
  localStorage.removeItem(CONFIG.CACHE_KEYS.USER);
  localStorage.removeItem(CONFIG.CACHE_KEYS.TOKEN);
}
