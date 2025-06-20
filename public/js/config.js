const API_BASE_URL = "http://localhost:3000";

const CONFIG = {
  SESSION_DURATION: 900,
  MESSAGE_DURATION: 5000,
  CACHE_KEYS: {
    USER: "currentUser",
    TOKEN: "authToken",
  },
};

const CITIES = [
  { code: "PAR", name: "Paris" },
  { code: "NYC", name: "New York" },
  { code: "LON", name: "Londres" },
  { code: "TYO", name: "Tokyo" },
  { code: "SFO", name: "San Francisco" },
  { code: "BER", name: "Berlin" },
];
