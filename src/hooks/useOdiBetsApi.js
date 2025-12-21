// hooks/useOdiBetsApi.js
import { useState, useCallback } from "react";
import odibetsApi from "../services/odibetsApi";

export const useOdiBetsApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (apiCall, ...params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(...params);
      // OdiBets API returns data in response.data
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      console.error("OdiBets API Error:", errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError: () => setError(null),

    // ===== MATCH ENDPOINTS =====

    // Get specific match details
    getMatchDetails: (matchId, categoryId = "", subTypeId = "", builder = 0) =>
      makeRequest(
        odibetsApi.getMatchDetails,
        matchId,
        categoryId,
        subTypeId,
        builder
      ),

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
      makeRequest(
        odibetsApi.getLiveMatches,
        sportId,
        tab,
        sortBy,
        competitionId,
        hour,
        cs,
        hs
      ),

    // Get scheduled matches
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
      makeRequest(
        odibetsApi.getScheduledMatches,
        sportId,
        day,
        countryId,
        sortBy,
        competitionId,
        hour,
        filter,
        cs,
        hs
      ),

    // Get all sports events
    getAllSportsEvents: (
      producer = 0,
      day = "",
      sportId = "",
      platform = "mobile",
      mode = 1
    ) =>
      makeRequest(
        odibetsApi.getAllSportsEvents,
        producer,
        day,
        sportId,
        platform,
        mode
      ),

    // Get trending matches
    getTrendingMatches: (live = 0, src = "", countryId = "") =>
      makeRequest(odibetsApi.getTrendingMatches, live, src, countryId),

    // ===== CASINO ENDPOINTS =====

    getFeaturedCasinoGames: (bandId = "", mode = 1, platform = "mobile") =>
      makeRequest(odibetsApi.getFeaturedCasinoGames, bandId, mode, platform),

    // ===== HELPER METHODS =====

    formatDate: odibetsApi.formatDate,

    getTodayMatches: (sportId = "soccer") =>
      makeRequest(odibetsApi.getTodayMatches, sportId),

    getTomorrowMatches: (sportId = "soccer") =>
      makeRequest(odibetsApi.getTomorrowMatches, sportId),

    getMatchesByCompetition: (competitionId, sportId = "soccer") =>
      makeRequest(odibetsApi.getMatchesByCompetition, competitionId, sportId),

    getLiveFootballMatches: () =>
      makeRequest(odibetsApi.getLiveFootballMatches),

    getMatchById: (matchId) => makeRequest(odibetsApi.getMatchById, matchId),

    // Sports constants
    SPORTS: odibetsApi.SPORTS,
  };
};
