// Example usage in a React component
import React, { useEffect, useState } from 'react';
import { useOdiBetsApi } from '../../hooks/useOdiBetsApi';

const MatchList = () => {
  const { 
    loading, 
    error, 
    getLiveFootballMatches, 
    getTodayMatches,
    getMatchDetails,
    SPORTS 
  } = useOdiBetsApi();
  
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      // Get live football matches
      const liveData = await getLiveFootballMatches();
      if (liveData?.data) {
        setLiveMatches(liveData.data);
      }

      // Get today's football matches
      const todayData = await getTodayMatches(SPORTS.FOOTBALL);
      if (todayData?.data) {
        setTodayMatches(todayData.data);
      }
    } catch (err) {
      console.error('Failed to load matches:', err);
    }
  };

  const handleMatchClick = async (matchId) => {
    try {
      const matchData = await getMatchDetails(matchId);
      setSelectedMatch(matchData?.data || matchData);
    } catch (err) {
      console.error('Failed to load match details:', err);
    }
  };

  useEffect(() => {
    console.log(todayMatches)
  }, [todayMatches])


  if (loading) return <div>Loading matches...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Live Football Matches</h2>
      <div>
        {liveMatches.map(match => (
          <div key={match.id} onClick={() => handleMatchClick(match.id)}>
            {match.home_team} vs {match.away_team}
          </div>
        ))}
      </div>

      <h2>Today's Matches</h2>
      <div>
        {todayMatches.map(match => (
          <div key={match.id} onClick={() => handleMatchClick(match.id)}>
            {match.home_team} vs {match.away_team} - {match.time}
          </div>
        ))}
      </div>

      {selectedMatch && (
        <div>
          <h3>Match Details</h3>
          <pre>{JSON.stringify(selectedMatch, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default MatchList;