// hooks/usePlayer.js
import { useState, useEffect } from 'react';
import { useBetikaApi } from './useBetikaApi';

export const usePlayer = (playerId) => {
  const { getPlayerDetails, getPlayerTransferHistory, loading, error } = useBetikaApi();
  const [player, setPlayer] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const fetchPlayerData = async () => {
    if (!playerId) {
      setPlayer(null);
      setTransferHistory([]);
      return;
    }

    try {
      setInternalLoading(true);
      setInternalError(null);

      // Fetch player details
      const playerData = await getPlayerDetails(playerId);
      console.log('Player data received:', playerData); // Debug log
      setPlayer(playerData?.player || playerData || null);

      // Fetch transfer history
      const transfers = await getPlayerTransferHistory(playerId);
      console.log('Transfer data received:', transfers); // Debug log
      setTransferHistory(transfers?.transfers || transfers || []);

    } catch (err) {
      console.error('Error fetching player data:', err);
      setInternalError(err.message);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  return {
    player,
    transferHistory,
    stats,
    loading: internalLoading || loading,
    error: internalError || error,
    refetch: fetchPlayerData
  };
};