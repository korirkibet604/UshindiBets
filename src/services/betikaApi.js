import axios from "axios";

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

  // GET /api/matches?page=&limit=&sport_id=&sub_type_id=&sort_id=&period_id=&tab=&esports=
  // sort_id: 1=highlights, 2=start_time, 3=top_leagues
  // period_id: -2=next 48h, -1=today, 1=tomorrow, 2=day after tomorrow, etc.
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

  // LIVE matches — routed directly to live.betika.com via proxy /live/*
  // Example: https://live.betika.com/v1/uo/matches?page=1&limit=1000&sub_type_id=1,186,340&sport=null&sort=1
  getLiveMatches: (params = {}) => {
    const {
      page = 1,
      limit = 1000,
      sub_type_id = "1,186,340",
      sort = 1,
      sport = "null",
    } = params;
    return apiClient
      .get("/live/uo/matches", {
        params: { page, limit, sub_type_id, sport, sort },
      })
      .then((r) => r.data);
  },

  // LIVE match detail — https://live.betika.com/v1/uo/match?id=<matchId>
  getLiveMatch: (matchId) =>
    apiClient.get("/live/uo/match", { params: { id: matchId } }).then((r) => r.data),
};

export default betikaApi;
