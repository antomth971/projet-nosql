class RecommendationsManager {
  constructor() {
    this.initElements();
    this.attachEvents();
  }

  initElements() {
    this.getRecommendationsBtn = document.getElementById("get-recommendations");
    this.recommendationsList = document.getElementById("recommendations-list");
  }

  attachEvents() {
    this.getRecommendationsBtn.addEventListener("click", () => this.handleGetRecommendations());
  }

  async handleGetRecommendations() {
    const from = document.getElementById("from").value;

    if (!from) {
      showMessage("Veuillez d'abord sélectionner une ville de départ", "error");
      return;
    }

    const hideLoading = showLoading(this.getRecommendationsBtn);

    try {
      const recommendations = await apiRequest(`/reco?city=${from}&k=3`);
      this.displayRecommendations(recommendations);

      if (recommendations.length === 0) {
        showMessage("Aucune recommandation disponible pour cette ville", "info");
      }
    } catch (error) {
      showMessage(`Erreur lors du chargement des recommandations: ${error.message}`, "error");
      this.recommendationsList.innerHTML = "";
    } finally {
      hideLoading();
    }
  }

  displayRecommendations(recommendations) {
    if (recommendations.length === 0) {
      this.recommendationsList.innerHTML = "<p>Aucune recommandation disponible.</p>";
      return;
    }

    this.recommendationsList.innerHTML = "";
    this.recommendationsList.className = "recommendations-list";

    recommendations.forEach((rec) => {
      const card = document.createElement("div");
      card.className = "recommendation-card";
      card.innerHTML = `
        <div class="city">${rec.city}</div>
        <div class="score">Score: ${(rec.score * 100).toFixed(0)}%</div>
      `;

      card.addEventListener("click", () => {
        document.getElementById("to").value = rec.city;
        showMessage(`Destination "${rec.city}" sélectionnée`, "success");
      });

      this.recommendationsList.appendChild(card);
    });
  }
}
