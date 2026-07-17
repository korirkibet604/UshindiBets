import axios from "axios";

const API_BASE = import.meta.env.VITE_BETIKA_API_URL || "https://betika-api-production.up.railway.app";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error("Betika API error:", err?.message);
    return Promise.reject(err);
  }
);

export const betikaApi = {
  health: () => apiClient.get("/api/health").then((r) => r.data),

  getMatches: (params = {}) =>
    apiClient.get("/api/matches", { params }).then((r) => r.data),

  getMatchById: (matchId) =>
    apiClient.get(`/api/match/${matchId}`).then((r) => r.data),

  getLeagues: () => apiClient.get("/api/leagues").then((r) => r.data),

  getLeagueMatches: (league, params = {}) =>
    apiClient.get(`/api/leagues/${encodeURIComponent(league)}`, { params }).then((r) => r.data),

  getCompetitions: () => apiClient.get("/api/competitions").then((r) => r.data),

  search: (q, params = {}) =>
    apiClient.get("/api/search", { params: { q, ...params } }).then((r) => r.data),

  getStats: () => apiClient.get("/api/stats").then((r) => r.data),

  refresh: () => apiClient.get("/api/refresh").then((r) => r.data),

  getJackpot: () => apiClient.get("/api/jackpot").then((r) => r.data),
  getMidweekJackpot: () => apiClient.get("/api/jackpot/midweek").then((r) => r.data),
  getAllJackpots: () => apiClient.get("/api/jackpot/all").then((r) => r.data),
  refreshJackpot: (type) => apiClient.get(`/api/jackpot/refresh/${type}`).then((r) => r.data),
};

export default betikaApi;
