import { useState, useEffect } from "react";
import { useBetikaApi } from "./useBetikaApi";

export const useSports = () => {
  const { getBetikaSports, loading, error } = useBetikaApi();
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
