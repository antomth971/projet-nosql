class TravelHubApp {
  constructor() {
    this.authManager = null;
    this.offersManager = null;
    this.recommendationsManager = null;
  }

  async init() {
    if (document.readyState === "loading") {
      await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve));
    }

    this.authManager = new AuthManager();
    this.offersManager = new OffersManager();
    this.recommendationsManager = new RecommendationsManager();

    this.authManager.restoreSession();

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

window.viewOfferDetails = function (offerId) {
  if (window.app && window.app.offersManager) {
    window.app.offersManager.viewOfferDetails(offerId);
  }
};

window.app = new TravelHubApp();
window.app.init();
