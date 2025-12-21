import './Tournaments.scss';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faCalendarDay,
  faChartLine,
  faFutbol,
  faClock,
  faMapMarkerAlt,
  faFire,
  faCalendarAlt,
  faTimes,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useSofaScoreApi } from '../../hooks/useSofaScoreApi';

export default function Tournaments() {
  const [selectedDate, setSelectedDate] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [betSlip, setBetSlip] = useState([]);
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leagues, setLeagues] = useState(['all']);

  // Fetch matches based on selected date
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        let date;
        const today = new Date();

        switch (selectedDate) {
          case 'today':
            date = today.toISOString().split('T')[0];
            break;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            date = tomorrow.toISOString().split('T')[0];
            break;
          case 'weekend':
            // Get next Saturday
            const nextSaturday = new Date(today);
            nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
            date = nextSaturday.toISOString().split('T')[0];
            break;
          default:
            date = today.toISOString().split('T')[0];
        }

        const response = await useSofaScoreApi.getScheduledEvents('football', date);
        const events = response.data.events || [];

        // Transform API data to match our component structure
        const transformedMatches = events.map(event => ({
          id: event.id,
          league: event.tournament?.name || 'Unknown League',
          country: event.tournament?.category?.name || 'Unknown Country',
          timestamp: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : new Date().toISOString(),
          homeTeam: event.homeTeam?.name || 'Home Team',
          awayTeam: event.awayTeam?.name || 'Away Team',
          homeLogo: event.homeTeam?.shortName?.substring(0, 3) || 'HOM',
          awayLogo: event.awayTeam?.shortName?.substring(0, 3) || 'AWY',
          homeColor: getTeamColor(event.homeTeam?.name),
          awayColor: getTeamColor(event.awayTeam?.name),
          markets: generateMockMarkets(), // SofaScore doesn't provide odds, so we generate mock data
          featured: Math.random() > 0.7 // Randomly feature some matches
        }));

        setMatches(transformedMatches);

        // Extract unique leagues
        const uniqueLeagues = ['all', ...new Set(transformedMatches.map(match => match.league))];
        setLeagues(uniqueLeagues);

      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Failed to load matches. Please try again later.');
        // Fallback to mock data if API fails
        setMatches(getFallbackMatches());
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [selectedDate]);

  // Helper function to generate team colors
  const getTeamColor = (teamName) => {
    const colors = [
      '#DA291C', '#C8102E', '#A50044', '#000000', '#FB090B', '#DC052D', '#FDE100',
      '#00529F', '#6C1D45', '#E2001A', '#EF3340', '#FFCD00', '#241F20', '#ED1C24'
    ];
    if (!teamName) return colors[0];
    const hash = teamName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Generate mock markets since SofaScore doesn't provide odds
  const generateMockMarkets = () => {
    const baseHome = 1.5 + Math.random() * 2;
    const baseDraw = 2.5 + Math.random() * 2;
    const baseAway = 2 + Math.random() * 2;

    return {
      matchResult: {
        home: parseFloat(baseHome.toFixed(2)),
        draw: parseFloat(baseDraw.toFixed(2)),
        away: parseFloat(baseAway.toFixed(2))
      },
      doubleChance: {
        homeDraw: parseFloat((baseHome * 0.7).toFixed(2)),
        awayDraw: parseFloat((baseAway * 0.7).toFixed(2)),
        homeAway: parseFloat(((baseHome + baseAway) * 0.5).toFixed(2))
      },
      overUnder: {
        over25: parseFloat((1.6 + Math.random() * 0.8).toFixed(2)),
        under25: parseFloat((1.8 + Math.random() * 0.8).toFixed(2))
      }
    };
  };

  // Fallback mock data if API fails
  const getFallbackMatches = () => [
    {
      id: 1,
      league: 'Premier League',
      country: 'England',
      timestamp: '2024-01-20T15:00:00',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      homeLogo: 'MUN',
      awayLogo: 'LIV',
      homeColor: '#DA291C',
      awayColor: '#C8102E',
      markets: {
        matchResult: { home: 2.45, draw: 3.20, away: 2.80 },
        doubleChance: { homeDraw: 1.45, awayDraw: 1.60, homeAway: 1.30 },
        overUnder: { over25: 1.85, under25: 1.95 }
      },
      featured: true
    },
    {
      id: 2,
      league: 'La Liga',
      country: 'Spain',
      timestamp: '2024-01-20T17:30:00',
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      homeLogo: 'BAR',
      awayLogo: 'RMA',
      homeColor: '#A50044',
      awayColor: '#FFFFFF',
      markets: {
        matchResult: { home: 2.10, draw: 3.50, away: 3.10 },
        doubleChance: { homeDraw: 1.35, awayDraw: 1.55, homeAway: 1.25 },
        overUnder: { over25: 1.65, under25: 2.20 }
      },
      featured: true
    }
  ];

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.league.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || match.league === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  const addToBetSlip = (match, market, outcome, odds) => {
    const newBet = {
      id: `${match.id}-${market}-${outcome}`,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      market,
      outcome,
      odds,
      stake: 0
    };

    setBetSlip(prev => {
      const existingBet = prev.find(bet => bet.id === newBet.id);
      if (existingBet) {
        return prev.filter(bet => bet.id !== newBet.id);
      }
      return [...prev, newBet];
    });
  };

  const removeFromBetSlip = (betId) => {
    setBetSlip(prev => prev.filter(bet => bet.id !== betId));
  };

  const updateStake = (betId, stake) => {
    setBetSlip(prev => prev.map(bet =>
      bet.id === betId ? { ...bet, stake: parseFloat(stake) || 0 } : bet
    ));
  };

  const getPotentialWin = () => {
    if (betSlip.length === 0) return 0;

    if (betSlip.length === 1) {
      return betSlip[0].stake * betSlip[0].odds;
    }

    // Accumulator calculation
    return betSlip.reduce((total, bet) => total * bet.odds, 1) * Math.min(...betSlip.map(bet => bet.stake));
  };

  if (loading) {
    return (
      <div className="football-betting">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faFutbol} spin size="2x" />
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="football-betting">
        <div className="error-message">
          <FontAwesomeIcon icon={faTimes} size="2x" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="football-betting">
      {/* Header */}
      <div className="betting-header">
        <div className="header-content">
          <FontAwesomeIcon icon={faFutbol} className="header-icon" />
          <div>
            <h1>Football Betting</h1>
            <p>Place your bets on upcoming matches</p>
          </div>
        </div>
        <button
          className={`bet-slip-toggle ${betSlip.length > 0 ? 'has-bets' : ''}`}
          onClick={() => setShowBetSlip(!showBetSlip)}
        >
          Bet Slip ({betSlip.length})
        </button>
      </div>

      {/* Controls */}
      <div className="betting-controls">
        <div className="date-filters">
          {['today', 'tomorrow', 'weekend'].map(date => (
            <button
              key={date}
              className={`date-btn ${selectedDate === date ? 'active' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              <FontAwesomeIcon icon={faCalendarDay} />
              {date.charAt(0).toUpperCase() + date.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-filter">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="league-select"
          >
            {leagues.map(league => (
              <option key={league} value={league}>
                {league === 'all' ? 'All Leagues' : league}
              </option>
            ))}
          </select>

          <button className="filter-btn">
            <FontAwesomeIcon icon={faFilter} />
            Filters
          </button>
        </div>
      </div>

      {/* Featured Matches */}
      {filteredMatches.filter(match => match.featured).length > 0 && (
        <section className="featured-matches">
          <h2><FontAwesomeIcon icon={faFire} /> Featured Matches</h2>
          <div className="matches-grid">
            {filteredMatches.filter(match => match.featured).map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onAddToBetSlip={addToBetSlip}
                betSlip={betSlip}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Matches */}
      <section className="all-matches">
        <h2><FontAwesomeIcon icon={faCalendarAlt} /> All Matches ({filteredMatches.length})</h2>
        <div className="matches-list">
          {filteredMatches.length === 0 ? (
            <div className="no-matches">
              <FontAwesomeIcon icon={faFutbol} size="3x" />
              <p>No matches found for your selection</p>
            </div>
          ) : (
            filteredMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onAddToBetSlip={addToBetSlip}
                betSlip={betSlip}
                compact={true}
              />
            ))
          )}
        </div>
      </section>

      {/* Bet Slip */}
      {showBetSlip && (
        <div className="bet-slip-overlay">
          <div className="bet-slip">
            <div className="bet-slip-header">
              <h3>Bet Slip</h3>
              <button onClick={() => setShowBetSlip(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="bets-list">
              {betSlip.length === 0 ? (
                <div className="empty-slip">
                  <FontAwesomeIcon icon={faFutbol} />
                  <p>No bets added yet</p>
                  <span>Select odds from matches to add to your bet slip</span>
                </div>
              ) : (
                betSlip.map(bet => (
                  <div key={bet.id} className="bet-item">
                    <div className="bet-info">
                      <div className="bet-match">{bet.match}</div>
                      <div className="bet-market">{bet.market} - {bet.outcome}</div>
                      <div className="bet-odds">Odds: {bet.odds}</div>
                    </div>
                    <div className="bet-controls">
                      <input
                        type="number"
                        placeholder="Stake"
                        value={bet.stake}
                        onChange={(e) => updateStake(bet.id, e.target.value)}
                        className="stake-input"
                      />
                      <button
                        onClick={() => removeFromBetSlip(bet.id)}
                        className="remove-bet"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {betSlip.length > 0 && (
              <div className="bet-slip-footer">
                <div className="potential-win">
                  <span>Potential Win:</span>
                  <span className="win-amount">KSH {getPotentialWin().toFixed(2)}</span>
                </div>
                <button className="place-bet-btn">
                  Place Bet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Match Card Component
function MatchCard({ match, onAddToBetSlip, betSlip, compact = false }) {
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  const isInBetSlip = (market, outcome) => {
    return betSlip.some(bet =>
      bet.id === `${match.id}-${market}-${outcome}`
    );
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (compact) {
    return (
      <div className="match-card compact">
        <div className="match-header">
          <div className="league-info">
            <span className="league-name">{match.league}</span>
            <span className="match-time">
              <FontAwesomeIcon icon={faClock} /> {formatTime(match.timestamp)}
            </span>
          </div>
          <div className="date-badge">{formatDate(match.timestamp)}</div>
        </div>

        <div className="teams">
          <div className="team">
            <div
              className="team-logo"
              style={{ backgroundColor: match.homeColor }}
            >
              {match.homeLogo}
            </div>
            <span className="team-name">{match.homeTeam}</span>
          </div>
          <div className="vs">VS</div>
          <div className="team">
            <div
              className="team-logo"
              style={{ backgroundColor: match.awayColor }}
            >
              {match.awayLogo}
            </div>
            <span className="team-name">{match.awayTeam}</span>
          </div>
        </div>

        <div className="quick-markets">
          <div className="market-buttons">
            <button
              className={`odds-btn ${isInBetSlip('1X2', 'Home') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, '1X2', 'Home', match.markets.matchResult.home)}
            >
              <span>1</span>
              <span>{match.markets.matchResult.home}</span>
            </button>
            <button
              className={`odds-btn ${isInBetSlip('1X2', 'Draw') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, '1X2', 'Draw', match.markets.matchResult.draw)}
            >
              <span>X</span>
              <span>{match.markets.matchResult.draw}</span>
            </button>
            <button
              className={`odds-btn ${isInBetSlip('1X2', 'Away') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, '1X2', 'Away', match.markets.matchResult.away)}
            >
              <span>2</span>
              <span>{match.markets.matchResult.away}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="match-card">
      <div className="match-header">
        <div className="league-info">
          <FontAwesomeIcon icon={faFutbol} className="league-icon" />
          <div>
            <span className="league-name">{match.league}</span>
            <span className="match-time">
              <FontAwesomeIcon icon={faClock} /> {formatTime(match.timestamp)} • {formatDate(match.timestamp)}
            </span>
          </div>
        </div>
        {match.featured && <div className="featured-badge">Featured</div>}
      </div>

      <div className="teams">
        <div className="team home-team">
          <div
            className="team-logo"
            style={{ backgroundColor: match.homeColor }}
          >
            {match.homeLogo}
          </div>
          <div className="team-details">
            <span className="team-name">{match.homeTeam}</span>
            <span className="team-form">WWLWD</span>
          </div>
        </div>

        <div className="match-center">
          <div className="vs">VS</div>
          <div className="match-time-mobile">
            {formatTime(match.timestamp)}
          </div>
        </div>

        <div className="team away-team">
          <div
            className="team-logo"
            style={{ backgroundColor: match.awayColor }}
          >
            {match.awayLogo}
          </div>
          <div className="team-details">
            <span className="team-name">{match.awayTeam}</span>
            <span className="team-form">LDWWW</span>
          </div>
        </div>
      </div>

      {/* Main Markets */}
      <div className="markets">
        <div className="market-section">
          <h4><FontAwesomeIcon icon={faChartLine} /> Match Result</h4>
          <div className="odds-grid">
            <button
              className={`odds-btn ${isInBetSlip('1X2', 'Home') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, '1X2', 'Home', match.markets.matchResult.home)}
            >
              <span>1</span>
              <span className="odds">{match.markets.matchResult.home}</span>
            </button>
            <button
              className={`odds-btn ${isInBetSlip('1X2', 'Draw') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, '1X2', 'Draw', match.markets.matchResult.draw)}
            >
              <span>X</span>
              <span className="odds">{match.markets.matchResult.draw}</span>
            </button>
            <button
              className={`odds-btn ${isInBetSlip('1X2', 'Away') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, '1X2', 'Away', match.markets.matchResult.away)}
            >
              <span>2</span>
              <span className="odds">{match.markets.matchResult.away}</span>
            </button>
          </div>
        </div>

        <div className="market-section">
          <h4><FontAwesomeIcon icon={faChartLine} /> Double Chance</h4>
          <div className="odds-grid">
            <button
              className={`odds-btn ${isInBetSlip('Double Chance', '1X') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, 'Double Chance', '1X', match.markets.doubleChance.homeDraw)}
            >
              <span>1X</span>
              <span className="odds">{match.markets.doubleChance.homeDraw}</span>
            </button>
            <button
              className={`odds-btn ${isInBetSlip('Double Chance', '12') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, 'Double Chance', '12', match.markets.doubleChance.homeAway)}
            >
              <span>12</span>
              <span className="odds">{match.markets.doubleChance.homeAway}</span>
            </button>
            <button
              className={`odds-btn ${isInBetSlip('Double Chance', 'X2') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, 'Double Chance', 'X2', match.markets.doubleChance.awayDraw)}
            >
              <span>X2</span>
              <span className="odds">{match.markets.doubleChance.awayDraw}</span>
            </button>
          </div>
        </div>

        <div className="market-section">
          <h4><FontAwesomeIcon icon={faChartLine} /> Over/Under 2.5 Goals</h4>
          <div className="odds-grid">
            <button
              className={`odds-btn ${isInBetSlip('Over/Under', 'Over 2.5') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, 'Over/Under', 'Over 2.5', match.markets.overUnder.over25)}
            >
              <span>Over 2.5</span>
              <span className="odds">{match.markets.overUnder.over25}</span>
            </button>
            <button
              className={`odds-btn ${isInBetSlip('Over/Under', 'Under 2.5') ? 'selected' : ''}`}
              onClick={() => onAddToBetSlip(match, 'Over/Under', 'Under 2.5', match.markets.overUnder.under25)}
            >
              <span>Under 2.5</span>
              <span className="odds">{match.markets.overUnder.under25}</span>
            </button>
          </div>
        </div>

        <button
          className="more-markets-btn"
          onClick={() => setShowAllMarkets(!showAllMarkets)}
        >
          {showAllMarkets ? 'Show Less' : 'More Markets'} <FontAwesomeIcon icon={faChevronRight} />
        </button>

        {showAllMarkets && (
          <div className="additional-markets">
            <div className="market-section">
              <h4>Both Teams to Score</h4>
              <div className="odds-grid">
                <button className="odds-btn">
                  <span>Yes</span>
                  <span className="odds">1.80</span>
                </button>
                <button className="odds-btn">
                  <span>No</span>
                  <span className="odds">1.95</span>
                </button>
              </div>
            </div>

            <div className="market-section">
              <h4>Correct Score</h4>
              <div className="odds-grid compact">
                <button className="odds-btn">
                  <span>1-0</span>
                  <span className="odds">8.50</span>
                </button>
                <button className="odds-btn">
                  <span>2-0</span>
                  <span className="odds">11.00</span>
                </button>
                <button className="odds-btn">
                  <span>2-1</span>
                  <span className="odds">9.50</span>
                </button>
                <button className="odds-btn">
                  <span>More</span>
                  <span className="odds">+</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}