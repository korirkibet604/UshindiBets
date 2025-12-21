// hooks/useLiveEvents.js
import { useState, useEffect, useRef } from "react";
import { useSofaScoreApi } from "./useSofaScoreApi";

export const useLiveEvents = (sport = "football", pollInterval = 15000) => {
  const { getLiveEvents, loading, error } = useSofaScoreApi();
  const [events, setEvents] = useState(null);
  const intervalRef = useRef();

  const fetchLiveEvents = async () => {
    try {
      const liveEvents = await getLiveEvents(sport);
      setEvents(liveEvents?.data || []);
    } catch (err) {
      console.error("Error fetching live events:", err);
    }
  };

  // Start polling
  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchLiveEvents();
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
    fetchLiveEvents(); // Initial fetch
    startPolling(); // Start polling

    return () => {
      stopPolling(); // Cleanup on unmount
    };
  }, [sport]);

  return {
    events,
    loading,
    error,
    refetch: fetchLiveEvents,
    startPolling,
    stopPolling,
  };
};
