// hooks/useMatchData.js
import { useState, useEffect, useRef } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const useMatchData = (matchId, pollInterval = 10000) => {
  const {
    getMatchById,
    getMatchStatistics,
    getMatchIncidents,
    getMatchLineups,
    getHeadToHead,
    loading,
    error
  } = useBetikaApi();

  const [matchData, setMatchData] = useState({
    detail: null,
    statistics: null,
    incidents: null,
    lineups: null,
    h2h: null
  });

  const intervalRef = useRef();

  const fetchMatchData = async () => {
    if (!matchId) return;

    try {
      const [detail, statistics, incidents, lineups, h2h] = await Promise.all([
        getMatchById(matchId),
        getMatchStatistics(matchId),
        getMatchIncidents(matchId),
        getMatchLineups(matchId),
        getHeadToHead(matchId)
      ]);

      setMatchData({
        detail,
        statistics,
        incidents,
        lineups,
        h2h
      });
    } catch (err) {
      console.error('Error fetching match data:', err);
    }
  };

  // Start polling
  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchMatchData();
    }, pollInterval);
  };

  // Stop polling
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (matchId) {
      fetchMatchData(); // Initial fetch
      startPolling(); // Start polling
    }

    return () => {
      stopPolling(); // Cleanup on unmount or matchId change
    };
  }, [matchId]);

  return {
    ...matchData,
    loading,
    error,
    refetch: fetchMatchData,
    startPolling,
    stopPolling
  };
};