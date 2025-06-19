// Module d'authentification

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
    this.initElements();
    this.attachEvents();
  }

  initElements() {
    this.loginSection = document.getElementById("login-section");
    this.mainContent = document.getElementById("main-content");
    this.userInfo = document.getElementById("user-info");
    this.currentUserSpan = document.getElementById("current-user");
    this.loginForm = document.getElementById("login-form");
    this.logoutBtn = document.getElementById("logout-btn");
  }

  attachEvents() {
    this.loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    this.logoutBtn.addEventListener("click", () => this.handleLogout());
  }

  async handleLogin(e) {
    e.preventDefault();

    const userId = document.getElementById("userId").value.trim();
    if (!userId) {
      showMessage("Veuillez saisir un nom d'utilisateur", "error");
      return;
    }

    const hideLoading = showLoading(e.target.querySelector("button"));

    try {
      const response = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });

      this.setUser(userId, response.token);
      this.showMainContent();

      const minutesLeft = Math.floor(response.expires_in / 60);
      showMessage(`Bienvenue ${userId} ! Session valide pendant ${minutesLeft} minutes.`, "success");
    } catch (error) {
      showMessage(`Erreur de connexion: ${error.message}`, "error");
    } finally {
      hideLoading();
    }
  }

  handleLogout() {
    this.clearUser();
    this.showLoginForm();

    // Vider les résultats
    const offersList = document.getElementById("offers-list");
    const recommendationsList = document.getElementById("recommendations-list");
    if (offersList) offersList.innerHTML = "";
    if (recommendationsList) recommendationsList.innerHTML = "";

    showMessage("Déconnexion réussie", "info");
  }

  setUser(user, token) {
    this.currentUser = user;
    this.authToken = token;
    window.authToken = token; // Pour les utilitaires
    this.currentUserSpan.textContent = user;
    saveSession(user, token);
  }

  clearUser() {
    this.currentUser = null;
    this.authToken = null;
    window.authToken = null;
    clearSession();
  }

  showMainContent() {
    this.loginSection.classList.add("hidden");
    this.mainContent.classList.remove("hidden");
    this.userInfo.classList.remove("hidden");
  }

  showLoginForm() {
    this.loginSection.classList.remove("hidden");
    this.mainContent.classList.add("hidden");
    this.userInfo.classList.add("hidden");
    this.loginForm.reset();
  }

  restoreSession() {
    const { user, token } = restoreSession();

    if (user && token) {
      this.setUser(user, token);
      this.showMainContent();
      showMessage("Session restaurée", "info");
      return true;
    }
    return false;
  }

  isAuthenticated() {
    return this.currentUser && this.authToken;
  }
}
