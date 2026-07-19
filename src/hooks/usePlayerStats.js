import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const usePlayerStats = (playerId, tournamentId, seasonId) => {
  const { getPlayerTournamentStats, loading, error } = useBetikaApi();
  const [playerStats, setPlayerStats] = useState(null);

  const fetchPlayerStats = async () => {
    if (!playerId || !tournamentId || !seasonId) return;

    try {
      const statsData = await getPlayerTournamentStats(playerId, tournamentId, seasonId);
      setPlayerStats(statsData);
    } catch (err) {
      console.error('Error fetching player stats:', err);
    }
  };

  useEffect(() => {
    fetchPlayerStats();
  }, [playerId, tournamentId, seasonId]);

  return {
    playerStats,
    loading,
    error,
    refetch: fetchPlayerStats
  };
};