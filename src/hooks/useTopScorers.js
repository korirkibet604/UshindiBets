// hooks/useTopScorers.js
import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const useTopScorers = (tournamentId, seasonId) => {
  const { getTournamentTopPlayers, getTournamentStatistics, loading, error } = useBetikaApi();
  const [topScorers, setTopScorers] = useState([]);
  const [topAssists, setTopAssists] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);

  const fetchTopPlayers = async () => {
    if (!tournamentId || !seasonId) return;

    try {
      // Fetch top players (includes scorers and assisters)
      const topPlayersData = await getTournamentTopPlayers(tournamentId, seasonId);
      const players = topPlayersData?.topPlayers || [];

      // Extract top scorers (assuming the API returns players with goals)
      const scorers = players
        .filter(player => player.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 20);

      setTopScorers(scorers);

      // Extract top assists (assuming the API returns players with assists)
      const assisters = players
        .filter(player => player.assists > 0)
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 20);

      setTopAssists(assisters);

    } catch (err) {
      console.error('Error fetching top players:', err);

      // Fallback: Try to get statistics and extract player data
      try {
        const statsData = await getTournamentStatistics(tournamentId, seasonId);
        // Process statistics to extract top scorers if available
        if (statsData?.players) {
          const scorersFromStats = statsData.players
            .filter(player => player.statistics?.goals > 0)
            .sort((a, b) => b.statistics.goals - a.statistics.goals)
            .slice(0, 20);

          setTopScorers(scorersFromStats);
        }
      } catch (statsErr) {
        console.error('Error fetching statistics for top scorers:', statsErr);
      }
    }
  };

  const fetchPlayerDetailedStats = async (playerId) => {
    if (!playerId || !tournamentId || !seasonId) return;

    try {
      // This would use getPlayerTournamentStats if available
      // For now, we'll just return basic info
      return topScorers.find(player => player.id === playerId);
    } catch (err) {
      console.error('Error fetching player detailed stats:', err);
    }
  };

  useEffect(() => {
    fetchTopPlayers();
  }, [tournamentId, seasonId]);

  return {
    topScorers,
    topAssists,
    loading,
    error,
    refetch: fetchTopPlayers,
    fetchPlayerDetailedStats
  };
};