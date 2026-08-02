// hooks/useLiveEvents.js
import { useState, useEffect, useRef, useCallback } from "react";
import { betikaApi } from "../services/betikaApi";
import { normalizeMatches } from "../utils/matchUtils";

export const useLiveEvents = (params = {}, pollInterval = 15000) => {
  const { sort = 1, sport = "null", subTypeId = "1,186,340" } = params;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef();

  const fetchLiveEvents = useCallback(async () => {
    try {
      setError(null);
      const data = await betikaApi.getLiveMatches({ sort, sport, sub_type_id: subTypeId });
      setMatches(normalizeMatches(data?.data || []));
    } catch (e) {
      setError(e.message || "Failed to load live matches");
    } finally {
      setLoading(false);
    }
  }, [sort, sport, subTypeId]);

  useEffect(() => {
    fetchLiveEvents();
  }, [fetchLiveEvents]);

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;
    intervalRef.current = setInterval(fetchLiveEvents, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [pollInterval, fetchLiveEvents]);

  return { matches, loading, error, refetch: fetchLiveEvents };
};

export default useLiveEvents;
