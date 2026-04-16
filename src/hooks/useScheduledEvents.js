// hooks/useScheduledEvents.js
import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const useScheduledEvents = (date, sport = 'football') => {
  const { getScheduledEvents, loading, error } = useBetikaApi();
  const [fixtures, setEvents] = useState([]);

  const fetchScheduledEvents = async () => {
    try {
      const data = await getScheduledEvents(sport, date);
      setEvents(data?.events || []);
    } catch (err) {
      console.error('Error fetching scheduled events:', err);
    }
  };

  useEffect(() => {
    if (date) {
      fetchScheduledEvents();
    }
  }, [date, sport]);

  return { fixtures, loading, error, refetch: fetchScheduledEvents };
};