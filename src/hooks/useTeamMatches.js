// hooks/useTeamMatches.js
import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const useTeamMatches = (teamId, limit = 10) => {
  const { getTeamLastNext, loading, error } = useBetikaApi();
  const [matches, setMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  const fetchTeamMatches = async () => {
    if (!teamId) return;

    try {
      const matchesData = await getTeamLastNext(teamId);
      if (matchesData) {
        const recent = matchesData.lastEvents || [];
        const upcoming = matchesData.nextEvents || [];

        setMatches(recent.slice(0, limit));
        setUpcomingMatches(upcoming.slice(0, limit));
      }
    } catch (err) {
      console.error('Error fetching team matches:', err);
    }
  };

  useEffect(() => {
    fetchTeamMatches();
  }, [teamId, limit]);

  return {
    matches,
    upcomingMatches,
    loading,
    error,
    refetch: fetchTeamMatches
  };
};