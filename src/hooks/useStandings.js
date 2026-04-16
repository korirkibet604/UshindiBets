// hooks/useStandings.js
import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const useStandings = (tournamentId, seasonId) => {
  const { getTournamentStandings, loading, error } = useBetikaApi();
  const [standings, setStandings] = useState(null);
  const [standingsError, setStandingsError] = useState(null);

  const fetchStandings = async () => {
    if (!tournamentId || !seasonId) return;

    try {
      const standingsData = await getTournamentStandings(tournamentId, seasonId);
      setStandings(standingsData);
      setStandingsError(null);
    } catch (err) {
      setStandingsError(err.message);
      setStandings(null);
    }
  };

  useEffect(() => {
    if (tournamentId && seasonId) {
      fetchStandings();
    }
  }, [tournamentId, seasonId]);

  return {
    standings,
    loading,
    error: standingsError || error,
    refetch: fetchStandings
  };
};