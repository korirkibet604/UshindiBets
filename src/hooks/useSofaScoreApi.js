// hooks/useSofaScoreApi.js
import { useState, useCallback } from "react";
import { sofascoreApi } from "../services/sofascoreApi";

export const useSofaScoreApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (apiCall, ...params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(...params);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError: () => setError(null),

    //betika endpoints
    getBetikaSports: () => makeRequest(sofascoreApi.getSports),

    getBetikaAllGames: () => makeRequest(sofascoreApi.getAllGames),

    // Match endpoints
    getScheduledEvents: (sport = "football", date) =>
      makeRequest(sofascoreApi.getScheduledEvents, sport, date),

    getLiveEvents: (sport = "football") =>
      makeRequest(sofascoreApi.getLiveEvents, sport),

    getMatchById: (matchId) => makeRequest(sofascoreApi.getMatchById, matchId),

    getMatchStatistics: (matchId) =>
      makeRequest(sofascoreApi.getMatchStatistics, matchId),

    getMatchIncidents: (matchId) =>
      makeRequest(sofascoreApi.getMatchIncidents, matchId),

    getHeadToHead: (matchId) =>
      makeRequest(sofascoreApi.getHeadToHead, matchId),

    getMatchLineups: (matchId) =>
      makeRequest(sofascoreApi.getMatchLineups, matchId),

    getMatchOdds: (matchId) => makeRequest(sofascoreApi.getMatchOdds, matchId),

    getMatchDetails: (matchId) =>
      makeRequest(sofascoreApi.getMatchDetails, matchId),

    getMatchPlayerStats: (matchId) =>
      makeRequest(sofascoreApi.getMatchPlayerStats, matchId),

    getPregameForm: (matchId) =>
      makeRequest(sofascoreApi.getPregameForm, matchId),

    // Player endpoints
    getPlayerDetails: (playerId) =>
      makeRequest(sofascoreApi.getPlayerDetails, playerId),

    getPlayerTransferHistory: (playerId) =>
      makeRequest(sofascoreApi.getPlayerTransferHistory, playerId),

    // Team endpoints
    getTeamPerformance: (teamId) =>
      makeRequest(sofascoreApi.getTeamPerformance, teamId),

    getTeamPlayers: (teamId) =>
      makeRequest(sofascoreApi.getTeamPlayers, teamId),

    getTeamDetails: (teamId) =>
      makeRequest(sofascoreApi.getTeamDetails, teamId),

    getTeamLastNext: (teamId) =>
      makeRequest(sofascoreApi.getTeamLastNext, teamId),

    // Tournament endpoints
    getTournamentStandings: (tournamentId, seasonId) =>
      makeRequest(sofascoreApi.getTournamentStandings, tournamentId, seasonId),

    getTournamentEvents: (tournamentId, seasonId) =>
      makeRequest(sofascoreApi.getTournamentEvents, tournamentId, seasonId),

    getTournamentTopPlayers: (tournamentId, seasonId) =>
      makeRequest(sofascoreApi.getTournamentTopPlayers, tournamentId, seasonId),
  };
};
