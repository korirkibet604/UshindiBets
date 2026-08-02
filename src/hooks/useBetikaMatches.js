import { useState, useEffect, useRef, useCallback } from "react";
import { betikaApi } from "../services/betikaApi";

export const useBetikaMatches = (options = {}) => {
  const { sportId, competitionId, category, team, date, pollInterval = 0, auto = true } = options;
  const [matches, setMatches] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef();

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const params = {};
      if (sportId) params.sport_id = sportId;
      if (competitionId) params.competition_id = competitionId;
      if (category) params.category = category;
      if (team) params.team = team;
      if (date) params.date = date;
      const data = await betikaApi.getMatches(params);
      setMatches(data?.data || []);
      setTags(data?.meta?.tags || []);
      setLastUpdate(data?.timestamp || new Date().toISOString());
    } catch (e) {
      setError(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [sportId, competitionId, category, team, date]);

  useEffect(() => {
    if (auto) fetchMatches();
  }, [fetchMatches, auto]);

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;
    intervalRef.current = setInterval(fetchMatches, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [pollInterval, fetchMatches]);

  return { matches, tags, loading, error, lastUpdate, refetch: fetchMatches };
};

export default useBetikaMatches;
