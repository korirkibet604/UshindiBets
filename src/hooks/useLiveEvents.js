// hooks/useLiveEvents.js
import { useState, useEffect, useRef, useCallback } from "react";
import { betikaApi } from "../services/betikaApi";
import { normalizeMatches } from "../utils/matchUtils";

const PAGE_SIZE = 50;

export const useLiveEvents = (params = {}, pollInterval = 15000) => {
  const { sort = 1, sport = "null", subTypeId = "1,186,340" } = params;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const intervalRef = useRef();

  const fetchLiveEvents = useCallback(async () => {
    try {
      setError(null);
      const data = await betikaApi.getLiveMatches({ sort, sport, sub_type_id: subTypeId, page: 1, limit: PAGE_SIZE });
      setMatches(normalizeMatches(data?.data || []));
      setHasMore((data?.data || []).length >= PAGE_SIZE);
      setPage(1);
    } catch (e) {
      setError(e.message || "Failed to load live matches");
    } finally {
      setLoading(false);
    }
  }, [sort, sport, subTypeId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await betikaApi.getLiveMatches({ sort, sport, sub_type_id: subTypeId, page: nextPage, limit: PAGE_SIZE });
      const newMatches = normalizeMatches(data?.data || []);
      setMatches((prev) => [...prev, ...newMatches]);
      setHasMore(newMatches.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (e) {
      setError(e.message || "Failed to load more matches");
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, sort, sport, subTypeId]);

  useEffect(() => {
    fetchLiveEvents();
  }, [fetchLiveEvents]);

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;
    intervalRef.current = setInterval(fetchLiveEvents, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [pollInterval, fetchLiveEvents]);

  return { matches, loading, loadingMore, error, refetch: fetchLiveEvents, loadMore, hasMore };
};

export default useLiveEvents;
