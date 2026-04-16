import { useState, useEffect } from "react";
import { useBetikaApi } from "./useBetikaApi";

export const useBetikaGames = () => {
  const { getBetikaAllGames, loading, error } = useBetikaApi();
  const [games, setGames] = useState([]);

  const fetchGames = async () => {
    try {
      const data = await getBetikaAllGames();
      setGames(data?.data || []);
    } catch (err) {
      console.error("Error fetching games:", err);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return { games, loading, error, refetch: fetchGames };
};
