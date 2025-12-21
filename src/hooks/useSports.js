import { useState, useEffect } from "react";
import { useSofaScoreApi } from "./useSofaScoreApi";

export const useSports = () => {
  const { getBetikaSports, loading, error } = useSofaScoreApi();
  const [sports, setSports] = useState([]);

  const fetchSports = async () => {
    try {
      const data = await getBetikaSports();
      setSports(data?.data || []);
    } catch (err) {
      console.error("Error fetching sports:", err);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  return { sports, loading, error, refetch: fetchSports };
};
