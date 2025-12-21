// services/odibetsApi.js
import axios from "axios";

// OdiBets API Base URL
const BASE_URL = "https://api.odi.site";
const PXY_BASE_URL = "https://www.odibets.com/pxy";

// Create axios instance with OdiBets configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
    Referer: "https://www.odibets.com/",
    Origin: "https://www.odibets.com",
  },
  params: {
    sportsbook: "sportsbook",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
  },
});

// PXY API client for specific endpoints
const pxyApiClient = axios.create({
  baseURL: PXY_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log("Making OdiBets API request to:", config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Check if response has data
    if (response.data && response.data.success !== undefined) {
      if (!response.data.success) {
        console.warn(
          "OdiBets API returned unsuccessful:",
          response.data.message
        );
      }
    }
    return response;
  },
  (error) => {
    console.error("OdiBets API Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Sports constants
const SPORTS = {
  FOOTBALL: "soccer",
  BASKETBALL: "basketball",
  TENNIS: "tennis",
  RUGBY: "rugby",
  HANDBALL: "handball",
  VOLLEYBALL: "volleyball",
  BOXING: "boxing",
  MMA: "mma",
  TABLE_TENNIS: "table-tennis",
  AMERICAN_FOOTBALL: "american-football",
  BASEBALL: "baseball",
};

// OdiBets API service methods
export const odibetsApi = {
  // ===== MATCH ENDPOINTS =====

  // Get specific match/event details
  getMatchDetails: (matchId, categoryId = "", subTypeId = "", builder = 0) =>
    apiClient.get("/sportsbook/v1", {
      params: {
        id: matchId,
        category_id: categoryId,
        sub_type_id: subTypeId,
        builder: builder,
        resource: "sportevent",
      },
    }),

  // Get live matches
  getLiveMatches: (
    sportId = "",
    tab = "",
    sortBy = "",
    competitionId = "",
    hour = "",
    cs = "",
    hs = ""
  ) =>
    apiClient.get("/sportsbook/v1", {
      params: {
        tab: tab,
        sport_id: sportId,
        sort_by: sortBy,
        sub_type_id: "",
        competition_id: competitionId,
        hour: hour,
        cs: cs,
        hs: hs,
        resource: "live",
      },
    }),

  // Get scheduled matches by sport and date
  getScheduledMatches: (
    sportId = "soccer",
    day = "",
    countryId = "",
    sortBy = "",
    competitionId = "",
    hour = "",
    filter = "",
    cs = "",
    hs = ""
  ) =>
    apiClient.get("/sportsbook/v1", {
      params: {
        sport_id: sportId,
        day: day, // Format: "2024-01-01"
        country_id: countryId,
        sort_by: sortBy,
        sub_type_id: "",
        competition_id: competitionId,
        hour: hour,
        filter: filter,
        cs: cs,
        hs: hs,
        resource: "sport",
      },
    }),

  // Get sports events (all sports)
  getAllSportsEvents: (
    producer = 0,
    day = "",
    sportId = "",
    platform = "mobile",
    mode = 1
  ) =>
    apiClient.get("/odi/sportsbook", {
      params: {
        producer: producer,
        day: day,
        sport_id: sportId,
        resource: "sportevents",
        platform: platform,
        mode: mode,
      },
    }),

  // Get trending matches
  getTrendingMatches: (live = 0, src = "", countryId = "") =>
    pxyApiClient.get("/sportsbook", {
      params: {
        live: live,
        src: src,
        country_id: countryId,
        sportsbook: "sportsbook",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
        resource: "trending",
      },
    }),

  // ===== CASINO ENDPOINTS =====

  // Get featured casino games
  getFeaturedCasinoGames: (bandId = "", mode = 1, platform = "mobile") =>
    apiClient.get("/odi/casino", {
      params: {
        band_id: bandId,
        resource: "games_featured",
        mode: mode,
        platform: platform,
      },
    }),

  // ===== HELPER METHODS =====

  // Format date for API (YYYY-MM-DD)
  formatDate: (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // Get today's matches for a sport
  getTodayMatches: (sportId = "soccer") =>
    odibetsApi.getScheduledMatches(sportId, odibetsApi.formatDate()),

  // Get tomorrow's matches for a sport
  getTomorrowMatches: (sportId = "soccer") => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return odibetsApi.getScheduledMatches(
      sportId,
      odibetsApi.formatDate(tomorrow)
    );
  },

  // Get matches by competition/tournament
  getMatchesByCompetition: (competitionId, sportId = "soccer") =>
    odibetsApi.getScheduledMatches(sportId, "", "", "", competitionId),

  // Get live football matches
  getLiveFootballMatches: () => odibetsApi.getLiveMatches("soccer"),

  // Get match odds and details by ID
  getMatchById: (matchId) => odibetsApi.getMatchDetails(matchId),

  // Sports enum for easier access
  SPORTS: SPORTS,
};

export default odibetsApi;
