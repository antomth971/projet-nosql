// Configuration de l'API
const API_BASE_URL = "http://localhost:3000";

// Configuration de l'application
const CONFIG = {
  SESSION_DURATION: 900, // 15 minutes
  MESSAGE_DURATION: 5000, // 5 secondes
  CACHE_KEYS: {
    USER: "currentUser",
    TOKEN: "authToken",
  },
};

// Villes disponibles
const CITIES = [
  { code: "PAR", name: "Paris" },
  { code: "NYC", name: "New York" },
  { code: "LON", name: "Londres" },
  { code: "TYO", name: "Tokyo" },
  { code: "SFO", name: "San Francisco" },
  { code: "BER", name: "Berlin" },
];
