function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;

  const container = document.querySelector(".container");
  const header = container.querySelector("header");
  container.insertBefore(messageDiv, header.nextSibling);

  setTimeout(() => {
    messageDiv.remove();
  }, CONFIG.MESSAGE_DURATION);
}

function showLoading(button) {
  const originalText = button.textContent;
  button.textContent = "Chargement...";
  button.disabled = true;

  return () => {
    button.textContent = originalText;
    button.disabled = false;
  };
}

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

function saveSession(user, token) {
  localStorage.setItem(CONFIG.CACHE_KEYS.USER, user);
  localStorage.setItem(CONFIG.CACHE_KEYS.TOKEN, token);
}

function restoreSession() {
  const savedUser = localStorage.getItem(CONFIG.CACHE_KEYS.USER);
  const savedToken = localStorage.getItem(CONFIG.CACHE_KEYS.TOKEN);

  return { user: savedUser, token: savedToken };
}

function clearSession() {
  localStorage.removeItem(CONFIG.CACHE_KEYS.USER);
  localStorage.removeItem(CONFIG.CACHE_KEYS.TOKEN);
}
