// hooks/useTournament.js
import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const useTournament = (tournamentId) => {
  const {
    getTournamentSeasons,
    getTournamentEvents,
    getTournamentStatistics,
    loading,
    error
  } = useBetikaApi();

  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [events, setEvents] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const fetchTournamentData = async () => {
    if (!tournamentId) return;

    try {
      // Fetch seasons
      const seasonsData = await getTournamentSeasons(tournamentId);
      const seasonsList = seasonsData?.seasons || [];
      setSeasons(seasonsList);

      // Set current season (latest one)
      if (seasonsList.length > 0) {
        const latestSeason = seasonsList[seasonsList.length - 1];
        setCurrentSeason(latestSeason);

        // Fetch events for current season
        const eventsData = await getTournamentEvents(tournamentId, latestSeason.id);
        setEvents(eventsData?.events || []);
      }

    } catch (err) {
      console.error('Error fetching tournament data:', err);
    }
  };

  const fetchTournamentStatistics = async (seasonId) => {
    if (!tournamentId || !seasonId) return;

    try {
      const statsData = await getTournamentStatistics(tournamentId, seasonId);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error fetching tournament statistics:', err);
    }
  };

  const changeSeason = async (seasonId) => {
    const selectedSeason = seasons.find(season => season.id === seasonId);
    if (selectedSeason) {
      setCurrentSeason(selectedSeason);

      // Fetch events for the new season
      try {
        const eventsData = await getTournamentEvents(tournamentId, seasonId);
        setEvents(eventsData?.events || []);

        // Fetch statistics for the new season
        await fetchTournamentStatistics(seasonId);
      } catch (err) {
        console.error('Error fetching season data:', err);
      }
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  // Fetch statistics when current season changes
  useEffect(() => {
    if (currentSeason) {
      fetchTournamentStatistics(currentSeason.id);
    }
  }, [currentSeason]);

  return {
    seasons,
    currentSeason,
    events,
    statistics,
    loading,
    error,
    refetch: fetchTournamentData,
    changeSeason,
    fetchTournamentStatistics
  };
};