import { useState, useEffect, useRef, useCallback } from "react";
import { betikaApi } from "../services/betikaApi";

const PAGE_SIZE = 50;

export const useBetikaMatches = (options = {}) => {
  const { sportId, competitionId, category, team, sortId, periodId, pollInterval = 0, auto = true } = options;
  const [matches, setMatches] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef();

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const params = { page: 1, limit: PAGE_SIZE };
      if (sportId) params.sport_id = sportId;
      if (competitionId) params.competition_id = competitionId;
      if (category) params.category = category;
      if (team) params.team = team;
      if (sortId !== undefined && sortId !== null) params.sort_id = sortId;
      if (periodId !== undefined && periodId !== null) params.period_id = periodId;
      const data = await betikaApi.getMatches(params);
      setMatches(data?.data || []);
      setTags(data?.meta?.tags || []);
      setLastUpdate(data?.timestamp || new Date().toISOString());
      setTotal(data?.total || data?.meta?.total || 0);
      setHasMore((data?.data || []).length >= PAGE_SIZE);
      setPage(1);
    } catch (e) {
      setError(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [sportId, competitionId, category, team, sortId, periodId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = { page: nextPage, limit: PAGE_SIZE };
      if (sportId) params.sport_id = sportId;
      if (competitionId) params.competition_id = competitionId;
      if (category) params.category = category;
      if (team) params.team = team;
      if (sortId !== undefined && sortId !== null) params.sort_id = sortId;
      if (periodId !== undefined && periodId !== null) params.period_id = periodId;
      const data = await betikaApi.getMatches(params);
      const newMatches = data?.data || [];
      setMatches((prev) => [...prev, ...newMatches]);
      setHasMore(newMatches.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (e) {
      setError(e.message || "Failed to load more matches");
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, sportId, competitionId, category, team, sortId, periodId]);

  useEffect(() => {
    if (auto) fetchMatches();
  }, [fetchMatches, auto]);

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;
    intervalRef.current = setInterval(fetchMatches, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [pollInterval, fetchMatches]);

  return { matches, tags, loading, loadingMore, error, lastUpdate, refetch: fetchMatches, loadMore, hasMore, total };
};

export default useBetikaMatches;
