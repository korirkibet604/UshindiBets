import { useState, useEffect } from "react";
import { useSofaScoreApi } from "./useSofaScoreApi";

export const useBetikaGames = () => {
  const { getBetikaAllGames, loading, error } = useSofaScoreApi();
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
