// Module de gestion des offres

class OffersManager {
  constructor() {
    this.initElements();
    this.attachEvents();
  }

  initElements() {
    this.searchForm = document.getElementById("search-form");
    this.offersList = document.getElementById("offers-list");
  }

  attachEvents() {
    this.searchForm.addEventListener("submit", (e) => this.handleSearch(e));
  }

  async handleSearch(e) {
    e.preventDefault();

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const limit = document.getElementById("limit").value;

    if (!from || !to) {
      showMessage("Veuillez sélectionner une ville de départ et d'arrivée", "error");
      return;
    }

    if (from === to) {
      showMessage("La ville de départ et d'arrivée doivent être différentes", "error");
      return;
    }

    const hideLoading = showLoading(e.target.querySelector("button"));

    try {
      const offers = await apiRequest(`/offers?from=${from}&to=${to}&limit=${limit}`);
      this.displayOffers(offers, from, to);

      if (offers.length === 0) {
        showMessage(`Aucun vol trouvé de ${from} vers ${to}`, "info");
      } else {
        showMessage(`${offers.length} vol(s) trouvé(s) de ${from} vers ${to}`, "success");
      }
    } catch (error) {
      showMessage(`Erreur lors de la recherche: ${error.message}`, "error");
      this.offersList.innerHTML = "";
    } finally {
      hideLoading();
    }
  }

  displayOffers(offers, from, to) {
    if (offers.length === 0) {
      this.offersList.innerHTML = "<p>Aucun vol trouvé pour cette recherche.</p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "offers-table";

    table.innerHTML = `
      <thead>
        <tr>
          <th>Départ</th>
          <th>Arrivée</th>
          <th>Prix</th>
          <th>Compagnie</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${offers
          .map(
            (offer) => `
              <tr>
                <td>${offer.from}</td>
                <td>${offer.to}</td>
                <td class="price">${offer.price} ${offer.currency}</td>
                <td class="provider">${offer.provider}</td>
                <td>
                  <button onclick="viewOfferDetails('${offer._id}')">
                    Détails
                  </button>
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    `;

    this.offersList.innerHTML = "";
    this.offersList.appendChild(table);
  }

  async viewOfferDetails(offerId) {
    try {
      const offer = await apiRequest(`/offers/${offerId}`);

      // Supprimer les anciens détails s'ils existent
      const existingDetails = document.getElementById("offer-details");
      if (existingDetails) {
        existingDetails.remove();
      }

      let detailsHtml = `
        <div id="offer-details" class="message info" style="margin-top: 20px;">
          <h4>Détails du vol</h4>
          <p><strong>ID:</strong> ${offer._id}</p>
          <p><strong>De:</strong> ${offer.from} <strong>Vers:</strong> ${offer.to}</p>
          <p><strong>Prix:</strong> ${offer.price} ${offer.currency}</p>
          <p><strong>Compagnie:</strong> ${offer.provider}</p>
      `;

      if (offer.legs && offer.legs.length > 0) {
        detailsHtml += `<p><strong>Vols:</strong> ${offer.legs.length} segment(s)</p>`;
      }

      if (offer.hotel) {
        detailsHtml += `<p><strong>Hôtel:</strong> ${offer.hotel.name} (${offer.hotel.nights} nuits)</p>`;
      }

      if (offer.activity) {
        detailsHtml += `<p><strong>Activité:</strong> ${offer.activity.title}</p>`;
      }

      if (offer.relatedOffers && offer.relatedOffers.length > 0) {
        detailsHtml += `<p><strong>Offres similaires:</strong> ${offer.relatedOffers.length} disponible(s)</p>`;
      }

      detailsHtml += `
          <button onclick="document.getElementById('offer-details').remove()" style="margin-top: 10px; background-color: #dc3545;">
            Fermer
          </button>
        </div>`;

      // Insérer dans la colonne de résultats
      const resultsColumn = document.querySelector(".results-column");
      const resultsSection = resultsColumn.querySelector(".section");
      resultsSection.insertAdjacentHTML("beforeend", detailsHtml);

      // Faire défiler vers les détails
      document.getElementById("offer-details").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showMessage(`Erreur lors du chargement des détails: ${error.message}`, "error");
    }
  }
}
