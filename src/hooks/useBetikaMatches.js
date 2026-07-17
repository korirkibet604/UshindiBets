import { useState, useEffect, useRef, useCallback } from "react";
import { betikaApi } from "../services/betikaApi";

export const useBetikaMatches = (options = {}) => {
  const { limit = 100, league, competition, team, date, sort, pollInterval = 0, auto = true } = options;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef();

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const params = { limit };
      if (league) params.league = league;
      if (competition) params.competition = competition;
      if (team) params.team = team;
      if (date) params.date = date;
      if (sort) params.sort = sort;
      const data = await betikaApi.getMatches(params);
      setMatches(data?.matches || []);
      setLastUpdate(data?.lastUpdate || new Date().toISOString());
    } catch (e) {
      setError(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [limit, league, competition, team, date, sort]);

  useEffect(() => {
    if (auto) fetchMatches();
  }, [fetchMatches, auto]);

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;
    intervalRef.current = setInterval(fetchMatches, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [pollInterval, fetchMatches]);

  return { matches, loading, error, lastUpdate, refetch: fetchMatches };
};

export default useBetikaMatches;
