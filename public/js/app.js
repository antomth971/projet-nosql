// Application principale - Orchestration des modules

class TravelHubApp {
  constructor() {
    this.authManager = null;
    this.offersManager = null;
    this.recommendationsManager = null;
  }

  async init() {
    // Attendre que le DOM soit prêt
    if (document.readyState === "loading") {
      await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve));
    }

    // Initialiser tous les modules
    this.authManager = new AuthManager();
    this.offersManager = new OffersManager();
    this.recommendationsManager = new RecommendationsManager();

    // Restaurer la session si possible
    this.authManager.restoreSession();

    // Sauvegarder la session avant fermeture
    this.setupSessionPersistence();

    console.log("TravelHub App initialisée");
  }

  setupSessionPersistence() {
    window.addEventListener("beforeunload", () => {
      if (this.authManager.isAuthenticated()) {
        saveSession(this.authManager.currentUser, this.authManager.authToken);
      } else {
        clearSession();
      }
    });
  }
}

// Exposer les fonctions globales nécessaires
window.viewOfferDetails = function (offerId) {
  if (window.app && window.app.offersManager) {
    window.app.offersManager.viewOfferDetails(offerId);
  }
};

// Initialisation de l'application
window.app = new TravelHubApp();
window.app.init();
