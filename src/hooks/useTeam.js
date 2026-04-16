// hooks/useTeam.js
import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const useTeam = (teamId) => {
  const {
    getTeamDetails,
    getTeamPlayers,
    getTeamPerformance,
    getTeamLastNext,
    loading,
    error
  } = useBetikaApi();

  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);

  const fetchTeamData = async () => {
    if (!teamId) return;

    try {
      // Fetch team details
      const teamData = await getTeamDetails(teamId);
      setTeam(teamData?.team || null);

      // Fetch team players
      const playersData = await getTeamPlayers(teamId);
      setPlayers(playersData?.players || []);

      // Fetch team performance
      const performanceData = await getTeamPerformance(teamId);
      setPerformance(performanceData);

      // Fetch last/next matches
      const lastNextData = await getTeamLastNext(teamId);
      if (lastNextData) {
        setRecentMatches(lastNextData?.lastEvents || []);
        setUpcomingMatches(lastNextData?.nextEvents || []);
      }

    } catch (err) {
      console.error('Error fetching team data:', err);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  return {
    team,
    players,
    performance,
    upcomingMatches,
    recentMatches,
    loading,
    error,
    refetch: fetchTeamData
  };
};