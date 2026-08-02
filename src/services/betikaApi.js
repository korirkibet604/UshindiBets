import axios from "axios";

// Route through the Supabase edge function proxy to avoid CORS issues with the
// Railway-hosted betika-api (which does not send CORS headers).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/betika-proxy`;

const apiClient = axios.create({
  baseURL: PROXY_BASE,
  timeout: 25000,
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

  // GET /api/matches?limit=&sport_id=&competition_id=&category=&team=&date=
  getMatches: (params = {}) =>
    apiClient.get("/api/matches", { params }).then((r) => r.data),

  // GET /api/matches/:id  -> single match with full odds[] markets
  getMatchById: (matchId) =>
    apiClient.get(`/api/matches/${matchId}`).then((r) => r.data),

  // GET /api/matches/sport/:sportId
  getMatchesBySport: (sportId, params = {}) =>
    apiClient.get(`/api/matches/sport/${sportId}`, { params }).then((r) => r.data),

  // GET /api/sports  -> all sports with categories/competitions
  getSports: () => apiClient.get("/api/sports").then((r) => r.data),

  // GET /api/sport/:sportId
  getSport: (sportId) => apiClient.get(`/api/sport/${sportId}`).then((r) => r.data),

  // GET /api/jackpot
  getJackpot: () => apiClient.get("/api/jackpot").then((r) => r.data),
  getPreviousJackpots: () => apiClient.get("/api/jackpot/previous").then((r) => r.data),
  getBoosted: () => apiClient.get("/api/jackpot/boosted").then((r) => r.data),

  refresh: () => apiClient.get("/api/refresh").then((r) => r.data),
};

export default betikaApi;
